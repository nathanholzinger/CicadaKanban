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
  existing routes do it. Zod lands in the API contract epic that follows
  this one (`docs/planning/tech-debt-stories/api-contract-zod-openapi.md`),
  which starts with the move endpoints.

---

## Stories

### Story 1 — Server: atomic reparent-with-placement ✅ (done 2026-09-11)
**Plan / record:** [`story-1-server-reparent-with-placement.md`](../../archive/story-1-server-reparent-with-placement.md)

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
  state. Whether the *gesture* offers it is a tech-debt story's question
  (`docs/planning/tech-debt-stories/free-item-reparent-gesture.md`).
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
**Plan / record:** [`story-2-drop-target-classification.md`](../../archive/story-2-drop-target-classification.md)

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
**Plan / record:** [`story-3-pop-state-machine-column-bands.md`](../../archive/story-3-pop-state-machine-column-bands.md)

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
full in [`story-3-pop-state-machine-column-bands.md`](../../archive/story-3-pop-state-machine-column-bands.md)'s
own addendum section rather than as a new story — same subject Story 3
already owns, not new capability. Kept here rather than folded into Story
8: Story 8 is unrelated (§4's relationship-overlay palette/animation, not
started).

---

### Story 4 — Card → Card = attach ✅ (done 2026-09-16)
**Plan / record:** [`story-4-card-to-card-attach.md`](../../archive/story-4-card-to-card-attach.md)

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
client-side automated coverage — `docs/archive/code-quality-audit-epic-3-5-story-4.md`
#3. Deliberately deferred to **Story 10** rather than fixed here, so the
E2E is written once against settled thresholds instead of chased through
Stories 5–8's tuning. The write itself is covered at the API
(`server/tests/routes/items.hierarchy.test.ts`); the pure-function half of
the audit's #1 fix (`isIdentity`, `toRequest`) is covered in
`boardDndUtils.test.ts`.

---

### Story 4.1 — Drag-layer efficiency refactor (vestige removal) ✅ (done 2026-09-18)
**Plan / record:** [`story-4-1-efficiency-refactor.md`](../../archive/story-4-1-efficiency-refactor.md)
· anchor: [`story-4-1-anchor-draft.md`](../../archive/story-4-1-anchor-draft.md)
· comparison: [`story-4-1-comparison.md`](../../archive/story-4-1-comparison.md)

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
"As built" section for the per-phase detail. Its two hands-on
Product-Owner feel-checks (Phase 1's shortCard/carve-out, Phase 4's
merged-column pop-out/exit-clock) were closed without being run (Nathan,
2026-10-28): Stories 5–7 built on both, and Story 8's manual testing
covers anything still off.

---

### Story 5 — Stub → out = detach ✅ (done 2026-09-21)
**Plan / record:** [`story-5-stub-detach.md`](../../archive/story-5-stub-detach.md)
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

### Story 6 — Stub → Stub hierarchy placement ✅ (done 2026-09-25)
**Plan / record:** [`story-6-descendants-placement.md`](../../archive/story-6-descendants-placement.md)
(planned 2026-09-17; its eight planning decisions ratified by the Product
Owner 2026-09-23, decision 1 with a PO hands-on gate before the machine
phase; in progress — Phase A (the shared placement library, the sidebar's
three behavior differences corrected) and Phase B (the flat descendants
list) built 2026-09-23; the Phase B hands-on added a new Phase C the same
day, reopening Story 5 decision 6 so the carried copy is a Stub from the
Card layer down, and the gate moved to after it; the machine phase is now
D and the wiki report E. E2E deferred to Story 10, and the wiki reported
on, not edited — both decided 2026-09-23. The B+C hands-on (2026-09-23/24)
fixed the Card zoom-in after Board layer, changed how a column drop picks
its anchor (drop lands where the ghost is, the lean picks which neighbor
names it), and changed the zoom-in candidate itself to the card the blue
line names, held through a dwell + cue — all three ratified and merged
2026-09-24. Phase D (the machine: §7.1's gap + depth, tracked as a live
session projection and resolved at release; §7.2's depth-cap exception)
built 2026-09-24; the PO's own Phase D hands-on the same day found the
gap one off and the chosen depth invisible, fixed with a depth cue on the
carried Stub. Phase E's wiki-status report done 2026-09-24 — every
"Story 6" wiki marker now reads built; no rule disagreement found. The PO
signed off on B+C+D together, recorded 2026-09-25)

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

### Story 6.1 — Drag-layer refactor against stock dnd-kit (vestige removal after Story 6) ✅ (done 2026-09-24)
**Plan / record:** [`story-6-1-library-first-refactor.md`](../../archive/story-6-1-library-first-refactor.md)

**Goal:** no rule changes. Story 6 was built hands-on, and several rules
changed along the way. One of them reversed the drag layer's direction: the
column slot, and then the zoom-in candidate, went back to dnd-kit (Option A
and hands-on finding 3, 2026-09-24). This story removes what the earlier
direction left behind, so the code reads as if the current rules had been
the spec from the start, before Stories 7–10 build on it.

It has the same purpose as Story 4.1, but a different method (agreed with
the PO 2026-09-24). There's no clean-slate draft: the rule changes are
dated, and a design from scratch would ignore the library the rules now
lean on. Instead it uses three lenses:
- a trace of each dated rule change;
- a "who decides" table with stock dnd-kit as the baseline;
- a dry run of Stories 7–10.

The file splits that the Story 4 and 5 audits carried and never did are
built here as phases.

**Depends on:** Story 6. **Unblocks:** Stories 7–10.
**Then:** one four-pass audit over Stories 6 and 6.1 together, as the Story
4 audit covered 4 and 4.1. The epic-wide pass comes at epic close.

**Status: method agreed 2026-09-24. Comparison done and the ledger
ratified by the PO the same day: 45 findings — 32 adopted across four
phases, 1 already fixed in Story 6, 5 deferred, 7 rejected. Built
2026-09-24 (Phases 0–3); the joint Story 6 + 6.1 audit followed
(`docs/archive/code-quality-audit-epic-3-5-story-6.md`).**

---

### Story 7 — Depth cap determination + depth overflow ✅ (done 2026-10-28)
**Plan / record:** [`story-7-depth-cap-and-hierarchy-modal.md`](../../archive/story-7-depth-cap-and-hierarchy-modal.md)

**Goal:** derive the real cap empirically from what the project sidebar can
display comfortably, then decide what happens to a hierarchy that exceeds
what a Card can show — **either** the previously sketched "see X children"
placeholder with a wider modal, **or** simply restricting the hierarchy to
the depth the UI has room for. Undecided as of 2026-09-17; wiki §9 is a
pointer to Open questions until this story rules, and the test plan carries
nothing for it (DRAG-5.6–5.8 withdrawn).

**The project cap too** (Nathan, 2026-10-05, ruled during A5d): projects get
a depth cap of their own, configured apart from the item cap, though the
two will very likely share a value. This story set both at 12
(2026-10-27). A5d writes the cap's rules that hold
whatever the number on the hierarchy-placement page, so this story sets
each value without restating them.

Deferred beyond this story: any solution for depth so great that indenting each
level no longer fits the sidebar or the overflow modal either.

~~**Needs attention** — the "see X children" hold threshold is unnamed.~~
Moot until the story decides whether a modal exists.

**To consider** (PO, 2026-09-24): if an overflow modal is in scope, align
hierarchy dragging across its three surfaces: the project sidebar, a
Card's Descendants section, and the modal. They already share
`lib/hierarchyPlacement.ts` (Story 6). One difference is left on purpose:
when the named row belongs to the dragged subtree, the board steps past
it in dnd-kit's order (`travelingRowsFor`), and the sidebar maps it to
"after the nearest eligible predecessor" (`resolveGap`). Story 6.1's
ledger rejected merging the two for now (L1-7b); this is the natural
place to revisit.

**Planned 2026-10-26.** Nathan ruled:
- **The overflow:** the modal is in. A Card's section shows 3 levels, and a placeholder stands in for the rest.
- **The sidebar:** its width becomes draggable.
- **The caps:** both take one value, at least 10, set by how deep the modal shows comfortably.
- **Breadth:** out of scope.
- **The to-consider item above:** the sidebar and the board keep their own drag code, so L1-7b stands.

The plan holds the decisions. The hold threshold above is its E3.

**Status: done 2026-10-28.** Both caps are 12. Its two defects left open
are Story 8.2, which Story 8.1 took in, and Story 8.3. The specs 8.2's
fix unblocks are Story 10's item 9.

---

### Story 8 — Visual cue polish and feel tuning
**Goal:** once every gesture works, settle how the drag looks and how it
feels. That covers:
- the final look of the relationship overlays and every other "this item
  relates to these items" cue;
- the provisional cues earlier stories shipped as stand-ins (the blue line,
  the zoom-in cue, the depth cue, the over-cap outline);
- anything that makes the gesture feel jumpy, or makes its own parts
  disagree with each other.

Deliberately late, so all of it is tuned against real, working gestures.
*(Broadened 2026-09-24 from "visual cue polish" to include feel tuning:
Story 6's hands-on found feel problems that aren't about any one cue's look.)*

**A series of stories** (Nathan, 2026-10-28). Story 8 is a small epic of
its own, run as discrete 8.N stories, in this order:
1. **Story 8.1** folds the Card layer into the Descendants layer. It was
   this roadmap's optional story, and it takes in Story 8.2's fix.
2. **Stories 8.3–8.6** fix the bugs and build the missed features that
   earlier stories deferred here.
3. **The cues' final look,** a story of its own.
4. **The zoom-in morph,** last. It's what Story 8 was first written for.

The last two get their numbers when they're picked up. More 8.N stories
are expected from manual testing, such as one for a Stub in the hierarchy
modal opening its Sheet on a click. Each is added when it's found, and
numbered ahead of the last two. Each story gets its plan when it's picked
up.

**How Story 8 runs: code first** (Nathan, 2026-10-28). It's a tuning and
feel story, so every 8.N departs from the usual order in three ways:
- **Code leads, and the docs follow.** The Coder builds candidate
  solutions, and Nathan tries them hands-on. The PO writes the wiki, and
  the Test Planner the cases, once Nathan has approved a solution. They
  don't write Planned passages ahead of the build.
- **The drag specs aren't kept green.** When a change makes a drag spec
  fail, and we're reasonably sure the spec is giving a false failure, the
  spec is skipped, not updated. The skip carries a one-line reason. Story
  10 takes the skips up, since it ends with none.
- **No new drag tests** until Story 8's decisions are final, at its end,
  or until Story 10.

"Drag tests" here are the Playwright specs that drive a drag, the ones that
depend on cursor placement or timing (Story 10's line). Unit tests of pure
modules, API tests and `npm run check` work as usual, with one exception:
if the drag layer's unit tests keep failing on changes that are only being
tried out, they can be skipped on the same terms, and Story 10 takes them
up too. Most of them set their own timings and geometry, and read the
shared sizes by name, so a changed tuning value or size shouldn't fail
them. A changed rule will, such as what a layer change moves or what a
trigger reads.

**A defect is fixed in Story 8, whichever story finds it** (Nathan,
2026-10-28). A defect in the code that a drag test or a trace finds is
fixed in an 8.N story. A drag spec that fails because the spec is wrong,
not because it catches a defect, is skipped with a one-line reason, and
Story 10 takes it up.

**How each story closes** (Nathan, 2026-10-28). Not strictly by the
story-done checklist:
- Once a story's code is settled, the PO and the Test Planner bring the
  wiki and the test plans up to it.
- An audit or a Reconciler run happens when it seems worth it, not for
  every story.
- **Story 8 ends with a close-out audit and a Reconciler run** over all
  its stories, by the checklist. Any case still without a test is routed
  to Story 10 by ID then.

**Carried from Story 8.1 to Story 8's close-out — Test Planner and Test Reconciler.**
These follow-ups remain here after the 8.1 plan is archived. They are
queued for the umbrella close-out, not additional reconciliation work
required before 8.1 signs off. The interim report predates Phase 5's
test additions/stamps and Phase 6's hidden-slot fix; re-check the current
tests rather than carrying its coverage verdicts forward unchanged.

**Test Planner:**
- **Pending-ancestor pickup:** the untagged test in
  `client/src/components/workflow/useBoardDnd.test.ts` covers pickup while
  an ancestor's attachment is still pending, using the containing Card as
  drawn. Decide whether to extend DRAG-1.1 or DRAG-6.13, or add a case.
  Neither case explicitly covers an ancestor's pending attachment today;
  do not assign an ID merely because the scenarios are related.
- **Malformed workflow owner reference:** two untagged tests in
  `server/tests/routes/workflows.test.ts` cover non-string `projectId`
  values on `POST /workflows`: shape refusal with nothing created, and
  shape refusal before the already-owned-project check. The catalog has
  no case for a malformed owner reference. Derive coverage from wiki
  row-references §1 and the workflow-owner rules, then hand any required
  ID stamps to the Coder.
- **Pickup immediately after detaching:** the untagged
  `tests/ui/drag-5-stub-detach.spec.ts` test, "immediately after a detach,
  the same item drags and reorders normally as a Card", is the interim
  Reconciler's candidate case. Decide whether it extends an existing
  pickup/reposition case or needs its own case, then hand off the stamp.

**Test Reconciler:**
- **DRAG-7.2's approved mapping:** Nathan approved
  `client/src/components/workflow/itemListOps.test.ts`'s test, "leaves the
  dragged item out of the count, and draws none when it was the only
  child", as an internal pointer. Phase 5 stamped it. Write the pointer
  alongside the surface tests; restore `Automated` only if they jointly
  assert the whole case. This approval does not extend to other display
  tests.
- **DRAG-7.31's category:** Phase 6 added
  `client/src/components/workflow/descendantsProjection.test.ts`'s
  "DRAG-7.31: set down at its own slot in the modal, after coming in with
  the slot hidden, a release writes nothing" and fixed the behavior.
  Assess whether its projection/release assertions fall within a standing
  approved internal category. DRAG-4.29's existing pointer is a comparison,
  not automatic approval of this mapping. If outside the categories,
  propose the mapping for Nathan's approval. Its whole surface path is
  still Story 10's.
- **The auditor's two workflow-test questions:** in
  `server/tests/routes/workflows.test.ts`, the ordered-workphases test
  (audit location `:49–73`) seeds only one workphase and checks its count;
  the orphan-workflow deletion test (`:519–536`) claims preservation of
  every project's items but seeds no project or item and checks only the
  deletion. Assess what each actually proves, identify any missing
  assertions, and route the test work. These are targeted test-quality
  questions, not skipped-DnD findings; the audit locations may move.
- **Re-check Phase 5's coverage:** its added request/clock tests and ID
  stamps may change the interim verdicts for DRAG-1.14, DRAG-1.28,
  DRAG-1.35, DRAG-3.22, DRAG-4.1, DRAG-4.12, DRAG-4.30, DRAG-4.34,
  DRAG-5.1, DRAG-5.4, DRAG-5.13, DRAG-7.2, DRAG-7.11 and DRAG-7.14.
  Check their full cases and approval requirements; a stamped partial test
  alone does not make a case `Automated`. The separate mapping proposals
  for DRAG-1.28, DRAG-3.22 and DRAG-4.12 remain unapproved and wait for
  Story 10. Route any remaining gesture-dependent coverage to Story 10
  by ID at close-out, under its existing catch-up scope.

---

### Story 8.1 — Fold the Card layer into the Descendants layer
**Plan:** [`story-8-1-fold-card-layer.md`](story-8-1-fold-card-layer.md)

**Goal:** remove the Card layer from the drag's stack, so that zooming into a
Card lands straight in its Descendants layer, bounded by the whole Card.
Every Card gets that layer, including one with no children, whose only spot
is the Card's only child (wiki hierarchy-placement §2's empty hierarchy).

Raised while planning Story 7 (Nathan, 2026-10-26). The Card layer hasn't
proved useful hands-on, and Story 7's overflow modal brings an edge case
that only the Card layer raises. Left out of Story 7 to keep its scope, and
taken into Story 8 as its first story (Nathan, 2026-10-28).

**What carries over:**
- **A release right after zooming in** still makes an item from outside the
  last child, and still sets the Card's own Stub back down. The Descendants
  layer already starts the ghost where the Card layer places it.
- **A Card with no children** still takes a child, through its one-spot
  Descendants layer.

**What changes:**
- **Detaching is one pop,** leaving the Card's box. The safe stop when a drag
  drifts out of the section goes (DRAG-5.12's set-down at the Card layer).
- **One hold fewer:** the Card → Descendants zoom, and
  `descendantsPopInDelayMs` with it.
- **The modal's edge case goes.** Pulling out of Story 7's modal lands in
  the column, so the case of a Stub whose spot the section hides, pulled
  out to the Card layer, no longer arises.

**It settles the Card layer's pass-through** (PO, 2026-09-25, carried in
from the Story 6 + 6.1 audit fixes). After a zoom into a Card with
children, the pointer usually rests over its descendants section, so about
0.8 s later (`descendantsPopInDelayMs`) the drag goes one layer deeper. The
Card layer's own drop (attach as the last child) held only while the
pointer stayed on the Card outside its section. The PO found this fine in
use, and was weighing whether the Card layer's stop was worth keeping for a
Card with children. This story removes the stop for every Card.

**Cost:** mostly docs and tests.
- **The PO:** wiki board-drag-interaction §1.1, §6, §7 and §8.
- **The Test Planner:** DRAG-4.1, DRAG-5.12, and the cases that zoom from
  the Card layer into Descendants.
- **The specs:** `drag-card-zoom-in.spec.ts` and `drag-5-stub-detach.spec.ts`.
  Under code first, a spec this breaks is skipped, and Story 10 takes it up.
- **The code:** mostly deletion, of `popSession.ts`'s Card state and
  `placement.ts`'s Card branch, plus moving the Descendants region onto
  the Card's box.

**It takes in Story 8.2's fix** (Nathan, 2026-10-29). After the fold,
every Free Card that zooms into a Card lands in its section, the path
Story 8.2's defect is on. Without the fix, attaching a Free Card could make
it the first child, where the Card layer always made it the last, so the
fold's main gesture would regress.

**It reverses a recorded decision:** "No two-layer pop out of Descendants"
(Decisions of 2026-09-17, below), which keeps "The Card-layer stop … a real,
if brief, state".

**Sequencing:**
- **Before Story 10,** which automates Card-layer cases (DRAG-1.17, 1.21 and
  4.1 among them).
- **First in Story 8,** whose feel tuning covers layer changes, this one
  included.
- **The Free reparent's candidate home goes with the layer.** Story 6.1's
  dry run put "reparent but stay Free" at the Card layer, as a third
  meaning of a release there. That question has left this roadmap (Nathan,
  2026-10-28) for a tech-debt story,
  `docs/planning/tech-debt-stories/free-item-reparent-gesture.md`, which
  starts from a board without the Card layer.

---

### Story 8.2 — A Free Card zoomed into a section doesn't follow the cursor
**Carried in from Story 7** (Nathan, 2026-10-28). **Folded into Story
8.1** (Nathan, 2026-10-29), as its plan's Phase 3. The number isn't
reused, so Stories 8.3–8.6 keep theirs.

A Free Card that has zoomed into a section doesn't follow the cursor there.
Its projection stays at the section's top, because the carried copy's clamp
and collision rect read the overlay's stale `draggingNodeRect`. The trace is
in Story 7's plan, Amendments, "2026-10-28, batch 7". The fix is in the drag
layer's core, and the morph's work on the carried copy at a layer change
touches the same rects. DRAG-1.21 and DRAG-4.1 go through the same path,
and it may be why `drag-card-zoom-in.spec.ts`'s two tests are skipped. The
specs it unblocks are Story 10's (its items 1 and 9).

The fix starts by reproducing the defect on the folded code.

---

### Story 8.3 — A hold from above draws the modal's ghost a row off (DRAG-7.15)
**Carried in from Story 7** (Nathan, 2026-10-28).

A hold from above, with a child under the dragged item, can draw the
modal's ghost a row away from what a release writes. `W`, first in `P`
with a child `WC`, is moved in one step to the top of `R`'s overflow row
and held. The modal opens with the projection at `R`'s first child, before
`R1`, and draws the ghost after `R1`. The same point reached in small steps
reads another gap, so the reading depends on the path. It's untraced. The
reproduction is in Story 7's plan, Open questions, "For Nathan, from batch
13". DRAG-7.15's specs reach the gap in small steps. A spec for the
one-step move would carry DRAG-7.15, and waits under "No new drag tests"
(How Story 8 runs).

**A failure to watch for alongside it** (Story 8.1, Phase 7, 2026-10-29).
`drag-7-modal-hold.spec.ts`'s DRAG-7.17 test failed once in a full E2E
run: from the gap above `R`'s overflow row, a list that scrolls puts the
ghost's spot under the cursor. It didn't reproduce in 30 runs of the spec
alone, five of its file, or a second full run. It reads the same modal
placement as this story's defect, and Phase 7 changed when a modal reading
reaches the session. If it fails again, trace it with this story's.

---

### Story 8.4 — A cue when the board stops a drag
**Carried in from A4's PO handoff** (Nathan, 2026-09-30).

If an earlier drop's write fails, or a stale response resyncs the board,
while the user is dragging, the reload cancels the drag and nothing is
written (wiki board-drag-interaction §10). Nathan wants a visual cue for
that forced stop, so the drag's end doesn't read as the user's own slip.
The wiki carries the cue as Planned, and its look under Open questions.
This story designs the look and builds it, and the PO clears the marker
once Nathan approves it.

---

### Story 8.5 — A dragged Stub's children read as off-limits
**Carried in from Story 6's hands-on** (PO, 2026-09-24).

- **What's there.** The guards are right: a picked-up Stub's descendants
  travel with it, so it can't be dropped into its own branch (Story 6,
  Phase D's hands-on finding, item 3).
- **What's missing.** Nothing on screen says so. The children stay drawn
  at full strength where they were, while the Stub's ghost moves away
  from them.
- **Options, smallest first:**
  - **Grey them out** for the drag, so the branch reads as off-limits.
    The project sidebar already dims a dragged project's descendants
    (Story 6 decision 5). The change is small: the rows are the
    classification's cycle-forming set, which today gets no overlay
    style at all (`KanbanCard.tsx::dropTargetClass`).
  - **Carry them visibly:** the children leave the section and ride with
    the carried copy as a small stack. It's bigger than it looks.
    Removing rows at pickup shifts layout under the cursor (the jump
    problem in the morph's story), and a taller, multi-row copy changes
    the box dnd-kit measures for collisions.

---

### Story 8.6 — One height for every Stub row
**Carried in from the Story 6 + 6.1 audit fixes** (audit #8, 2026-09-25).

A type pill makes a Stub row 5 px taller: a sortable row is 24 px, or 29
with a pill; the ghost row and the carried copy are 26 px, or 31. The drag
math reads the pill-less heights (`cardMetrics.ts::STUB_ROW_HEIGHT_PX`,
`CARRIED_STUB_HEIGHT_PX`), so on a typed row the lean's ghost middle and
the carried copy's re-anchor sit up to 2.5 px off. Giving every Stub row
one height, pill or not, would make both exact. It's a look decision.

---

### Story 8.? — The cues' final look
**Goal:** settle the final look of the drag's cues, against working
gestures. A story of its own, just before the morph, and numbered when
it's picked up (Nathan, 2026-10-28). The wiki holds each look under
board-drag-interaction's Open questions.

- **The relationship overlays,** and every other "this item relates to
  these items" cue (wiki board-drag-interaction §4).
- **The other provisional cues:** the band guides (§5), the over-cap
  outline (§3.2, §7.2), the hold's cue on the overflow row (§7.3), and the
  looks of the overflow row and the hierarchy modal (§9). The hold's cue
  borrows the zoom-in cue's look, so it may wait for the morph, which
  redesigns that cue.
- **Whether the ghost's expansion on drop animates (§5a).** Today it's
  instant.
- **The depth cue at the Descendants layer deserves a tuning pass**
  (carried in from Story 6's hands-on, 2026-09-24). Story 6 ships a simple
  stand-in (the Phase D hands-on, 2026-09-24): the carried Stub stays
  pinned to a section row's width, and its visible box steps right by one
  indent per level, so it shows the depth it will land at. It was built to
  test placement against, not as the final look. To tune:
  - **Travel per level.** 12 px is both the visual indent and the pointer
    travel per level (`DESCENDANTS_INDENT_PX`), so a 6 px sideways wobble
    while moving vertically changes the depth. It may want its own tunable
    value, or a dead band before a level changes.
  - **Pinned vs. following.** Whether the carried copy should also move
    sideways with the pointer, or stay pinned and only snap.
  - **The snap itself.** Today it's a 75 ms margin transition. Also how
    the over-cap state looks on the copy: today it's the ghost row's
    provisional red dashed outline, reused.

  The ghost row hidden under the carried copy is the morph's, with the
  blue line.

---

### Story 8.? — The zoom-in morph
**Goal:** build the zoom-in morph Story 8 was first written for, and settle
the jumps at a layer change that it's meant to solve. Last in Story 8, and
numbered when it's picked up (Nathan, 2026-10-28). After Story 8.1, a zoom
into a Card lands in its Descendants layer, so the morph ends there.

**Carried in from Story 6's hands-on (2026-09-24):**

- **The zoom-in morph.** Story 6 ships a simple cue for the Column → Card
  zoom-in (the named card outlined, filling in). The full version, as the
  PO pictured it: the target card expands, a dashed placeholder Stub grows
  where the item will go, and the carried copy shrinks into a Stub and
  drifts toward it, with the pop landing partway through the animation. One
  constraint carries over: nothing in the animation may change what
  dnd-kit measures (the carried copy's box, the cards' layout), or the
  named card changes mid-cue and cancels it.
- **Current awkward behavior the morph should ideally solve** (found
  building Story 6's finding 3, 2026-09-24): popping into a Card inserts
  the carried item's attach-preview ghost row *inside* it and removes the
  carried item's own row from the column list — if that row sat above the
  target Card, the target shifts up by a full row height at the exact
  instant the drag locks in, out from under a cursor that hasn't moved.
  With the default `popDelayMs` a real hand likely self-corrects before the
  pop-out clock notices, but it's a visible jump today, and it's what made
  two `tests/ui/drag-card-zoom-in.spec.ts` cases too flaky to automate
  meanwhile (skipped, with the full writeup, until this lands or the look
  is otherwise confirmed fine by hand). The morph should settle it by
  construction if the target's own position never has to move out from
  under the cursor mid-cue — worth checking against this specific case
  once the morph's built, not just against the happy path.
  *Since Story 8.1:* the zoom lands straight in the Card's section, and
  the ghost is a row of the section's shuffle (the attach-preview row is
  gone). The item's row still leaves the column list at the zoom.
- **The zoomed-into Card snaps to rest** (Story 8.1, Phase 3). While a Card
  holds the drag, its sortable transition is off (`KanbanCard.tsx`,
  `lockedHere`), so its section's rows mount, and are measured, where the
  Card rests. It used to slide back over about 200 ms, with a colour fade.
  If the snap reads badly hands-on, the slide needs another way to be kept
  that still leaves the rows measured at rest.
- **Things jump at a layer change, and then the triggers disagree** (PO,
  2026-09-24).
  - **What moves.** Switching context (popping in or out, zooming into a
    Card, entering a Descendants section) re-lays things out under a cursor
    that hasn't moved:
    - the carried copy changes form (Card ↔ Stub) and re-anchors;
    - the item's row leaves one list and its ghost appears in another;
    - the rows around it shift to make room.

    The copy and the ghost end up offset from the cursor.
  - **What reads what.** The triggers split by what they read:
    - **the cursor:** the pop machine's regions and pop-out clock, and the
      depth (pointer x);
    - **the carried copy or its ghost:** dnd-kit's `over` (from the copy's
      collision box), the lean, the named anchor, and so the zoom-in
      candidate.

    Once the two are apart, they can point at different things, and which
    one wins depends on timing. The zoom-in shift above is one case of
    this.
  - **Directions to weigh:**
    - keep the cursor on the copy through every layer change (the Stub form
      already re-anchors under the cursor at Card → Stub; generalize that);
    - don't move layout at the instant of a switch (for example, keep the
      item's old row space until the drop instead of removing it);
    - have every trigger read one reference point.
  - Story 6.1's "who decides" table records which trigger reads which
    point. That's the input to this.
- **The blue anchor line is partly hidden behind the dragged card.** Since
  the drop lands where the ghost is and the dragged copy sits over the
  ghost, the line (above or below the ghost) is often under the copy. The
  Descendants layer's ghost row has the same problem: it shows the depth
  the item will land at, but it's hidden under the carried copy.

**Zooming into a Card in a done column** (Nathan, 2026-10-28: here, since
the side highlight is the zoom-in's cue). The Card zoomed into is the one
the side highlight names, a neighbor of the ghost. A done list's ghost
doesn't move, so only the Cards beside it could be named, and today the
highlight is drawn as if the ghost had slid. What it should show is under
wiki board-drag-interaction's Open questions.

---

### Story 10 — DnD automation catch-up (no skipped Playwright tests)
**Goal:** bring the drag automation suites up to the test-plan catalogs
once the gesture has stopped moving, and decide — case by case — what the
automation suite is *for*: which cases it asserts, which stay manual by
rule, and which are precise enough to be flakier as automation than they
are worth. Ends with **zero skipped Playwright tests** in `tests/`, and
none of the drag layer's unit tests that Story 8 skipped still skipped
(Story 8, "How Story 8 runs").

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

1. **The cases A3 routed here.** A3 re-derived the catalogs from the swept
   wiki and ran the Reconciler over them. Each case below is `Open` and
   routed here by ID. Each one ends `Automated`, or `Manual` with Nathan's
   approval (`docs/test-plans/README.md`). The story closes with the
   standard Reconciler run (story-done checklist step 5); there's no
   separate reconciliation pass.
   - **board-drag-interaction, 64 cases** (A3 batch 3, less DRAG-1.31,
     deleted, and DRAG-6.4, closed in Story 7). What each test
     asserts is in the Gaps section and Addendum of
     `docs/archive/test-reconciliation-a3-board-drag-interaction.md`. Its
     "Confirming run" section lists the 18 tests that carry a case's ID
     but assert only part of it.
     For each, Story 10 decides whether to extend that test, write a new
     one, or put the ID on another test that asserts the missing part
     (`docs/test-plans/README.md`).
     - DRAG-1.1, 1.2, 1.5, 1.6, 1.9, 1.12, 1.13, 1.14, 1.16, 1.17, 1.18,
       1.19, 1.20, 1.21, 1.22, 1.24, 1.26, 1.27, 1.28, 1.33;
     - DRAG-2.4, 2.5, 2.6, 2.8, 2.9;
     - DRAG-3.5, 3.11, 3.12, 3.16, 3.17, 3.18, 3.19, 3.20, 3.22, 3.23,
       3.24;
     - DRAG-4.1, 4.3, 4.5, 4.12, 4.13, 4.14, 4.15, 4.16, 4.17, 4.20,
       4.21, 4.22, 4.32, 4.33;
     - DRAG-5.1, 5.2, 5.3, 5.9, 5.10, 5.11, 5.13, 5.14;
     - DRAG-6.2, 6.6, 6.7, 6.8, 6.9, 6.11.

     **The client-rule category reaches these cases too** (Nathan, A3
     batch 6's Stop 1). The category approved at batch 5's Stop 1 is a
     client ordering or request rule whose only surface is a drag, tested
     in the client's pure modules (`docs/test-plans/README.md`). It covers
     board-drag's client rules as well as item-positioning's. Two
     consequences, from `docs/archive/test-reconciliation-a3-close.md`,
     "What changed since they were routed":
     - **DRAG-6.2 closes with a stamp.** `itemWriteReconciliation.test.ts`'s
       TC-2.30 test asserts the half its UI test misses, so it needs no new
       drag test.
     - **DRAG-1.24, 3.12 and 3.24 need only their surface halves.**
       `dragRequest.test.ts`'s "same workphase, slot existing" and "same
       workphase, empty others" tests hold the request-level halves.

     **Candidate tests from A4** (A4's Handoff, "To the Test Reconciler",
     2026-09-30). A4 turned wiki pointers in these tests' comments into
     the IDs of the cases they assert (A4's D2). Their titles don't carry
     the IDs, and a comment isn't coverage, so each case is still `Open`.
     Check them before writing new tests. The closing run judges whether
     each asserts its case's *Then*. An internal test counts once Nathan
     approves it, or outright when it's in an approved category.
     - **DRAG-6.7:** `dragRequest.test.ts`'s stale-response test in
       `sendItemMove`.
     - **DRAG-6.11:** `itemListOps.test.ts`'s done-list test that draws an
       item with no `completedAt` last.
     - **DRAG-1.17:** `popSession.test.ts`'s "popping out of a context the
       sample has no region for" block, and `drag-5-stub-detach.spec.ts`'s
       DRAG-5.1/DRAG-5.10 test, for its two back-to-back pops. The spec
       waits for the column after two pops' time, but never observes the
       Card layer between them. *Since Story 8.1,* the Stub takes one pop
       to the column, so the spec shows no back-to-back pops, and only the
       `popSession.test.ts` block is left a candidate.
     - **DRAG-1.21, the zoom-in half only:** `popSession.test.ts`'s "locked
       Card: zoom-in into its own Descendants section" block. *Retired by
       Story 8.1,* with the block: a zoom from the column now lands in the
       section (DRAG-1.35, item 10).
     - **DRAG-4.15 and 4.20:** `drag-card-zoom-in.spec.ts`'s header names
       them, but both its tests are skipped, so they cover nothing yet.
       They aren't among item 3's six skips.
     - **Already `Automated`, so a stamp adds a test but changes no
       status:** ATT-7.1 on the same `drag-5-stub-detach.spec.ts` test (the
       preserved parent), and ATT-5.1 on `server/tests/routes/items.test.ts`'s
       PUT cross-project reparent test. Both count as they are. A4 also
       found DRAG-4.8 in `dragCollision.test.ts`'s Stub-row `dropAnchorFor`
       test and TC-5.9 in `positionResolver.test.ts`'s `disclosure` block.
       As internal tests they'd need approval for no gain, so they're left.
   - **item-attachment, 1 case** (A3 batch 4): ATT-4.9, the UI and the API
     agreeing on every target's legality. Its test is described in
     `docs/archive/test-reconciliation-a3-item-attachment.md`, under
     "ATT-4.9", option (a): extend the classification spec to replay each
     target it classifies against the move endpoint.
   - **item-positioning:** none. A3 closed every item-positioning gap it
     didn't route elsewhere. TC-5.15, 6.11 and 6.13 are routed to Epic 4
     (`epic-4-decisions.md` §12), and TC-2.32, 6.10 and 7.18 to A5b, which
     took over A5a's close-out. TC-6.12 moved to A5c's boards catalog as
     BCU-3.4.
   - **From A6's Reconciler run, 1 case** (the Test Planner, 2026-10-22),
     new and `Open`, with no test: TREE-1.13, the sidebar's top level for
     a subtree already taller than the project cap, beside TREE-1.11's
     test in `tests/ui/project-tree-drag.spec.ts`. DRAG-6.15, a reload
     that lands mid-drag stops the drag, was routed here too, and closed
     in A6 on a hook-level test Nathan approved (2026-10-26).
   - **Closed in A6, 7 cases** (Nathan, 2026-10-23; `Automated` at A6's
     re-check the same day), so they leave the list above: DRAG-1.14, 2.9,
     3.5 and 6.6, whose internal tests he approved, and DRAG-4.12, 6.2 and
     6.11, whose passing client tests needed only their IDs. That leaves
     59 of the 66 board-drag-interaction cases here. *Since Story 8.1*
     (its test-plan pass, 2026-10-29): DRAG-1.21, 4.14, 4.16 and 5.11 are
     retired with the Card layer, which leaves 55. The cases the fold
     revised are item 10's too. A6 also
     puts IDs on the request-level tests of DRAG-1.24, 3.11, 3.23, 3.24,
     6.7 and 6.9, which stay here for their on-screen halves.
   - **Drag tests A6's run found short, left for this story** (Nathan,
     2026-10-23: a test that checks a fine-tuned drag waits for Story 10).
     The A6 reports, archived with A6 as
     `docs/archive/test-reconciliation-a6-board-drag-interaction.md` and
     `docs/archive/test-reconciliation-a6-project-tree.md`, give each:
     - DRAG-5.13's row order at the Card layer, DRAG-5.1 landing after
       `Q`, and DRAG-3.11's ghost resting last before a bottom-band
       release (Proposed Stamps, item 7). *Since Story 8.1,* DRAG-5.13's
       pop goes straight to the column, and its pop-out test is among item
       10's skips;
     - `watchWrites` in place of unchanged-field checks, DRAG-5.2's merged
       column, and DRAG-1.12's missing neighbor (Other concerns, 15–17);
     - the sidebar's TREE-1.8 and 1.9 tests pinning the line's side, not
       its row (project-tree, Concerns, 3).

2. **Deferred from the Story 4 audit, #3** (`docs/archive/code-quality-audit-epic-3-5-story-4.md`,
   recorded 2026-09-21): Story 4's card-to-card attach gesture has no
   client-side automated coverage at any level. Column → Card zoom-in,
   `popDueAt`'s card fallback, `placementFor`'s Card branch, Card → column
   pop-out via `parentRegionKey`, `useCardContextLayer`, `AttachGhostRow` —
   all exercised only by hand. `popSession.test.ts` has no `kind: 'card'`
   region in any case (`dragFixtures.ts` says so); every E2E preset sets
   `cardPopInDelayMs` ≥ 30 s so no spec ever zooms into a Card; the
   Card-layer cases, DRAG-4.1, 4.5, 4.12 and 4.14–4.17, are all routed
   here (item 1). The
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
     shape. *Since recorded:* the `cardRegion` fixture exists, and
     `popSession.test.ts` / `placement.test.ts` now build Card regions (the
     zoom-in candidate, the zoom into a Card's Descendants section, a
     pop-out from a context the sample lacks, a Stub drag's placements).
     Check the four cases above against them before writing new ones.
   - *E2E* — DRAG-4.1 (zoom in + release → `parentId`/`isAttached`
     written, workphase inherited) and DRAG-4.17 (pop back out before
     release → the column's reposition, no attach) with a
     `SUSTAINED_CARD` preset in `drag-column-bands.spec.ts`'s style.
     *Since recorded:* `tests/ui/drag-card-zoom-in.spec.ts` (Story 6
     hands-on, 2026-09-23) zooms into Cards and attaches, from a different
     column and after popping out and back in, so "no spec ever zooms into
     a Card" no longer holds. Story 6's zoom-in candidate change (the card
     the blue line names) moves what these cases aim at.
   - *Not deferred:* the attach write itself is API-covered in
     `items.hierarchy.test.ts` (TC-7.11, ATT-3.6, ATT-6.1, ATT-5.1, and
     the detached-child re-attach from audit #1); the client's
     `isIdentity`/`toRequest` half is unit-covered in
     `dragRequest.test.ts`.
   - *Since Story 8.1:* the Card layer is gone, with `placementFor`'s Card
     branch, `useCardContextLayer`, `AttachGhostRow`, the `cardRegion`
     fixture and `childRegionAt` (now `dragRegions.ts::cardListAt`). The
     unit half's four cases now read:
     - a column-locked hold on a valid Card zooms into its Descendants
       layer (`popSession.test.ts`'s zoom-in candidate cases);
     - a Board-layer point over a Card finds the column, not the Card
       (`dragRegions.test.ts`'s `cardListAt` case);
     - leaving the Card's box pops to its column (`popSession.test.ts`,
       DRAG-5.1 and DRAG-5.13);
     - an item from outside previews as the Card's last child
       (`placement.test.ts`, DRAG-5.4), and the projection seeds it there
       (`descendantsProjection.test.ts`, DRAG-4.30).

     Check them against those tests before writing any. What's left is the
     E2E half, DRAG-4.1 and 4.17, which item 10 lists too.

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
   *Since 2026-09-24* (Story 6 hands-on finding 2): a column drop lands
   where the ghost is, so "drag C onto X" is deterministic now (the ghost
   takes X's slot). The precision problem these were skipped for may be
   gone, so re-check before deleting any.

4. **Deferred from Story 6** (decided 2026-09-23 — every case is a
   precise-move one). DRAG-1.21 (a hold on the section →
   `descendants:<P>`; pop-out → `card:<P>`; a hold on P *outside* the
   section never zooms); DRAG-4.8 (the states offered — assert
   `data-drag-projection` while moving x by `INDENT` multiples read from
   the client constant, never a literal), DRAG-4.9 / 4.10 / 4.11 (release
   writes at gap + depth), DRAG-4.13 (a done parent), DRAG-4.18 (over-cap
   → no request; a shallower state commits); DRAG-5.9's tab-right and
   over-cap bullets. *Since A3:* Nathan approved internal tests for
   DRAG-4.8–4.11 and 4.18, so they're no longer gaps. Whether they get an
   E2E anyway is item 8's call. The parts those tests don't cover were split
   out as DRAG-4.32 (the over-cap cue, from 4.18) and DRAG-4.33 (the states
   below a nested last item, from 4.11), and are routed here with DRAG-1.21,
   4.13 and 5.9. *Since Story 8.1,* DRAG-1.21 is retired: a hold on the
   Card from its column lands in the section, which is DRAG-1.35's, in
   item 10. `dragGesture.ts` gains a `tabBy(n)` that moves the
   pointer horizontally by `n × INDENT`. Story 6 ships the
   `data-drag-projection` hook these assert against. Also Story 6 Phase C's
   carried Stub: the overlay's `data-drag-overlay-form` is `stub` once
   zoomed into a Card and during a Stub's own drag, and `short-card` again
   after a pop-out to a column.

5. **Test-plan parameter drift.** ✅ Done in A3 batch 3: the bands cases
   now use shortCard's `h` and `gap` in place of `GHOST_H`.

6. **Deferred from Story 6.1** (ledger rows L1-1b and SW-5, 2026-09-24):
   - **The quarter helpers.** `dragGesture.ts::topQuarter`/`bottomQuarter`/
     `atFraction` aim at "which half of the card", a rule Option A retired
     (the lean picks the side now). Re-aim the specs that use them (4 use
     `topQuarter`, 1 `bottomQuarter`), or retire the helpers.
   - **Seven unread `data-*` attributes.** Read them in a spec or delete
     them: `data-drag-overlay-form`, `data-drag-zoom-candidate`,
     `data-drag-zoom-phase`, `data-drag-projection` and
     `data-placement-valid` (written ahead of this story's E2E), plus
     `data-active-context` and `data-inversion-count`, which have no
     reader at all.

7. **E2E specs that bypass helpers that exist** (Story 6 + 6.1 audit #17,
   `docs/archive/code-quality-audit-epic-3-5-story-6.md`). This story
   re-touches each of these specs anyway, so fold them in then:
   - `drag-column-bands.spec.ts` re-rolls what `dragGesture.ts` and
     `seed.ts` provide: `popThrough` and its hard-coded `+ 2000` margins
     redo `clocksMargin` / `awaitPoppedOut`, `columnKeyOf` redoes
     `columnForWorkphase`, and one locator redoes `dragMachine`.
   - A column's drag-region element is located four ways, and two of them
     are both called `regionOf` with different meanings
     (`drag-column-bands.spec.ts`, `drag-card-zoom-in.spec.ts`). → one
     `boardLocators.ts::dragRegion(scope, key?)`.
   - `item-repositioning-cross-column-dnd.spec.ts` re-rolls `article` /
     `column` about 30 times.
   - `drag-5-stub-detach.spec.ts` repeats
     `itemRow(...).getByRole('button')` seven times.
   - The two skipped zoom-in cases in `drag-card-zoom-in.spec.ts` differ
     only by target column: one parameterized case.
   - **Split `drag-column-bands.spec.ts`** (A6 first-run audit #43,
     `docs/audits/code-quality-audit-a6.md`; routed here by Nathan,
     2026-10-21). At 816 lines it holds three test-plan suites: the DRAG-3
     band cases and the DRAG-1 context and popping cases, mixed in one
     describe (`:235–732`), and the DRAG-6 preview describe (`:734–816`).
     Move its helpers (`:46–233`) to a `tests/helpers/` module first, then
     give each suite its own spec, each with its own `test.use` viewport.
     It goes with the bullets above, since they rework the same helpers.
     - **Since then** (the A6 re-run's #26,
       `docs/audits/code-quality-audit-a6-rerun.md`; Nathan, 2026-10-23):
       DRAG-6.6's test (`:820–857`) made it 858 lines. The DRAG-6 describe
       (`:737–857`) uses only ten of the shared helpers, so it comes out
       cleanly with its `delayMoveResponses`. DRAG-1 and DRAG-3 share tests
       (`:414, 628`), so the split may stop at DRAG-6. The spec also looks
       up a column by its entry workphase by hand five times (`:109, 110,
       129, 343, 344`), beside `seed.ts::columnForWorkphase`, whose failure
       names the workphase.

8. **The flakiness call, made explicitly.** For each precise-move case
   the reconciler proposes automating, decide whether a real pointer
   sequence against pixel geometry and timer margins is worth keeping in
   the suite, or whether the case is better served by a `dragGesture.ts`
   improvement, a state-machine unit test, or a manual note. Record the
   decision per case; "flaky, kept anyway" is not an allowed end state.

9. **Deferred from Story 7** (Nathan, 2026-10-28): the specs two Story 7
   cases still lack. The defect that blocks some of them, a Free Card
   that doesn't follow the cursor once it has zoomed into a section, is
   Story 8.2's, which Story 8.1 fixes.
   - **Routed here by ID:** DRAG-7.13's first clause, the hold by a Free
     Card from outside `P`, which needs the fix. And DRAG-7.10's three
     misses: its item from outside `P`, which needs the fix too; "bounded
     by `P`'s box", which is DRAG-1.28's rule; and the distance term
     against the modal's box (`popDistancePx` above 0), which a
     `popSession.test.ts` case would close.

10. **Deferred from Story 8.1** (Nathan, 2026-10-29): the drag specs its
    test reconciliation found missing or too weak
    (`docs/audits/test-reconciliation-story-8-1-codex-trial.md`). Story
    8.1's plan lists the specs it skipped, under Living-docs handoff. Story
    8's close-out Reconciler run settles the final list by ID, since later
    8.N stories can change it; this is its starting point.
    - **Specs that pass but miss a clause:**
      - **DRAG-5.4:** the reparent spec counts no writes. It would pass if
        a detach were committed on the way out and an attach on release.
        Observe no request before the release, and exactly one after.
      - **DRAG-1.3:** no spec shows the carried copy following the cursor
        once it has popped out to Board. The context labels don't show it.
      - **DRAG-1.14 / DRAG-1.19:** the yank spec in
        `drag-5-stub-detach.spec.ts` moves in many pointer samples
        (`hoverTo`). A true one-sample yank from a section to Board, the
        two-pop cascade, is DRAG-1.19's and has no spec.
      - **DRAG-7.11:** the isolation spec seeds `NO_POP`, so it never
        shows the pop-out clock running over the Card under the backdrop.
        Story 8.1's Phase 5 adds the clock's unit test. A surface check
        is needed only if the Reconciler still finds the case short.
    - **Skipped specs to rework or delete:** DRAG-5.13's pop-out test;
      DRAG-7.2 and 7.6's three `pullOutAndZoomBack` tests; DRAG-7.6, 7.10
      and 7.11's pop-out test; DRAG-7.10 and 7.18's reopen test; DRAG-7.14's
      padding test, which now contradicts the rule; and
      `drag-card-zoom-in.spec.ts`'s two.
    - **Cases whose surface path has no spec yet,** new or revised by the
      fold: DRAG-1.5, 1.16, 1.18, 1.19, 1.28, 1.35; DRAG-3.20, 3.22;
      DRAG-4.1, 4.3, 4.5, 4.12, 4.13, 4.15, 4.17, 4.19, 4.20, 4.30, 4.34;
      DRAG-5.1, 5.10, 5.13, 5.15; DRAG-7.2, 7.6, 7.10, 7.14, 7.18, 7.31.
      Some may close sooner through unit tests and approved internal
      pointers.

**Exit criteria:** no `test.skip` / `test.fixme` in `tests/`; `npm run
test:e2e` and `npm run test:unit` green; every case routed here (items 1,
9 and 10) is `Automated` or `Manual`; the epic-done checklist's Tests items
checkable.

**Depends on:** Stories 5–7 and every Story 8.N (the gesture and its
thresholds stop moving). **Blocks:** the epic's ✅.

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
  *Since Story 8.1:* there's no Card layer to auto-place. The zoom into
  the Card seeds both outcomes: an item from outside at the last gap, as
  the last child, and the Card's own Stub at its own slot, where a release
  writes nothing.

- **No two-layer pop out of Descendants.** The design doc floated a
  special rule letting Descendants pop straight to the column — possibly
  as its *only* pop-out, on the view that stopping at the Card layer
  (whose within-action is auto-place) has little value on the way out.
  Rejected: every pop is exactly one layer (§1.1 rule 2), and the
  distance term of the pop-out clock is expected to make a decisive yank
  fire both pops back to back without a special case. The Card-layer
  stop stays a real, if brief, state with a defined release meaning.
  *Reversed by Story 8.1* (Nathan, 2026-10-26 and 2026-10-28): the Card
  layer is gone, so a pop out of Descendants lands in the column. That's
  still one layer, with none left between them.

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
