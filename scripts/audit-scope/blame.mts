// Which lines of a file a range changed, and which it only moved, from `git blame`. A line is
// changed when blame, tracing it across files, attributes it to a commit in the range. Blame
// bounded at the base names the file an older line came from as that file stood at the base,
// so a line that plain blame puts in the range but tracing puts before it, in another file,
// moved there unchanged.

import type { Git } from './git.mts';

export interface BlameRow {
  /** The line's number in the file as it stands at the end of the range. */
  line: number;
  sha: string;
  /** The file the line came from. */
  source: string;
}

const HEADER = /^([0-9a-f]{40,64}) \d+ (\d+)(?: \d+)?$/;

/** The rows of `git blame --line-porcelain`, one per line, in line order. */
export function parseBlame(porcelain: string): BlameRow[] {
  const rows: BlameRow[] = [];
  let sha = '';
  let line = 0;
  let source = '';
  for (const text of porcelain.split('\n')) {
    if (text.startsWith('\t')) {
      rows.push({ line, sha, source });
      continue;
    }
    const header = HEADER.exec(text);
    if (header) {
      sha = header[1];
      line = Number(header[2]);
    } else if (text.startsWith('filename ')) {
      source = text.slice('filename '.length);
    }
  }
  return rows;
}

export interface FileTrace {
  /** Lines new in the range, by number. */
  changed: number[];
  /** Lines moved in unchanged, by number, under the file each came from. */
  moved: Map<string, number[]>;
  totalLines: number;
}

export interface BlameRange {
  git: Git;
  base: string;
  end: string;
  /** The commits in the range. */
  inRange: ReadonlySet<string>;
  /** Whether the repository has a `.git-blame-ignore-revs` to skip. */
  ignoreRevs: boolean;
}

/**
 * Blames `file` twice. The first run is plain, the second follows lines across files
 * (`-M -C -C`); both ignore whitespace and the formatting commits, and both are bounded at
 * the base, since unbounded tracing names whatever file a line lived in long before the
 * range, not the one it left during it. `ownPaths` are the file's path and the path it was
 * renamed from, which don't count as another file.
 */
export function traceFile(range: BlameRange, file: string, ownPaths: readonly string[]): FileTrace {
  const blame = (tracing: readonly string[]): BlameRow[] =>
    parseBlame(
      range.git([
        'blame',
        '-w',
        ...tracing,
        ...(range.ignoreRevs ? ['--ignore-revs-file', '.git-blame-ignore-revs'] : []),
        '--line-porcelain',
        `${range.base}..${range.end}`,
        '--',
        file,
      ]),
    );

  const plain = new Map(blame([]).map(row => [row.line, row.sha]));
  const changed: number[] = [];
  const moved = new Map<string, number[]>();
  for (const { line, sha, source } of blame(['-M', '-C', '-C'])) {
    if (range.inRange.has(sha)) {
      changed.push(line);
    } else if (range.inRange.has(plain.get(line) ?? '') && !ownPaths.includes(source)) {
      const fromSource = moved.get(source);
      if (fromSource) fromSource.push(line);
      else moved.set(source, [line]);
    }
  }
  return { changed, moved, totalLines: plain.size };
}
