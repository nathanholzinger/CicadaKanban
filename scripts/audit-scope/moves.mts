// Settles which of a file's traced lines count as moved. Moved lines leave the audit: they
// were audited when written, and the gates show a move safe. Two guards keep that narrow. A
// move is a block, so a run with fewer than `MOVE_MIN` lines of code counts as changed: a short
// match is usually braces and imports, and a few scattered lines that match another file are
// edits. Blank lines, comments and test titles neither break a run nor count toward it, so a
// block whose comment was rewritten is still one move. And a copy isn't a move: code the
// source file still holds at the end of the range is new code to the duplication pass, so it
// counts as changed too.

export const MOVE_MIN = 4;

const normalize = (line: string): string => line.trim().replace(/\s+/g, ' ');

/** The numbers split into runs: values with nothing but filler lines between them. */
function runsOf(numbers: readonly number[], isFiller: (line: number) => boolean): number[][] {
  const fillerBetween = (from: number, to: number): boolean => {
    for (let n = from + 1; n < to; n++) if (!isFiller(n)) return false;
    return true;
  };
  const runs: number[][] = [];
  for (const n of [...numbers].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && fillerBetween(last[last.length - 1], n)) last.push(n);
    else runs.push([n]);
  }
  return runs;
}

function contains(haystack: readonly string[], needle: readonly string[]): boolean {
  for (let at = 0; at + needle.length <= haystack.length; at++) {
    if (needle.every((line, i) => haystack[at + i] === line)) return true;
  }
  return false;
}

export interface Settled {
  changed: number[];
  moved: Map<string, number[]>;
}

/**
 * `lines` is the file's text at the end of the range, one entry per line, and `isFiller(n)`
 * says whether its line n is blank, a comment or a test title; by default, whether it's blank.
 * `sourceLines(origin)` gives the file a run came from as it stands at the end, with its
 * filler lines left out, or null if it is gone.
 */
export function settleMoves(
  changed: readonly number[],
  moved: ReadonlyMap<string, readonly number[]>,
  lines: readonly string[],
  sourceLines: (origin: string) => readonly string[] | null,
  isFiller: (line: number) => boolean = line => normalize(lines[line - 1] ?? '') === '',
): Settled {
  const settledChanged = [...changed];
  const settledMoved = new Map<string, number[]>();

  for (const [origin, numbers] of moved) {
    const source =
      sourceLines(origin)
        ?.map(normalize)
        .filter(line => line !== '') ?? null;
    const kept: number[] = [];
    for (const run of runsOf(numbers, isFiller)) {
      const code = run.filter(n => !isFiller(n)).map(n => normalize(lines[n - 1] ?? ''));
      const isCopy = source !== null && contains(source, code);
      if (code.length < MOVE_MIN || isCopy) settledChanged.push(...run);
      else kept.push(...run);
    }
    if (kept.length > 0) settledMoved.set(origin, kept);
  }
  return { changed: settledChanged.sort((a, b) => a - b), moved: settledMoved };
}
