# Story 5 — Stub → out = detach

Implementation plan for Epic 3.5 Story 5. Rules live in the wiki; this file
is *how to build them* and becomes a historical record once done.

**Status: planned 2026-09-17; decisions ratified 2026-09-21; built
2026-09-21 (same day).** See "As built" at the bottom for what landed and
where it departed from this plan. Written against the code as it stands
after
[Story 4.1](story-4-1-efficiency-refactor.md) (Phases 0–4 landed
2026-09-18 — the prerequisite is met) — region `kind`s and a universal
`parentRegionKey` (Phase 0), `origin` on the session and the release
derived from a placement through `toRequest` + `isIdentity` (Phase 3).
Where a step leans on a 4.1 phase it says which; the one place it could
have been built without 4.1 is called out and no longer applies.

- Story entry: [`epic-3-5-roadmap.md`](epic-3-5-roadmap.md) § Story 5
- Rules: [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md)
  §1 (where a Stub's drag starts), §1.1 (the Descendants row; rules 1–3),
  §3–§3.1 (pop-out shared clock), §4 (Stub classification — the interim
  rule retires here), §6 (the auto-drop's two cases), §8 (detach) ·
  [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md)
  §4 (`parentId` / `isAttached` independent), §11 (detaching preserves the
  parent) · [`../../wiki/item-positioning/`](../../wiki/item-positioning/README.md)
  §4 (covered-set rule), §7.5 (append fallback)
- Cases: [`drag-5-detach-and-overflow.md`](../../test-plans/board-drag-interaction/drag-5-detach-and-overflow.md)
  TC-1–5, 9 (the sibling-reorder bullets; the tab bullets are Story 6's),
  10–12 · [`drag-1-contexts-and-popping.md`](../../test-plans/board-drag-interaction/drag-1-contexts-and-popping.md)
  TC-1 (the Stub bullet), TC-19 (manual) · [`drag-2`](../../test-plans/board-drag-interaction/drag-2-target-classification.md)
  DRAG-2.7 for Stubs · consequences:
  [`att-7-detach-preserves-parent.md`](../../test-plans/item-attachment/att-7-detach-preserves-parent.md)
  (API, already green from Story 1) · supersedes
  [`part-3` TC-3.3](../../test-plans/item-positioning/part-3-attached-sibling-reorder.md)
- Prior story: [`story-4-1-efficiency-refactor.md`](story-4-1-efficiency-refactor.md)
- Depends on: Stories 1–4, 4.1. **Unblocks:** Story 6 (which needs the
  Descendants layer to exist as a start state).

**Verified by:** automated reachability — `data-drag-context` reads
`descendants:<P>` at pickup, `card:<P>` after the first pop, the column's
key after the second — and write correctness (the detach request's shape;
no request for a set-down), through `tests/helpers/dragGesture.ts`; unit
tables for the new region kind, the classification change, `toRequest`'s
detach and reparent branches, and `isIdentity` against `origin`; **manual**
for the two-pop cascade feel (TC-11 / DRAG-1.19, threshold-timed) and for
how the brief Card-layer stop reads.

---

## Goal

Three capabilities, one gesture layer — all of them *the existing machine
applied to a Stub*, which is why this story is small once 4.1 has landed:

1. **A Stub's drag starts inside the machine**, at the Descendants layer of
   the Card whose hierarchy renders it. Its within-action there is — until
   Story 6 — exactly today's sibling reorder (position-only, same parent),
   so the golden path costs no pop and is unchanged in feel and in request.
2. **Two one-layer pops out**: Descendants → Card (a release there is the
   auto-drop: *set back down, nothing written*), then Card → the column
   that contains it (the item is now Free — a Card in that column's list,
   positioned by the column's within-action, `isAttached: false`,
   `parentId` kept).
3. **From the column on, it is a Card.** Board bands, other columns, other
   Cards (a reparent, attached as their last child) — every gesture Stories
   3–4 built applies with no further code, because nothing downstream of
   the column layer knows the drag started as a Stub except `origin`.

Not this story: zooming *into* Descendants from Card layer, tab states, the
flat hierarchy list, the sidebar consolidation — all Story 6.

---

## What's already settled (don't re-decide these)

- **Consequences of a detach** are item-attachment §11's, built in Story 1:
  attachment cleared, `parentId` kept, a fresh position in the workflow
  scope, the item's own workphase, `completedAt` eligibility. A detach
  with an anchor resolves against that anchor; without one it takes the
  append fallback; into a done column it's a Free item in a done workphase.
  No server work.
- **Detach in place keeps the inherited workphase** (§8, TC-2): the Stub's
  workphase is its parent's, which is in the parent's column's covered set,
  so the request carries no `workphaseId` — the covered-set rule, not a
  special case.
- **The auto-drop has two cases** (§6, ruled 2026-09-17): an item from
  outside → last child; the Card's own Stub → set back down. What
  distinguishes them is where the drag started, never the release.
- **Two pops, one shared clock**, distance cascades (§1.1 rules 2–3, §8,
  TC-11). No two-layer rule.
- **Stubs get full classification** (§4): the interim "everything outside
  the sibling list is Inert" rule retires. Depth doesn't depend on
  attachment, so the cap math is unchanged.
- **Moving a Stub out of a Card is an un-attach; zooming into a different
  Card is a reparent** (roadmap, §8).

---

## Decisions proposed while planning (2026-09-17) — to ratify

1. **"Its parent's Descendants layer" means the *containing Card's*.** For
   a grandchild Stub the layer is the Card's whole descendants section
   (every depth), not its parent Stub's sub-list — §7.1's root floor is
   the Card, and §1.1 has one Descendants layer per Card. The interim
   within-action stays scoped to direct siblings (today's `attached-child`
   collision policy); the *region* — the box, the pop-out boundary — is
   the whole section. Wiki §1's wording is corrected with this story.
2. **The origin chain always registers, independent of classification:**
   `descendants:<P>`, `card:<P>`, and P's column/sub-row. A drag must be
   able to pop out of where it started even when P wouldn't be a valid
   *target* for it.
3. **`descendants:` regions are not zoom-in candidates yet.** This story
   registers only the origin's section; `childRegionAt` from a Card
   context still returns nothing. (Otherwise a Free Card zoomed into a
   Card with children would start a hold with no rule behind it.) Story 6
   registers every Valid Card's section and adds the clock.
4. **One dnd-kit drag type for items.** Today a Card row registers
   `data.type: 'card'` and a Stub row `'attached-child'`, and the collision
   closure branches on `active.data.current.type`. A popped-out Stub's
   row unmounts from its section and remounts as a Card row in the column
   list — the same id under a different `type`, the exact hazard
   `AttachGhostRow` was built to sidestep in the other direction. Rows
   register `data: { type: 'item', role: 'card' | 'stub', parentId? }`
   instead; the *active* type never changes mid-drag, `role`/`parentId`
   are droppable-side facts, and "did this drag start as a Stub" is the
   session's `origin`, not dnd-kit's data. Column drags stay `'column'`.
5. **A detaching Stub's Column-layer resting slot is `'last'`**,
   generalizing reconciliation #29: an item whose position is not
   comparable in the list it's previewing into (attached-siblings scope →
   a column) previews at the append slot, never `'existing'` (which would
   sort its sibling-scope number against workflow-scope numbers and land it
   somewhere arbitrary). Sortable displacement moves it from there as for
   any Card. `isStub`'s `positionScope` check is the predicate.
6. **The overlay copy stays a shortCard at every layer** (4.1 decision 3);
   only the *in-list* ghost switches form — a Stub row inside a Card's
   section, a shortCard row in a column. Wiki §7's "represented as a
   Stub-ghost from the Card layer down" is read as the in-list ghost.
   *(Alternative: the overlay renders as a Stub row while at Card or
   Descendants layer. Not recommended — one shape, one reservation.)*
   **Reopened by the Product Owner 2026-09-23:** the alternative is now the
   rule, built in [Story 6](story-6-descendants-placement.md) Phase C.
7. **Ghost identification in `KanbanCard` moves to origin + placement**
   (4.1's F3 landmine): a row is the attach ghost iff the active item's
   placement puts it under this parent *and* its `origin` didn't.

**Ratified by the Product Owner, 2026-09-21.** Decisions **1, 3, 5, 6**
carry rule content (where a drag starts, what's reachable this story,
what the preview shows, what the carried copy looks like) and are
settled; the wiki carries them as of this date — §1 and §8 (decision 1),
§7 (decision 6), §10 (decision 5). Decisions **2, 4, 7** are
implementation choices — the Architect's call, no objection recorded.
Notes against the four rulings:

- **On 1** — a grandchild's drag starts in the same section as its
  parent's; there is one Descendants layer per Card, never one per Stub
  (§7.1's root is the Card). Because the *within-action* stays direct-
  sibling reorder until Story 6, a grandchild hovered over a non-sibling
  row inside the section moves nothing and a release there is identity —
  a known interim dead zone inside a region that is otherwise held, not a
  bug to file during hands-on.
- **On 3** — scope, not a rule change: in Story 5 a Free Card zoomed into a
  Card with children still stops at the auto-drop. Story 6 opens the
  layer.
- **On 5** — the principle is #29's, restated generally: **the preview
  shows where the write will actually land the item.** A detach without
  an anchor resolves to the append fallback (item-positioning §7.5), so
  the resting slot is `last`; hover displacement moves it from there
  exactly as for any Card.
- **On 6** — verified no golden-path change: `BoardView.tsx` already
  renders one `isOverlay` shortCard for *every* session, Stub drags
  included, so a sibling reorder looks today exactly as it will after
  this story. Only the in-list ghost switches form at the Column ↔ Card
  boundary (TC-10). The alternative (a Stub-row overlay at the inner
  layers) stays off the table unless hands-on says otherwise.

**Feel-checks the Product Owner owes after the build** (not gates on
starting it): the brief Card-layer stop on the way out — if it reads as
confusing, `popDistancePx` is the ruled lever (Risks below), not a
special case; and Story 4.1's two still-open gates (Phase 1's shortCard /
carve-out, Phase 4's short-merged-column exit clock), which this story's
hands-on can cover in the same sitting.

---

## Build order

Steps 1–4 are each independently green. Step 4 is the one that needs 4.1
Phase 3; without it, the fallback is a `detach` `DropResolution` kind and
an `origin` `ReleaseIntent` bolted onto `resolveCardDrop` — the twelfth
branch 4.1 exists to prevent. Land 4.1 first.

### Step 1 — The Descendants region and the Stub start

`dragRegions.ts`

- `kind: 'descendants'`, `descendantsRegionKey(cardId)` → `descendants:<id>`,
  `parentRegionKey: card:<id>`. Measured from a `data-drag-region` on the
  Card's attached-children container in `KanbanCard.tsx` (the wrapper
  around the section's `SortableContext`). Clip to the column's scroll box
  like any nested region. `clampAxes('descendants')` = both.
- Registration this story: **the origin's section only** (decision 3); the
  origin Card's `card:` region registers regardless of `isValidCard`
  (decision 2). The structure resolver (4.1 Phase 2) or
  `measureDragRegions` takes the origin chain's keys.

`useBoardDnd.ts::handleDragStart`

- An item whose `role` is `'stub'`: `containingCardId` = its nearest Free
  ancestor (walk `parentId` through `lib/hierarchy` until `!isStub`);
  `startPopSession(descendantsRegionKey(containingCardId))`;
  `origin = { parentId: item.parentId, slot: 'existing' }`. `pop` is now
  non-null for every item drag — `DragSession.pop` stops being optional,
  and the `pop: null` / `type !== 'card'` branch goes.
- `data-drag-context` reads `descendants:<P>` from pickup: DRAG-1.1's Stub
  bullet becomes assertable.

`KanbanCard.tsx` / `BoardColumn.tsx`: the registration change of decision 4
(`type: 'item'`, `role`). `resolveBoardCollisions` and `useLiveDropSide`
read `role` where they read `type` today.

### Step 2 — Classification: the interim rule retires

`dragClassification.ts`: delete the `stubDrag` branch. A Stub is
classified like a Card — cycle-forming for itself and its subtree,
depth-capped by `isWithinDepthCap`, Valid otherwise. Consequence: other
Cards register as regions for a Stub drag, so the zoom-in reparent (TC-4)
needs no code of its own. `drag-target-classification.spec.ts`'s interim
case ("classifies its siblings valid and everything else inert") becomes
the full-classification case (DRAG-2.7 for Stubs).

### Step 3 — Pop-out, and the representation switch

`popSession.ts`: nothing structural — the pop-out chain `descendants` →
`card` → column is `parentRegionKey` (4.1 Phase 0), and the shared `popOut`
clock already cascades on distance. Add the kind's rows (`popInDelayFor`
has none yet; `clampAxes` both).

`placementFor`, by layer, for an item whose `origin` is attached:

| Layer | Placement | Draws as |
|---|---|---|
| Descendants (start) | `{ parentId: origin.parentId, slot: 'existing' }` | its own row; sortable displaces among siblings (today's reorder, unchanged) |
| Card `[R, P]` | `origin` | its own row at its original slot — the set-down preview |
| Column `[R]` | `{ workphaseId: regionWorkphaseFor(R, …), parentId: null, slot: 'last' }` (decision 5) | a Card row in R's list; absent from P's section (TC-10) |
| Board | the band placement, plus `parentId: null` | a Card row in the hovered region, or nowhere |
| another Card `[R', Q]` | `{ parentId: Q, slot: 'last' }` | a Stub-ghost last in Q (TC-4) |

`parentId: null` is the placement-level "previews Free" that
`itemListOps.ts::renderedIsStub` already anticipates; `computeChildCounts`
follows it, so P's count drops by one while X previews Free and comes back
on cancel — no special handling. Back inside P's Card layer from *any*
path (popped out to the column and returned, say), the within-action is
`origin` because `origin.parentId === P` — "set back down" is about where
the drag started, not the route (TC-12 by way of §6). If P's section had
unrendered meanwhile (count 0), the origin placement re-renders it.

Collision policy (`resolveBoardCollisions`), keyed off the machine's
context instead of `active.data.current.type`: a Descendants context's
in-context candidates are the section's rows with `parentId ===
origin.parentId` (the existing sibling policy, now reached through the
machine); a Column context's are the container and its Card rows, exactly
as for a Card drag.

`KanbanCard.tsx`: ghost identification per decision 7.

### Step 4 — The write (needs 4.1 Phase 3)

`toRequest(item, placement, board)`:

- a **region** placement for an item whose origin is attached →
  `{ …workphaseId per the covered-set rule, isAttached: false, …slot }` —
  TC-1 (`{ anchorId: Q, side: 'after' }`), TC-2 (no `workphaseId`
  field), TC-3 (another column's band, or its in-context anchor after a
  pop-in);
- a **parent** placement → `{ parentId: Q, isAttached: true, …slot }` —
  TC-4, the same branch a Card's attach already takes;
- `isIdentity` against `origin` → no request: TC-12 (a release at P's
  Card layer), TC-5 (a sibling reorder that ends in its own slot).

**Known deletion (audit `code-quality-audit-epic-3-5-story-4.md` #1, added
2026-09-21).** `isIdentity`'s parent branch today decides "same list" by
`placement.parentId === item.parentId`, which mistakes a *detached* child
of X (Free, `parentId = X`) for X's own Stub — the re-attach previews as
X's last child and then never writes. The interim fix is `&&
Boolean(item.isAttached)` on that branch (a detached child has the
parentId without the attachment). This story replaces the whole comparison
with `origin`: a detached child's origin is a *workphase* placement and the
Card-layer placement is a *parent* placement, so they're different kinds
and never identity; X's own Stub has origin `{ parentId: X, slot:
'existing' }` and the within-action returns `origin` itself, so identity →
set-down. Both cases fall out of one comparison, and the `isAttached` read
goes with it. Don't carry it forward.

The pending marker is the placement; `sendItemMove` and the tracker are
untouched. `handleDragEnd`'s separate `attached-child` branch is deleted —
a Stub drag ends the way a Card drag does.

### Step 5 — Tests and docs

- **E2E** (`dragGesture.ts`; `awaitDragContext` with the new key): TC-1,
  2, 3, 4, 5, 9 (sibling bullets), 10, 12 as reachability + write cases;
  TC-11 stays manual. DRAG-1.1's Stub bullet. `part-3` TC-3.3 ("drag out
  of parent is blocked") → superseded, and whichever spec asserts the
  guard is retired with it.
- **Unit:** `popSession.test.ts` (a `descendants` start; the two-pop
  chain; the cascade on distance), `dragClassification.test.ts` (Stub
  full classification), `boardDndUtils.test.ts` (`toRequest` detach /
  reparent; `isIdentity` against an attached origin), `itemListOps.test.ts`
  (`parentId: null` leaves the section and the count follows; the `'last'`
  resting slot for a non-comparable position).
- **Wiki:** §1 (decision 1's wording), §4 (interim rule retired), §8
  ("currently held closed" → built), §10 (#29 generalized per decision 5),
  the header's build status; DRAG-5 statuses; CLAUDE.md's drag section
  (Stub drags inside the machine, the `attached-child` branch gone, one
  item drag type).

---

## Risks / things to watch

- **`active.data.current` flipping mid-drag** is the one real hazard, and
  decision 4 is its mitigation. Verify by asserting the type in the
  collision closure across a full detach in a dev build before trusting
  it; if dnd-kit re-registration proves unreliable in some path, the
  fallback is a non-sortable Card-ghost row for the popped-out Stub (the
  Card-shaped twin of `AttachGhostRow`), at the cost of the active row not
  being displaced by the sortable strategy in the column list.
- **Layout-space rects for the Descendants region.** The section's rows
  are sortables with transforms during a sibling reorder; the region's own
  box (the wrapper) never transforms, so `layoutRect`'s subtraction stays a
  no-op for it — same as a column.
- **The brief Card-layer stop.** The outline moves to P for the duration;
  if the PO finds the stop confusing, the distance term (`popDistancePx`)
  is the ruled lever, not a special case.
- **Existing Card suites must stay green** — nothing about a Card drag
  changes except the drag-type registration, which is where a regression
  would show first.

---

## Out of scope

Story 6 (Card → Descendants zoom-in, tab states, the flat hierarchy list,
the sidebar consolidation); Story 9 (Free-item reparent as a gesture); §9
overflow; visual treatment (Story 8); a Stub whose ancestor Card is
collapsed (it isn't rendered, so it can't be picked up — Story 6's
forced-expand covers the zoom-in direction).

---

## As built

All four steps (Descendants region + Stub start, classification, pop-out
and the representation switch, the write) plus decision 4's registration
change are implemented and green on the full suite (client unit tests —
230/230; client/root `tsc`, `eslint`, `prettier`; and the complete
Playwright E2E run — 139 passed / 6 skipped, up from the established
133/6 baseline by exactly the 6 new cases below) with zero net
regressions. No behavior changed for a Free Card drag outside the
registration rename (decision 4) — the existing catalog stayed the
regression gate throughout.

- **Region + start (Step 1).** `dragRegions.ts` gained a `descendants` kind
  (`descendantsRegionKey`) and a fourth `resolveDragStructure` parameter,
  `originCardId` — the Stub drag's own containing Card, which resolves its
  `card:`/`descendants:` elements regardless of `isValidCard` (decision 2).
  `childRegionAt` gained an explicit guard excluding `descendants` regions
  from ever being returned as a zoom-in candidate (decision 3 — Story 6
  opens that). `useBoardDnd.ts::handleDragStart` branches on
  `isStub(activeItem)`: a Stub's `containingCardId` is found via
  `getAncestors` (cycle-safe) walking up past every Stub ancestor to the
  nearest Free one — a grandchild's drag starts in its Card's whole
  section, never its parent Stub's sub-list. `KanbanCard.tsx`'s
  attached-children wrapper carries `[DRAG_REGION_ATTR]:
  descendantsRegionKey(item.id)` alongside its existing content.
- **Classification (Step 2).** `dragClassification.ts`'s `stubDrag`
  branch is deleted outright — a Stub is classified by the same
  `isWithinDepthCap` walk as a Card, no special case at all.
- **Pop-out and the representation switch (Step 3).** Structurally
  nothing changed in `popSession.ts` — the pop-out chain falls out of
  `parentRegionKey` and the existing shared clock, exactly as planned.
  `placementFor` gained two new branches (`region.kind === 'card'` vs.
  `'descendants'`, replacing the old blanket `!isCardList` case) and two
  new parameters, `origin` and `containingCardId` — the Card branch
  returns `origin` itself (the "set back down" preview, TC-12) when
  `region.attachToCardId === containingCardId`, and the last-child attach
  placement otherwise (TC-4); the Descendants branch resolves an in-context
  anchor+side scoped to `origin`'s own real `parentId` (decision 1's
  interim sibling reorder), or defers to `priorPlacement ?? origin`
  mid-drag. A new private `noAnchorSlot` helper generalizes #29 (decision
  5): a card-list region's no-anchor fallback rests at `'last'`, never
  `workphaseOnlySlot`'s read of a position that isn't comparable there,
  whenever `origin` carries a `parentId` (a Stub's own kept slot). Every
  card-list placement for such an origin also carries an explicit
  `parentId: null` — the render-preview signal `itemListOps.ts`'s
  `renderedIsStub`/`computeChildCounts` already anticipated.
- **The write (Step 4).** `boardDndUtils.ts`'s `isIdentity` and `toRequest`
  now take the session's `origin` instead of the raw item's
  `(parentId, isAttached)`/`workphaseId` fields — the audit
  epic-3-5-story-4 #1 `isAttached` guard retires with it, since a detached
  child's origin is a workphase placement and a re-attach's is a parent
  one, so the two kinds simply never collide. `toRequest` branches three
  ways on a `parentId` placement: `null` → detach (`isAttached: false`,
  real `parentId` untouched, TC-1/2); an anchor-shaped `slot` → a plain
  sibling reorder (`{anchorId, side}` only — the pre-Story-5
  attached-child request unchanged, TC-9); otherwise → attach as last
  child (TC-4). `useBoardDnd.ts::handleDragEnd`'s separate `attached-child`
  branch is deleted; every item drag ends through the one unified path.
- **Decision 4 (drag-type unification).** Every item row now registers
  `data: {type: 'item', role: 'card' | 'stub', parentId?}` — `KanbanCard`'s
  own row and `AttachedChildRow` alike — instead of `'card'`/
  `'attached-child'`. `resolveBoardCollisions` (`boardDndUtils.ts`) reads
  none of it off the *active* row; a new `CollisionSession.siblingScopeParentId`
  field (computed by `useBoardDnd.ts` from the pop session's own `origin`,
  never dnd-kit's `active.data.current`) drives the Descendants-context
  scoping instead. Verified both by a real detach-then-immediate-redrag
  E2E case and a unit test that feeds a deliberately stale active `role`
  alongside a live session and confirms the outcome still follows the
  session, not the stale data.
- **Decision 7 (ghost identification).** `KanbanCard.tsx`'s `attachGhostId`
  now also checks `origin`: a row previews as the attach ghost only when
  the active drag's `origin` parent *isn't* this Card, so a Stub's own
  sibling reorder (now running through the same `pop` session as a Card
  drag, per Step 1) never misidentifies its own home section as an
  in-progress attach — the exact shape of 4.1's F3 landmine, one layer up.
- **Departures from the plan.** None structural. `reservationFor`'s
  fourth `'none'` shape (audit epic-3-5-story-4 #9, landed before this
  story) already covered the terminal-and-empty overlap this story's
  Card-list branches lean on; nothing new was needed there.
- **Tests.** Unit: `dragRegions.test.ts` (descendants registration, the
  `originCardId` bypass, `childRegionAt`'s exclusion), `dragClassification.test.ts`
  (full Stub classification, replacing the interim-rule case),
  `popSession.test.ts` (`placementFor`'s Card/Descendants branches, TC-1/2/
  4/9/12), `boardDndUtils.test.ts` (`isIdentity`/`toRequest` against
  `origin`, the decision-4 stale-role regression, `resolveBoardCollisions`'
  sibling scoping), `itemListOps.test.ts` (a detaching placement's
  `parentId: null` leaving the section and the count following). E2E:
  `tests/ui/drag-5-stub-detach.spec.ts` (TC-1/2/4/9 (sibling bullets)/10/12,
  the grandchild-origin case, and the decision-4 redrag regression) plus
  updates to `drag-target-classification.spec.ts`'s Stub case (DRAG-2.7).
  TC-3 (cross-column detach via Board bands) and TC-5 (momentary excursion)
  weren't separately automated — both exercise machinery (Board-layer
  bands, the pop-out clock's "momentary doesn't count" rule) already
  covered elsewhere for a Card, and TC-11's own two-pop cascade stays
  manual per the plan (threshold-timed).
- **Docs.** Wiki §1/§1.1/§4/§7/§8/§10 and the header build-status
  paragraph updated to "built"; `epic-3-5-roadmap.md`'s Story 5 entry;
  `workflow/CLAUDE.md`'s mental model and module list. The DRAG-1/2/5
  test-plan tables' own automation-status columns and per-case notes are
  *not* part of this story's build — updating them (marking a case built,
  triaging ⏳ pending, adding a superseded-rule "was:" note) is the Test
  Planner/Test Reconciler's call, not the Coder's or Architect's (see
  their persona docs' "What to Never Do Without Asking"). Audit
  epic-3-5-story-5 #5 caught an earlier draft of this bullet claiming
  those tables were updated when they weren't — corrected here rather
  than applied, per the same boundary.
