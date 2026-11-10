// `npm run report:catalog -- [--out <path>]`: reports how the test-plan catalog and the
// tests line up, to the terminal or to the file `--out` names (its folder is made if it
// isn't there). It exits 0 whatever it finds, 1 only when an input can't be read or the file
// can't be written, and 2 on a usage error. It is not part of `npm run check`.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from './args.mts';
import { carriersByCase, countTests } from './carriers.mts';
import { runChecks } from './checks.mts';
import { renderReport } from './report.mts';
import { readCatalog, readTests } from './sources.mts';

const root = path.resolve(import.meta.dirname, '../..');
const args = parseArgs(process.argv.slice(2));
if ('error' in args) {
  console.error(`report-catalog: ${args.error}`);
  process.exit(2);
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

let report: string;
try {
  const catalog = readCatalog(root);
  if (catalog.cases.length === 0) throw new Error('no cases found under docs/test-plans');
  const files = readTests(root);
  const carriers = carriersByCase(files);
  report = renderReport({
    suites: catalog.suites,
    cases: catalog.cases,
    problems: catalog.problems,
    checks: runChecks(catalog.cases, carriers, repoPath => existsSync(path.join(root, repoPath))),
    carriers,
    tests: { files: files.length, ...countTests(files) },
  });
} catch (error) {
  console.error(`report-catalog: can't read the catalog or the tests: ${messageOf(error)}`);
  process.exit(1);
}

if (args.out === null) {
  console.log(report);
} else {
  try {
    mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
    writeFileSync(path.resolve(args.out), `${report}\n`, 'utf8');
  } catch (error) {
    console.error(`report-catalog: can't write ${args.out}: ${messageOf(error)}`);
    process.exit(1);
  }
  console.log(`report-catalog: wrote ${args.out}`);
}
