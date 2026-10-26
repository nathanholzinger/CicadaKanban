import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_CONFIG, groupOf, parseConfig, specTakes } from './config.mts';

describe('the default groups', () => {
  const groupFor = groupOf(DEFAULT_CONFIG.groups);

  it('sort the repository into the seven area groups', () => {
    const expected: [string, string][] = [
      ['server/src/lib/itemTree.ts', 'S1'],
      ['server/drizzle/0001_start.sql', 'S1'],
      ['CLAUDE.md', 'S1'],
      ['server/tests/routes/items.test.ts', 'S1t'],
      ['tests/ui/boards.spec.ts', 'E2E'],
      ['client/src/components/workflow/dragStructure.ts', 'C1'],
      ['client/src/components/workflow/CLAUDE.md', 'C1'],
      ['client/src/components/KanbanCard.tsx', 'C1'],
      ['client/src/components/workflow/dragStructure.test.ts', 'C1t'],
      ['client/src/components/KanbanCard.test.tsx', 'C1t'],
      ['client/src/test/itemFixture.ts', 'C1t'],
      ['client/src/components/ItemDetailPanel.tsx', 'C2'],
      ['client/src/lib/hierarchy.test.ts', 'C2'],
      ['scripts/check-docs/main.mts', 'T'],
      ['bruno/items/move-item.bru', 'T'],
      ['package.json', 'T'],
      ['client/vite.config.ts', 'T'],
      ['server/package.json', 'T'],
    ];
    for (const [file, group] of expected) assert.equal(groupFor(file), group, file);
  });
});

describe('specTakes', () => {
  it('takes a whole group, or only its source files or its test files', () => {
    assert.ok(specTakes('C2', 'C2', 'client/src/lib/a.ts') && specTakes('C2', 'C2', 'client/src/lib/a.test.ts'));
    assert.ok(
      specTakes('C2:src', 'C2', 'client/src/lib/a.ts') && !specTakes('C2:src', 'C2', 'client/src/lib/a.test.ts'),
    );
    assert.ok(
      !specTakes('C2:test', 'C2', 'client/src/lib/a.ts') && specTakes('C2:test', 'C2', 'client/src/lib/a.test.ts'),
    );
    assert.ok(!specTakes('C1', 'C2', 'client/src/lib/a.ts'));
  });
});

describe('groupOf', () => {
  it('throws for a path no group takes', () => {
    assert.throws(() => groupOf([{ name: 'only', pattern: '^a/' }])('b/x.ts'), /no group matches b\/x\.ts/);
  });
});

describe('parseConfig', () => {
  it('keeps the defaults for a key it is not given', () => {
    const config = parseConfig(JSON.stringify({ readWhole: ['server/src/a.ts'] }));
    assert.deepEqual(config.readWhole, ['server/src/a.ts']);
    assert.deepEqual(config.groups, DEFAULT_CONFIG.groups);
    assert.deepEqual(config.instances, DEFAULT_CONFIG.instances);
  });

  it('replaces a key it is given, whole', () => {
    const groups = [{ name: 'all', pattern: '' }];
    const instances = { correctness: { everything: ['all'] }, drift: {}, duplication: {}, fileresp: {} };
    const config = parseConfig(JSON.stringify({ groups, instances }));
    assert.deepEqual(config.groups, groups);
    assert.deepEqual(config.instances, instances);
  });

  it('rejects a key it does not know, and an instance that reads a group the config lacks', () => {
    assert.throws(() => parseConfig('{"instance": {}}'), /unknown config key instance/);
    const instances = { correctness: { a: ['nowhere'] }, drift: {}, duplication: {}, fileresp: {} };
    assert.throws(() => parseConfig(JSON.stringify({ instances })), /correctness instance a reads "nowhere"/);
    assert.throws(() => parseConfig('[]'), /must be a JSON object/);
  });
});
