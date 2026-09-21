# Epic 3.5 — Story Roadmap: Drag-and-Drop Attach/Detach Gesture

High-level story separation for Epic 3.5. Each story below is a discrete piece
of work that can carry its own test plan with testable cases. **Implementation
detail deliberately lives outside this file** — each story gets its own plan
under this folder when it's picked up.

Source material:
- Design doc: "Card Drag and Drop" (Google Docs, 2026-09-10)
- Decisions + vocabulary: `docs/planning/epic-3-5-decisions.md`
- Epic entry: `docs/planning/mvp-roadmap.md` § Epic 3.5

---

## Settled ground rules

These were resolved before story separation and apply across every story. Full
rationale in `epic-3-5-decisions.md`.

- **Vocabulary:** an item renders as a **Stub** (nested in a Card), a **Card**
  (board's draggable unit), or a **Sheet** (full detail). *Headline* is the
  Inbox list form; *Dossier* is deferred, post-MVP.
- **One gesture, one call:** reparent + attach + workphase + position resolve
  atomically through `PATCH /items/:id/move`, not a PUT/PATCH pair.
- **Cross-project reparenting is allowed** on a board and cascades `projectId`
  to all descendants (detached ones included). Because a board is scoped to
  one workflow, any cross-project drag on a board is between projects already
  sharing that workflow — so workphases stay valid and no cross-workflow case
  arises from the gesture. The API nonetheless *accepts* a cross-workflow
  reparent (Sheet/MCP can produce one): the subtree's workphases are left
  as-is and the items surface in "Unknown status" until re-filed. Epic 7's
  Sheet-level "move to project" adds the remapping UI on top.
- **Attached children keep Epic 3.2's model unchanged** — they never receive
  `completedAt` and always keep their position. Reparenting onto a done Card
  already works; a Stub under a done parent reads as done by deriving it from
  the inherited terminal workphase, storing nothing new.
- **Done columns accept attach-drops and card-drops, but not positioned
  inserts** — free done items have `position = null`, so they can't serve as
  anchors. A done Card's Stubs *are* anchorable.
- **Depth cap:** a target at depth `D` is a valid parent only if
  `D + 1 + draggedSubtreeHeight <= cap`, with root items at depth 1 and the
  subtree counting detached descendants. Strict — the formula is the whole
  rule, no direction-aware exception for already-over-cap subtrees. Enforced
  at the UI and at every parent-giving API write; never in the schema.
- **Invalid targets are never poppable** — the UI must not allow popping into
  a context that would fail on drop.
- **No Zod in this epic.** Request validation stays hand-rolled the way the
  existing routes do it. Zod lands in Epic 4 (see
  `docs/planning/epic-4-decisions.md`) and will pick up the move endpoints
  then — Story 1 should not adopt it early.

---

## Stories

### Story 1 — Server: atomic reparent-with-placement ✅ (done 2026-09-11)
**Plan / record:** [`story-1-server-reparent-with-placement.md`](story-1-server-reparent-with-placement.md)

**Goal:** `PATCH /items/:id/move` accepts parent and attachment changes
alongside workphase and placement, so one gesture commits in one transaction.
Adds first-in-list placement, the `projectId` cascade, the depth-cap guard, and
lifts the same-project restriction.

Also folds in the **test-helper extraction** (`tests/helpers/dragGesture.ts`),
so every story after this writes drag E2E against a shared helper rather than
adding a fourth and fifth hand-rolled copy — see `epic-3-5-decisions.md` Q2.

**Also in scope** (added 2026-09-10/11 while resolving the items below):
- **Depth cap on every parent-giving write** — `POST /items`, `PUT
  /items/:id`, and the move endpoint share one guard; the same-project
  restriction is lifted at `PUT` too (`wiki/item-attachment/` §7).
- **Cross-workflow reparent is accepted at the API**, not rejected — the
  item lands in the target project with its subtree's `workphaseId`s
  untouched, and surfaces in Unsorted → "Unknown status" on that project's
  board (§9). Needs a test that reparents into a different-workflow project
  and reads the board to find the item there. Corollary: every subtree item
  that keeps its own workphase has its position nulled — it no longer
  compares against anything (`wiki/item-positioning/` §7.3).
- **Free-item reparent is supported at the API** (§4): `parentId` and
  `isAttached` are independent; omitting the flag keeps the item's current
  state. Story 9 is only about whether the *gesture* offers it.
- **`parentId: null` on move = reparent to root** (§11) — clears the flag
  too, per §1's invariant; workphase unchanged.
- **Reindex disclosure** — the `{id, position}[]` response collection from
  `wiki/item-positioning/` §5. Server half only; the client half is Story 2.
- **Activity log on hierarchy changes** (§11a), at every entry point.

**Depends on:** nothing. **Unblocks:** Stories 4, 5, 6.
**Verified by:** API tests alone — no UI required.

**Resolved** (flagged by test planning 2026-09-10; decided 2026-09-10 — see
`docs/test-plans/item-attachment/INDEX.md`):
- **Depth cap for an already-over-cap subtree → strict.** The formula
  `D + 1 + h <= CAP` is the whole rule; no direction-aware exception. The
  "only a gesture that would *increase* depth" sentence is gone from §8.
  Story 2's classification uses the same single formula.
- **Detached descendants count** toward `draggedSubtreeHeight` and follow
  the `projectId` cascade — now stated in §8 and §9.
- **A parentless "attach" request is rejected** (400), and clearing
  `parentId` clears the flag — §1.
- **An anchor outside the resulting scope is rejected** (400, nothing
  commits) — `wiki/item-positioning/` §7.1.

---

### Story 2 — Drop-target validity + relationship overlays ✅ (done 2026-09-11)
**Plan / record:** [`story-2-drop-target-classification.md`](story-2-drop-target-classification.md)

**Goal:** decide, at drag start, what every visible target *is* for the item
currently being carried — valid, cycle-forming, depth-capped, or inert — and
show it. Free descendants get the green relationship overlay; depth-capped
targets get the grey one. Replaces the current blanket exclusion of Stubs from
Card drags with these rules.

**Also in scope** (added 2026-09-11): the **client half of reindex
disclosure** — reading Story 1's `{id, position}[]` collection off a move
response and applying it in `wiki/item-positioning/` §5a's order (apply
pairs → assign the written item → check inversions → re-sort only if one
was found). Lands here rather than Story 3 to keep the highest-risk story
from growing.

**Depends on:** Story 1 (depth rules, reindex shape). **Unblocks:** Stories 3-6.
**Verified by:** pick up a Card, assert which targets render green / grey /
inert — no drop needed.

**Resolved** (flagged by test planning 2026-09-10; decided 2026-09-11 —
see the story plan's decisions):
- **What is Inert → named in `wiki/board-drag-interaction/` §4.** For a
  Card drag: the Unsorted bucket, a broken column, an expanded column's
  outer wrapper. For a Stub drag, until Story 5: everything outside its
  own parent's Stub list.
- **Strict depth-cap formula** — `isWithinDepthCap` is the one-line rule,
  fed by the cap the board response carries (`itemDepthCap`); no
  direction-aware clause.
- **Scope note:** classification is computed and shown, but no drop
  *outcome* changed — Stubs stay out of collision for Card drags until
  Stories 4/6 give that drop a meaning. The §5a inversion tripwire moved to
  Story 3, where the ordinal preview gives it something to compare against.

---

### Story 3 — Pop state machine + Card→Column drop bands ✅ (done 2026-09-11)
**Plan / record:** [`story-3-pop-state-machine-column-bands.md`](story-3-pop-state-machine-column-bands.md)

**Goal:** the core interaction model. Cards stay locked to their context until
the cursor pulls them out, then pop and follow freely. Includes the
configurable dev/test panel for thresholds and overlay colors, and the column
drop bands (commit-before-first / commit-after-last / pop-eligible middle) as
the first gesture riding on it.

Merged deliberately: pop *feel* can't be evaluated without a gesture exercising
it, and column drops are the simplest one.

**Also in scope** (added 2026-09-11 while planning): the **ordinal preview +
pending marker** of `wiki/board-drag-interaction/` §10, the **inversion
tripwire** of `wiki/item-positioning/` §5a (deferred here from Story 2),
**per-item response sequencing** (DRAG-6.5), and **expanded sub-rows as
contexts** (§1) — the open item below.

**Highest-risk story.** Axis-lock toggling mid-drag isn't native to dnd-kit's
declarative modifiers — resolved with a `DragOverlay` modifier that reads the
machine's state through a ref (the overlay is clamped; `DndContext` gets no
modifier, so the collision rect stays raw).

**Depends on:** Story 2.
**Verified by:** automated state-transition cases; **feel is manual**, per the
coverage split in `epic-3-5-decisions.md` Q1.

**Resolved** (flagged by test planning 2026-09-10; decided 2026-09-11 —
see the story plan's decisions):
- **§10's closing "may briefly show its pre-drop order" paragraph was a
  stale carry-over — deleted.** The placement is set synchronously on
  release, so there is no transient; DRAG-6.1's ordinal-preview statement
  is the behavior.
- **A band is measured against the region's rect as it was on entry**
  (recorded in §5) — the ghost's own insertion moves an expanded column's
  sub-rows, and a live measurement let the drop change its own band.
- **Popping is two-way** (§3 amended after the hands-on rounds): the
  cursor outside the context past `popDelayMs` pops the card *out* — it
  follows the cursor, belonging to nothing — and resting in any column's
  middle band past `popInDelayMs` pops it *in* and locks it there, the
  column it just left included.

**Addendum (2026-09-16) — column-band geometry reworked, hands-on with the
Product Owner.** §5's drop bands were rebuilt from a percentage-of-the-
rendered-slice model to pixel carve-outs anchored to real content, with
Board-layer space reservation (`ghostCardHeightPx`), and both visible
copies of a dragged card were collapsed to a fixed shape (§5a). Recorded in
full in [`story-3-pop-state-machine-column-bands.md`](story-3-pop-state-machine-column-bands.md)'s
own addendum section rather than as a new story — same subject Story 3
already owns, not new capability. Kept here rather than folded into Story
8: Story 8 is unrelated (§4's relationship-overlay palette/animation, not
started).

---

### Story 4 — Card → Card = attach ✅ (done 2026-09-16)
**Plan / record:** [`story-4-card-to-card-attach.md`](story-4-card-to-card-attach.md)

**Goal:** the headline gesture. Dropping a Card onto another Card attaches it
as a Stub, inheriting the parent's workphase. Covers the cross-project case
and attaching to a done parent. Must not regress in-column reposition, which
already works (Story 3) and is the baseline every attach mechanic has to
coexist with.

**As built:** always as the *last* Stub, never at the dropped slot — manual
anchor+side placement among Stubs is Story 6's, not this story's (wiki §6;
audit `code-quality-audit-epic-3-5-story-4.md` #5 flagged this line as still
describing the pre-build intent).

**Depends on:** Stories 1-3.

**Built hands-on with the Product Owner (2026-09-16)**, same trial-and-error
process as Story 3's popping model. The four open decisions the plan
doc named are all resolved — see its own "As built" section for the detail
— and the board is now a strict three-layer stack (Board → Column/sub-row
→ Card), a genuine rule change from Story 3's flatter model, not just this
story's build catching up to a rule already on the page. Wiki §1.1, §2, §3,
§3.1 and §6 all carry the result.

Also swept up (2026-09-16), same session: §5's column-band geometry rework
— see Story 3's addendum above; recorded against Story 3 since it's a
rework of Story 3's own subject, not new capability.

Not in scope, still closed: §7's Descendants-layer placement inside a
hierarchy (Story 6), and dragging an already-attached Stub at all
(Story 5).

**Automation deferred (recorded 2026-09-21):** the attach gesture has no
client-side automated coverage — `docs/audits/code-quality-audit-epic-3-5-story-4.md`
#3. Deliberately deferred to **Story 10** rather than fixed here, so the
E2E is written once against settled thresholds instead of chased through
Stories 5–8's tuning. The write itself is covered at the API
(`server/tests/routes/items.hierarchy.test.ts`); the pure-function half of
the audit's #1 fix (`isIdentity`, `toRequest`) is covered in
`boardDndUtils.test.ts`.

---

### Story 4.1 — Drag-layer efficiency refactor (vestige removal)
**Plan / record:** [`story-4-1-efficiency-refactor.md`](story-4-1-efficiency-refactor.md)
· anchor: [`story-4-1-anchor-draft.md`](story-4-1-anchor-draft.md)
· comparison: [`story-4-1-comparison.md`](story-4-1-comparison.md)

**Goal:** no rule changes. Stories 3 and 4 were built hands-on while the
rules changed several times; this story removes what the iteration left
behind so the code reads as if §1.1's four-layer stack had been the spec
from the start — *before* Stories 5/6 build on the current shape. Found by
drafting a clean-slate framework from the settled rules first (Stories
5/6's included), then comparing the code against it and sorting every
difference into vestige / draft-was-naive / judgment call.

Four phases, each green on every existing suite before the next: **(0)** a
`kind` discriminant and a universal `parentRegionKey` replace the
key-prefix / `attachToCardId` branching at ~12 sites; **(1)** both drag
copies become **shortCard** — the Card's fixed-height compact mode — and
the reservation derives from its height plus the list gap, so §5's "net
height never changes" is exact, retiring the frozen-rect family
(`PopHover.rect`/`cardCount`/`scrollTop`, `followRegionTop`, the
sticky-hover block) and `ghostCardHeightPx` as a panel value; **(2)** per-layer
measurement with structure resolved once per drag; **(3)** the release
derived from a placement through one `toRequest` + `isIdentity`, retiring
`ReleaseIntent`/`DropResolution`/`resolveDropTarget`/`bandDropResolution`/
`pendingPlacementFor`. A fourth phase is test-first: the raw collision
rect, and the merged-column x-only clamp (which needs a §1/§2 ruling).

Kept deliberately: dnd-kit sortable as the in-context renderer — the
sidebar's `computeProjection` is already §7.1 in the sortable world, and
Story 6 consolidates with it. The draft's proposal to drop it was the one
place it was naive to a real constraint.

**Depends on:** Story 4. **Unblocks:** Stories 5, 6 — each becomes "add a
row" rather than "add a branch in twelve places."
**Verified by:** the existing unit + E2E drag suites staying green through
every phase; one new E2E case (the reservation invariant); hands-on for the
pinned ghost and the Phase 4 items.

**Status: Phases 0–4 implemented 2026-09-18** — see the plan doc's own
"As built" section for the per-phase detail and the two hands-on
Product-Owner feel-checks (Phase 1's shortCard/carve-out, Phase 4's
merged-column pop-out/exit-clock) left open there.

---

### Story 5 — Stub → out = detach
**Plan / record:** [`story-5-stub-detach.md`](story-5-stub-detach.md)
(planned 2026-09-17; its seven planning decisions ratified by the Product
Owner 2026-09-21 — 1/3/5/6 as rules, now in the wiki; 2/4/7 left to the
Architect; **built 2026-09-21**, same day, against the post-4.1 code — see
the plan doc's own "As built" section)

**Goal:** the reverse direction. A Stub can be dragged out of its parent Card,
becoming Free and landing where dropped, while keeping its parent relationship.
Unblocks the drag-out path — as built, no longer held closed in `useBoardDnd`.

**Rules settled 2026-09-17** (Product Owner, with the test planner; wiki
§1, §1.1, §6, §8 carry them — see "Decisions of 2026-09-17" below for the
alternatives weighed):
- A Stub's drag **starts at its containing Card's Descendants layer**
  (Story 6's layer; for a grandchild still the Card's whole section —
  ruled 2026-09-21), so a sibling reorder is the within-action and costs
  no pop.
- Leaving the parent is **two one-layer pops**: Descendants → Card, then
  Card → the containing column. The intermediate Card-layer stop is a real
  state; a release there is the auto-drop, which for the Card's own Stub
  means *set back down where it was picked up — nothing written*.
- Moving a Stub out of a Card is an un-attach only; zooming into a
  different Card is a reparent (auto-drop as that Card's last child).
- Test cases: `docs/test-plans/board-drag-interaction/drag-5-detach-and-overflow.md`
  TC-1–5, 9–12.

**Depends on:** Stories 1-3; Story 4.1 first (its Phases 0 and 3 are what
make the Descendants layer a row rather than a branch). Story 5 needs the
Descendants layer to exist as a *start* state even before Story 6 builds
manual placement inside it — sequence the two accordingly, or build Story
6's layer first.

---

### Story 6 — Stub → Stub hierarchy placement
**Plan / record:** [`story-6-descendants-placement.md`](story-6-descendants-placement.md)
(planned 2026-09-17, not started — the shared placement library, the flat
descendants list, and the sidebar's two behavior differences it corrects)

**Goal:** placement *within* the descendant hierarchy — the **Descendants
layer**, one inside the Card — using the same ruleset as the project
sidebar. Part of this story is consolidating as much of the projects /
item-descendants reposition-and-reparent logic as possible into one
shared library; if the sidebar is found doing anything differently, it is
brought to the same rule here.

**Rules settled 2026-09-17** (wiki §1.1, §3.1, §3.2, §7):
- **Reached by holding** over a locked Card's descendants section
  (duration-only, its own panel clock). A childless Card has no
  descendants section and so no Descendants layer — the auto-drop is its
  only outcome.
- **Placement is a range, not three options.** The ghost sits in a gap
  between *Top* and *Bottom* (vertical position); horizontal offset picks
  a depth from `[Bottom's depth … Top's depth + 1]`. Top + 1 → Top's
  **first child**; Top's depth → sibling after Top's subtree; each level
  shallower → sibling after the corresponding ancestor of Top; nothing
  shallower than Bottom. Full statement, worked example and boundaries in
  wiki §7.1.
- **An over-cap tab state is reachable, marked invalid, and a no-op on
  release** — the one exception to §3.2. Cycles are unreachable because
  the dragged subtree travels with the item.
- Test cases: `drag-4-attach-and-stub-placement.md` TC-8–11, 18;
  `drag-1-contexts-and-popping.md` TC-21.

~~**Needs attention** — option 3 settles the parent but not the slot.~~
Resolved: tabbed right of Top is Top's **first** child; any other slot is
reached by anchoring against a sibling.

**Depends on:** Stories 1-3; Story 4.1 first; Story 5 for a Stub-started
drag.

---

### Story 7 — Depth cap determination + depth overflow
**Goal:** derive the real cap empirically from what the project sidebar can
display comfortably, then decide what happens to a hierarchy that exceeds
what a Card can show — **either** the previously sketched "see X children"
placeholder with a wider modal, **or** simply restricting the hierarchy to
the depth the UI has room for. Undecided as of 2026-09-17; wiki §9 is a
pointer to Open questions until this story rules, and the test plan carries
nothing for it (DRAG-5.6–5.8 withdrawn).

Deferred beyond this story: any solution for depth so great that indenting each
level no longer fits the sidebar or the overflow modal either.

~~**Needs attention** — the "see X children" hold threshold is unnamed.~~
Moot until the story decides whether a modal exists.

---

### Story 8 — Visual cue polish
**Goal:** settle the final look of the relationship overlays and any other
"this item relates to these items" cues. Explicitly deferred to late so the
cues are tuned against real, working gestures.

---

### Story 9 — Free-item reparent keeping Free status (gesture only)
**Goal:** decide whether the *board* offers a drop that reparents a Free item
while keeping it Free — implement it, defer it, or conclude it isn't a board
action that makes sense. The API side is already Story 1's
(`wiki/item-attachment/` §4: `parentId` and `isAttached` are independent, and
omitting the flag keeps the current state).

Last by design: nothing left to build on the server, but it adds a third
drop-meaning to disambiguate in the UI, and that's only judgeable once the
other gestures exist.

---

### Story 10 — DnD automation catch-up (no skipped Playwright tests)
**Goal:** bring the drag automation suites up to the test-plan catalogs
once the gesture has stopped moving, and decide — case by case — what the
automation suite is *for*: which cases it asserts, which stay manual by
rule, and which are precise enough to be flakier as automation than they
are worth. Ends with **zero skipped Playwright tests** in `tests/`.

**Why a story and not the checklist step.** This is the Definition of
Done's standard test-reconciler pass (`.claude/guides/epic-done-checklist.md`
§ Tests), pulled out as its own story as a special case: the pop clocks,
carve-out bands and ghost geometry are being tuned hands-on through
Stories 5–8, and a precise-move E2E written against today's values is
expected to flake or go stale while that's happening. The current
intention is to catch the tests up to the plan *once*, after fine-tuning,
rather than re-chase them story by story. Cases that don't depend on
precise cursor placement or timer margins (API tests, pure-function unit
tests, classification/overlay assertions) are **not** covered by this
deferral and keep landing with their stories.

**In scope:**

1. **Test-reconciler pass** over `docs/test-plans/board-drag-interaction/`
   (DRAG-1…6, 82 active cases) and `docs/test-plans/item-attachment/`
   (ATT-1…7), all currently ⏳ pending triage. Report saved to
   `docs/audits/test-reconciliation-report-epic3-5.md`. Every case ends
   mapped to a test or explicitly manual-only with a reason; §3.1's ruling
   (automate reachability + the resulting write; threshold-timed cases are
   manual by rule) is the triage rule, not a gap.

2. **Deferred from the Story 4 audit, #3** (`docs/audits/code-quality-audit-epic-3-5-story-4.md`,
   recorded 2026-09-21): Story 4's card-to-card attach gesture has no
   client-side automated coverage at any level. Column → Card zoom-in,
   `popDueAt`'s card fallback, `placementFor`'s Card branch, Card → column
   pop-out via `parentRegionKey`, `useIsAttachTarget`, `AttachGhostRow` —
   all exercised only by hand. `popSession.test.ts` has no `kind: 'card'`
   region in any case (`dragFixtures.ts` says so); every E2E preset sets
   `cardPopInDelayMs` ≥ 30 s so no spec ever zooms into a Card; DRAG-4's
   Card-layer cases (4.1, 4.5, 4.12, 4.14–4.17) are all pending. The
   audit's minimum fix, deferred here whole:
   - *Unit* — a `cardRegion` fixture in `dragFixtures.ts` and a
     `popSession.test.ts` describe for the Card layer: column-locked hover
     on a valid card for `cardPopInDelayMs` zooms in; a Board-layer point
     over a card never does (`childRegionAt(…, null)` excludes it);
     popping out of a Card lands in its `parentRegionKey`, not Board;
     `placementFor` returns `{ parentId, slot: 'last' }` regardless of
     `over`. This half is not threshold-sensitive and could have landed
     earlier; it's deferred with the rest because Story 5 makes the Card
     layer a Stub drag's intermediate stop and Story 6 adds the layer
     beneath it — the describe is cheaper written once against the final
     shape.
   - *E2E* — DRAG-4.1 (zoom in + release → `parentId`/`isAttached`
     written, workphase inherited) and DRAG-4.17 (pop back out before
     release → the column's reposition, no attach) with a
     `SUSTAINED_CARD` preset in `drag-column-bands.spec.ts`'s style.
   - *Not deferred:* the attach write itself is API-covered in
     `items.hierarchy.test.ts` (TC-7.11, ATT-3.6, ATT-6.1, ATT-5.1, and
     the detached-child re-attach from audit #1); the client's
     `isIdentity`/`toRequest` half is unit-covered in
     `boardDndUtils.test.ts`.

3. **The six existing `test.skip`s** — `item-repositioning-cross-column-dnd.spec.ts`
   1.a/2.a and `item-repositioning-cross-project-dnd.spec.ts`
   1.a/2.a/2.b/4.b. All Epic 3.2-era "drag C onto card X → before X"
   cases, skipped for a dnd-kit swap-preview precision problem (the drop
   reproducibly lands on a different anchor). Their premise no longer
   exists: under §6 a release over a Card is either the column's
   anchor+side reposition (quick) or an attach (held) — DRAG-4.5
   supersedes the interim "drop on X = before X" default. Re-derive them
   against DRAG-3/DRAG-4.5, or delete them where the API twin already
   pins the math (each has one). Un-skipping as-is is not an option.

4. **Test-plan parameter drift.** `board-drag-interaction/INDEX.md` still
   parameterizes the bands on `GHOST_H` (`ghostCardHeightPx`, 96px); Story
   4.1 retired that panel value for the shortCard height + list gap.
   Reconcile the names so a case can be read against the code again.

5. **The flakiness call, made explicitly.** For each precise-move case
   the reconciler proposes automating, decide whether a real pointer
   sequence against pixel geometry and timer margins is worth keeping in
   the suite, or whether the case is better served by a `dragGesture.ts`
   improvement, a state-machine unit test, or a manual note. Record the
   decision per case; "flaky, kept anyway" is not an allowed end state.

**Exit criteria:** no `test.skip` / `test.fixme` in `tests/`; `npm run
test:e2e` and `npm run test:unit` green; every DRAG/ATT case mapped or
manual-only; the DoD's "No skipped or pending tests" and "All test-plan
cases have a mapped automation test or manual acknowledgement" boxes
checkable.

**Depends on:** Stories 5–8 (the gesture and its thresholds stop moving);
Story 9 if it implements a gesture. **Blocks:** the epic's ✅.

---

## Decisions of 2026-09-17 (Stories 5/6 planning)

Recorded here because these were weighed, not just stated; the settled
rules live in `wiki/board-drag-interaction/`.

- **Hierarchy placement: a depth range, not three options.** The first
  draft enumerated three placements per gap — aligned to the item below,
  aligned to the item above, indented under the item above — and worked
  through scenarios one by one. Test planning showed it missed real
  placements: when Top sits two or more levels deeper than Bottom, the
  gap also contains "sibling after each of Top's intermediate ancestors,"
  and those are reachable from *no other gap*. Reframed as a single rule,
  `range = [Bottom's depth … Top's depth + 1]`, which the three options
  fall out of as the two- and three-level cases and which also covers
  nested-last, empty, and the one-option gap where Bottom is Top's child.
  Same rule for the project sidebar; Story 6 consolidates.

- **Auto-drop is *last* child; *first* child is a manual gesture.** The
  Card layer's within-action (Story 4 as built) appends an incoming item
  as the last child. A draft addendum briefly had "auto defaults to first
  child," which would have flipped Story 4's built behaviour. Ruled
  instead that these are two different gestures: dropping over the Card
  and letting it auto-place → **last**; manually dragging a Stub to sit
  directly beneath a line item at Descendants layer, tabbed right →
  **first** child of that item. And the auto-drop for the Card's *own*
  Stub is "set back down, nothing written," distinguished by where the
  drag started rather than by anything about the release.

- **No two-layer pop out of Descendants.** The design doc floated a
  special rule letting Descendants pop straight to the column — possibly
  as its *only* pop-out, on the view that stopping at the Card layer
  (whose within-action is auto-place) has little value on the way out.
  Rejected: every pop is exactly one layer (§1.1 rule 2), and the
  distance term of the pop-out clock is expected to make a decisive yank
  fire both pops back to back without a special case. The Card-layer
  stop stays a real, if brief, state with a defined release meaning.

- **Overflow (§9) demoted to an open question.** Story 7 will choose
  between the placeholder/modal and a hard display-depth restriction;
  nothing is planned or tested for it until then.

## Open items

None outstanding. Resolved in Story 3 (2026-09-11):

- **Expanded-mode columns** — in the pop model: each sub-row is its own
  region with its own bands and pop, as `wiki/board-drag-interaction/` §1/§5
  already stated; the machinery is parametric on "a region", so it cost a
  region registration and a test (DRAG-1.6, DRAG-3.8).
- **Optimistic preview** — the ordinal placement of §10 is the preview:
  the item is drawn at its slot (first / last / where its kept position
  falls / beside its anchor) with no position invented, and that placement
  becomes the pending marker until the response lands. The fuller
  "compute a number client-side" option Epic 3.2 left open is closed by
  `wiki/item-positioning/` §2's amended client-side role.
