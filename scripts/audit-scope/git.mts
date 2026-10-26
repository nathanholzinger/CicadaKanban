// Runs git for the scope script. One function takes a command's arguments and returns its
// standard output as text, so a test can hand the rest of the script a throwaway repository,
// and every caller reads git's output the same way: as UTF-8, not the console's code page.

import { execFileSync } from 'node:child_process';

/** Runs `git <args>` and returns its standard output. Throws, with git's message, on a non-zero exit. */
export type Git = (args: readonly string[]) => string;

export function gitIn(cwd: string): Git {
  return args =>
    execFileSync('git', [...args], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 1 << 30,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
}

/** A file's text at a revision; null when the revision has no such file. */
export function showAt(git: Git, rev: string, file: string): string | null {
  try {
    return git(['show', `${rev}:${file}`]);
  } catch {
    return null;
  }
}
