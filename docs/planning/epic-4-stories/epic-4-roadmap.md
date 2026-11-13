# Epic 4 — Story Roadmap: Quick Items and the Status Rework

High-level story separation for Epic 4. Each story below is a discrete piece
of work that carries its own test-plan cases. Implementation detail lives
outside this file: each story gets its own plan under this folder when it's
picked up.

**Status: planning (opened 2026-11-12).** Most of the status model is
ruled (Settled ground rules). The stories were redrawn after those
rulings, and stay a draft until the questions marked "Open, next" are
ruled.

Source material:
- Design doc: "Quick Items and Buckets" (Google Docs, linked from
  `docs/planning/mvp-roadmap.md`)
- Open questions and leanings: [`../epic-4-decisions.md`](../epic-4-decisions.md)
  §9–§13. That file stays as written. A ruling is recorded here, by the
  question's number below, and names the section it answers.
- Epic entry: `docs/planning/mvp-roadmap.md` § Epic 4

---

## Sequencing

- **Planning runs ahead of the build.** Epic 3.5 is still open (Story 10's
  batches 4c–4h), and the roadmap puts the API contract epic (Zod +
  OpenAPI) between it and this one. Nothing here is built until Nathan
  says the order has come round to it.
- **The API contract epic comes first, by the roadmap.** Stories 1 and 3
  change more request and response shapes than any others here, so they
  gain the most from being written on its schemas.
- **Each story follows the standard order:** wiki, then test plan, then
  code and Vitest, then the QA Engineer's Playwright tests, then the
  Reconciler and the audit.
- **The order across this epic and its two neighbours** (Nathan,
  2026-11-12):
  1. **What a create and an edit take** is decided:
     [`positioning-on-create-and-edit.md`](../tech-debt-stories/positioning-on-create-and-edit.md),
     a tech-debt story with no build of its own.
  2. **The API contract epic.** Its items and projects schemas build
     that answer.
  3. **Stories 1 and 2 here,** the status model. Story 1 follows step
     1's answer for which write may name a status, a kind or a
     workphase.
  4. **Story 3 here, two position values.** It was the second half of
     that tech-debt story, and Nathan folded it into this epic on
     2026-11-12. It follows the status model because group 1 settles
     which items hold a Free position. It precedes the Quick Item
     stories so each of their new writes states both values once.
  5. **Stories 4–6 here:** Stub checkboxes, Free Quick Items, and a
     Quick Item that completes itself.
  6. **Story 7 here, the migration's cleanup,** at any point after
     Story 2. It depends on nothing else.

---

## Settled ground rules

Rulings that apply across every story. Nathan's, 2026-11-12, unless a
rule says otherwise. Each names the question it answers.

**The status model**

- **G1. Every item holds one of three statuses:** `backlog`, `active`
  or `done`, whatever its kind (Q1). The names are working names (Q22).
- **G2. Backlog is the default.** An item never reads as having no
  status. Whether that's a stored default or a null read as Backlog is
  Story 1's plan's call. The Architect recommends a required column that
  defaults to `backlog`, so no reader has to handle a null.
- **G3. A workflow subdivides Active, and nothing else.** Backlog and
  Done sit outside every workflow. A workflow may still have a workphase
  of its own named "Backlog" or "Done". It's an ordinary workphase: an
  item moves from the Backlog status into it, and out of it to the Done
  status.
- **G4. An item owns its status and its kind, quick or full.** A full
  item also owns its workphase (Q1).
- **G5. The terminal flag goes** (Q4). Story 1 sets each item's status
  from today's data, so an item in a terminal workphase becomes Done,
  and drops the seeded templates' "Done" phases. Story 7 deletes the
  terminal workphases and the flag's database columns. Until then a
  board can show its old "Done" workphase beside the new Done column,
  which is awkward and harmless (Story 1's plan, D6). It retires
  boards-columns-unsorted §6's rule that no column mixes done and
  active, the terminal-flag refusal (BCU-3.4), TC-6.11 and TC-6.13. The
  Test Planner retires the cases once the wiki drops the rules.
  `completedAt` stays, set when a Free item becomes Done.
- **G6. A full item made Active with no workphase named takes its
  workflow's first workphase** (Q3).

**What a board shows**

- **G7. A board reads an item's status first, then its kind, then its
  workphase** (Q7). The needs-attention column holds only a Free, Active,
  full item whose workphase the board can't place. A Backlog item, a Done
  item and a Quick Item are never in it.
- **G8. A board shows Done, and may show Backlog** (Q5). Done is
  probably required and Backlog probably optional, a board's own choice.
  Neither merges into a column with a workphase, for now.
- **G9. A move between workflows keeps today's behavior** (Q8). This
  epic changes nothing about it, and the wiki, the test plans and the
  tests go no further into it than they do now. It's deferred to the
  Sheet's epic, which adds the first control that makes such a move.
  (Nathan wrote "story 7"; read here as that epic, the roadmap's Epic
  7.)
  - **The board decides which workphases it can place,** and an item
    holding any other shows in needs-attention, as today.
  - **One thing does change:** a write that names a workphase for an
    item whose project uses no workflow is refused with a 400. Today
    it's accepted. This is ATT-5.11's first half.
  - **ATT-5.11's second half stays unanswered,** and goes to the Sheet's
    epic by ID.

**The Done column**

- **G15. A Card set back down in its own Done column writes nothing,**
  as today, and a Done list takes no manual order (Q10).
- **G16. A Done list reads newest completion first** (Q11). Today it
  reads oldest first. The column will probably get sort controls later,
  and this is the order until then.
- **G17. In a Done list a drag zooms into the Card under the cursor,
  and the list draws no side highlight** (Q12). This is the PO's
  recommendation, as `epic-4-decisions.md` §12 records it.

**Attachment and kind**

- **G10. An attached item is always treated as a Quick Item. A Free item
  is quick or full** (Q9, Q16, Q17). It's treated so whatever its stored
  kind says. Whether attaching changes the stored kind is open, with Q2.
  An attached item's workphase plays no part, so `epic-4-decisions.md`
  §9's question, copy or inherit, no longer arises.
- **G11. An attached item holds a status of its own, and reads as the
  later of its own and its parent's** (Q14). The order is Backlog,
  Active, Done. So it's never earlier than its parent: a parent's move
  to a later status takes each attached descendant that would be left
  behind, and one already at that status or past it is unchanged. The
  move writes nothing to the descendants. A parent moved forward and
  then back shows them as they were.
- **G12. An attached Done item shows where its Free ancestor shows,** in
  that Card's list, drawn as done: struck through, greyed, or another cue.
- **G13. A Free, Active Quick Item shows in the first workphase of its
  project's workflow** (Q15). Its Card has a checkbox that makes it Done,
  and the Card can also be dragged to Done.
- **G14. A create may name a status, a workphase, both or neither**
  (Q29). One that names neither makes a Backlog item (G2). One that
  names only a workphase makes an Active item there, which is what the
  board's add-card in a column sends. One that names Active and no
  workphase follows G6.
- **G18. A Quick Item keeps every feature a full item has today** (Q13):
  its description, labels, comments, attachments and Sheet. Kind changes
  only how its status is set and how it's drawn. The Sheet's epic may
  later make some new features full-item only.
- **G19. A Free Quick Item with attached children becomes Done by itself
  when the last of them is checked** (Q19, option (b)). A full item
  never does, so no Card skips its later workphases. It's the last
  story, and can be cut if the epic runs long. The design doc calls such
  a parent a "quick item bucket".

**What the rulings change that's worth a second look.** These follow from
the rules above. Nathan hasn't ruled them one by one.

- **G2 changes A5a's R5.** A top-level create may still omit its
  workphase (2026-09-30). Such an item is now a Backlog item, where today
  it shows in Unsorted.
- **G10 changes every Stub.** Today a Stub is a full item holding a copy
  of its parent's workphase. After the migration it holds a status and no
  workphase, and the workphase cascade goes.
- **G19 narrows the design doc's "quick item bucket."** The doc lets any
  item whose descendants are all Quick Items complete itself, and under
  G10 that's every item whose descendants are all attached. G19 keeps it
  to a Free Quick Item.

---

## Decisions

Twenty-nine questions. Each has the Architect's recommendation, which is
a starting point and not a ruling. "Lands in" names the draft story that
builds the answer.

| # | Question | State |
|---|---|---|
| Q1 | Where a status lives | Ruled: G1, G4 |
| Q2 | A workphase outside Active, or on an attached item | **Open. Nathan takes it to the PO** |
| Q3 | Made Active with no workphase named | Ruled: G6 |
| Q4 | The terminal flag, and its migration | Ruled: G5. Split between Stories 1 and 7 |
| Q5 | Backlog and Done on a board | Ruled: G8. Placement is Story 2's plan's |
| Q6 | Which items hold a position | **Open.** Nathan leans to the recommendation and wants to pick at it |
| Q7 | What needs-attention flags | Ruled: G7 |
| Q8 | A move between workflows | Ruled: G9 |
| Q9 | An attached item's workphase | Ruled: G10 |
| Q10–Q12 | The done column | Ruled: G15, G16, G17 |
| Q13 | What `kind` changes | Ruled: G18 |
| Q14 | An attached item's status | Ruled: G11 |
| Q15 | A Free Quick Item on a board | Ruled: G13. Whether it drops anywhere but Done is open |
| Q16 | Kinds nesting under kinds | Ruled: G10 |
| Q17 | Kind through attachment | Half ruled: G10. The stored kind follows Q2 |
| Q18 | Where a checked Stub shows | Open, ruled with Q26. Not needed for Story 1 |
| Q19 | A parent that completes itself | Ruled: G19 |
| Q20 | The start datetime | Ruled: out of this epic, to the Tags & Type System epic |
| Q21 | Creating a Quick Item | Open, in Story 5's plan |
| Q22 | The names | Open. Locked before Story 1's build starts |
| Q23–Q28 | Two position values | Open, after Q6 |
| Q29 | The status a create gives | Ruled: G14 |

### Open in the status model

**Q2. Does a workphase outlive Active, or attachment?**
- **State:** open. Nathan wants to discuss it with the PO, as a question
  of what a user expects (2026-11-12). What follows is the Architect's
  input to that discussion.
- Nathan's question: if a user moves an item to Done by accident, or
  attaches it by accident, and then reverts, where do they expect it to
  land? The answer decides whether a last workphase is kept.
- **(a) Cleared.** A workphase is held only by a Free, Active, full item.
- **(b) Kept as a memory.** It's read only for a Free, Active, full item.
  A write that makes the item one again and names no workphase restores
  it if the workflow still has it, and otherwise gives the first.
- **Each slip, and how it's undone:**

  | The slip | The undo | Does the undo name where the item lands? |
  |---|---|---|
  | A full Card dragged to Done | Dragged back to a column | Yes, the column |
  | A full Card dropped on another Card, so it's attached | The Stub dragged out to a column | Yes, the column |
  | A Quick Card's box checked | Unchecked | It needs none: the first workphase (G13) |
  | A Stub's box checked | Unchecked | It needs none |
  | A full Card attached by accident | Detached with the Sheet's toggle | No |
  | A status changed through MCP | Changed back | Today MCP's move names a workphase |

- **The Architect's recommendation: (a).** Every undo a user can make by
  hand in this epic names its landing place, except the Sheet's detach
  toggle. That one already has a rule that works without a memory: the
  item takes the workphase it was shown in, its Free ancestor's (wiki
  item-attachment §2a), or the first workphase when that ancestor holds
  none. So a kept workphase would have no reader yet. It would also go
  stale whenever a workphase is deleted or a project comes to use
  another workflow.
- **When (a) would be reopened:** when the Sheet's epic adds a control
  that reopens a full item without naming a workphase. That's the first
  undo where "back where it was" and "the first workphase" differ.
- **Lands in:** Story 1.

**Q17. Does attaching change an item's stored kind?**
- **State:** half ruled. G10 says an attached item is treated as a Quick
  Item whatever its kind says. Whether the stored value changes is
  undecided, and Nathan expects it to follow Q2 (2026-11-12).
- **(a) Attaching makes it quick, for good.** Detached, it's a Free Quick
  Item until something makes it full.
- **(b) The stored kind is left alone.** It's what the item is when it's
  Free.
- **The Architect's recommendation: (b).** A full Card dropped on another
  Card by accident and dragged back out is a full Card again. It also
  keeps `kind` out of Story 1: until Story 5 every Free item is full,
  and every attached item is quick by being attached.
- **Under either:** an item's kind can also be edited directly while
  it's Free. Full to quick clears the workphase, and quick to full while
  Active takes the first workphase (G6).
- **Lands in:** Story 1 (the rule) and Story 5 (the stored kind).

**Q6. Which items hold a position?**
- **State:** open. Nathan leans to the recommendation and wants to pick
  at it before it's final (2026-11-12).
- **Recommendation:** Backlog and Active Free items share one order,
  "the workflow's items that aren't Done". A move between Backlog and
  Active keeps the item's position. Done items hold none and read by
  `completedAt`, as today.
- **TC-5.15 is fixed here:** the magnitude threshold's `n` counts the
  items that aren't Done.
- **To pick at:**
  - **Where the scope comes from.** Today it's found through the item's
    workphase. A Backlog item may hold none (Q2), so the scope has to
    come from the workflow its project uses, and a project that uses no
    workflow needs an answer of its own.
  - **Whether one shared order is what a user wants.** An item made
    Active lands in its column at the place its Backlog order gives it,
    an order made in a different list. The alternative is two orders,
    with a move between them appended.
  - **Free Quick Items share it,** since they sit in the first
    workphase's column among the full items.
- **Lands in:** Story 1. Group 6 builds on the answer.

**For Story 1's plan,** from rulings whose details weren't ruled one by
one:
- **The migration's items** (G5). The Architect's recommendation: each
  Free item in a terminal workphase becomes Done. Every other Free item
  becomes Active, one with no workphase included, so it stays in
  needs-attention as it shows today and nothing moves out of sight.
  Nothing becomes Backlog by its own status. An attached item stores the
  default and reads as its parent's (G11), so the migration walks no
  tree.
- **Entering Done and notifications** (G5). A workphase can raise a
  notification when an item enters it. A Done workphase that did so has
  no successor, unless entering Done can raise one.
- **A create that names a status and a workphase that disagree** (G14),
  such as Backlog with a workphase. The Architect's recommendation: a
  400.
- **What the API returns for an attached item** (G11): the status it
  stores and the status in effect. A filter by status, such as the
  Inbox's, reads the one in effect, which walks up from each attached
  item, at most to the depth cap.

### Group 4 — Quick Items

**Q15. A Free Quick Item dropped on another column**
- G13 rules where it shows, its checkbox, and its drag to Done.
- **To be decided** (Nathan, 2026-11-12): whether it can be dropped on
  any column other than Done at all.
- **Ruled, if it can:** the drop makes it a full item in that column's
  workphase.
- **Recommendation:** allow it. The alternative is that every other column
  refuses it, which adds a kind of invalid target to the drag's
  classification. A drop on its own first column keeps it quick, and a
  drop on Backlog makes it a Backlog Quick Item.
- **Lands in:** Story 5.

**Q18. Where does a checked Stub show in its parent's list?**
- G12 rules that it stays in the Card and is drawn as done. The design
  doc adds that unchecked items read first and a checked one moves below
  them.
- **(a) It sinks.** A checked Stub reads after its unchecked siblings,
  and returns to its place when unchecked.
- **(b) It stays.** It's drawn as done where it is.
- **Recommendation: (a), with its cost known.** It's the most expensive
  rule here for the drag layer, since a Card's list would no longer read
  in position order. The nearest precedent is the Done list: a checked
  row keeps its position and takes no positioned insert beside it. The
  story's plan sizes it before the wiki is written, and (b) is the
  fallback.
- **Ruled with Q26,** which says which position a Card's list reads
  (Nathan, 2026-11-12). Neither is needed for Story 1.
- **Lands in:** Story 4.

### Group 5 — Scope

**Q19. A parent that completes itself**
- **Ruled (Nathan, 2026-11-12):** option (b), now G19. The other options
  were out of the epic, a setting on any item, and every item, which
  under G10 would let a full Card skip from "In Progress" to Done when
  its last Stub is checked.
- **For Story 6's plan:** does unchecking a child reopen the parent, and
  does a Free Quick Item child count, or only attached ones.
- **Lands in:** Story 6.

**Q20. The start datetime (§10)**
- **Ruled (Nathan, 2026-11-12):** not in this epic. It's deferred to the
  Tags & Type System epic, and `epic-5-decisions.md` holds it.
- **This epic's part** is that Backlog to Active is an ordinary status
  write, which Story 1 gives it.

**Q21. How is a Quick Item created?**
- Which controls offer it, and what a new item's kind defaults to.
- **Recommendation:** decide it in Story 5's plan. Nothing else depends
  on it.

**Q22. The names**
- **The three statuses:** Nathan leans to Backlog, Active and Done
  (2026-11-12), and keeps it an open item to lock before Story 1's build
  starts. The PO needs them one step sooner, to write Story 1's wiki
  page.
- **Two more names to lock with them:**
  - an item's two kinds. Nathan says quick and full; the MVP roadmap's
    entry says `kanban | quick`;
  - the column for what a board can't place. The wiki and the API call
    it Unsorted, with a `needsAttention` flag, and Nathan calls it the
    needs-attention column.

### Group 6 — Two position values

Carried in from `positioning-on-create-and-edit.md` on 2026-11-12, where
these were its decisions 5–9.

**Nathan's direction (2026-10-22):** an item gets at least two stored
positions:
- **its order among its siblings,** all of its parent's children,
  attached or Free;
- **its order among its fellow Free items,** the order the board shows
  today.

**Why, in Nathan's words:** "there will be contexts outside of the board
where all children should be displayed amongst each other regardless of
attached/detached status."

**What it replaces.** wiki item-positioning §1 says an item's position is
one scalar, and §2 compares it in one scope chosen by the item's state:
its parent's attached children, the workflow's Free items, or none. So a
detached child has no place among its parent's other children. That
page's first Open question asks whether a Free child needs one. Nathan's
direction answers yes, and the PO states it.

**Q23. Interleaved, or two lists? And only two values?**
- Epic 3.5's Story 9 note left an alternative open: show a parent's
  children as two lists, attached and Free, and keep one value. It also
  asked whether more than two values are ever needed.
- **Recommendation:** confirm interleaved, which is how the direction
  above reads. Build exactly two values, and no mechanism for a third
  until a third order exists.

**Q24. Each value's scope** (was decision 5)
- The sibling value compares among a parent's children. A top-level
  item's compares among its project's top-level items, or it has none.
  The Free value compares among the workflow's Free items, as Q6 redraws
  that scope.
- **Recommendation for the sibling value:** every item holds one,
  whatever its status, kind or attachment, so it has no null case. A
  top-level item's siblings are its project's other top-level items.
  That is what a project's one position already is, so the two share
  code (root `AGENTS.md`, "One position math layer").
- **Recommendation for the Free value:** its null cases follow the
  status model. Under Q6 as recommended, a Done item holds none, an
  attached item holds none, and every other Free item holds one.
- **Still open under any ruling:** what a project's coming to use a
  different workflow does to its items' Free positions (wiki
  item-positioning's second Open question). Today such an item's scope
  is `"none"`. It's a move between workflows, so G9 leaves it as it is,
  for the Sheet's epic.

**Q25. Which writes set which value** (was decision 6)
- A reorder among siblings, a board move, a reparent, an attach and a
  detach each set one value, both, or neither. So do this epic's new
  writes: a status change, a check, an uncheck and a change of kind.
- **Recommendation:** a write sets a value only when it names a place in
  that order. Otherwise the value is kept. An item entering an order it
  wasn't in is appended. So a detach keeps the item's place among its
  siblings and takes its Free position from the drop, and an attach
  drops the Free value.

**Q26. What each surface reads** (was decision 7)
- **Recommendation:** the board's Free lists read the Free value. A
  Card's list reads the sibling value and shows only the attached
  children. Today's attached-children scope then goes away: it's the
  sibling order with the Free children left out. The Sheet's children
  list and MCP read the sibling value with every child in.
- **Ruled with Q18,** which asks where a checked Stub reads in that same
  list.

**Q27. The API's shape** (was decision 8)
- Both values in a response, `positionScope` redefined or replaced, how
  a move names which order its neighbor is in, and reindex disclosure
  for each order (wiki positioning §7).
- **Recommendation:** decide it in Story 3's plan, after Q24–Q26, on the
  API contract epic's schemas.

**Q28. The migration** (was decision 9)
- Every existing item needs a sibling value. Attached children already
  hold one.
- **Recommendation:** a Free child is appended after its parent's
  attached children, in creation order, so no attached child's position
  changes. Top-level items take their board order, with Done ones after,
  by completion time.

---

## Stories (draft)

Redrawn on 2026-11-12, after group 1's rulings. Not approved. G10 moved
the attached item's rules into Story 1, since a status model can't be
built without saying what an attached item holds. What was "Quick Items
on the server" is now split between Story 1 and Story 5.

Redrawn again the same day, after Story 1's plan's D4 and D6: Story 1
takes the board's minimum, Story 2 narrows to what's left of the board,
and Story 7 takes the migration's deletions.

### Story 1 — The status model
**Plan:** [`story-1-status-model.md`](story-1-status-model.md) (planning;
its Phase 0 decides Q2, Q6 and Q22).

**Goal:** every item holds a status. Done stops being a property of a
workphase, and an attached item stops holding a workphase. Every write
that changes a status or a workphase goes through the hierarchy-write
primitive. The board keeps working: it shows a Done column read from
status, and a drop on it makes an item Done.

**How it lands with Story 2** (Nathan, 2026-11-12, the plan's D4): this
story takes the board's minimum, so the board and the E2E suite are
never broken between stories, and no spec is skipped. It sets each
item's status from today's data and deletes nothing, and Story 7 takes
the deletions (the plan's D6).

**Builds:** G1–G6, G7, G9's 400, G10, G11, G14 and G15, and the answers
to Q2, Q6 and Q17.

**Inbound, from `epic-4-decisions.md`:**
- §9 closes under G10 and G11. The workphase cascade goes, and nothing
  is written in its place;
- §12's TC-5.15 fix, and the retiring of TC-6.11, TC-6.13 and BCU-3.4;
- §12's ATT-5.11, first half only (G9);
- the A6 audit's #44 and #45, with the re-run's #24 and #25: the
  workflow-membership rule written four ways, and the active/done split's
  three homes.

**Depends on:** the API contract epic. **Unblocks:** every story here.
**Verified by:** API tests, and the board's Playwright tests it breaks,
fixed in the story.

**Open:** it needs no stored `kind` unless Q17 rules that attaching
changes it. If it does, the column arrives here.

### Story 2 — The board under the status model
**Goal:** a board can show Backlog, a Done list reads newest first, and
a Stub is drawn by its own status. Story 1 gave the board its Done
column; this story finishes the board's side of the status model.

**Builds:** G8's Backlog half, G12, G16 and G17.

**For its plan:**
- where the Backlog column sits, how a board turns it on, and whether
  Backlog and Done reorder among a board's columns;
- how a newest-first Done list breaks a tie, and where an item previewed
  into it reads. Today a tie reads in creation order and a previewed
  item reads last (wiki item-positioning §6).

**Inbound:**
- §12's two drag questions, and the side highlight's ruling that goes
  with them;
- Story 6.1's C-6b: the card-list facts derived in three places
  (`epic-8-decisions.md`, the column rework's item 2), unless Story 1
  takes it with its `isTerminal` reads.

**Depends on:** Story 1.

### Story 3 — Two position values
**Goal:** an item holds two stored positions, one among all its
siblings and one among its fellow Free items. Every write says which it
sets, and every surface says which it reads.

**Builds:** Q23–Q28.

**Folded in from a tech-debt story** (Nathan, 2026-11-12). It was the
second half of `positioning-on-create-and-edit.md`. It changes what the
app does, so it closes by the full story-done checklist, audit included.

**Projects are in scope.** Item and project positions share one
anchor-and-side layer, and their tree operations are kept symmetrical. A
project has no attached or Free state, so its one position is already a
sibling order. The items' sibling value is the same kind of value and
shares the projects' code where it can. The Free order stays items-only.

**Out of scope:** the resolution math itself, which is wiki positioning
§3's coarsest fit and its fallbacks, and §6's reindex. The second value
reuses them.

**Inbound,** carried in with the story. Each was routed to it because
its answer changes with two values. The first six came from A6's plan
(`a6-audit-guidance-and-first-run.md`, Open questions) on 2026-10-22.

- **For the PO: does a workphase write disclose its reindex?** (A6
  first-run audit, `docs/audits/code-quality-audit-a6.md`.)
  `PUT /workphases/:id`'s terminal-flag backfill appends items without
  disclosing the reindex it can trigger (`routes/workphases.ts:141`).
  Wiki positioning §7 and item-positioning §5.1 list only item writes.
  If Q4 retires the flag, Story 1 removes the backfill and the question
  with it.
- **For the PO: a project move naming both `prevId` and `nextId`** (A6
  first-run audit) uses `prevId` and ignores `nextId`, which wiki
  project-tree §6 doesn't state. The API contract epic's Story 1 decides
  whether that's refused, and whether the two moves share one shape.
  What's left for this story is Q27's half: with two orders, a move has
  to say which order its neighbor is in.
- **For the Test Planner: wiki item-positioning §2's third `"none"`
  case** (the Coder, A6 batch 3a), an item filed in a workphase of a
  workflow its project doesn't use, has no case among TC-2.13 to
  TC-2.17. `workflows.test.ts`'s positionScope test checks it and
  carries no ID. TC-7.18 states it for an item left in its old workflow
  by a project move, and its route test is `Automated` (A6's Reconciler
  run, 2026-10-22). The scope cases are rewritten once, against the new
  §2.
- **For the Test Planner: TC-3.4's setup has a parent with a workphase**
  (the Coder, A6 batch 3a). Its ID is on the test for a parent with none
  (wiki item-positioning §3: the scope is the parent's children, not a
  workphase). If that variation wants a case of its own, the test's ID
  follows. The sibling scope widens to every child, so TC-3.4 is
  rewritten.
- **For the PO: an anchor with two faults** (the Coder, A6 batch 3d).
  wiki positioning §2 lists four ways a neighbor fails and orders none.
  A neighbor outside the scope that also has no position is now refused
  as outside the scope, for items as for projects. With two scopes,
  "outside the scope" depends on which order the anchor names.
- **For the Test Planner: TC-7.10 and an item that ends with no
  workphase** (the Coder, A6 batch 3d). The new test carries the ID: an
  item with no workphase has no scope for a neighbor to be in. A child
  with no workphase gains a sibling scope under this story, so the
  premise changes.
- **For Nathan: whether `Item.positionScope` becomes required** (A6
  re-run, `docs/audits/code-quality-audit-a6-rerun.md` #12, routed
  2026-10-23; `client/src/types.ts:55–57`). Nathan ruled on 2026-10-21
  that it stays optional. The re-run then traced every route that
  returns an item, and each attaches it: `routes/items.ts::respondWithItem`,
  `GET /items/:id` and its children, the board and the workflow detail.
  The client typechecks with it required, which would let the compiler
  guard `isStub`. Q27 redefines or replaces the field, so the type is
  settled once, with it.
- **Nathan's note on dual position values,** from Epic 3.5's Story 9,
  which he took out of that roadmap on 2026-10-28. It's Q23.

**Depends on:** Stories 1 and 2, and the API contract epic.
**Unblocks:** Stories 4–6, and the Sheet's children list.

### Story 4 — Stub checkboxes
**Goal:** a Stub has a checkbox that sets its own status, within what
its parent's status allows.

**Builds:** G11 and G12 at the surface, and the answer to Q18.

**Depends on:** Stories 1–3. The checkbox alone could move up into Story
2 if it's wanted sooner. Q18's order waits for Story 3.

### Story 5 — Free Quick Items
**Goal:** a Free item can be a Quick Item. Its kind is stored, it shows
as a Card with a checkbox in the first workphase's column, and it can be
created and converted from the board.

**Builds:** G13 and G18, and the answers to Q15, Q17's stored kind and
Q21.

**Depends on:** Stories 1–3.

### Story 6 — A Quick Item that completes itself
**Goal:** a Free Quick Item with attached children becomes Done by
itself when the last of them is checked. The design doc calls this a
quick item bucket. The last story, cut if the epic runs long.

**Builds:** G19.

**Depends on:** Stories 4 and 5.

### Story 7 — The migration's cleanup
**Goal:** the old model's leftovers go. The terminal workphases are
deleted, so no board shows a double Done, and the terminal flag's
database columns are dropped. Under Q2's (a), attached items' copied
workphases are cleared.

**Split out of Story 1** (Nathan, 2026-11-12, that plan's D6), so no
user data is deleted in the story that changes what the data means.
Story 1's code stops reading everything this story deletes, so it's
safe at any point after Story 2.

**For its plan:**
- a column covering only a deleted workphase is deleted with it, as a
  workphase delete does today (wiki boards-columns-unsorted §8). A
  column covering an old "Done" workphase and others shrinks;
- what Nathan's own data holds: any workflow with two terminal
  workphases, or a "Done" workphase someone has since used as an
  ordinary column, is checked before the delete;
- the backfill left Done items holding their old terminal workphase.
  The delete clears it (`ON DELETE SET NULL`).

**Depends on:** Story 2.

### The close
The epic closes by the epic-done checklist: an epic-wide audit and a
Reconciler run. The checklist allows no `Pending PO` case at close, and
two are routed here today:
- **TC-6.13** is retired with the terminal flag (G5).
- **ATT-5.11** has its first half answered (G9). Its second half is
  re-routed to the Sheet's epic, and that routing counts once
  `epic-7-decisions.md` names the case. Not yet written there.

---

## Living docs this epic changes

For sizing. Each owner makes its own changes, from a story's handoff.

- **The wiki (PO):**
  - a page for the status model and Quick Items, new;
  - item-positioning §2, §5 and §6, then §1, §2 and §3 again for two
    values, and its first Open question comes off;
  - positioning §2 and §7, for which order a neighbor is in and what
    each order's reindex discloses;
  - item-attachment §2, §2a, §9, §10 and §14, and its Open question on a
    project that uses no workflow;
  - boards-columns-unsorted §3, §6, §8 and §10;
  - board-drag-interaction §2's rule 6, §6.1, and its Open question on
    zooming into a done Card.
- **The test plans (Test Planner):** the cases under those sections, and
  a catalog for the new page. Story 3 rewrites the scope cases (TC-2.13
  to TC-2.17, TC-3.4, TC-7.10 and TC-7.18) against the new §2.
- **Root `AGENTS.md` (Architect):** the data model's notes on the
  terminal flag, the `items` row, the hierarchy-write primitive's reach,
  and "One position math layer".

---

## Routed out of this epic

- **The column merging-expanding rework** (`epic-4-decisions.md` §11):
  already moved to `epic-8-decisions.md`.
- **The start datetime** (§10): to the Tags & Type System epic
  (`epic-5-decisions.md`, "Deferred from the Quick Items epic").
- **What a move between workflows should do to an item** (G9), with
  ATT-5.11's second half: to the Sheet's epic, which adds the first
  control that makes one. `epic-7-decisions.md` doesn't name either yet.
- **How "closed" fits the status model** (`epic-7-decisions.md`, on
  deleting an item): that epic's question. Story 1 gives it the three
  statuses to answer against.
- **How the Backlog and Done columns finally look:** the board's
  presentation rework, with the rest of `epic-8-decisions.md`'s list.
