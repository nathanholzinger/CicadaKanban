// Reading `git diff` for the scope script: which paths a range changed, and the hunks of one
// file's diff, from which come its removal sites.

import ts from 'typescript';
import { isScriptFile, templateLines } from './lineKinds.mts';

const { SyntaxKind } = ts;

export type ChangeStatus = 'A' | 'M' | 'R' | 'D';

export interface PathChange {
  status: ChangeStatus;
  path: string;
  /** The path at the base, for a rename. */
  oldPath: string | null;
}

/**
 * The output of `git diff --name-status -z -M`: a status, then one path (two for a rename),
 * each ended by a NUL. A type change reads as a modification.
 */
export function parseNameStatus(output: string): PathChange[] {
  const tokens = output.split('\0');
  const changes: PathChange[] = [];
  for (let i = 0; i < tokens.length && tokens[i] !== '';) {
    const letter = tokens[i][0];
    if (letter === 'R') {
      changes.push({ status: 'R', oldPath: tokens[i + 1], path: tokens[i + 2] });
      i += 3;
    } else {
      const status: ChangeStatus = letter === 'A' || letter === 'D' ? letter : 'M';
      changes.push({ status, path: tokens[i + 1], oldPath: null });
      i += 2;
    }
  }
  return changes;
}

export interface Hunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
}

const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm;

/** The hunks of a diff, from their headers. A count a header leaves out is 1. */
export function parseHunks(diff: string): Hunk[] {
  return [...diff.matchAll(HUNK_HEADER)].map(match => ({
    oldStart: Number(match[1]),
    oldCount: match[2] === undefined ? 1 : Number(match[2]),
    newStart: Number(match[3]),
    newCount: match[4] === undefined ? 1 : Number(match[4]),
  }));
}

const span = (start: number, count: number): number[] => Array.from({ length: count }, (_, i) => start + i);

const isBlank = (line: string | undefined): boolean => (line ?? '').trim() === '';

// What formatting changes in a text: its whitespace, quote style, parentheses, commas and
// semicolons. Two texts that fold to the same string differ only in how they are written.
const foldFormatting = (text: string): string => text.replace(/[\s"'(),;]/g, '');

// The tokens a formatter adds and takes away, which the fold of code leaves out.
const FORMATTING_TOKENS = new Set<ts.SyntaxKind>([
  SyntaxKind.OpenParenToken,
  SyntaxKind.CloseParenToken,
  SyntaxKind.CommaToken,
  SyntaxKind.SemicolonToken,
]);

// The tokens that end a value, after which a `/` divides. After any other token, an operator, an
// opening bracket or a keyword such as `return`, it starts a regular expression.
const ENDS_A_VALUE = new Set<ts.SyntaxKind>([
  SyntaxKind.Identifier,
  SyntaxKind.PrivateIdentifier,
  SyntaxKind.NumericLiteral,
  SyntaxKind.BigIntLiteral,
  SyntaxKind.StringLiteral,
  SyntaxKind.NoSubstitutionTemplateLiteral,
  SyntaxKind.TemplateTail,
  SyntaxKind.RegularExpressionLiteral,
  SyntaxKind.CloseParenToken,
  SyntaxKind.CloseBracketToken,
  SyntaxKind.CloseBraceToken,
  SyntaxKind.PlusPlusToken,
  SyntaxKind.MinusMinusToken,
  SyntaxKind.ThisKeyword,
  SyntaxKind.SuperKeyword,
  SyntaxKind.TrueKeyword,
  SyntaxKind.FalseKeyword,
  SyntaxKind.NullKeyword,
]);

const endsAValue = (kind: ts.SyntaxKind | undefined): boolean =>
  kind !== undefined &&
  (ENDS_A_VALUE.has(kind) ||
    // A contextual keyword (`type`, `of`, `async`) is a name wherever it is not used as one.
    (kind >= SyntaxKind.FirstKeyword &&
      kind <= SyntaxKind.LastKeyword &&
      (kind < SyntaxKind.FirstReservedWord || kind > SyntaxKind.LastReservedWord)));

/**
 * A script's tokens, less the parentheses, commas and semicolons a formatter moves. A string
 * compares by its value, so a `"` against a `'` is the same token, and a space inside one is not
 * left out. A template or a regular expression compares by its exact text.
 */
function codeTokens(text: string): string[] {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, text);
  const tokens: string[] = [];
  // The braces and templates still open, so a `}` that closes a substitution is read as the rest of its template.
  const open: Array<'block' | 'template'> = [];
  let previous: ts.SyntaxKind | undefined;
  for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    if (kind === SyntaxKind.CloseBraceToken && open.at(-1) === 'template') {
      kind = scanner.reScanTemplateToken(false);
    } else if ((kind === SyntaxKind.SlashToken || kind === SyntaxKind.SlashEqualsToken) && !endsAValue(previous)) {
      kind = scanner.reScanSlashToken();
    }
    if (kind === SyntaxKind.OpenBraceToken) open.push('block');
    else if (kind === SyntaxKind.TemplateHead) open.push('template');
    else if (kind === SyntaxKind.CloseBraceToken || kind === SyntaxKind.TemplateTail) open.pop();
    previous = kind;
    if (FORMATTING_TOKENS.has(kind)) continue;
    tokens.push(kind === SyntaxKind.StringLiteral ? JSON.stringify(scanner.getTokenValue()) : scanner.getTokenText());
  }
  return tokens;
}

/**
 * Whether two texts differ only in how they are written. A script is compared by its tokens, so
 * a change inside a string, a template or a regular expression is a change. Any other file has
 * no literals to tell apart, and its text is folded whole.
 */
function writtenAlike(path: string, before: string, after: string): boolean {
  if (!isScriptFile(path)) return foldFormatting(before) === foldFormatting(after);
  const [a, b] = [codeTokens(before), codeTokens(after)];
  return a.length === b.length && a.every((token, i) => token === b[i]);
}

export interface SiteContext {
  /** The file's path, which says how its text is read. */
  path: string;
  /** The file at the base and at the end, one entry per line, the first at index 0. */
  oldLines: readonly string[];
  newLines: readonly string[];
  /** The lines (numbered at the end) that a scope lists as changed, moved code left out. */
  changed: ReadonlySet<number>;
}

/**
 * Where code was removed and nothing a scope lists was written in its place, at the line just
 * above each removal, as the file stands now. A hunk is one when it removes a line that isn't
 * blank and none of the lines it adds is changed: it adds nothing, or only moved code, or lines
 * that blame, which ignores whitespace and the formatting commits, puts before the range. A
 * hunk that only re-writes its lines (the same text, formatted another way) removes nothing.
 *
 * A line inside a template literal is its value, so a hunk that removes one, blank or not, or
 * adds one is never only formatting, whatever its lines read as alone: the script keeps the site
 * when it can't tell.
 */
export function removalSites(hunks: readonly Hunk[], { path, oldLines, newLines, changed }: SiteContext): number[] {
  // Each side read from its whole file, and only when a hunk reaches a decision that needs it.
  const isScript = isScriptFile(path);
  const lazy = <T,>(read: () => T): (() => T) => {
    let value: T | undefined;
    return () => (value ??= read());
  };
  const oldTemplates = lazy(() => templateLines(path, oldLines.join('\n')));
  const newTemplates = lazy(() => templateLines(path, newLines.join('\n')));

  return hunks.flatMap(hunk => {
    const { removed, added } = touchedLines([hunk]);
    if (added.some(line => changed.has(line))) return [];
    const removesValue = (): boolean => isScript && removed.some(line => oldTemplates().has(line));
    const addsValue = (): boolean => isScript && added.some(line => newTemplates().has(line));
    const removedText = removed.map(line => oldLines[line - 1] ?? '');
    if (removedText.every(isBlank) && !removesValue()) return [];
    const addedText = added.map(line => newLines[line - 1] ?? '');
    const formatting = added.length > 0 && writtenAlike(path, removedText.join('\n'), addedText.join('\n'));
    if (formatting && !removesValue() && !addsValue()) return [];
    return [hunk.newCount === 0 ? hunk.newStart : hunk.newStart - 1];
  });
}

/** The lines a diff touches: those it removes, numbered in the old file, and those it adds, in the new. */
export function touchedLines(hunks: readonly Hunk[]): { removed: number[]; added: number[] } {
  return {
    removed: hunks.flatMap(hunk => span(hunk.oldStart, hunk.oldCount)),
    added: hunks.flatMap(hunk => span(hunk.newStart, hunk.newCount)),
  };
}
