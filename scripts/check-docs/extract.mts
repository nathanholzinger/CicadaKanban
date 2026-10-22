// Pulls the checkable text out of a file: comments and test titles from code, and every
// line outside a fenced block from Markdown. Ignore markers come out separately, and are
// never checked themselves.

import ts from 'typescript';

export type SegmentSource = 'comment' | 'title' | 'markdown';

export interface Segment {
  text: string;
  /** 1-based. */
  line: number;
  /** 1-based column of the segment's first character. */
  col: number;
  source: SegmentSource;
}

export interface IgnoreMarker {
  line: number;
  col: number;
  /** The one line the marker covers: the line after the marker's own last line. */
  targetLine: number;
  rules: string[];
  /** Empty when the marker gives no reason. */
  reason: string;
}

export interface Extracted {
  segments: Segment[];
  markers: IgnoreMarker[];
}

const MARKER = 'check-docs-ignore-next-line';
const TEST_CALLEES = new Set(['it', 'test', 'describe']);

// A block comment's body ends in `*/`. A Markdown marker arrives without its `-->`:
// `extractMarkdown`'s pattern captures only what sits inside the comment.
export function parseMarker(commentBody: string): { rules: string[]; reason: string } | null {
  const at = commentBody.indexOf(MARKER);
  if (at < 0) return null;
  const rest = commentBody.slice(at + MARKER.length).replace(/\*\/\s*$/, '');
  const separator = rest.indexOf(' -- ');
  const rulePart = separator < 0 ? rest : rest.slice(0, separator);
  const reason = separator < 0 ? '' : rest.slice(separator + 4).trim();
  const rules = rulePart
    .split(',')
    .map(rule => rule.trim())
    .filter(rule => rule.length > 0);
  return { rules, reason };
}

export function extractCode(fileName: string, text: string): Extracted {
  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKindOf(fileName));
  const segments: Segment[] = [];
  const markers: IgnoreMarker[] = [];

  for (const range of commentRanges(sourceFile)) {
    const body = text.slice(range.pos, range.end);
    const start = sourceFile.getLineAndCharacterOfPosition(range.pos);
    const end = sourceFile.getLineAndCharacterOfPosition(range.end);
    const marker = parseMarker(body);
    if (marker) {
      markers.push({ line: start.line + 1, col: start.character + 1, targetLine: end.line + 2, ...marker });
      continue;
    }
    body.split('\n').forEach((lineText, i) => {
      segments.push({
        text: lineText.replace(/\r$/, ''),
        line: start.line + 1 + i,
        col: i === 0 ? start.character + 1 : 1,
        source: 'comment',
      });
    });
  }

  segments.push(...testTitles(sourceFile));
  return { segments, markers };
}

export interface MarkdownLine {
  text: string;
  /** 1-based. */
  line: number;
}

/**
 * The lines of Markdown outside a fenced block. A fence closes with the same character, at
 * least as long as the one that opened it, so a longer fence can show a shorter one inside.
 */
export function unfencedLines(text: string): MarkdownLine[] {
  const found: MarkdownLine[] = [];
  let fence: string | null = null;

  text.split('\n').forEach((raw, i) => {
    const line = raw.replace(/\r$/, '');
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence !== null) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
      return;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      return;
    }
    found.push({ text: line, line: i + 1 });
  });

  return found;
}

export function extractMarkdown(text: string): Extracted {
  const segments: Segment[] = [];
  const markers: IgnoreMarker[] = [];

  for (const { text: line, line: lineNumber } of unfencedLines(text)) {
    let visible = line;
    for (const comment of line.matchAll(/<!--([\s\S]*?)-->/g)) {
      const marker = parseMarker(comment[1]);
      if (!marker) continue;
      markers.push({ line: lineNumber, col: comment.index + 1, targetLine: lineNumber + 1, ...marker });
      visible =
        visible.slice(0, comment.index) +
        ' '.repeat(comment[0].length) +
        visible.slice(comment.index + comment[0].length);
    }
    segments.push({ text: visible, line: lineNumber, col: 1, source: 'markdown' });
  }

  return { segments, markers };
}

export function scriptKindOf(fileName: string): ts.ScriptKind {
  if (fileName.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (/\.(?:jsx?|mjs|cjs)$/.test(fileName)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

// Every comment is either leading trivia of the token after it or trailing trivia of the
// token before it, so asking each token for both finds them all. JSX text is not trivia,
// so a "//" inside it is dropped, as is anything nested inside another comment.
function commentRanges(sourceFile: ts.SourceFile): ts.CommentRange[] {
  const text = sourceFile.text;
  const byPos = new Map<number, ts.CommentRange>();
  const jsxTextSpans: [number, number][] = [];
  const add = (ranges: ts.CommentRange[] | undefined): void => {
    for (const range of ranges ?? []) byPos.set(range.pos, range);
  };

  const visit = (node: ts.Node): void => {
    if (node.kind === ts.SyntaxKind.JsxText) {
      jsxTextSpans.push([node.pos, node.end]);
      return;
    }
    if (ts.isJSDoc(node)) return;
    const children = node.getChildren(sourceFile);
    if (children.length === 0) {
      add(ts.getLeadingCommentRanges(text, node.pos));
      add(ts.getTrailingCommentRanges(text, node.end));
      return;
    }
    for (const child of children) visit(child);
  };
  add(ts.getLeadingCommentRanges(text, 0));
  visit(sourceFile);

  const inJsxText = (range: ts.CommentRange): boolean =>
    jsxTextSpans.some(([pos, end]) => range.pos >= pos && range.pos < end);
  const sorted = [...byPos.values()].filter(range => !inJsxText(range)).sort((a, b) => a.pos - b.pos);
  const outermost: ts.CommentRange[] = [];
  let coveredUntil = -1;
  for (const range of sorted) {
    if (range.pos < coveredUntil) continue;
    outermost.push(range);
    coveredUntil = range.end;
  }
  return outermost;
}

function testTitles(sourceFile: ts.SourceFile): Segment[] {
  const titles: Segment[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isTestCallee(node.expression)) {
      const first = node.arguments[0];
      if (first && (ts.isStringLiteralLike(first) || ts.isTemplateExpression(first))) {
        const start = sourceFile.getLineAndCharacterOfPosition(first.getStart(sourceFile) + 1);
        titles.push({
          text: first.getText(sourceFile).slice(1, -1),
          line: start.line + 1,
          col: start.character + 1,
          source: 'title',
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return titles;
}

// Whether the callee starts from `it`, `test` or `describe`: through a member (`test.skip`),
// and through the call or tagged template that makes the title call a second one
// (`it.each(table)('title', fn)`, ``it.each`a | b`('title', fn)``).
function isTestCallee(callee: ts.Expression): boolean {
  if (ts.isPropertyAccessExpression(callee) || ts.isCallExpression(callee)) return isTestCallee(callee.expression);
  if (ts.isTaggedTemplateExpression(callee)) return isTestCallee(callee.tag);
  return ts.isIdentifier(callee) && TEST_CALLEES.has(callee.text);
}
