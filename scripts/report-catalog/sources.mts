// What the report reads from disk: the catalog's suite files, and the declarations in the
// test files of the three test roots. Which files count as suites comes from the docs
// checker. A folder or file that can't be read throws, and the command exits 1.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseScript, testDeclarations } from '../check-docs/extract.mts';
import { TEST_PLANS_DIR, isSkippedDir, isSuiteFile, walkFiles } from '../check-docs/files.mts';
import { readSuite, type CatalogCase, type CatalogProblem } from './catalog.mts';
import type { TestFile } from './carriers.mts';

/** The folders whose tests the catalog's Automation lines can point into. */
export const TEST_ROOTS = ['client/src', 'server/tests', 'tests'];
const TEST_FILE = /\.(?:test|spec)\.(?:tsx?|mts)$/;

export interface Catalog {
  suites: number;
  cases: CatalogCase[];
  problems: CatalogProblem[];
}

export function readCatalog(root: string): Catalog {
  const suites = walkFiles(root, TEST_PLANS_DIR, isSkippedDir).filter(isSuiteFile).sort();
  const cases: CatalogCase[] = [];
  const problems: CatalogProblem[] = [];
  const suiteOf = new Map<string, string>();

  for (const suite of suites) {
    const read = readSuite(suite, readFileSync(path.join(root, suite), 'utf8'));
    problems.push(...read.problems);
    for (const found of read.cases) {
      const first = suiteOf.get(found.id);
      if (first !== undefined) {
        problems.push({ suite, id: found.id, message: `also a case in ${first}; the first is read` });
        continue;
      }
      suiteOf.set(found.id, suite);
      cases.push(found);
    }
  }
  return { suites: suites.length, cases, problems };
}

export function readTests(root: string): TestFile[] {
  const files = TEST_ROOTS.flatMap(dir => walkFiles(root, dir, isSkippedDir)).filter(file => TEST_FILE.test(file));
  return files.sort().map(file => ({
    path: file,
    declarations: testDeclarations(parseScript(file, readFileSync(path.join(root, file), 'utf8'))),
  }));
}
