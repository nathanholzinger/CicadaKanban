# Epic 3.2+ Deferred Decisions — Item Positioning & Column Recalculation

Technical decisions and discussion captured so `mvp-roadmap.md` can stay
high-level. Reference doc for whenever this positioning model is actually
built. Surfaced as a tangent while closing out the last Epic 3 audit finding
#27 sub-note ("stale position after detach"), which grew into a much larger
design conversation about how item positioning should work relative to
attach state, boards/columns, and column display-mode changes. Sequenced as
**Epic 3.2** — after Epic 3's core attach/detach model, but explicitly
**before Epic 3.5's drag gesture work**, since Epic 3.5 builds on the same
`useBoardDnd` layer this positioning rework would change; doing the gesture
work first would mean redoing it.

Recorded 2026-08-05. **Nothing below is implemented — this is a discussion
capture, not a decision.**

> **Resolved 2026-08-07** — implemented per
> `.claude/plans/please-adopt-the-architect-functional-chipmunk.md`.
>
> - **Q1 (position storage)**: stays a single item-owned scalar (Part 1 of
>   the plan) — no per-board table. The "boards are a pure presentation
>   layer over `items.workphaseId`" principle was extended to position:
>   it's the same *kind* of fact about an item (current state), just a
>   second axis of it. A future personal-boards concept would overlay this
>   with a sparse per-`(item, boardId)` table falling back to the scalar,
>   never replace it — see the deferred-ideas section below.
> - **Q2 (what triggers recalculation)**: resolved by finding that no
>   forced regroup mechanism is needed at all. Union-sorting a merged
>   column across its covered workphases (Part 4) *is* the recalculation —
>   "grouped by workphace rank" is an emergent tendency from normal usage
>   (create early-rank, advance forward over time), not an actively
>   enforced guarantee. A real reindex mechanism (Part 5) still exists, but
>   for a different reason: float-precision buildup and magnitude drift,
>   not display grouping.
> - **Q3 (merged-column drag bug)**: fixed as a byproduct of Part 4's
>   "is the active item already a member of the target column's covered
>   set" check, not a standalone patch — exactly the outcome this doc
>   guessed at ("arguably a bug worth patching regardless... left alone
>   since it'll be superseded once this feature lands anyway").
>
> Everything below is preserved as the discussion record that led there —
> several open questions here (the merged-column collapse-to-
> `entryWorkphaseId` bug, the "stale position after detach" origin trigger)
> read very differently once you know where the conversation ended up, but
> the reasoning trail is worth keeping.

---

## Confirmed: none of the desired behavior exists today

### 1. `items.position` is workphase-scoped — never board- or column-scoped
`items.position` belongs to the data layer (a workphase), never the
presentation layer (a board or its columns). This is a deliberate, documented
architecture decision: *"Items never reference a board or column directly —
boards/columns are a pure presentation layer over `items.workphase_id`"*
(`client/CLAUDE.md`; see also `architecture-data-modeling` /
`architecture-board-column-workflow` memory notes). The user's expectation —
"reordering an item on one board shouldn't affect another board" — is not
possible today: there is exactly one `position` value per item, full stop,
shared by every board that happens to show it. See the Q1 proposal below.

### 2. Attached-child sibling reordering — partially exists, not manually alterable
`lib/useItemManagement.ts::getAttachedChildrenFrom` already scopes and sorts
attached children by `position` among siblings of the same parent — so the
*read* side already matches "position relative to siblings." But there is no
*write* path: `AttachedChildRow` (`KanbanCard.tsx`) explicitly blocks drag
(`onPointerDown={e => e.stopPropagation()}`), and no reorder call is wired to
it anywhere. So attached children get whatever position they were created
with (in creation order) and can never be manually reordered relative to
their siblings today.

### 3. Detached-child free positioning "regardless of hierarchy level" — already works
`getWorkphaseItemsFrom`'s filter is `workphaseId === X && !(isAttached &&
parentId)` — this **includes** detached children in the exact same flat,
position-sorted list as true top-level items in that workphase, and they go
through the same drag-reorder path (`computeSameWorkphaseReorder` /
`PATCH /api/items/reorder`) as any other item there. No gap here — this part
of the request is already current behavior.

### 4. Merged-view interleaved manual ordering across workphases — doesn't exist, and today's actual behavior is worse than "missing"
`boardDndUtils.ts::resolveDropWorkphaseId` resolves **any** drop target
inside a merged column to `col.entryWorkphaseId` — the column's *first*
covered workphase — regardless of which workphase the hovered card actually
belongs to. Concretely, in a merged Todo+In Progress column:
- Dragging a Todo item onto an In Progress card: target resolves to Todo
  (already the item's own workphase) → treated as a same-workphase reorder →
  `computeSameWorkphaseReorder` looks for the hovered card's id inside
  Todo's own item list, doesn't find it (it's an In Progress item) → returns
  `null` → **the drag silently does nothing.**
- Dragging an In Progress item onto a Todo card: target resolves to Todo,
  which differs from the item's actual workphase (In Progress) → treated as
  a **cross-workphase move** → the item's `workphaseId` is genuinely changed
  to Todo. **A visual rearrangement silently becomes a real status change.**

Neither is "manually interleave while keeping true workphase membership" —
neither is a deliberate design, either; it falls out of the target-resolution
always collapsing to `entryWorkphaseId`. See Q3.

### 5. Recalculation on displayMode/range change — doesn't exist at all
`columns.ts` PUT only updates the column row's own `name`/range/`displayMode`
fields — nothing touches any item. `ColumnEditorModal.tsx` calls that PUT
with no other side effects. Toggling merged↔expanded, or widening/narrowing
a range, changes nothing about any item's stored `position` today.

---

## Desired behavior (user's design, recorded 2026-08-05)

- **Attached child:** position alterable relative to siblings (other children
  of the same parent) — not yet possible via the UI (#2 above).
- **Detached child:** position alterable relative to *all* other items in the
  same workphase, regardless of hierarchy level — already true (#3 above).
- **Item position is a board-level concern, not an intrinsic item property**
  — see the Q1 proposal below. Reordering an item on one board must not
  affect its order on another board.
- **Merged-mode grouping-then-free-reorder:** whenever a column becomes or
  stays "merged" across a recalculation trigger (see below), positions
  recompute so items group by workphase rank first — every item from the
  earliest covered workphase, then every item from the next, etc. — while
  preserving each group's *existing relative internal order* rather than
  resetting to creation order. After that recompute, manual reordering can
  freely interleave items across workphases (a genuinely new capability;
  contradicts today's no-op/silent-real-move behavior in #4).
- **Expanded mode** recomputes back into one independent bucket per
  workphase, again preserving each bucket's relative internal order from
  whatever the prior (merged) arrangement was — not resetting anything.
- **Worked example** (Todo.1, Todo.2, In Progress.1, In Progress.2 in a
  merged column):
  1. Merged, freshly grouped: `Todo.1, Todo.2, InProg.1, InProg.2`.
  2. User manually interleaves (now possible per the new capability):
     `InProg.2, Todo.1, Todo.2, InProg.1`.
  3. Switch to **expanded** → recalculates into two buckets, each preserving
     its members' relative order from step 2: `[Todo.1, Todo.2]` and
     `[InProg.2, InProg.1]`.
  4. Switch back to **merged** → recalculates again: group-by-workphase-rank
     (all Todo before all In Progress), but within each group keep the order
     from step 3: `Todo.1, Todo.2, InProg.2, InProg.1`. Note `InProg.2` stays
     ahead of `InProg.1` (preserved from expanded), but the interleaving from
     step 2 is gone (regrouped by phase) until manually reordered again.
- **Recalculation triggers:** (a) merged ↔ expanded `displayMode` toggle, and
  (b) a column's covered-workphase *set* changing while `displayMode` stays
  merged (the range widens/narrows, e.g. going from covering only "Todo" to
  covering "Todo + In Progress," or back) — same regroup-and-preserve-order
  recalculation in both cases.
- **No recalculation needed while staying expanded**, even if the range
  changes — each workphase already has its own independent bucket/ordering
  in expanded mode; widening or narrowing which workphases are *covered*
  doesn't disturb any existing bucket's internal order.

---

## Open questions to resolve before implementing

### Q1. Proposal: make position a board-level concern — pros and cons to weigh in Epic 3.2

The user's framing: at the relational data layer, an item legitimately
relates to a workphase, not a board — that part of today's model is correct
and shouldn't change. But a **board** is a configuration of *how data is
presented*, and ordering is one of those presentation configurations — so
position arguably belongs to the board's presentation layer, not the item
itself. Under this proposal, each `(item, board)` pair would carry its own
position, and *which column/bucket* an item falls into within a board is
still derived from `workphaseId` as today (columns stay a pure range-over-workphases
computation) — only the **order within whatever bucket you're looking at**
becomes board-specific. This would also cleanly explain the merged↔expanded
recalculation behavior above: it's not two different storage forms, just one
`(item, board)` position value that gets recomputed at transition points to
reflect a new intended sort order.

**Pros:**
- Matches "position is a presentation/view concern, not an intrinsic item
  property" — consistent with the existing "boards are a pure presentation
  layer" principle, since positioning would live *in* that layer instead of
  leaking onto the core entity.
- Directly satisfies "reordering on one board doesn't affect another" —
  each board's positions are independent by construction.
- The merged/expanded recompute logic falls out naturally, since it's
  inherently a per-board-column computation already.
- Keeps the item entity itself free of UI-layer concerns (echoes the
  established "entity outlives its references" / assignment-vs-authorship
  separation already applied elsewhere — see `architecture-data-modeling`).

**Cons:**
- Real schema addition: a new table (e.g. `item_board_positions`, keyed by
  `(itemId, boardId)`) rather than a scalar column, with a join on every
  board read instead of a plain column read.
- **Fallback/default question:** what position does an item get on a board
  that has never customized its order — the item's creation order? A lazily
  materialized row the first time that board is viewed? Every workflow's
  default 1:1 auto-bootstrapped board would need *some* answer here, and
  most workflows probably only ever have one board — is per-board storage
  overkill for the overwhelmingly common single-board case?
- **Storage multiplies with board count:** an item visible on N boards needs
  N position rows instead of 1. Probably fine at this app's scale, but worth
  naming.
- **Cascade complexity:** `cascadeWorkphaseToAttachedDescendants` and the
  reparent/move paths already write `workphaseId` directly; would they now
  also need to touch position rows across every board showing the item, or
  is a stale-until-next-recompute position acceptable there too?
- Two boards that both show the *same* merged range would now legitimately
  diverge in order — intentional per the requirement, but worth naming as a
  real UX consequence (not a bug) so it's a conscious tradeoff, not a surprise.

**Not yet decided:** whether to build this, or find a lighter-weight
approximation. Discuss in Epic 3.2.

### Q2. What precisely triggers a recalculation?
Suggest unifying both triggers the user described into one rule: **recompute
whenever the ordered list of workphases a merged column's items get grouped
into changes** — covers both the displayMode toggle and a range edit while
staying merged, with one rule instead of two special cases.

### Q3. Fix today's confusing merged-column drag behavior on its own, or only as part of this feature?
Independent of the larger feature, the current behavior in #4 above (silent
no-op in one direction, a silent real workphase change in the other) is
arguably a bug worth patching regardless of whether/when the fuller
interleaved-ordering feature gets built. Decide whether that's worth a
standalone fix now, or left alone since it'll be superseded once this
feature lands anyway.

---

## Deferred ideas surfaced while resolving this epic (not built, for whenever picked up)

Recorded 2026-08-07, alongside the resolution banner at the top of this doc.
None of this is scoped or scheduled — captured here so it isn't lost before
whichever future epic actually picks it up, matching the treatment already
given to `epic-3.5-decisions.md` / `epic-5-decisions.md` / `epic-6-decisions.md`
/ `epic-8-decisions.md`.

- **Personal boards.** Team-shared boards (what got built) vs. an
  individual's own divergently-ordered view of the same workflow. Extensive
  discussion landed on: not needed for MVP (industry precedent — Jira,
  Linear, and GitHub Projects all share manual order globally rather than
  per-view, even GitHub Projects, which is architected explicitly around
  multiple independent views); a real future desire nonetheless, but one
  that splits into two different shapes depending on what "personal" ends
  up meaning — (a) truly per-authenticated-user, which is blocked on a
  multi-user/auth epic that doesn't exist on the roadmap at all, or (b) just
  a second board *type* usable today by a single operator for a scratch/
  triage view, independent of who's logged in. Whenever this is scoped,
  resolve which of (a)/(b) is actually meant before designing further — the
  original motivating examples (different team members wanting different
  drag orders) describe (a), but only (b) is buildable against this
  codebase's current state. Mechanically: a sparse per-`(item,
  personalBoardId)` position-override table, falling back to the item's own
  `position` scalar for anything it doesn't cover — additive on top of Part
  1's design, not a migration away from it. Worth a naming check against
  Epic 6's "personal task aggregation" (saved filter views) too, in case
  they turn out to be the same concept wearing two names.
- **Generation-tagging for done-item recalculation.** A per-recalculation
  epoch marker + composite `(generation, position)` sort, which would let
  done items *also* be periodically compacted later, the way active items
  are (Part 5) — not needed now because Part 6's actual resolution
  (`completedAt`-based ordering, no stored position for done items at all)
  sidesteps the need entirely rather than just tolerating it. Cleanly
  layerable later if `completedAt` ordering ever stops being sufficient at
  some larger scale (existing done items would backfill as generation 0).
- **A third "inbox" status bucket** (pre-workflow items), alongside
  active/done. Floated as a possible third leg of the active/done split,
  but turned out unnecessary — the active/done split alone fully resolved
  the magnitude-drift problem it was raised for. Still a plausible future
  extension on its own merits (not required here); flagged for the same
  naming-collision check as personal boards, this time against Epic 6's
  "Inbox" (saved cross-project views) concept specifically.
- **Column sort-by-computed-field** (e.g. "sort this column by time in
  column" rather than manual drag order). Settled in principle during
  discussion — dragging while a computed sort is active should disable
  drag-reorder entirely (matching this app's DnD-first interaction model)
  rather than silently detaching from the sort or requiring a confirm
  dialog, because a computed sort's value comes from being trustworthy as a
  monitoring tool, and a silent detach undermines that. No sort feature
  exists yet to attach this decision to; captured so the rationale doesn't
  need re-deriving when one does.
