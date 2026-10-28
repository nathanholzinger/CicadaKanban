import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { makeTestRepo } from './testRepo.mts';

describe('makeTestRepo', () => {
  it('stands an empty global git configuration in for the developer’s while the repository exists, then gives theirs back', () => {
    const before = process.env.GIT_CONFIG_GLOBAL;
    const repo = makeTestRepo('audit-scope-repo-');
    try {
      assert.notEqual(process.env.GIT_CONFIG_GLOBAL, before);
      assert.equal(repo.git('config', '--global', '--list').trim(), '');
    } finally {
      repo.remove();
    }
    assert.equal(process.env.GIT_CONFIG_GLOBAL, before);
    assert.equal(existsSync(repo.root), false);
  });

  it('starts an empty repository on main, with no signing and no line-ending conversion', () => {
    const repo = makeTestRepo('audit-scope-repo-');
    try {
      assert.equal(repo.git('symbolic-ref', '--short', 'HEAD').trim(), 'main');
      assert.equal(repo.git('config', '--get', 'commit.gpgsign').trim(), 'false');
      assert.equal(repo.git('config', '--get', 'core.autocrlf').trim(), 'false');
      assert.equal(repo.git('rev-list', '--all', '--count').trim(), '0');
    } finally {
      repo.remove();
    }
  });
});
