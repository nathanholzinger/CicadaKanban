// The checker's rules: their IDs, and the matching each does over one segment of checkable
// text, against the file's context and the repo index.

import path from 'node:path';
import type { Segment } from './extract.mts';
import { TRANSIENT_DIR, TRANSIENT_FOLDERS, resolveLink, wikiPageAt } from './files.mts';
import type { RepoIndex } from './repoIndex.mts';

export const RULE_IDS = [
  'transient-id',
  'bare-section',
  'wiki-pointer',
  'symbol-ref',
  'bare-case-id',
  'claude-ref',
  'transient-link',
  'wiki-code-name',
  'case-id',
] as const;

export type RuleId = (typeof RULE_IDS)[number];

export const isRuleId = (name: string): name is RuleId => (RULE_IDS as readonly string[]).includes(name);

/** `ignore-marker` reports a marker that is malformed or covers nothing. */
export type FindingRule = RuleId | 'ignore-marker';

export interface Finding {
  rule: FindingRule;
  line: number;
  col: number;
  message: string;
}

export interface FileContext {
  /** Repo-relative, forward slashes. */
  path: string;
  inWiki: boolean;
  /** The page this file is, when it's a wiki page's README. */
  wikiPage: string | null;
  inTestPlans: boolean;
}

type Hit = (rule: RuleId, at: number, message: string) => void;

/**
 * `previousLine` is the text of the segment on the line before, from the same comment or
 * paragraph, so a reference wrapped across two lines still reads as one.
 */
export function checkSegment(
  segment: Segment,
  context: FileContext,
  index: RepoIndex,
  previousLine: string | null = null,
): Finding[] {
  const findings: Finding[] = [];
  const hit: Hit = (rule, at, message) => findings.push({ rule, line: segment.line, col: segment.col + at, message });
  const text = segment.text;
  const isCode = segment.source !== 'markdown';

  // A transient doc's name often contains an ID shape of its own; report it once, as a link.
  const linkSpans = transientLinks(text, context, index, hit);
  transientIds(text, isCode, linkSpans, hit);
  sectionRefs(text, previousLine, context, index, hit);
  if (!context.inWiki) symbolRefs(text, index, hit);
  if (isCode) {
    bareCaseIds(text, hit);
    claudeRefs(text, hit);
  }
  if (!isCode && context.inWiki) wikiCodeNames(text, hit);
  if (isCode || context.inTestPlans) caseIds(text, context, index, hit);
  return findings;
}

// ── transient-id ───────────────────────────────────────────────────────────────

// Matched by ID shape, never by the bare word: Epic, Story and Task are item types.
const TRANSIENT_IDS: readonly [RegExp, string][] = [
  [
    /\b(?:audit\s+)?(?:code-quality-audit-)?epic-[\d-]*\d(?:-story-\d+(?:-\d+)?)?(?:-reconciled)?(?:\s+watch-list)?\s*#\d+/gi,
    'an audit finding',
  ],
  [/\b(?:audit|reconciliation|watch-list)\b[^\n]{0,80}?#\d+/gi, 'an audit finding'],
  [/\bfindings?\s+#?\d+/gi, 'an audit finding'],
  [/\b(?:stor(?:y|ies)|epic)[ -]?\d+(?:\.\d+)*[a-z]?\b/gi, 'a story or epic ID'],
  [/\bphase[ -]?\d+(?:\.\d+)*\b/gi, 'a phase ID'],
  [/\bPhase [A-Z]\b/g, 'a phase ID'],
  [/\bL\d+-\d+[a-z]?\b/g, 'a ledger ID'],
  [/\bC-\d+\b/g, 'a ledger ID'],
  [/\bdecisions?\s+\d+[a-z]?\b/gi, 'a plan decision ID'],
  [/\b\d{4}-\d{2}-\d{2}\b/g, 'a date'],
  [/(?<=[(/])#\d{1,2}(?!\w)/g, 'an audit finding number'],
];

// In code, a bare hash-and-number can only be an audit finding. Markdown uses that form for
// its own numbered lists, so there it has to come with a word like "audit", or sit right
// after an opening parenthesis or a slash, the way audit tags are written.
const CODE_TRANSIENT_IDS: readonly [RegExp, string][] = [
  ...TRANSIENT_IDS,
  [/(?<![\w&#])#\d{1,2}(?!\w)/g, 'an audit finding number'],
];

type Span = [start: number, end: number];

const overlapsAny = (at: number, length: number, spans: readonly Span[]): boolean =>
  spans.some(([start, end]) => at < end && at + length > start);

function transientIds(text: string, isCode: boolean, excluded: readonly Span[], hit: Hit): void {
  for (const { at, found, what } of firstMatches(text, isCode ? CODE_TRANSIENT_IDS : TRANSIENT_IDS)) {
    if (overlapsAny(at, found.length, excluded)) continue;
    hit('transient-id', at, `"${found}" is ${what}; write the fact it stands for instead`);
  }
}

/** Every pattern's matches, keeping only the earliest (then longest) of any that overlap. */
function firstMatches(
  text: string,
  patterns: readonly [RegExp, string][],
): { at: number; found: string; what: string }[] {
  const all = patterns
    .flatMap(([pattern, what]) =>
      [...text.matchAll(pattern)].map(match => ({ at: match.index, found: match[0], what })),
    )
    .sort((a, b) => a.at - b.at || b.found.length - a.found.length);
  const kept: typeof all = [];
  let coveredUntil = -1;
  for (const match of all) {
    if (match.at < coveredUntil) continue;
    kept.push(match);
    coveredUntil = match.at + match.found.length;
  }
  return kept;
}

// ── bare-section, wiki-pointer ─────────────────────────────────────────────────

const SECTION_REF = /(?:\bwiki\s+(<[^>\n]*>|[a-z0-9][a-z0-9-]*)\s+)?§\s?(\d+[a-z]?(?:\.\d+)*)/g;
/** "wiki <page>" at the end of the text before a section, when it wrapped onto the line above. */
const WIKI_PREFIX = /\bwiki\s+(<[^>\n]*>|[a-z0-9][a-z0-9-]*)\s*$/;
/** What may sit between two references that share a page. */
const JOINER = /^\s*(?:,|and|or|&|\/|–|-)\s*$/;
/** A Markdown link's target, in the first group. */
const LINK = /\]\(([^)\s]+)\)/;
const LINK_BEFORE = new RegExp(`${LINK.source}\\s*$`);
/** Nothing but indentation, a comment leader or a list marker. */
const LINE_START = /^[\s/*>#-]*$/;
const WORD_BEFORE = /(?<![\w/.-])([a-z0-9][a-z0-9-]*)\s*$/;

function sectionRefs(
  text: string,
  previousLine: string | null,
  context: FileContext,
  index: RepoIndex,
  hit: Hit,
): void {
  let previousPage: string | null = null;
  let previousEnd = -1;
  for (const match of text.matchAll(SECTION_REF)) {
    const at = match.index;
    const section = match[2];
    const before = text.slice(0, at);
    const lead = LINE_START.test(before) && previousLine !== null ? `${previousLine} ` : before;
    let page: string | null = match[1] ?? WIKI_PREFIX.exec(lead)?.[1] ?? null;
    let followsNonWikiLink = false;

    if (page === null && previousPage !== null && JOINER.test(text.slice(previousEnd, at))) page = previousPage;
    // A wiki page named without the "wiki" prefix or a link isn't a pointer, even in the wiki.
    const named: string | undefined = page === null ? WORD_BEFORE.exec(lead)?.[1] : undefined;
    const namedPage: string | null =
      named !== undefined && named !== context.wikiPage && index.wikiSections(named) ? named : null;
    if (page === null && namedPage === null && context.inWiki) {
      const link = LINK_BEFORE.exec(lead);
      if (link) {
        const target = resolveLink(context.path, link[1]);
        page = target === null ? null : wikiPageAt(target);
        followsNonWikiLink = page === null;
      } else {
        page = context.wikiPage;
      }
    }
    previousPage = page ?? namedPage;
    previousEnd = at + match[0].length;

    if (followsNonWikiLink || page?.startsWith('<')) continue;
    if (page === null) {
      const fix = `write "wiki ${namedPage ?? '<page>'} §${section}"${context.inWiki ? ' or link the page' : ''}`;
      if (context.inWiki) hit('wiki-pointer', at, `§${section} doesn't say which page it's on; ${fix}`);
      else hit('bare-section', at, `§${section} names no page; ${fix}`);
      continue;
    }
    const sections = index.wikiSections(page);
    if (!sections) hit('wiki-pointer', at, `there is no wiki page "${page}"`);
    else if (!sections.has(section)) hit('wiki-pointer', at, `wiki ${page} has no §${section}`);
  }
}

// ── symbol-ref ─────────────────────────────────────────────────────────────────

const SYMBOL_REF = /(?<![\w./-])((?:[\w.-]+\/)*[\w.-]+\.(?:tsx|ts|mts|cts|jsx|js|mjs|cjs))::([A-Za-z_$][\w$]*)/g;

function symbolRefs(text: string, index: RepoIndex, hit: Hit): void {
  for (const match of text.matchAll(SYMBOL_REF)) {
    const [, file, symbol] = match;
    const files = index.codeFilesMatching(file);
    if (files.length === 0) {
      hit('symbol-ref', match.index, `no code file matches "${file}"`);
    } else if (files.length > 1) {
      hit(
        'symbol-ref',
        match.index,
        `"${file}" matches ${files.length} files (${files.join(', ')}); add enough of the path to make it unique`,
      );
    } else if (!index.declaredSymbols(files[0]).has(symbol)) {
      hit('symbol-ref', match.index, `${files[0]} declares no "${symbol}"`);
    }
  }
}

// ── bare-case-id, claude-ref ───────────────────────────────────────────────────

function bareCaseIds(text: string, hit: Hit): void {
  for (const match of text.matchAll(/\bTC-\d+\b(?!\.\d)/g)) {
    hit('bare-case-id', match.index, `"${match[0]}" has no suite part; use the qualified case ID`);
  }
}

function claudeRefs(text: string, hit: Hit): void {
  for (const match of text.matchAll(/\.claude\/|\bCLAUDE\.md\b/g)) {
    hit('claude-ref', match.index, `code comments don't name agent-instruction files ("${match[0]}")`);
  }
}

// ── transient-link ─────────────────────────────────────────────────────────────

const TRANSIENT_PATH = new RegExp(
  String.raw`(?<![\w/.-])(?:[\w.-]+\/)*?docs\/(?:${TRANSIENT_FOLDERS.join('|')})\/[^\s\`'"()<>[\]]*`,
  'g',
);
const MARKDOWN_LINK = new RegExp(LINK.source, 'g');

/** Reports each reference to a transient doc, and returns where they are. */
function transientLinks(text: string, context: FileContext, index: RepoIndex, hit: Hit): Span[] {
  const spans: Span[] = [];
  const report = (at: number, length: number, what: string): void => {
    if (overlapsAny(at, length, spans)) return;
    spans.push([at, at + length]);
    hit('transient-link', at, `${what} is a transient doc; state what it says instead of pointing at it`);
  };

  for (const match of text.matchAll(TRANSIENT_PATH)) {
    const reference = match[0].replace(/[.,;:]+$/, '');
    const relative = reference.slice(reference.indexOf('docs/'));
    if (namesFile(relative, index)) report(match.index, reference.length, `"${reference}"`);
  }
  for (const match of text.matchAll(MARKDOWN_LINK)) {
    const resolved = resolveLink(context.path, match[1]);
    if (resolved !== null && TRANSIENT_DIR.test(resolved) && namesFile(resolved, index))
      report(match.index, match[0].length, `"${match[1]}"`);
  }
  if (index.transientNamePattern) {
    for (const match of text.matchAll(index.transientNamePattern))
      report(match.index, match[0].length, `"${match[0]}"`);
  }
  return spans;
}

/** A path past one of the transient folders that names a file, not just a folder. */
function namesFile(relative: string, index: RepoIndex): boolean {
  if (relative.endsWith('/') || !TRANSIENT_DIR.test(relative)) return false;
  return index.isTransientFile(relative) || /\.[a-z0-9]+$/i.test(path.posix.basename(relative));
}

// ── wiki-code-name ─────────────────────────────────────────────────────────────

/** Relative links to other docs; blanked before looking for code names. */
const DOC_LINK = /\]\((?![a-z]+:)[^)\s]*\.md(?:#[^)\s]*)?\)/gi;
const CODE_NAMES: readonly [RegExp, string][] = [
  [/(?<![\w$./-])[\w$./-]*[\w$]::[A-Za-z_$][\w$]*/g, 'a "::" code name'],
  [/(?<![\w/.-])(?:[\w.-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:tsx|ts|mts|cts|jsx|js|mjs|cjs|css|sql)(?![\w-])/g, 'a code file'],
  [/(?<![\w/.-])(?:client|server|tests|scripts)\/[\w./-]*[\w-]/g, 'a code path'],
];

function wikiCodeNames(text: string, hit: Hit): void {
  const visible = text.replace(DOC_LINK, link => ' '.repeat(link.length));
  for (const { at, found, what } of firstMatches(visible, CODE_NAMES)) {
    hit('wiki-code-name', at, `"${found}" is ${what}; the wiki describes behavior, not code`);
  }
}

// ── case-id ────────────────────────────────────────────────────────────────────

const NEXT_ID_LINE = /^\*\*Next ID:\*\*\s*/;

function caseIds(text: string, context: FileContext, index: RepoIndex, hit: Hit): void {
  if (!index.caseIdPattern) return;
  const ownCases = index.suiteCases(context.path);
  const nextIdAt = ownCases ? NEXT_ID_LINE.exec(text)?.[0].length : undefined;
  for (const match of text.matchAll(index.caseIdPattern)) {
    const id = match[0];
    if (ownCases && match.index === nextIdAt) checkNextId(id, ownCases, match.index, hit);
    else if (!index.hasCase(id)) hit('case-id', match.index, `no case "${id}" in the test-plan catalog`);
  }
}

// A suite's Next ID names a case that doesn't exist yet, by design. It's checked the other
// way instead: it has to be past every case the suite already has, so no ID is reused.
function checkNextId(id: string, ownCases: readonly string[], at: number, hit: Hit): void {
  const { suite, number } = splitCaseId(id);
  const sameSuite = ownCases.map(splitCaseId).filter(own => own.suite === suite);
  if (ownCases.length > 0 && sameSuite.length === 0) {
    hit('case-id', at, `Next ID ${id} names another suite; this file's cases are ${splitCaseId(ownCases[0]).suite}`);
    return;
  }
  const highest = sameSuite.reduce<number>((max, own) => Math.max(max, own.number), 0);
  if (number <= highest) {
    hit(
      'case-id',
      at,
      `Next ID ${id} must be past ${suite}.${highest}, this suite's highest case; IDs are never reused`,
    );
  }
}

function splitCaseId(id: string): { suite: string; number: number } {
  const dot = id.lastIndexOf('.');
  return { suite: id.slice(0, dot), number: Number(id.slice(dot + 1)) };
}
