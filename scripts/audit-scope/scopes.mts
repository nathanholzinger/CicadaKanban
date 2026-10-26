// Turns a range's scan into scope files, one per pass instance. Which passes read a file:
//
//   - a file the range changed in its comments and test titles only, or in its imports only,
//     goes to the drift pass alone, and so does an agent-instruction file;
//   - every other file goes to all four passes;
//   - the file-responsibility pass takes only the files marked read whole;
//   - moved lines are listed apart, and the drift pass also gets the deleted and renamed paths.
//
// A scope file lists, for each of its files, line numbers as they stand at the end of the range.

import { PASSES, specTakes, type Pass, type ScopeConfig } from './config.mts';
import type { FileScope, RangeScan } from './scan.mts';

export interface ScopeFile {
  /** The file's name, `scope-<pass>-<instance>.md`. */
  name: string;
  pass: Pass;
  instance: string;
  files: FileScope[];
  text: string;
}

export interface Unassigned {
  pass: Pass;
  path: string;
}

/** Line numbers as ranges: `1-3, 5`. */
export function ranges(numbers: readonly number[]): string {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length;) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(j === i ? `${sorted[i]}` : `${sorted[i]}-${sorted[j]}`);
    i = j + 1;
  }
  return parts.join(', ');
}

/** Whether a pass reads a file at all. */
function reads(pass: Pass, file: FileScope): boolean {
  if (pass === 'drift') return true;
  if (file.reading !== 'all') return false;
  return pass !== 'fileresp' || file.readWhole !== null;
}

interface Extras {
  deleted: RangeScan['deleted'];
  renamed: RangeScan['renamed'];
}

export function renderScope(files: readonly FileScope[], extras: Extras): string {
  const sections: string[][] = [];

  const whole = files.filter(file => file.readWhole !== null);
  if (whole.length > 0) {
    sections.push([
      '**Read these files whole** (the range may have changed their shape):',
      ...whole.map(file => `- \`${file.path}\` (${file.readWhole})`),
    ]);
  }

  const changed = files.filter(file => file.changed.length > 0);
  if (changed.length > 0) {
    sections.push([
      '**Code changed since the last audit:**',
      ...changed.map(file => `- \`${file.path}\`${file.isNew ? ' (new file)' : ''} (lines ${ranges(file.changed)})`),
    ]);
  }

  const moved = files.flatMap(file =>
    [...file.moved].sort().map(([origin, lines]) => `- \`${file.path}\` (lines ${ranges(lines)}, from \`${origin}\`)`),
  );
  if (moved.length > 0) {
    sections.push([
      '**Code moved here unchanged from another file since the last audit** (the source file as it stood at the last audit):',
      ...moved,
    ]);
  }

  const removed = files.filter(file => file.removalSites.length > 0);
  if (removed.length > 0) {
    sections.push([
      '**Lines removed since the last audit with nothing added in their place** (the line numbers are the lines just above each removal, as the file stands now):',
      ...removed.map(
        file =>
          `- \`${file.path}\` (after line${file.removalSites.length > 1 ? 's' : ''} ${file.removalSites.join(', ')})`,
      ),
    ]);
  }

  const gone = [
    ...extras.deleted.map(file => `- \`${file.path}\` (deleted)`),
    ...extras.renamed.map(file => `- \`${file.oldPath}\` (renamed to \`${file.path}\`)`),
  ];
  if (gone.length > 0) {
    sections.push([
      '**Files deleted or renamed since the last audit** (search for what still names them by their old paths):',
      ...gone,
    ]);
  }

  return sections.map(section => section.join('\n')).join('\n\n') + '\n';
}

export interface ScopeSet {
  scopes: ScopeFile[];
  /** Instances that would have had nothing to read. */
  empty: { pass: Pass; instance: string }[];
  /** Files a pass should read that no instance of it takes. */
  unassigned: Unassigned[];
}

export function buildScopes(scan: RangeScan, config: ScopeConfig): ScopeSet {
  const scopes: ScopeFile[] = [];
  const empty: ScopeSet['empty'] = [];
  const taken = new Set<string>();
  const unassigned: Unassigned[] = [];

  for (const pass of PASSES) {
    const instances = Object.entries(config.instances[pass] ?? {});
    for (const [instance, specs] of instances) {
      const inGroups = (group: string, file: string): boolean => specs.some(spec => specTakes(spec, group, file));
      const files = scan.files.filter(file => reads(pass, file) && inGroups(file.group, file.path));
      const deleted = pass === 'drift' ? scan.deleted.filter(item => inGroups(item.group, item.path)) : [];
      const renamed = pass === 'drift' ? scan.renamed.filter(item => inGroups(item.group, item.path)) : [];
      for (const file of files) taken.add(`${pass}:${file.path}`);
      for (const item of deleted) taken.add(`${pass}:${item.path}`);
      for (const item of renamed) taken.add(`${pass}:${item.path}`);

      if (files.length === 0 && deleted.length === 0 && renamed.length === 0) {
        empty.push({ pass, instance });
        continue;
      }
      scopes.push({
        name: `scope-${pass}-${instance}.md`,
        pass,
        instance,
        files,
        text: renderScope(files, { deleted, renamed }),
      });
    }
    const wanted = [
      ...scan.files.filter(file => reads(pass, file)).map(file => file.path),
      ...(pass === 'drift' ? [...scan.deleted.map(item => item.path), ...scan.renamed.map(item => item.path)] : []),
    ];
    for (const file of wanted) if (!taken.has(`${pass}:${file}`)) unassigned.push({ pass, path: file });
  }
  return { scopes, empty, unassigned };
}
