# A5 - Wiki and Test Plan Heirarchy Updates

**Type:** tech-debt story · **Written:** 2026-09-26 by Nathan · **Ready for:** further grooming

## Goal

During A3 Test Plan Rules and Sweep it was noticed that a project side bar test case was incorrectly mapped into a board-drag-interaction test plan. This appears to be stem from the fact that there is no appropriate home for project sidebar behavior so those rules were folded into the board-drag-interaction section. And then the test cases were written to match the wiki layout. We should address all know behavior/rule mismatches, but also do a full sweep through the wiki looking for more. Behaviors and Rules that do not belong in the current section should be moved to an appropriate home, with new sections created for rules that don't yet have a home. Ask Nathan for input when it is unclear. When Wiki rules move we should also rehome any related test cases, and also double check if the automation tests are living in appropriate files. 

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

## Work, in batches

## Code map

## Acceptance

## Handoff

