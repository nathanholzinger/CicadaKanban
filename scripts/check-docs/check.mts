// One file, end to end: extract its checkable text, run every rule over it, then apply its
// ignore markers. A marker that's malformed, or that covers nothing, is itself a finding,
// so exceptions stay visible and can't go stale.

import { extractBruno, extractCode, extractMarkdown, type Extracted, type IgnoreMarker } from './extract.mts';
import { isBruno, isCode, isInTestPlans, isInWiki, wikiPageOfReadme } from './files.mts';
import type { RepoIndex } from './repoIndex.mts';
import { checkSegment, isRuleId, type FileContext, type Finding } from './rules.mts';

/**
 * `only` limits what's reported to the named rules. Every rule still runs, so a marker is
 * judged as in a full run: one that names several rules counts as used when any of them
 * fires, a rule that isn't reported included.
 */
export function checkFile(
  rel: string,
  text: string,
  index: RepoIndex,
  only: ReadonlySet<string> | null = null,
): Finding[] {
  const context = contextOf(rel);
  const { segments, markers } = extract(rel, text);
  const findings = segments.flatMap((segment, i) => {
    const previous = segments[i - 1];
    const continues = previous?.source === segment.source && previous.line === segment.line - 1;
    return checkSegment(segment, context, index, continues ? previous.text : null);
  });
  return applyMarkers(findings, markers, only).sort((a, b) => a.line - b.line || a.col - b.col);
}

function extract(rel: string, text: string): Extracted {
  if (isBruno(rel)) return extractBruno(text);
  return isCode(rel) ? extractCode(rel, text) : extractMarkdown(text);
}

export function contextOf(rel: string): FileContext {
  return { path: rel, inWiki: isInWiki(rel), wikiPage: wikiPageOfReadme(rel), inTestPlans: isInTestPlans(rel) };
}

function applyMarkers(findings: Finding[], markers: IgnoreMarker[], only: ReadonlySet<string> | null): Finding[] {
  const kept: Finding[] = [];
  const valid = markers.filter(marker => markerProblem(marker) === null);
  const used = new Set<IgnoreMarker>();
  // A marker naming no rule, or an unknown one, may be a typo of a reported rule.
  const reported = (marker: IgnoreMarker): boolean =>
    only === null || marker.rules.length === 0 || marker.rules.some(rule => only.has(rule) || !isRuleId(rule));

  for (const marker of markers) {
    const problem = markerProblem(marker);
    if (problem && reported(marker))
      kept.push({ rule: 'ignore-marker', line: marker.line, col: marker.col, message: problem });
  }
  for (const finding of findings) {
    const marker = valid.find(m => m.targetLine === finding.line && m.rules.includes(finding.rule));
    if (marker) used.add(marker);
    else if (only === null || only.has(finding.rule)) kept.push(finding);
  }
  for (const marker of valid) {
    if (used.has(marker) || !reported(marker)) continue;
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
  const unknown = marker.rules.filter(rule => !isRuleId(rule));
  if (unknown.length > 0) return `the marker names unknown rules: ${unknown.join(', ')}`;
  if (marker.reason === '') return 'the marker gives no reason after " -- "';
  return null;
}
