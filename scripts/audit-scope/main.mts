// `npm run audit:scope -- --out <dir> [--base <ref>] [--end <ref>] [--config <file>] [--repo <dir>]`:
// builds an audit's scope files, one per pass instance, into <dir>, clearing the `scope-*.md`
// files an earlier run left there first and leaving any other file. The range runs from the
// base, by default the newest tag that ends an audit (`*-audited`), to the end, by default
// HEAD. The config (JSON) can replace the area groups, the instances each pass runs as, and
// the files marked read whole; see config.mts. Exits 1 when a file a pass should read falls in
// no instance of it, or 2 on a usage error.

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from './args.mts';
import { DEFAULT_CONFIG, parseConfig } from './config.mts';
import { gitIn } from './git.mts';
import { INCLUDE, scanRange } from './scan.mts';
import { buildScopes } from './scopes.mts';

const args = parseArgs(process.argv.slice(2));
if ('error' in args) {
  console.error(`audit-scope: ${args.error}`);
  process.exit(2);
}
const root = args.repo === null ? path.resolve(import.meta.dirname, '../..') : path.resolve(args.repo);

const git = gitIn(root);
let config = DEFAULT_CONFIG;
if (args.config !== null) {
  try {
    config = parseConfig(readFileSync(path.resolve(args.config), 'utf8'));
  } catch (error) {
    console.error(`audit-scope: ${args.config}: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
}

let base = args.base;
if (base === null) {
  try {
    base = git(['describe', '--tags', '--match', '*-audited', '--abbrev=0', args.end]).trim();
  } catch (error) {
    // The guess may be wrong (a mistyped --end, a shallow clone, no git), so git's own words follow it.
    console.error('audit-scope: no tag ending an audit (*-audited) is reachable; give --base');
    console.error(`audit-scope: git said: ${error instanceof Error ? error.message.trim() : String(error)}`);
    process.exit(2);
  }
}

if (args.end === 'HEAD' && git(['status', '--porcelain', '--untracked-files=no', '--', ...INCLUDE]).trim() !== '') {
  console.error('audit-scope: warning: the working tree has uncommitted changes, which the scope files leave out');
}

const scan = scanRange({ git, root, base, end: args.end, config });
const { scopes, empty, unassigned } = buildScopes(scan, config);

// The last run's scope files go first: an instance that comes out empty this time writes none,
// and an old one left beside the new would be read as this run's.
const out = path.resolve(args.out);
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) if (/^scope-.*\.md$/.test(name)) rmSync(path.join(out, name));
for (const scope of scopes) writeFileSync(path.join(out, scope.name), scope.text, { encoding: 'utf8' });

console.log(
  `${base}..${args.end}: ${scan.commits} commits, ${scan.files.length} files to read, ${scan.movedLines} moved lines left out`,
);
console.log(`${'scope'.padEnd(36)} files changed removal-sites`);
for (const scope of scopes) {
  const count = (pick: (file: (typeof scope.files)[number]) => number): number =>
    scope.files.reduce((sum, file) => sum + pick(file), 0);
  const row = [
    scope.name.padEnd(36),
    String(scope.files.length).padStart(5),
    String(count(file => file.changed.length)).padStart(7),
    String(count(file => file.removalSites.length)).padStart(13),
  ];
  console.log(row.join(' '));
}
for (const { pass, instance } of empty) console.log(`no files for ${pass} ${instance}; no scope file written`);
for (const { pass, path: file } of unassigned) console.error(`audit-scope: no ${pass} instance takes ${file}`);
process.exitCode = unassigned.length > 0 ? 1 : 0;
