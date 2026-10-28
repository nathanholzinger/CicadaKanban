import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { gitIn, showAt, type Git } from './git.mts';

describe('showAt', () => {
  let root: string;
  let git: Git;

  before(() => {
    root = mkdtempSync(path.join(tmpdir(), 'audit-scope-git-'));
    const run = (...args: string[]): void => {
      execFileSync('git', args, { cwd: root });
    };
    run('init', '-q', '-b', 'main');
    for (const [key, value] of [
      ['user.name', 'Test'],
      ['user.email', 'test@example.com'],
      ['commit.gpgsign', 'false'],
    ]) {
      run('config', key, value);
    }
    writeFileSync(path.join(root, 'a.txt'), 'one\n');
    run('add', '-A');
    run('commit', '-q', '-m', 'base');
    git = gitIn(root);
  });

  after(() => rmSync(root, { recursive: true, force: true }));

  it('gives a file’s text at a revision', () => {
    assert.equal(showAt(git, 'HEAD', 'a.txt'), 'one\n');
  });

  it('gives null for a path the revision lacks', () => {
    assert.equal(showAt(git, 'HEAD', 'nowhere.txt'), null);
  });

  it('throws, with git’s message, when git fails for any other reason', () => {
    assert.throws(() => showAt(git, 'no-such-rev', 'a.txt'), /no-such-rev/);
  });
});
