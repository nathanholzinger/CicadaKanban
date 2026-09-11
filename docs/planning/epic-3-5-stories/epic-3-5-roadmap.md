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
  to all descendants. Because a board is scoped to one workflow, any
  cross-project drag on a board is between projects already sharing that
  workflow — so workphases stay valid and no cross-workflow case arises here.
  (Cross-workflow moves belong to Epic 7's Sheet-level "move to project".)
- **Attached children keep Epic 3.2's model unchanged** — they never receive
  `completedAt` and always keep their position. Reparenting onto a done Card
  already works; a Stub under a done parent reads as done by deriving it from
  the inherited terminal workphase, storing nothing new.
- **Done columns accept attach-drops and card-drops, but not positioned
  inserts** — free done items have `position = null`, so they can't serve as
  anchors. A done Card's Stubs *are* anchorable.
- **Depth cap:** a target at depth `D` is a valid parent only if
  `D + 1 + draggedSubtreeHeight <= cap`, with root items at depth 1. Enforced
  at the UI and API levels; never in the schema.
- **Invalid targets are never poppable** — the UI must not allow popping into
  a context that would fail on drop.
- **No Zod in this epic.** Request validation stays hand-rolled the way the
  existing routes do it. Zod lands in Epic 4 (see
  `docs/planning/epic-4-decisions.md`) and will pick up the move endpoints
  then — Story 1 should not adopt it early.

---

## Stories

### Story 1 — Server: atomic reparent-with-placement
**Goal:** `PATCH /items/:id/move` accepts parent and attachment changes
alongside workphase and placement, so one gesture commits in one transaction.
Adds first-in-list placement, the `projectId` cascade, the depth-cap guard, and
lifts the same-project restriction.

Also folds in the **test-helper extraction** (`tests/helpers/dragGesture.ts`),
so every story after this writes drag E2E against a shared helper rather than
adding a fourth and fifth hand-rolled copy — see `epic-3-5-decisions.md` Q2.

**Depends on:** nothing. **Unblocks:** Stories 4, 5, 6.
**Verified by:** API tests alone — no UI required.

**Needs attention** (flagged by test planning, 2026-09-10 — see
`docs/test-plans/item-attachment/INDEX.md`):
- **Depth-cap semantics for an already-over-cap subtree.** The wiki says
  "only a gesture that would *increase* depth past the cap is refused," but
  the formula `D + 1 + h <= CAP` evaluates the *resulting* depth regardless
  of direction — for a subtree already taller than `CAP`, moving it to a
  shallower parent can pass one reading and fail the other. Pick one, write
  it into `wiki/item-attachment/` §8, and make Story 2's classification use
  the same reading. (ATT-4.7 covers only the uncontested parts until then.)
- **Detached descendants are in scope for both the `projectId` cascade and
  `draggedSubtreeHeight`** — confirmed by the PO, but the wiki only says
  "entire descendant subtree." Add the explicit sentence to §8/§9 so the
  guard and the cascade are built to it (ATT-4.5, ATT-5.2).
- **A parentless "attach" request** — the wiki says a top-level item is
  always Free but not whether setting the attachment flag with no parent is
  *rejected* or *silently ignored*. Decide and record in §1 (ATT-1.1).
- **An anchor outside the item's resulting scope** — `wiki/item-positioning/`
  §7.1 says the server "validates the anchor's scope against where the item
  will be," which implies a rejection path but never states it. Confirm it
  rejects (and, per atomicity, commits nothing) and say so (TC-7.10).

---

### Story 2 — Drop-target validity + relationship overlays
**Goal:** decide, at drag start, what every visible target *is* for the item
currently being carried — valid, cycle-forming, depth-capped, or inert — and
show it. Free descendants get the green relationship overlay; depth-capped
targets get the grey one. Replaces the current blanket exclusion of Stubs from
Card drags with these rules.

**Depends on:** Story 1 (depth rules). **Unblocks:** Stories 3-6.
**Verified by:** pick up a Card, assert which targets render green / grey /
inert — no drop needed.

**Needs attention** (flagged by test planning, 2026-09-10 — see
`docs/test-plans/board-drag-interaction/INDEX.md`):
- **What is Inert?** `wiki/board-drag-interaction/` §4 defines it as "not a
  target for this drag at all" but names no example, so no test case asserts
  anything is Inert. Name at least one intended Inert target (or state that
  the set is empty for now) so the classification has a fourth testable
  state.
- Classification must use the same depth-cap reading Story 1 settles (above).

---

### Story 3 — Pop state machine + Card→Column drop bands
**Goal:** the core interaction model. Cards stay locked to their context until
the cursor pulls them out, then pop and follow freely. Includes the
configurable dev/test panel for thresholds and overlay colors, and the column
drop bands (commit-before-first / commit-after-last / pop-eligible middle) as
the first gesture riding on it.

Merged deliberately: pop *feel* can't be evaluated without a gesture exercising
it, and column drops are the simplest one.

**Highest-risk story.** Axis-lock toggling mid-drag isn't native to dnd-kit's
declarative modifiers — worth prototyping before committing an estimate.

**Depends on:** Story 2.
**Verified by:** automated state-transition cases; **feel is manual**, per the
coverage split in `epic-3-5-decisions.md` Q1.

**Needs attention** (flagged by test planning, 2026-09-10 — see
`docs/test-plans/board-drag-interaction/INDEX.md`):
- **`wiki/board-drag-interaction/` §10 describes the pre-response state two
  ways.** It opens with "the board previews a drop ordinally: the item is
  placed at the ghost's index" and closes with "the board may briefly show
  its pre-drop order until the response lands … a deliberate tradeoff
  carried over from Epic 3.2." Under the amended client-side role
  (`wiki/item-positioning/` §2) those are different behaviors. DRAG-6.1 is
  written to the ordinal-preview statement. If the closing paragraph is a
  stale carry-over, delete it; if it describes a real transient (e.g.
  between release and preview render), say when it applies. This is the
  same question as the "Optimistic preview" open item below.

---

### Story 4 — Card → Card = attach
**Goal:** the headline gesture. Dropping a Card onto another Card attaches it
as a Stub at the dropped slot, inheriting the parent's workphase. Covers the
cross-project case and attaching to a done parent.

**Depends on:** Stories 1-3.

---

### Story 5 — Stub → out = detach
**Goal:** the reverse direction. A Stub can be dragged out of its parent Card,
becoming Free and landing where dropped, while keeping its parent relationship.
Unblocks the drag-out path currently held closed in `useBoardDnd`.

**Depends on:** Stories 1-3.

---

### Story 6 — Stub → Stub hierarchy placement
**Goal:** placement *within* the descendant hierarchy, using the same
three-way ruleset as the project sidebar — above an anchor as a sibling, below
as a sibling, or below and indented as a child — with overlapping quick-drop /
hover-to-pop bands.

Kept separate from Story 4 despite sharing Story 1's server surface: the UI
context and drop resolution genuinely differ.

**Depends on:** Stories 1-3.

**Needs attention** (flagged by test planning, 2026-09-10 — see
`docs/test-plans/board-drag-interaction/INDEX.md`):
- **Option 3 ("below an anchor, indented right → child of the anchor")
  settles the parent but not the slot.** Where among the anchor's *existing*
  children does the item land — first, last, or anchored to the child
  nearest the cursor? Record it in `wiki/board-drag-interaction/` §7.2;
  DRAG-4.10 asserts parent and attachment only until then.

---

### Story 7 — Depth cap determination + "See X children"
**Goal:** derive the real cap empirically from what the project sidebar can
display comfortably, then build the overflow affordance for hierarchies that
exceed what a Card can show.

Deferred beyond this story: any solution for depth so great that indenting each
level no longer fits the sidebar or the overflow modal either.

**Needs attention** (flagged by test planning, 2026-09-10 — see
`docs/test-plans/board-drag-interaction/INDEX.md`):
- **The "see X children" hold threshold is unnamed.** `wiki/board-drag-interaction/`
  §9 says dragging a Stub over the placeholder and "holding past a
  threshold" opens the modal, without saying whether that is the pop
  `THRESHOLD` or its own dev/test-panel parameter. Decide, expose it in the
  panel accordingly, and name it in §9 (DRAG-5.6 parameterizes on
  "whatever the panel exposes").

---

### Story 8 — Visual cue polish
**Goal:** settle the final look of the relationship overlays and any other
"this item relates to these items" cues. Explicitly deferred to late so the
cues are tuned against real, working gestures.

---

### Story 9 — Free-item reparent keeping Free status
**Goal:** decide whether a Free item can be reparented while staying Free —
implement it, defer it, or conclude it isn't a board action that makes sense.

Last by design: cheap on the server (a Free item's position scope is
parent-independent, so no recalculation is needed), but it adds a third
drop-meaning to disambiguate in the UI, and that's only judgeable once the
other gestures exist. Note the trap recorded in the decisions doc — reparenting
without explicitly passing `isAttached: false` silently attaches.

---

## Open items

- **Expanded-mode columns:** when a column renders each workphase as its own
  sub-row, do those rows each get their own drop bands and pop behavior, or is
  expanded mode out of the pop model this epic? Sizes Story 3; doesn't move a
  boundary.
- **Optimistic preview:** Epic 3.2 shipped without optimistic position preview.
  Ghost cards may raise that bar and reopen the fuller-preview option 3.2 left
  on the table. Surfaces in Story 3.
