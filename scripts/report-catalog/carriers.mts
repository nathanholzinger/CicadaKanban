// Which files carry which case. A test carries the IDs its title opens with, and an ID on a
// `describe` covers every test inside it (the test plans' README, "How tests and cases
// point at each other"). A title opens with a list of IDs and a colon; an ID later in the
// title is prose, not a stamp. A test is skipped when it, or a `describe` around it, is a
// declared skip, and a skipped carrier is kept apart: it never counts as covering a case.

import type { TestDeclaration } from '../check-docs/extract.mts';
import { CASE_ID } from '../check-docs/repoIndex.mts';

export interface TestFile {
  /** Repo-relative path. */
  path: string;
  declarations: readonly TestDeclaration[];
}

/** The files carrying one case. A file with both running and skipped carriers is in both. */
export interface Carriers {
  running: Set<string>;
  skipped: Set<string>;
}

const LEADING_IDS = new RegExp(String.raw`^\s*(${CASE_ID}(?:\s*,\s*${CASE_ID})*)\s*:`);

/** The case IDs a title opens with; none when it doesn't open with an ID list and a colon. */
export function leadingIds(opening: string): string[] {
  const list = LEADING_IDS.exec(opening)?.[1];
  return list === undefined ? [] : list.split(',').map(id => id.trim());
}

export function carriersByCase(files: readonly TestFile[]): Map<string, Carriers> {
  const carriers = new Map<string, Carriers>();
  for (const file of files) {
    for (const declaration of file.declarations) {
      if (declaration.group) continue;
      const skipped = isSkipped(declaration);
      for (const id of [...declaration.within, declaration].flatMap(link => link.openings.flatMap(leadingIds))) {
        let entry = carriers.get(id);
        if (!entry) {
          entry = { running: new Set(), skipped: new Set() };
          carriers.set(id, entry);
        }
        (skipped ? entry.skipped : entry.running).add(file.path);
      }
    }
  }
  return carriers;
}

/** The tests and skips a set of files declares, for the report's header; a `describe` isn't a test. */
export function countTests(files: readonly TestFile[]): { tests: number; skipped: number } {
  const tests = files.flatMap(file => file.declarations.filter(declaration => !declaration.group));
  return { tests: tests.length, skipped: tests.filter(isSkipped).length };
}

function isSkipped(declaration: TestDeclaration): boolean {
  return declaration.skipped || declaration.within.some(group => group.skipped);
}
