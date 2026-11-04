# Epic 3.5 Story 8.5 — The drag-target cues say what a target can be

**Type:** story · **Written:** 2026-11-02 by the Architect, from the PO's Story 6 hands-on finding (2026-09-24). Widened 2026-11-03 by Nathan · **Status:** in progress: Phase 1 built, Phase 2 next

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

- **Wiki passages:** none ahead of the build, under code first. Once Nathan approves the tiers, they replace §4's settled overlay assignments (Living-docs handoff).
- **Test-plan cases:** none ahead of the build. DRAG-2.2, the classification itself, is unchanged. The tiers supersede DRAG-2.5 (the green ring) and DRAG-2.6 (the Depth-capped dim), and change what DRAG-7.12 asserts. Their replacements are the Test Planner's once Nathan approves.

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

Filled in by the Coder while building. The rows below are Phase 1's. Phase 2 replaces the ones its removals reach.

| Symbol | Carries |
|---|---|
| `dragClassification.ts::DragClassification.attachedDescendantIds` | The descendants drawn as Stubs, from the same walk as `freeDescendantIds`. Disjoint from it, and never the carried item |
| `DragSessionContext.ts::DropTargetView.isTraveling`, `useOverflowTravels(ownerId)` | A row's view of the set; an overflow row, which is no item, asks whether its owner is in `subtreeIds` |
| `dragChrome.tsx::TRAVELING_ROW`, `dropTargetClass`, `data-traveling` | The mark: the row's opacity and filter from two CSS custom properties. It wins over nothing else, since the three overlays never share a row. `data-traveling` is the test surface |
| `StubRows.tsx::OverflowRow` | Now draws `chromeClassName`, which is the mark only: an overflow row has no other drag chrome |
| `dragTuning.ts` | `overlayTravelingLook` (`'dim'`), `overlayTravelingDimOpacity` (0.3), `overlayTravelingGreyOpacity` (0.6), `overlayTravelingGreyAmount` (1) |
| `BoardView.tsx::overlayVars` | Turns the chosen look into `--drag-overlay-traveling-opacity` and `--drag-overlay-traveling-filter` |
| `DragTuningPanel.tsx` | The "Carried branch's rows" look switch and the three strengths |

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

## Open questions

- **For Nathan:** if the tiers' look is good enough for now but not final, the PO records it as a working placeholder under board-drag-interaction's Open questions, and "The cues' final look" takes it up. Otherwise it's a rule. Which target takes which tier (D1) doesn't wait on the look.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:** filled in by the Coder, in Phase 4: the tiers, their values, which rows take which, and the pending pulse. The wiki doesn't describe the pending marker's look today (§10).
- **Planned passages now built:** none. §4 holds no Planned passage for this.
- **Passages superseded:**
  - **§4's settled overlay assignments:** the green ring for Free descendants, and the Depth-capped dim. The tiers replace both, and the tuning values they name (`overlayFreeDescendantColor`, `overlayDepthCappedOpacity`) go.
  - **§7.2** says a dragged Stub's subtree "travels with the carried copy", while its rows stay drawn in place, at LO. The PO decides whether that wording needs a change.
  - **Open questions, "The look of the drag's cues,"** names the classification overlays, which become the tiers.
- **Implementation passages to place:** the drag directory's line that Phase 1 extended for the mark (`client/src/components/workflow/AGENTS.md`, "The rows that travel with the dragged item"). The Coder updates it with Phase 2's code.
- **Test-plan cases affected:**
  - **DRAG-2.5 and DRAG-2.6 are superseded.** The Test Planner writes the tiers' cases in their place. Their surface specs are drag specs, so they wait for Story 10.
  - **DRAG-2.5 loses its unit test,** which goes with `freeDescendantIds`.
  - **DRAG-7.12** asserts the Depth-capped dim in the modal, by its old tuning value. Its spec is skipped in Phase 2, and the case needs rewording for MO.
  - The classification and chrome tests are internal; the Reconciler proposes them.
- **For the Architect, at close:** Story 8.5's roadmap heading gets its ✅ and a status line. Story 10's item 10 gains DRAG-7.12's skipped spec, and the tiers' surface specs if the Test Planner writes cases for them.
