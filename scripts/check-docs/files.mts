// Which files the checker reads: the default scope, what's never checked, and how
// command-line paths expand. Paths are repo-relative with forward slashes throughout.

import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_SCOPE = [
  'client/src',
  'server/src',
  'server/tests',
  'tests',
  'scripts',
  '.claude',
  'docs/wiki',
  'docs/test-plans',
];

/** Transient docs: plans, audits, and everything archived. */
export const TRANSIENT_DIR = /^docs\/(?:planning|audits|archive)\//;

const NEVER_CHECKED = ['docs/planning', 'docs/audits', 'docs/archive', 'tests/output'];
const SKIPPED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage']);

export function isSkippedDir(rel: string): boolean {
  return rel.split('/').some(part => SKIPPED_DIRS.has(part)) || rel === 'tests/output';
}

export function isNeverChecked(rel: string): boolean {
  return NEVER_CHECKED.some(dir => rel === dir || rel.startsWith(`${dir}/`)) || isSkippedDir(rel);
}

export function isCheckable(rel: string): boolean {
  if (isNeverChecked(rel)) return false;
  if (rel.endsWith('.md')) return true;
  return /\.(?:tsx?|mts)$/.test(rel) && !rel.startsWith('.claude/');
}

export function isCode(rel: string): boolean {
  return !rel.endsWith('.md');
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
      skipped.push(`${arg}: not a Markdown or TypeScript file`);
    }
  }

  return { files: [...files].sort(), skipped, errors };
}
