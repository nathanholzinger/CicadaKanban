import { describe, it, expect } from 'vitest';
import type { Project } from '../types';
import { makeProject } from '../test/projectFixture';
import { classifyTargets } from './dragTargets';

// Every depth case parameterizes on `cap` rather than a literal, so a change to the cap's
// value touches none of them.
const CAP = 6;

function project(id: string, parentId: string | null = null): Project {
  return makeProject(id, { parentId });
}

// A root -> ... chain of `length` projects named `${prefix}1..N`; returns them.
function chain(prefix: string, length: number): Project[] {
  const out: Project[] = [];
  for (let d = 1; d <= length; d++) out.push(project(`${prefix}${d}`, d === 1 ? null : `${prefix}${d - 1}`));
  return out;
}

// The sidebar's rule: every row is placed among siblings, so naming a row as the line's anchor
// gives the carried project that row's parent.
const everyRowSetsParent = () => true;

describe('classifyTargets over projects', () => {
  describe('a top-level row', () => {
    it('is a "parent" when it can take the carried project', () => {
      const { states, tiers } = classifyTargets('X', [project('X'), project('A')], CAP, everyRowSetsParent);
      expect(states.get('A')).toBe('valid');
      expect(tiers.get('A')).toBe('parent');
    });

    it('is an "anchor" when it is too deep for the carried project but the top level can take it', () => {
      // X's subtree is CAP - 1 levels tall, so it fits only at the top level: no row is a legal
      // parent, and the rows naming the top level (every root) are the anchors.
      const tall = chain('X', CAP);
      const { states, tiers } = classifyTargets(
        'X1',
        [...tall, project('A'), project('A1', 'A')],
        CAP,
        everyRowSetsParent,
      );
      expect(states.get('A')).toBe('depth-capped');
      expect(tiers.get('A')).toBe('anchor');
      // The row under it names A, which can't take X1.
      expect(tiers.get('A1')).toBe('neither');
      expect([...tiers.values()]).not.toContain('parent');
    });

    it('is "neither" when the carried subtree, already past the cap, fits nowhere, not even at the top level', () => {
      const { tiers } = classifyTargets('X1', [...chain('X', CAP + 1), project('A')], CAP, everyRowSetsParent);
      expect(tiers.get('A')).toBe('neither');
    });
  });

  describe('a row past the cap', () => {
    // X is a leaf. A chain T1..T{CAP + 1} is the target the cap cuts: T{CAP - 1} is the last
    // legal parent, T{CAP} is too deep but sits under it, and T{CAP + 1} sits under that.
    const T = (depth: number) => `T${depth}`;
    const projects = [project('X'), ...chain('T', CAP + 1)];

    it('is an "anchor" when its own parent can take the carried project', () => {
      const { tiers } = classifyTargets('X', projects, CAP, everyRowSetsParent);
      expect(tiers.get(T(CAP - 1))).toBe('parent');
      expect(tiers.get(T(CAP))).toBe('anchor');
    });

    it('is "neither" when its own parent can not, at any depth below it', () => {
      const { tiers } = classifyTargets('X', projects, CAP, everyRowSetsParent);
      expect(tiers.get(T(CAP + 1))).toBe('neither');
    });

    it('is an "anchor" whatever its parent when naming a row sets no parent', () => {
      const { tiers } = classifyTargets('X', projects, CAP, () => false);
      expect(tiers.get(T(CAP))).toBe('anchor');
      expect(tiers.get(T(CAP + 1))).toBe('anchor');
    });
  });

  describe('the carried project', () => {
    // X carries three levels of its own, a branch on the way down.
    const projects = [
      project('X'),
      project('X1', 'X'),
      project('X2', 'X1'),
      project('X3', 'X2'),
      project('X1b', 'X'),
      project('V'),
    ];
    const { states, tiers, subtreeIds } = classifyTargets('X', projects, CAP, everyRowSetsParent);

    it('has no tier, and its descendants are "neither" at every depth', () => {
      expect(tiers.has('X')).toBe(false);
      for (const id of ['X1', 'X2', 'X3', 'X1b']) {
        expect(states.get(id), id).toBe('cycle-forming');
        expect(tiers.get(id), id).toBe('neither');
      }
    });

    it('leaves every other row a tier of its own, off the same walk', () => {
      expect(tiers.get('V')).toBe('parent');
      expect(subtreeIds).toEqual(new Set(['X', 'X1', 'X2', 'X3', 'X1b']));
    });
  });
});
