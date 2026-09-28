// `npm run check:docs -- [--rules <id>,...] [paths...]`: checks the given files and
// directories, or the default scope when none are given, and reports only the named rules
// when `--rules` is given. Prints one line per hit and a count per rule, and exits 1 if
// there are any hits, or 2 on a usage error.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from './args.mts';
import { checkFile } from './check.mts';
import { defaultFiles, expandArgs } from './files.mts';
import { loadIndex } from './repoIndex.mts';

const root = path.resolve(import.meta.dirname, '../..');
const parsed = parseArgs(process.argv.slice(2));
if ('error' in parsed) {
  console.error(`check-docs: ${parsed.error}`);
  process.exit(2);
}
const { rules, paths } = parsed;

const { files, skipped, errors } =
  paths.length > 0 ? expandArgs(root, process.cwd(), paths) : { files: defaultFiles(root), skipped: [], errors: [] };
for (const note of skipped) console.error(`check-docs: skipped ${note}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`check-docs: ${error}`);
  process.exit(2);
}

const index = loadIndex(root);
const perRule = new Map<string, number>();
for (const file of files) {
  for (const finding of checkFile(file, readFileSync(path.join(root, file), 'utf8'), index, rules)) {
    console.log(`${file}:${finding.line}:${finding.col} ${finding.rule} ${finding.message}`);
    perRule.set(finding.rule, (perRule.get(finding.rule) ?? 0) + 1);
  }
}

const total = [...perRule.values()].reduce((sum, count) => sum + count, 0);
if (total > 0) {
  console.log('');
  for (const [rule, count] of [...perRule].sort((a, b) => b[1] - a[1]))
    console.log(`${String(count).padStart(6)}  ${rule}`);
}
const only = rules ? ` for ${[...rules].join(', ')}` : '';
console.log(`check-docs: ${files.length} files checked${only}, ${total} ${total === 1 ? 'hit' : 'hits'}`);
process.exitCode = total > 0 ? 1 : 0;
