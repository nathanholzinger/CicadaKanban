// Sorts a file's lines into blank, comment, test title, import and code, and strips a file
// down to its code. One TypeScript parse of the text gives all of it: the checker's reading of the
// comments and test titles (`extractFromSource`), the import declarations, multi-line ones
// included, which a regex can't tell from the code around them, and the text of the strings,
// regular expressions and templates, whose spaces are a value. `splitLines` is the one split of a
// text into lines, and every line number here counts from 1, so a line's number means the same to
// the kinds, to the scan that pairs them with blame's, and to the diff.

import ts from 'typescript';
import { extractFromSource, parseScript } from '../check-docs/extract.mts';

export type LineKind = 'blank' | 'comment' | 'title' | 'import' | 'code';

/** A text's lines, the carriage return at the end of each dropped. The first line is at index 0. */
export const splitLines = (text: string): string[] => text.split('\n').map(line => line.replace(/\r$/, ''));

/** A line that doesn't say whether code moved: blank, a comment or a test title. */
export const isFiller = (kind: LineKind | undefined): boolean =>
  kind === undefined || kind === 'blank' || kind === 'comment' || kind === 'title';

/** A file the TypeScript parse reads. Anything else has no comments or imports to tell apart. */
export const isScriptFile = (file: string): boolean => /\.(?:[cm]?[jt]s|[jt]sx)$/.test(file);

type Span = [start: number, end: number];

interface Covered {
  lines: string[];
  /** Per line, the character spans taken up by comments, an ignore marker included. */
  comments: Span[][];
  /** Per line, the spans of test-title text. */
  titles: Span[][];
}

function cover(sourceFile: ts.SourceFile): Covered {
  const lines = splitLines(sourceFile.text);
  const comments = lines.map((): Span[] => []);
  const titles = lines.map((): Span[] => []);
  const { segments, markers } = extractFromSource(sourceFile);

  for (const segment of segments) {
    if (segment.source === 'markdown') continue;
    const into = segment.source === 'comment' ? comments : titles;
    segment.text.split('\n').forEach((part, i) => {
      const column = (i === 0 ? segment.col : 1) - 1;
      into[segment.line - 1 + i]?.push([column, column + part.length]);
    });
  }
  // A marker is a comment `extractCode` reports apart from its segments: from its own start
  // through the last line it ends on, the line before the one it covers.
  for (const marker of markers) {
    for (let line = marker.line; line < marker.targetLine; line++) {
      comments[line - 1]?.push([line === marker.line ? marker.col - 1 : 0, lines[line - 1].length]);
    }
  }
  return { lines, comments, titles };
}

function blankOut(line: string, spans: readonly Span[]): string {
  const chars = line.split('');
  for (const [start, end] of spans) {
    for (let i = start; i < Math.min(end, chars.length); i++) chars[i] = ' ';
  }
  return chars.join('');
}

/** The numbers of the lines that hold an import declaration, from its first line to its last. */
function importLines(sourceFile: ts.SourceFile): Set<number> {
  const found = new Set<number>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isImportEqualsDeclaration(statement)) continue;
    const first = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line;
    const last = sourceFile.getLineAndCharacterOfPosition(statement.getEnd()).line;
    addLines(found, first, last);
  }
  return found;
}

/**
 * The lines of a script that are the text of a template literal: each line a piece of one
 * reaches after the line it starts on, and the line a piece that continues a substitution starts
 * on, when the template opened on an earlier line. Read from the whole file, since a line of it
 * alone can't say: it carries no backtick, and its words read as code. Such a line is the
 * literal's value, down to its spaces.
 */
export function templateLines(fileName: string, text: string): Set<number> {
  return templateBodyLines(parseScript(fileName, text));
}

function templateBodyLines(sourceFile: ts.SourceFile): Set<number> {
  const lineOf = (pos: number): number => sourceFile.getLineAndCharacterOfPosition(pos).line;
  const found = new Set<number>();
  const visit = (node: ts.Node): void => {
    if (ts.isTemplateHead(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      addLines(found, lineOf(node.getStart(sourceFile)) + 1, lineOf(node.getEnd() - 1));
    } else if (ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      // A piece's parent is its span, and the span's is the whole template.
      const opened = lineOf(node.parent.parent.getStart(sourceFile));
      const first = lineOf(node.getStart(sourceFile));
      addLines(found, first > opened ? first : first + 1, lineOf(node.getEnd() - 1));
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

/** Adds the lines from `from` to `to`, both counted from 0, as numbers counted from 1. */
function addLines(into: Set<number>, from: number, to: number): void {
  for (let line = from; line <= to; line++) into.add(line + 1);
}

/**
 * Per line, the character spans that are a value rather than code: a string, a regular
 * expression, and the text of a template from its backtick (or the `}` that resumes it) to its end,
 * on every line it reaches. A space inside one is part of what the code means, where a space
 * between tokens is formatting.
 */
function valueSpans(sourceFile: ts.SourceFile, lineCount: number): Span[][] {
  const spans = Array.from({ length: lineCount }, (): Span[] => []);
  const visit = (node: ts.Node): void => {
    if (
      ts.isStringLiteral(node) ||
      ts.isRegularExpressionLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
      for (let line = start.line; line <= end.line; line++) {
        spans[line]?.push([line === start.line ? start.character : 0, line === end.line ? end.character : Infinity]);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return spans;
}

/**
 * A line with its `blanked` spans (comments, test titles) taken out and its whitespace collapsed
 * to one space and trimmed, except inside the `values` spans, which keep it exactly. A blanked
 * span wins over a value one: a test title is a string, and is not code.
 */
function collapseOutside(line: string, blanked: readonly Span[], values: readonly Span[]): string {
  const within = (spans: readonly Span[], at: number): boolean => spans.some(([start, end]) => at >= start && at < end);
  const kept: Array<{ char: string; soft: boolean }> = [];
  for (let at = 0; at < line.length; at++) {
    const soft = within(blanked, at) || (!within(values, at) && /\s/.test(line[at]));
    if (!soft) kept.push({ char: line[at], soft: false });
    else if (kept.at(-1)?.soft !== true) kept.push({ char: ' ', soft: true });
  }
  // Runs of soft whitespace are one entry, so at most one is at either end.
  if (kept.at(-1)?.soft) kept.pop();
  if (kept[0]?.soft) kept.shift();
  return kept.map(({ char }) => char).join('');
}

/**
 * The kind of each line, the first line at index 0. A line that holds a test title is a title
 * line, whatever else is on it. A Markdown file is prose throughout, and any other file that
 * isn't script is code.
 */
export function lineKinds(fileName: string, text: string): LineKind[] {
  if (!isScriptFile(fileName)) {
    const kind = fileName.endsWith('.md') ? 'comment' : 'code';
    return splitLines(text).map(line => (line.trim() === '' ? 'blank' : kind));
  }
  const sourceFile = parseScript(fileName, text);
  const { lines, comments, titles } = cover(sourceFile);
  const imports = importLines(sourceFile);
  return lines.map((line, i) => {
    if (titles[i].length > 0) return 'title';
    if (line.trim() === '') return 'blank';
    if (comments[i].length > 0 && blankOut(line, comments[i]).trim() === '') return 'comment';
    return imports.has(i + 1) ? 'import' : 'code';
  });
}

/**
 * The file's code: its lines with comments and test titles blanked, whitespace between tokens
 * collapsed, and import declarations, empty lines and the lines numbered in `skip` dropped. Two
 * versions of a file that differ only in their comments, test titles and imports strip to the
 * same lines. A string, a regular expression and the text of a template are values, so their
 * spaces stay as they are, on a line of their own or in the middle of one. A template that spans
 * lines is kept line by line, blank lines included, from its backtick on (a test title is still a
 * title).
 */
export function strippedCode(fileName: string, text: string, skip: ReadonlySet<number> = new Set()): string[] {
  const sourceFile = parseScript(fileName, text);
  const { lines, comments, titles } = cover(sourceFile);
  const imports = importLines(sourceFile);
  const isScript = isScriptFile(fileName);
  const templates = isScript ? templateBodyLines(sourceFile) : new Set<number>();
  const values = isScript ? valueSpans(sourceFile, lines.length) : lines.map((): Span[] => []);
  return lines
    .map((line, i) => {
      if (imports.has(i + 1) || skip.has(i + 1)) return '';
      const code = collapseOutside(line, [...comments[i], ...titles[i]], values[i]);
      // Quoted, so a blank line of a template is a line of its own, not one the filter below drops.
      return templates.has(i + 1) && titles[i].length === 0 ? JSON.stringify(code) : code;
    })
    .filter(line => line !== '');
}
