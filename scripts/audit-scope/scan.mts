// Reads a range once and says, for each file in it, what changed: its group, its changed,
// moved and removal-site lines, which passes read it, and whether one reads it whole. The
// files a range deleted or renamed come out apart, under their old paths.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { traceFile, type BlameRange } from './blame.mts';
import { readingOf, readWholeReason, type Reading } from './classify.mts';
import { groupOf, type ScopeConfig } from './config.mts';
import { parseHunks, parseNameStatus, removalSites, touchedLines, type Hunk, type PathChange } from './diff.mts';
import { showAt, type Git } from './git.mts';
import { isFiller, lineKinds } from './lineKinds.mts';
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
  /** Lines moved in unchanged, by the file each came from. No scope lists them. */
  moved: Map<string, number[]>;
  removalSites: number[];
  totalLines: number;
}

export interface RangeScan {
  base: string;
  end: string;
  commits: number;
  /** The files a pass reads. */
  files: FileScope[];
  /** Lines moved in unchanged from another file, across the range, which every scope leaves out. */
  movedLines: number;
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

  // A moved run's source, as it stands at the end, its filler lines left out: under its new
  // name if the range renamed it, and not at all if the range deleted it.
  const renamedTo = new Map(changes.filter(c => c.status === 'R').map(c => [c.oldPath, c.path]));
  const deletedPaths = new Set(changes.filter(c => c.status === 'D').map(c => c.path));
  const sourceCache = new Map<string, string[] | null>();
  const sourceLines = (origin: string): string[] | null => {
    if (!sourceCache.has(origin)) {
      const now = deletedPaths.has(origin) ? null : (renamedTo.get(origin) ?? origin);
      const text = now === null ? null : showAt(git, end, now);
      const kinds = now === null || text === null ? [] : lineKinds(now, text);
      sourceCache.set(origin, text === null ? null : splitLines(text).filter((_, i) => !isFiller(kinds[i])));
    }
    return sourceCache.get(origin) ?? null;
  };

  const scanned = changes
    .filter(change => change.status !== 'D')
    .map(change => scanFile(change, { git, base, end, range, groupFor, marked, sourceLines }));
  const movedLines = scanned.reduce((sum, file) => sum + [...file.moved.values()].flat().length, 0);
  const files = scanned.filter(file => file.reading !== 'none').sort((a, b) => a.path.localeCompare(b.path, 'en'));

  return {
    base,
    end,
    commits: inRange.size,
    files,
    movedLines,
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

const isBlank = (line: string | undefined): boolean => (line ?? '').trim() === '';

/** One file's scope. Its reading is `none` when nothing in it is left to read. */
function scanFile(change: PathChange, ctx: FileContext): FileScope {
  const { git, base, end } = ctx;
  const isNew = change.status === 'A';
  const ownPaths = change.oldPath === null ? [change.path] : [change.path, change.oldPath];
  const newText = showAt(git, end, change.path) ?? '';
  const oldText = isNew ? null : showAt(git, base, change.oldPath ?? change.path);
  const hunks = isNew ? [] : parseHunks(git(['diff', '-U0', '-M', `${base}..${end}`, '--', ...ownPaths]));

  const newLines = splitLines(newText);
  const oldLines = oldText === null ? [] : splitLines(oldText);
  const newKinds = lineKinds(change.path, newText);
  const trace = traceFile(ctx.range, change.path, ownPaths);
  const { changed, moved } = settleMoves(trace.changed, trace.moved, newLines, ctx.sourceLines, line =>
    isFiller(newKinds[line - 1]),
  );
  const movedLines = new Set([...moved.values()].flat());

  // Removed lines whose place only moved code took, blank lines aside: no list names that
  // code, so the removal is a site of its own.
  const onlyMovedIn = (hunk: Hunk): boolean => {
    const { removed, added } = touchedLines([hunk]);
    return (
      removed.some(line => !isBlank(oldLines[line - 1])) &&
      added.some(line => movedLines.has(line)) &&
      added.every(line => movedLines.has(line) || isBlank(newLines[line - 1]))
    );
  };
  const sites = removalSites(hunks, onlyMovedIn);

  const facts = {
    path: change.path,
    isNew,
    changed,
    moved: [...movedLines],
    removalSites: sites,
    oldText,
    newText,
  };
  return {
    path: change.path,
    group: ctx.groupFor(change.path),
    isNew,
    reading: readingOf(facts),
    readWhole: readWholeReason(facts, ctx.marked),
    changed,
    moved,
    removalSites: sites,
    totalLines: trace.totalLines,
  };
}
