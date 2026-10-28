// Sorts a file's lines into blank, comment, test title, import and code, and strips a file
// down to its code. The checker's parse finds the comments and test titles
// (`extractCode`), and the same TypeScript parse gives the import declarations, multi-line
// ones included, which a regex can't tell from the code around them. `splitLines` is the one
// split of a text into lines, so a line's number means the same to the kinds and to the scan
// that pairs them with blame's.

import ts from 'typescript';
import { extractCode, scriptKindOf } from '../check-docs/extract.mts';

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

function cover(fileName: string, text: string): Covered {
  const lines = splitLines(text);
  const comments = lines.map((): Span[] => []);
  const titles = lines.map((): Span[] => []);
  const { segments, markers } = extractCode(fileName, text);

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

/** Zero-based numbers of the lines that hold an import declaration, from its first line to its last. */
function importLines(fileName: string, text: string): Set<number> {
  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKindOf(fileName));
  const found = new Set<number>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) && !ts.isImportEqualsDeclaration(statement)) continue;
    const first = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line;
    const last = sourceFile.getLineAndCharacterOfPosition(statement.getEnd()).line;
    for (let line = first; line <= last; line++) found.add(line);
  }
  return found;
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
  const { lines, comments, titles } = cover(fileName, text);
  const imports = importLines(fileName, text);
  return lines.map((line, i) => {
    if (titles[i].length > 0) return 'title';
    if (line.trim() === '') return 'blank';
    if (comments[i].length > 0 && blankOut(line, comments[i]).trim() === '') return 'comment';
    return imports.has(i) ? 'import' : 'code';
  });
}

/**
 * The file's code: its lines with comments and test titles blanked, whitespace collapsed, and
 * import declarations, empty lines and the lines numbered in `skip` dropped. Two versions of a
 * file that differ only in their comments, test titles and imports strip to the same lines.
 */
export function strippedCode(fileName: string, text: string, skip: ReadonlySet<number> = new Set()): string[] {
  const { lines, comments, titles } = cover(fileName, text);
  const imports = importLines(fileName, text);
  return lines
    .map((line, i) =>
      imports.has(i) || skip.has(i + 1)
        ? ''
        : blankOut(line, [...comments[i], ...titles[i]])
            .replace(/\s+/g, ' ')
            .trim(),
    )
    .filter(line => line !== '');
}
