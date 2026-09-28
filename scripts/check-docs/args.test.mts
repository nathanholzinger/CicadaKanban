import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { parseArgs } from './args.mts';

describe('parseArgs', () => {
  it('reads paths alone, with no rule limit', () => {
    assert.deepEqual(parseArgs(['docs/wiki', 'CLAUDE.md']), { rules: null, paths: ['docs/wiki', 'CLAUDE.md'] });
  });

  it('reads a rule list before or after the paths, spaced or with "="', () => {
    const expected = { rules: new Set(['case-id', 'bare-case-id']), paths: ['tests'] };
    assert.deepEqual(parseArgs(['--rules', 'case-id,bare-case-id', 'tests']), expected);
    assert.deepEqual(parseArgs(['tests', '--rules=case-id, bare-case-id']), expected);
  });

  it('joins repeated rule lists', () => {
    assert.deepEqual(parseArgs(['--rules', 'case-id', '--rules', 'bare-case-id']), {
      rules: new Set(['case-id', 'bare-case-id']),
      paths: [],
    });
  });

  it('reads everything after a standalone "--" as a path', () => {
    assert.deepEqual(parseArgs(['--rules', 'case-id', '--', 'docs/test-plans', '--rules']), {
      rules: new Set(['case-id']),
      paths: ['docs/test-plans', '--rules'],
    });
  });

  it('rejects an unknown rule, a missing list and an unknown option', () => {
    assert.match(errorOf(['--rules', 'case-id,no-such-rule']), /unknown rule no-such-rule/);
    assert.match(errorOf(['--rules']), /needs a comma-separated list/);
    assert.match(errorOf(['--rules=']), /needs a comma-separated list/);
    assert.match(errorOf(['--fix']), /unknown option --fix/);
  });
});

describe('main', () => {
  it('exits 2 on a usage error, before checking anything', () => {
    const main = path.join(import.meta.dirname, 'main.mts');
    const run = spawnSync(process.execPath, [main, '--rules', 'no-such-rule'], { encoding: 'utf8' });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /check-docs: unknown rule no-such-rule/);
    assert.equal(run.stdout, '');
  });
});

function errorOf(args: string[]): string {
  const parsed = parseArgs(args);
  assert.ok('error' in parsed, `expected an error for ${args.join(' ')}`);
  return parsed.error;
}
