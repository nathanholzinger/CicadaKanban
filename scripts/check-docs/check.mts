// One file, end to end: extract its checkable text, run every rule over it, then apply its
// ignore markers. A marker that's malformed, or that covers nothing, is itself a finding,
// so exceptions stay visible and can't go stale.

import { extractCode, extractMarkdown, type IgnoreMarker } from './extract.mts';
import { isCode } from './files.mts';
import type { RepoIndex } from './repoIndex.mts';
import { RULE_IDS, checkSegment, type FileContext, type Finding } from './rules.mts';

export function checkFile(rel: string, text: string, index: RepoIndex): Finding[] {
  const context = contextOf(rel);
  const { segments, markers } = isCode(rel) ? extractCode(rel, text) : extractMarkdown(text);
  const findings = segments.flatMap((segment, i) => {
    const previous = segments[i - 1];
    const continues = previous?.source === segment.source && previous.line === segment.line - 1;
    return checkSegment(segment, context, index, continues ? previous.text : null);
  });
  return applyMarkers(findings, markers).sort((a, b) => a.line - b.line || a.col - b.col);
}

export function contextOf(rel: string): FileContext {
  return {
    path: rel,
    inWiki: rel.startsWith('docs/wiki/'),
    wikiPage: /^docs\/wiki\/([^/]+)\/README\.md$/.exec(rel)?.[1] ?? null,
  };
}

function applyMarkers(findings: Finding[], markers: IgnoreMarker[]): Finding[] {
  const kept: Finding[] = [];
  const valid = markers.filter(marker => markerProblem(marker) === null);
  const used = new Set<IgnoreMarker>();

  for (const marker of markers) {
    const problem = markerProblem(marker);
    if (problem) kept.push({ rule: 'ignore-marker', line: marker.line, col: marker.col, message: problem });
  }
  for (const finding of findings) {
    const marker = valid.find(m => m.targetLine === finding.line && m.rules.includes(finding.rule));
    if (marker) used.add(marker);
    else kept.push(finding);
  }
  for (const marker of valid) {
    if (used.has(marker)) continue;
    kept.push({
      rule: 'ignore-marker',
      line: marker.line,
      col: marker.col,
      message: `nothing on the next line breaks ${marker.rules.join(', ')}; remove the marker`,
    });
  }
  return kept;
}

function markerProblem(marker: IgnoreMarker): string | null {
  if (marker.rules.length === 0) return 'the marker names no rule';
  const unknown = marker.rules.filter(rule => !(RULE_IDS as readonly string[]).includes(rule));
  if (unknown.length > 0) return `the marker names unknown rules: ${unknown.join(', ')}`;
  if (marker.reason === '') return 'the marker gives no reason after " -- "';
  return null;
}
