// Reads a range once and says, for each file in it, what changed: its group, its changed,
// moved and removal-site lines, which passes read it, and whether one reads it whole. The
// files a range deleted or renamed come out apart, under their old paths.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { traceFile, type BlameRange } from './blame.mts';
import { readingOf, readWholeReason, type Reading } from './classify.mts';
import { groupOf, type ScopeConfig } from './config.mts';
import { parseHunks, parseNameStatus, removalSites, type PathChange } from './diff.mts';
import { showAt, type Git } from './git.mts';
import { settleMoves } from './moves.mts';

/** What a run audits: code, tests and config, not the docs. */
export const INCLUDE = [
  'client',
  'server',
  'tests',
  'scripts',
  'bruno',
  'CLAUDE.md',
  'eslint.config.mjs',
  'package.json',
  'tsconfig.json',
  '.prettierrc',
  '.prettierignore',
  'playwright.config.ts',
];

const isLockfile = (file: string): boolean => path.posix.basename(file) === 'package-lock.json';

export interface FileScope {
  path: string;
  group: string;
  isNew: boolean;
  reading: Reading;
  /** Why a pass reads the file whole; null when it reads the listed lines. */
  readWhole: string | null;
  changed: number[];
  /** Lines moved in unchanged, by the file each came from. */
  moved: Map<string, number[]>;
  removalSites: number[];
  totalLines: number;
}

export interface RangeScan {
  base: string;
  end: string;
  commits: number;
  files: FileScope[];
  /** Paths the range deleted, and paths it renamed, as they were at the base. */
  deleted: { path: string; group: string }[];
  renamed: { oldPath: string; path: string; group: string }[];
}

export interface ScanOptions {
  git: Git;
  /** The repository's root, where the formatting-commits list is looked for. */
  root: string;
  base: string;
  end: string;
  config: ScopeConfig;
}

const splitLines = (text: string): string[] => text.split('\n').map(line => line.replace(/\r$/, ''));

export function scanRange({ git, root, base, end, config }: ScanOptions): RangeScan {
  const inRange = new Set(
    git(['rev-list', `${base}..${end}`])
      .split('\n')
      .filter(line => line !== ''),
  );
  const range: BlameRange = {
    git,
    base,
    end,
    inRange,
    ignoreRevs: existsSync(path.join(root, '.git-blame-ignore-revs')),
  };
  const changes = parseNameStatus(
    git(['diff', '--name-status', '-z', '-M', `${base}..${end}`, '--', ...INCLUDE]),
  ).filter(change => !isLockfile(change.path));
  const groupFor = groupOf(config.groups);
  const marked = new Set(config.readWhole);

  // A moved run's source, as it stands at the end: under its new name if the range renamed it,
  // and not at all if the range deleted it.
  const renamedTo = new Map(changes.filter(c => c.status === 'R').map(c => [c.oldPath, c.path]));
  const deletedPaths = new Set(changes.filter(c => c.status === 'D').map(c => c.path));
  const sourceCache = new Map<string, string[] | null>();
  const sourceLines = (origin: string): string[] | null => {
    if (!sourceCache.has(origin)) {
      const now = deletedPaths.has(origin) ? null : (renamedTo.get(origin) ?? origin);
      const text = now === null ? null : showAt(git, end, now);
      sourceCache.set(origin, text === null ? null : splitLines(text));
    }
    return sourceCache.get(origin) ?? null;
  };

  const files = changes
    .filter(change => change.status !== 'D')
    .map(change => scanFile(change, { git, base, end, range, groupFor, marked, sourceLines }))
    .filter((file): file is FileScope => file !== null)
    .sort((a, b) => a.path.localeCompare(b.path, 'en'));

  return {
    base,
    end,
    commits: inRange.size,
    files,
    deleted: changes.filter(c => c.status === 'D').map(c => ({ path: c.path, group: groupFor(c.path) })),
    renamed: changes
      .filter(c => c.status === 'R')
      .map(c => ({ oldPath: c.oldPath ?? c.path, path: c.path, group: groupFor(c.path) })),
  };
}

interface FileContext {
  git: Git;
  base: string;
  end: string;
  range: BlameRange;
  groupFor: (file: string) => string;
  marked: ReadonlySet<string>;
  sourceLines: (origin: string) => string[] | null;
}

/** One file's scope; null when nothing in it is left to read. */
function scanFile(change: PathChange, ctx: FileContext): FileScope | null {
  const { git, base, end } = ctx;
  const isNew = change.status === 'A';
  const ownPaths = change.oldPath === null ? [change.path] : [change.path, change.oldPath];
  const newText = showAt(git, end, change.path) ?? '';
  const oldText = isNew ? null : showAt(git, base, change.oldPath ?? change.path);
  const hunks = isNew ? [] : parseHunks(git(['diff', '-U0', '-M', `${base}..${end}`, '--', ...ownPaths]));

  const trace = traceFile(ctx.range, change.path, ownPaths);
  const { changed, moved } = settleMoves(trace.changed, trace.moved, splitLines(newText), ctx.sourceLines);
  const sites = removalSites(hunks);

  const facts = {
    path: change.path,
    isNew,
    changed,
    movedIn: moved.size > 0,
    removalSites: sites,
    oldText,
    newText,
    hunks,
  };
  const reading = readingOf(facts);
  if (reading === 'none') return null;
  return {
    path: change.path,
    group: ctx.groupFor(change.path),
    isNew,
    reading,
    readWhole: readWholeReason(facts, ctx.marked),
    changed,
    moved,
    removalSites: sites,
    totalLines: trace.totalLines,
  };
}
