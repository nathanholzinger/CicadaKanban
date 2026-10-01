# A5b — Wiki and Test-Plan Rehoming: the Project Sidebar and the Sheet

**Type:** tech-debt story · **Written:** 2026-09-26 by Nathan, as A5; split out on 2026-09-30 by the Architect · **Ready for:** planning, once A5a closes · **Sequenced:** after A5a, before A5c

## Goal

During A3 Test Plan Rules and Sweep it was noticed that a project side bar test case was incorrectly mapped into a board-drag-interaction test plan. This appears to be stem from the fact that there is no appropriate home for project sidebar behavior so those rules were folded into the board-drag-interaction section. And then the test cases were written to match the wiki layout. We should address all know behavior/rule mismatches, but also do a full sweep through the wiki looking for more. Behaviors and Rules that do not belong in the current section should be moved to an appropriate home, with new sections created for rules that don't yet have a home. Ask Nathan for input when it is unclear. When Wiki rules move we should also rehome any related test cases, and also double check if the automation tests are living in appropriate files.

*Split note (2026-09-30):* A5's item-movement rulings became A5a, and its boards-columns-unsorted write-up became A5c. This story keeps the rehoming: the project sidebar (D1), the Sheet (D2), the sweep for other misplaced rules (D3), and the comments that cite what moves (D4). Its one code change is the sidebar fix in D1.

## Decisions

### D1 project sidebar details mis-mapped into board-drag-interaction

DRAG-4.28 and several references to 'project sidebar' are incorreclty mapped into board-drag-interaction.

*Added by the Test Planner, from A3 batch 3 (2026-09-27):*
- **DRAG-4.26 is routed here by ID** (Nathan, at A3 batch 3's Stop 1). It's the sidebar's gap-and-depth placement with an indicator line. It's `Open`, and no sidebar drag test exists at any layer, so its test is written once it has moved to the sidebar's suite.
- **DRAG-4.28 and 4.31 are routed here too** (2026-09-28). The PO's §7.1 changes made both `Open`:
  - 4.28: no project can be tabbed shallower than the top level, and an empty sidebar hierarchy offers one state;
  - 4.31: the sidebar places against the real tree under a collapsed project.

  §7.1 now states both rules, so what moves is the rules and their cases.
- **Sidebar behavior that tests pin but no wiki page states** (from A3 batch 3's Reconciler report, candidate new case 5):
  - a named row inside the dragged subtree maps to the gap after the nearest eligible row before it;
  - the dragged project's descendants are dimmed during the drag;
  - a collapsed project opens when a project is dropped into it.
- **Moving the cases.** When the rules move, DRAG-4.26, 4.28 and 4.31 get new IDs in the sidebar's suite, and this plan lists old → new (A3 D4).
- **Tests to map once they move.** Client tests already pin DRAG-4.28's and 4.31's rules without carrying their IDs: hierarchyPlacement's null-root and collapsed-Top tests, and projectTreeUtils'. A3's confirming run lists them. They're internal, so each mapping needs Nathan's approval.

*Added by the Auditor, from A4's handoff (2026-09-30):* one sidebar gap, routed here by Nathan rather than to A6's audit.
- **The sidebar writes on a set-down in its own slot.** §7.1 says an item set back down in its own gap, at its own depth, writes nothing, since with full context the release can't move it. The board keeps to that (`descendantsProjection.ts::descendantsReleasePlacement`). The sidebar doesn't, per the Coder: once the pointer has left the project's own row and come back, `useProjectDragReorder.ts`'s `handleDragEnd` sends the move, and the server places the project between the same neighbors. Nothing visibly moves, but `position` and `updatedAt` change. A release before the pointer leaves its own row writes nothing.
  - §7.1 says "item", but its reason holds in the sidebar, which always has full context. When the sidebar's rules move, their new home says whether a set-down in its own slot writes (a ruling for Nathan).
  - If it writes nothing, this story carries one code fix: a check against the project's own slot before `onReorderProject`, like the board's. Its case goes in the sidebar's new suite.
  - **Ruled (Nathan, 2026-09-30):** it writes nothing, so this story carries the fix.

**The page's structure is the PO's call, at a stop** (Nathan, 2026-09-30). The Architect's guess: the sidebar gets a page of its own, and the gap-and-depth rule the board and the sidebar share stays on board-drag-interaction, with the sidebar's page pointing to it. Which way it goes sets how many comments D4 re-points.

### D2 The Sheet's rules get a page of their own

From A5's D2 (ATT-4.13, ruling 14):

> **ATT-4.13.** Item parent picker is on the Item Sheet and should probably live in a seperate space from where it lives in the current wiki heirarchy. Rules that describe Sheet components should fall into a bucket of work that is classified as in-progress and minimally functioning code is good enough until we get to epic 7

*Added by the Architect (2026-09-30), from A5's grooming:*
- **The bucket is a wiki page for the Sheet,** whose header says its rules stay provisional until the Work Item Detail & Chat UI epic (Epic 7 on today's roadmap). The docs have one marker, `**Planned:**`, which means decided but not built. The Sheet is the other way round: built, with its rules not settled. Whether the page's header is enough, or the standards guide needs a marker for it, is the Architect's call when this story is planned.
- **Its cases move there:** ATT-4.12 and 4.13, both `Pending PO`, routed here by ID from A5a. ATT-4.13's question (does the picker offer parents from other projects?) waits for the Sheet epic.
- **The over-cap picker is covered by the ruling, not fixed.** A4's handoff to Nathan: `hierarchy.ts::buildParentOptions` offers parents at which the item's subtree would exceed the depth cap, and picking one gets the API's 400. Item-attachment §7 says the UI never offers a target the API would refuse. Under ruling 14, the Sheet's page states the gap as provisional until the Sheet epic. The roadmap's Sheet epic already notes the fix.
- **A5a changes the Sheet's code, not its rules.** Under A5a's R6, the parent picker sends `isAttached: true` when reparenting a top-level item, which keeps today's behavior until the Work Item Detail & Chat UI epic. Nathan ruled it an implementation detail, so the page doesn't state it. A5a's handoff names anything else that changed.

### D3 The sweep for other misplaced rules

The Goal asks for a full sweep of the wiki, and a check that automated tests live in the right files. A2 already swept the wiki's wording, so (Nathan, 2026-09-30):
- **The wiki sweep** is a PO pass for rules on the wrong page only.
- **The test-file check** covers the tests for cases that move.

### D4 Re-point comments when a rule moves

*Added by Nathan on behalf of The Coder (2026-09-30):*
- **Re-point comments when a rule moves.** it matters because the checker can't catch it: §7 and §7.1 still exist after the sidebar's rules move out, so stale pointers pass. The sites are:
  - useProjectDragReorder.ts's header;
  - projectTreeUtils.ts::fullChildrenOf;
  - hierarchyPlacement.ts's header and root CLAUDE.md's "One position math layer", which cite §7/§7.1 for the rule the board and sidebar share.

From A4's handoff to A5 (`docs/archive/a4-code-comment-sweep.md`): every pointer A4 wrote cites the wiki as it stood. When a rule moves or is renumbered, the comments that cite it are found by searching for `wiki <page> §N`. Root `CLAUDE.md`'s citation goes to the Architect.

## Work, in batches

Written when this story is planned, after A5a closes.

## Code map

| File | Batch | Change |
|---|---|---|
| `client/src/components/sidebar/useProjectDragReorder.ts` | | The set-down fix (D1), and its header's pointer (D4) |
| `client/src/components/sidebar/projectTreeUtils.ts` | | `fullChildrenOf`'s pointer (D4) |
| `client/src/lib/hierarchyPlacement.ts` | | Its header's pointer (D4) |

## Acceptance

## Handoff

## Amendments
