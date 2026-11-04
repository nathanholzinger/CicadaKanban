# Epic 3.5 Story 8.5 — The drag-target cues say what a target can be

**Type:** story · **Written:** 2026-11-02 by the Architect, from the PO's Story 6 hands-on finding (2026-09-24). Widened 2026-11-03 by Nathan · **Status:** built, for review and commit; the handoff is written

## Goal

While an item is dragged, every target on the board shows what it can be to the carried item, by how strongly it's drawn:

| Tier | What the target can be | Drawn at |
|---|---|---|
| **Full** | An anchor, and a parent | Full strength |
| **MO** | An anchor, but not a parent | Mid opacity |
| **LO** | Not even an anchor | Low opacity |

MO and LO name tuning values, not fixed numbers: 0.6 and 0.3 to start.

**Why it widened** (Nathan, 2026-11-03, reviewing Phase 1). The story began as a mark for a dragged Stub's own descendant rows. Working through it showed that the Depth-capped dim can be read as "not a neighbor either", when it means only "not a parent". So the cues now sort targets by what the user can do with them, not by why.

**What happens today** (wiki board-drag-interaction §4, §6.1, §7.2):
- **The guards are right.**
  - A Cycle-forming or Depth-capped Card can still be named for a reposition, but it's never zoomed into (§6.1).
  - A dragged Stub carries its whole subtree, whose rows are passed over, never named (§7.2).
  - A state over the cap at the Descendants layer is reachable, and a release there commits nothing (§7.2).
- **The cues say less, and one of them says the wrong thing.**
  - A Free descendant gets the green ring (`dragChrome.tsx::dropTargetClass`).
  - Every target too deep to take the carried item gets the same Depth-capped dim, whether the ghost can sit beside it or not.
  - A Cycle-forming Stub row got nothing until Phase 1 marked it.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"):
- The Coder builds Nathan's tiers, and he tunes them hands-on.
- The PO and the Test Planner write the docs once he's approved them.
- No new drag specs. Unit and component tests work as usual.

**Out of scope:**
- **Carrying the children visibly,** the roadmap's second option, where the rows leave the section and ride with the carried copy. Removing rows at pickup shifts the layout under the cursor, the jump the morph's story is about. A taller carried copy also changes the box dnd-kit measures for collisions. If the hands-on finds the tiers aren't enough, that's a story of its own.
- **The final look.** The tiers' look is a working placeholder for "The cues' final look", which also takes up whether the drag cues drawn on an item keep their color (roadmap).
- **The other cues drawn on items,** which stay as they are, colored or not: the locked Card's outline, the zoom-in cue and the overflow row's hold cue, the ghost's over-cap outline, and the flash on an item a reload stopped.
- **The project sidebar.** Story 8.7 gives a project drag the same tiers.
- **A dragged Card's attached children.** They aren't drawn while it's dragged (§5a), so they have no row to dim.

## Scope

- **Wiki passages:** board-drag-interaction §4.1 now holds the tiers in place of §4's overlay assignments; §7.2, §7.3 and §9 clarify the drawn rows and modal tiers, and §10 holds the relative pending pulse. Project-tree §1's incidental board comparison is reworded without changing the sidebar's behavior.
- **Test-plan cases:**
  - **Retired:** DRAG-2.5 and DRAG-2.6, the removed overlay rules; DRAG-2.13, which asserted the removed relationship overlay during pending attachment changes. No ID is reused.
  - **New, Open:** DRAG-2.14 (Valid/Full), DRAG-2.15 (Free Card/Mid), DRAG-2.16 (Stub Mid/Low boundary), DRAG-2.17 (descendant rows remain Low and excluded), DRAG-2.18 (overflow tiers), DRAG-2.19 (tier lifetime), DRAG-2.20 (exempt representations and ghost opacity), DRAG-2.21 (content/line/nested-row isolation), DRAG-2.22 (no cue on dimmed targets) and DRAG-2.23 (pending-tree tiers).
  - **New, Open:** DRAG-6.23 (relative pulse endpoints) and DRAG-6.24 (pulse isolation from lines and nested rows).
  - **Revised:** DRAG-7.12 (modal classifications and tiers), DRAG-7.27 (overflow rows remain drawn at Low), and the non-visual subtree wording in DRAG-4.8, DRAG-4.18 and DRAG-4.35. Existing statuses and automation pointers await Reconciler review and are unchanged in this Planner pass.

## Inbound deferrals

- **From Story 6's hands-on** (roadmap, Story 8.5, PO, 2026-09-24): Phase D's finding, item 3. Phase 1's set covers it, and Phase 2's LO tier takes it in.
- No audit routed anything here.

## Approach and phases

### Decisions

**D1. Which tier each target takes.** It reads the drag-start classification (§4), where Valid means a legal parent for the carried item (`dragClassification.ts::isValidParent`).
- **Full:** the target is Valid.
- **MO:** it isn't Valid, but it can be an anchor:
  - **a Free Card that isn't Valid.** A Card in a column can be named for a reposition whatever its state (§6.1), and that sets no parent. So its own parent never matters, and a Free Card is never LO.
  - **a Stub row that isn't Valid, whose parent is.**
- **LO:** it can't be an anchor:
  - **a Stub row whose parent isn't Valid.** Named as the ghost's neighbor, it would give the carried item the same parent, and that parent can't take it, by a cycle or the cap. This covers the dragged Stub's own descendants (Phase 1's set), every Stub inside an MO Card, and a Stub too deep to sit beside.
  - **an overflow row whose owner isn't Valid.** It stands for the owner's hidden children, which are then all LO. Its hold never opens the modal there either, since the hold never starts in a state over the cap (`descendantsProjection.ts::modalHoldTarget`). An overflow row is never MO: it isn't an item, so it's never a parent. With a Valid owner it's Full, since the modal has places to offer.
- **The tier passes down** (Nathan's check, 2026-11-03). Every Stub under an MO or LO target is LO. An MO or LO target isn't Valid, so its children are LO. An LO row isn't Valid either: its parent fails by a cycle or the cap, and the row is in that parent's branch, a level deeper. So a row's tier needs only its own state and its parent's.
- **No tier:**
  - the dragged row, which takes the ghost's own value (D3);
  - the carried copy;
  - the static rows a section draws under the modal's backdrop;
  - a place that's no target at all (§4).
- **One tier for the whole drag, at every layer,** from pickup to the drag's end, whether a drop, a cancel or a forced stop. A tier is what a target can be at any point in the drag. At the column layer no Stub row is an anchor, and inside a Card no column Card is, but neither is dimmed for it. Dimming by layer would dim most of the board at every zoom in or out. After a drop the rows draw where the preview puts them, at full strength.

**D2. One derivation.**
- **The classification yields each target's tier once,** at drag start, beside `states` (`dragClassification.ts::classifyDragTargets`). It reads each item's parent from the same `items`, so the tier counts over the tree as the pending writes leave it, as the states do (§4). A Stub whose attach is in flight takes its new parent's state. One whose detach is in flight takes the Free Card rule, through `isStubOf`, which already splits the descendants.
- **`DragSessionContext.ts::useDropTargetState` exposes the tier** on `DropTargetView`. An overflow row reads its owner's state, in place of Phase 1's `useOverflowTravels`.
- **One test-surface attribute names the tier,** in place of Phase 1's `data-traveling`. `data-drop-state` stays.
- **Names say what a tier means,** not its opacity, since the opacity is a tuning value. The Coder picks them.
- **Removed:** `freeDescendantIds`, whose only reader is the green ring, and Phase 1's `attachedDescendantIds` and `isTraveling`, which the LO rule takes in. `subtreeIds` stays, for the projection's exclusion and `dragCollision.ts::travelingRowsFor`.

**D3. How the tiers draw.**
- **By opacity only, no color.** The green ring goes (`OVERLAY_FREE_DESCENDANT`, `overlayFreeDescendantColor`). Cards will get coloring of their own after the Tags & Type System epic.
- **Three tuning values,** beside the others in `dragTuning.ts`, each in the drag tuning panel:
  - MO, 0.6;
  - LO, 0.3;
  - the ghost's opacity, 0.3, in place of `useItemRow`'s fixed `opacity-30`. It's LO's value for now, kept separate so the two can part later.
- **They replace** `overlayDepthCappedOpacity`, and Phase 1's look switch, candidate B (greyed) and their values. The drag tuning panel is temporary: no wiki, no cases, no tests.
- **A row's tier dims its own content, and nothing it holds:**
  - **The drop line keeps full strength** on an MO row, which is a real anchor.
  - **A Card's Stubs show their own tier,** not the Card's on top of theirs. Every Stub in an MO Card is LO, and an inherited dim would draw it at MO × LO.
  - **The way is the Coder's.** One way is a content wrapper inside the row's root, for a Stub row and an overflow row; for a Card, keeping its section and its line out of its dim, or scaling its Stubs by LO ÷ MO. The Coder records which in Amendments.
  - **No box dnd-kit or the regions measure may change.** A Card's root is its Descendants region (`dragRegions.ts`).
- **The zoom-in cue and the hold cue never land on a dimmed target.** A dimmed Card never starts the zoom-in's dwell (§6.1), and an LO overflow row's hold never starts (D1).
- **The pending pulse is relative to the row's own opacity** (Nathan, 2026-11-03). A row with a write in flight pulses between its opacity and half of it: a Full row between 1 and 0.5, an LO row between LO and half of LO, and the ghost the same from its own value. Today's pulse dims every row toward a fixed 0.5 (`dragChrome.tsx::PENDING`, `animate-pulse`), the property the tiers use, so an LO row would brighten on each beat and an MO row barely move.
  - **It sits on the row's content, as the tier does,** so the drop line doesn't pulse.
  - **The way is the Coder's:** the pulse on a wrapper nested with the tier's, so the two multiply, or one keyframe that halves the row's own opacity.

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus `npm run test:e2e` where the phase says so.

**Phase 1: the carried rows' set and mark** (built, before the widening)
- The descendants drawn as Stubs, as a set in the classification, and a mark on their rows and on an overflow row whose owner travels, with two candidate looks in the panel.
- The gate passed. Code map and Amendments record what was built. Phase 2 reworks most of it.

**Phase 2: the tiers** (D1–D3)
- **The tier** in the classification, and its view in `useDropTargetState`, an overflow row's included.
- **The look:** MO, LO and the ghost's value, in the tuning and the panel. The green ring, the Depth-capped dim, Phase 1's switch and candidate B go. The pending pulse becomes relative.
- **The dim on each row's content,** so the line and a Card's Stubs keep their own strength.
- **Tests:**
  - **The classification,** in `dragClassification.test.ts`. One fixture with every tier: a Valid Stub (Full); a Depth-capped Stub whose parent is Valid (MO), and a Stub under it (LO); a Free descendant's Card and a Depth-capped Free Card (both MO); the dragged Stub's descendants at every depth, a Stub inside a Free descendant's Card among them (LO); the dragged item (no tier).
  - **With writes pending,** where the pickup reads the pending tree (`useBoardDnd.test.ts`'s pickup cases, which read `freeDescendantIds` today). A Stub whose attach is in flight takes its new parent's state, and one whose detach is in flight takes the Free Card rule.
  - **The chrome,** in `dragChrome.test.tsx`. An MO row and an LO row draw their tiers. A Valid row, the carried copy and a row with no drag draw nothing. The dragged row draws only the ghost's value. An overflow row is LO with an owner that isn't Valid, and Full with one that is. The drop line on an MO row isn't inside its dim. A pending row draws the pulse on its content with its tier, and its line outside both.
  - **The tests of `freeDescendantIds` and `attachedDescendantIds`,** DRAG-2.5's unit test among them, give way to these.
  - **Show the classification's and the chrome's tests failing first.**
- **DRAG-7.12's spec fails by design** (`tests/ui/drag-7-modal-hold.spec.ts`). It seeds `overlayDepthCappedOpacity` and reads the row root's opacity, and both go. Skip it with a one-line reason, for Story 10 (roadmap, "How Story 8 runs"), along with any other drag spec the run finds failing for the same cause.
- **Gate:** `npm run check` and `npm run test:e2e`.

**Phase 3: Nathan's hands-on**
- **What to try:**
  - **Drag a Stub with children,** two levels deep, one of them past the section's cut-off so an overflow row shows. Move it within its section, out to a column, and into another Card. Its rows and its overflow row read LO.
  - **Drag a Card with a Free descendant** whose own Card has Stubs. The Free descendant reads MO, and its Stubs LO, no darker.
  - **On the deep stack:** Depth-capped Cards (MO); and in one section, rows the ghost can sit beside but not under (MO) next to rows too deep to sit beside (LO). Tab right under an MO row, where the ghost shows its over-cap outline.
  - **The drop line** on an MO row and on an MO Card.
  - **Open the hierarchy modal** mid-drag, from an overflow row with a Valid owner. Its rows show their tiers.
  - **The ghost beside LO rows,** at the same value.
  - **A pending row at each tier,** with the browser's network throttling on so a write stays in flight: drop an item, then pick up another before the write lands.
- **Nathan tunes** MO, LO and the ghost's value.
- **And decides:**
  - whether the ghost should part from LO;
  - whether opacity alone is enough, or the children should ride with the carried copy, which would be a story of its own (Out of scope).

**Phase 4: settle**
- **The values stay tuning values,** at whatever Nathan set, unless he fixes them.
- **The Coder writes the handoff:** the tiers, their values, which rows take which, and the pending pulse.
- **Gate:** `npm run check` and `npm run test:e2e`. Then a stop for review and commit.
- **No audit runs for this story alone.** Story 8 closes with one over all its stories. Nathan may call one sooner.

## Code map

Phase 2's. Phase 1's rows (the traveling set, `useOverflowTravels`, `data-traveling`, the look switch) are gone.

| Symbol | Carries |
|---|---|
| `dragClassification.ts::DropTier`, `DragClassification.tiers` | `'parent'` (a legal parent), `'anchor'` (an anchor, not a parent), `'neither'`, one per item but the carried one. A Free Card is never `'neither'`; a Stub takes its parent's say. Replaces `freeDescendantIds` and `attachedDescendantIds` |
| `DragSessionContext.ts::DropTargetView.tier`, `useOverflowTier(ownerId)` | A row's tier. An overflow row, which is no item, takes `'parent'` from an owner that is a legal parent and `'neither'` otherwise |
| `dragChrome.tsx::TIER_CLASS`, `useItemRow`'s `contentClassName` and `data-drop-tier` | The tier as opacity, and the pending pulse, for a wrapper around the row's own content. `chromeClassName` is now the root's: the ghost's value and the flash |
| `StubRows.tsx::AttachedChildRow`, `OverflowRow`, `KanbanCard.tsx` | Each wraps its own content in `contentClassName`. The drop line, and a Card's section of Stubs, stay outside |
| `index.css::drag-tier-pulse`, `.drag-tier-pending` | The pending pulse, between the content's own opacity (`--tier-opacity`) and half of it |
| `dragTuning.ts` | `overlayAnchorOpacity` (0.6), `overlayNeitherOpacity` (0.3), `overlayGhostOpacity` (0.3). Gone: `overlayFreeDescendantColor`, `overlayDepthCappedOpacity`, `overlayTraveling*` |
| `BoardView.tsx::overlayVars`, `DragTuningPanel.tsx` | The three values as `--drag-tier-anchor`, `--drag-tier-neither` and `--drag-tier-ghost`, and their fields |

## Amendments

**Phase 1, built.**

1. **The mark is one class with two custom properties,** not a class per look. `BoardView` picks the look when it sets the properties, so Phase 3 removes a branch there, the panel's switch and three tuning values, and `dragChrome.tsx` keeps its class.
2. **A is 0.3, the dragged row's own opacity** (`opacity-30` in `useItemRow`), a tuning value, not read from that class. If the dragged row's opacity moves, A does not follow it. B is full grayscale at 0.6, which is lighter than the Depth-capped dim (0.4), so it parts from it by being colorless; the hands-on is where that is judged.
3. **The overflow row reads `subtreeIds`, not `travelingRowsFor`,** because `travelingRowsFor` answers only at the Descendants layer, and D4 has the mark from pickup. It is the same rule without the layer gate.
4. **The mark needs no layout change:** it is opacity and a filter, so no row moves. The hierarchy modal sits inside the board's root, so the custom properties reach it; that is seen at the hands-on, since no test renders it with a board.
5. **Tests:** the classification's (three cases: every depth with a Free descendant's own Stub in the set, a dragged Stub and a leaf, and the Stub test it is handed) and the chrome's (`useItemRow` for a Stub row at two depths, the dragged row, another's row and no drag, a Free descendant, a Depth-capped row, an overflow row with and without a traveling owner, and the carried copy). All were shown failing: the set holding Free descendants too (3 failed), the set left empty (4), an overflow row never marked (1), and every row marked (5). Not covered: that a Card's section actually draws the class on screen (the hook is tested, the section's render is not), and that the modal inherits the properties.

**2026-11-03: widened to every drag-target cue** (Nathan; written in by the Architect).

1. **What changed:** the title, the Goal, Scope, the decisions (D1–D4, now D1–D3), and the phases. Phase 2 is new, and the hands-on and the settle phase are now Phases 3 and 4. The Open questions and the Living-docs handoff follow. The roadmap's 8.5 entry is retitled to match, and the plan keeps its file name.
2. **Why:** reviewing Phase 1, Nathan found that the Depth-capped dim can be read as "not a neighbor either". The tiers sort targets by what the user can do with them.
3. **Superseded in Phase 1's record:** the two candidate looks (amendments 1 and 2), and the old D3's reason for keeping the mark apart from the Depth-capped dim, which sorted rows by cause. Amendment 3's "D4" is the old D4, now D1's last bullet. Its overflow-row rule widens from an owner that travels to any owner that isn't Valid.

**2026-11-03: the pending pulse** (Nathan). It pulses to half the row's own opacity (D3), which closes its Open question. Phase 2 builds it, and Phase 3 tries it.

**Phase 2, built.**

1. **Names:** the tiers are `parent` (Full), `anchor` (MO) and `neither` (LO), the test attribute is `data-drop-tier`, and the tuning values are `overlayAnchorOpacity` (0.6), `overlayNeitherOpacity` (0.3) and `overlayGhostOpacity` (0.3).
2. **The way the line and the Stubs stay out of the dim:** every row type wraps its own content in one element that carries the tier, and the drop line and a Card's section stay outside it. A Stub row wraps its button, an overflow row uses the inner element it already had, and a Card wraps its pills, title, description and footer. So an MO Card's Stubs draw at their own tier (LO, no darker), and no opacity is scaled.
3. **A Card dims its content, and its box stays.** The Card's border and background are on its root, which cannot take the opacity without dimming the line and the section. So an MO Card draws its text at MO on a full-strength box, where a Stub row's box is inside its content and dims with it. If the hands-on finds the Card reads as less dimmed than a Stub row, the fix is a background layer that takes the opacity in the content's place. It is not built.
4. **The ghost's value stays on the row's root,** as the fixed `opacity-30` was. That keeps the ghost's over-cap outline dimmed as it was, and nothing in a dragged row needs protecting from it.
5. **The pending pulse** is one keyframe on the same wrapper (`index.css::drag-tier-pulse`) that halves the wrapper's own opacity, from a custom property the tier sets (1 with none). It replaces `animate-pulse` on the root. Two things change with it: the drop line no longer pulses, and a pending Card pulses its own content, where it used to pulse its Stubs too. Each pending Stub pulses on its own. A pending ghost pulses on its content inside its root's value, so it halves from 0.3.
6. **The overflow row's tier is from its owner's state alone.** A legal-parent owner makes it `parent`, anything else `neither`, with no check of the layer. I did not verify that a hold can never start beside a `neither` overflow row (D1 takes it from `modalHoldTarget` refusing a state over the cap), only that the cue is inside the dimmed element. That is a hands-on item.
7. **`data-drop-state` and `isValidParent` are untouched,** and so is `subtreeIds`.
8. **Tests:** the classification's, in one fixture: a legal parent, a Free Card and a Stub (`parent`); a Free descendant, a Depth-capped Free Card and a Depth-capped Stub under a legal parent (`anchor`); the carried item's Stubs at two depths, a Stub inside a Free descendant, and a Stub under an anchor-only Stub (`neither`); a dragged Stub; and the Stub test it is handed. `useBoardDnd.test.ts`'s two pending pickups read the new tier. The chrome's: both anchor and neither, the tier not on the root, full strength for a legal parent, the carried copy and no drag, the ghost's value on the root with no tier, an overflow row by its owner, a pending row, and, rendered, a Stub row and a Card with a section. All were shown failing: a Free Card made `neither` (6 failed), a Stub that ignores its parent (8), no `parent` tier (3), an overflow row always `parent` (1), the tier on the root (3), the pulse dropped (1), no ghost value (1), and the carried copy given a tier (1). Not covered: that the drop line is not dimmed on screen (the line is drawn only for a named neighbor, and the tests show it outside the wrapper by structure), and that the hierarchy modal inherits the custom properties.
9. **E2E:** `DRAG-7.12` is skipped, as the plan says, with its key renamed so it still compiles. No other spec failed: 218 passed and 19 skipped.

**Phase 3, done** (Nathan, 2026-11-03).

10. **The values stand as built:** MO 0.6, LO 0.3, and the dragged row's 0.3. Nathan approved them hands-on and locked them in. They stay tuning values in the panel (Phase 4), not constants, so the dragged row's can be revisited with the Card's look.
11. **The ghost doesn't part from LO,** for now.
12. **Opacity alone, or the children riding with the carried copy:** Nathan wants to try the second, as its own story (Story 8.8 in the roadmap). The tiers stand meanwhile.

**Phase 4, settled.**

13. **No code changed.** The handoff is written (Living-docs handoff). The gate ran on the Phase 2 code: `npm run check` passed, and `npm run test:e2e` gave 217 passed, 19 skipped and one failure, DRAG-7.17's "from the gap above R's overflow row" (a predicate timed out). It is the roadmap's watch item, whose failure is unexplained; it passed 6 of 6 when rerun alone, and the full run had `npm run check` running beside it. The run before it, with the same code, passed all 218.

**2026-11-03, the wiki (PO)**
- **Written from the handoff,** with Nathan's approval of the tiers hands-on. Board-drag-interaction:
  - **§4:** the "Settled overlay assignments" (the green ring, the Depth-capped dim) and the closing "look" line are gone. The pending-writes paragraph's "green overlay" now reads "its tier (§4.1)".
  - **§4.1, new:** the tiers, by what a target can be; which rows take which, and why (a Free Card is never Low, a Stub takes its parent's, the tier passes down, an overflow row takes its owner's); no tier; one tier for the whole drag at every layer; opacity alone, at `overlayAnchorOpacity`, `overlayNeitherOpacity` and `overlayGhostOpacity`; what the dim covers; and no pop or hold cue on a dimmed target.
  - **§7.2 and §9:** a dragged Stub's subtree, and `R`'s overflow row, "go with it": their rows stay drawn, at Low, and are never named. They no longer "travel with the carried copy".
  - **§7.3:** the modal's rows are drawn by their tiers, as the section's are.
  - **§10:** the pending row's pulse, relative to its own strength.
  - **Open questions, "The look of the drag's cues":** names the tiers in place of the overlays, and gives today's Card box, plus whether the cues drawn on an item keep their color.
- **Project-tree §1** (a section of its own, touched in passing): "a Stub's subtree travels with the carried copy" now reads "a dragged Stub's subtree rows are passed over too". Story 8.7 owns the sidebar's own tiers.
- **Deduced (PO), for Nathan to overrule:**
  - **The plan's Open question: the tiers' look is a working placeholder.** It follows the plan's Out of scope ("The tiers' look is a working placeholder for 'The cues' final look'"). Which target takes which tier, opacity alone, and the three values (tunable) are rules. The Card's box staying at full strength is today's look, under Open questions.
  - **No hold on a Low overflow row** (the Coder didn't verify it, Amendment 6): it follows from existing rules. A Cycle-forming owner's rows are never named (§7.2), and every placement beside a Depth-capped owner's overflow row is over the cap, where the hold doesn't run (§7.3). §4.1 states it with that reason.
  - **An anchor** is defined in §4.1 as a target a release can place the item beside, as the ghost's named neighbor (§2).
- **For the Test Planner:** DRAG-2.5 and DRAG-2.6's rules are gone from §4. Their replacements derive from §4.1, DRAG-7.12's from §4.1 and §7.3, and a pulse case, if wanted, from §10. The Low overflow row's hold is a candidate case the Coder flagged as unverified.
- **Checks:** `check:docs` 392 files, 0 hits. A search of the wiki for "green overlay", `overlayFreeDescendantColor` and `overlayDepthCappedOpacity` finds nothing.

**2026-11-03, Test Planner's handoff pass**
- Applied the PO's uncommitted wiki changes. Retired the three obsolete overlay cases and added the twelve Open cases in Scope. Each traces to the settled rules; no case fixes the current tuning numbers, final Card box treatment, tuning panel, proposed sidebar tiers (Story 8.7) or branch-carry trial (Story 8.8).
- The pending-attachment expectation from DRAG-2.13 now belongs to DRAG-2.23's tier scenarios. DRAG-2.11 and DRAG-2.12 retain the independent depth/cycle rules. DRAG-2.2's classification behavior is unchanged.
- Reworded DRAG-7.12 for Full/Mid/Low in the modal, and DRAG-7.27 for an overflow row that stays drawn at Low while excluded from neighbors. The other hierarchy cases no longer suggest that descendant rows physically ride with the carried copy. Project-tree §1's wording correction needs no sidebar case change.
- **Coder action before closing:** `check:docs` finds a retired DRAG-2.5 title reference in `tests/ui/drag-target-classification.spec.ts` (reported at line 45). Remove the retired-ID claim and dispose of its obsolete overlay assertion under Story 8's skip policy. Do not blindly stamp a new tier ID on the old green-overlay assertion. The Planner has not read or edited that test. Retired DRAG-2.6 and DRAG-2.13 produce no other checker findings at this pass.
- **Reconciler, at Story 8 close-out:** assess the handoff's classification, pickup and chrome tests against the new cases; propose applicable ID stamps and any required internal-mapping approvals. Check the full revised DRAG-7.12 and DRAG-7.27, including the skipped specs, rather than carrying their Automated status forward as a new coverage verdict. No tests or automation mappings were inspected in this Planner pass.
- **Keep the gaps explicit:** DRAG-2.22 includes the Low overflow-row hold that the Coder reports unverified. The relative pulse, line/content isolation, actual section/modal rendering and pending-tree tier behavior need their full assertions checked; a hook or classification test alone does not prove the rendered result. Remaining gesture-dependent coverage is routed by ID in Story 10's item 10. DRAG-7.17's recurring failure remains the existing trace/watch item; this pass establishes no cause or fix.

## Open questions

- **For Nathan:** if the tiers' look is good enough for now but not final, the PO records it as a working placeholder under board-drag-interaction's Open questions, and "The cues' final look" takes it up. Otherwise it's a rule. Which target takes which tier (D1) doesn't wait on the look.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on** (Nathan approved the tiers hands-on, 2026-11-03):
  - **The tiers, and which rows take which.** The rule reads the drag-start classification (§4), once per drag, at every layer, from pickup to the drag's end:

    | Tier | What the target can be | Rows |
    |---|---|---|
    | Full | A legal parent, so also an anchor | Any Card or Stub that is Valid; an overflow row whose owner is Valid |
    | MO | An anchor, but not a parent | A Free Card that isn't Valid (too deep, or a Free descendant of the carried item); a Stub that isn't Valid whose parent is |
    | LO | Not even an anchor | A Stub whose parent isn't Valid: the carried item's own descendants at every depth, every Stub inside an MO Card, and a Stub too deep to sit beside; an overflow row whose owner isn't Valid |
    | None | | The dragged row, the carried copy, the static rows a section draws under the modal's backdrop, and a place that isn't a target |

    A Free Card is never LO, since a Card in a column can be named for a reposition whatever its state. After a drop the rows draw where the preview puts them, at full strength.
  - **How they draw:** by opacity only, no color. MO is 0.6, LO 0.3, and the dragged row's own 0.3, kept as a value apart from LO so the two can part. All three are tuning values in the drag tuning panel. Nathan approved these three and locked them in; he expects to revisit the dragged row's once the Card's look is final.
  - **What the dim covers:** a row's own content, and nothing it holds. The drop line keeps full strength on an MO row, which is a real anchor. A Card's Stubs show their own tier, not the Card's on top of theirs. A Card dims its text but not its box (border and background), where a Stub row's box dims with its text. Nathan raised no change to that.
  - **The pending marker's look** (the wiki doesn't describe it today, §10): a row with a write in flight pulses between its own opacity and half of it, so an LO row dims further and an MO row doesn't brighten. The drop line doesn't pulse. A pending Card pulses its own content, not its Stubs, which pulse on their own if pending.
  - **The cues that start a hold:** the zoom-in cue and the overflow row's hold cue never land on a dimmed target. The zoom-in's rule is existing (§6.1). The Coder did not verify the hold's, that none starts beside an LO overflow row.
  - **Gone:** the green ring on a Free descendant, and the Depth-capped dim as its own look. A Depth-capped Card is MO, and a Depth-capped Stub is MO or LO by its parent.
- **Planned passages now built:** none. §4 holds no Planned passage for this.
- **Passages superseded:**
  - **§4's settled overlay assignments:** the green ring for Free descendants, and the Depth-capped dim. The tiers replace both, and the tuning values they name (`overlayFreeDescendantColor`, `overlayDepthCappedOpacity`) go.
  - **§7.2** says a dragged Stub's subtree "travels with the carried copy", while its rows stay drawn in place, at LO. The PO decides whether that wording needs a change.
  - **Open questions, "The look of the drag's cues,"** names the classification overlays, which become the tiers.
- **Implementation passages to place:** none left. The drag directory's AGENTS.md (`client/src/components/workflow/AGENTS.md`, "The rows that travel with the dragged item") now describes the tiers and where the opacity sits, and lists `data-drop-tier`.
- **Test-plan cases affected:**
  - **DRAG-2.5 and DRAG-2.6 are superseded.** The Test Planner writes the tiers' cases in their place. Their surface specs are drag specs, so they wait for Story 10.
  - **DRAG-2.5 loses its unit test,** which goes with `freeDescendantIds`.
  - **DRAG-7.12** asserts the Depth-capped dim in the modal, by its old tuning value. Its spec is skipped in Phase 2, and the case needs rewording for MO.
  - The classification and chrome tests are internal; the Reconciler proposes them.
  - **Planner applied:** Scope now lists the replacements and pulse cases. DRAG-2.13 is also retired; DRAG-2.23 replaces its pending-overlay scenario with pending-tier expectations. DRAG-7.12 and DRAG-7.27 are reworded, with their existing status/mapping left for reconciliation. The stale DRAG-2.5 test title needs the Coder action recorded in Amendments before the documentation gate can pass.
- **For the Architect, at close:**
  - Story 8.5's roadmap heading gets its ✅ and a status line. Story 10's item 10 gains DRAG-7.12's skipped spec, and the tiers' surface specs if the Test Planner writes cases for them.
  - **Whether opacity alone is enough** was Phase 3's open decision. Nathan wants to try carrying the branch with the pickup instead, which is Story 8.8 (roadmap). The tiers stand meanwhile.
  - **The dragged row's opacity** is a value of its own at 0.3. Nathan expects to revisit it when the Card's look is finalized. "The cues' final look" is a natural home; the Architect decides.
