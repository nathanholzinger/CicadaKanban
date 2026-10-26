// Which passes read a file, and whether one reads it whole. A file's changes are sorted over
// the whole range, from the file's own two versions, not from the commits that touched it.

import { touchedLines, type Hunk } from './diff.mts';
import { isScriptFile, lineKinds, strippedCode } from './lineKinds.mts';

/** `all` is every pass; `drift` the drift pass alone; `none` nothing is left to read. */
export type Reading = 'all' | 'drift' | 'none';

export interface FileFacts {
  path: string;
  /** Whether the range added the file, rather than changed it or renamed it. */
  isNew: boolean;
  /** The lines that are changed and not moved, as the range leaves them. */
  changed: readonly number[];
  /** Whether code moved into the file from another. */
  movedIn: boolean;
  removalSites: readonly number[];
  /** The file's text at the base, under the path it had then; null for a new file. */
  oldText: string | null;
  newText: string;
  hunks: readonly Hunk[];
}

const isAgentInstructionFile = (file: string): boolean => file === 'CLAUDE.md' || file.endsWith('/CLAUDE.md');

const sameLines = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((line, i) => line === b[i]);

/** Whether the diff touches import declarations and nothing else, removed lines included. */
function touchesOnlyImports(facts: FileFacts & { oldText: string }): boolean {
  const { removed, added } = touchedLines(facts.hunks);
  if (removed.length + added.length === 0) return false;
  const oldKinds = lineKinds(facts.path, facts.oldText);
  const newKinds = lineKinds(facts.path, facts.newText);
  return removed.every(line => oldKinds[line - 1] === 'import') && added.every(line => newKinds[line - 1] === 'import');
}

export function readingOf(facts: FileFacts): Reading {
  const { path, changed, movedIn, removalSites, oldText, newText } = facts;
  if (changed.length === 0 && !movedIn && removalSites.length === 0) return 'none';
  if (isAgentInstructionFile(path)) return 'drift';
  // Moved code goes to every pass, listed apart, whatever else changed in the file.
  if (movedIn) return 'all';
  if (oldText !== null && isScriptFile(path)) {
    if (sameLines(strippedCode(path, oldText), strippedCode(path, newText))) return 'drift';
    if (touchesOnlyImports({ ...facts, oldText })) return 'drift';
  }
  return 'all';
}

/** Changed lines of code that mark a file read whole: imports, comments, test titles and blank lines don't count. */
export const READ_WHOLE_CODE_LINES = 10;

/** Why a file is read whole, or null when it is read at its listed lines. */
export function readWholeReason(
  facts: Pick<FileFacts, 'path' | 'isNew' | 'changed' | 'movedIn' | 'newText'>,
  marked: ReadonlySet<string>,
): string | null {
  if (facts.isNew) return 'new file';
  if (facts.movedIn) return 'received moved code';
  const kinds = lineKinds(facts.path, facts.newText);
  const codeLines = facts.changed.filter(line => kinds[line - 1] === 'code').length;
  if (codeLines >= READ_WHOLE_CODE_LINES) return `${codeLines} changed lines of code`;
  return marked.has(facts.path) ? 'marked by the orchestrator' : null;
}
