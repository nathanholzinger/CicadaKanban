# Epic 3.5 Story 8.5 — A dragged Stub's children read as off-limits

**Type:** story · **Written:** 2026-11-02 by the Architect, from the PO's Story 6 hands-on finding (2026-09-24) · **Status:** planning

## Goal

While a Stub is dragged, the rows of its own descendants read as part of what it carries, not as places to set it down.

**What happens today** (wiki board-drag-interaction §4, §7.2):
- **The guards are right.** A dragged Stub carries its whole subtree. Its descendants' rows are passed over, never named as the ghost's neighbor, and each is Cycle-forming, so none is a target.
- **Nothing on screen says so.** The rows stay drawn where they were, at full strength, while the ghost moves away from them.
- **The classification already knows them.** Only the Free descendants get a cue, the green ring (`dragChrome.tsx::dropTargetClass`). A Cycle-forming row drawn as a Stub gets none.
- **The project sidebar already marks its version of this.** A dragged project's descendants stay drawn and dimmed, at the dragged row's own opacity (`SortableProjectRow.tsx`).

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"):
- The Coder builds candidate looks, and Nathan picks one hands-on.
- The PO and the Test Planner write the docs once he has.
- No new drag specs. Unit and component tests work as usual.

**Out of scope:**
- **Carrying the children visibly,** the roadmap's second option, where the rows leave the section and ride with the carried copy. Removing rows at pickup shifts the layout under the cursor, the jump the morph's story is about. A taller carried copy also changes the box dnd-kit measures for collisions. If the hands-on finds a mark isn't enough, that's a story of its own.
- **The mark's final look.** It's a working placeholder for "The cues' final look" story.
- **The Free descendants' green ring,** which is unchanged.
- **A dragged Card's attached children.** They aren't drawn while it's dragged (§5a), so there's nothing to mark.

## Scope

- **Wiki passages:** none ahead of the build, under code first. Once Nathan approves a look, §4's settled overlay assignments gain the rule, and its look joins Open questions (Living-docs handoff).
- **Test-plan cases:** none ahead of the build. DRAG-2.2, the classification itself, and DRAG-2.5, the green ring, are unchanged. The mark's case is the Test Planner's once Nathan approves.

## Inbound deferrals

- **From Story 6's hands-on** (roadmap, Story 8.5, PO, 2026-09-24): Phase D's finding, item 3.
- No audit routed anything here.

## Approach and phases

### Decisions

**D1. Which rows are marked.**
- **They are:** every row that draws an attached descendant of the carried item, for as long as an item drag is live, at every layer. What the item carries doesn't change with the layer. That's:
  - **a Stub row** in any section: the one the drag began in, the hierarchy modal's list, and a section inside one of the item's Free descendants;
  - **an overflow row whose owner travels.** It stands for children that travel, by `dragCollision.ts::travelingRowsFor`'s rule.
- **They aren't:**
  - the dragged row, which keeps its ghost look;
  - the carried copy;
  - a Free descendant, which keeps the green ring;
  - the static rows a section draws under the modal's backdrop.
- **The rule reads the classification:** Cycle-forming, not the carried item, and not a Free descendant. So it counts over the tree as the pending writes leave it (§4), and it agrees with what the drag passes over.

**D2. One derivation.**
- The classification yields the set once, beside `freeDescendantIds`, from the same walk (`dragClassification.ts::classifyDragTargets`).
- `DragSessionContext.ts::useDropTargetState` exposes it on `DropTargetView`, as it does `isFreeDescendant`.
- `dropTargetClass` draws it.
- An overflow row reads whether its owner travels from the same classification. It takes no chrome today (`StubRows.tsx::OverflowRow`).

**D3. Two candidate looks, switched in the drag tuning panel, for Nathan to pick.**
- **A, the ghost's dim.** The rows take the dragged row's own opacity, so the branch reads as one carried block, as in the sidebar.
- **B, greyed.** The rows are desaturated and dimmed, unlike both the ghost and the Depth-capped dim.
- **Not the Depth-capped dim** (`overlayDepthCappedOpacity`). One section can show both kinds of row, and they mean different things. The ghost can still sit beside a Depth-capped row; it just can't take it as a parent at that depth. A traveling row is passed over.
- **Each candidate's strength is a tuning value,** beside the overlay values in `dragTuning.ts`.
- **The switch is in the drag tuning panel,** which is temporary: no wiki, no cases, no tests. Phase 3 removes whatever Nathan doesn't pick.

**D4. When the mark shows.** From pickup to the drag's end, whether a drop, a cancel or a forced stop: the classification's life. After a drop the rows draw where the preview puts them, unmarked.

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus `npm run test:e2e` where the phase says so.

**Phase 1: the set, the mark and its candidates** (D1–D4)
- **The set** in the classification, and its view in `useDropTargetState`.
- **The mark** on Stub rows and on overflow rows, with candidates A and B, their tuning values, and the panel's switch.
- **Tests:**
  - **The classification,** in `dragClassification.test.ts`. The set holds a Stub's attached descendants at every depth. It doesn't hold the carried item or its Free descendants. With writes pending, it follows what's drawn as a Stub: a descendant whose attach is in flight is in it, and one whose detach is in flight isn't.
  - **The chrome,** in `dragChrome.test.tsx`. A row in the set gets the mark. The dragged row keeps only its ghost look, a Free descendant only the green ring, and a Depth-capped row only its dim. No drag means no mark.
  - **The overflow row:** marked when its owner travels, and not otherwise.
  - **Show the classification's and the chrome's tests failing first.**
- **Gate:** `npm run check`.

**Phase 2: Nathan's hands-on**
- **What to try:**
  - **Drag a Stub with children,** two levels deep, one of them past the section's cut-off so an overflow row shows. Move it within its section, out to a column, and into another Card.
  - **Open the hierarchy modal** mid-drag.
  - **A Stub with a Free descendant** whose own Card has Stubs.
  - **On the deep stack, beside Depth-capped rows,** so both kinds show in one section.
- **Nathan picks** the candidate and its strength.
- **And decides whether a mark is enough,** or the children should ride with the carried copy. That would be a story of its own (Out of scope).

**Phase 3: settle on the pick**
- Remove the candidate and the switch Nathan didn't pick.
- The strength stays a tuning value, unless Nathan fixes it.
- The tests follow the kept look.
- **The Coder writes the handoff:** the look, its strength, and the rows it covers, for the PO.
- **Gate:** `npm run check` and `npm run test:e2e`. Then a stop for review and commit.
- **No audit runs for this story alone.** Story 8 closes with one over all its stories. Nathan may call one sooner.

## Code map

Filled in by the Coder while building.

| Symbol | Carries |
|---|---|

## Amendments

## Open questions

- **For Nathan:** if the look you pick is good enough for now but not final, the PO records it as a working placeholder under board-drag-interaction's Open questions, and "The cues' final look" story takes it up. Otherwise it's a rule.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:** filled in by the Coder, in Phase 3: the look, its strength, and which rows it covers.
- **Planned passages now built:** none. §4 holds no Planned passage for this. The PO adds the rule to §4's settled overlay assignments. §7.2 says a dragged Stub's subtree "travels with the carried copy", while its rows stay drawn in place, marked; the PO decides whether that wording needs a change.
- **Passages superseded:** none expected.
- **Implementation passages to place:** none expected.
- **Test-plan cases affected:** a case for the mark, the Test Planner's, beside DRAG-2.5 and DRAG-2.6. Its surface spec is a drag spec, so it waits for Story 10. The classification and chrome tests are internal; the Reconciler proposes them.
- **For the Architect, at close:** Story 8.5's roadmap heading gets its ✅ and a status line. Story 10's item 10 gains the mark's surface spec, if the Test Planner writes a case for it.
