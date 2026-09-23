# Code Quality Audit — Epic 3.5 Story 5 (2026-09-21)

Scope note: audited the single commit `fc9a22c` ("story 5"), HEAD at the
time of the audit with a clean working tree — Story 5, "Stub → out =
detach": the Descendants region and a Stub's deterministic start there,
full classification for a Stub drag, the two-pop exit through the Card
layer, `placementFor`'s Card/Descendants branches, `isIdentity`/`toRequest`
against `origin`, decision 4's single `type: 'item'` registration, and the
deletion of `handleDragEnd`'s `attached-child` branch. Ten source files
(`BoardView`, `KanbanCard`, `DragSessionContext`, `boardDndUtils`,
`dragClassification`, `dragRegions`, `popSession`, `useBoardDnd`, and the
new `tests/ui/drag-5-stub-detach.spec.ts` plus the classification spec),
six unit-test files, and the wiki/roadmap/plan docs the commit touched. No
server code changed; `server/src/lib/itemHierarchy.ts` was read as the
contract the three new request shapes target. Run as four parallel passes
per `.claude/guides/audit-workflow.md`; each finding is tagged with the
pass(es) that surfaced it. Every Fix Now (#1–#13) was re-traced by hand
before inclusion — #1's cascade/upsert premise against
`attachedCascade.ts` and `applyItemWriteResponse`, #2's two-hop against
`advancePopSession`'s recursion with the wrong-scope sample, #3 against
the server's anchor-scope check and the Story 6 plan's stated assumption.
Tags: **Fix Now**, **Watch List**, **Covered by Story N (Epic 3.5)**,
**Informational**. The Story 4 audit's Watch List (#12–#23) and its
Informational #24 were re-checked against this HEAD; the status table is at
the bottom and that doc has been annotated in place where something
changed.

Overall shape: Story 5 delivered the three capabilities it named, and its
"As built" section is accurate about the *code* — `origin` closes Story 4
#1 by construction (a detached child's origin is a workphase placement, a
re-attach's a parent one; the two kinds never match), decision 4 held (no
`'attached-child'` or `type === 'card'` comparison survives in
`client/src`; the collision closure reads `siblingScopeParentId` off the
session, never the active row), decision 7 is sound including the
grandchild case (`AttachedChildRow`'s recursive render never applies the
ghost check, so a grandchild is never mis-marked in its own section), the
pop-out chain fell out of `parentRegionKey` with no structural change to
`popSession.ts`, and every origin × placement × region combination traced
— detach in place, detach via another column's band, detach into a done
column, sibling reorder, reparent, a grandchild detached keeping a Stub as
its `parentId` — builds a request `itemHierarchy.ts` accepts. Deleting the
`attached-child` branch is a real de-duplication: every item write now
goes through one `toRequest → sendItemMove` path. What it left: Story 5 is
the first client code to *write* from a Stub's stored `workphaseId`, which
goes stale after any parent move because the server cascades to attached
descendants and the client upserts only the written row — the exact
tolerance `epic-4-decisions.md` §9 cites as evidence the cache framing is
safe no longer holds, and an in-place detach can walk a Stub back to the
entry workphase (TC-2's own scenario); the Story 4 #13 two-hop is now the
natural exit gesture under the tuning lever the plan hands the Product
Owner; `toRequest`'s sibling-reorder branch keys on the slot's shape
rather than the parent equality its comment states, and the Story 6 plan
already assumes the behaviour the comment describes; the "As built"
section's docs claim names three test-plan files that aren't in the
commit; and the `useBoardDnd.ts` extraction Story 4 #18 slated "alongside
Story 5" didn't happen — the hook grew from 575 to 663 lines.

---

## Fix Now

### 1. Story 5 is the first client write from a Stub's cached `workphaseId`, and that cache is stale after any parent move — an in-place detach can walk the Stub back to the entry workphase `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:458–467`, `:601–610`, `:617` (`activeItem.workphaseId` fed to `placementFor` and `toRequest`); `client/src/components/workflow/popSession.ts:468–471` (`regionWorkphaseFor`); `client/src/components/workflow/boardDndUtils.ts:232`; `client/src/components/workflow/itemListOps.ts:262–276` (`applyItemWriteResponse` upserts only the written row); `server/src/lib/attachedCascade.ts:18–28` (the server moves every attached descendant with its parent); `server/src/routes/items.ts:72–79` (the response carries the parent row + reindex pairs only); `client/src/components/BoardView.tsx:144–154` (`loadBoard` runs on mount and on workphase edits, never after a successful move); `tests/ui/drag-5-stub-detach.spec.ts:150–199` (TC-1/2/10 seeds P in the entry workphase; `:194` asserts "TC-2: already covered")

Before Story 5 a Stub's `workphaseId` was never read on the client for a
write — the old `attached-child` branch sent `{anchorId, side}` only, and
rendering places a Stub by its parent's membership. `epic-4-decisions.md`
§9 (lines 219–224) leans on exactly that: "the client already tolerates a
stale copy — evidence the cache framing is safe." `toRequest` and
`regionWorkphaseFor` now depend on the copy being right.

**Scenario** (merged column B covers `[wB1 (entry), wB2]`; column A covers
`wA`): P with Stub X loads in A (`workphaseId = wA` on both rows). Drag P
into B → P = `wB1`; the server cascades X = `wB1`; client X is still `wA`
(`completeItemWrite` upserts P only, no reload follows a successful move).
Move P to `wB2` — Sheet edit (`useItemManagement.ts:143–145`, P only), or
drop P into the `wB2` sub-row while B is expanded and collapse it. Server X
= `wB2`; client X still `wA`. Now drag X out of P and release in B:
`regionWorkphaseFor(B, 'wA')` → `wA` is not in B's covered set →
`targetWorkphaseId = wB1`; `toRequest`: `'wB1' !== 'wA'` → sends
`{workphaseId: 'wB1', isAttached: false, …}`; the server moves X `wB2 →
wB1` and logs a `status_change`. That is TC-2's exact prohibition
(`drag-5-detach-and-overflow.md:69–82`: "must not be silently walked back
to `W2`"). The common paths mask it — P landing at the entry workphase, a
sub-row target, or a stale value that happens to be in the covered set —
which is why the E2E passes: it seeds P in `todo` (the entry) and its
"TC-2" assertion tests the case that can't fail. Note that even a proper
TC-2 E2E with P *seeded* in `W3` via the API wouldn't catch this: the copy
is fresh on load; it goes stale only after a client-observed parent move.

**Fix (local, two lines — no design commitment):** in the Stub branch of
`handleDragStart`, resolve the containing Card's row (`deps.items.find(i =>
i.id === containingCardId)`) and use *its* `workphaseId` as the
`activeWorkphaseId` every `placementFor` call and `toRequest` read — the
nearest Free ancestor's row is always the freshly written one (it *was*
the written item), which is §9's own stated invariant ("an attached item's
`workphaseId` always equals its nearest Free ancestor's"). Either override
`workphaseId` in the session's `activeItem` snapshot or add an explicit
session field; the point is that nothing on the write path reads the
Stub's own copy. **Fix (principled, §9-consistent):** mirror
`cascadeWorkphaseToAttachedDescendants` client-side in
`applyItemWriteResponse` — when the upserted row's `workphaseId` differs
from the previous row's, set it on every descendant reached through an
attached chain (`getDescendantLevels` + `isStub`) — so the cache is right
for every consumer, not just this one. Do the local fix now; the mirror
is the right shape if §9 rules "keep the copy". Either way: a `toRequest`
unit row with a stale item workphase, and an E2E that moves P *through
the client* (drop into a non-entry sub-row, collapse, detach X) rather
than seeding P there.

**Status:** Fixed (2026-09-23) — `useBoardDnd.ts::handleDragStart`'s Stub
branch now snapshots the containing Card's *current* `workphaseId` onto
`activeItem` before any `placementFor`/`toRequest` call (the local fix).
The principled cache-mirror fix in `applyItemWriteResponse` is not
done — still parked behind epic-4-decisions.md §9's own open "keep the
copy" question. A through-the-client E2E reproduction turned out to be
infeasible with the current app: any column-config edit reloads all
items, healing the staleness before the repro's own detach step could
exercise it — verified by trace instead.

### 2. Story 4 #13 is now the natural exit gesture: with `popDistancePx > 0` a yank out of a Stub's section goes Descendants → Card → Column in one sample and strands `regionsRef` in the Card scope `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:253–269` (one re-resolve per sample); `client/src/components/workflow/popSession.ts:205–208`, `:219–235` (`transitionTo` recurses against the *caller's* sample)

Trace with `popDistancePx = D`, cursor yanked far below P in the same
column. First `advancePopSession` (scope `descendants:P`) pops out by
distance → `transitionTo('card:P')` → the recursion finds no `card:P` in
the descendants-scoped sample → returns `{card:P, outsideSince: T}`. The
hook re-resolves once, samples `card:P` scope, re-runs: `card:P` found,
cursor outside, distance ≥ D → `transitionTo('column:R')` → the recursion
finds no `column:R` in the card-scoped sample → returns `{column:R,
outsideSince: T}`. No second re-resolve. Result: `pop.contextKey =
column:R`, `regionsRef = [card:P, descendants:P]`, `placementRegion` →
undefined → `setGhost(null)` — X snaps back to rendering as a Stub in P's
section — `clampToContext` finds no context (overlay unclamped), the
collision session has `context: null`. A release in that window resolves
`region` undefined → `toRequest` null → nothing written, instead of the
detach-at-`last` the user is looking at. It self-corrects on the next
`pointermove` or on the `popDelayMs` timer (visible: X sits in P's section
for up to 500 ms after the yank, then jumps). Story 4 rated this Watch List
because the distance term ships disabled; Story 5's plan
(`story-5-stub-detach.md:173–178`, `:329–331`) explicitly names
`popDistancePx` as the Product Owner's lever for the Card-layer-stop feel
check, and the three-layer exit makes the two-hop the gesture the lever
exists for. **Fix:** the one Story 4 #13 already specified — loop the
re-resolve/re-sample/re-run in `evaluatePop` until `pop.contextKey`
stabilises (bounded by the layer depth, three today), `startSnap` once per
hop. Unit: a `popSession.test.ts` case that starts at `descendants:P`
with `popDistancePx > 0` and asserts the hook-level invariant "after
`evaluatePop`, `regionsRef` contains `pop.contextKey`" — or, since the
hook isn't unit-tested, an E2E under `SUSTAINED` with a non-zero distance.

**Status:** Fixed (2026-09-23) — `evaluatePop` now loops the
resample/rerun until `pop.contextKey` stabilizes (bounded to 4 hops)
instead of stopping after one. Covered by a new differential E2E case in
`drag-5-stub-detach.spec.ts` ("audit #2 regression") using a
distance-only tuning preset and an immediate release, so the pre-fix code
provably writes nothing in that exact window.

### 3. `toRequest`'s "sibling reorder" branch keys on the slot being anchor-shaped, not on the parent equality its own comment states — and the Story 6 plan already assumes the comment `[Correctness & Security + Duplication & Abstraction]`
**Files:** `client/src/components/workflow/boardDndUtils.ts:242–248` (`if (typeof placement.slot === 'object') return anchorFor(...)` — the comment says "same parent as before, position-only"); `server/src/lib/itemHierarchy.ts:148–175` (an anchor must be in the item's *resulting* position scope); `docs/planning/epic-3-5-stories/story-6-descendants-placement.md:50–52` ("resolving to `{ parentId, anchor + side }` — one relation the same `toRequest` already sends")

Today only `placementFor`'s Descendants branch produces a `parentId`
placement with an anchor slot, and it always sets `parentId =
origin.parentId`, so the proxy holds. Story 6's release resolves
`{parentId: Q, slot: anchor}` for a reparent *with* placement among Q's
Stubs — the plan's "one relation `toRequest` already sends" — and this
branch would send `{anchorId, side}` with no `parentId`/`isAttached`. The
server then resolves the anchor against the item's *current* scope
(`itemHierarchy.ts:168–175`) → 400 "anchorId is not in this item's
resulting position scope" → `sendItemMove` logs, fails, resyncs. Not
silent, but wrong, and the plan doc's belief about the adapter is wrong
today. **Fix:** condition on the rule the comment states — `'parentId' in
origin && placement.parentId === origin.parentId` → `anchorFor(slot,
others)` (position-only); any other non-null `parentId` → `{parentId,
isAttached: true, ...anchorFor(slot, others)}` (Story 1's atomic
reparent-with-placement; `anchorFor` returns `{}` for `'last'` with no
siblings, so Story 4's auto-drop request is byte-identical). One unit row
per branch. This is also the one place the four-way `'parentId' in …`
spelling in #7 would otherwise be re-derived.

**Status:** Fixed (2026-09-23) — `toRequest` now keys the sibling-reorder
branch on `hasParentOpinion(origin) && placement.parentId ===
origin.parentId`, per its own comment, not the slot's shape. New unit
row in `boardDndUtils.test.ts` covers the Story 6 case directly (an
anchor slot for a genuinely different parent → full
reparent-with-placement, not a bare reorder).

### 4. Five citations of DRAG-2.7 mean DRAG-2.8 `[Consistency & Drift]`
**Files:** `client/src/components/workflow/dragClassification.ts:20`, `:70`; `client/src/components/workflow/dragClassification.test.ts:107`; `tests/ui/drag-target-classification.spec.ts:125`; `docs/wiki/board-drag-interaction/README.md:434`

`drag-2-target-classification.md` TC-7 is "Stubs are classified
individually during a Card drag — no blanket exclusion" (Stubs as
*targets*, Story 2). TC-8 ("Inert targets") is the one that carries the
Stub-*drag* interim rule and the placeholder "*(The Stub half is
superseded when Story 5 lands the full classification; it stays here
under this ID with a 'was:' note at that point.)*" (`:136–137`). Every
Story 5 citation of the retired rule points at TC-7. The pre-existing
DRAG-2.7 references (`KanbanCard.tsx:377`, `dragClassification.test.ts:79`,
`part-3-attached-sibling-reorder.md:58`, the Story 2 plan) are correct and
stay. **Fix:** change the five to DRAG-2.8, and add TC-8's promised "was:"
note (cross-ref #5).

**Status:** Fixed for the source-code citations only (2026-09-23) — the
five renamed to DRAG-2.8 (`dragClassification.ts` ×2,
`dragClassification.test.ts`, `drag-target-classification.spec.ts`, wiki
README.md). TC-8's promised "was:" note in the test-plan doc was
deliberately *not* added: mid-fix, editing `docs/test-plans/**` was
determined to be Test Planner/Test Reconciler territory, not a
Coder-pass edit, even when an audit finding names the file directly —
see #5's own status and the `feedback-test-plan-ownership-boundary`
memory.

### 5. The "As built" docs claim names three files that aren't in the commit; plus the stale-comment batch the sweep missed `[Consistency & Drift]`
**Files:** listed per line below

The plan's "As built" bullet (`story-5-stub-detach.md:443–446`) says "the
DRAG-1/2/5 test-plan tables and per-case automation notes" were updated.
None of `drag-1-contexts-and-popping.md`, `drag-2-target-classification.md`,
`drag-5-detach-and-overflow.md` is in `fc9a22c`. The per-case *triage*
(⏳ → mapped) is Story 10's by the roadmap (`epic-3-5-roadmap.md:417–423`)
and isn't the finding; the finding is that the claim is false and the
headers say "not built". Fix the claim or apply the edits; either way the
lines below are wrong today:

- `docs/test-plans/board-drag-interaction/drag-5-detach-and-overflow.md:3` — "§8 (hardened 2026-09-17; Story 5, not built)".
- `docs/test-plans/board-drag-interaction/drag-1-contexts-and-popping.md:3` — "(the Descendants layer hardened 2026-09-17; Stories 5/6, not built)".
- `docs/test-plans/board-drag-interaction/drag-2-target-classification.md:136–137` — TC-8's "superseded when Story 5 lands … with a 'was:' note at that point" — the note was never added (#4).
- `docs/test-plans/item-positioning/part-3-attached-sibling-reorder.md:65–66` — quotes two `boardDndUtils.test.ts` titles by name ("excludes attached-child containers from a card drag", "scopes an attached-child drag to siblings under the same parent only"); both were renamed by this commit.
- `docs/wiki/board-drag-interaction/README.md:148` — "*(Three layers as built for Story 4; the Descendants row ruled 2026-09-17.)*" — four, and built.
- `docs/wiki/board-drag-interaction/README.md:334–335` — "Descendants → Card included, once built" — it is.
- `client/src/components/BoardColumn.tsx:177–180` — "a Stub drag never reaches the pop machine at all (DragSessionContext.ts)" — that file's own `pop` comment now says the opposite. The guard at `:181` (`!session?.pop`) is vacuous since `pop` is non-optional: it equals `!session`, which is `!isCardBeingDragged` already in scope at `:49`. The *behaviour* is right (the carve takes over for a Stub drag exactly as for a Card drag, and a Stub can now genuinely reach an empty column) — simplify the condition and fix the comment. This is Story 4 #23's second site.
- `client/src/components/DragTuningPanel.tsx:115` — `pop ? popState(pop) : session ? '(stub drag)' : '—'`: `pop` is `session?.pop ?? null` (`:54`), so it's null iff `session` is; `'(stub drag)'` can never render. Drop the middle branch; if the indicator is wanted, key it off `pop.contextKey.startsWith('descendants:')`.
- `client/src/components/workflow/popSession.ts:30–32` — "**Board** → **Column/sub-row** → **Card**. Three rules" — the file's own `placementFor` branches on a fourth layer.
- `client/src/components/workflow/popSession.ts:145` — "Story 5 gains a `descendants` row" — `popInDelayFor` has no such row (`descendants` falls to `popInDelayMs`); moot until Story 6 makes the kind a zoom-in candidate, but the comment claims something the code doesn't do.
- `client/src/components/workflow/popSession.ts:309–311` — "a locked hover's is always a Card today … (the only kind a locked hover could be before Story 5 adds another)" — Story 5 added no locked-hover kind (decision 3); that's Story 6.
- `client/src/components/workflow/dragRegions.ts:1` — "Drag regions (Board/Column/sub-row/Card)" omits `descendants` (the paragraph at `:30–35` has it; the one-line header doesn't).
- `client/src/components/workflow/DragSessionContext.ts:1–2` — the header lists every `DragSession` field but `containingCardId` (`workflow/CLAUDE.md`'s parallel bullet was updated; this wasn't).
- `client/src/components/BandGuides.tsx:99–100` — "the one place `[DRAG_REGION_ATTR]` is applied" — `KanbanCard.tsx:234` and `:297` apply it too.
- `client/src/components/workflow/itemListOps.ts:61` — names `pendingPlacementFor`, deleted in Story 4.1 Phase 3 (pre-Story-5 drift the Story 4 sweep missed).
- `client/src/components/workflow/dragRegions.test.ts:265` — "this is the only place a `kind: 'card'` region is built" — `popSession.test.ts:481`, `:489` and `dragRegions.test.ts:435` build three more (cross-ref #12).
- `client/src/test/dragFixtures.ts:21–23` — "No `card:`-keyed fixture yet … nothing here currently needs one" — five hand-rolled literals now need one (#12).
- `client/src/components/workflow/useBoardDnd.ts:293–294` — "Pointer tracking for the life of a Card drag" / `session?.pop != null` — item drag; tautological.

**Status:** Partially addressed, by design (2026-09-23). The false "As
built" claim about the DRAG-1/2/5 test-plan tables is walked back in
`story-5-stub-detach.md`'s Docs bullet (it now says those tables are
explicitly *not* part of this story's build, and why) rather than made
true by editing the tables themselves. None of the other stale-comment
lines above (all non-test-plan source files) were touched in this pass —
mid-fix, the user drew a hard, general boundary: `docs/test-plans/**`
content (automation-status columns, per-case notes, "was:" markers) is
Test Planner/Test Reconciler-owned, never a Coder/Architect edit, even
when an audit names the file directly. Now codified in
`.claude/personas/coder.md`, `architect.md`, and `test-planner.md`
("What to Never Do Without Asking" / "Relationship to Other Personas"),
plus memory `feedback-test-plan-ownership-boundary`. The remaining
non-test-plan stale comments this finding named (BoardColumn.tsx,
DragTuningPanel.tsx, popSession.ts, dragRegions.ts, DragSessionContext.ts,
BandGuides.tsx, itemListOps.ts, dragRegions.test.ts, useBoardDnd.ts) are
still open for a future pass. `dragFixtures.ts:21–23`'s own stale
comment was incidentally fixed as part of #12's work below (adding the
`card:`-keyed fixture it said nothing needed).

### 6. The new E2E spec breaks the fully-qualified case-id convention `[Consistency & Drift]`
**File:** `tests/ui/drag-5-stub-detach.spec.ts:36`, `:112`, `:150`, `:201` (and `:86`, `:257` which cite decisions rather than cases)

Every test plan states "cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-N.n`", and `drag-column-bands.spec.ts` /
`drag-target-classification.spec.ts` follow it (`'DRAG-3.1 / 3.2: …'`).
This spec's titles use bare `TC-9`, `TC-12`, `TC-1/TC-2/TC-10`, `TC-4`;
its first title qualifies the DRAG-1 reference and not the DRAG-5 one in
the same string. **Fix:** `DRAG-5.9`, `DRAG-5.12`, `DRAG-5.1 / 5.2 / 5.10`,
`DRAG-5.4` — the reconciler in Story 10 greps for these.

**Status:** Fixed (2026-09-23) — the four titles now read `DRAG-5.9`,
`DRAG-5.12`, `DRAG-5.1 / 5.2 / 5.10`, `DRAG-5.4`.

### 7. "The origin's parent" is spelled four ways in four files, and the `'parentId' in …` presence test nine times `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:326–327` (collision scope: `'parentId' in current.origin ? (current.origin.parentId ?? null) : null`), `:613` (release `others`: same expression); `client/src/components/workflow/popSession.ts:427` (`'parentId' in origin ? origin.parentId : null`), `:436` (`nonComparable = 'parentId' in origin`); `client/src/components/KanbanCard.tsx:191` (`!('parentId' in origin) || origin.parentId !== item.id`); the same presence test on *placements* at `boardDndUtils.ts:202–203`, `:233` and `itemListOps.ts:86`, `:96`

The three hook/machine copies (collision scope, `others`, the placement's
own `parentId`) must agree for a sibling reorder to write correctly; today
they agree by each re-typing the expression. Only `itemListOps.ts:78–83`
documents the semantic ("omitted = no opinion, explicit null = detach")
that makes the presence-vs-truthiness distinction load-bearing. **Fix:**
beside `Placement` in `itemListOps.ts`: `hasParentOpinion(p): p is
Placement & { parentId: string | null }` and `parentOpinionOf(p): string |
null`. `parentOpinionOf(origin)` at the three hook/machine sites,
`parentOpinionOf(origin) !== item.id` in `KanbanCard`, `hasParentOpinion`
for the raw `in` tests in `isIdentity`/`toRequest`/`renderedParentId`/
`renderedIsStub`. Story 6's all-rows scope then changes one expression.

**Status:** Fixed (2026-09-23) — `itemListOps.ts` gained
`hasParentOpinion`/`parentOpinionOf`; every listed site now reads one of
the two instead of re-typing `'parentId' in …`.

### 8. Release-time "which list is this" is derived twice per kind, twenty lines apart `[Duplication & Abstraction + File Responsibility]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:590–600` (`placementOver`: `!region ? null : descendants ? over ? {anchor} : null : isCardList ? over ≠ container ? {anchor} : 'container' : null`), `:611–616` (`others`: `descendants ? siblingItems(…).filter(≠active) : isCardList ? regionItems(…).filter(≠active) : []`)

Both are the same three-way switch on the same region, computing two
halves of one fact — the Story 6 doc's own "has a sortable container"
property (`story-6-descendants-placement.md:325–332`). `{ anchorId:
String(over.id), side }` is built twice inside the first. Story 4 #18
already proposed `resolvePlacementOver(region, over, side)` in
`popSession.ts`; Story 5 added the third branch inline instead. **Fix:**
one hook-local derivation, `releaseListFor(region, origin): { rows: Item[];
containerId: string | null } | null` (descendants → siblings, no
container; card list → `regionItems`, its `containerId`; card/none →
null), then `placementOver` and `others` each read it once, and the
`.filter(i => i.id !== activeId)` is written once. Story 6's "candidates =
all rows" and its gap projection then touch one branch.

**Status:** Fixed (2026-09-23) — `useBoardDnd.ts` gained
`releaseListFor`, read once by both `placementOver` and `others`.

### 9. `placementFor`'s eight positional arguments are unpacked from the session at four sites, and its card-list placement literal is spelled four times inside `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:272–283`, `:456–467`, `:487–490`, `:601–610` (each spells `placementFor(pop, regions, activeItem.workphaseId, activeItem.position, origin, containingCardId, priorPlacement[, over])`); `:455–467` vs `:486–490` (`updateSession({…}); setGhost(activeId, placementFor(…))` closes both start branches); `client/src/components/workflow/popSession.ts:443`, `:446`, `:448–452`, `:465` (`{ ...detach, workphaseId: regionWorkphaseFor(region, activeWorkphaseId), slot: X }`)

Story 5 added two parameters, so every call site grew — and every
pre-existing `popSession.test.ts` call (~20) grew with them, which is most
of that file's diff. Inside `placementFor`, `noAnchorSlot` was correctly
extracted for the slot half; the placement literal wasn't, and a missing
`...detach` on any one of the four copies would leave a Stub rendering as
still-attached on one path only (its section keeps the row while the
column also shows it) — the silent failure the presence semantic in #7
guards against. **Fix:** a `cardListPlacement(slot)` closure inside
`placementFor` (`slot: over` also works at `:428` and `:451` —
`PlacementOver`'s object form already is `{anchorId, side}`); in the hook,
`placementForSession(session, regions, over = null)` (four sites → one)
and a `beginSession(session, regions)` closing both start branches. Fuller:
`placementFor` takes a `subject: Pick<DragSession, 'origin' |
'containingCardId' | 'priorPlacement'> & { workphaseId; position }` so
Story 6's projection is a field, not a ninth positional.

**Status:** Fixed, base fix only (2026-09-23) — discussed with the user;
the fuller subject-object signature change was declined as premature
ahead of Story 6's own actual projection shape. `popSession.ts` gained
`cardListPlacement`; `useBoardDnd.ts` gained
`placementForSession`/`beginSession`, collapsing all four call sites.
`placementFor`'s own exported signature and every existing
`popSession.test.ts` call site are untouched.

### 10. "Nearest ancestor that …" is an inline reversed-index loop in a hook, and `App.tsx` has the same loop `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:62–68` (`containingCardIdOf`: `getAncestors` → iterate `length-1..0` → first `!isStub`); `client/src/App.tsx:126–131` (`getAncestors` → iterate `length-1..0` → first project owning a workflow)

Same shape, same "nearest first means iterate backwards" convention that
is easy to get the wrong way round. Root `CLAUDE.md`'s rule is one
hierarchy math layer — extend `hierarchy.ts`, never duplicate inline —
and this is a tree op both trees need, written in a hook file (Story 4
#18's lineage). **Fix:** `client/src/lib/hierarchy.ts::findNearestAncestor<T
extends TreeNode>(node, nodes, pred): T | null`; `containingCardIdOf`
becomes `findNearestAncestor(item, items, n => !isStub(n))?.id ?? null`,
`effectiveWorkflow` uses it with `n => workflows.some(w => w.projectId ===
n.id)`. (Server `workflowItems.ts:69–81` is the same idea over DB queries
— not shareable.)

**Status:** Fixed (2026-09-23) — `hierarchy.ts::findNearestAncestor`
added; both `containingCardIdOf` (useBoardDnd.ts) and `App.tsx`'s
`effectiveWorkflow` call it now.

### 11. Decision 4's registration shape is an untyped literal at two writers and five readers, plus fourteen test literals `[Duplication & Abstraction]`
**Files:** writers `client/src/components/KanbanCard.tsx:171` (`{ type: 'item', role: 'card' }`), `:375` (`{ type: 'item', role: 'stub', parentId }`), `client/src/components/BoardColumn.tsx:54`; readers `client/src/components/workflow/boardDndUtils.ts:82`, `:94`, `:102`, `:108–109` (`data?.type === 'item' && data?.role === 'stub'` verbatim twice), `client/src/components/KanbanCard.tsx:36–37`, `client/src/components/workflow/useBoardDnd.ts:416`, `:531`; the role union `readonly ('card' | 'stub')[]` re-typed at `KanbanCard.tsx:33` and `:71`; tests `boardDndUtils.test.ts:72`, `:85–87`, `:101–104`, `:123–125`, `:137–140`, `:146`, `:159`, `:168`

dnd-kit's `data.current` is `AnyData`, so the invariant decision 4
introduced — "every item row registers `type: 'item'`, never a type that
differs between a Stub's row and a Card row for the same id" — is held by
convention only; `role: 'stubs'` compiles. **Fix:** in `boardDndUtils.ts`
(or a leaf `dragData.ts`): `type ItemRowRole = 'card' | 'stub'`; `type
DragRowData = { type: 'item'; role: ItemRowRole; parentId?: string | null }
| { type: 'column' }`; `itemRowData(role, parentId?)`, `columnData()`,
`isStubRow(data)`, `isCardRow(data)`. Both `useSortable` calls, the
collision filter, `useDropTargetProps`'s parameter type and the test
literals read them; the decision's invariant becomes a type.

**Status:** Fixed (2026-09-23) — `boardDndUtils.ts` gained
`ItemRowRole`/`DragRowData`/`itemRowData`/`columnData`/`isCardRow`/
`isStubRow`; both writers (`KanbanCard.tsx`, `BoardColumn.tsx`), the
collision filter, and the `boardDndUtils.test.ts` literals all go
through them now.

### 12. Test fixtures: the Card and Descendants region literals are hand-rolled across three suites, the origin literal nineteen times, and the fixture file says nothing needs them `[Duplication & Abstraction]`
**Files:** `DescendantsRegion` literal, byte-identical: `client/src/components/workflow/popSession.test.ts:493–500` and `client/src/components/workflow/dragRegions.test.ts:96–105`; `CardRegion` literal ×3: `popSession.test.ts:477–484`, `:485–492`, `dragRegions.test.ts:433–440`; `{ …, slot: 'existing' }` origin: two same-body helpers (`popSession.test.ts:292` `freeOrigin`, `boardDndUtils.test.ts:299` `originFor`) plus inline literals (19 in `boardDndUtils.test.ts` alone); DOM builders `dragRegions.test.ts:266–280` (`buildCardInColumn`) vs `:362–380` (`buildCardWithDescendants` — the first's eight element-building lines plus one child, column rect hard-coded); `client/src/test/dragFixtures.ts:21–23` (the stale "no `card:`-keyed fixture yet" comment, #5)

The roadmap already names the `cardRegion` fixture under Story 10
(`epic-3-5-roadmap.md:435`, deferred from Story 4 #3); Story 5 needed it,
hand-rolled it three times, and left the deferral standing. **Fix:**
`dragFixtures.ts`: `cardRegion(cardId, r, parentRegionKey, overrides?)`,
`descendantsRegion(cardId, r)` (parent defaults to `cardRegionKey(cardId)`),
`freeOrigin(workphaseId)`, `stubOrigin(parentId)`; `buildCardInColumn`
gains an optional `descendants?: Rect`. Landing this now discharges the
Story 10 line and removes the comment in #5. Not `makeItem`-related — the
diff has no hand-written `Item` literal (positive confirmation).

**Status:** Fixed (2026-09-23) — `dragFixtures.ts` gained
`cardRegion`/`descendantsRegion`/`freeOrigin`/`stubOrigin`; adopted by
`popSession.test.ts`, `dragRegions.test.ts`, and `boardDndUtils.test.ts`
(retiring its own `originFor` helper). `buildCardInColumn`'s optional
`descendants?: Rect` param was not added — no test currently needs it;
`buildCardWithDescendants` stayed a separate builder.

### 13. E2E residuals the Story 4 #6 fix didn't reach, plus three new ones `[Duplication & Abstraction]`
**Files:** `tests/ui/drag-5-stub-detach.spec.ts:27–29` (`stubRow`) byte-identical to `tests/ui/drag-target-classification.spec.ts:30–32` (`target`): `page.locator('[data-item-id="${id}"]')`; `drag-5-stub-detach.spec.ts:159`, `:210`, `:266` (`board.columns.find((c: { entryWorkphaseId: string }) => c.entryWorkphaseId === todo.id)` ×3, each re-annotating the untyped `fetchDefaultBoard` row; `drag-column-bands.spec.ts:103–104`, `:123`, `:349–350` do the same under `columnKeyOf`); clock margins — `drag-5-stub-detach.spec.ts:180`, `:281` (`popDelayMs * 2 + 3000`) vs `:236` (`* 2 + 2000`) vs `:139`, `:238` and `dragGesture.ts:235` (`+ 2000`) vs `drag-column-bands.spec.ts:53` (`+ 300`); scoped `article` re-rolled inline at `drag-5-stub-detach.spec.ts:187`, `:198` (`column(page,'Todo').getByRole('article', {name, exact: true})`); `const createItem = seedItem` aliased in both `drag-5-stub-detach.spec.ts:25` and `drag-target-classification.spec.ts:34`

**Fix:** `boardLocators.ts::itemRow(page, id)` (the attribute
`workflow/CLAUDE.md:82` documents); `seed.ts::columnForWorkphase(board,
workphaseId)` and type `fetchDefaultBoard`'s return; `dragGesture.ts::
clocksMargin(tuning, ...clocks)` with one named slack constant, used by
`awaitPoppedOut` and `popThrough` too (four spellings of "clock(s) plus
slack" with three different slacks and none named is exactly the drift
Story 10's flakiness call will have to untangle); `article(scope: Page |
Locator, title)`; drop the `createItem` alias.

**Status:** Fixed for the two named specs (2026-09-23) —
`boardLocators.ts` gained `itemRow` and a scope-accepting `article`;
`seed.ts` gained `columnForWorkphase` plus a typed `fetchDefaultBoard`;
`dragGesture.ts` gained `clocksMargin` (one named slack, also adopted by
`awaitPoppedOut`). Applied to `drag-5-stub-detach.spec.ts` and
`drag-target-classification.spec.ts` — both `createItem` aliases
dropped, `stubRow`/`target` replaced by `itemRow`, the three
`board.columns.find(...)` inline literals replaced by
`columnForWorkphase`, the two scoped `article` re-rolls collapsed.
`drag-column-bands.spec.ts`'s own `columnKeyOf` and `popThrough` were
left as-is — outside this finding's named file list, and a separate
DRAG-3 suite.

---

## Watch List

### 14. `priorPlacement` wins mid-drag in every locked card-list or Descendants context, not just the origin's — Story 5 copies the pattern into a branch a Stub now crosses `[Correctness & Security]`
**Files:** `client/src/components/workflow/popSession.ts:426` (`priorPlacement ?? origin`), `:441–444`, `:457`; the comment at `:385–393` scopes it to "picking up, or popping back into the context it started in"

The code prefers `priorPlacement` for any locked region while `over` is
null — every mid-drag call. Pre-existing for a Card popped into a
*different* column (the ghost stays in the old column's list); Story 5
copies it into the Descendants branch, so a Stub re-dragged while a
sibling-reorder write is pending keeps rendering inside P's section for
the whole time it is locked in `column:R` — the machine says Column, the
outline is on the column, the preview is a Stub row. Release computes
fresh (`placementOver` non-null), so nothing wrong is written. **Fix:**
prefer `priorPlacement` only when it names the region's own list
(`hasParentOpinion(prior)` for a Descendants region; `!hasParentOpinion
(prior) && prior.workphaseId ∈ region.coveredWorkphaseIds` for a card
list) — one more reason for #7's helpers.

### 15. A re-drag of a Stub whose detach or reparent is still in flight starts from stale real data — the wrong start layer, possibly a phantom one `[Correctness & Security]` (Story 4 #12 / reconciled #22 family)
**Files:** `client/src/components/workflow/useBoardDnd.ts:441–469` (`isStub(activeItem)` and `containingCardIdOf` read `deps.items`); `tests/ui/drag-5-stub-detach.spec.ts:257–300` (the decision-4 regression waits on `toBeVisible()` — satisfied by the *preview* — then picks up)

`deps.items` still says "attached under P" until the response lands,
while the row the user picks up is already a Card in the column (or a
ghost under Q). In that window: start context `descendants:P`; if X was
P's only child the section is unmounted, `sampleRegions` yields nothing,
`placementFor` returns null and `setGhost(null)` **clears X's pending
marker** (X snaps back into P's section visually) while the machine sits
in a phantom context for `popDelayMs` before reaching Board. With a
sibling present, `over` resolves to a sibling and release sends
`{anchorId: S, side}` for an item the server has already detached → 400
"anchorId is not in this item's resulting position scope" → logged,
failed, resynced (covered). The regression E2E passes because the
localhost response beats `pickUp`. **Fix:** derive the start from the
*rendered* state — if `priorPlacement` carries `parentId: null` or a
`workphaseId`, take the Free path; a string `parentId` is the Stub's
parent. Same root as Story 4 #12 (the drag-start snapshot); fix them
together.

### 16. A Descendants release with no `over` re-sends `priorPlacement`, contradicting the "release is always decisive" comment `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:580–600` (descendants → `over ? {…} : null`), `client/src/components/workflow/popSession.ts:426`

For a card list, release always yields `'container'` or an anchor. For
Descendants it yields `null` when `over` is null (an only child —
`closestCorners` has no candidates), which routes through `priorPlacement
?? origin`. With no prior placement that's identity (correct). With a
pending prior write (#15's window) it re-sends that write. Harmless today
(sequenced by `writes.begin`), but the comment at `:580–589` is wrong
about it. **Fix:** map a null `over` in a Descendants context to `origin`
at the call site, or add an explicit `'origin'` `PlacementOver` value —
folds into #8.

### 17. Story 4 #14 is now a three-layer skip: a `descendants:P` context whose section is clipped out of view pops straight to Board `[Correctness & Security]`
**Files:** `client/src/components/workflow/popSession.ts:186–187`, `:207` (`contextRegion?.parentRegionKey ?? null`)

Same degenerate input as before (`clipToVisible` null for a section
wheel-scrolled fully out of its column body), one more layer skipped —
Card and Column both. Same fix: read the parent key off `structureRef`
(which survives a clipped-away rect), not the measured region.

### 18. `layoutRect`'s sortable-transform correction is gated on `kind === 'card'`; a `descendants` element is nested *inside* the sortable Card `[Correctness & Security]` (Story 6 landmine)
**Files:** `client/src/components/workflow/dragRegions.ts:313` (`layoutRect(dom.element, facts.kind === 'card')`), `:358–364`, `:374–381` (`currentTranslate` reads only the element's own computed transform)

Irrelevant this story by construction: a `descendants` region is only ever
a *start* context, and while it's the context the Stub isn't in the column
list, so nothing shifts its Card. Story 6 makes it a zoom-in target
reached from `card:P` while P may still be mid-transition from a shifted
position, and the section's rect would then include P's transform while
`card:P`'s doesn't — a hover on the section could land outside it by the
shift. The plan's own risk note ("the region's own box never transforms")
is true of the wrapper and misses the ancestor. Passing `true` wouldn't
fix it — `currentTranslate` would need to walk to the nearest sortable
ancestor, or the section rect could be derived from `card:P`'s corrected
rect plus the wrapper's offset. Roadmap doesn't name it under Story 6;
verify there.

### 19. `useBoardDnd.ts` grew from 575 to 663 lines; none of the three extractions Story 4 #18 slated "alongside Story 5" happened `[File Responsibility]` (escalated)
**File:** `client/src/components/workflow/useBoardDnd.ts` — `containingCardIdOf` (`:62–68`, pure), the Stub/Card start branching (`:414–491`), `siblingScopeParentId`/`siblingItems` (`:326–341`, `:405–412`), `placementOver` with a third inline branch (`:590–600`), the clamp math still local (`:637–663`)

No `usePendingGhostGuard`, `endSession`, or `resolvePlacementOver` exists
in `client/src`; `clampToCurrentContext`/`clampAxis` are still here, not
in `dragRegions.ts`. The hook now owns at least six concerns: drag-start
branching, `containingCardId` resolution, the per-sample layer-change
re-sample, collision-session construction, ghost/placement bookkeeping
(`setGhost`, the reactive re-assert at `:502–508`,
`restorePriorPlacement`), release, cancel, and pure geometry. **Seam
(unchanged):** clamp math → `dragRegions.ts` with a unit table; #8's
`releaseListFor` + `resolvePlacementOver` → beside `placementFor`; the
teardown trio (`handleDragCancel`'s and `handleDragEnd`'s identical
prologue, the pointer-effect cleanup at `:302–309`) → one `endSession()`;
#10 takes `containingCardIdOf`. Do it before Story 6 Phase C
(`story-6-descendants-placement.md:267–270` — projection state "set at the
zoom-in transition and on every sample") adds more per-sample state to
this same hook.

### 20. `placementFor` is a four-way per-kind dispatcher; `popSession.ts` now holds two independently substantial halves `[File Responsibility]`
**File:** `client/src/components/workflow/popSession.ts:394–466` (~73-line body: Card `:411–414`, Descendants `:416–429` with its own `over` sub-branches, shared `nonComparable`/`detach` setup `:436–437`, in-context card list `:439–453`, Board-layer card list `:455–465`); file 471 lines

"Hover → placement" in name; four independent rules sharing a signature
in practice. **Seam:** `placement.ts` takes `placementRegion`,
`noAnchorSlot`, `placementFor`, `regionWorkphaseFor`, `PlacementOver`
(and #8's `resolvePlacementOver`), leaving `popSession.ts` as purely the
transition/timing machine (~237 lines). Story 6 Phase C extends the
Descendants branch with `resolvePlacement(rows, gap, depth, P)`; make the
seam first.

### 21. `boardDndUtils.ts` — Story 4 #20's "next time the file is touched" condition was met (163 lines changed) and the split didn't happen `[File Responsibility]`
**File:** `client/src/components/workflow/boardDndUtils.ts` (289 lines): collision policy + `CollisionSession` (`:26–119`), drop-side geometry (`:121–155`), the placement→request adapter (`:157–255`), the async dispatcher (`:257–289`). The 2-line header names only the adapter.

**Seam:** `dragCollision.ts` for `resolveBoardCollisions`/`CollisionSession`/
`rectCenterInside`/`resolveDropSide` (`KanbanCard`'s live indicator reads
`resolveDropSide` directly — it belongs with collision); keep this file
(or `dragRequest.ts`) for `anchorFor`/`isIdentity`/`toRequest`/
`sendItemMove`, matching what the header already claims. Fold #11's
`DragRowData` into the collision half.

### 22. `dragRegions.ts` (654 lines) — the band/clip math is the one separable piece `[File Responsibility]`
**File:** types + `isCardList` (`:37–160`), keys + column-shape data (`:168–218`), structure resolution + DOM helpers (`:220–518`), live measurement (`:293–331`), hit-testing (`:520–558`), band/reservation/clip math (`:560–654`)

`workflow/CLAUDE.md` scopes the file to "regions and their pixel drop
bands" as one pair by design, so the first five belonging together is
convention. The sixth — `reservationFor`/`bandBoundaries`/`bandFor`/
`distanceOutside`/`clipToVisible`, pure geometry with no DOM or structure
dependency, imported by `popSession.ts` purely as math — would read
better as `dragBands.ts`. Not urgent; Story 6 adds a resolver (the
established pattern), not band math.

### 23. Region-kind branching after the fourth kind: twenty sites, most tabled; a fifth kind is a resolver, a prefix in the parent gate, and one release branch `[Duplication & Abstraction]`
**Files:** `isCardList` ×6, `popInDelayFor` ×3, `hoverFor`, `measureRegions`' spread (all fine); not tabled: `dragRegions.ts:281–287` (`startsWith('card:') || startsWith('descendants:')` for "has a parent" plus a three-way resolver ternary), `:313` (`kind === 'card'`), `:321` (`card || descendants` — `!isCardList` re-spelled), `useBoardDnd.ts:650` (`kind !== 'column'`), and #8's trio

A per-kind table is *not* warranted — `hoverFor`'s bandless,
`containmentRect`'s has-outer-bounds, `clampToCurrentContext`'s clamps-y
and `layoutRect`'s carries-a-transform are four properties that happen to
partition the kinds the same way today; a table would couple them. Keep
#8 folded so a fifth kind is three edits, not five; `:321` should read
`!isCardList(facts)`.

### 24. Story 4 #22 carried forward — column facts now derived in four places `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:398–412` (`regionItems` + `siblingItems`), `client/src/components/BoardColumn.tsx:61–69`, `client/src/components/workflow/dragRegions.ts:494–503`, `client/src/components/KanbanCard.tsx:220` (the section's own `getAttachedChildren(item.id)`)

The hook re-selects what the components already rendered, per kind;
`isIdentity`'s `others` agrees with the DOM by convention. Story 6's
all-rows change and Epic 4's §11 are the next edits — leave until then,
but don't add a fifth.

### 25. Region-attribute registration idiom ×3 `[Duplication & Abstraction]` (cosmetic)
`KanbanCard.tsx:234` (`{...(isOverlay ? {} : { [DRAG_REGION_ATTR]: … })}`), `:297` (`{...{ [DRAG_REGION_ATTR]: … }}`), `BandGuides.tsx:135`. A `dragRegionProps(key | undefined)` in `dragRegions.ts` is one line and makes "how an element registers" one function; it would also fix `BandGuides.tsx:100`'s claim in #5 by making it true again.

### 26. Two names for one value, and four optional-chains on an invariant this commit retired `[Consistency & Drift]`
`containingCardId` (`DragSessionContext.ts`, the session field) and `originCardId` (`dragRegions.ts` params, `useBoardDnd.ts::originCardIdRef`) name the literal same value, computed once in `handleDragStart`; each side is well-commented, nothing bridges them. Possibly deliberate (domain vs. geometry vocabulary) — flagging, not asserting. And `useBoardDnd.ts:250`, `:294`, `:504`, `KanbanCard.tsx:191`, `DragSessionContext.ts:99` still guard `pop` as if it could be absent independent of `session`; none is a bug, all invite new logic on the false premise.

---

## Covered by Story N (Epic 3.5)

- **Stub-row content ×2 and the nested `SortableContext` sub-list ×2** — `KanbanCard.tsx:341–348` (`AttachGhostRow`) vs `:404–409` (pill + `truncate text-xs text-zinc-300` title); `:294–324` vs `:411–425` (`space-y-1 border-l border-zinc-700/50 pl-3` wrapper + `SortableContext` + the same five-prop `AttachedChildRow` map). **Story 6** — `epic-3-5-roadmap.md:322–323` ("the flat descendants list") and `story-6-descendants-placement.md:244–249` (one `SortableContext`, `border-l` guides removed, the ghost row folded). Same call the Story 4 audit made for #10's Stub half.
- **`KanbanCard.tsx` Card/Stub tier split (Story 4 #19)** — did not happen before Story 5; correctly so. Story 5's three changes here (decision 4 on both rows, decision 7's `attachGhostId`, the `descendants:` attribute on the section wrapper) are additive within the tiers that already existed, and **Story 6** Phase B rewrites both rows' structure and may fold `AttachGhostRow` into a `ghost` flag. Extracting `StubRow.tsx` now would be re-extracted in a different shape next story; Story 4 #19's timing is revised to "as part of Story 6 Phase B".
- **Decision 3 spelled as two complementary gates** — `dragRegions.ts:424` (`cardId !== originCardId`) and `:555` (`r.kind !== 'descendants'`); `dragRegions.test.ts:356–361` says each covers the other's half. **Story 6** (`epic-3-5-roadmap.md:333–336`, "reached by holding over a locked Card's descendants section") removes both.
- **TC-3, TC-5, TC-11 automation; the DRAG-1/2/5 status columns** — **Story 10** (`epic-3-5-roadmap.md:417–423`). #5 covers only the false claim and the "not built" headers, not the triage.
- **Story 4 #3's unit half** (`cardRegion` fixture + a `popSession.test.ts` Card-layer describe) — **Story 10** (`epic-3-5-roadmap.md:435–445`); #12 discharges the fixture line early because Story 5 needed it.

---

## Informational

### 27. A Stub of an Unsorted parent passes through a phantom `card:P` layer
Unsorted registers no column region, so `findParentRegionKey` returns null for `card:P` and `cardStructureFromKey` drops it (`dragRegions.ts:400`), while `descendants:P` still resolves (its parent is P's own element). The machine goes `descendants:P` → `card:P` (no region: ghost null, overlay unclamped, `useIsAttachTarget(P)` true so P is outlined and forced open, a release writes nothing) → Board after `popDelayMs` → a column band → `{workphaseId, isAttached: false}`. Degraded but safe; Board is the correct next layer anyway.

### 28. Decision 1's "grandchild dead zone is identity" holds only when the grandchild has no siblings
With a sibling under the same Stub parent, `closestCorners` over the scoped rows (`boardDndUtils.ts:89–97`) returns the nearest sibling wherever the cursor is in the section, so a release over a non-sibling row still writes `{anchorId: sibling, side}`. Consistent with Story 4 #26 (a real anchor is never identity); not what `story-5-stub-detach.md:150–157` says. A wording fix in the plan, not code.

### 29. `handleDragStart` returns silently on malformed data
`useBoardDnd.ts:443` — dnd-kit keeps an active drag with no session and no overlay, no console trace. Unreachable with the depth cap; a `console.warn` would make it diagnosable.

### 30. No automated case asserts the resolved *side* of a detach
`resolveDropSide(active.rect.current.translated, …)` at `useBoardDnd.ts:563` relies on dnd-kit keeping the initial rect + delta across the section → column remount (Story 4's attach path relied on the same). TC-1's E2E releases with `over = Q` and passes, but asserts only `position !== null`; a null `translated` (→ `'before'`) would go unnoticed. One `toBeGreaterThan` against Q's position.

### 31. Small repeats to fold when nearby code moves
The per-test seed prefix in `drag-5-stub-detach.spec.ts` (`seedTemplatedWorkflow` → `pickWorkphases('Todo')` → create P) ×6 — the trees genuinely differ, so line count, not risk. `isTerminal` tested at three points in `placementFor` (`:360`, `:445`, `:460`) — one moved into `noAnchorSlot`; the other two gate whether an anchor is honored, a different question.

### 32. Do-not-unify pairs, confirmed
The Descendants section wrapper vs `CardList` (a Stub list has no bands and no workphase; Story 4 #7 and `story-6-descendants-placement.md:343–351`); `AttachGhostRow` vs `AttachedChildRow` (different lifecycle, documented at `KanbanCard.tsx:331–337`); `containingCardIdOf` vs server `workflowItems.ts:69–81` (array vs DB); the Free vs Stub origin literals in `handleDragStart` (deliberately different shapes — the test-side helpers are #12's); `priorPlacement ?? …` at `popSession.ts:426`, `:443`, `:457` (the "nothing fresh yet" test differs per layer); `useLiveDropSide`'s role filter vs `resolveBoardCollisions`'s (diagnostic vs policy — decision 4 wants that separation); the `useSortable` + `CSS.Transform.toString` idiom ×3 (Story 4 #28); `regionItems` vs `siblingItems` (different selectors by design — merging is Story 6's all-rows change).

### 33. Positive confirmations `[all passes]`
- **Requests.** Every origin × placement × region combination traced produces a request the server accepts: detach in place (`{isAttached: false, anchorId, side}`, no `workphaseId` — `itemHierarchy.ts:74–88` keeps `parentId`, `sharesPositionScope` passes for a Free anchor); detach via another column's Board band (`workphaseId` + anchor, same workflow); detach into a done column (`{isAttached: false}` → `position: null`, `completedAt = now`; the preview's `completedAt`-null-last sort matches); sibling reorder (`{anchorId, side}` only — the pre-Story-5 request, byte-identical); reparent (`{parentId: Q, isAttached: true}`); a detached child re-attaching to its own parent (origin is a workphase placement → never identity → same-parent attach toggle, `validateHierarchyRequest:127` skips the cap); a Stub anchored beside its own parent at column layer; a grandchild detached keeping a Stub as `parentId` (legal per §11).
- **Identity.** `placementFor` returns `origin` for `attachToCardId === containingCardId` regardless of route (fresh start, or column → re-entry); `isIdentity(origin, origin)` is true; a detach placement is never identity; Free Card drags are unaffected (`nonComparable` false → `noAnchorSlot` degenerates to `workphaseOnlySlot`; the Card branch degenerates to `'last'`; `isIdentity` on a Free origin is value-equivalent to the old raw-item comparison, the `null`/`undefined` Unsorted case included). Story 4 Informational #24 resolved by absence — no `'workphaseId' in origin` anywhere in `client/src`.
- **Decision 4.** No `'attached-child'` or `type === 'card'` comparison survives (test fixture ids only); `resolveBoardCollisions` gates only on `type === 'item'` and reads `role`/`parentId` off droppables; `siblingScopeParentId` comes from `sessionRef`; `handleDragEnd`'s `type === 'column'` read tolerates stale/empty active data because the item path is session-driven.
- **Decision 7.** `attachGhostId` never marks X in its own home section (grandchild included); it does mark X in Q's section for TC-4; the detached-child-onto-own-parent case renders `AttachGhostRow` because its origin has no `parentId` key.
- **Regions.** The origin's `card:`/`descendants:` resolve regardless of `isValidCard`; every other Card's section is dropped; `childRegionAt` excludes `descendants`, so no zoom-in from a Card context is possible; `findParentRegionKey` for `descendants:P` lands on `card:P` and for `card:P` on the column; cycle-forming and depth-capped Cards still register no region, so the cycle and cap cases are unreachable by construction; classification for a Stub is the same `isWithinDepthCap` walk as a Card and P is never cycle-forming for its own Stub. `dragRegions.ts` is import-free, `BandGuides.tsx` doesn't import `KanbanCard.tsx` — both Story 4 #4 cycles stayed fixed, no new one.
- **Render.** `parentId: null` moves X out of `getAttachedChildrenFrom` and into `selectBoardItems` atomically (one registration at a time — never in both `SortableContext`s); `computeChildCounts` drops P's count so a lone-child section unmounts and re-mounts on the origin placement; the stale `descendants:P` structure entry after that unmount is never read.
- **Story 4 consolidations** were used, not re-rolled: `isCardList` (never widened to include `descendants`), `placementRegion` (both callers), `transitionTo`/`popInDelayFor`/`hoverFor`, `reservationFor`/`CardList`/`TypePill` (untouched, correctly), `seedDragTuning` + presets, `awaitDragContext`, `article`/`column`, `fetchItem`/`fetchDefaultBoard`/`seedItem`/`pickWorkphases`, `makeItem` (no hand-written `Item` literal anywhere in the diff), `getAncestors` (cycle-safe, not a bespoke walk). `dragClassification.ts` is 77 lines of classification and nothing else; `DragSessionContext.ts` is context + type + two one-line derivations. `tests/ui/drag-5-stub-detach.spec.ts` is one catalog (DRAG-5 + two decision guards), unlike Story 4 #21.
- **Failure paths.** `sendItemMove` still logs, fails the tracker and resyncs; a Descendants-context 400 (stale anchor scope) reaches it; `restorePriorPlacement`/`handleDragCancel` need no Stub special-casing. `ENABLE_TEST_ROUTES` is still strict `=== 'true'`; no raw SQL or transaction boundary touched.

---

## Story 4 Watch List — status at `fc9a22c`

| # | Finding | Status |
|---|---|---|
| 12 | Stale `activeItem` snapshot at release | **Unchanged** in mechanism; Story 5 extends the same snapshot to Stub drags. #1 above is a *different* staleness (pre-drag, from an earlier parent move) that #12's one-liner would not fix — `deps.items` itself is stale. #15 is the Stub-start face of the same snapshot. |
| 13 | Two-hop layer transition in one sample | **Worsened** → this audit's **#2**. The third layer makes the two-hop the natural exit under the lever the plan hands the PO. |
| 14 | Context region missing from sample → pops to Board | **Unchanged in kind, now a three-layer skip** → **#17**. Same fix. |
| 15 | F8 double-easing during the snap | Unchanged; comment fixed by Story 4 #5. Hands-on gate still pending. |
| 16 | `loadBoard` unmounts `DndContext` mid-drag | Unchanged; no new `loadBoard` call sites. |
| 17 | In-context bare-container release is a no-op (PO question) | **Unchanged for Cards.** For a Stub the same release is a detach-to-end (`noAnchorSlot` → `'last'`, decision 5) — the PO call now has an in-codebase precedent for "container = append". |
| 18 | `useBoardDnd.ts` owns pure geometry; extract alongside Story 5 | **Not done; grew** 575 → 663 → **#19** (escalated). |
| 19 | `KanbanCard.tsx` Card + Stub tiers; split before Stories 5/6 | **Not done; timing revised** → Covered by Story 6 Phase B (above). |
| 20 | `boardDndUtils.ts` "Utils" — split next time touched | **Touched (163 lines), not split** → **#21**. |
| 21 | `drag-column-bands.spec.ts` spans three catalogs | Unchanged. The new spec is one catalog. |
| 22 | Column facts ×3 | **Now ×4** (`siblingItems`) → **#24**. |
| 23 | `session.pop != null` as "Card drag" ×2 | **Site 1 resolved** (`KanbanCard.tsx:189–193` reads `origin`, decision 7). **Site 2 vacuous** (`BoardColumn.tsx:181` equals `!session`; behaviour right, comment false) → #5. |
| 24 (Info) | `origin.workphaseId` present-but-undefined | **Resolved by absence** — no `'workphaseId' in origin` in `client/src`; `isIdentity` compares values. |
