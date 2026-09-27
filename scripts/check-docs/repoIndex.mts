// What the rules look up in the rest of the repo: each wiki page's section numbers, the
// code files a `file::symbol` reference can name and the symbols each declares, and the
// transient docs a living doc must not point at.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { scriptKindOf } from './extract.mts';
import { TRANSIENT_DIR, isSkippedDir, walkFiles } from './files.mts';

export interface RepoIndex {
  /** Undefined when no wiki page has that name. */
  wikiSections(page: string): ReadonlySet<string> | undefined;
  /** Code files whose path is `ref` or ends with `/ref`. */
  codeFilesMatching(ref: string): string[];
  declaredSymbols(file: string): ReadonlySet<string>;
  isTransientFile(rel: string): boolean;
  /** Matches the name of a transient doc that no living file shares; null when there are none. */
  transientNamePattern: RegExp | null;
}

export interface IndexSource {
  /** Page name → the page's README text. */
  wikiPages: ReadonlyMap<string, string>;
  codeFiles: readonly string[];
  readCode: (file: string) => string;
  transientFiles: readonly string[];
  /** Names of files outside the transient folders, so a shared name like README.md never matches. */
  otherFileNames: ReadonlySet<string>;
}

const CODE_FILE = /\.(?:tsx?|mts|cts|jsx?|mjs|cjs)$/;
const SECTION_HEADING = /^#{1,6}\s+§?(\d+[a-z]?(?:\.\d+)*)\.?(?:\s|$)/;
const WIKI_PAGE_README = /^docs\/wiki\/([^/]+)\/README\.md$/;

export function buildIndex(source: IndexSource): RepoIndex {
  const sections = new Map([...source.wikiPages].map(([page, text]) => [page, headingSections(text)]));
  const symbols = new Map<string, Set<string>>();
  const transientFiles = new Set(source.transientFiles);
  const transientNames = [...new Set(source.transientFiles.map(file => path.posix.basename(file)))]
    .filter(name => !source.otherFileNames.has(name))
    .sort((a, b) => b.length - a.length);

  return {
    wikiSections: page => sections.get(page),
    codeFilesMatching: ref => source.codeFiles.filter(file => file === ref || file.endsWith(`/${ref}`)),
    declaredSymbols: file => {
      let names = symbols.get(file);
      if (!names) {
        names = declaredNames(file, source.readCode(file));
        symbols.set(file, names);
      }
      return names;
    },
    isTransientFile: rel => transientFiles.has(rel),
    transientNamePattern:
      transientNames.length === 0
        ? null
        : new RegExp(`(?<![\\w/.-])(?:${transientNames.map(escapeRegExp).join('|')})(?![\\w-])`, 'g'),
  };
}

export function loadIndex(root: string): RepoIndex {
  const read = (rel: string): string => readFileSync(path.join(root, rel), 'utf8');
  const all = walkFiles(root, '', isSkippedDir);
  const wikiPages = new Map<string, string>();
  for (const file of all) {
    const page = WIKI_PAGE_README.exec(file)?.[1];
    if (page) wikiPages.set(page, read(file));
  }
  return buildIndex({
    wikiPages,
    codeFiles: all.filter(file => CODE_FILE.test(file) && !file.startsWith('docs/')),
    readCode: read,
    transientFiles: all.filter(file => TRANSIENT_DIR.test(file)),
    otherFileNames: new Set(all.filter(file => !TRANSIENT_DIR.test(file)).map(file => path.posix.basename(file))),
  });
}

/** Section numbers from a page's headings, skipping fenced blocks. */
export function headingSections(text: string): Set<string> {
  const found = new Set<string>();
  let inFence = false;
  for (const line of text.split('\n')) {
    if (/^ {0,3}(?:`{3,}|~{3,})/.test(line)) {
      inFence = !inFence;
      continue;
    }
    const section = inFence ? undefined : SECTION_HEADING.exec(line)?.[1];
    if (section) found.add(section);
  }
  return found;
}

/** Every name the file declares at any depth: functions, variables, types, members. */
export function declaredNames(fileName: string, text: string): Set<string> {
  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, false, scriptKindOf(fileName));
  const names = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isExportSpecifier(node)) names.add(node.name.text);
    else if (isNamedDeclaration(node) && node.name && ts.isIdentifier(node.name)) names.add(node.name.text);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return names;
}

type NamedDeclaration = ts.Node & { name?: ts.Node };

function isNamedDeclaration(node: ts.Node): node is NamedDeclaration {
  return (
    ts.isVariableDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isEnumMember(node) ||
    ts.isModuleDeclaration(node) ||
    ts.isPropertySignature(node) ||
    ts.isPropertyDeclaration(node) ||
    ts.isPropertyAssignment(node) ||
    ts.isShorthandPropertyAssignment(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isMethodSignature(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isBindingElement(node)
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
