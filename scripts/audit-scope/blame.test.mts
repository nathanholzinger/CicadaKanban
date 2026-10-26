import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseBlame, traceFile, type BlameRange } from './blame.mts';

const IN_RANGE = 'a'.repeat(40);
const OLDER = 'b'.repeat(40);

/** The porcelain for one line: its header, a few of the fields git prints, and the line itself. */
const row = (sha: string, finalLine: number, source: string, content = 'code'): string =>
  [`${sha} 1 ${finalLine} 1`, 'author Someone', `summary a change`, `filename ${source}`, `\t${content}`].join('\n');

describe('parseBlame', () => {
  it('reads the commit, the line number and the source file of each line', () => {
    const porcelain = [row(IN_RANGE, 1, 'a.ts'), row(OLDER, 2, 'other.ts')].join('\n') + '\n';
    assert.deepEqual(parseBlame(porcelain), [
      { line: 1, sha: IN_RANGE, source: 'a.ts' },
      { line: 2, sha: OLDER, source: 'other.ts' },
    ]);
  });

  it('never reads a line of the file as a header', () => {
    const lookalike = `${OLDER} 1 9 1`;
    const porcelain =
      row(IN_RANGE, 1, 'a.ts', lookalike) + '\n' + row(OLDER, 2, 'a.ts', 'filename elsewhere.ts') + '\n';
    assert.deepEqual(
      parseBlame(porcelain).map(r => [r.line, r.sha === IN_RANGE, r.source]),
      [
        [1, true, 'a.ts'],
        [2, false, 'a.ts'],
      ],
    );
  });
});

describe('traceFile', () => {
  function range(plain: string[], traced: string[], calls: string[][] = []): BlameRange {
    return {
      git: args => {
        calls.push([...args]);
        return (args.includes('-C') ? traced : plain).join('\n') + '\n';
      },
      base: 'base',
      end: 'end',
      inRange: new Set([IN_RANGE]),
      ignoreRevs: true,
    };
  }

  it('calls a line changed when tracing puts it in the range', () => {
    const lines = [row(IN_RANGE, 1, 'f.ts'), row(OLDER, 2, 'f.ts')];
    assert.deepEqual(traceFile(range(lines, lines), 'f.ts', ['f.ts']), {
      changed: [1],
      moved: new Map(),
      totalLines: 2,
    });
  });

  it('calls a line moved when plain blame puts it in the range and tracing puts it before, in another file', () => {
    const plain = [row(IN_RANGE, 1, 'f.ts'), row(IN_RANGE, 2, 'f.ts'), row(OLDER, 3, 'f.ts')];
    const traced = [row(OLDER, 1, 'from.ts'), row(OLDER, 2, 'from.ts'), row(OLDER, 3, 'f.ts')];
    assert.deepEqual(traceFile(range(plain, traced), 'f.ts', ['f.ts']), {
      changed: [],
      moved: new Map([['from.ts', [1, 2]]]),
      totalLines: 3,
    });
  });

  it("doesn't count the file's own path, or the path it was renamed from, as another file", () => {
    const plain = [row(IN_RANGE, 1, 'new.ts'), row(IN_RANGE, 2, 'new.ts')];
    const traced = [row(OLDER, 1, 'old.ts'), row(OLDER, 2, 'new.ts')];
    assert.deepEqual(traceFile(range(plain, traced), 'new.ts', ['new.ts', 'old.ts']).moved, new Map());
  });

  it('blames the range twice, ignoring whitespace and the formatting commits, and tracing only the second time', () => {
    const calls: string[][] = [];
    traceFile(range([row(OLDER, 1, 'f.ts')], [row(OLDER, 1, 'f.ts')], calls), 'f.ts', ['f.ts']);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.deepEqual(call.slice(0, 2), ['blame', '-w']);
      assert.ok(call.includes('base..end') && call.at(-1) === 'f.ts');
      assert.deepEqual(call.slice(call.indexOf('--ignore-revs-file'), call.indexOf('--ignore-revs-file') + 2), [
        '--ignore-revs-file',
        '.git-blame-ignore-revs',
      ]);
    }
    assert.ok(!calls[0].includes('-C') && calls[1].join(' ').includes('-M -C -C'));
  });

  it('leaves out the ignore list when the repository has none', () => {
    const calls: string[][] = [];
    traceFile({ ...range([row(OLDER, 1, 'f.ts')], [row(OLDER, 1, 'f.ts')], calls), ignoreRevs: false }, 'f.ts', [
      'f.ts',
    ]);
    assert.ok(calls.every(call => !call.includes('--ignore-revs-file')));
  });
});
