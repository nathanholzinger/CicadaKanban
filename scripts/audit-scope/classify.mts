// Which passes read a file, and whether one reads it whole. A file's changes are sorted over
// the whole range, from the file's own two versions, not from the commits that touched it.
// Code moved in unchanged from another file is set aside: it was audited where it was
// written, so a file is sorted and marked on the rest of its changes.

import { isScriptFile, lineKinds, strippedCode } from './lineKinds.mts';

/** `all` is every pass; `drift` the drift pass alone; `none` nothing is left to read. */
export type Reading = 'all' | 'drift' | 'none';

export interface FileFacts {
  path: string;
  /** Whether the range added the file, rather than changed it or renamed it. */
  isNew: boolean;
  /** The lines that are changed and not moved, as the range leaves them. */
  changed: readonly number[];
  /** The lines moved in unchanged from another file, as the range leaves them. */
  moved: readonly number[];
  removalSites: readonly number[];
  /** The file's text at the base, under the path it had then; null for a new file. */
  oldText: string | null;
  newText: string;
}

const isAgentInstructionFile = (file: string): boolean => file === 'CLAUDE.md' || file.endsWith('/CLAUDE.md');

const sameLines = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((line, i) => line === b[i]);

export function readingOf(facts: FileFacts): Reading {
  const { path, changed, moved, removalSites, oldText, newText } = facts;
  if (changed.length === 0 && removalSites.length === 0) return 'none';
  if (isAgentInstructionFile(path)) return 'drift';
  // Comments, test titles and imports, in any mix, are the drift pass's alone. A new file
  // compares with nothing, so one that holds only moved code and its imports goes there too.
  if (isScriptFile(path) && sameLines(strippedCode(path, oldText ?? ''), strippedCode(path, newText, new Set(moved)))) {
    return 'drift';
  }
  return 'all';
}

/** Changed lines of code that mark a file read whole: imports, comments, test titles and blank lines don't count. */
export const READ_WHOLE_CODE_LINES = 10;

/** Why a file is read whole, or null when it is read at its listed lines. */
export function readWholeReason(
  facts: Pick<FileFacts, 'path' | 'isNew' | 'changed' | 'moved' | 'newText'>,
  marked: ReadonlySet<string>,
): string | null {
  const kinds = lineKinds(facts.path, facts.newText);
  const codeLines = facts.changed.filter(line => kinds[line - 1] === 'code').length;
  // A new file whose only code moved there has nothing new to read whole.
  if (facts.isNew && (facts.moved.length === 0 || codeLines > 0)) return 'new file';
  if (codeLines >= READ_WHOLE_CODE_LINES) return `${codeLines} changed lines of code`;
  return marked.has(facts.path) ? 'marked by the orchestrator' : null;
}
