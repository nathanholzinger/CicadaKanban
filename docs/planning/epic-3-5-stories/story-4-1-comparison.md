# Story 4.1 — draft vs. as-built comparison (Epic 3.5 Stories 3–4 drag layer)

Working document of the 2026-09-17 planning session for
[`story-4-1-efficiency-refactor.md`](story-4-1-efficiency-refactor.md);
companion to [`story-4-1-anchor-draft.md`](story-4-1-anchor-draft.md). Every
difference is sorted into **(a)** vestige of a retired rule / accretion,
**(b)** the draft was naive to a real constraint, or **(c)** same rule,
different shape. Line references are against the working tree at `1fe1559`
and will rot as the story lands; the plan uses `file::function` references
for that reason. **§4 below is superseded by the plan's "Build order"** —
Phase 3 was refined after this was written: sortable stays the in-context
renderer, so `over` is folded into the placement at *release* (not per
sample), and the mid-drag Column-layer ghost stays at `'existing'`.

Files read: `popSession.ts`, `dragRegions.ts`, `useBoardDnd.ts`,
`boardDndUtils.ts`, `itemListOps.ts`, `useItemManagement.ts`,
`DragSessionContext.ts`, `dragTuning.ts`, `dragClassification.ts`,
`BandGuides.tsx`, `KanbanCard.tsx`, `BoardColumn.tsx`, `WorkphaseCardList.tsx`,
`BoardView.tsx`, `sidebar/projectTreeUtils.ts`, `api/items.ts`,
`server/routes/items.ts` (move route), `tests/helpers/dragGesture.ts` (boxOf).

---

## 0. Verdict

The as-built machine is closer to the draft than the docs' history suggested:
it is pure, timestamp-clocked, region-parametric, and §3.2 falls out of the
candidate filter exactly as the draft wanted. The draft was wrong about one
big thing (dnd-kit sortable should stay) and right about three:

1. **The frozen-rect family is a symptom, not a rule.** It absorbs an inexact
   reservation that the carve-out model was supposed to make exact. Fix the
   ghost row's height and ~90 lines across four files delete.
2. **Layer identity is branched in ~12 places using two different
   predicates**, not tabled. Story 4 added Card by wrapping Story 3's
   2-state machine in `isCardKey` guards; Story 5/6 would add a third guard
   to each site.
3. **The ghost and the request are computed by separate, opposite-direction
   pipelines** (`placementFor` for the ghost; `over` → `resolveDropTarget` →
   `buildMoveInput` → `pendingPlacementFor` for the marker), kept in sync by
   discipline. §10's "ghost = placement = request" holds only after release.
   Story 6's gap+depth ghost would need a third pair.

Everything else is either (b) — keep — or small.

---

## 1. Where the draft was naive — keep these (b)

**B1. Sortable stays as the in-list renderer.** Draft §9 Option A dropped it.
Two facts it was naive to: the feel is PO-tuned, and the project sidebar is
already the draft's §5.4 rule *inside the sortable world* —
`projectTreeUtils.ts::computeProjection` (59–85) is `range = [next.depth …
prev.depth + 1]` driven by `over` + `delta.x / INDENT_WIDTH`, with
`findPrevSibling`/`findNextSibling` producing the anchors. Story 6
consolidates with that; leaving the sortable world would put the board at
odds with the sidebar at the moment they're meant to merge. Consequences
that therefore stay: `AttachGhostRow` as a non-sortable stand-in
(`KanbanCard.tsx:289`), layout-space `layoutRect` for Card regions
(`dragRegions.ts:197–220`), the E2E `boxOf` correction, and Board-layer
`hoverContainerId` forcing `over` to the container so the target list's
sortable doesn't shift on a bare hover (`useBoardDnd.ts:238`,
`boardDndUtils.ts:60–63`).

**B2. One timer beats a rAF tick.** `popDueAt` (`popSession.ts:302–308`) +
one `setTimeout` (`useBoardDnd.ts:199–201`) fires the motionless case at
exactly the due instant with zero per-frame work; the machine is still
timestamp-pure and unit-tested with synthetic `now`. Strictly better than
the draft's §4.

**B3. Re-drag reconciliation (#22).** `priorPlacement`
(`DragSessionContext.ts:21–29`, `popSession.ts:319–327,344`) and the
reactive reassertion effect (`useBoardDnd.ts:340–346`) handle a response
landing mid-re-drag. The draft had nothing. Note this is *not* the draft's
`origin` — `priorPlacement` is "the pending marker before this drag";
`origin` is "where it was picked up." Story 5 needs both.

**B4. Card candidate in layout space.** Draft §5.2 proposed the visible
card's near half. As built, `layoutRect` backs out the sortable transform so
"resting on a Card" means resting where the card *was* (visually, on the
ghost next to it). PO-tuned; the draft's version isn't obviously better.
Don't touch without a hands-on.

**B5. `snapTick`** (`useBoardDnd.ts:107–111,137–153`) re-renders per frame
during `popSnapMs` because dnd-kit only re-invokes overlay modifiers on
render. Library constraint.

**B6. `resolveCardTarget` returning null = not a region** is the draft's
"candidates filtered by the Valid set" (`dragRegions.ts:126–132`,
`useBoardDnd.ts:162–171`). Same idea, already there.

---

## 2. Vestiges, by leverage (a)

### A1. The freeze family exists to absorb an inexact reservation

**What:** `PopHover.rect`, `.cardCount`, `.scrollTop` (`popSession.ts:76–92`),
`followRegionTop` (252–254), the sticky-hover block (163–178),
`hoverForCard`'s freeze (276–283 — a Card hover has no band; it freezes
only so `===` short-circuits a re-render), `translateRect`
(`dragRegions.ts:396–407`), `DragRegion.scrollTop` (65),
`effectiveCardCount` (`BandGuides.tsx:101–105`).

**Root cause, in the render layer:** the hovered region's ghost row is a
collapsed `KanbanCard` at its *natural* height — `KanbanCard.tsx:141–146`
says so: "bounds the card's own height variance to just the assignee
footer's presence, which the carve-out geometry accepts as an approximation
rather than measuring for exactly." It sits inside a `gap-2` flex list
(`BoardColumn.tsx:81`, `WorkphaseCardList.tsx:61`), while the dead zones it
replaces are exact `ghostCardHeightPx/2` divs *outside* the flex gap
(`BandGuides.tsx:150–158`). And `data-drag-card-count` is
`mergedItems.length` *including* the ghost (`BoardColumn.tsx:188`,
`WorkphaseCardList.tsx:93`). So hovering changes both the region's height
and its card count — precisely the two things `PopHover` freezes, and the
sticky-hover loop (163–178) is the visible symptom ("hover-causes-reshape-
causes-unhover").

**Why (a):** §5 rules "net height never changes." The code kept Story 3's
freeze (necessary under the percentage-band model) and generalized it twice
(scroll, then sibling reflow) to absorb the residual, instead of making the
rule true. `PopHover.scrollTop`'s own comment (78–82) admits nothing reads
it.

**Fix:** render the ghost row inside a fixed-height box (`ghostCardHeightPx`
minus the list gap; the empty-region case pads to the full height), and
pass the count of *other* cards. Then bands read the live `contentRect`,
and every item in "What" above deletes. Independent of B1 — the in-place
`isDragging` row is ours to size regardless of sortable.

**Check before deleting:** hands-on that a pinned-height ghost row reads
fine (§5a's collapse already aims at this), and that the reshape loop is
gone without the sticky block. E2E `drag-column-bands.spec.ts` stays the
gate.

### A2. Layer identity is branched, not tabled

**Two predicates for "is this a Card layer":** `isCardKey`
(`popSession.ts:141–143`; used 203, 228, 382) and `attachToCardId !==
undefined` (`dragRegions.ts:374`, `popSession.ts:339,384`,
`useBoardDnd.ts:238,471`). Plus `key.startsWith('column:')`
(`useBoardDnd.ts:292`) and `startsWith('subrow:')` (471). The
`dragRegions.ts` header (16–19) claims "every function that branches on
region shape does so on that field, never on a separate kind enum" —
`popSession.ts` does the opposite.

**`parentRegionKey` is only set on Cards** (`dragRegions.ts:96–102`), so
pop-out is `isCardKey(ctx) ? region.parentRegionKey : null`
(`popSession.ts:228`) instead of `region.parentRegionKey ?? null`.
`nonCardRegionAt` and `cardRegionAt` (`dragRegions.ts:373–387`) are one
function — `regions.find(r => r.parentRegionKey === parent &&
contains(r.rect, p))` — with `parent` undefined vs. a key.

**Sites a fourth layer touches today** (each is a row in the draft's table):

| # | Site | Branch |
|---|---|---|
| 1 | `popSession.ts::advancePopSession` 158–234 | Board vs locked; `isCardKey` gates zoom-in; parent lookup |
| 2 | `popSession.ts::hoverFor` / `hoverForCard` 256–283 | two hold-clock builders |
| 3 | `popSession.ts::popDueAt` 302–308 | three clocks |
| 4 | `popSession.ts::placementFor` 339–341 | Card early return |
| 5 | `popSession.ts::releaseIntent` 380–391 | `isCardKey` + `attachToCardId` |
| 6 | `useBoardDnd.ts::clampToCurrentContext` 467–474 | `subrow:` prefix + `attachToCardId` |
| 7 | `useBoardDnd.ts::collisionDetection` 238 | Card hover never drives `over` |
| 8 | `useBoardDnd.ts::regionItems` 290–295 | `column:` prefix |
| 9 | `useBoardDnd.ts::resolveCardDrop` 430–448 | three intent kinds |
| 10 | `useBoardDnd.ts::handleDragStart` 314–317 | Stub drags bypass the machine (`pop: null`) |
| 11 | `useBoardDnd.ts::handleDragEnd` 408–414 + `resolveBoardCollisions` 68–71 | separate `attached-child` path |
| 12 | `dragRegions.ts::measureDragRegions` 166–168 | `card:` prefix → two constructors |

**Fix:** `DragRegion.kind: 'column' | 'subrow' | 'card'` (Story 5 adds
`'descendants'`), `parentRegionKey: string | null` on every region, one
`childRegionAt(regions, point, parentKey)`, one `hoverFor` (band fields only
when the child is a column/sub-row), `popInFor(kind)` and `clampAxes(kind)`
as lookups. Sites 1–9 and 12 collapse to lookups; 10–11 are Story 5's
convergence point (below).

### A3. The request is resolved twice, in opposite directions from the ghost

**During the drag** the ghost is `placementFor` (`popSession.ts:328–359`).
At Column layer it returns `existing`/`last` (356) — the in-list slot lives
in dnd-kit's `over` + sortable displacement, not in the placement. **At
release**, `resolveCardDrop` (`useBoardDnd.ts:430–448`) runs machine →
`ReleaseIntent` → one of `resolveDropTarget` (`boardDndUtils.ts:147–205`,
Epic 3.2), `bandDropResolution` (268–289), or attach → `DropResolution` →
`buildMoveInput` (248–254) → `MoveItemInput`; then `pendingPlacementFor`
(295–317) **re-derives a placement from the request**. Two functions answer
"where is the item" from two inputs, held together by `workphaseOnlySlot`
(`itemListOps.ts:61` — audit #3 records that they had drifted).

**Why (a):** `resolveDropTarget` predates the machine; Story 3 layered the
ghost *onto* the existing release-time resolver instead of deriving the
release from the ghost. §10 promises the identity; the code delivers it
post-release only. Story 6 would need a third pair (a gap+depth ghost and a
gap+depth request) unless the placement becomes the source.

**Fix:** feed `over` + side into the machine each sample (`onDragOver` →
ref, read in `evaluatePop`), so `placementFor` at Column layer returns the
anchor slot the sortable is already displaying; record `origin` at drag
start; one `toRequest(item, placement, board)` with `isIdentity` replaces
`ReleaseIntent`, `DropResolution`, `resolveDropTarget`, `bandDropResolution`,
`buildMoveInput`, `pendingPlacementFor`, and the per-case null returns
(`bandDropResolution:284–285`, `resolveDropTarget:155`). `sendItemMove` and
the tracker are untouched. `useLiveDropSide` (`KanbanCard.tsx:24–29`) can
then read the placement instead of dnd-kit's `over` — one truth.

**Story 5 landmine this also defuses:** `KanbanCard.tsx:125–135` decides
"this row is the attach ghost" by `session.pop` being non-null, and its own
comment records the bug that guard prevents (a Stub sibling-reorder being
mistaken for the attach ghost). Story 5 makes `pop` non-null for Stub drags,
so the guard inverts. With `origin`, the test is "placement puts the active
item under this parent *and* origin didn't" — no dependency on drag type.

### A4. Card regions are column-shaped with nominal fields

`cardRegionFromKey` (`dragRegions.ts:230–256`) fills `containerId: cardId`,
`columnId: cardId`, `coveredWorkphaseIds: [wp]`, `targetWorkphaseId: wp`,
`isTerminal: false`, `cardCount: 0`. `regionWorkphaseFor` (the only reader
of those workphase fields) is reached only *after* `placementFor`'s Card
early return (339–341 vs 358), so `CardTarget.workphaseId` is dead — and
`resolveCardTarget` does an `items.find` per Valid card **per pointer
move** to compute it (`useBoardDnd.ts:164–168`). Falls out of A2: a
`kind`-discriminated region carries only what its kind reads.

### A5. Measurement scope

`evaluatePop` → `measureRegions` on **every pointermove**
(`useBoardDnd.ts:189,211–213`): `querySelectorAll` over the board, and per
element `findVerticalScrollAncestor` (a `getComputedStyle` per ancestor,
`dragRegions.ts:290–296`), `currentTranslate` (another, 213–220), and for
Cards `findParentRegionKey` (277–283). All three are *structural* facts
recomputed per sample, for every region including ones the locked layer
cannot use (Board never reads Card regions; a locked column never reads
other columns). The header comment (139–141) says "a handful of
getBoundingClientRect calls" — it's also O(elements × ancestor depth)
computed-style reads. Plus a full re-measure at release
(`useBoardDnd.ts:432`) that `releaseIntent`'s own comment (377–379) says is
unnecessary.

**Fix:** resolve kind / parent key / scroll ancestor once per drag (they
don't change mid-gesture); per sample measure the context box and its
children only (draft §7.1); `currentTranslate` only for `card` kind; release
reads `regionsRef`.

### A6. `clampToCurrentContext` clamps x-only for merged columns

`useBoardDnd.ts:467–474` encodes §2's "merged column reduces to a
horizontal axis lock — the context spans the column's full height." That
stopped being true in the Story 3 follow-up when the region moved to the
content-sized list box (`BoardColumn.tsx:154–163`: "sizes to its own
content rather than the column's available height"). Today the pointer
below a short merged column's last card is *nowhere* (exit clock runs)
while the overlay follows it there. Either clamp both axes for every kind
(draft §2, one rule) or amend §1 — code and wiki disagree either way.

### A7. Small deletions

- `PopHover.scrollTop` / `DragRegion.scrollTop` — nothing reads them
  (grep; only fixtures). Goes with A1.
- `translateRect(rect, deltaScrollTop)` — the parameter is a top-edge delta
  now; name is a scroll-era leftover. Goes with A1.
- `createBoardCollisionDetection` (`boardDndUtils.ts:81–83`) — test-only.
- `scopeWorkphaseIds` — the server maps it onto a same-workphase move and
  keeps it "only so this legacy request shape stays valid"
  (`server/routes/items.ts:324–329`); the client sends it only because a
  container-hover reorder has no anchor. Under A3 every positional reorder
  anchors, and the shape retires client-side.

### A8. `DndContext` gets no modifier — test whether that's still needed

`useBoardDnd.ts:250–252`: "DndContext itself gets no modifier, so the
collision rect and `delta` stay raw." Under rule 1 no consumer wants the raw
rect: `closestCorners` restricted to in-context candidates picks by a rect
that may be a column away, and `resolveDropSide(active.rect.current.
translated, over.rect)` (401) takes the side from the unclamped copy — so
during the exit clock `over` and the side line can flip to an edge card the
visible copy isn't near. Hypothesis: a Story 3 (pre-rule-1) leftover from
when a bare hover elsewhere *did* resolve. **Test, don't assume:** clamping
at `DndContext` may interact with the overlay modifier's own tween. If it
works, `over`/side track the visible copy and the draft's "within-action
receives the clamped pointer" is achieved through dnd-kit.

---

## 3. Same rule, different shape — judgment calls (c)

- **C1. Path vs. `contextKey` + `parentRegionKey` chain.** Same information;
  the chain lives on regions instead of in state. Fine once
  `parentRegionKey` is universal (A2).
- **C2. `Placement.parentId?: string | null` with presence semantics**
  (`itemListOps.ts:31–48,81–95`) vs. a discriminated union. Subtle ("omitted
  = no opinion, `null` = Free") but encapsulated by the `rendered*` helpers;
  `computeChildCounts` and `freeItemOrder` are placement-aware by *sharing*
  those helpers, not by patch. Re-type only if A3 re-shapes `Placement`.
- **C3. Selectors.** `selectBoardItems` and `getAttachedChildrenFrom` share
  the filter-by-rendered* → sort → `applyPlacements` shape. Foldable into
  one `listMembers`; not wrong as is.
- **C4. Terminal in-context anchor** (`boardDndUtils.ts:181–189`) — real
  server constraint; disappears under A3 if a terminal Column layer's
  within-action is `existing`.
- **C5. Two pop-in clocks.** The draft has the same two values; only the
  duplicated *code paths* are A2.

**Validated (draft and code agree, no action):** pure machine; timestamp
clocks; regions as data measured from `data-drag-region`; classification
once at start consumed as a candidate filter; one commit path
(`sendItemMove`) with per-item sequencing; the `DragOverlay` modifier via
ref; every threshold a panel value; `data-drag-state`/`-context` as the E2E
surface.

---

## 4. Recommended rework, sequenced before Story 5

| Phase | Change | Behavior change? | Gate |
|---|---|---|---|
| 0 | A2 `kind` + universal `parentRegionKey` + `childRegionAt`; A4 slim Card regions; A7 deletions | none | unit suites (fixtures gain `kind`) |
| 1 | A1 fixed-height ghost row + ghost-exclusive count → delete the freeze family | visual only (ghost height pinned) | hands-on + `drag-column-bands.spec.ts` |
| 2 | A5 per-layer measurement, structure resolved once per drag | none | E2E green; profile a pointermove |
| 3 | A3 placement-as-truth: `over` → machine, `origin`, `toRequest` + `isIdentity` | none intended; identity now skips no-op writes | `toRequest` table tests replace `resolveDropTarget`/`bandDropResolution`/`pendingPlacementFor` tests |
| 4 | A8 (clamp at `DndContext`) and A6 (clamp axes) | possible feel change | hands-on; A6 needs a wiki ruling first |

After phases 0–3, **Story 5** is: a `descendants` kind whose region is the
Card's children section; `handleDragStart` puts a Stub drag *into* the
machine at `descendants:<parent>` instead of `pop: null`; the existing
`attached-child` branch of `resolveBoardCollisions` (68–71) becomes that
layer's in-context collision policy (same code, reached through the
machine); `origin` gives the set-down. **Story 6** is `computeProjection`
lifted out of the sidebar into the Descendants within-action, producing an
`{ parentId, anchor }` placement the same `toRequest` already sends.

Phases 0 and 3 are the ones that change Story 5/6's cost from "add a branch
in twelve places" to "add a row." Phase 1 is the largest pure deletion.
Phase 2 is the only perf item and can wait if profiling says so.

---

## 5. Drift found along the way (wiki / comments)

- Wiki §2 "in a merged column this reduces to a horizontal axis lock — the
  context spans the column's full height" vs. §1's content-sized box rule
  and `BoardColumn.tsx:154–163`. (A6.)
- `dragRegions.ts:16–19` "never a separate kind enum" vs. `popSession.ts`'s
  `isCardKey`. (A2.)
- `popSession.ts:78–82` `scrollTop` "carried along for whatever else keys
  off it" — nothing does. (A7.)
- `dragRegions.ts:139–141` "a handful of getBoundingClientRect calls per
  pointer move" undersells the computed-style walks. (A5.)
- `popSession.ts:377–379` "needs no fresh geometry at release time" vs.
  `useBoardDnd.ts:432` re-measuring. (A5.)
- `KanbanCard.tsx:141–146` documents the approximation A1 removes; §5a's
  "keeps that approximation close" wording follows it.
