# A5 - Wiki and Test Plan Heirarchy Updates

**Type:** tech-debt story · **Written:** 2026-09-26 by Nathan · **Ready for:** further grooming

## Goal

During A3 Test Plan Rules and Sweep it was noticed that a project side bar test case was incorrectly mapped into a board-drag-interaction test plan. This appears to be stem from the fact that there is no appropriate home for project sidebar behavior so those rules were folded into the board-drag-interaction section. And then the test cases were written to match the wiki layout. We should address all know behavior/rule mismatches, but also do a full sweep through the wiki looking for more. Behaviors and Rules that do not belong in the current section should be moved to an appropriate home, with new sections created for rules that don't yet have a home. Ask Nathan for input when it is unclear. When Wiki rules move we should also rehome any related test cases, and also double check if the automation tests are living in appropriate files.

We'll also address nailing down some rules that were deferred out of A3

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

*Added by Nathan on behalf of The Coder (2026-09-30):*
- **Re-point comments when a rule moves.** it matters because the checker can't catch it: §7 and §7.1 still exist after the sidebar's rules move out, so stale pointers pass. The sites are:
  - useProjectDragReorder.ts's header;
  - projectTreeUtils.ts::fullChildrenOf;
  - hierarchyPlacement.ts's header and root CLAUDE.md's "One position math layer", which cite §7/§7.1 for the rule the board and sidebar share.

### D2 harden item movement rules and fix mismatches

Address `Pending PO` cases, where the wiki is silent and the code has chosen:

13. **ATT-1.13.** A write that leaves an item attached, but names a workphase other than its parent's: is it refused, or accepted with the workphase ignored? Moving an item refuses it today, and creating one ignores it.
14. **ATT-4.13.** Must an item's parent picker offer legal parents from other projects? §7 says the UI and the API must agree, and the API accepts them. The picker lists only the item's own project today.
15. **ATT-5.7.** A create under a parent that names a different project: is it refused (today), or does the item take the parent's project, as a reparent's cascade does?
16. **ATT-5.8.** May a write name a workphase from a workflow the item's project doesn't use, either without a reparent or in the same write as a cross-workflow reparent, re-filing the item in one step? The move endpoint refuses both today.

**Nathan Rulings:**
13. **ATT-1.13.** First of all, The UI should never make this request. If the UI were to do this then that is a bug. It should know that if an item is moved out from its parent and into a new workphase that means A: it is becoming detached when the new workphase is also assigned or B: it is being reparented and adopting the parent's workphase. The API itself can be relatively more permisive and allow the Request to happen. The UI should know to look at attachment status first, if it's attached then show it alongside the parent, ignoring workphase. If the item is detached then show it free in the workphase column amongst peers
14. **ATT-4.13.** Item parent picker is on the Item Sheet and should probably live in a seperate space from where it lives in the current wiki heirarchy. I'd. Rules that describe Sheet components should fall into a bucket of work that is classified as in-progress and minimally functioning code is good enough until we get to epic 7
15. **ATT-5.7.** Children must have the same project as their parent. A POST call probably should allow either a projectId or a parentId (requiring at least 1). If projectId only is provided then we assume the Item is root level. If parentId only is provided then the child adopts the parent's project, if both are provided and agree then that is fine. If they disagree then refuse the create and say why.
16. **ATT-5.8.** Similar to #13, this should never happen via the UI, but we don't need to gate the API. If the data ever does find itself with a workphase that doesn't match the workflow then the unsorted column should handle it.

*Added by the Test Planner, from A3 batch 4's Stop 1 (2026-09-28):*
- **Nathan's two further rulings, for the PO to write into the wiki:**
  - **A parentless item may hold the attachment flag.**
    - Free is derived: an item is Free when it has no parent or its flag is clear.
    - Tests check all four combinations of parent and flag. A Free item renders as a Card in its column, and an Attached one inside its ancestor's Card.
    - The UI sends no flag when it creates a top-level item.
    - This reverses item-attachment §1's stored-row invariant. It also touches §4: does a reparent that omits the flag keep a flag the item already holds? And it touches §11: does a reparent to root still clear the flag?
  - **Tags get no tests until the fuller tags system.** Item-attachment §12's tags would be marked `**Planned:**`.
- **Cases routed here by ID, all `Pending PO`:**
  - ATT-1.8 and 3.11 (the flag);
  - ATT-1.10 (tags);
  - ATT-4.12 and 4.13 (the Sheet's parent picker; ruling 14);
  - ATT-1.13, 5.7 and 5.8 (rulings 13, 15 and 16).

  Once the wiki states each answer, the Test Planner keeps, changes or deletes the case.

- **Tests to check the answers against,** from A3 batch 4's confirming run. Each is named by file and title.
  - **Stamped ATT-1.8, and they invert if Ruling A is written in:** `items.hierarchy.test.ts`'s "ATT-1.8: rejects isAttached: true with no resulting parent" and "ATT-1.8: PUT rejects a parentless attach".
  - **They assert that clearing the parent clears the flag, which is ATT-1.8's question:**
    - `items.hierarchy.test.ts`'s "ATT-1.8, ATT-7.7: reparent to root (parentId: null) clears the flag…";
    - `items.test.ts`'s "ATT-7.7: reparenting to null while attached clears isAttached and keeps the workphase".

    ATT-7.7 no longer asserts the flag, so it stays `Automated` whatever the answer.
  - **They depend on a parentless create storing the flag.** Re-check them after the answer:
    - ATT-1.1's test in `items.test.ts`: its top-level item holds that flag, and still reads Free;
    - `items.hierarchy.test.ts`'s "ATT-4.7: a tree already past the cap loads…": its chain is attached only through that flag. Without the flag, its reorder is among Free items, not among attached siblings.
    - `items.test.ts`'s "creates a parentless item with isAttached true (the default)…". It pins ATT-1.8's answer today, and since batch 5 it carries TC-2.17 too, whose `positionScope` assertion holds under either answer but needs a parentless item that holds the flag.
  - **They carry no case ID, and pin today's answer:**
    - **ATT-1.13:**
      - `items.hierarchy.test.ts`'s "rejects a workphaseId that contradicts the parent an attached item inherits from…", where the move refuses;
      - `items.test.ts`'s "an attached child inherits the parent workphase even when a different one is passed", where the create ignores it.

      Ruling 13 lets the API allow the write, so the first would invert.
    - **ATT-3.11 and ATT-4.12:** `attached-children.spec.ts`'s "the Parent dropdown excludes descendants, and reparenting nests the item under its new parent".
      - In it, a top-level item attaches on a reparent that omits the flag, and the picker applies no cap.
      - `items.test.ts`'s "accepts reparenting under a parent in a different project…" makes the same reparent, but asserts nothing about the flag.
    - **ATT-5.7:** `items.test.ts`'s "rejects creating a child whose projectId differs from its parent", which ruling 15 keeps.
    - **ATT-5.8:** `items.hierarchy.test.ts`'s "rejects a workphaseId from a workflow the item's project does not use…" and "rejects a one-step reparent into a different-workflow project that also names a workphaseId". Both invert if the wiki drops the refusal (ruling 16).
    - **ATT-1.10 and 4.13:** none.
  - **Misstamped:** `items.hierarchy.test.ts`'s "ATT-3.9, ATT-3.10: a Free item can be reparented…" reparents a top-level item, which is ATT-3.11's scenario.
    - A3's close-out drops ATT-3.9 from its title.
    - Whether it gains ATT-3.11 depends on the answer. Its flag is clear, so it stays Free either way.

*Added by the Test Planner, from A3 batch 5's Stop 1 (2026-09-29):* three item-positioning cases, all `Pending PO`, routed here by Nathan. A3's Open questions 17, 19 and 20 hold the full questions. The batch 5 report (`test-reconciliation-a3-item-positioning.md`, in `docs/audits/` and then `docs/archive/`) lists, in its Addendum, the tests that pin today's behavior for each.
- **TC-7.18 (Ruling C): the `positionScope` of an item left in another workflow's workphase.** It goes "alongside the other item movement cases" (Nathan).
  - Item-positioning §7.3 says `"none"`. §2's list of `"none"` cases doesn't include it, and the API returns `"workflow"`.
  - The Test Planner's view: `"none"`. §7.3 nulls the item's position because it has no meaningful comparison scope, which is what `"none"` means. §2's list would gain the case, and the code follow.
- **TC-2.32: a write that names a final position.** Item-positioning §2 says a write carries relative intent. The API also accepts a raw `position` on a move, and a reorder endpoint that sets positions outright. Scripts and test setup use both, and no client calls the reorder endpoint. Is it part of the API, or to be retired?
  - *Added by the PO, from A4's sweep (2026-09-30):* no client code sends a raw `position` on a move either, per the Coder. The client's wrapper for the reorder endpoint, `api/items.ts::reorderItems`, has no caller.
- **TC-6.10: two done items with the same `completedAt`.** What orders them? The client puts the one created first ahead today.

*Added by the Test Planner, from A3 batch 6's Stop 1 (2026-09-29):* one more item-positioning case, `Pending PO`, routed here by Nathan beside TC-6.10.
- **TC-6.13: several Free items made done, or reopened, by one flag change.** Making a workphase terminal completes all its Free items in one write, so they tie on `completedAt` (TC-6.10). Clearing the flag reopens them all, and item-positioning §2 gives each a fresh position by the append fallback, but doesn't say in which order. Does the done list keep their active order, and does reopening restore their done order?
  - The server keeps the order both ways today. `server/tests/routes/workphases.test.ts`'s two flag tests pin it: 'backfills items on a non-terminal -> terminal flip…' and 'backfills items on a terminal -> non-terminal flip…'.
  - The flag change itself (TC-6.11 and 6.12) is routed to Epic 4's done-column rework, which may retire the flag. The answer may belong there too.

*Added by the PO, from A4's handoff (2026-09-30):* one more item-attachment question, routed here by Nathan beside Ruling A.
- **A create with a parent and no attachment flag: is the child Attached or Free?** The code makes it Attached, per the Coder. No section says so.
  - §4's "Nothing attaches by default" is about reparenting, but read on its own it says Free.
  - §11a's "whether it's attached to it" implies that a create makes a choice, but doesn't give the default.
  - Ruling A's §4 question, whether a reparent that omits the flag keeps a flag the item already holds, is the same kind of default, seen from the reparent side.
  - **The PO recommends Attached, unless the create clears the flag.**
    - Under §11, an item becomes Free only by an explicit detach, so a child created Free would be detached without anyone detaching it.
    - It also fits Ruling A, where every create sets the flag.
    - Write it with Ruling A, since both rewrite §1 and §4. §4's sentence would narrow to "No reparent attaches by default."
  - The Test Planner checks whether a case already covers it.

Once the wiki states each answer, the Test Planner keeps, changes or deletes the case.

### D3 Write boards-columns-unsorted out in full

*Added by the PO, from A4's handoff (2026-09-30):* Nathan folded this in. A2 handed it off as a follow-up story, which was never written.

The page states only the core rules so far, as unnumbered bullets, and it has no test plan. This story:
- **numbers its sections,** so code comments can cite them and the Test Planner can derive cases from them;
- **takes the rules the code has that the page doesn't state,** each as a ruling for Nathan before it's written, as with A4's handoff items:
  - `DELETE /boards/:id` refuses a workflow's last board with a 409;
  - `POST` and `PUT /api/columns` return a 400 for a range whose start comes after its end, or whose workphases aren't in the board's workflow;
  - `unsorted` also carries `needsAttention`, which the page doesn't describe;
- **gets the page a test plan,** written by the Test Planner. The page already uses the API's field names, which the Test Planner asked for during A2;
- **hands the Coder A4's D4 table for this page,** which maps each rule to its main enforcing site, so the new section numbers get their index pointers.

The page states today's behavior. A later epic reworks how columns and workphases relate (Nathan, 2026-09-30), and when isn't known.

If A5 grows too big, this decision splits out into a story of its own.

### D4 Re-point comments when a rule moves

## Work, in batches

## Code map

## Acceptance

## Handoff

