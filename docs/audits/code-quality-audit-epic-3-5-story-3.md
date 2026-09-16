# Code Quality Audit — Epic 3.5 Story 3 (2026-09-13)

Scope note: audited commit `e77e31f` ("implementing story 3 - Pop state
machine + Card/Column drop bands"), Epic 3.5 Story 3, HEAD with a clean
tree. Story-scoped per explicit request. Entirely client-side, ~3,700
lines: the pure pop-state machine (`workflow/popSession.ts`), DOM region
measurement and band geometry (`dragRegions.ts`), band drop resolution and
machine-following collision detection (`boardDndUtils.ts`), the ordinal
placement layer and write reconciliation (`itemListOps.ts`), the rewritten
gesture hook (`useBoardDnd.ts`, 178 → 406 lines), the tuning panel and
persisted `DragTuning`, band guides, the `DragSession` / `PlacementsContext`
/ `DragTuningContext` providers, and a 536-line E2E spec. No server
change. Run as four parallel passes per `.claude/guides/audit-workflow.md`;
each finding is tagged with the pass(es) that surfaced it. Both Correctness
Fix Now findings and the two cheapest Duplication Fix Now findings were
re-traced by hand against current code before inclusion. Tags: **Fix Now**,
**Watch List**, **Covered by Epic N**, **Informational**. No new finding
qualifies for a Covered-by tag; Story 2 #17 remains **Covered by Epic 3.5
(Story 5)** and is not re-reported.

Story 2 follow-through — every pass checked the previous audit's open
items against this commit:

| Story 2 # | Item | Status at `e77e31f` |
|---|---|---|
| #7 | Client caps the current parent | Open, unchanged |
| #8 | `ItemDetailPanel` spreads `reindexed` into state | Open, unchanged (file not in diff) |
| #9 | Cascade side-effects undisclosed | Open, unchanged — one more reader now (see #14) |
| #10 | Server's depth formula inline | Open, unchanged (no server change) |
| #11 | Sheet dropdown lacks depth half | Open, unchanged |
| #12 | `isStub` five sites | **Closed** — `lib/isStub.ts`, no inline copy survives |
| #13 | Card/Stub chrome ×2 | **Closed** — `useDropTargetProps` + `DropSideIndicator`; `data-pending` landed once, inside the hook |
| #14 | Twin session states, `isCardBeingDragged` drilled | **Closed** — one `DragSession` atom, `useIsCardBeingDragged()`; residual two-hop drill inside `BoardColumn` → #24 |
| #15 | `useItemManagement` bundles pure ops | **Closed** — `itemListOps.ts`; residual `ItemWriteTracker` still in the hook file → #4 |
| #16 | Test scaffolding (E2E helpers) | **Open, made worse** — none of the four helpers added; new spec carries a fresh copy of each → #7 |
| #17 | Stub-drag rule in collision + classification | Unchanged — Covered by Epic 3.5 (Story 5); the ref-read mechanism the audit proposed is now exactly how the pop session reaches collision detection |

Overall shape: the machine and the math are right. `advancePopSession` is
a clean three-state transition with one timer contract (`popDueAt`); the
frozen-on-entry rect is applied consistently in `hoverFor` and
`releaseIntent`; `resolveBoardCollisions` cannot return a foreign-region
card or a Stub during a Card drag; `bandDropResolution` can only produce
anchors the server accepts; `applyPlacements` renders each item exactly
once; every timer / listener / rAF has a cleanup on end, cancel, and
unmount; the one geometry (`Rect` / `Point` / `Band` / `bandFor` /
`regionAt`) and the one placement layer are single-owner; the tuning panel
is descriptor-driven; unit fixtures are consolidated; vocabulary
(`locked` / `popped-out`, band names, slot values, `data-*` attributes) is
spelled identically across code, tests, wikis, and `client/CLAUDE.md`. Four
of the seven Story 2 items this story adopted are closed as proposed.

The real gaps: (a) the live ghost and the pending marker share one
`placements` slot, so re-dragging a pending item — an explicitly supported
path — corrupts the marker three ways; (b) the `'existing'` slot is the
wrong ordinal claim for a null-position item entering an active column,
producing exactly the silent order flip §10 forbids; (c) `useBoardDnd` and
`boardDndUtils` each now bundle three-plus independent mechanisms; (d) two
small resolve-vs-draw pairs (band boundaries, pop-state name) that will
become four with Story 6; (e) the E2E scaffolding Story 2 asked for was not
added and the new spec re-creates all of it; and (f) five documentation /
comment drifts, two of them in the wikis.

> **Status sweep (2026-09-15):** every finding below was re-verified against
> `2300fdf` ("reconcile wiki, test plan, code") by
> `code-quality-audit-epic-3-5-story-3-reconciled.md`, which carries the full
> status table and the follow-on findings. Findings with a **Status** line
> here changed state; every other finding is **open, unchanged** at `2300fdf`.

---

## Fix Now

### 1. The live ghost and the pending marker share one `placements` slot, so re-dragging a pending item overwrites, deletes, or prematurely clears the marker `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:282` (start overwrites), `:292` (cancel deletes), `:349` (no-op end deletes); `client/src/components/workflow/useItemManagement.ts:47–49` (`previewPlacement`), `:53–67` (`writes.begin` / `complete`) — both call `withPlacement(s, id, …)` on the same map; `client/src/components/workflow/itemListOps.ts:258–267` (`completeItemWrite` clears whatever placement the id has); `DragSessionContext.ts:56–60` (`useIsPending` = "has a placement and isn't the active item")

DRAG-6.5 (re-dragging a pending item) is a supported path — wiki §10 and an
E2E case — and it hits three concrete failures, verified by hand:

- **Pickup jumps the ghost to a stale slot.** `handleDragStart` replaces
  X's pending `{B, {anchorId: A, before}}` with `placementFor(...)` =
  `{B, 'existing'}`; `'existing'` sorts X by its *old* position (the
  response hasn't landed), so the card correctly drawn first in B jumps
  the moment it's picked up.
- **Cancel or a no-op release destroys the marker mid-flight.**
  `previewPlacement(X, null)` deletes the map entry → X renders by its raw
  `workphaseId` (back in A, no `data-pending`) until the response lands;
  `completeItemWrite` then finds no placement, so no tripwire either. A
  second drag of X from A in that window sends `{scopeWorkphaseIds: [A]}`
  and the server (X already in B) appends in B — X vanishes from A again.
  Self-healing, but exactly the silent wrong this layer exists to prevent.
- **A response landing mid-re-drag clears the live ghost and logs a false
  inversion.** Drop X (seq 1), re-pick X, hover C's top band; write 1's
  response arrives → `complete(X, 1)` still matches → `completeItemWrite`
  sees the *ghost*, computes `before` with X first in C, clears it,
  computes `after` with X at its real B position → inversion recorded,
  ghost gone until the next session change. The panel's inversion counter
  — the diagnostic this story added — reports a client bug that isn't one.

Same root, different trigger: a Sheet `PUT` on X arriving through
`handleItemUpdated` while X's board write is pending also clears the marker
and, if the PUT committed before the move, records a false inversion.

**Fix:** keep the ghost out of the pending map. `ItemListState` becomes
`{ items, pending: Placements, ghost: { itemId, placement } | null, inversions }`;
selectors layer `ghost` over `pending` (a ghost for X shadows X's pending
entry during the drag); `previewPlacement` writes only `ghost`;
`writes.begin` writes only `pending`; `completeItemWrite` clears and
tripwires `pending[id]` only when called from `writes.complete` (a flag,
or the tracker passes the recorded placement and the reducer compares by
reference); `handleDragStart/Cancel/End` never touch `pending`;
`useIsPending` = `pending.has(id)`. Unit cases: re-drag then cancel keeps
the marker; a response during a re-drag clears the marker but not the
ghost and records no inversion; a Sheet response for a pending item
doesn't clear the marker.

**Status (2026-09-15, `2300fdf`):** partially resolved. Cancel / no-op
release now restores `priorPlacement` when `writes.isPending` (an `inFlight`
set separate from `placements`), and a reactive effect re-asserts the live
ghost after a response clears it. Still open — the reducer is ghost-blind,
so a mid-re-drag response still logs a false inversion, a Sheet PUT still
clears a pending marker, and pickup still jumps to `{B, 'existing'}`.
Carried as reconciled-audit #1 (reference-compare fix) and #9 / #10.

### 2. The `'existing'` slot is the wrong ordinal claim for an item with `position === null` entering an active column — it previews at the top, the server appends `[Correctness & Security]`
**Files:** `client/src/components/workflow/popSession.ts:161–166` (`placementFor` → `'existing'` for middle band / in-context); `client/src/components/workflow/boardDndUtils.ts:277–283` (`pendingPlacementFor` → `'existing'` for a bare `workphaseId`); `client/src/components/workflow/itemListOps.ts:91–93` (`(a.position ?? 0)` sorts null first); server rule `server/src/lib/itemHierarchy.ts:243–250`

Reopening a done item (position `null`) by dragging it into In Progress's
middle band — the largest band — or popping in and releasing over the
container sends `{workphaseId: InProgress}`. The server keeps the position
*if it has one, else appends*. The client's claim is `'existing'`, which
`byPositionThenCreatedAt` renders as *first* (`?? 0`) — the exact "null
would sort the pending item to the top" trap wiki §10 calls out. Ghost at
the top during the drag, pending marker at the top after release, row
jumps to the bottom on the response. `freeItemOrder` filters
`position === null` out of `before`, so the tripwire is blind to it — a
silent order flip. Same for an "Unknown status" item whose position was
nulled by `nullForeignWorkphasePositions`. Verified by hand; not exercised
by any test (DRAG-3.9 covers active → done only).

**Fix:** mirror the server: in `placementFor` and `pendingPlacementFor`,
when the carried item's `position === null` and the target is non-terminal,
use `'last'` instead of `'existing'` (pass `activeItem` or
`{ workphaseId, position }` rather than just `activeWorkphaseId`). Pin with
a `popSession.test.ts` case, a `pendingPlacementFor` case, and an E2E
done → In Progress middle-band case asserting `titlesIn` before and after
the response are equal.

**Status (2026-09-15, `2300fdf`):** resolved — `placementFor` and
`pendingPlacementFor` take the active item's `position` and preview
`'last'` when it's `null` and the target isn't terminal (reconciliation
#29); pinned in `popSession.test.ts` and `boardDndUtils.test.ts`. The E2E
case wasn't added. The rule shipped as two copies with differing terminal
handling → reconciled-audit #3.

### 3. `useBoardDnd.ts` (406 lines) bundles four independent mechanisms behind one "gesture" label — and the cheap symptom is that the clocks are stopped in three places by copy `[File Responsibility + Duplication & Abstraction]`
**File:** `client/src/components/workflow/useBoardDnd.ts:1–406`; the copy-paste at `:115–118` / `:120–124` (`clearPopTimer` / `cancelSnap`) vs `:185–192` (effect cleanup inlines both bodies verbatim); `:289–291` and `:299–301` (`clearPopTimer(); cancelSnap(); updateSession(null);` ×2); `:90–93` and `:96`, `:172–174` (two `ref + useEffect(() => ref.current = x)` latest-ref pairs)

The header says the hook owns "the clocks, the DOM measurements, and the
dnd-kit plumbing" — already three, and the body has more: the **pop clock**
(`pointerRef`, `popTimer`, `evaluatePop`, the `pointermove` effect,
`:153–193`); the **snap tween** (`overlayTranslate`, `snap`, `snapFrame`,
`snapTick`, `startSnap`/`cancelSnap`, `:97–145` — a rAF easing loop
unrelated to the machine except that a pop *triggers* it); **region
measurement** (`:147–151`); **collision + overlay-clamp wiring**
(`:196–239`, plus `clampToCurrentContext`/`clampAxis` at `:383–406`);
**session/ref bookkeeping** (`:84–113`) that exists to give the above
something to share; and the actual **orchestration** (`:260–376`). The pop
clock and the snap tween are independently testable mechanisms with their
own state and cleanup and no shared invariant beyond "both read
`sessionRef`". The effect cleanup copies both stop-function bodies rather
than calling them (presumably to avoid `exhaustive-deps` on render-scoped
functions) — add a fourth ref to `cancelSnap` and the copy stays at three.

**Fix (cheap, do now):** make `clearPopTimer` / `cancelSnap`
`useCallback(..., [])` (they touch only refs) and call them from the
cleanup; fold the cancel/end trio into a local `endGesture()`; a 4-line
`useLatestRef<T>(value)` for the two mirrors.
**Fix (structural, when Story 4 adds the Card context):** `usePopClock({ rootRef, tuning, previewPlacement, board })`
owning `pointerRef` / `popTimer` / `evaluatePop` / the pointermove effect /
`measureRegions`; `useSnapTween(popSnapMs)` owning the rAF loop and
returning `(target: Point) => Point` for the modifier; `useBoardDnd` keeps
sensors, `session`, the three handlers, collision/modifier wiring composed
from the two hooks, and `resolveCardDrop` / `resolveDrop` / `regionItems`
— roughly 220–250 lines.

### 4. `boardDndUtils.ts` (311 lines) spans collision detection, drop/band resolution, and network write dispatch — and the write half still imports a type from a hook file, the residual of Story 2 #15 `[File Responsibility]`
**File:** `client/src/components/workflow/boardDndUtils.ts:1–82` (collision: `CollisionSession`, `resolveBoardCollisions`, `createBoardCollisionDetection`, `rectCenterInside`), `:84–272` (resolution: `buildColumnForWorkphaseMap`, `subrowContainerId`, `resolveDropTarget`, `resolveDropSide`, `buildMoveInput`, `bandDropResolution`), `:274–311` (dispatch: `pendingPlacementFor`, `sendItemMove`); `:4` (`import type { ItemWriteTracker } from './useItemManagement'`)

The header still says "pure drop-resolution … extracted from useBoardDnd" —
true of the middle third. Collision detection is a dnd-kit-specific
algorithm with no `MoveItemInput` in sight; dispatch is the try/fold/reload
block over the injected `moveItem` and `ItemWriteTracker`. That interface
is a plain contract type with no React in it, sitting in the hook file for
no reason but history — the exact smell #15 was raised to close, now one
file removed instead of eliminated.

**Fix:** `boardCollisions.ts` for `:1–82`; `boardDndUtils.ts` keeps the
resolution core (now matching its own comment); move `ItemWriteTracker`
into `itemListOps.ts` beside `Placement` / `ItemListState`, and
`pendingPlacementFor` / `sendItemMove` there or to a sibling
`itemWrites.ts` — completing the pure/hook boundary
`dragClassification.ts` / `DragSessionContext.ts` models.

### 5. Band boundaries are computed in `bandFor` and re-derived in `BandGuides.linePositions` — the guide's "shows exactly where it will land" claim rests on two formulas agreeing `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/dragRegions.ts:130–136` (`fraction < columnTopBand` → top; `fraction > 1 - columnBottomBand` → bottom); `client/src/components/BandGuides.tsx:29–31` (`linePositions`: `{ top: columnTopBand, bottom: 1 - columnBottomBand }`), used at `:42`, `:52–56`, `:63`

Same two numbers, two owners — verified. Story 6 adds a second band table
(`stubFirstChildBand` / `stubLastChildBand` / `stubPopBandStart` /
`stubPopBandEnd`) needing the same resolve-and-draw pair; without a shared
boundary function it becomes four formulas.

**Fix:** `export function bandBoundaries(tuning): { top; bottom }` in
`dragRegions.ts`; `bandFor` compares against it and `BandGuides` /
`HoveredBandGuide` draw from it; delete `linePositions`. One
`dragRegions.test.ts` assertion that `bandBoundaries` returns the fractions
`bandFor` switches at.

**Status (2026-09-15):** resolved as proposed — `bandBoundaries(tuning)` in
`dragRegions.ts` (with a `BandTuning` alias); `bandFor` switches on it,
both guides draw from it, `linePositions` deleted; boundary-agreement test
in `dragRegions.test.ts`.

### 6. Pop-state name derived in two components, spelled two ways (`popped-out` vs `popped out`) `[Duplication & Abstraction]`
**Files:** `client/src/components/BoardView.tsx:309` (`isLocked(session.pop) ? 'locked' : 'popped-out'`); `client/src/components/DragTuningPanel.tsx:123` (`isLocked(pop) ? 'locked' : 'popped out'`)

Identical ternary, one hyphen apart — verified. `data-drag-state` is the
E2E surface (12 assertions) and the panel is the human diagnostic meant to
show the same thing. Stories 4 and 5 both extend this vocabulary.

**Fix:** `export type PopState = 'locked' | 'popped-out'; export function popState(session): PopState`
beside `isLocked` in `popSession.ts`; `BoardView` stamps it, the panel
prints it.

**Status (2026-09-15):** resolved as proposed — `PopState` + `popState()`
in `popSession.ts`; both call sites use it (the panel now prints
`popped-out`, matching the E2E surface).

### 7. E2E: the new band spec re-creates every helper Story 2 #16 named, plus three spec-local geometry recipes that belong in `dragGesture.ts` `[Duplication & Abstraction]`
**Files:** `tests/ui/drag-column-bands.spec.ts:48–75` (`seed`: reset + templated workflow + two-step board fetch `:52–53` + plan→create→pin loop `:56–67`); `:86–91` (`openBoard`, the sidebar-select + Board-tab three-liner); `:63–66`, `:367–368`, `:407–408` (inline `POST /items` — only the first asserts `ok()`); `:103–106` (`bandPoint`); `:239–241`, `:274–277`, `:338–340` (the inter-column gap point, byte-identical ×3); `:206`, `:235`, `:293` (`column:${…}` key hand-rolled where `keyOf` exists in one test); `:360–368` vs `:401–408` ("delete Review column, widen In Progress, create Y in Review" ×2); `:245`/`:278`/`:379` and `:211`/`:297`/`:303` (sleep-then-assert-state ×6). Prior copies: `tests/helpers/itemRepositioningScenario.ts:38–44`, `:86–92`; `tests/ui/drag-target-classification.spec.ts:22–26`, `:41`; the `Board`-tab click ~45× across `tests/ui`

This spec is the first consumer Story 2 #16 said should "use them from day
one"; instead it is a fourth helper set. `bandPoint(region, fraction)` is
the generalization of `topQuarter` (0.15) / `bottomQuarter` (0.85) /
`pastColumnEnd` already in `dragGesture.ts` — same `boxOf` +
`y = box.y + box.height * f` shape — and Story 6's Stub bands need it on a
Card. The six `waitForTimeout(tuning.popDelayMs + 250)` + `toHaveAttribute`
pairs are one "rest until the machine reports X" recipe. Stories 4/5/6
each add a drag spec.

**Fix:** `tests/helpers/seed.ts`: `seedItem(request, data)` (asserts
`ok()`), `seedPositionedItems(request, plan)` (the plan→create→pin loop —
replaces three copies), `fetchDefaultBoard(request, workflowId)`.
`tests/helpers/dragGesture.ts`: `atFraction(locator, f)` with
`topQuarter` / `bottomQuarter` defined through it; `gapBetween(a, b)`;
`awaitDragState(page, state)` / `awaitDragContext(page, key)` (retrying
`toHaveAttribute`, replacing sleep+assert). `ProjectSidebarPage.openBoard(name)`.
Import the client's `columnRegionKey` for `keyOf` the way the spec already
imports `DEFAULT_DRAG_TUNING`.

**Status (2026-09-15):** resolved as proposed, and Story 2 #16 with it.
`tests/helpers/seed.ts`: `seedItem` (asserts `ok()`, typed `SeededItem`),
`seedPositionedItems` (replaces the three plan→create→pin loops — both
repositioning scenarios and the band spec), `fetchDefaultBoard`.
`tests/helpers/dragGesture.ts`: `atFraction` (with `center` /
`topQuarter` / `bottomQuarter` defined through it), `gapBetween`,
`dragMachine` + `awaitDragState` / `awaitDragContext` (retrying
assertions replacing every sleep-then-assert pair; the one remaining
`waitForTimeout` in the band spec is DRAG-6.5's deliberate negative
hold). `ProjectSidebarPage.openBoard(name)`. The band spec imports
`columnRegionKey` / `subrowRegionKey` / `DRAG_REGION_ATTR` from the
client's `dragRegions.ts` — Playwright resolves the client module fine —
and its two fold-Review-into-In-Progress blocks became one
`foldReviewIntoInProgress(request, s, displayMode)`. The classification
spec migrated too. Non-obvious: `seedPositionedItems` has to return the
full `SeededItem` row (not just `{id, title, position}`) because the
repositioning scenarios' `ScenarioItem` reads `workphaseId` / `createdAt`.

### 8. Tuning panel: the field-label class string is duplicated for the one non-numeric field `[Duplication & Abstraction]`
**File:** `client/src/components/DragTuningPanel.tsx:65` and `:100` (`flex items-center justify-between gap-2 text-[11px] text-zinc-400`, 6 classes)

The descriptor table drives every numeric field through `renderFields`; the
color field hand-rolls the same `<label>` because the table is
numeric-only. Two-minute fix; listed here because Story 6 exposes more
panel values and Story 8 may add overlay colors.

**Fix:** a `FIELD_LABEL` constant, or widen the descriptor to
`{ kind: 'number' | 'text' }` and route `overlayFreeDescendantColor`
through `renderFields` (also removes the second `onChange({ ...tuning, … })`
spelling).

**Status (2026-09-15):** resolved — both halves: the descriptor is now a
`Field` union (`kind: 'number' | 'text'`, with a `TextKey` mapped type),
the color field is a row in `OVERLAY_FIELDS`, and the label class is the
`FIELD_LABEL` constant rendered in one place.

### 9. Both wikis claim the inversion tripwire is "logged to the console" — it isn't, and the story doc's own "As built" note says so `[Consistency & Drift]`
**Files:** `docs/wiki/board-drag-interaction/README.md:426–427` ("An inversion is logged to the console and counted in the dev/test panel"); `docs/wiki/item-positioning/README.md:296–297` ("a difference is logged and counted"); vs `client/src/components/workflow/itemListOps.ts` (`findInversion` / `completeItemWrite` push into `ItemListState.inversions` only) and `docs/planning/epic-3-5-stories/story-3-pop-state-machine-column-bands.md:432–434` ("The tripwire's log lives in state rather than a `console.warn` side effect inside an updater; the panel renders it")

No `console.*` anywhere in the inversion path. The wikis are the settled
truth and are contradicted by this commit's own historical record.

**Fix:** reword both to "counted and surfaced in the dev/test panel".

**Status (2026-09-15, `2300fdf`):** half resolved — `board-drag-interaction`
§10 now says "nothing goes to the console" (reconciliation #18);
`item-positioning/README.md:297` still says "logged" → reconciled-audit #6.

### 10. Wiki §10 describes `Placement` as `{ list, slot }` — the field is `workphaseId` `[Consistency & Drift]`
**File:** `docs/wiki/board-drag-interaction/README.md:420–421`; actual shape `client/src/components/workflow/itemListOps.ts:31–39`

Every other reference (story doc vocabulary section, `popSession.ts`,
`boardDndUtils.ts`) says `workphaseId`. **Fix:** `{ workphaseId?, slot }`.

### 11. Stale comment in `boardDndUtils.ts` still describes the pre-Story-3 optimistic re-bucket this commit removed `[Consistency & Drift]`
**File:** `client/src/components/workflow/boardDndUtils.ts:133–140`

"`activeWorkphaseId` must be the active item's *original* (pre-drag)
workphase, not a live lookup — the caller's drag-over handler
optimistically re-buckets the dragged item's workphaseId in local state …"
Story 3 decision 8: "Nothing in `items` is mutated during a drag. Story 2's
`handleDragOver` re-bucket goes away." `handleDragOver` and `restorePreview`
no longer exist (grepped: this is the only surviving reference). **Fix:**
delete the caveat; `activeWorkphaseId` is simply the active item's
workphase.

**Status (2026-09-15):** resolved — caveat replaced with the current
rule (nothing in `items` mutates during a drag).

### 12. `item-repositioning-cross-column-dnd.spec.ts`'s "hardcodes `side: 'before'`" framing is wrong, and this commit fixed the identical claim in `dragGesture.ts` but left this one `[Consistency & Drift]`
**File:** `tests/ui/item-repositioning-cross-column-dnd.spec.ts:15–23` (header), `:159–165` (3.a), `:194–197` (4.a); corrected sibling text at `tests/helpers/dragGesture.ts` (`topQuarter` / `bottomQuarter` comment, this commit)

`resolveDropSide` (`boardDndUtils.ts:215–225`) computes `before` / `after`
from card centers and `handleDragEnd` calls it on every anchored drop —
nothing is hardcoded, and hasn't been since the Epic 3.2 addendum. This
commit rewrote the same wrong claim in `dragGesture.ts` and edited this
file's neighbouring block (the section-5 describe) without touching it.
Story 3 makes it doubly stale: 4.a is a cross-region drop now governed by
the pop machine's context/band state, not the hovered card.

**Fix:** reword header and the 3.a / 4.a comments to point at
`resolveDropSide`'s geometry and, for 4.a, the pop machine's band rule.

**Status (2026-09-15):** resolved — header and both inline comments now
describe `resolveDropSide` (card-center geometry, target shifted by the
swap preview) and, for 4.a, the cross-region band resolution.

### 13. Story doc's "As built" says `DragTuningContext` was "planned and dropped" — it shipped and is load-bearing `[File Responsibility → Consistency & Drift]`
**Files:** `docs/planning/epic-3-5-stories/story-3-pop-state-machine-column-bands.md` ("As built": "`DragTuningContext` was planned and dropped — the hook takes the tuning as a dep, the panel takes it as props … nothing needed a context") vs `client/src/components/workflow/DragTuningContext.ts` (12 lines) and `client/src/components/BandGuides.tsx:3`, `:39`, `:60` (`useDragTuning()`)

The file itself is a clean single-purpose context, correctly separate from
`DragSessionContext` ("nothing here is read on the pointer path"). The doc
contradicts the code it retrospects. **Fix:** one sentence — it shipped,
for `BandGuides` / `HoveredBandGuide`, which read tuning off the render
path.

**Status (2026-09-15, `2300fdf`):** resolved — story doc corrected
(reconciliation #26).

---

## Watch List

### 14. `findWorkphaseForItem` reads the raw `workphaseId`, but the hovered card may be rendered in this column only by a pending placement — an in-context drop next to it is classified by the anchor's *old* column `[Correctness & Security]`
**Files:** `client/src/components/workflow/useItemManagement.ts:84–86`; `client/src/components/workflow/boardDndUtils.ts:170–172`; `useBoardDnd.ts:249`

Before this story the optimistic re-bucket mutated `workphaseId`, so a
just-dropped card's raw value matched where it was drawn. The placement
layer deliberately stops mutating `items`, so during Y's pending window Y
is drawn in In Progress while `findWorkphaseForItem(Y)` answers Todo. Pop X
into In Progress, release over Y: `resolveDropTarget` resolves Y to *Todo*
→ if X came from Todo it's a `reorder` in `[Todo]` (X bounces back); if X
came from Review it's a `move` to Todo anchored at Y — a silent
wrong-column write the server accepts. Needs the pop-in delay to elapse
inside Y's response latency — unreachable at local defaults, reachable
with a slow server or a `page.route` delay. Nothing pins it. (This is also
one more reader of the stale cascaded `workphaseId` Story 2 #9 describes.)

**Fix:** `findWorkphaseForItem` returns
`renderedWorkphaseId(item, placements)` (already exported from
`itemListOps.ts`); add a `resolveDropTarget` test with a hovered card whose
placement puts it in the column.

### 15. A stale response is dropped whole, `reindexed` pairs included, with no resync `[Correctness & Security]`
**Files:** `client/src/components/workflow/useItemManagement.ts:59–63` (`complete` returns `false` and does nothing); `client/src/components/workflow/boardDndUtils.ts:302–305` (return ignored, no log)

Decision 5 says the later response supersedes the pairs; it only
supersedes the *row*. If write 1 reindexed A/B/C and write 2 didn't, the
client keeps old numbers for A/B/C and the renumbered-space number for X →
mis-sort, and the next tripwire fires against a stale baseline. Reindex is
lazy and rare, DRAG-6.5 is rare — but this is the one case where dropping
is worse than applying, and it's silent.

**Fix:** in `complete`, when `writeSeq !== seq && response.reindexed?.length`,
call the injected `loadBoard()` (or return a `'stale-reindexed'` sentinel
and let `sendItemMove` reload). Optionally `console.debug` the drop.

**Status (2026-09-15, `2300fdf`):** resolved, immediate variant —
`ItemWriteTracker.complete` returns `{ applied, needsResync }`; a stale
response's row is discarded but `needsResync` is true when it carried
`reindexed` pairs, and `sendItemMove` reloads. Both branches pinned in
`boardDndUtils.test.ts`.

### 16. A board reload mid-drag unmounts the `DndContext` but not the session — listener, timer and ghost keep running against the reloaded board, and the eventual `pointerup` completes the gesture with a pre-reload snapshot `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:178–193` (listener/timer live on `machineActive`, cleared only by `handleDragEnd/Cancel`), `:155–171`; `client/src/components/BoardView.tsx:103–140` (`loadBoard` sets `loading`), `:230–236` (loading branch unmounts the whole `DndContext`)

`loadBoard()` is reachable without a click while a drag is live — the
failure path of a *previous* drop, or `handleReorderColumns` failing. The
`DndContext` unmounts (dnd-kit fires no `onDragCancel` on unmount — checked
its effects), `session` stays set, `evaluatePop` keeps measuring the
reloaded DOM and previewing, and dnd-kit's still-live `PointerSensor`
delivers the eventual `pointerup` to `handleDragEnd` via `latestProps`,
which resolves by band against the *reloaded* regions using the
*pre-reload* `activeItem` and writes. Not a permanent wedge; a state the
code doesn't reason about.

**Fix:** (a) an effect on `[deps.board]` in `useBoardDnd` that runs the
cancel path when `sessionRef.current` is set and the board identity
changed since `handleDragStart` (capture `board` in the session), plus the
same when `loading` flips — or (b) keep the `DndContext` mounted during
reload so dnd-kit's own lifecycle completes. (a) is smaller and testable.

**Status (2026-09-15, `2300fdf`):** open; shape changed — the new
re-assert effect now puts the stuck drag's ghost back *onto the reloaded
list* after `replaceItems` wipes it. Not worse in practice; still no
cancel-on-board-change.

### 17. The Unsorted "Unknown status" list is payload-derived, so the Unsorted-origin drag this story documents renders the item twice during the drag and leaves it in Unsorted after the write `[Correctness & Security]`
**Files:** `client/src/components/UnsortedBucket.tsx:34`, `:69–80` (`unknownItems` from the `invalidItems` prop); `client/src/components/BoardView.tsx:123–128` (same rows also folded into `items` state), `:332`

For an *uncovered-workphase* group the drag works (state-derived). For an
*Unknown status* item X, `placementFor` → `{InProgress, 'first'}` renders
X in In Progress from state *and* still in Unsorted from the payload — two
`useSortable({id: X})` registrations — and after the write (no reload on
success) X stays under Unknown status until the next `loadBoard`.
Pre-existing root (Epic 3.2 rendered `invalidItems` from the payload), but
Story 3 names this drag as supported and no E2E case starts from Unsorted.
Looks deferred — verify against the roadmap (Epic 7 names Unknown-status
re-filing UI; nothing names this).

**Fix:** derive `unknownItems` from `items` state with `placements`
applied — a `getUnknownStatusItems(workphaseIds)` selector beside the
others. Cheaper interim: `loadBoard()` after a successful write whose
`activeItem` had a null/foreign `workphaseId`.

### 18. Tuning values are type-checked but never range-checked — a band pair summing to ≥ 1 removes the middle band and makes pop-in unreachable; negative delays pop on the first sample `[Correctness & Security]`
**Files:** `client/src/components/workflow/dragTuning.ts:81–86` (per-key type/finite check only); `dragRegions.ts:130–136`; `DragTuningPanel.tsx:58–61` (`min`/`max` on a number input are advisory); `popSession.ts:104`, `:135`

The per-key fallback for malformed storage is correct (verified). But
`columnTopBand: 0.6, columnBottomBand: 0.5` leaves `bandFor` with no
`'middle'`, so a popped-out card can never lock again; `popDelayMs: -1`
(typable despite `min: 0`) pops on the first sample outside the context.
Dev panel, single user, self-inflicted — but the failure looks like a
machine bug.

**Fix:** clamp in one place (`loadDragTuning` and `setNumber`): delays /
snap / distance `>= 0`, band fractions `[0, 0.5]`, `stub*` `[0, 1]`; add a
`dragTuning.test.ts` case.

### 19. The pop-in clock starts on region entry, not middle-band entry — after resting in a top band, crossing the middle band pops in instantly `[Correctness & Security]`
**Files:** `client/src/components/workflow/popSession.ts:99–107`, `:113–125` (`since` survives a band change within the region); `docs/wiki/board-drag-interaction/README.md` §3 ("rests in that context's pop-eligible band past the pop-in threshold") vs §3.1 as-built ("starts when a popped-out card's cursor enters a region")

The code matches §3.1's as-built sentence. But: popped out, hover B's top
band 2 s, slide down through the middle band on the way to C →
`hover.since` is 2 s old → locked into B on the first middle-band sample,
clamped, cursor continues to C while the card is stuck in B for another
`popDelayMs`. §3.1's own rule ("popping is never incidental — it takes a
sustained signal") describes the other behaviour. The unit test covers
staying in the top band, not leaving it into the middle. A design
ambiguity as much as a code issue — recorded so it's decided rather than
discovered by feel.

**Fix (if band-entry is wanted):** in `hoverFor`, reset `since` when
`band` changes between `'middle'` and an edge band while `regionKey` stays
(keep `rect` frozen); align the §3.1 sentence either way; add the crossing
case to `popSession.test.ts`.

**Status (2026-09-15, `2300fdf`):** superseded — the PO ratified the
region-entry clock on purpose (reconciliation #19, "No code"); the wiki
was aligned to the code. Not a bug.

### 20. Sub-row regions sit inside the scrolling column body, so the frozen `hover.rect` and the fixed-position `HoveredBandGuide` don't follow dnd-kit's auto-scroll of that body `[Correctness & Security]`
**Files:** `client/src/components/BoardColumn.tsx:135–138` (merged region is *outside* the scroller — correct) vs `client/src/components/WorkphaseCardList.tsx:65` (sub-row region is *inside* `overflow-y-auto`); `popSession.ts:37–43`; `BandGuides.tsx:65–70`

For an expanded column with enough sub-rows to scroll, dnd-kit auto-scrolls
the body near its edge; the sub-row under the cursor moves while
`hover.rect` (frozen on entry) and the fixed guide stay put. `regionAt` is
live, so the mismatch lasts only while the cursor is still geometrically in
the same sub-row; worst case is a first/last vs keep-position difference.
The freeze was tested only against the ghost's own reflow.

**Fix when it bites:** re-freeze when the region's *scroll offset* changes
— store the nearest scrollable ancestor's `scrollTop` in `PopHover` and
compare in `hoverFor`.

**Status (2026-09-15, `2300fdf`):** resolved as specified — `DragRegion.scrollTop`
is measured; `PopHover` carries the last-seen `scrollTop`; `translateRect`
shifts the frozen rect by the delta each sample; regression test in
`popSession.test.ts`. The fix exposes two new gaps in the same path — the
rect frozen is the *clipped* slice (reconciled-audit #11) and the follow
only runs on pointer samples (#12) — plus a latent `DOMRect` spread in
`translateRect` (#2).

### 21. The §5 band table is encoded twice — once as a slot (`placementFor`) and once as an anchor (`bandDropResolution`) `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/popSession.ts:165`; `client/src/components/workflow/boardDndUtils.ts:262–265`; third reader `itemListOps.ts:75–85` (`slotIndex`)

Both say top → before first, bottom → after last, middle or done → keep.
They differ only in output vocabulary; both are pinned (DRAG-3.9/3.11,
DRAG-3.1–3.10). Watch, not fix-now: the placement-vs-request split is
deliberate. Story 6's Stub table arrives in the same two shapes.

**Fix when Story 6 adds the second table:** `bandSlot(region, band)` in
`popSession.ts` / `dragRegions.ts`; `placementFor` uses it directly,
`bandDropResolution` maps `'first'` / `'last'` / `'existing'` to anchors.

**Status (2026-09-15, `2300fdf`):** open; grew a third axis — the
null-position `'last'` rule is now in both `placementFor` and
`pendingPlacementFor` with differing terminal handling → reconciled-audit #3.

### 22. "Is the active item a member of this region's covered set" — four spellings `[Duplication & Abstraction]`
**Files:** `popSession.ts:170` (`regionWorkphaseFor`); `boardDndUtils.ts:258` (`bandDropResolution`), `:164`, `:185` (`resolveDropTarget`, pre-existing)

`activeWorkphaseId !== null && covered.includes(activeWorkphaseId)` is the
DRAG-3.7 rule and decides reorder-vs-move in every path. One predicate to
change if membership ever considers a Stub's parent (Story 4/5).

**Fix:** `isCoveredMember(coveredWorkphaseIds, workphaseId)` in
`boardDndUtils.ts` (or on `DragRegion`), used at all four sites.

### 23. Region-key format is parsed outside the file that owns it, and `regions.find(r => r.key === k)` is spelled five times `[Duplication & Abstraction]`
**Files:** `useBoardDnd.ts:255` (`startsWith('column:')`), `:393` (`startsWith('subrow:')`); owners `dragRegions.ts:43–49`, `:69`; lookups `useBoardDnd.ts:201`, `:202`, `:390`, `popSession.ts:137`, `:162`

`boardDndUtils.ts:101–103` states the project rule for exactly this ("keep
them in the same file so the id format only needs to be understood once")
for `subrow::` ids; the region keys break it. Story 4 adds a third region
kind (`card:`).

**Fix:** `kind: 'column' | 'subrow'` on `DragRegion` (set in
`regionFromKey`), and `regionByKey(regions, key)` in `dragRegions.ts`.

### 24. Region registration + guides is the same JSX triple in two components; `isCardBeingDragged` still drilled two hops (Story 2 #14 residual) `[Duplication & Abstraction]`
**Files:** `client/src/components/BoardColumn.tsx:135–138`, `:181` (`[DRAG_REGION_ATTR]` + `relative` + `<BandGuides>`); `WorkphaseCardList.tsx:65–66` (same three); drilling `BoardColumn.tsx:153`, `:217`, `:230`, `:248` → `WorkphaseCardList.tsx:31`, `:54`, `:57`

"Make this element a drag region and draw its guides" is three coordinated
pieces copied twice; Story 4 makes a Card a region (third copy, in
`KanbanCard.tsx`). `WorkphaseCardList` receives `isCardBeingDragged` though
`useIsCardBeingDragged()` is one import away; the only reason is the
`&& !column.broken` guard at `:153`, which belongs on `isOver`.
`DragClassification.activeId` still re-states `activeItem.id`.

**Fix when Story 4 adds the Card region:** `DragRegionSurface({ regionKey, className, children })`
in `BandGuides.tsx`; `WorkphaseCardList` calls the hook itself;
`ExpandedSubRow` passes `isOver={isOver && !broken}`; drop
`DragClassification.activeId`.

### 25. `dragRegions.ts` mixes DOM-measuring functions with DOM-free geometry `[File Responsibility]`
**File:** `client/src/components/workflow/dragRegions.ts:56–97` (DOM: `measureDragRegions`, `regionFromKey`) vs `:104–144` (pure: `regionAt`, `bandFor`, `distanceOutside`)

Fine at 144 lines under one "regions" label; the pure half is what
`dragRegions.test.ts` / `popSession.test.ts` exercise via `dragFixtures.ts`
without a DOM. Story 6 adds more pure geometry here. **Fix if it grows:**
`dragRegionGeometry.ts` vs `dragRegions.ts`.

**Status (2026-09-15, `2300fdf`):** grown past "if it grows" (+50:
`findVerticalScrollAncestor`, `clipToVisible`, scroll-aware measurement).
Split now recommended → reconciled-audit #14.

### 26. `popSession.ts`'s `placementFor` / `regionWorkphaseFor` are output-translation, not machine transition `[File Responsibility]`
**File:** `client/src/components/workflow/popSession.ts:156–172`

A third read-out beside `releaseIntent` / `popDueAt`, importing
`Placement` from `itemListOps.ts` — reasonable today, slightly understated
by the "pure machine" framing at `:5–9`. Not a split candidate; flagged so
Story 6's second placement-shape derivation doesn't land here by default.

**Status (2026-09-15, `2300fdf`):** unchanged in kind; `translateRect`
(new, in `hoverFor`'s neighbourhood) is the same class of drift in the
other direction — geometry in the machine file. Folded into
reconciled-audit #2's fix (move it to `dragRegions.ts`).

### 27. `itemListOps.ts` (267 lines) carries selectors, ordinal placement, and write reconciliation — cohesive today, the largest new pure module `[File Responsibility]`
**File:** `client/src/components/workflow/itemListOps.ts:19–85`, `:87–178`, `:180–267`

Each layer builds on the one before (selectors call `applyPlacements`;
`completeItemWrite` calls `applyItemWriteResponse` and `freeItemOrder`),
so splitting today would scatter one concept. Recorded because it's a
design-doc-endorsed catch-all and Story 6 is likely to add a fourth
concern. **Natural split then:** `itemListOps.ts` (selectors + placement)
vs `itemWriteReconciliation.ts` (`completeItemWrite`, `findInversion`,
`ItemListState`).

### 28. `BoardView.tsx`'s drag-tuning state is the one board-level concern still inline instead of behind a hook `[File Responsibility]`
**File:** `client/src/components/BoardView.tsx:44–53`

Every other board-level slice is behind `useXManagement` / `useBoardDnd`.
Eight lines; `dragTuning.ts` already has `loadDragTuning` / `saveDragTuning`
beside where a `useDragTuningState()` would go. Consistency, not confusion.

---

## Informational

### 29. `overlayTranslate.current` is written during dnd-kit's render `[Correctness & Security]`
`useBoardDnd.ts:237` writes a ref inside the `Modifier`, which `DragOverlay`
invokes during its own render. Under a discarded concurrent render the
tween's `from` could be a frame off — invisible. No action; recorded so
nobody "fixes" it into state.

### 30. `DragTuningPanel.setNumber` persists intermediate values while typing `[Correctness & Security]`
`Number('')` is `0`, so clearing a field to retype persists `0` and applies
it to any drag in progress. UX nit.

### 31. E2E coverage gaps for this story's own claims `[Correctness & Security]`
Not covered: a drag that starts in Unsorted (either kind); done → active via
the middle band (#2); Escape while popped out; cancel or a landing response
*during* a re-drag of a pending item (#1); a board reload mid-drag (#16).
The 14 cases that exist are well-targeted and parameterized on the seeded
tuning, never on literals.

**Status (2026-09-15, `2300fdf`):** narrowed at unit level (null-position
slot, scroll follow, clipping all have unit cases). Still no E2E for any
listed case, and nothing at any level pins `priorPlacement` restore, the
re-assert effect, or `isPending` / `inFlight`.

### 32. Overlay CSS custom-property names are literal in two files — unavoidable `[Duplication & Abstraction]`
`BoardView.tsx:208–211` sets `--drag-overlay-free` /
`--drag-overlay-capped-opacity`; `KanbanCard.tsx:31–32` reads them inside
Tailwind arbitrary-value classes. Tailwind v4's scanner needs static
literals. Values are set in one place (correct); a cross-reference comment
on each side is the most that can be done.

### 33. Do-not-unify pairs `[Duplication & Abstraction]`
`BandGuides` vs `HoveredBandGuide` (live percentages vs frozen rect — after
#5 they share the boundaries and nothing else); `placementFor` vs
`pendingPlacementFor` (hover-derived vs request-derived); `resolveDropTarget`
vs `bandDropResolution` (dnd-kit `over` vs band geometry, meeting only at
`DropResolution`); `seedTuning` (`addInitScript`) — one copy in the one spec
that needs it.

### 34. Descriptor table is not exhaustive over `DragTuning` `[Duplication & Abstraction]`
`DragTuningPanel.tsx:22–52`: nothing forces a new numeric field to get a
row. `loadDragTuning` is generic over `Object.keys(DEFAULT_DRAG_TUNING)`, so
the panel is the only per-field list — the right number of places. A
`satisfies Record<NumericKey, …>` check would make omission a type error;
optional.

### 35. `tests/ui/drag-column-bands.spec.ts` (536 lines) — grain matches the test-plan documents it draws from `[File Responsibility]`
Two `describe`s, each aligned to a distinct plan doc
(`drag-3-card-column-bands.md`, `drag-6-preview-reconciliation.md`). Not a
dumping ground; no split.

### 36. Positive confirmations `[all passes]`

- **Timer / listener / rAF lifecycle.** End and cancel both stop the timer
  and tween before clearing the session; the `machineActive` cleanup
  removes the window listener and clears both on session end and unmount;
  `evaluatePop` early-returns on a null session so a queued timer is a
  no-op; one timer at a time; the rAF loop self-terminates. No `setState`
  after unmount is reachable.
- **Ref mirrors vs state.** Both closures dnd-kit calls during its render
  read only refs; `sessionRef` is written synchronously before `setSession`;
  `evaluateRef` is refreshed every render. No stale-closure reads found.
- **Pop machine.** Delay and distance are "either satisfies" in one
  predicate; pop-out resets the pop-in clock; re-lock into the origin
  column works; Unsorted-origin starts with `contextKey: null`; context
  identity is by key so re-measurement can't break it; the frozen rect is
  keyed on `regionKey` and dropped on leaving, and `releaseIntent` uses
  the same frozen rect. Genuinely pure — no React, dnd-kit, or timers.
- **Band resolution vs. the server.** Anchors only against `regionItems()`
  (Free, rendered, never the carried item); done regions never anchor; the
  member branch sends `scopeWorkphaseIds` without `workphaseId`; anchors
  are this board's items so `sharesPositionScope` and
  `crossWorkflowMoveError` can't reject. Reachable 400s are data races,
  which resync.
- **Collision follows the machine.** Hover → exactly the hovered
  container; in-context → context container + cards whose center lies in
  the context rect, Stubs excluded; `@dnd-kit/sortable` doesn't displace
  when `over` is a container, so band mode causes no phantom shifting;
  `active.rect.current.translated` is unclamped as intended.
- **Ordinal placement.** Each item rendered exactly once; missing anchor
  falls back to sort index; `'last'` agrees with the server's
  workflow-wide append; `completeItemWrite`'s order (pairs → row → clear →
  compare) is correct and TC-5a.2 pins no-false-positive-on-reindex.
- **Write tracker.** Per-item monotonic; `fail` is seq-guarded and reloads;
  `begin` and `updateSession(null)` land in one batch so `data-pending`
  appears in the same paint the overlay disappears.
- **One geometry, one placement layer, one move path.** `Rect` / `Point` /
  `Band` / `bandFor` / `regionAt` defined once; `PopHover.rect` held once;
  `applyPlacements` is the only slot interpreter; `sendItemMove` the only
  `moveItem` call; `buildMoveInput` the only `DropResolution → MoveItemInput`;
  `completeItemWrite` the only reducer, from all four write handlers.
- **Vocabulary and docs.** `locked` / `popped-out`, band names, slot
  values, `data-drag-region` / `data-drag-context` / `data-pending` spelled
  identically across code, tests, wikis, `client/CLAUDE.md`; no old
  vocabulary survives outside historical records; all cited DRAG-n.m /
  TC-n.m ids resolve and match; tuning keys are one closed set of twelve;
  `client/CLAUDE.md`'s Story 3 section and File Structure tree are
  accurate claim-by-claim.
- **Tailwind.** New strings follow the established ordering; CSS custom
  properties named consistently; panel reuses `INPUT_BASE` /
  `SECTION_LABEL` / `BTN_CANCEL` / `BTN_ADD_TRIGGER`; no new 5+-class string
  in two files except #8.
- **Contexts are thin; fixtures consolidated.** Five consumer hooks are one
  `useContext` each; `dragFixtures.ts::rect/region` and `makeItem` used by
  every relevant test; no inline rect/region/Item literals remain.
- **localStorage tuning.** Malformed JSON, non-object, wrong-typed,
  non-finite, unknown keys fall back per key; round-trips; the color string
  only reaches a CSS custom property via React `style`.
- **DOM measurement.** Viewport-space on both sides so page/horizontal
  scroll is consistent; `regionAt` / `bandFor` guard empty and zero-height;
  broken columns and expanded wrappers register no region.
- **`dragGesture.ts` is still the only pointer recipe.** No `page.mouse.*`
  outside the helper.
- **Server untouched**; `ENABLE_TEST_ROUTES` still strict `=== 'true'`.
