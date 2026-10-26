import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { traceFile } from './blame.mts';
import { DEFAULT_CONFIG } from './config.mts';
import { gitIn } from './git.mts';
import { scanRange, type FileScope, type RangeScan } from './scan.mts';
import { buildScopes } from './scopes.mts';

// A throwaway repository with a range's worth of history: a base commit (tagged as an audit's
// end), then commits that change code, comments and imports, move a block, split one out into
// a new file, put one in a removed line's place, copy one, rename and delete files, format a
// file, and move code that the range itself wrote.

const lines = (...parts: string[]): string => parts.join('\n') + '\n';

const MOVED_WORK = [
  'export function movedWork(input: string): string {',
  '  const trimmed = input.trim().toLowerCase();',
  '  const withPrefix = `prefix-${trimmed}-suffix`;',
  "  const asWords = withPrefix.split('-').filter(Boolean);",
  "  const joinedAgain = asWords.join('/').toUpperCase();",
  '  return `${joinedAgain}:${asWords.length}`;',
  '}',
];
const COPIED_WORK = [
  'export function copiedWork(items: number[]): number {',
  '  const filtered = items.filter(item => item > 0);',
  '  const squared = filtered.map(item => item * item);',
  '  const summed = squared.reduce((sum, item) => sum + item, 0);',
  '  const rounded = Math.round(summed * 100) / 100;',
  '  return rounded;',
  '}',
];
const FRESH_WORK = [
  'export function freshWork(entries: string[]): string[] {',
  "  const nonEmpty = entries.filter(entry => entry !== '');",
  '  const sorted = [...nonEmpty].sort((a, b) => a.localeCompare(b));',
  '  const labelled = sorted.map((entry, i) => `${i}:${entry}`);',
  '  const reversed = [...labelled].reverse();',
  '  return reversed;',
  '}',
];

const OLD_NAME_WORK = [
  'export function oldNameWork(rows: string[][]): string {',
  "  const flattened = rows.map(row => row.join(',')).filter(Boolean);",
  '  const numbered = flattened.map((row, i) => `${i + 1}. ${row}`);',
  "  const joined = numbered.join('; ').replace(/\\s+/g, ' ');",
  '  const clipped = joined.length > 200 ? joined.slice(0, 200) : joined;',
  '  return clipped;',
  '}',
];

const SPLIT_WORK = [
  'export function splitWork(count: number): number[] {',
  '  const steps = Array.from({ length: count }, (_, i) => i * 7);',
  '  const odd = steps.filter(step => step % 2 === 1);',
  '  const halved = odd.map(step => Math.floor(step / 2));',
  '  const capped = halved.map(step => Math.min(step, 99));',
  '  return capped;',
  '}',
];

const PLACED_WORK = [
  'export function placedWork(text: string): number {',
  "  const vowels = text.split('').filter(ch => 'aeiou'.includes(ch));",
  '  const unique = new Set(vowels);',
  '  const weighted = unique.size * 13 + vowels.length;',
  '  const bounded = weighted % 1000;',
  '  return bounded;',
  '}',
];

const A = 'server/src/';

describe('a range scanned end to end', () => {
  let root: string;
  let scan: RangeScan;
  let baseSha: string;

  const git = (...args: string[]): string => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  const write = (rel: string, text: string): void => {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), text);
  };
  const commit = (message: string): string => {
    git('add', '-A');
    git('commit', '-q', '-m', message);
    return git('rev-parse', 'HEAD').trim();
  };
  const scanned = (rel: string): FileScope => {
    const found = scan.files.find(file => file.path === rel);
    assert.ok(found, `${rel} is in the scan`);
    return found;
  };

  before(() => {
    root = mkdtempSync(path.join(tmpdir(), 'audit-scope-'));
    git('init', '-q', '-b', 'main');
    for (const [key, value] of [
      ['user.name', 'Test'],
      ['user.email', 'test@example.com'],
      ['commit.gpgsign', 'false'],
      ['core.autocrlf', 'false'],
    ]) {
      git('config', key, value);
    }

    write('CLAUDE.md', lines('# Notes', '', 'One line.'));
    write(
      `${A}kept.ts`,
      lines(
        '// Kept: a module header.',
        "import { helper } from './helper.ts';",
        '',
        'export function keep(a: number): number {',
        '  const doubled = a * 2;',
        '  const tripled = a * 3;',
        '  return doubled + tripled;',
        '}',
      ),
    );
    write(`${A}moved.ts`, lines('// Holds code that moves out.', ...MOVED_WORK));
    write(`${A}receiver.ts`, lines('export const receiver = 1;'));
    write(`${A}splitsrc.ts`, lines('// Holds code that splits out.', ...SPLIT_WORK, 'export const splitStays = 1;'));
    write(
      `${A}placed.ts`,
      lines('export const before = 1;', 'export const placeholder = 0;', 'export const after = 2;'),
    );
    write(`${A}placedsrc.ts`, lines(...PLACED_WORK, 'export const placedStays = 1;'));
    write(`${A}copysrc.ts`, lines(...COPIED_WORK));
    write(`${A}oldname.ts`, lines(...OLD_NAME_WORK));
    write(`${A}comments.ts`, lines('// The old header comment.', 'export const answer = 42;'));
    write(`${A}imports.ts`, lines("import { a } from './a.ts';", 'export const useA = a;'));
    write(`${A}gone.ts`, lines('export const gone = true;', 'export const alsoGone = true;'));
    write(
      `${A}renamed.ts`,
      lines(
        'export function renamedWork(value: number): number {',
        '  const widened = value * 1000 + 17;',
        '  const narrowed = widened - 3;',
        '  const unused = narrowed + 1;',
        '  return narrowed;',
        '}',
      ),
    );
    write(`${A}format.ts`, lines('export const label = "text";'));
    write('.git-blame-ignore-revs', lines('# formatting commits'));
    baseSha = commit('base');
    git('tag', 'story-audited');

    // The range's first commit.
    write('CLAUDE.md', lines('# Notes', '', 'One line.', 'Another line.'));
    write(
      `${A}kept.ts`,
      lines(
        '// Kept: a module header.',
        "import { helper } from './helper.ts';",
        '',
        'export function keep(a: number): number {',
        '  const doubled = a * 2 + helper(a);',
        '  const tripled = a * 3 + helper(a);',
        '  return doubled + tripled;',
        '}',
      ),
    );
    write(`${A}moved.ts`, lines('// Holds code that moves out.'));
    write(`${A}receiver.ts`, lines("import { x } from './x.ts';", 'export const receiver = 1;', '', ...MOVED_WORK));
    write(`${A}splitsrc.ts`, lines('// Holds code that splits out.', 'export const splitStays = 1;'));
    write(`${A}split.ts`, lines('// A module split out.', "import { z } from './z.ts';", '', ...SPLIT_WORK));
    write(`${A}placed.ts`, lines('export const before = 1;', ...PLACED_WORK, 'export const after = 2;'));
    write(`${A}placedsrc.ts`, lines('export const placedStays = 1;'));
    write(`${A}copydst.ts`, lines(...COPIED_WORK));
    write(`${A}copydst2.ts`, lines('// A copy of the function that is about to change names.', '', ...OLD_NAME_WORK));
    write(`${A}comments.ts`, lines('// A rewritten header comment,', '// on two lines.', 'export const answer = 42;'));
    write(
      `${A}imports.ts`,
      lines("import { a } from './a.ts';", "import { b } from './b.ts';", 'export const useA = a;'),
    );
    rmSync(path.join(root, A, 'gone.ts'));
    git('mv', `${A}renamed.ts`, `${A}renamed2.ts`);
    write(
      `${A}renamed2.ts`,
      lines(
        'export function renamedWork(value: number): number {',
        '  const widened = value * 1000 + 18;',
        '  const narrowed = widened - 3;',
        '  return narrowed;',
        '}',
      ),
    );
    write(`${A}fresh.ts`, lines('// Written in the range.', ...FRESH_WORK));
    commit('range: changes');

    // A formatting commit, then the list that names it.
    write(`${A}format.ts`, lines("export const label = 'text';"));
    const formatting = commit('range: formatting');
    write('.git-blame-ignore-revs', lines('# formatting commits', formatting));
    commit('range: ignore the formatting');

    // Code the range wrote, moved by the range; and the source of an earlier copy, renamed.
    write(`${A}fresh.ts`, lines('// Written in the range.'));
    write(`${A}fresh2.ts`, lines(...FRESH_WORK));
    git('mv', `${A}oldname.ts`, `${A}newname.ts`);
    commit('range: move the new code');

    scan = scanRange({ git: gitIn(root), root, base: baseSha, end: 'HEAD', config: DEFAULT_CONFIG });
  });

  after(() => rmSync(root, { recursive: true, force: true }));

  it('counts the commits in the range', () => {
    assert.equal(scan.commits, 4);
  });

  it('lists the lines a file changed, and reads a file with a few changed lines at those lines', () => {
    const kept = scanned(`${A}kept.ts`);
    assert.deepEqual([kept.reading, kept.changed, kept.readWhole, kept.group], ['all', [5, 6], null, 'S1']);
  });

  it('marks a new file read whole', () => {
    const fresh = scanned(`${A}fresh.ts`);
    assert.deepEqual([fresh.isNew, fresh.readWhole], [true, 'new file']);
  });

  it('sets code moved in aside: the file that received it, with the import it needs, goes to the drift pass alone', () => {
    const receiver = scanned(`${A}receiver.ts`);
    const moved = receiver.moved.get(`${A}moved.ts`) ?? [];
    for (const line of [4, 5, 6, 7, 8, 9]) {
      assert.ok(moved.includes(line), `line ${line} moved in`);
      assert.ok(!receiver.changed.includes(line), `line ${line} is not also changed`);
    }
    assert.ok(receiver.changed.includes(1), 'the import is changed');
    assert.deepEqual([receiver.reading, receiver.readWhole], ['drift', null]);
  });

  it("doesn't read whole a new file whose only code moved there, and gives it to the drift pass alone", () => {
    const split = scanned(`${A}split.ts`);
    assert.ok((split.moved.get(`${A}splitsrc.ts`) ?? []).length >= 6, 'the block moved in');
    assert.deepEqual([split.isNew, split.reading, split.readWhole], [true, 'drift', null]);
  });

  it('lists where moved code took the place of a removed line, since no list names that code', () => {
    const placed = scanned(`${A}placed.ts`);
    assert.ok((placed.moved.get(`${A}placedsrc.ts`) ?? []).length >= 6, 'the block moved in');
    assert.deepEqual([placed.reading, placed.removalSites], ['all', [1]]);
  });

  it('counts the moved lines every scope leaves out', () => {
    const counted = scan.files.reduce((sum, file) => sum + [...file.moved.values()].flat().length, 0);
    assert.ok(scan.movedLines >= counted && counted >= 18, `${scan.movedLines} moved, ${counted} in files read`);
  });

  it("lists where the source of a move lost its lines, and doesn't call them changed", () => {
    const source = scanned(`${A}moved.ts`);
    assert.deepEqual([source.reading, source.changed, source.removalSites], ['all', [], [1]]);
  });

  // The source a file's lines trace to, by git itself, to show the copy is one git sees.
  const tracedFrom = (rel: string, source: string): number => {
    const range = {
      git: gitIn(root),
      base: baseSha,
      end: 'HEAD',
      inRange: new Set(git('rev-list', `${baseSha}..HEAD`).split('\n').filter(Boolean)),
      ignoreRevs: true,
    };
    return (traceFile(range, rel, [rel]).moved.get(source) ?? []).length;
  };

  it("counts a copy as changed code: git traces it to the copy's source, which still holds it", () => {
    assert.ok(tracedFrom(`${A}copydst.ts`, `${A}copysrc.ts`) >= 6, 'git traces the copy to its source');

    const copy = scanned(`${A}copydst.ts`);
    assert.equal(copy.moved.size, 0);
    assert.deepEqual(copy.changed, [1, 2, 3, 4, 5, 6, 7]);
  });

  it('finds the source of a copy under the name the range gave it', () => {
    assert.ok(tracedFrom(`${A}copydst2.ts`, `${A}oldname.ts`) >= 6, 'git traces the copy to the source as it was');

    const copy = scanned(`${A}copydst2.ts`);
    assert.equal(copy.moved.size, 0);
    assert.deepEqual(copy.changed, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('counts code the range wrote and then moved as changed, since it was never audited', () => {
    const fresh2 = scanned(`${A}fresh2.ts`);
    assert.equal(fresh2.moved.size, 0);
    assert.deepEqual(fresh2.changed, [1, 2, 3, 4, 5, 6, 7]);
  });

  it('gives the drift pass alone a file changed in its comments only, in its imports only, or an agent-instruction file', () => {
    assert.equal(scanned(`${A}comments.ts`).reading, 'drift');
    assert.equal(scanned(`${A}imports.ts`).reading, 'drift');
    assert.equal(scanned('CLAUDE.md').reading, 'drift');
  });

  it('leaves out a file whose only change was formatting', () => {
    assert.equal(
      scan.files.some(file => file.path === `${A}format.ts`),
      false,
    );
  });

  it('records the deleted and the renamed paths under their old names', () => {
    assert.deepEqual(scan.deleted, [{ path: `${A}gone.ts`, group: 'S1' }]);
    assert.deepEqual(
      [...scan.renamed].sort((a, b) => a.oldPath.localeCompare(b.oldPath)),
      [
        { oldPath: `${A}oldname.ts`, path: `${A}newname.ts`, group: 'S1' },
        { oldPath: `${A}renamed.ts`, path: `${A}renamed2.ts`, group: 'S1' },
      ],
    );
  });

  it("finds a renamed file's changes and removals against the file it was", () => {
    const renamed = scanned(`${A}renamed2.ts`);
    assert.deepEqual([renamed.changed, renamed.removalSites, renamed.moved.size], [[2], [3], 0]);
  });

  it('builds scope files that put each file with the passes that read it', () => {
    const { scopes, unassigned } = buildScopes(scan, DEFAULT_CONFIG);
    const text = (name: string): string => scopes.find(scope => scope.name === name)?.text ?? '';
    assert.deepEqual(unassigned, []);

    assert.match(text('scope-drift-S1.md'), /`server\/src\/comments\.ts`/);
    assert.match(text('scope-drift-S1.md'), /`server\/src\/gone\.ts` \(deleted\)/);
    assert.match(text('scope-drift-S1.md'), /`server\/src\/renamed\.ts` \(renamed to `server\/src\/renamed2\.ts`\)/);
    assert.doesNotMatch(text('scope-correctness-S1.md'), /comments\.ts|imports\.ts|gone\.ts/);
    assert.match(text('scope-correctness-S1.md'), /`server\/src\/kept\.ts` \(lines 5-6\)/);
    assert.doesNotMatch(text('scope-correctness-S1.md'), /receiver\.ts|split\.ts/);
    assert.match(text('scope-drift-S1.md'), /`server\/src\/receiver\.ts` \(lines 1(, 3)?\)/);
    for (const scope of scopes) assert.doesNotMatch(scope.text, /Code moved here/, scope.name);

    const responsibility = text('scope-fileresp-server.md');
    assert.match(responsibility, /Read these files whole/);
    assert.doesNotMatch(responsibility, /`server\/src\/kept\.ts` \(lines/);
  });

  it('runs from the command line, taking the newest tag that ends an audit as the base', () => {
    const out = path.join(root, 'scope-out');
    const main = path.join(import.meta.dirname, 'main.mts');
    const run = spawnSync(process.execPath, [main, '--repo', root, '--out', out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /story-audited\.\.HEAD: 4 commits, \d+ files to read, \d+ moved lines left out/);
    assert.ok(readdirSync(out).includes('scope-correctness-S1.md'));
    assert.match(readFileSync(path.join(out, 'scope-drift-S1.md'), 'utf8'), /comments\.ts/);
  });

  it('exits 1, naming the file, when no instance of a pass takes a file that pass reads', () => {
    const config = path.join(root, 'config.json');
    writeFileSync(config, JSON.stringify({ instances: { ...DEFAULT_CONFIG.instances, correctness: {} } }));
    const main = path.join(import.meta.dirname, 'main.mts');
    const args = ['--repo', root, '--base', baseSha, '--config', config, '--out', path.join(root, 'scope-out-2')];
    const run = spawnSync(process.execPath, [main, ...args], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /audit-scope: no correctness instance takes server\/src\/kept\.ts/);
    assert.doesNotMatch(run.stderr, /no drift instance/);
  });

  it('exits 2 for a config it cannot read', () => {
    const config = path.join(root, 'bad.json');
    writeFileSync(config, '{"instance": {}}');
    const main = path.join(import.meta.dirname, 'main.mts');
    const run = spawnSync(
      process.execPath,
      [main, '--repo', root, '--config', config, '--out', path.join(root, 'o3')],
      {
        encoding: 'utf8',
      },
    );
    assert.equal(run.status, 2);
    assert.match(run.stderr, /bad\.json: unknown config key instance/);
  });
});
