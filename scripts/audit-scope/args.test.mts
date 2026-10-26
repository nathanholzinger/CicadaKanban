import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { parseArgs } from './args.mts';

describe('parseArgs', () => {
  it('reads the output directory, with the base, end and config left to their defaults', () => {
    assert.deepEqual(parseArgs(['--out', 'scopes']), {
      out: 'scopes',
      base: null,
      end: 'HEAD',
      config: null,
      repo: null,
    });
  });

  it('reads every option, spaced or with "="', () => {
    assert.deepEqual(parseArgs(['--out=o', '--base', 'a6-audited', '--end=abc123', '--config', 'c.json', '--repo=r']), {
      out: 'o',
      base: 'a6-audited',
      end: 'abc123',
      config: 'c.json',
      repo: 'r',
    });
  });

  it('rejects a missing output directory, a missing value and an unknown option', () => {
    assert.match(errorOf([]), /--out needs a directory/);
    assert.match(errorOf(['--out']), /--out needs a value/);
    assert.match(errorOf(['--out=']), /--out needs a value/);
    assert.match(errorOf(['--out', 'o', '--fix']), /unknown option --fix/);
  });
});

describe('main', () => {
  it('exits 2 on a usage error, before reading any repository', () => {
    const run = spawnSync(process.execPath, [path.join(import.meta.dirname, 'main.mts'), '--base', 'x'], {
      encoding: 'utf8',
    });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /audit-scope: --out needs a directory/);
    assert.equal(run.stdout, '');
  });
});

function errorOf(args: string[]): string {
  const parsed = parseArgs(args);
  assert.ok('error' in parsed, `expected an error for ${args.join(' ')}`);
  return parsed.error;
}
