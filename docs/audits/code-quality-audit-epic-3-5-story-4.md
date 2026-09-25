# Code Quality Audit — Epic 3.5 Story 4 + Story 4.1 (2026-09-20)

Scope note: audited every code file touched from `dd23e27` ("refactor
context and movement rules") through HEAD `ae06121` ("story 4.1 phase
3+4") — five commits: `dd23e27`, `1fe1559` (docs only), `fe5f135` (4.1
phases 0–2), `abb9b59` (CLAUDE.md refactor + header comments on ~40 files),
`ae06121` (4.1 phases 3–4). Together they are Story 4 (Card → Card attach:
the three-layer stack, Card regions, `Placement.parentId`, the exact
reservation) and Story 4.1 (the vestige-removal refactor: `kind`
discriminant, shortCard, structure/measure split, `toRequest`/`isIdentity`,
`boundsRect`, F8's shared clamp modifier). Twenty-one substantive code files
plus the wiki/test-plan docs they implement; the ~40 header-comment-only
touches in `abb9b59` were spot-checked by the drift pass (15 files), not
audited as code. Run as four parallel passes per
`.claude/guides/audit-workflow.md`; each finding is tagged with the pass(es)
that surfaced it. The top findings (#1, #2, #5, #9, #10, #12) and every
stale-comment line in #6 were re-traced by hand before inclusion. Tags:
**Fix Now**, **Watch List**, **Covered by Story N (Epic 3.5)**,
**Informational**. Story-3-reconciled Watch List items (#9–#22) were
re-checked against this HEAD; the status table is at the bottom and the
story-3-reconciled doc has been annotated in place.

Dispositions are recorded inline as **Status (date)** paragraphs under
each finding, as the walkthrough with the Product Owner reaches it (begun
2026-09-21: #1, #7, #8 resolved; #3 deferred to Story 10; #2 open).

Overall shape: Story 4.1 did what it said. Every named vestige is gone
(`isCardKey`, the key-prefix branches, `nonCardRegionAt`/`cardRegionAt`,
`hoverForCard`, the whole frozen-rect family, `resolveDropTarget` and its
four siblings, `scopeWorkphaseIds` client-side, `ghostCardHeightPx`,
`effectiveCardCount`), its own eight-item "drift to fix" checklist is
complete, the tuning surface is consistent across four sources, every
`data-*` attribute has a matching reader and writer, and `toRequest` builds
a request the server accepts in every origin × placement combination
traced. What it left: one real gesture bug in the new identity rule (a
detached child can never be re-attached to its own parent by drag — the
ghost previews it, the release no-ops); one shape of the Phase 1 "net
height never changes" invariant that isn't exact (empty sub-row, 12px);
two circular imports, one of which the story-3-reconciled fix #2
introduced; the headline attach gesture with zero automated coverage at
any level; and — the third audit in a row to say so — the E2E scaffolding,
the two card lists, and the band-edge formula still each spelled twice.

---

## Fix Now

### 1. A detached child dropped onto its own parent Card reads as identity — the attach previews, then never writes `[Correctness & Security]`
**Files:** `client/src/components/workflow/boardDndUtils.ts:189–202` (`isIdentity`, parent branch at `:194–196`), `:213–227` (`toRequest`); `client/src/components/workflow/useBoardDnd.ts:527` (`others` is `[]` for a Card context); `client/src/components/workflow/boardDndUtils.test.ts:236–244` (pins the wrong premise); server contract `server/src/lib/itemHierarchy.ts:125–130`

`isIdentity` for a `parentId` placement is `placement.parentId ===
item.parentId`, then `slot === 'last'` → `others.length === 0` → `true`.
A Free Card that is a *detached* child of X (`parentId = X`, `isAttached
= 0` — the Epic 3 model, `item-attachment/README.md` §1 "a detached child
is Free", seeded by `attached-children.spec.ts:41–43`) classifies X as
`valid` (X is an ancestor, not a descendant), so it can zoom into X. The
ghost draws it as X's last Stub; the release builds `{parentId: X, slot:
'last'}`, `isIdentity` says same-list-same-ordinal, `toRequest` returns
`null`, `restorePriorPlacement` runs, nothing is sent. The server would
have accepted `{parentId: X, isAttached: true}` — `itemHierarchy.ts:127`
skips the depth check precisely for a same-parent re-attach and logs
"Attached to". Wiki §6 says any Free Card from outside attaches as last
child; this is the one Free Card that can't. The unit test at
`boardDndUtils.test.ts:236–244` says "a Free Card being dragged is never
already attached to the card it's hovering" and only exercises
`parentId: null` outsiders.

**Fix:** same-list for a `parentId` placement is "same parent *and*
currently attached": `placement.parentId === item.parentId &&
Boolean(item.isAttached)`. Widen `isIdentity`/`toRequest`'s `item`
parameter to `Pick<Item, 'workphaseId' | 'parentId' | 'isAttached'>`
(`useBoardDnd.ts:528` already passes the whole item). Add the
detached-child case to the `isIdentity` table and an E2E for it under
#3. Story 5's `origin` will eventually carry this distinction (a Stub's
origin is `{ parentId, slot: 'existing' }`, a detached child's is a
workphase placement), at which point `isIdentity` compares placement
against `origin` and the `isAttached` read goes — but that's Story 5's
change, not a reason to leave the gesture broken now.

**Status (2026-09-21):** resolved as proposed — the `isAttached` qualifier,
the `IdentitySubject` pick, the wrong-premise test replaced (a real Stub
for the identity case; detached-child cases for `isIdentity` and
`toRequest`). Two things beyond the proposal. `npm run typecheck` was
already failing at HEAD on this same function (`placement.slot.anchorId`
inside the `some` callback — a property path doesn't narrow in a closure);
`slot` is hoisted to a `const`. And the server half had no test either: the
neighbouring `items.hierarchy.test.ts` case covers only the
*already-attached* redundant re-attach, so the detached-child re-attach is
now ATT-7.6 (`docs/test-plans/item-attachment/att-7-detach-preserves-parent.md`)
with its own supertest — the server was already right (`scopeChanged` keys
on the flag flip). The E2E goes with #3. Story 5's deletion of the
`isAttached` read is recorded in `story-5-stub-detach.md` Step 4 ("Known
deletion").

### 2. The Phase 1 reservation invariant is off by the list padding for an empty sub-row `[Correctness & Security]` (cross-ref #8: the fix is one line once the two lists share a component)
**Files:** `client/src/components/BandGuides.tsx:145–165` (empty branch renders the zone *instead of* `children`); `client/src/components/WorkphaseCardList.tsx:73–76` (`p-1.5` on the droppable list); `client/src/components/BoardColumn.tsx:89–105` (merged list, unpadded); `tests/ui/drag-column-bands.spec.ts:326–363` (the invariant test — merged columns only)

For `otherCardCount === 0 && !hasActiveItemRow` the frame renders the
`h`-tall zone in place of `children`. A merged column's `children` is an
unpadded `flex flex-col gap-2`, so hovered (list + ghost) = 96 = not
hovered (zone). An expanded sub-row's `children` is the droppable list
with `p-1.5` — hovered = 96 + 12 = 108, not hovered = 96. The positional
and terminal shapes are exact because the padded list is present in both
states; only the empty sub-row (and a sub-row whose sole card is the one
being dragged, once it leaves) shifts by 12px on hover, moving every
sub-row below it. No band flips result (`bandFor` is single-band there),
so this is the layout jump Phase 1 claims to have eliminated rather than
a misresolved drop — but it's the shape the story's own "Risks" section
called the least-tried, and the E2E tripwire measures Review on the
default 1:1 board, so it can't catch it.

**Fix:** keep the padding constant across both states — render the empty
zone *inside* the padded container (or move `p-1.5` onto the frame's
`wrap` div when the list is droppable). Add an expanded-column
empty-sub-row case to the invariant test (`seedPositionedItems` + a
`POST /columns` spanning two workphases, as `drag-column-bands.spec.ts`
already does for its expanded cases).

**Status (2026-09-21):** resolved as proposed, the second option —
`CardList.tsx`'s `chromeOnFrame` puts the padded/rounded surface chrome
*and* the droppable node ref on `DragCarveFrame`'s own wrap (`BandGuides.tsx`)
instead of on the inner list div, applied uniformly in every branch
(`droppable?.className`/`droppable?.containerRef`) — so the empty-zone
label carries the identical padding the real list would. New E2E case
added (`drag-column-bands.spec.ts`, an expanded column's own empty
sub-row); confirmed failing (96 vs 108) with the fix reverted before
landing it, so the case is a real regression tripwire, not a tautology.

### 3. Story 4's headline gesture has no automated coverage at any level — the path #1 lives in is untested end to end `[Correctness & Security]`
**Files:** `client/src/components/workflow/popSession.test.ts` (no `kind: 'card'` region in any case; `client/src/test/dragFixtures.ts:22–24` says so); `client/src/components/workflow/dragRegions.test.ts` (shape only); `tests/ui/drag-column-bands.spec.ts:45`, `tests/ui/drag-target-classification.spec.ts:29`, `tests/ui/item-repositioning-cross-column-dnd.spec.ts:79`, `tests/ui/attached-children.spec.ts:191–195` (every preset sets `cardPopInDelayMs` ≥ 30 s so no test ever zooms into a Card); `docs/test-plans/board-drag-interaction/drag-4-attach-and-stub-placement.md:80–97` (all 17 cases "⏳ pending triage")

Column → Card zoom-in, `popDueAt`'s card fallback (`popSession.ts:300`),
`placementFor`'s Card branch (`:345–347`), Card → column pop-out via
`parentRegionKey` (`:213`), `useIsAttachTarget`, `AttachGhostRow`, and the
attach write itself are exercised only by hand. The story doc's own step 7
("update `drag-1`/`drag-4` test plans from 'pending triage' to real
automated/manual cases") and its "Verified by: automated reachability +
resulting-write cases once the mechanic is settled" never happened; 4.1
settled the mechanic. Not named in either roadmap doc as deferred to a
later story.

**Fix (minimum):** unit — a `cardRegion` fixture in `dragFixtures.ts` and
a `popSession.test.ts` describe for the Card layer: column-locked hover
on a valid card for `cardPopInDelayMs` zooms in; a Board-layer point over
a card never does (`childRegionAt(…, null)` excludes it); popping out of a
Card lands in its `parentRegionKey`, not Board; `placementFor` returns
`{parentId, slot: 'last'}` regardless of `over`. E2E — TC-1 (zoom in +
release → `parentId`/`isAttached` written, workphase inherited) and TC-17
(pop back out before release → the column's reposition, no attach), with
a `SUSTAINED_CARD` preset. Then hand the remaining drag-4 cases to the
test-reconciler at epic wrap-up for automated/manual triage.

**Status (2026-09-21):** deferred, whole, to **Epic 3.5 Story 10** —
`epic-3-5-roadmap.md` § Story 10 (item 2 carries this finding's content;
the Story 4 entry carries the deferral note this finding asked for, and
`drag-4-attach-and-stub-placement.md`'s header points the same way).
Reason: precise-move drag E2E is expected to flake while Stories 5–8 tune
the thresholds, so the automation catch-up is done once, after. The unit
half (`cardRegion` fixture, `popSession` Card-layer describe) isn't
threshold-sensitive but is deferred with it deliberately — Story 5 makes
the Card layer a Stub drag's intermediate stop and Story 6 adds the layer
beneath it. One correction to the framing: "zero automated coverage at
any level" overstates — the attach *write* is API-covered in
`items.hierarchy.test.ts` (TC-7.11, ATT-3.6, ATT-6.1, ATT-5.1, now
ATT-7.6); what's uncovered is the client path. The term "headline gesture"
here means the marquee feature, not the Headline representation tier.

### 4. Two circular imports — one introduced by the story-3-reconciled #2 fix `[File Responsibility]`
**Files:**
- `client/src/components/workflow/dragRegions.ts:4` (`subrowContainerId`, `DropColumn` ← `boardDndUtils`) ⟷ `client/src/components/workflow/boardDndUtils.ts:8` (`containsPoint`, `Rect` ← `dragRegions`). The second edge was added when reconciled #2 replaced `boardDndUtils`'s private `rectCenterInside` body with the shared `containsPoint` — the right consolidation, wrong direction.
- `client/src/components/KanbanCard.tsx:12` (`ACTIVE_CONTEXT_OUTLINE` ← `BandGuides`) ⟷ `client/src/components/BandGuides.tsx:7` (`SHORT_CARD_HEIGHT_PX`, `CARD_LIST_GAP_PX` ← `KanbanCard`).

Both resolve at runtime today (function declarations and module-level
`const`s consumed only inside functions — no TDZ), and `dragRegions.ts:
467–469`'s "this pure module still depends on nothing under `components/`"
is technically about the React side. But `dragRegions.ts` is the module the
whole layer is supposed to hang *off*, and a cycle means the next symbol
added to either side can break module evaluation order without a type
error to say so.

**Fix:** `DropColumn`, `buildColumnForWorkphaseMap`, and
`subrowContainerId` are region-structural (the input to
`resolveDragStructure`, the id a sub-row region resolves against) — move
them into `dragRegions.ts` next to the region-key builders, and retarget
the four importers (`boardDndUtils.ts`, `BoardColumn.tsx`,
`dragFixtures.ts`, `boardDndUtils.test.ts`). For the second: the two size
constants are card *facts*, not card *JSX* — a leaf `cardMetrics.ts`
(`SHORT_CARD_HEIGHT_PX`, `CARD_LIST_GAP_PX`, `CARD_LIST_GAP_CLASS`) that
`KanbanCard.tsx`, `BandGuides.tsx`, `WorkphaseCardList.tsx`, `BoardColumn.tsx`
and `useBoardDnd.ts` all import keeps decision 3's "card owns its metrics"
and lets `BandGuides.tsx` keep owning the drag chrome (`ACTIVE_CONTEXT_OUTLINE`)
that `KanbanCard` reads one way.

**Status (2026-09-21):** resolved as proposed, both edges. `DropColumn`,
`buildColumnForWorkphaseMap`, `subrowContainerId` moved into
`dragRegions.ts` beside the region-key builders; its own import from
`boardDndUtils.ts` is gone (`boardDndUtils.ts` never used them itself,
only defined them), and the importers (`boardDndUtils.test.ts`,
`BoardColumn.tsx`, `dragFixtures.ts`) retarget to `dragRegions.ts`.
`cardMetrics.ts` is the new leaf module; `KanbanCard.tsx`, `BandGuides.tsx`,
`CardList.tsx` (post-#7, not `WorkphaseCardList.tsx`) and `useBoardDnd.ts`
import from it, and `KanbanCard.tsx` no longer defines the constants at
all. Its own cycle with `BandGuides.tsx` breaks as a side effect —
`BandGuides.tsx` has nothing left to import from `KanbanCard.tsx` for.

### 5. Stale comments and docs the 4.1 drift sweep missed, plus a roadmap status line two days behind `[Consistency & Drift]`
**Files and fixes:**
- `client/src/components/workflow/dragRegions.ts:82–84` — `cardCount`'s doc says "a real card's height is only approximately `ghostCardHeightPx` (KanbanCard.tsx's collapsed-ghost styling narrows this but doesn't pin it exactly)". `ghostCardHeightPx` is gone and the ghost row *is* pinned. The reason the count still comes off the DOM is that the region's *other* cards aren't fixed-height, so inferring a count from `contentRect.height` would still be unreliable — say that instead.
- `client/src/components/workflow/dragRegions.ts:265–268` — `toRect`'s "(clipped, translated, frozen)" and "or `translateRect`, which used to spread its input": nothing is frozen and `translateRect` no longer exists. "(clipped, or layout-corrected by `layoutRect`)" and drop the `translateRect` clause.
- `client/src/components/workflow/useBoardDnd.ts:1–2` — the header's "composes popSession.ts, dragRegions.ts, dragClassification.ts, itemListOps.ts" omits `boardDndUtils.ts`, which supplies the collision detection and the whole release path (`:57` has it right).
- `client/src/components/workflow/useBoardDnd.ts:309–313` — "the tween composes cleanly rather than double-easing" is wrong during `popSnapMs` (see Watch List #15). Reword to what's actually true: the clamp is idempotent; the tween is applied twice for ≤`popSnapMs` and the second application wins, which is cosmetic.
- `tests/ui/item-repositioning-cross-column-dnd.spec.ts:53–61` — describes as current fact that a container-over reorder "sends only `{ scopeWorkphaseIds }` … silently failing the drop", cites `routes/items.ts:318–321`. The client no longer has `scopeWorkphaseIds` (`api/items.ts:55–60`) and the request path is `toRequest`. Either delete or reframe as pre-Phase-3 history. And `:148–151` ("no anchor, so the server appends") — 1.b passes because `closestCorners` picks card E and `resolveDropSide` says `after`; the write anchors, the outcome is the same 6.0. Say so, or the next reader will trust the wrong mechanism (Watch List #17 is the behavior question underneath).
- `tests/ui/drag-column-bands.spec.ts:659–662` — "entering while a sibling region is still resizing would freeze Review's own band math … that freeze (deliberately) never re-reads live afterward." There is no freeze; the band reads the live `contentRect` every sample. The `stableBoxOf` wait is still right (the *carve-out* has to finish reflowing before its point is read), so keep the wait and fix the reason.
- `docs/planning/epic-3-5-stories/epic-3-5-roadmap.md:264` — "**Status: planned 2026-09-17, not started.**" for Story 4.1, while `story-4-1-efficiency-refactor.md:8` says all phases implemented 2026-09-18 and this HEAD is that code. Also `:200–201` (Story 4 goal: "attaches it as a Stub *at the dropped slot*") — as built and per wiki §6 it's always last; the story doc's "As built" says so, the roadmap entry above it doesn't.

**Status (2026-09-21):** resolved, all six lines. `dragRegions.ts`'s
`cardCount`/`toRect` docs reworded to the current, accurate reasoning;
`useBoardDnd.ts`'s header now names `boardDndUtils.ts`, and the F8 tween
comment now says what Watch List #15 actually found (the clamp is
idempotent, the tween isn't, and the divergence is cosmetic and bounded
by `popSnapMs`). `item-repositioning-cross-column-dnd.spec.ts`'s two
comments reframed: the `scopeWorkphaseIds` paragraph as pre-Phase-3
history now that the shape is moot, and the `:148–151` one to name the
real mechanism (`closestCorners` picks card E, `resolveDropSide` says
`after` — an anchored write that happens to land on the same 6.0 a bare
append would). `drag-column-bands.spec.ts`'s freeze language is gone,
replaced with what's actually being waited for (a still-resizing
sibling's stale box, not a frozen band). `epic-3-5-roadmap.md`'s Story
4.1 status line now says Phases 0–4 implemented 2026-09-18, and Story 4's
goal text drops "at the dropped slot" with an "As built: always last"
line under it.

### 6. E2E drag scaffolding is spelled four times — the same finding as Story 2 #16 and Story 3 #7, now with one more copy `[Duplication & Abstraction]`
**Files:** the `addInitScript(([key, value]) => localStorage.setItem(key, value), [DRAG_TUNING_STORAGE_KEY, JSON.stringify(tuning)])` seed — `tests/ui/drag-column-bands.spec.ts:119–126` (`seedTuning`), `tests/ui/drag-target-classification.spec.ts:28–34` (`seedNoPop`), `tests/ui/item-repositioning-cross-column-dnd.spec.ts:100–103`, `tests/ui/attached-children.spec.ts:191–195`; the "no pop" presets — `drag-column-bands.spec.ts:45–55` (`NO_CARD_POP`/`MOMENTARY`/`SUSTAINED`/`POP_OUT_ONLY`), `item-repositioning-cross-column-dnd.spec.ts:79` (byte-identical to `POP_OUT_ONLY`), `drag-target-classification.spec.ts:29` (60 s variant); `awaitDragState(page, 'popped-out', tuning.popDelayMs + 2000)` — `drag-column-bands.spec.ts:137–139`, `item-repositioning-cross-column-dnd.spec.ts:81–83`, `attached-children.spec.ts:212`; `getByRole('article', { name, exact: true })` ~80 inline occurrences with a named `article()` helper defined twice (`drag-column-bands.spec.ts:145`, `item-repositioning-cross-project-dnd.spec.ts:71`); `(await request.get(`${API}/items/${id}`)).json()` ×3 (`item`/`getC`/`getItem`)

Story 5 adds a fourth clock (`descendantsPopInDelayMs`) and Story 6 a
fifth; today each is a new key in every "absurdly high" preset in four
files. **Fix:** in `tests/helpers/dragGesture.ts` (already imports the
client tuning constants): `seedDragTuning(page, override: Partial<DragTuning>):
Promise<DragTuning>`, exported presets `NO_POP` / `POP_OUT_ONLY` /
`SUSTAINED` (and #3's `SUSTAINED_CARD`), `awaitPoppedOut(page, tuning)`.
A `tests/helpers/boardLocators.ts` with `article(page, title)` /
`column(page, name)`; `fetchItem(request, id)` in `tests/helpers/seed.ts`.

**Status (2026-09-21):** resolved as proposed. `dragGesture.ts` gained
`seedDragTuning`, `NO_POP`/`POP_OUT_ONLY`/`SUSTAINED` (one `NEVER_MS`
sentinel behind all three, replacing the inconsistent 30s/60s spellings —
folds in #27's note too), and `awaitPoppedOut`; `boardLocators.ts`
(`article`/`column`) and `seed.ts::fetchItem` are new. All four named
specs, plus `item-repositioning-cross-project-dnd.spec.ts`'s own
`article`/`getItem` pair (not separately named above but the same shape),
now read the shared helpers instead of their own copies. `SUSTAINED_CARD`
stays with #3, deferred whole to Story 10.

### 7. `BoardColumn`'s merged list is `WorkphaseCardList`'s list, a third copy of what audit #21 consolidated `[Duplication & Abstraction]` (cross-ref #2)
**Files:** `client/src/components/BoardColumn.tsx:76–105, 194–206` vs `client/src/components/WorkphaseCardList.tsx:60–116`

Duplicated: the seven-prop `KanbanCard` wiring inside `<SortableContext
items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>`
inside `<div className={`flex flex-col ${CARD_LIST_GAP_CLASS}`}>`;
`hasActiveItemRow = items.some(i => i.id === session?.activeItem.id)` with
the same five-line comment (`BoardColumn.tsx:76–80`, `WorkphaseCardList.tsx:
62–68`); the `regionKey ? <DragCarveFrame …>{list}</DragCarveFrame> : list`
wrap; the drop-highlight class `bg-zinc-700/40 ring-2 ring-blue-500/30`
(`BoardColumn.tsx:174`, `WorkphaseCardList.tsx:61`). `BoardColumn.tsx:81–88`'s
comment explains why its list is self-contained, not why it's a copy.

**Fix:** a `CardList` component (in `WorkphaseCardList.tsx`, or its own
file) owning the flex/gap div, `SortableContext`, `KanbanCard` wiring, the
optional padding (#2's fix lands here once), and the carve wrap;
`WorkphaseCardList` = label header + `CardList`; `BoardColumn`'s merged
branch = `CardList`. Let `DragCarveFrame` take `items: readonly { id:
string }[]` and derive `cardCount`/`hasActiveItemRow` itself (it already
calls `useDragSession()`), so the ghost-exclusive count rule lives in one
place. Add `DROP_HIGHLIGHT_CLASS` next to `CARD_LIST_GAP_CLASS`. Story 5's
descendants section is a third `data-drag-region` list that wants this
plumbing.

**Status (2026-09-21):** resolved as proposed — `CardList.tsx` (its own
file), `WorkphaseCardList` = header + `CardList`, `BoardColumn`'s merged
branch = `CardList`, `DragCarveFrame` takes `items` and derives the two
counts itself. The region props travel as one optional `region: { key,
isTerminal, targetLabel }`. Two departures. `DROP_HIGHLIGHT_CLASS` lives in
`CardList.tsx`, not beside `CARD_LIST_GAP_CLASS`: it's list chrome, not a
card metric, and it shouldn't move to #4's `cardMetrics.ts` either. And
the last sentence is withdrawn: the descendants section is a *Stub* list
with no bands, so it is neither a `CardList` nor a `DragCarveFrame`
consumer — it registers its region the way a Card does; see
`story-6-descendants-placement.md` § "From the Story 4 audit's #7/#8
fixes". `WorkphaseCardList` keeps its name deliberately — the header is
the workphase-shaped part, and Epic 4 decisions #11 (a column expanded by
date or tag) generalizes the header, not the list; the discussion is
recorded there. The droppable padding moved unchanged, pending #2.

### 8. `kind === 'card'` is a negative proxy for "column-like" at six sites, and `placementRegion` is a verbatim copy `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:282, 288, 512, 527`, `client/src/components/workflow/popSession.ts:242, 345` (the predicate); `useBoardDnd.ts:344–348` vs `popSession.ts:341–342` (the key derivation — the hook's comment at `:339–343` says "the exact same key derivation")

Each site narrows to `ColumnLikeRegion` by excluding the one non-column
kind. With Story 5's `'descendants'` every one becomes `kind !== 'card' &&
kind !== 'descendants'` — six edits, the exact shape decision 4 was meant
to end. **Fix:** `export function isColumnLike(r: DragRegion): r is
ColumnLikeRegion { return r.kind === 'column' || r.kind === 'subrow'; }`
in `dragRegions.ts`; `placementRegion(session, regions)` exported from
`popSession.ts` and called by `placementFor`, the hook's copy deleted.
Same opportunity in `measureRegions` (`dragRegions.ts:234–256`) and
`columnLikeStructureFromKey` (`:395–423`): a shared base spread instead of
a full literal per kind, or Story 5 writes a third literal in each.

**Status (2026-09-21):** resolved as proposed, with a rename. The predicate
is `isCardList`, and `ColumnLikeRegion` / `columnLikeStructureFromKey`
became `CardListRegion` / `cardListStructureFromKey` — named for the
property every site actually tests (a flat list of Free items: bands, a
workphase to write, anchor+side) rather than for a resemblance to a
column, which invites the merged-vs-expanded misreading and says nothing
about why a Descendants region won't belong. `placementRegion` is exported
from `popSession.ts`; the hook's copy is gone. `cardListStructureFromKey`
has the shared base spread; `measureRegions` went further — a structure
entry is now `{ dom } & Omit<Region, live facts>` and a region is `{
...facts, rect, contentRect }` (plus `cardCount`/`boundsRect` for a card
list), so a new kind adds no literal there at all. Two things the
discussion added: the six sites don't all test one property — three of
them ("has a sortable container": the collision session's
`hoverContainerId`/`context`, `placementOver`, `others`) are true of
Descendants too, so "every one becomes `!== 'card' && !== 'descendants'`"
is probably wrong for those — recorded for Story 6 in
`story-6-descendants-placement.md` § "From the Story 4 audit's #7/#8
fixes"; and the hook's `regionItems` (a *positive* `kind === 'column'`
switch, not listed here) is the site Epic 4 decisions #11's group-by
touches — recorded there. `workflow/CLAUDE.md` names the predicate.

### 9. The carve-out edge formula lives in two modules with comments pointing at each other — Story 3 #5 ("band boundaries computed twice"), third audit `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/dragRegions.ts:488–492` (`bandBoundaries`: `edge = cardCount === 1 ? (h + gap) / 2 : h`; collapse on `isTerminal || cardCount === 0`) vs `client/src/components/BandGuides.tsx:145, 186–187` (`DragCarveFrame`: same collapse test; `zoneHeight = (h + gap) / 2; edge = otherCardCount === 1 ? zoneHeight : h`). `dragRegions.ts:486–487` and `BandGuides.tsx:52–55` each say they match the other.

The Phase 1 E2E tripwire checks *height* invariance, not
divider-equals-boundary, so the agreement is held by comment alone.
**Fix:** `reservationFor(region: BandRegion, metrics: ShortCardMetrics):
{ shape: 'positional' | 'empty' | 'terminal' | 'none'; zoneHeight: number;
edge: number }` in `dragRegions.ts`; `bandBoundaries` reads `.edge`,
`DragCarveFrame` reads `.shape`/`.zoneHeight`/`.edge` and drops its
arithmetic; the two "Move to {targetLabel}" single-zone divs
(`BandGuides.tsx:153–162`, `173–181`) fold into one. Pure, unit-testable,
and makes "the divider drawn is the boundary resolved" true by construction.

**Status (2026-09-21):** resolved as proposed, with a fourth shape.
`reservationFor({ isTerminal, cardCount }, metrics)` returns `{ shape,
zoneHeight, edge }`; `bandBoundaries` collapses to null whenever
`reservation.shape !== 'positional'` and otherwise reads `.edge`;
`DragCarveFrame` reads `.shape`/`.zoneHeight`/`.edge` and no longer
computes any of the three itself. `shape` is `'positional' | 'empty' |
'terminal' | 'none'`, not the three named in the proposal — `cardCount ===
0` splits into `'empty'` (not terminal) and `'none'` (terminal *and*
empty), since a done-and-empty region is conceptually a different "nothing
here" than a still-positional empty one even though both render
identically today (one zone, height `h`); `DragCarveFrame` groups them by
`shape !== 'positional'`, same as before. The two "Move to {targetLabel}"
divs fold into one `SingleZone` component, bordered for
`'empty'`/`'none'` and not for `'terminal'` (the one visual difference the
original two divs carried).

### 10. `KanbanCard.tsx` renders the pills row twice and the type pill four times `[Duplication & Abstraction]` (Stub-row half → Covered by Story 6, below)
**Files:** `client/src/components/KanbanCard.tsx:121–128` (`ShortCard`) and `:237–244` (full body) — identical eight lines; the `resolvedType && <span className={typePillClass(…)} style={typePillStyle(…)}>` pill at `:124`, `:240`, `:330`, `:394` (plus `ItemDetailPanel.tsx:258`), each preceded by its own `resolveType` call

**Fix:** `TypePill({ item, itemTypes })` beside `pillUtils.ts` (resolves
internally, null for unknown) and a `CardPillsRow` in `KanbanCard.tsx`.
The Card-body pair is untouched by Story 6 and should go now; the two Stub
rows are Story 6's (see Covered by).

**Status (2026-09-21):** resolved as proposed, in its own file rather
than beside `pillUtils.ts` — `item-detail/TypePill.tsx` (a `.tsx`, since
`pillUtils.ts` is a plain `.ts` and can't hold JSX), taking `item:
Pick<Item, 'type'>` rather than the full item. `CardPillsRow` in
`KanbanCard.tsx` wraps it with the depth pill; both `ShortCard` and the
full body call it, and the two local `resolvedType`/`depth` locals they
each computed are gone. `ItemDetailPanel.tsx:258` and the Stub-tier rows
(`AttachGhostRow`/`AttachedChildRow`) are untouched, as scoped — the
former has a deliberately different unresolved-type fallback, the latter
are Story 6's per the Covered-by note.

### 11. `advancePopSession` still carries the zoom-in sequence twice, with the gate spelled two ways `[Duplication & Abstraction]` (small)
**Files:** `client/src/components/workflow/popSession.ts:159–172` (Board) vs `:187–204` (locked): `childRegionAt → hoverFor → gate → popInDelayFor → recurse`. `hoverFor:247` sets `poppable = band === 'middle'` for column-like and leaves it `undefined` for a card; `:190` re-derives it inline (`candidate.kind === 'card' ? true : hover.band === 'middle'`). The transition call `advancePopSession({ contextKey: X, hover: null, outsideSince: null }, …)` ×3 (`:163–170`, `:192–199`, `:212–219`). `popDueAt:302` uses `tuning.popInDelayMs` directly while `:300` uses `popInDelayFor`.

**Fix:** `hoverFor` sets `poppable: true` for a card candidate (it's the
kind's rule, next to `popInDelayFor`); both branches read `hover.poppable`;
a local `transitionTo(key)` folds the three calls; `popDueAt` becomes one
expression over `hover.poppable` + `popInDelayFor`. Story 6's Descendants
layer ("reached by holding … its own panel clock") is then a row in
`hoverFor`/`popInDelayFor`, not an edit in the locked branch and
`popDueAt` both.

**Status (2026-09-21):** resolved as proposed. `hoverFor` returns
`poppable: true` for a card candidate (a card list's stays `band ===
'middle'`); both the Board-layer and locked branches of
`advancePopSession` read `hover.poppable` — the inline `candidate.kind
=== 'card' ? true : hover.band === 'middle'` gate is gone. `transitionTo`
folds the three `{ contextKey, hover: null, outsideSince: null }` +
recurse calls. `popDueAt` is one `hover.since + popInDelayFor(candidate?.kind
?? 'card', tuning)` expression, guarded by `hover?.poppable`, covering
both layers alike (the Board-layer branch no longer names
`tuning.popInDelayMs` directly — `popInDelayFor` resolves to the same
value there since the candidate is always a column/sub-row).

---

## Watch List

### 12. A re-drag of a pending item still carries the drag-start `activeItem` snapshot into release — story-3-reconciled #13, carried forward; the fix got cheaper `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:364` (snapshot), `:240`, `:402`, `:517–528` (`workphaseId`/`position`/`parentId` read from it at release); server `itemHierarchy.ts:247–253`

Same trace as before: X's Todo→InProgress write is in flight, X is re-picked
from InProgress, the response lands mid-drag (`completeItemWrite` leaves the
live ghost alone by design), release in InProgress's middle band → client
says non-member → `{workphaseId: InProgress, slot: 'existing'}` → not
identity → sends `{workphaseId: InProgress}` → server sees `workphaseChanged
= false`, appends → false inversion logged. The window is still response
latency on localhost. Phase 3 made the fix a one-liner rather than the
"effective active item" the previous audit proposed: read `latest.current.
items.find(i => i.id === activeId) ?? activeItem` at `:517–528` (and for the
mid-drag `placementFor` inputs at `:240`).

### 13. The layer-change re-sample runs exactly once; a two-hop transition in one sample leaves `regionsRef`/`pop` in mismatched scopes `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:219–245`; `client/src/components/workflow/popSession.ts:210–220`

All four single hops trace sound with the default tuning (`popDelayMs >
0`, `popDistancePx = 0`) — the Phase 2 fix does what its comment says. Two
non-default paths: with `popDistancePx > 0`, Card → column → Board can fire
in one sample (the second `advancePopSession` pops out again by distance,
recursing over column-scoped regions where the sibling column isn't
visible) — `contextKey: null`, `hover: null`, `regionsRef` still
column-scoped, no timer; a release before the next `pointermove` writes
nothing instead of the band under the cursor, and the next move
self-corrects. With `popDelayMs = 0` (the panel allows it) the recursion's
`now − now ≥ 0` pops a Card straight to Board against the old scope — a
rule 2 skip. **Fix:** loop the re-resolve/re-run until `contextKey`
stabilises (bounded by the layer depth), `startSnap` once per hop.

**Status (2026-09-21, at `fc9a22c`):** worsened, not resolved — promoted
to Fix Now as `code-quality-audit-epic-3-5-story-5.md` #2. Story 5's
third layer makes the two-hop (Descendants → Card → Column) the natural
exit under `popDistancePx`, the exact lever the Story 5 plan hands the
Product Owner for the Card-layer-stop feel check; the stranded window
now clears the ghost (X snaps back into its section) and a release in it
writes nothing. Same fix as proposed here.

### 14. A locked context whose region drops out of the sample pops to Board, not to its parent `[Correctness & Security]`
**Files:** `client/src/components/workflow/popSession.ts:183–184, 213`

If `measureRegions` yields no region for `contextKey` (the target Card's
element detached because the item was deleted or remounted; a locked
sub-row wheel-scrolled fully out of view so `clipToVisible` returns null),
`inside` is false and the pop-out target is `contextRegion?.parentRegionKey
?? null` — for a Card that's Board, skipping the column. Degenerate inputs;
the fix is to read the parent key off `structureRef` (which survives a
clipped-away rect) rather than the measured region.

**Status (2026-09-21, at `fc9a22c`):** unchanged in kind, one layer
worse in reach — a `descendants:P` context clipped out of view pops
straight to Board, skipping Card and Column both (Story 5 audit #17).
Same fix.

### 15. F8's "idempotent" claim holds for the clamp, not the snap tween `[Correctness & Security + Consistency & Drift]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:302–334`; dnd-kit 6.3.1 `core.esm.js:2959–2997, 3923–3937` (`DragOverlay` applies `modifiers` to the already-`DndContext`-modified transform)

`clampAxis(clamp(x)) === clamp(x)`, but during `popSnapMs` the first call
returns `from + (target − from)·e`; when that point is inside the new
clamp range the second call re-eases it to `from + (target − from)·e²`,
and `overlayTranslate` takes the last writer. Cosmetic (≤150 ms; the
collision rect and the drawn copy diverge slightly), and the Phase 4
hands-on gate hasn't run — check the snap feel against pre-F8 when it does.
The comment fix is in #5.

### 16. `loadBoard` unmounts the `DndContext`; a resync landing during a later drag strands the session `[Correctness & Security]` (Story 3 #16 lineage)
**Files:** `client/src/components/BoardView.tsx:105–142, 235–241`

`sendItemMove` calls `loadBoard()` on failure or `needsResync`; that flips
`loading` and unmounts the board. If the user has already begun the next
drag (a DRAG-6.5-shape stale response with reindex pairs arriving late),
dnd-kit is torn down with no `onDragEnd`/`onDragCancel`, `session` stays
non-null, and the remounted board shows the overlays and the `DragOverlay`
copy until another drag. Narrow; noted because the resync path is
newer than the previous audit's look at this.

### 17. An in-context release onto the bare container is now a no-op — a behavior change hidden inside Phase 3's "expected none" `[Correctness & Security]`
**Files:** `client/src/components/workflow/useBoardDnd.ts:511–516`; `client/src/components/workflow/popSession.ts:360–364`; `tests/ui/item-repositioning-cross-column-dnd.spec.ts:143–155`

`over` = container → `'container'` → `fallback` = `'existing'` for a
positioned item → identity → nothing sent. Pre-Phase 3 the same shape sent
`scopeWorkphaseIds` and the server appended (`itemHierarchy.ts:253`).
Consistent with §10 and decision 2 as written, but "drag to the empty
space below my column's last card, in-context" used to mean
reorder-to-end and now means nothing — and it's reachable in a tall column
where `closestCorners` does pick the container. 1.b passes today only
because the fixture column is short. A Product Owner call: either
`'container'` → `'last'` in the locked branch (restoring the old
meaning through the new path), or the wiki's §1.1 rule 1 gains a sentence
saying a bare-container release is a no-op.

**Status (2026-09-21, at `fc9a22c`):** still open for Cards. Story 5
gives the same release a different answer for a Stub: a bare-container
release at column layer is a detach-to-end (`noAnchorSlot` → `'last'`,
decision 5), so the codebase now carries a precedent for "container =
append" that the Product Owner's call can lean on either way.

### 18. `useBoardDnd.ts` (575 lines) still owns pure geometry its own header disclaims `[File Responsibility]` (Story 3 #3 / reconciled #10 lineage)
**Files:** `client/src/components/workflow/useBoardDnd.ts:548–574` (`clampToCurrentContext`/`clampAxis` — pure over `(transform, rect, pop, regions)`, no React or dnd-kit runtime); `:502–516` (the `placementOver` derivation, inline in the event handler, while its type `PlacementOver` and its sibling `placementFor` are pure and unit-tested in `popSession.ts`)

**Fix:** the clamp math to `dragRegions.ts` (which owns `Rect`/`containsPoint`)
with a unit table; `resolvePlacementOver(region, over, side)` in
`popSession.ts`. The `useCallback` wrapper that reads refs and tweens stays.
The rest of the hook's growth (the `origin`/`priorPlacement`/`wantedPlacementRef`
guard, three teardown sequences at `:437–439`, `:447–449`, `:260–267`, three
`placementFor` call spellings at `:240`, `:404`, `:518–525`) is the
`usePendingGhostGuard` / `endSession()` shape reconciled #10 proposed —
do it alongside Story 5, which deletes the `attached-child` branch of
`handleDragEnd`.

**Status (2026-09-21, at `fc9a22c`):** not done; the hook grew 575 → 663
lines. Story 5 deleted the `attached-child` branch as planned but added
`containingCardIdOf`, the Stub start branch, `siblingScopeParentId`/
`siblingItems`, and a third inline `placementOver` branch; none of
`usePendingGhostGuard`/`endSession`/`resolvePlacementOver` exists and the
clamp math is still local. Escalated as Story 5 audit #19, with #8/#9/#10
there as the concrete first cuts; do before Story 6 Phase C adds
per-sample projection state to the same hook.

**Status (2026-09-24, Story 6.1):** resolved through Story 5 audit #19,
in Story 6.1 Phase 2 (C-1). The clamp math is in `dragOverlayGeometry.ts`
(an overlay concern, so not `dragRegions.ts`), `resolvePlacementOver` is
in `placement.ts` beside `placementFor`, and `usePendingGhostGuard` and
`endSession()` exist. The clamp math's unit table is
`dragOverlayGeometry.test.ts`.

### 19. `KanbanCard.tsx` (417 lines) now hosts the Card tier and the Stub tier `[File Responsibility]` (cross-ref #4, #10)
**File:** `client/src/components/KanbanCard.tsx:27–86` (shared drop-target chrome: `useLiveDropSide`, `useDropTargetProps`, `DropSideIndicator`, `dropTargetClass`), `:116–135` (`ShortCard` — honors decision 3 in isolation), `:325–337` (`AttachGhostRow`), `:339–417` (`AttachedChildRow`, its own `useSortable`/`SortableContext`, `data.type: 'attached-child'`)

A Stub's row is a different representation tier from the board's Card
(`naming_conventions`), and Stories 5 and 6 both grow it (a Stub-started
drag; the flat DFS list with per-row indent). **Natural split, before those
land:** `KanbanCard.tsx` keeps the Card tier (default export + `ShortCard`);
`StubRow.tsx` takes `AttachedChildRow`/`AttachGhostRow`; the chrome hooks
to a small shared module both import — which also removes #4's
`ACTIVE_CONTEXT_OUTLINE` cross-import if `cardMetrics.ts` isn't taken.

**Status (2026-09-21, at `fc9a22c`):** not done before Story 5, and the
timing is revised rather than the finding: Story 5's changes to the file
(decision 4 on both rows, decision 7's `attachGhostId`, the `descendants:`
attribute on the section wrapper) are additive within the existing tiers,
and Story 6 Phase B rewrites both Stub rows into a flat DFS list — an
extraction now would be re-extracted in a different shape next story.
Recorded as Covered by Story 6 in the Story 5 audit.

**Status (2026-09-24, Story 6.1):** resolved in Story 6.1 Phase 1 (C-5),
after Story 6 Phase B settled the Stub rows. `KanbanCard.tsx` keeps the
Card tier; `StubRows.tsx` takes `StubBody`, `AttachGhostRow` and
`AttachedChildRow`; `dragChrome.tsx` takes the chrome both tiers share
(`useDropTargetProps`, `DropSideIndicator`, `ZoomCue`, the cue classes).

### 20. `boardDndUtils.ts` — "Utils" now covers five things `[File Responsibility]` (Story 3 #4 lineage)
**File:** `client/src/components/workflow/boardDndUtils.ts` (262 lines): collision policy (`:58–88`), column-shape data (`:90–112` — moves in #4), drop-side geometry (`:138–148`), the placement→request adapter (`:163–227` — what the header describes), and an async dispatcher with a `console.error` and tracker orchestration (`:243–261`)

Once #4 moves the column cluster out, what's left is two concepts. Not
urgent; a rename or a `dragCollision.ts` / keep-`boardDndUtils.ts`-for-the-
adapter split next time the file is touched.

**Status (2026-09-21, at `fc9a22c`):** the condition was met (Story 5
changed 163 lines here — `siblingScopeParentId`, `origin` on
`isIdentity`/`toRequest`) and the split didn't happen. Carried as Story 5
audit #21 with the same seam; the header still names only the adapter.

**Status (2026-09-24, Story 6.1):** resolved through Story 5 audit #21,
in Story 6.1 Phase 1 (C-3): `boardDndUtils.ts` split into
`dragCollision.ts` and `dragRequest.ts`.

### 21. `tests/ui/drag-column-bands.spec.ts` (797 lines) spans three test-plan catalogs `[File Responsibility]`
**File:** header cites `drag-1`, `drag-3`, *and* `drag-6`; the second `describe` (`:715–797`, DRAG-6.1/6.2/6.5) uses route-delay mocking and none of the carve-out helpers (`:172–261`) the rest of the file is built on. A `drag-preview-reconciliation.spec.ts` for the DRAG-6.x block would match the folder-aligned catalog; the DRAG-1.x cases interleaved through the first block are pop-through setup for DRAG-3.x and can stay.

### 22. Column facts derived in three places `[Duplication & Abstraction]`
**Files:** `client/src/components/workflow/dragRegions.ts:394–421` (`covered`, `isTerminal` from `subRows[0]`), `client/src/components/BoardColumn.tsx:63–71` (same two), `client/src/components/workflow/useBoardDnd.ts:353–358` (`regionItems` re-selects the list the column already rendered). `isIdentity` compares against `others = regionItems(region)` minus the item, so the hook's list and `BoardColumn`'s rendered list agree by convention. A `columnFacts(column)` beside `DropColumn` (post-#4, in `dragRegions.ts`) leaves one derivation. Low drift risk until Epic 7 rescopes `Column`.

**Status (2026-09-21, at `fc9a22c`):** now four — Story 5's `siblingItems`
(`useBoardDnd.ts:410–412`) is a fourth "rows this region renders" beside
`regionItems`. Carried as Story 5 audit #24; leave until Story 6's
all-rows change, don't add a fifth.

**Status (2026-09-24, Story 6.1):** through Story 5 audit #24, Story
6.1 made the Descendants rows one walk (Phase 2, C-6a). The column facts
this finding names are deferred to Epic 4 (C-6b), which reshapes them.

### 23. `session.pop != null` doubles as "this is a Card drag" at two sites `[Duplication & Abstraction]` (one site Covered by Story 5, below)
**Files:** `client/src/components/KanbanCard.tsx:177` (`attachGhostId` — Story 5's plan names it); `client/src/components/BoardColumn.tsx:211` ("Drop cards here" guard, whose comment relies on "a Stub drag never reaches the pop machine"). Elsewhere (`useBoardDnd.ts:216, 252, 418`, `BandGuides.tsx:127`) `pop` means "machine running". Story 5 makes `pop` non-null for every item drag, inverting the first two. A `useIsCardDrag()` reading `session.origin` makes that a one-line flip; `BoardColumn.tsx:211` isn't in Story 5's plan — verify against the roadmap.

**Status (2026-09-21, at `fc9a22c`):** site 1 resolved — `KanbanCard.tsx:
189–193` now reads `origin` (decision 7), exactly the flip predicted. Site
2 (`BoardColumn.tsx:181`, now `!session?.pop`) is vacuous rather than
wrong: `pop` is non-optional, so the guard equals `!session` and the
"Drop cards here" fallback hides during a Stub drag as it does during a
Card drag, which is right — the carve takes over for both. Its comment
("a Stub drag never reaches the pop machine") is false; Story 5 audit #5
has the one-line simplification.

---

## Covered by Story N (Epic 3.5)

- **Stub-row content duplication** — `KanbanCard.tsx:325–337` (`AttachGhostRow`) vs `:339–417` (`AttachedChildRow`): type pill + `truncate text-xs text-zinc-300` title, the `space-y-1 border-l border-zinc-700/50 pl-3` guide at `:286`/`:401`. **Story 6** decision 1 reworks both rows (flat DFS, per-row indent, `border-l` guides removed). Leave for it; #10 takes only the Card-body pair.
- **`KanbanCard.tsx:177` pop-presence guard** — **Story 5** (its plan, and 4.1's F3 "Story 5 landmine") names it: the test becomes "the placement puts the active item under this parent *and* its `origin` didn't."
- **`isIdentity` comparing against `origin`** — **Story 5** sets a Stub's `origin`; #1's `isAttached` read is the interim.

---

## Informational

### 24. `origin.workphaseId` is present-but-`undefined` for an Unsorted item
`useBoardDnd.ts:402` — `{ workphaseId: activeItem.workphaseId ?? undefined, slot: 'existing' }`. Story 5 must not test it with `'workphaseId' in origin` the way `'parentId' in placement` is tested (`boardDndUtils.ts:195`, `:219`).

**Status (2026-09-21, at `fc9a22c`):** resolved by absence — Story 5's
`isIdentity` compares `workphaseId` by value (`boardDndUtils.ts:204`,
`??`/`===`), and no `'workphaseId' in origin` exists anywhere in
`client/src`; the Unsorted origin behaves identically to the old `null`
comparison.

### 25. Anchoring against an item drawn by a pending placement whose DB row is still `position: null`
Just dragged out of Done, write in flight, then anchored beside → server 400 "anchorId has no position" → `sendItemMove` logs, `fail`s, resyncs. The failure path is covered; the 400 is reachable.

### 26. Decision 2 is deliberately not implemented for a real anchor
`boardDndUtils.ts:185–188` — a `{anchorId, side}` that happens to describe the item's current neighbor still writes (a harmless re-resolve). The comment says so; the story doc's decision 2 text ("a Card released back into its own slot") reads broader than what shipped.

### 27. Small repeats to fold when nearby code moves
- `CARD_LIST_GAP_PX = 8` and `CARD_LIST_GAP_CLASS = 'gap-2'` (`KanbanCard.tsx:113–114`) — two constants with no link; `gap-[8px]` or a tying comment (moves with #4's `cardMetrics.ts`).
- Drop-indicator line ×3: `KanbanCard.tsx:56–58` (`-top-1`/`-bottom-1`) and `sidebar/SortableProjectRow.tsx:94` (`-top-px`) share eight classes. Story 6 keeps them as different previews (decision 4), so cosmetic only.
- `dragFixtures.ts::region` infers `kind` from the key prefix (a second copy of the key grammar) and there's no `cardRegion` fixture — #3 adds one; Story 5's `'descendants'` needs a row there too.
- `verticalDistance` + its inline horizontal twin (`dragRegions.ts:457–461` vs `:510`) — story-3-reconciled #22, unchanged.
- The `cardPopInDelayMs: 30_000` "absurdly high" sentinel — a numeric ceiling standing in for a disable; folds into #6's presets.

**Status (2026-09-24, Story 6.1):** the `verticalDistance` bullet only.
It folded into `dragBands.ts::distanceOutside` in Story 6.1 Phase 1
(C-4). The other bullets weren't in Story 6.1's scope.

### 28. Sidebar vs board — sizing for Story 6
No board-side counterpart to `projectTreeUtils.ts::computeProjection` / `findPrevSibling` / `findNextSibling` / `INDENT_WIDTH` exists; `ProjectSidebar.tsx:106–138` sends `(id, parentId, prevSiblingId, nextSiblingId)` rather than `toRequest`'s shape. Story 6's consolidation is a lift-and-adapt (one source), not a de-duplication. Only overlaps today: the drop-line classes above and the `isDragging ? {} : transform` sortable idiom (`SortableProjectRow.tsx:51–56` vs `KanbanCard.tsx:187–191`, which differ deliberately).

### 29. Do-not-unify pairs, confirmed
`tests/helpers/dragGesture.ts::boxOf` vs `dragRegions.ts::layoutRect` — same idea (subtract sortable transforms) but `boxOf` runs inside `locator.evaluate` in the page and can't import the client function. `AttachGhostRow`'s chrome vs `AttachedChildRow`'s — different lifecycle, documented at `KanbanCard.tsx:318–324`. The clamp modifier — one `useCallback` in one memoized array passed to both contexts, not a copy. `findVerticalScrollAncestor` vs dnd-kit's `getScrollableAncestors` — still the `overflow-x-auto` quirk (reconciled #23). `ShortCardMetrics` literals in the two unit suites (`96/8`, `40/8`) — test-chosen values, not copies. `popSession.test.ts`'s `locked()`/`poppedOut()`, `dragRegions.test.ts`'s DOM builders, `boardDndUtils.test.ts::collisionArgs` — single-suite.

### 30. Positive confirmations `[all passes]`
- **`toRequest` × server contract** — attach sends `{parentId, isAttached: true}` with no `workphaseId` (never trips `crossWorkflowMoveError`; workphase derived from the parent); `workphaseId + anchor` accepted, anchor scope workflow-wide; terminal regions never produce an anchor at either layer; Unsorted (null workphase/position) → `'last'` → anchor or bare workphase move; covered-set member omits `workphaseId`; `'first'`/`'last'` with empty `others` → bare workphase move.
- **`Placement.parentId` presence semantics** — consistent across `renderedParentId`/`renderedIsStub`/`computeChildCounts`/`freeItemOrder`/`selectBoardItems`/`getAttachedChildrenFrom`; column placements never carry the key; the tripwire excludes a previewed-attach item from both sides.
- **Reservation math** — exact for positional (n≥1), empty merged, and terminal-with-cards on both lists (#2 is the one exception); divider offsets match `bandBoundaries`; `data-drag-card-count` is ghost-exclusive and hover-invariant; `hasActiveItemRow` correctly covers the "resting unclaimed in its origin" case.
- **Timer/ref lifecycle** — single timer cleared on end/cancel/unmount; `evaluateRef` refreshed every render; reassertion effect compares by reference; `restorePriorPlacement` restores only while `isPending`; `writes.begin` replaces the ghost with the exact pending object so `complete` clears by identity (reconciled #1's fix holds through the refactor).
- **Collision policy** — a Card context yields no `over` (decision 5); attached-child rows excluded from Card drags; foreign cards excluded by rect-centre containment; a Board hover forces the container.
- **Measurement** — `layoutRect` subtracts the sortable transform only for cards; `clipToVisible` vertical-only; `boundsRect` is the scroll ancestor for merged columns and undefined for sub-rows/cards; `findVerticalScrollAncestor` bounded by the board root; `resolveDragStructure` runs once per drag and per layer change, not per sample (reconciled #20 resolved).
- **Story 4.1's own "drift to fix" list** — all eight items verified done in wiki §1/§1.1/§2/§3/§3.1/§5/§5a, `dragRegions.ts`'s header, `popSession.ts`'s `PopHover`, and `workflow/CLAUDE.md`.
- **Tuning surface** — `DragTuning`, `DragTuningPanel`'s field descriptors, wiki §3.1, and the E2E seeds agree on the same eight keys. `MoveItemInput` (client) matches what the server route destructures; `scopeWorkphaseIds` is gone client-side and kept server-side for the legacy wire shape only.
- **`data-*` attributes** — every writer has a reader and vice versa (`drag-state`, `drag-context`, `drag-band`, `drop-state`, `drag-region`, `drag-card-count`, `item-id`, `drag-overlay`, `pending`, `carve-zone`, `carve-divider`, `inversion-count`, `active-context`).
- **Test-ID cross-references** — `DRAG-3.x`, `TC-7.x` spot-checks resolve to real, correctly-numbered cases. Header comments from `abb9b59` — 15 spot-checked, one omission (#5).
- **Failure paths** — `sendItemMove` logs, fails the tracker, resyncs; `loadBoard` catches its own rejection; `apiRequest` surfaces the server's `{error}`; column-reorder failure logs and resyncs. No raw SQL touched; `ENABLE_TEST_ROUTES` still strict `=== 'true'`.
- **E2E hygiene** — no `boundingBox()` reads; geometry via `boxOf`/helpers; region keys imported from `dragRegions.ts`; waits are reachability-style; the one `waitForTimeout(3000)` (DRAG-6.5) is a "nothing changes" hold.
- **Naming** — `shortCard` is a Card mode throughout, never a tier; `attachToCardId` is read only as payload; `contentRect`/`rect`/`boundsRect` each used for their documented purpose; `origin` vs `priorPlacement` kept distinct. No `TODO`/`FIXME` in scope; no dead exports among those checked. `popSession.ts`, `itemListOps.ts`, `dragRegions.ts`, `DragSessionContext.ts`, `dragTuning.ts`, `useItemManagement.ts`, `BoardView.tsx`, `DragTuningPanel.tsx`, `api/items.ts`, `dragGesture.ts`, `BandGuides.tsx` — each judged single-concept by the file-responsibility pass.

---

## Story-3-reconciled Watch List — status at `ae06121`

| # | Item | Status |
|---|---|---|
| 9 | Write outstanding bookkept in two structures | Open, unchanged (`inFlight` set + `placements` map; `isPending` reads the set) |
| 10 | `useBoardDnd` fifth mechanism (ghost guard) | Open; shape changed — the reassert effect is a safety net after reconciled #1, and `origin` joined `priorPlacement` → **new #18** |
| 11 | Frozen rect for a sub-row is its clipped slice | **Superseded** — Phase 1 deleted the freeze; `contentRect` (unclipped, bands) / `rect` (clipped, hit-test) is the proposed split, names swapped |
| 12 | Scroll-follow only on pointer samples | **Reduced** — no frozen rect to go stale, and the carve-out is layout-anchored; but `evaluatePop` still runs only on `pointermove`/timer, so a release after a stationary auto-scroll reads `regionsRef` from the last sample. Open, smaller |
| 13 | Re-drag carries the raw `activeItem` | **Open** → **new #12** (fix now a one-liner) |
| 14 | `dragRegions.ts` DOM/geometry seam | **Re-evaluated** — Phase 2 split structure (`resolveDragStructure`) from measurement (`measureRegions`) inside the file; the file-responsibility pass now judges it cohesive as "region geometry". Not carried forward |
| 15 | Write tracker its own concept in `useItemManagement` | Open, unchanged (175 lines; judged fine by the file-responsibility pass) |
| 16 | Done → done preview uses old `completedAt` | Open, unchanged (`placementFor:359`, `:377` — terminal → `'existing'` unconditionally) |
| 17 | `replaceItems` drops pending markers, `inFlight` untouched | Open, unchanged (`useItemManagement.ts:65–66`) |
| 18 | Test-plan catalog "code pending" labels | Not re-checked here — test-reconciler's job at epic wrap-up (with #3's drag-4 triage) |
| 19 | Reassert effect residual cost | Informational, unchanged |
| 20 | `findVerticalScrollAncestor` per-sample | **Resolved** — Phase 2: once per drag and per layer change (`resolveDragStructure:197`) |
| 21 | `sendItemMove` arrange block ×4; tracker untested | Open, unchanged |
| 22 | `verticalDistance` + inline twin; `applied` unread | Open, unchanged (`dragRegions.ts:457–461`, `:510`) |
