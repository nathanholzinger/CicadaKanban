// Reading `git diff` for the scope script: which paths a range changed, and the hunks of one
// file's diff, from which come its removal sites and the lines an import-only check looks at.

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

/**
 * Where lines were removed with nothing added in their place: the hunks with no new side. A
 * hunk's start is then the line just above the removal, as the file stands now.
 */
export function removalSites(hunks: readonly Hunk[]): number[] {
  return hunks.filter(hunk => hunk.newCount === 0).map(hunk => hunk.newStart);
}

const span = (start: number, count: number): number[] => Array.from({ length: count }, (_, i) => start + i);

/** The lines a diff touches: those it removes, numbered in the old file, and those it adds, in the new. */
export function touchedLines(hunks: readonly Hunk[]): { removed: number[]; added: number[] } {
  return {
    removed: hunks.flatMap(hunk => span(hunk.oldStart, hunk.oldCount)),
    added: hunks.flatMap(hunk => span(hunk.newStart, hunk.newCount)),
  };
}
