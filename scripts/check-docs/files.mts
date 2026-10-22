// Which files the checker reads, and how it tells paths apart: the default scope, what's
// never checked, how command-line paths expand, and the classifiers the other modules
// share (code, Markdown or a Bruno request, the transient folders, the wiki and the test
// plans, where a relative link points), with `walkFiles`. Paths are repo-relative with
// forward slashes throughout.

import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export const WIKI_DIR = 'docs/wiki';
export const TEST_PLANS_DIR = 'docs/test-plans';
export const BRUNO_DIR = 'bruno';

export const DEFAULT_SCOPE = [
  'client/src',
  'server/src',
  'server/tests',
  'tests',
  'scripts',
  BRUNO_DIR,
  '.claude',
  WIKI_DIR,
  TEST_PLANS_DIR,
];

/** The folders under `docs/` of transient docs: plans, audits, and everything archived. */
export const TRANSIENT_FOLDERS = ['planning', 'audits', 'archive'] as const;
export const TRANSIENT_DIR = new RegExp(`^docs/(?:${TRANSIENT_FOLDERS.join('|')})/`);

const NEVER_CHECKED = [...TRANSIENT_FOLDERS.map(folder => `docs/${folder}`), 'tests/output'];
const SKIPPED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage']);

export function isSkippedDir(rel: string): boolean {
  return rel.split('/').some(part => SKIPPED_DIRS.has(part)) || rel === 'tests/output';
}

export function isNeverChecked(rel: string): boolean {
  return NEVER_CHECKED.some(dir => rel === dir || rel.startsWith(`${dir}/`)) || isSkippedDir(rel);
}

export function isCheckable(rel: string): boolean {
  if (isNeverChecked(rel)) return false;
  if (rel.endsWith('.md') || isBruno(rel)) return true;
  return /\.(?:tsx?|mts)$/.test(rel) && !rel.startsWith('.claude/');
}

/** A Bruno request or environment file; only a request's `docs` block is read. */
export const isBruno = (rel: string): boolean => rel.startsWith(`${BRUNO_DIR}/`) && rel.endsWith('.bru');

export function isCode(rel: string): boolean {
  return !rel.endsWith('.md') && !isBruno(rel);
}

export const isInWiki = (rel: string): boolean => rel.startsWith(`${WIKI_DIR}/`);
export const isInTestPlans = (rel: string): boolean => rel.startsWith(`${TEST_PLANS_DIR}/`);

/** A test-plan suite: every Markdown file under the test plans but the README and INDEX files. */
export function isSuiteFile(rel: string): boolean {
  return isInTestPlans(rel) && rel.endsWith('.md') && !/(?:^|\/)(?:README|INDEX)\.md$/.test(rel);
}

const WIKI_PAGE_PATH = new RegExp(`^${WIKI_DIR}/([^/]+)(?:/(README\\.md)?)?$`);

/** The page a wiki path names, a page's folder or its README; null for any other path. */
export function wikiPageAt(rel: string): string | null {
  return WIKI_PAGE_PATH.exec(rel)?.[1] ?? null;
}

/** The page a file is the README of; null for any other file. */
export function wikiPageOfReadme(rel: string): string | null {
  const match = WIKI_PAGE_PATH.exec(rel);
  return match?.[2] ? match[1] : null;
}

/** Where a relative link in `fromPath` points, without its anchor; null for a URL or a bare anchor. */
export function resolveLink(fromPath: string, target: string): string | null {
  if (/^[a-z]+:/i.test(target) || target.startsWith('#')) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), target.split('#')[0]));
}

/** Every file under `startRel` (the repo root when empty), skipping directories `skip` names. */
export function walkFiles(root: string, startRel: string, skip: (rel: string) => boolean): string[] {
  const files: string[] = [];
  const visit = (dirRel: string): void => {
    for (const entry of readdirSync(path.join(root, dirRel), { withFileTypes: true })) {
      const rel = dirRel === '' ? entry.name : `${dirRel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!skip(rel)) visit(rel);
      } else if (entry.isFile()) {
        files.push(rel);
      }
    }
  };
  visit(startRel);
  return files;
}

export function defaultFiles(root: string): string[] {
  const scoped = DEFAULT_SCOPE.filter(dir => existsSync(path.join(root, dir))).flatMap(dir =>
    walkFiles(root, dir, isNeverChecked),
  );
  const claudeFiles = walkFiles(root, '', isNeverChecked).filter(
    rel => rel === 'CLAUDE.md' || rel.endsWith('/CLAUDE.md'),
  );
  return [...new Set([...scoped, ...claudeFiles])].filter(isCheckable).sort();
}

export interface Expansion {
  files: string[];
  /** Paths given on the command line that aren't checked, with the reason. */
  skipped: string[];
  errors: string[];
}

export function expandArgs(root: string, cwd: string, args: string[]): Expansion {
  const files = new Set<string>();
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const arg of args) {
    const abs = path.resolve(cwd, arg);
    const rel = path.relative(root, abs).split(path.sep).join('/');
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      errors.push(`${arg}: outside the repository`);
    } else if (!existsSync(abs)) {
      errors.push(`${arg}: no such file or directory`);
    } else if (isNeverChecked(rel)) {
      skipped.push(`${arg}: never checked (transient or generated)`);
    } else if (statSync(abs).isDirectory()) {
      for (const file of walkFiles(root, rel, isNeverChecked)) if (isCheckable(file)) files.add(file);
    } else if (isCheckable(rel)) {
      files.add(rel);
    } else {
      skipped.push(`${arg}: not a Markdown, TypeScript or Bruno file`);
    }
  }

  return { files: [...files].sort(), skipped, errors };
}
