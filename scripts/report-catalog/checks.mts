// The four checks, each a list of findings. A running test is one that isn't skipped. Every
// check reads a case's own line for its status, as `catalog.mts` does, so a case whose table
// disagrees is judged by its line and also reported by the last check. A check only reports:
// nothing here changes a case or fails anything.

import type { Carriers } from './carriers.mts';
import type { CatalogCase } from './catalog.mts';

/** An Automated case that no running test carries. */
export interface LostCoverage {
  id: string;
  /** The files its Automation line names. */
  automation: string[];
  /** The files whose skipped tests carry it. */
  skipped: string[];
}

/** A Manual case that a running test carries. */
export interface ManualCarried {
  id: string;
  files: string[];
}

export type StaleReason =
  'file missing' | 'no running test in it carries the case' | 'only skipped tests in it carry the case';

/** A path on a case's Automation line that no longer backs the case. */
export interface StaleLine {
  id: string;
  path: string;
  reason: StaleReason;
}

/** A case whose summary table row and own line give different statuses. */
export interface StatusDisagreement {
  id: string;
  suite: string;
  table: string;
  caseLine: string;
}

export interface Checks {
  lostCoverage: LostCoverage[];
  manualCarried: ManualCarried[];
  staleAutomation: StaleLine[];
  statusDisagreements: StatusDisagreement[];
}

const NONE: Carriers = { running: new Set(), skipped: new Set() };

export function runChecks(
  cases: readonly CatalogCase[],
  carriers: ReadonlyMap<string, Carriers>,
  exists: (repoPath: string) => boolean,
): Checks {
  const checks: Checks = { lostCoverage: [], manualCarried: [], staleAutomation: [], statusDisagreements: [] };

  for (const found of cases) {
    const { id } = found;
    const carried = carriers.get(id) ?? NONE;
    const paths = found.automation?.kind === 'files' ? found.automation.paths : [];

    if (found.status === 'Automated' && carried.running.size === 0) {
      checks.lostCoverage.push({ id, automation: paths, skipped: [...carried.skipped].sort() });
    }
    if (found.status === 'Manual' && carried.running.size > 0) {
      checks.manualCarried.push({ id, files: [...carried.running].sort() });
    }
    for (const path of paths) {
      const reason = staleReason(path, carried, exists);
      if (reason !== null) checks.staleAutomation.push({ id, path, reason });
    }
    if (found.lineStatus !== null && found.tableStatus !== null && found.lineStatus !== found.tableStatus) {
      checks.statusDisagreements.push({
        id,
        suite: found.suite,
        table: found.tableStatus,
        caseLine: found.lineStatus,
      });
    }
  }
  return checks;
}

function staleReason(path: string, carried: Carriers, exists: (repoPath: string) => boolean): StaleReason | null {
  if (!exists(path)) return 'file missing';
  if (carried.running.has(path)) return null;
  return carried.skipped.has(path)
    ? 'only skipped tests in it carry the case'
    : 'no running test in it carries the case';
}
