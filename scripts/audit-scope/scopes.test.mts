import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_CONFIG, type ScopeConfig } from './config.mts';
import type { FileScope, RangeScan } from './scan.mts';
import { buildScopes, ranges, renderScope } from './scopes.mts';

const file = (overrides: Partial<FileScope> & Pick<FileScope, 'path'>): FileScope => ({
  group: 'S1',
  isNew: false,
  reading: 'all',
  readWhole: null,
  changed: [],
  moved: new Map(),
  removalSites: [],
  totalLines: 10,
  ...overrides,
});

const scanOf = (
  files: FileScope[],
  deleted: RangeScan['deleted'] = [],
  renamed: RangeScan['renamed'] = [],
): RangeScan => ({ base: 'base', end: 'end', commits: 1, files, movedLines: 0, deleted, renamed });

describe('ranges', () => {
  it('writes consecutive numbers as one range, in order, once each', () => {
    assert.equal(ranges([7, 1, 2, 3, 5, 7]), '1-3, 5, 7');
    assert.equal(ranges([]), '');
  });
});

describe('renderScope', () => {
  it('lists what to read whole, what changed, where code was removed, and the paths that went, and not what moved in', () => {
    const files = [
      file({ path: 'server/src/new.ts', isNew: true, readWhole: 'new file', changed: [1, 2, 3, 7] }),
      file({
        path: 'server/src/kept.ts',
        readWhole: 'marked by the orchestrator',
        changed: [10],
        moved: new Map([['server/src/old.ts', [4, 5, 6, 7]]]),
        removalSites: [20, 30],
      }),
      file({ path: 'server/src/lone.ts', removalSites: [3] }),
    ];
    const extras = {
      deleted: [{ path: 'server/src/gone.ts', group: 'S1' }],
      renamed: [{ oldPath: 'server/src/a.ts', path: 'server/src/b.ts', group: 'S1' }],
    };
    assert.equal(
      renderScope(files, extras),
      [
        '**Read these files whole** (the range may have changed their shape):',
        '- `server/src/new.ts` (new file)',
        '- `server/src/kept.ts` (marked by the orchestrator)',
        '',
        '**Code changed since the last audit:**',
        '- `server/src/new.ts` (new file) (lines 1-3, 7)',
        '- `server/src/kept.ts` (lines 10)',
        '',
        '**Lines removed since the last audit with nothing added in their place** (the line numbers are the lines just above each removal, as the file stands now):',
        '- `server/src/kept.ts` (after lines 20, 30)',
        '- `server/src/lone.ts` (after line 3)',
        '',
        '**Files deleted or renamed since the last audit** (search for what still names them by their old paths):',
        '- `server/src/gone.ts` (deleted)',
        '- `server/src/a.ts` (renamed to `server/src/b.ts`)',
        '',
      ].join('\n'),
    );
  });

  it('leaves out a list with nothing in it', () => {
    const text = renderScope([file({ path: 'server/src/a.ts', changed: [4] })], { deleted: [], renamed: [] });
    assert.equal(text, '**Code changed since the last audit:**\n- `server/src/a.ts` (lines 4)\n');
  });
});

describe('buildScopes', () => {
  const scan = scanOf(
    [
      file({ path: 'server/src/a.ts', readWhole: 'new file', isNew: true, changed: [1] }),
      file({ path: 'server/src/c.ts', reading: 'drift', changed: [2] }),
      file({ path: 'server/src/d.ts', changed: [3] }),
      file({ path: 'tests/x.spec.ts', group: 'E2E', changed: [5] }),
    ],
    [{ path: 'server/src/gone.ts', group: 'S1' }],
    [{ oldPath: 'client/src/old.ts', path: 'client/src/new.ts', group: 'C2' }],
  );
  const built = buildScopes(scan, DEFAULT_CONFIG);
  const scopeOf = (name: string) => built.scopes.find(scope => scope.name === name);
  const pathsIn = (name: string): string[] | undefined => scopeOf(name)?.files.map(f => f.path);

  it('names a scope file for a pass and an instance, and holds its group', () => {
    assert.deepEqual(pathsIn('scope-correctness-S1.md'), ['server/src/a.ts', 'server/src/d.ts']);
    assert.deepEqual(pathsIn('scope-correctness-E2E-T.md'), ['tests/x.spec.ts']);
    assert.deepEqual(pathsIn('scope-duplication-server.md'), ['server/src/a.ts', 'server/src/d.ts']);
  });

  it('gives a file that only the drift pass reads to that pass alone', () => {
    assert.deepEqual(pathsIn('scope-drift-S1.md'), ['server/src/a.ts', 'server/src/c.ts', 'server/src/d.ts']);
    for (const pass of ['correctness', 'duplication', 'fileresp']) {
      const holding = built.scopes.filter(
        scope => scope.pass === pass && scope.files.some(f => f.path === 'server/src/c.ts'),
      );
      assert.deepEqual(holding, [], pass);
    }
  });

  it('gives the file-responsibility pass only the files marked read whole', () => {
    assert.deepEqual(pathsIn('scope-fileresp-server.md'), ['server/src/a.ts']);
    assert.equal(scopeOf('scope-fileresp-E2E-T.md'), undefined);
    assert.ok(built.empty.some(item => item.pass === 'fileresp' && item.instance === 'E2E-T'));
  });

  it('gives the drift pass the deleted and renamed paths, by the group of each', () => {
    assert.match(scopeOf('scope-drift-S1.md')?.text ?? '', /`server\/src\/gone\.ts` \(deleted\)/);
    assert.match(
      scopeOf('scope-drift-C2.md')?.text ?? '',
      /`client\/src\/old\.ts` \(renamed to `client\/src\/new\.ts`\)/,
    );
    assert.equal(scopeOf('scope-correctness-S1.md')?.text.includes('gone.ts'), false);
    assert.deepEqual(pathsIn('scope-drift-C2.md'), []);
  });

  it('finds nothing unassigned when every group has an instance', () => {
    assert.deepEqual(built.unassigned, []);
  });

  it('reports a file a pass should read that no instance of that pass takes', () => {
    const config: ScopeConfig = {
      ...DEFAULT_CONFIG,
      instances: { ...DEFAULT_CONFIG.instances, correctness: { server: ['S1'] } },
    };
    assert.deepEqual(buildScopes(scan, config).unassigned, [{ pass: 'correctness', path: 'tests/x.spec.ts' }]);
  });
});
