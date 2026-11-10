import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { parseArgs } from './args.mts';

describe('parseArgs', () => {
  it('reads no option as printing to the terminal', () => {
    assert.deepEqual(parseArgs([]), { out: null });
  });

  it('reads the output file, spaced or with "="', () => {
    assert.deepEqual(parseArgs(['--out', 'report.md']), { out: 'report.md' });
    assert.deepEqual(parseArgs(['--out=report.md']), { out: 'report.md' });
  });

  it('rejects a missing value and an unknown option', () => {
    assert.match(errorOf(['--out']), /--out needs a file/);
    assert.match(errorOf(['--out=']), /--out needs a file/);
    assert.match(errorOf(['--out', 'r.md', '--fix']), /unknown option --fix/);
    assert.match(errorOf(['report.md']), /unknown option report.md/);
  });
});

describe('main', () => {
  it('exits 2 on a usage error, before reading anything', () => {
    const run = spawnSync(process.execPath, [path.join(import.meta.dirname, 'main.mts'), '--fix'], {
      encoding: 'utf8',
    });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /report-catalog: unknown option --fix/);
    assert.equal(run.stdout, '');
  });

  it('exits 1 when the report cannot be written', () => {
    const underAFile = path.join(import.meta.filename, 'report.md');
    const run = spawnSync(process.execPath, [path.join(import.meta.dirname, 'main.mts'), '--out', underAFile], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /report-catalog: can't write /);
  });

  it('exits 0 and prints every section of the report for this repository, whatever it finds', () => {
    const run = spawnSync(process.execPath, [path.join(import.meta.dirname, 'main.mts')], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(run.status, 0, run.stderr);
    for (const heading of [
      'Lost coverage',
      'Manual cases a running test carries',
      'Stale Automation lines',
      'Two statuses for one case',
      'Catalog fields not read',
      'Totals',
      'ID-to-files map',
    ]) {
      assert.match(run.stdout, new RegExp(`^## ${heading}$`, 'm'));
    }
  });
});

function errorOf(args: string[]): string {
  const parsed = parseArgs(args);
  assert.ok('error' in parsed, `expected an error for ${args.join(' ')}`);
  return parsed.error;
}
