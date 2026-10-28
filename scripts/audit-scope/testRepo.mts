// A throwaway git repository for the scope script's tests. The developer's own global git
// configuration (hooks, `core.autocrlf`, a colored or external diff) must not reach the
// repository or the script, so an empty one stands in for it while the repository exists.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export interface TestRepo {
  root: string;
  /** Runs `git <args>` in the repository and returns its standard output. */
  git: (...args: string[]) => string;
  /** Deletes the repository, and gives the process's global git configuration back. */
  remove: () => void;
}

/** An empty repository on `main`, with an identity, no signing and no line-ending conversion. */
export function makeTestRepo(prefix: string): TestRepo {
  const configDir = mkdtempSync(path.join(tmpdir(), `${prefix}config-`));
  writeFileSync(path.join(configDir, 'gitconfig'), '');
  const globalConfig = process.env.GIT_CONFIG_GLOBAL;
  process.env.GIT_CONFIG_GLOBAL = path.join(configDir, 'gitconfig');

  const root = mkdtempSync(path.join(tmpdir(), prefix));
  const git = (...args: string[]): string => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  for (const [key, value] of [
    ['user.name', 'Test'],
    ['user.email', 'test@example.com'],
    ['commit.gpgsign', 'false'],
    ['core.autocrlf', 'false'],
  ]) {
    git('config', key, value);
  }

  return {
    root,
    git,
    remove: () => {
      rmSync(root, { recursive: true, force: true });
      rmSync(configDir, { recursive: true, force: true });
      if (globalConfig === undefined) delete process.env.GIT_CONFIG_GLOBAL;
      else process.env.GIT_CONFIG_GLOBAL = globalConfig;
    },
  };
}
