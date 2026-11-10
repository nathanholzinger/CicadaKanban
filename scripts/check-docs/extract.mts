// Pulls the checkable text out of a file: comments and test titles from code, and every
// line outside a fenced block from Markdown or from a Bruno request's `docs` block. Ignore
// markers come out separately, and are never checked themselves. `testDeclarations` reads
// the same test calls for what they declare, for the catalog report: skips, the `describe`
// around a test, and the ways a computed title can open.

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
/** Members that make a test call a declared skip. `skipIf` is decided at run time, so it isn't one. */
const SKIP_MEMBERS = new Set(['skip', 'fixme', 'todo']);
/** Members that take a title but declare no test: a step, and a hook, which may be titled. */
const NOT_DECLARATIONS = new Set(['step', 'beforeAll', 'beforeEach', 'afterAll', 'afterEach']);
/** The most openings one title expands to, so a title built from many conditionals stays small. */
const MAX_OPENINGS = 32;

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

export function parseScript(fileName: string, text: string): ts.SourceFile {
  return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKindOf(fileName));
}

export function extractCode(fileName: string, text: string): Extracted {
  return extractFromSource(parseScript(fileName, text));
}

/** `extractCode` over a parse the caller made, for one that reads the same parse for more. */
export function extractFromSource(sourceFile: ts.SourceFile): Extracted {
  const text = sourceFile.text;
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

/**
 * A Bruno request's `docs` block, read as Markdown. Every other line is blanked rather than
 * dropped, so a finding keeps the line and column the file has. The block starts at a line
 * that is `docs {` and ends at the next one that is a lone `}`; a brace inside a line of
 * the docs doesn't end it. The rest of the file (URL, body, vars) isn't prose.
 */
export function extractBruno(text: string): Extracted {
  let inDocs = false;
  const kept = text.split('\n').map(raw => {
    const line = raw.replace(/\r$/, '');
    if (!inDocs) {
      inDocs = /^docs\s*\{\s*$/.test(line);
      return '';
    }
    if (/^\}\s*$/.test(line)) {
      inDocs = false;
      return '';
    }
    return line;
  });
  return extractMarkdown(kept.join('\n'));
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
  return calleeParts(callee) !== null;
}

/** The identifier a test callee starts from and the members it passes through, outermost first; null for any other callee. */
function calleeParts(callee: ts.Expression): { root: string; members: string[] } | null {
  const members: string[] = [];
  let node = callee;
  for (;;) {
    if (ts.isPropertyAccessExpression(node)) {
      members.unshift(node.name.text);
      node = node.expression;
    } else if (ts.isCallExpression(node)) {
      node = node.expression;
    } else if (ts.isTaggedTemplateExpression(node)) {
      node = node.tag;
    } else {
      break;
    }
  }
  return ts.isIdentifier(node) && TEST_CALLEES.has(node.text) ? { root: node.text, members } : null;
}

export interface TestDeclaration {
  /**
   * The ways the title can begin. A plain title is its own text. Where the start is computed
   * (`${gap ? 'DRAG-1.1, DRAG-1.2' : 'DRAG-1.1'}: …`), it is one text per branch. Any other
   * substitution stays as written (`${name}`).
   */
  openings: string[];
  /** A `describe`: its title covers every test inside it. */
  group: boolean;
  /** Declared a skip, with `.skip`, `.fixme` or `.todo` on the call. */
  skipped: boolean;
  /** The `describe`s around the call, outermost first. */
  within: TestDeclaration[];
}

/**
 * Every test and `describe` a file declares, with the `describe`s around each. A call is a
 * declaration when it starts from `it`, `test` or `describe` and its first argument is a
 * title: a string, a template, a sum of strings, or a conditional between them. A hook,
 * `test.use` and `test.step` aren't, and neither is a call whose title is a bare name.
 */
export function testDeclarations(sourceFile: ts.SourceFile): TestDeclaration[] {
  const found: TestDeclaration[] = [];
  const visit = (node: ts.Node, within: TestDeclaration[]): void => {
    let inner = within;
    if (ts.isCallExpression(node)) {
      const parts = calleeParts(node.expression);
      const first = node.arguments[0];
      if (parts && first && !parts.members.some(member => NOT_DECLARATIONS.has(member)) && isTitle(first)) {
        const declaration: TestDeclaration = {
          openings: openingsOf(first, sourceFile),
          group: parts.root === 'describe' || parts.members.includes('describe'),
          skipped: parts.members.some(member => SKIP_MEMBERS.has(member)),
          within,
        };
        found.push(declaration);
        if (declaration.group) inner = [...within, declaration];
      }
    }
    ts.forEachChild(node, child => visit(child, inner));
  };
  visit(sourceFile, []);
  return found;
}

function isTitle(expression: ts.Expression): boolean {
  if (ts.isStringLiteralLike(expression) || ts.isTemplateExpression(expression)) return true;
  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)) return isTitle(expression.expression);
  if (ts.isConditionalExpression(expression)) return isTitle(expression.whenTrue) || isTitle(expression.whenFalse);
  return (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.PlusToken &&
    (isTitle(expression.left) || isTitle(expression.right))
  );
}

// What the expression can evaluate to, as far as the source shows it: both branches of a
// conditional, every part of a sum or template. Anything else is left as `${…}`.
function openingsOf(expression: ts.Expression, sourceFile: ts.SourceFile): string[] {
  const join = (left: string[], right: string[]): string[] =>
    [...new Set(left.flatMap(a => right.map(b => a + b)))].slice(0, MAX_OPENINGS);

  if (ts.isStringLiteralLike(expression)) return [expression.text];
  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)) {
    return openingsOf(expression.expression, sourceFile);
  }
  if (ts.isConditionalExpression(expression)) {
    return [
      ...new Set([...openingsOf(expression.whenTrue, sourceFile), ...openingsOf(expression.whenFalse, sourceFile)]),
    ].slice(0, MAX_OPENINGS);
  }
  if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return join(openingsOf(expression.left, sourceFile), openingsOf(expression.right, sourceFile));
  }
  if (ts.isTemplateExpression(expression)) {
    return expression.templateSpans.reduce(
      (sofar, span) => join(join(sofar, openingsOf(span.expression, sourceFile)), [span.literal.text]),
      [expression.head.text],
    );
  }
  return [`\${${expression.getText(sourceFile)}}`];
}
