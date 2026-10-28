import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { BOARD_COMPONENTS, DEFAULT_CONFIG, PASSES, groupOf, parseConfig, parseSpec, specTakes } from './config.mts';

describe('the default groups', () => {
  const groupFor = groupOf(DEFAULT_CONFIG.groups);

  it('name only board components that exist', () => {
    const components = path.join(import.meta.dirname, '../../client/src/components');
    for (const name of BOARD_COMPONENTS) {
      const found = ['.tsx', '.ts'].some(extension => existsSync(path.join(components, `${name}${extension}`)));
      assert.ok(found, `${name} names no file in client/src/components/`);
    }
  });

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
      ['client/src/components/HierarchyModal.tsx', 'C1'],
      ['client/src/components/ModalShell.tsx', 'C1'],
      ['client/src/components/workflow/dragStructure.test.ts', 'C1t'],
      ['client/src/components/KanbanCard.test.tsx', 'C1t'],
      ['client/src/components/HierarchyModal.test.tsx', 'C1t'],
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

describe('the default instances', () => {
  it('give E2E and T an instance each in every pass, where together they came to more than one instance can read', () => {
    for (const pass of PASSES) {
      const instances = Object.entries(DEFAULT_CONFIG.instances[pass]);
      for (const group of ['E2E', 'T']) {
        const reading = instances.filter(([, specs]) => specs.some(spec => parseSpec(spec).group === group));
        assert.deepEqual(
          reading.map(([, specs]) => specs),
          [[group]],
          `${pass} reads ${group}`,
        );
      }
    }
  });
});

describe('parseSpec', () => {
  it('reads a group, with a kind that takes only its source files or its test files', () => {
    assert.deepEqual(parseSpec('C2'), { group: 'C2', kind: null });
    assert.deepEqual(parseSpec('C2:src'), { group: 'C2', kind: 'src' });
    assert.deepEqual(parseSpec('C2:test'), { group: 'C2', kind: 'test' });
  });

  it('refuses a kind it does not know, which would otherwise take the whole group', () => {
    for (const spec of ['C2:tests', 'C2:', 'C2:src:test']) assert.throws(() => parseSpec(spec), /src or test/, spec);
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

  it('rejects an instance whose spec has a kind it does not know', () => {
    const instances = { correctness: { a: ['C2:tests'] }, drift: {}, duplication: {}, fileresp: {} };
    assert.throws(() => parseConfig(JSON.stringify({ instances })), /correctness instance a: .*src or test/);
  });

  it('rejects a value of the wrong shape, naming the key', () => {
    const wrong: [unknown, RegExp][] = [
      [{ readWhole: 'server/src/a.ts' }, /readWhole must be a list of file paths/],
      [{ readWhole: [1] }, /readWhole must be a list of file paths/],
      [{ groups: 'S1' }, /groups must be a list of/],
      [{ groups: [{ name: 'S1' }] }, /groups must be a list of/],
      [{ groups: [{ name: 'S1', pattern: 5 }] }, /groups must be a list of/],
      [{ instances: [] }, /instances must be an object/],
      [{ instances: { correctness: [] } }, /instances\.correctness must map each instance/],
      [{ instances: { correctness: { a: 'S1' } } }, /instances\.correctness\.a must be a list of group names/],
    ];
    for (const [config, message] of wrong) assert.throws(() => parseConfig(JSON.stringify(config)), message);
  });

  it('rejects a group pattern that is not a regular expression, naming the group', () => {
    const groups = [{ name: 'odd', pattern: '(' }];
    assert.throws(() => parseConfig(JSON.stringify({ groups })), /group odd: .*regular expression/);
  });
});
