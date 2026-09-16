# Code Quality Audit — Epic 3.5 Story 3, post-reconciliation (2026-09-15)

Scope note: audited the union of every code file touched by `e77e31f`
("implementing story 3") and `2300fdf` ("reconcile wiki, test plan, code"),
at HEAD (`2300fdf`, clean tree), per explicit request. The reconciliation
commit was not doc-only: alongside the wiki/test-plan rulings it built the
code follow-ups its own report names (#14 done-list comparator, #15
stale-reindex resync, #20/#21 bounded regions + scroll-aware frozen rect,
#22 re-drag picture fixes, #29 null-position `'last'` slot). Several of
those overlap findings in `code-quality-audit-epic-3-5-story-3.md`, which
had no status lines — so this audit had two jobs: re-audit the current code,
and settle every Story 3 finding's status. The status table is below; the
Story 3 doc has been annotated in place. Run as four parallel passes per
`.claude/guides/audit-workflow.md`; each finding is tagged with the pass(es)
that surfaced it. The three highest-severity new findings (#1, #2, #3) were
re-traced by hand before inclusion. Tags: **Fix Now**, **Watch List**,
**Covered by Epic N**, **Informational**. No new Covered-by tags.

## Story 3 findings — status at `2300fdf`

| # | Item | Status |
|---|---|---|
| 1 | Ghost / pending marker share one slot | **Partially resolved.** Cancel/no-op restore (`priorPlacement` + `isPending`) and the *picture* half of the mid-drag response case are fixed. Still open: the reducer still tripwires the ghost (false inversion), a Sheet PUT still clears a pending marker, and pickup still jumps the ghost → **new #1** |
| 2 | `'existing'` wrong for a null-position item | **Resolved** (`placementFor` / `pendingPlacementFor` → `'last'`); rule is now two copies → **new #3** |
| 3 | `useBoardDnd` bundles four mechanisms | **Open, harder** — 406 → 460; a fifth mechanism (ghost-consistency guard) straddles clock and orchestration → **new #10** |
| 4 | `boardDndUtils` three concerns; `ItemWriteTracker` in hook file | Open, unchanged shape (+15 lines of dispatch growth) |
| 5 | Band boundaries computed twice | Open, unchanged |
| 6 | `'popped-out'` / `'popped out'` | Open, unchanged |
| 7 | E2E scaffolding (Story 2 #16) | Open, one more copy (`pastColumnEnd` hand-rolls the region selector the spec names as `regionOf`) |
| 8 | Panel label class ×2 | Open, unchanged |
| 9 | Wikis claim console log | **Half resolved** — `board-drag-interaction` fixed (#18 ruling); `item-positioning/README.md:297` still says "logged" → **new #6** |
| 10 | Wiki `{ list, slot }` | **Open** — the surrounding paragraph was rewritten twice in the walkthrough and the field name survived → **new #5** |
| 11 | `boardDndUtils` re-bucket comment | Open, unchanged |
| 12 | Cross-column spec "hardcodes side" | Open, unchanged |
| 13 | Story doc "DragTuningContext dropped" | **Resolved** (#26 ruling) |
| 14 | `findWorkphaseForItem` raw vs rendered | Open, unchanged |
| 15 | Stale response drops reindex pairs | **Resolved** (`complete` → `{applied, needsResync}`; `sendItemMove` reloads) |
| 16 | Board reload mid-drag | Open; shape changed — the new effect now re-asserts the stuck ghost *onto the reloaded list* |
| 17 | Unknown-status list payload-derived | Open, unchanged |
| 18 | Tuning range checks | Open, unchanged |
| 19 | Pop-in clock on region entry | **Superseded** — PO ratified the region clock (#19 ruling); wiki aligned; not a bug |
| 20 | Frozen rect vs sub-row auto-scroll | **Resolved as specified** (translate by `scrollTop` delta), exposing two new gaps in the same path → **new #2, #11, #12** |
| 21 | §5 band table slot vs anchor | Open; grew a third axis → **new #3** |
| 22–24 | covered-member ×4; region-key parsing; region JSX ×2 | Open, unchanged |
| 25 | `dragRegions` DOM vs geometry seam | **Grown past "if it grows"** (+50) → **new #14** |
| 26 | `placementFor` as read-out | Unchanged; `translateRect` is the same class of drift in the other direction → folded into **new #2** |
| 27, 28 | `itemListOps` size; `BoardView` tuning state | Open; growth fits |
| 29, 30 | ref write in modifier; `setNumber` | Open (informational) |
| 31 | E2E gaps | Narrowed at unit level; still no E2E for any listed case, and **nothing at any level pins `priorPlacement` / the re-assert effect / `isPending`** |
| 32–35 | informational | Unchanged; #33's "don't unify `placementFor` / `pendingPlacementFor`" stands but they now share a copied *rule* → **new #3** |

Overall shape: the follow-up's code is correct where it claims to be — the
scroll translation sign, the `inFlight` lifecycle, the `needsResync`
threading, the done comparator's agreement with the server, and the
re-assert effect's termination all check out. What it didn't do is remove
the root cause it worked around: the ghost and the pending marker still
share one map, so the fixes are an `inFlight` set, a `priorPlacement`
stash, and a reactive effect — three new structures maintained in lockstep
— and the reducer underneath is still ghost-blind. Two of the original
failures survive and the pickup-jump is untouched. Separately, the
scroll-aware rect exposes a latent `DOMRect`-spread hazard and freezes the
*clipped* slice of a sub-row rather than its block; the `'last'` rule was
typed twice; and one pre-existing, hand-reachable 400 (in-context reorder
inside a Done column) slipped past the previous audit.

---

## Fix Now

### 1. The re-assert effect fixes the picture but not the reducer: a mid-re-drag response still logs a false inversion, a Sheet PUT still destroys a pending marker, and pickup still jumps the ghost `[Correctness & Security]` (Story 3 #1 residual; cross-ref Duplication #4 on the three-structure bookkeeping)
**Files:** `client/src/components/workflow/itemListOps.ts:266–275` (`completeItemWrite` clears + tripwires *whatever* placement the id has); `client/src/components/workflow/useItemManagement.ts:87` (`complete` → reducer with no knowledge of which placement it recorded), `:130–132` (`handleItemUpdated` → same reducer); `client/src/components/workflow/useBoardDnd.ts:320–326` (the effect), `:308` (initial ghost for a re-drag)

The effect itself is sound — verified: reads only refs, `latest.current` is
refreshed by the earlier-declared effect, can't fire with a live session on
the clearing render (`sessionRef.current = null` is written synchronously
before any `setList`), terminates in ≤1 extra render because `withPlacement`
stores the exact object `setGhost` recorded, and doesn't fight
`writes.fail` / `complete`. But it's a patch over the shared slot, and three
of the original failures remain, all verified by hand:

- **False inversion.** Drop X (seq 1), re-pick X, hover C's top band. Response
  1 lands → `completeItemWrite` sees `placements.has(X)` (the ghost),
  computes `before` with X spliced to index 0, clears it, computes `after`
  with X at its real position → `inversions` gains an entry. The effect
  restores the ghost one render later; the panel counter still reports a
  client bug that isn't one.
- **Sheet PUT clears the marker.** X pending in B; the Sheet saves X's title;
  `handleItemUpdated` → `completeItemWrite` → marker cleared, X drawn back
  in A with no `data-pending`, inversion logged if the PUT committed first.
  `inFlight` still says pending, so `useIsPending` (placement-based) and
  `writes.isPending` (set-based) disagree until the move's response lands.
  The effect can't help — there's no session.
- **Pickup still jumps.** `priorPlacement` is stashed at `:291` but the initial
  ghost at `:308` is still `placementFor(...)` = `{B, 'existing'}`, which
  sorts X by its *old* position; the card drawn first in B moves the instant
  it's picked up.

**Fix (small, no ghost/pending split needed):** have the tracker remember
what it recorded and let the reducer compare by reference — `begin` stores
`pending` in a `Map<string, Placement | null>` beside `writeSeq`; `complete`
passes it: `completeItemWrite(state, response, recorded)`; the reducer only
clears + tripwires when `state.placements.get(response.id) === recorded`,
otherwise it just applies the rows. `handleItemUpdated` /
`handleChildCreated` / `handleCreateItem` pass nothing → never touch a
placement. This makes the effect a no-op safety net for the mid-drag case,
fixes the Sheet-PUT case, and removes the false inversion. For pickup:
`setGhost(activeId, priorPlacement ?? placementFor(...))`, and thread
`priorPlacement` into `placementFor` as the in-context (`!band`) fallback so
returning to the context after a pop-out doesn't re-jump. Unit cases:
response during a re-drag keeps the ghost and records no inversion; Sheet
response for a pending item keeps the marker; re-drag pickup keeps the
marker's slot. (The structural alternative — `{ pending, ghost }` in
`ItemListState`, which also deletes `inFlight` and `priorPlacement`'s reason
to exist — remains the cleaner end state; see #10.)

**Status (2026-09-15):** resolved as proposed. `useItemManagement.ts`'s
tracker gained `recordedPlacement: Map<string, Placement | null>`, set in
`begin` alongside `writeSeq`/`inFlight` and read (then deleted) in
`complete`; `completeItemWrite(state, response, recorded?)` in
`itemListOps.ts` only clears + tripwires when
`state.placements.get(response.id) === recorded` — reference equality, not
presence — and a `recorded === undefined` call (every non-tracked write:
`handleCreateItem`/`handleItemUpdated`/`handleChildCreated`) never touches
placements at all. Pickup: `placementFor` now takes `priorPlacement` and
returns it directly whenever the pop session is truly in-context with no
hover (`!band`), before computing a fresh slot — so both the initial ghost
at `handleDragStart` and a later pop back into the origin context (via
`evaluatePop`) show the re-dragged item's actual pending marker instead of
a freshly (and possibly staler) computed one. Three new tests in
`itemListOps.test.ts` (mid-re-drag response leaves the ghost and logs no
inversion; a write with no recorded placement never touches an existing
one even when the id matches) and three in `popSession.test.ts`
(`priorPlacement` wins in-context, a hovered band still computes its own
slot, no-prior-placement behavior unchanged). The re-assert effect in
`useBoardDnd.ts` is left in place as the safety net the audit described —
now normally a no-op, since the reducer no longer clears the ghost out
from under a live re-drag in the first place.

### 2. `translateRect` spreads a rect that, for every merged-column region, is a real `DOMRect` — the exact hazard `clipToVisible` was just fixed for, one function away; `Rect` construction and point containment are each spelled twice `[Correctness & Security + Duplication & Abstraction + File Responsibility]`
**Files:** `client/src/components/workflow/popSession.ts:144–148` (`{ ...rect, top, bottom }`); `client/src/components/workflow/dragRegions.ts:83–85` (unclipped branch stores `el.getBoundingClientRect()` as-is), `:111–119` (`clipToVisible`'s explicit-field defence and the comment explaining why), `:163–169` (`regionAt` containment); `client/src/components/workflow/boardDndUtils.ts:78–82` (`rectCenterInside`, same four comparisons)

Verified by hand: the only reason this doesn't bite today is that a merged
column has no scroll ancestor, so its `scrollTop` is always 0 and
`translateRect` takes the `deltaScrollTop === 0` early return before the
spread. The moment any region holding a raw `DOMRect` sees a non-zero delta
— a merged column inside a vertical scroller, or Story 4's Card regions
inside a scrolling body if they aren't clipped — the translated rect is
`{ top, bottom }` with `left` / `right` / `width` / `height` all `undefined`:
`bandFor` → `NaN` → `'middle'` forever, `HoveredBandGuide` draws a zero-size
box, `releaseIntent` resolves every band drop as middle. `popSession.test.ts`
uses plain-object fixtures and would never see it. The rule "never spread a
Rect" currently has to be remembered in every Rect function across two
files. Separately, `regionAt` and `rectCenterInside` are the same
containment predicate, and Story 4's Card region is a third caller.

**Fix:** normalise once at the measurement boundary — `toRect(domRect): Rect`
in `dragRegions.ts` reading the six fields explicitly, applied to both
branches at `:83–85` and to `scrollBox.getBoundingClientRect()`, so nothing
downstream ever holds a `DOMRect` (then `clipToVisible`'s defence is
belt-and-braces). Move `translateRect` from `popSession.ts` to
`dragRegions.ts` beside `clipToVisible` — every Rect operation in the file
that owns `Rect`, which also settles Story 3 #26's "geometry in the machine
file" note. Add `containsPoint(rect, point)` used by `regionAt` and
`rectCenterInside`. Add the getter-based fake from `dragRegions.test.ts` to
a `translateRect` case. `clampAxis` / `clampToCurrentContext` stay in
`useBoardDnd` — they clamp a dnd-kit *translation*, not a Rect.

**Status (2026-09-15):** resolved as proposed. `dragRegions.ts` gained a
private `toRect(domRect): Rect` (the one place a `DOMRect` is read, fields
destructured explicitly) used by both branches of `measureDragRegions`;
`translateRect` moved here from `popSession.ts` verbatim (still explicit-
field construction, not a spread) and `containsPoint(rect, point)` backs
both `regionAt` and `boardDndUtils.ts`'s `rectCenterInside`. New
`dragRegions.test.ts` cases: `containsPoint`'s edge inclusivity, and a
`translateRect` describe covering the sign, the `===` short-circuit on a
zero delta, and — reusing the existing getter-based `fakeDomRect` fixture
(hoisted to module scope so both `clipToVisible` and `translateRect` can
use it) — that it reads a DOMRect-shaped input explicitly rather than
falling into the same hazard again.

### 3. The "no position to keep → `'last'`" rule is two copies, and they already disagree on one input `[Duplication & Abstraction]` (Story 3 #21 growing a third axis)
**Files:** `client/src/components/workflow/popSession.ts:189–200` (`placementFor`: `region.isTerminal || activeItemPosition !== null ? 'existing' : 'last'`); `client/src/components/workflow/boardDndUtils.ts:284–291` (`pendingPlacementFor`: `Boolean(input.workphaseId) && active.position !== null` → `'existing'` else `'last'`); each with its own paragraph citing reconciliation #29

Verified: the reconciliation shipped the rule typed twice with different
surrounding inputs. For a null-position item entering a **done** target
(`bandDropResolution` always emits a bare `{workphaseId}` for a terminal
region), `placementFor` claims `'existing'` (terminal guard wins) and
`pendingPlacementFor` claims `'last'` (no terminal input). They render
identically today only because `byCompletedAtThenCreatedAt` puts a null
`completedAt` last either way — so ghost and marker for the same drop carry
different slot vocabulary, pinned by two independent tests that can drift
without either failing.

**Fix:** one function in `itemListOps.ts` beside `PlacementSlot`:
`workphaseOnlySlot(position: number | null): 'existing' | 'last'`.
`placementFor`: `slot = region.isTerminal ? 'existing' : workphaseOnlySlot(activeItemPosition)`;
`pendingPlacementFor`: `slot: input.workphaseId ? workphaseOnlySlot(active.position) : 'last'`.
Move the shared #29 paragraph onto the one function; one
`itemListOps.test.ts` case; the caller tests stay as integration pins.

**Status (2026-09-15):** resolved as proposed. `workphaseOnlySlot(position)`
lives in `itemListOps.ts` beside `PlacementSlot`; `placementFor`'s
non-terminal branch and `pendingPlacementFor`'s bare-workphase-change
branch both call it. `placementFor`'s terminal branch is deliberately left
as its own unconditional `'existing'` (matches the existing DRAG-3.9 test:
a done region never previews a positioned insert, regardless of the
item's own position) — the fix removes the *duplicated* rule, not the
terminal special case, which is a separate, already-tracked question
(Watch List #16). One new `itemListOps.test.ts` case for the function
itself; the existing `placementFor`/`pendingPlacementFor` caller tests are
unchanged and still pass, confirming the refactor is behavior-preserving
for every case they already covered.

### 4. In-context reorder inside a Done column anchors against a done card — a guaranteed 400 → `console.error` → full reload, reachable by hand on every board with two done items `[Correctness & Security]` — pre-existing, missed by the previous audit
**Files:** `client/src/components/workflow/boardDndUtils.ts:141–189` (`resolveDropTarget` never consults `isTerminal`), `:53–72` (collision offers the context's cards as `over`); `client/src/components/workflow/useBoardDnd.ts:417–421`; server `itemHierarchy.ts:157` (`'anchorId has no position to anchor against (it may be a done item)'`)

Drag a done card up or down within its own Done column → `over` is another
done card → `{scopeWorkphaseIds: [Done], anchorId: Y, side}` → server 400 →
`sendItemMove` logs, `fail`s, `loadBoard` → loading flash, card snaps back.
The wiki (§5) already says done items can't be anchors; the band path guards
it (`bandDropResolution` never anchors in a terminal region); the in-context
path doesn't. Promoted to Fix Now over the pass's Watch List because it's
hand-reachable, noisy, and looks like a bug to the user; it predates the
story, which is why the previous audit's "reachable 400s are data races"
confirmation missed it.

**Fix:** in `resolveCardDrop`'s in-context branch, when the context region
`isTerminal`, return `null` (done order is by completion time — nothing to
write); or have `resolveDropTarget` drop the anchor when the hovered column
is terminal. Pin with a `boardDndUtils.test.ts` case.

**Status (2026-09-15):** resolved via the second option, generalized —
`resolveDropTarget` (the function this in-context case is exclusively
resolved through) now looks up whether the *hovered card's own* workphase
is terminal and nulls `anchorId` if so, before branching into the
expanded/merged logic — covering a reorder (member) and a move
(non-member) with one check, since the server rejects an anchor pointing
at a done item regardless of which kind of request carries it. Two new
`boardDndUtils.test.ts` cases (merged: member and non-member; expanded).
No change needed in `useBoardDnd.ts` — the fix lives entirely in the
already-pure, already-tested resolver.

### 5. Wiki §10 still spells `Placement` as `{ list, slot }` — unfixed through two walkthrough edits of the same paragraph `[Consistency & Drift]` (Story 3 #10)
**File:** `docs/wiki/board-drag-interaction/README.md:490`; actual shape `client/src/components/workflow/itemListOps.ts:31–39`

Reconciliation entries #10 and #29 rewrote the sentences around it; the
field name survived. Only remaining occurrence. **Fix:** `{ workphaseId?, slot }`.

**Status (2026-09-15):** resolved — wiki text corrected.

### 6. `item-positioning/README.md:297` still says the inversion "is logged" — the sibling sentence was fixed, this one wasn't `[Consistency & Drift]` (Story 3 #9, second half)
**File:** `docs/wiki/item-positioning/README.md:297`; fixed sibling at `docs/wiki/board-drag-interaction/README.md:502–503` ("nothing goes to the console")

Reconciliation #18 quoted and fixed only the drag-interaction page. **Fix:**
"counted and surfaced in the dev/test panel", matching the sibling.

**Status (2026-09-15):** resolved — wiki text corrected to match the
drag-interaction page's wording.

### 7. `drag-column-bands.spec.ts:312` cites `DRAG-1.4` for a case that, after the test-plan rewrite, now describes a Story 4 Card scenario `[Consistency & Drift]`
**Files:** `tests/ui/drag-column-bands.spec.ts:312` (title "DRAG-1.4: brushing across another column while reordering never leaves the context"); `docs/test-plans/board-drag-interaction/drag-1-contexts-and-popping.md` (`TC-4` is now "Brushing past a Card while reordering never attaches")

The test's body — hover momentarily over a neighbouring column, assert
nothing changed — is `TC-3`'s second clause, which this same spec already
cites as `"DRAG-1.3 (momentary)"` at `:159`. Isolated: every other DRAG-n.m
and TC-7.n citation in the touched files resolves and matches. **Fix:**
relabel to `DRAG-1.3 (momentary)`, or add the column-brush case to `TC-3`'s
detail block.

**Status (2026-09-15):** resolved — test title relabeled to
`DRAG-1.3 (momentary)`, matching the file's existing convention. Playwright
re-run green.

### 8. `DropColumn` test fixture is now spelled twice `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/dragRegions.test.ts:143–151` (`expandedColumn(id, workphaseId)`, new); `client/src/components/workflow/boardDndUtils.test.ts:52–61` (`column(id, workphaseIds, overrides)`, pre-existing)

`expandedColumn('col-1', 'w1')` is exactly `column('col-1', ['w1'], { displayMode: 'expanded' })`
— the first regression of Story 3's "unit fixtures are consolidated"
confirmation. **Fix:** move `column` into `dragFixtures.ts`; delete
`expandedColumn`. The `mockRect` / `buildScrolledSubrow` DOM builders can stay
local until a second DOM-measuring test appears.

**Status (2026-09-15):** resolved as proposed — `column(id, workphaseIds, overrides)`
moved to `client/src/test/dragFixtures.ts`; both test files import it;
`expandedColumn` deleted, its two call sites now
`column('col-1', ['w1'], { displayMode: 'expanded' })`.

### Still open from Story 3, Fix Now, not re-listed
#5 band boundaries ×2 · #6 `'popped-out'` spelling · #7 E2E scaffolding ·
#8 panel label class · #11 `boardDndUtils` re-bucket comment · #12
cross-column spec "hardcodes side" — all unchanged at `2300fdf`; see the
Story 3 doc for each.

---

## Watch List

### 9. "Item X has a write outstanding" is now bookkept in two structures, maintained in lockstep by hand `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useItemManagement.ts:51` (`inFlight`), `:71–72`, `:76–77`, `:92–93` (each of `begin` / `complete` / `fail` updates both the set and the map), `:95–97` (`isPending` reads the set); `DragSessionContext.ts:65–69` (`useIsPending` reads the *map* minus the active item); `useBoardDnd.ts:333` and `:291` (both sources read for the same item at the same moment)

The comment at `:47–50` says why: "`placements` alone can't answer this: a
live drag's ghost occupies the same slot." That is Story 3 #1's root, answered
by a third structure rather than a split map. The two agree in every
reachable state traced — but see #13 for the one they don't after a reload
— and the next tracker change (Story 4/5) has three places to keep in step.
#1's reference-compare fix reduces the reliance; the `{ pending, ghost }`
split collapses both readers to `pending.has(id)` and deletes `inFlight` and
`priorPlacement`.

### 10. `useBoardDnd` gained a fifth mechanism — a ghost-consistency guard — that straddles the clock and the orchestration, so the Story 3 #3 split needs a third seam `[File Responsibility]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:91–96`, `:164–167` (`wantedPlacementRef` + `setGhost`, read by `evaluatePop:182–185` *and* `handleDragStart:308`), `:320–326` (the effect — triggered by an external prop, belonging to neither clock nor tween), `:286–291`, `:332–335` (`priorPlacement` / `restorePriorPlacement`, orchestration side); `DragSessionContext.ts:20–28`

The proposed `usePopClock` / `useSnapTween` extraction now has to account
for a nameable fifth concern: "keep the live drag's ghost matching what the
machine last asked for, across an external write completing mid-drag." It
can't go to `usePopClock` without handing it a slice of orchestration
(setting the ghost on start). **Fix at the Story 4 split:**
`usePendingGhostGuard({ previewPlacement, placements, isPending })` returning
`{ setGhost, restorePriorPlacement }`, consumed by both. If #1's
reference-compare fix lands first, the effect shrinks to a safety net and
the guard is mostly `setGhost` + `restorePriorPlacement`. The header comment
at `:40–62` is now two mechanisms behind.

### 11. The frozen rect for a sub-row is its *clipped visible slice*, so after auto-scroll reveals more of the sub-row the bands and the pop-in gate are computed over the wrong height `[Correctness & Security]`
**Files:** `client/src/components/workflow/dragRegions.ts:82–87` (stores the clipped rect); `client/src/components/workflow/popSession.ts:133` (freezes and translates it); `client/src/components/BandGuides.tsx:60–78`

Column body y∈[0,600]; sub-row R's block is [540,740], so on entry its region
rect is [540,600] (height 60, bands 12px). Cursor parks near the bottom;
dnd-kit auto-scrolls 140 → R's block is [400,600], the frozen rect translates
to [400,460]. Cursor at y=550 is still inside R (live `regionAt`) but
`bandFor(550, [400,460])` clamps to `'bottom'`; R's real band at 550 is
`'middle'`. A popped-out card can't pop into R while over its revealed 75%; a
release is "after last" while the guide box sits 90px above the cursor.
Reachable whenever an expanded column overflows. The `popSession.test.ts`
scroll case uses an unclipped 400px rect.

**Fix:** carry both on `DragRegion` — `rect` (unclipped block: bands, guide,
freeze) and `visibleRect` (clipped: `regionAt` and the fully-hidden rule).
Clip the guide box to the column body with `clip-path` if drawing over the
header looks wrong. One test where the two differ; one `popSession` case
that enters a partially visible sub-row, scrolls, and asserts the band from
the unclipped rect.

### 12. The scroll-follow only runs on pointer samples — a stationary cursor during auto-scroll gets no translation until the next `pointermove` or a pending timer `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:197–212` (`evaluateRef` called from `pointermove` and the pop timer only), `:410–415` (`resolveCardDrop` uses `session.hover.rect` from the last sample)

Auto-scroll is the canonical "park the cursor at the edge" gesture: dnd-kit
scrolls from its own interval, no `pointermove` fires, `evaluatePop` never
runs. `HoveredBandGuide` is visibly stale for the scroll; a release with the
cursor still in the same sub-row uses the untranslated rect → possibly wrong
band. Pop-in is only delayed (the timer re-measures).

**Fix:** in the `machineActive` effect, `window.addEventListener('scroll', onScroll, true)`
(capture) calling `evaluateRef.current()`; removed in the same cleanup.
Pin with a two-sample `popSession` case at the same pointer with different
`scrollTop`, and an E2E that parks at a sub-row edge and asserts the guide
tracks.

### 13. A re-drag of a pending item carries the *raw* `activeItem` — `workphaseId` / `position` from before the outstanding write — into every member decision and the `'existing'` / `'last'` choice `[Correctness & Security]` (what's left of Story 3 #1 bullet 2)
**Files:** `client/src/components/workflow/useBoardDnd.ts:283`, `:308`, `:184`, `:406`, `:419`, `:423`; server rule `itemHierarchy.ts:243–250`

X's write 1 (A→B) is in flight; X is drawn in B; the user re-picks it from B.
`activeItem.workphaseId` is still A, so: release in B's middle band → client
says non-member → `{workphaseId: B}` → server (X already in B) appends;
client claims `'existing'` → jump + real inversion. Pop into A and release
over Z → client says member → `{scopeWorkphaseIds: [A], anchorId: Z}` →
server keeps B and positions beside Z → X stays in B after a visible drop
in A. Same trigger window as reconciliation #22 (re-drag inside response
latency — not reachable by hand on localhost); Watch List for that reason
only; the outcome is a wrong-column write.

**Fix:** snapshot an *effective* active item at drag start —
`workphaseId: priorPlacement?.workphaseId ?? item.workphaseId`, `position: null`
when `priorPlacement` exists — so member and slot follow what the board draws.

### 14. `dragRegions.ts`'s DOM/geometry seam (Story 3 #25) has grown past "if it grows" — now worth taking `[File Responsibility]`
**File:** `client/src/components/workflow/dragRegions.ts:76–119` (DOM: `measureDragRegions`, `findVerticalScrollAncestor`) vs `:159–194` (pure: `regionAt`, `bandFor`, `distanceOutside`, `verticalDistance`) vs `:114–119` (`clipToVisible`, pure, serving the DOM half)

+50 lines; `findVerticalScrollAncestor` is real DOM-specific complexity with
its own test setup (`mockRect` / `buildScrolledSubrow`, a `document.body`
fixture); `clipToVisible` is tested with zero DOM. `dragRegions.test.ts`'s
three `describe` blocks already fall on the two sides. **Fix:**
`dragRegionGeometry.ts` — `Rect`, `Point`, `Band`, `bandFor`, `regionAt`,
`distanceOutside`, `clipToVisible`, `translateRect` (from #2),
`containsPoint` (from #2); `dragRegions.ts` keeps `DragRegion`,
`measureDragRegions`, `findVerticalScrollAncestor`, `regionFromKey`, the key
builders.

### 15. The write tracker has become its own concept inside `useItemManagement` `[File Responsibility]`
**File:** `client/src/components/workflow/useItemManagement.ts:20–36` (`ItemWriteTracker`, four methods), `:46–51` (`writeSeq` + `inFlight`), `:66–100`

Two refs, four methods, a return-shape contract `sendItemMove` depends on —
a self-contained state machine inside a hook whose other half is list
state. The implementation-side counterpart of Story 3 #4 (the *type* lives
here "for no reason but history"). **Fix:**
`useItemWriteTracker(setList): ItemWriteTracker` owning `writeSeq` /
`inFlight` / the four methods; `useItemManagement` calls it once. Land the
type and the implementation in the same place when #4's split picks one.

### 16. Preview for a done → done move across two terminal workphases uses the item's *old* `completedAt`; the server re-stamps `now` `[Correctness & Security]`
**Files:** `client/src/components/workflow/popSession.ts:197` (`region.isTerminal → 'existing'` unconditionally); `itemListOps.ts:100–103`; server `itemHierarchy.ts:263`

A workflow may have several terminal workphases (only mixing terminal with
non-terminal in one column is forbidden), so Done → Archived is a legal band
drop: ghost sorts X by its old timestamp mid-list; server stamps `now` →
last. `pendingPlacementFor` already says `'last'` (position is null), so only
the ghost is wrong — a jump on release rather than on the response. Rare.
**Fix:** terminal + non-member → `'last'`; terminal + member → `'existing'`.
One `popSession` case.

### 17. `needsResync` / `fail` reloads drop every other item's pending marker while `inFlight` still holds it `[Correctness & Security]`
**Files:** `client/src/components/workflow/useItemManagement.ts:56–58` (`replaceItems` → `placements: new Map()`), `:51` (`inFlight` untouched); `DragSessionContext.ts:65–69`

Not a wrong write (the reload's GET is served after the in-flight PATCHes;
when their responses land there's no placement to tripwire). What diverges is
presentation: `data-pending` disappears for Y on reload while
`writes.isPending(Y)` is true, and a re-drag-then-cancel of Y restores a
`priorPlacement` of `null`. Harmless today because the loading flash
unmounts the board. Recorded because `isPending` now exists as a second
source of truth and nothing keeps them aligned. **Fix (when it matters):**
`replaceItems` also clears `inFlight`.

### 18. Test-plan catalog still marks reconciliation #15 / #20 / #21 work as "code pending" though the report's own status lines say it shipped the same day `[Consistency & Drift]`
**Files:** `docs/test-plans/board-drag-interaction/drag-6-preview-reconciliation.md:158` (`TC-7`: "code pending"); `INDEX.md:71–74` (`DRAG-1.9` / `1.10` / `3.14` / `6.7` "written ahead of the code … expected to fail")

Explicitly out of the reconciliation report's scope ("the test-reconciler's
job at epic wrap-up"), so not a defect in that report — but a live
inconsistency: a reader would conclude these cases can't be automated yet.
Flagged for the test-reconciler pass; verify against the epic's sequencing.

---

## Informational

### 19. The re-assert effect's residual cost is one extra commit and a possible single-frame flash `[Correctness & Security]`
`useBoardDnd.ts:320–326`. When a response clears the active ghost, React
commits without it, runs the passive effect, commits again with it — the
browser may paint between, and dnd-kit's sortable transition can animate
out and back. #1's reference-compare fix avoids the clear altogether.

### 20. `findVerticalScrollAncestor` is per-region-per-sample `getComputedStyle` `[Correctness & Security]`
`dragRegions.ts:100–106`. Correct (bounded at `root`, so the board's own
`overflow-x-auto` → computed `overflow-y: auto` quirk is excluded). A style
resolve per region per pointer move; worth knowing when Story 4 multiplies
regions by cards.

### 21. `sendItemMove` cases repeat the same arrange block ×4; the real tracker has no unit test `[Duplication & Abstraction]`
`boardDndUtils.test.ts:467–470`, `:485–486`, `:504–508`, `:518–522`. The
`tracker()` fake is single-copy (correct). Cross-pass aside: the real
`complete`'s `needsResync` derivation and the `isPending` / `inFlight`
lifecycle (`useItemManagement.ts:75–97`) have no unit test — the report's
"covers both cases" describes `sendItemMove`'s reaction to a *mocked* return.

### 22. `verticalDistance` and its inline horizontal twin; `applied` never read `[Duplication & Abstraction]`
`dragRegions.ts:171–175` vs the `dx` one-liner at `:191`; `verticalDistance`
lost its second caller in the `regionAt` rewrite. `boardDndUtils.ts:319`
destructures only `needsResync`; `applied` appears only in the tracker and its
fake. One line either way.

### 23. Do-not-unify pairs (new) `[Duplication & Abstraction]`
`findVerticalScrollAncestor` vs `@dnd-kit/core`'s `getScrollableAncestors` —
checked: dnd-kit's tests `overflow` / `overflowX` / `overflowY` and walks
unbounded to the document, which is exactly the `overflow-x-auto` quirk
reconciliation #20 hit; reusing it would reintroduce the bug. `clampAxis` vs
`clipToVisible` vs `translateRect` — three operations on three input kinds.
`mockRect` / `buildScrolledSubrow` — only DOM fixtures; nothing to share yet.

### 24. Positive confirmations `[all passes]`

- **Re-assert effect** — trigger is map identity only; comparison by
  reference; can't fire with a live session on the clearing render;
  terminates in ≤1 render; no interaction with Stub drags; `exhaustive-deps`
  satisfied. No hook-rule violations in any touched file.
- **`priorPlacement` restore** — only when `writes.isPending(id)`; completed
  or failed mid-drag → cleared outright (correct, the row is authoritative);
  a real write on release goes through `begin`, which overwrites the slot.
  One function, two callers — the "same block twice" didn't happen.
- **`inFlight` lifecycle** — added on every `begin`; removed only by the
  *latest* `complete` / `fail`; `sendItemMove`'s try/catch guarantees one is
  called; `handleItemUpdated` bypasses it correctly.
- **`translateRect` sign** is right; delta-0 returns the same object so a
  still cursor produces no churn; the scroll ancestor is structural and can't
  change without the region key changing.
- **`clipToVisible` + `regionAt` + `bandFor` guards** — fully-hidden sub-row →
  no region; `regionAt` is plain containment with no nearest-fallback;
  `bandFor` guards `height <= 0`; the getter-based regression test genuinely
  exercises the `DOMRect` hazard for `clipToVisible`.
- **Done comparator** agrees with the server (`completedAt = now` on entry,
  stamped on POST and on the terminal-flip backfill); `MAX_SAFE_INTEGER`
  puts a null-`completedAt` preview last; tie-break matches
  `byPositionThenCreatedAt`. The comparator choice is made once
  (`selectBoardItems`); `freeItemOrder` and `getAttachedChildrenFrom` operate
  on lists that exclude unpositioned items.
- **`needsResync`** honoured on every `sendItemMove` path; the decision is
  made once; `handleCreateItem` / `handleItemUpdated` / `handleChildCreated`
  never go through the tracker so there's no second copy.
- **`pendingPlacementFor` / `placementFor`** for the null-position case agree
  with `itemHierarchy.ts:249` exactly, and `'last'` matches the server's
  workflow-wide append; the tripwire can't false-fire on it.
- **`setGhost`** is the single ghost writer for the machine; `scrollTop` is
  measured once and threaded; `priorPlacement` has one reader and one writer.
- **Fixtures** — `popSession.test.ts`'s scroll case builds from
  `dragFixtures.ts` (`region` gained `scrollTop: 0`); `itemListOps.test.ts`
  uses `makeItem`; `tracker()` is the only `ItemWriteTracker` fake. Test
  placement matches module ownership for every new describe.
- **Wiki ↔ code after reconciliation** — every ratified entry (#1–#5, #8, #9,
  #12–#24, #29) reads consistently with the code; new vocabulary
  (`priorPlacement`, `inFlight` / `isPending`, `needsResync`, `scrollTop`,
  `translateRect`, `findVerticalScrollAncestor`, `clipToVisible`) is spelled
  identically across code, tests, and `client/CLAUDE.md`; the wiki correctly
  stays at prose level. `client/CLAUDE.md`'s Story 3 section and File
  Structure tree are accurate claim-by-claim. All `TC-7.n` citations in
  `boardDndUtils.ts` resolve; `DRAG-3.x` / `DRAG-1.5–1.8` in the band spec
  resolve — #7 is isolated.
- **`pastColumnEnd`** now targets the last `[data-drag-region]` inside the
  group, 5px inside its bottom edge — inside the bounded box.
- **Tailwind** — the follow-up touched no JSX beyond a comment and a prop.
- **Server untouched; `ENABLE_TEST_ROUTES` strict `=== 'true'`.**
