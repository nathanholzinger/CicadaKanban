// Settles which of a file's traced lines count as moved. Moved lines leave the audit: they
// were audited when written, and the gates show a move safe. Two guards keep that narrow. A
// short match is usually braces and imports, so fewer than `MOVE_MIN` lines from one source
// count as changed. And a copy isn't a move: lines the source file still holds at the end of
// the range are new code to the duplication pass, so they count as changed too.

export const MOVE_MIN = 4;

const normalize = (line: string): string => line.trim().replace(/\s+/g, ' ');

/** The numbers split into runs of consecutive values. */
function runsOf(numbers: readonly number[]): number[][] {
  const runs: number[][] = [];
  for (const n of [...numbers].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === n - 1) last.push(n);
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
 * `lines` is the file's text at the end of the range, one entry per line. `sourceLines(origin)`
 * gives the file a run came from as it stands at the end, or null if it is gone.
 */
export function settleMoves(
  changed: readonly number[],
  moved: ReadonlyMap<string, readonly number[]>,
  lines: readonly string[],
  sourceLines: (origin: string) => readonly string[] | null,
): Settled {
  const settledChanged = [...changed];
  const settledMoved = new Map<string, number[]>();

  for (const [origin, numbers] of moved) {
    if (numbers.length < MOVE_MIN) {
      settledChanged.push(...numbers);
      continue;
    }
    const source = sourceLines(origin)?.map(normalize) ?? null;
    const kept: number[] = [];
    for (const run of runsOf(numbers)) {
      const isCopy =
        source !== null &&
        run.length >= MOVE_MIN &&
        contains(
          source,
          run.map(n => normalize(lines[n - 1] ?? '')),
        );
      if (isCopy) settledChanged.push(...run);
      else kept.push(...run);
    }
    if (kept.length >= MOVE_MIN) settledMoved.set(origin, kept);
    else settledChanged.push(...kept);
  }
  return { changed: settledChanged.sort((a, b) => a - b), moved: settledMoved };
}
