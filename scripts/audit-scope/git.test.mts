import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { gitIn, showAt, type Git } from './git.mts';
import { makeTestRepo, type TestRepo } from './testRepo.mts';

describe('showAt', () => {
  let repo: TestRepo;
  let git: Git;

  before(() => {
    repo = makeTestRepo('audit-scope-git-');
    writeFileSync(path.join(repo.root, 'a.txt'), 'one\n');
    repo.git('add', '-A');
    repo.git('commit', '-q', '-m', 'base');
    git = gitIn(repo.root);
  });

  after(() => repo.remove());

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
