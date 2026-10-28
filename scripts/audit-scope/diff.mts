// Reading `git diff` for the scope script: which paths a range changed, and the hunks of one
// file's diff, from which come its removal sites.

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

// What formatting changes in a line's text: its whitespace, quote style, parentheses, commas and
// semicolons. Two texts that fold to the same string differ only in how they are written.
const foldFormatting = (text: string): string => text.replace(/[\s"'(),;]/g, '');

export interface SiteContext {
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
 */
export function removalSites(hunks: readonly Hunk[], { oldLines, newLines, changed }: SiteContext): number[] {
  return hunks.flatMap(hunk => {
    const { removed, added } = touchedLines([hunk]);
    const removedText = removed.map(line => oldLines[line - 1] ?? '');
    if (removedText.every(isBlank) || added.some(line => changed.has(line))) return [];
    const addedText = added.map(line => newLines[line - 1] ?? '');
    if (added.length > 0 && foldFormatting(removedText.join('')) === foldFormatting(addedText.join(''))) return [];
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
