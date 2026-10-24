# Epic 4 Decisions — Quick Items and the Status Rework

Open questions and leanings for Epic 4.

Sections 1–8 (API schema, validation and documentation conventions) moved on
2026-09-26 to `docs/planning/tech-debt-stories/api-contract-zod-openapi.md`,
when that work became its own epic ahead of Epic 4. The sections below keep
their numbers so existing references to §9–§11 still resolve.

---

## Decisions - Questions to ask before implementing Quick Items

### 9. Open question, to re-approach in Epic 4: an attached item's workphase — stored cascade, or null and inherit-at-read?
Not a decision. Recorded 2026-09-21 from the Story 4 code-quality audit
discussion (`docs/archive/code-quality-audit-epic-3-5-story-4.md` #1 and the
"no cascade" assertion it prompted), parked here rather than in Epic 3.5
because its natural neighbor is Epic 4's done-column rework, which also
revisits what a status means for a nested item. A data-model question, not
a schema-convention one — kept in this file for the same reason the rest of
it is here: Epic 4 is the next marker.

**The model today: a denormalized copy, maintained by a cascade.** An
attached item's `workphaseId` is a stored copy of its nearest Free
ancestor's. [attachedCascade.ts](../../server/src/lib/attachedCascade.ts)
keeps it in sync — a plain `UPDATE` over the attached subtree on every
parent workphase write (move, PUT, MCP), inside the same transaction — and
[itemHierarchy.ts](../../server/src/lib/itemHierarchy.ts) rejects a request
that names a different workphase for an attached item ("an attached item
inherits its parent's workphase; omit workphaseId or match the parent's").
Nothing else happens to the children: no notification (the
`triggersNotification` check fires for the moved item only) and no activity
entry. Observably, children already behave as if they inherit; the cascade
is cache maintenance. Note the split this leaves: a Stub's *done-ness* is
already derived at read ("reads as done by inheriting the terminal
workphase, storing nothing new" — Epic 3.5 ground rules), while its
workphase is copied.

**The alternative:** attached rows store `workphaseId = null`; the
effective workphase is resolved at read by walking `parentId` to the
nearest item with `isAttached = false` (bounded by `ITEM_DEPTH_CAP`).
Nothing to cascade; drift impossible by construction.

| Concern | Stored copy (today) | Null + inherit |
|---|---|---|
| Source of truth | the ancestor's row, copied down; invariant held by one function | the ancestor's row, resolved by a walk |
| Drift | possible in principle (child ≠ parent); guarded by the 400 above and the cascade | impossible |
| Queries by workphase | a column — `WHERE workphase_id = ?` everywhere | every consumer resolves: the board response's sub-row grouping, `GET /workflows/:id`, MCP `get_workflow`, the Unsorted computation, any future Inbox/Headline or notification filter |
| Meaning of `null` | "Unknown status" (a tolerated soft ref — `SET NULL` on workphase delete, surfaces in Unsorted) | two meanings on one column — attached + null = inherits, Free + null = unknown — disambiguated by the flag |
| Detach | leaves `workphaseId` where it is | must *materialize* the effective value into the row |
| Cross-workflow reparent | the subtree keeps its now-foreign workphases → Unknown until re-filed | attached descendants follow the new root automatically; detached ones still go Unknown |
| Client | reads `item.workphaseId` | needs an `effectiveWorkphaseId` — server-decorated next to `positionScope`, or a client walk; the covered-set rule for a Stub drag (Epic 3.5 Story 5) reads it |
| Consistency with done-ness | split (done derived, workphase copied) | uniform (both derived) |

**The strongest argument each way.** For the stored copy: workphase is the
primary query axis of a Kanban app, and denormalizing it keeps every
consumer — including ones not written yet — a column read; the cascade is
the price of that and it is already single-sourced. For inherit: it is the
honest model — the Story 4 audit's caveat ("re-attaching a child rewrites
its attached descendants' workphases") exists only because the copy has to
be re-synced — and the cap is already derived per read, so the walk is
cheap and bounded.

**Leaning, not ruled: keep the stored value, but define what it *is*.**
State the truth as inheritance and the column as a cache of it — "an
attached item's `workphaseId` always equals its nearest Free ancestor's;
the cascade maintains the cache" — write that invariant into
`docs/wiki/item-attachment/`, and add a cheap integrity check (a test that
walks every attached item on a seeded board and asserts equality, or a
repair-on-read that logs a mismatch). That buys the conceptual purity
without touching every read path. If the cascade ever bites — a real drift
in the wild, or a consumer that wants the walk anyway — the migration is
well-defined: null the attached rows, decorate reads with
`effectiveWorkphaseId`, exclude attached items from Unsorted, materialize
on detach.

**Verify before ruling:** whether anything relies on an attached child's
stored workphase *differing* from its parent's. The E2E "an attached child
whose workphaseId goes invalid still renders only nested, never duplicated
in Unknown status" (`tests/ui/attached-children.spec.ts`) suggests the
client already tolerates a stale copy — evidence the cache framing is safe,
and a case the inherit model would make unreachable.

**What a switch would touch**, so its size is known when the question comes
back: the board response shape (`GET /boards/:id` groups items by
workphase into sub-rows; attached items would need their resolved
workphase, or a separate list), `getWorkflowItems`/`getBoardScopeItems`,
the Unsorted computation, MCP `get_workflow`/`move_item`, the client's
`itemListOps.ts` selectors and the Stub-drag covered-set rule, the
`positionScope` decoration (the natural home for `effectiveWorkphaseId`),
`attachedCascade.ts` (deleted), and a data migration nulling attached rows.
Not an Epic 3.5 change under any outcome.

### 10. Start datetime feature
There will be a start datetime feature that, when set, will automatically move 
an item from Backlog to Active if the current time is after the start time. We
should decide if start-time should be implemented now as part of this story. Or
as a part of epic-5's tag/label work since start-time is likely to get a label
pill and might get classified  as tag/label work.

*Context, out of this epic's scope:* `epic-8-decisions.md`, "Deferred (not
events-specific): column merging-expanding rework", records how a column may
later expand by start date into date buckets.

### 11. Column merging-expanding rework
Moved to `epic-8-decisions.md`, "Deferred (not events-specific): column
merging-expanding rework" (2026-10-05). It was recorded here as context, and
was already written as work to defer past this epic.

One part still bears on this epic: Story 6.1's C-6b (card-list facts
derived in three places) is due when this epic's done-column rework
settles `isTerminal`, if the column rework hasn't come first. Its note is
under that section's item 2.

### 12. Revisit with the done-column rework: dragging within a done column, and four test-plan cases
These wait for this epic's done-column rework, or for its status model
(§13). Nathan routed the drag questions on 2026-09-27 and 2026-09-28,
TC-5.15 at A3 batch 5's Stop 1, TC-6.11 and 6.12 at batch 6's, and TC-6.13
and ATT-5.11 during A5a's phase 1 (2026-09-30).

**Four test-plan cases, routed here by ID.** TC-5.15 and 6.11 stay `Open`
until this rework lands. TC-6.13 and ATT-5.11 stay `Pending PO` until this
epic answers their questions.

*TC-6.12 left this list on 2026-10-05.* It's BCU-3.4 now, in A5c's new
boards-columns-unsorted catalog. The terminal-flag refusal it asserts is
what the API does today, so Nathan had it mapped to its existing tests
rather than wait here. This epic is expected to remove the terminal flag,
which retires the rule and the case with it.

- **TC-5.15: done items count toward the magnitude threshold** (A3's Open
  question 18). Wiki item-positioning §5 reindexes before an
  append would cross `max(1000, n + 100)`, where `n` is the number of
  items in the scope. A Free item's scope is the workflow's active items
  (§2), and done items have no position, so they shouldn't count. The
  server counts them, so the case fails today, though only once a
  workflow holds hundreds of done items. The Test Planner reads the page
  as clear, which puts the fix in the code, and the Reconciler puts it at
  one filter. Nathan deferred it to this rework.
- **TC-6.11: changing a workphase's terminal flag applies the active/done
  split to the items already in it** (wiki item-positioning §6).
- **TC-6.13: several Free items made done, or reopened, by one flag
  change** (wiki item-positioning §6). Making a workphase terminal
  completes its Free items in one write, so they tie on `completedAt`, and
  the done list shows them in creation order (TC-6.10). Clearing the flag
  gives each a fresh position by the append fallback, but the wiki doesn't
  say in which order: their order before, or the done list's. The server
  restores their order before today.
- **ATT-5.11: a Free item reparented between a project with no workflow
  and one with a workflow** (wiki item-attachment §2a and §9). Is that
  reparent cross-workflow, and so refused when it leaves a Free item in
  the moved subtree? Going in, the Free item has no workflow to leave and
  may have no workphase. Going out, it would keep a workphase in a project
  that uses no workflow. Nathan expects §13's status model to settle it: a
  move that keeps the item in Backlog has no workflow to consider. It's
  listed here so the routed cases sit together, but it belongs to §13's
  discussion, not the done column.

  **Its first half, routed with it** (Nathan, at A5a's close, 2026-10-04):
  may a write name a workphase for a Free item in a project with no
  workflow? Read literally, §2a says no, since such a project uses no
  workphase. Today the code compares nothing there and accepts any
  workphase. The wiki holds both halves as one Open question
  (item-attachment, "A project that uses no workflow"), and no case covers the
  first half.

Nathan routed TC-6.11 and 6.13 here because the rework may retire the
terminal flag. TC-6.13 has no test. TC-6.11's exist in
`server/tests/routes/workphases.test.ts` but carry no ID: the three
backfill tests under `describe('isTerminal flip')`. The flag tests compare
with `toBeLessThan` rather than the case's values
(`docs/archive/test-reconciliation-a3-close.md`, Test Quality 5).

**The two drag questions:**

- **A card set back down in its own done column.** Today it writes nothing
  (wiki board-drag-interaction §2, rule 6). Nathan flagged that this may
  change with the rework.
- **Zooming into a Card in a done column.** Deferred to this epic, and open
  in the wiki (board-drag-interaction, Open questions). The Card zoomed
  into is the one the side highlight names, a neighbor of the ghost
  (§6.1). A done list's ghost doesn't move, so as written only the Cards
  beside it can be named. The PO's recommendation: in a done list, zoom
  into the Card under the cursor. §6.1's only reason against that is that
  Cards slide aside, and nothing in a done list does.

  **What the side highlight shows in a done list is decided with it**
  (Nathan, 2026-10-22, from A6's batch 3b). A done list's release names no
  card, so naming the Card to zoom into is the highlight's only job there.
  Today it's drawn as if the ghost had slid: carrying `X` over `D1` in
  `D1, X, D2` draws it at `D1`'s top, where `X` isn't. Under the PO's
  recommendation, a done list draws no highlight, since the Card under the
  cursor needs no naming.

**Carried in from the A6 first-run audit** (`docs/audits/code-quality-audit-a6.md`,
2026-10-07; Nathan approved the routes on 2026-10-21):

- **One rule written three ways** (#44): whether a workphase belongs to the
  workflow the item's project uses, in `routes/items.ts:23–39, 64–80` and
  `itemHierarchy.ts:118–125`. The copies disagree for a project with no
  workflow: the create accepts any workphase and gives it a position, while
  the read labels the item `"none"`. One shared lookup needs ATT-5.11's
  first half answered first, and §13's status model may retire its terminal
  half.
  - **A fourth copy since** (the A6 re-run's #25,
    `docs/audits/code-quality-audit-a6-rerun.md`; Nathan, 2026-10-23):
    `routes/workflows.ts:71–76`, added by that audit's fix for `GET
    /workflows/:id`. The other copies are now at `routes/items.ts:29–39,
    64–74` and `routes/boards.ts:64–65`, through `getBoardScopeItems`. One
    `withPositionScopes(rows, workphaseRows)` in `itemPositionScope.ts` is
    the shape the four would share.
- **The items' active/done split has three homes** (#45): the terminal-flag
  backfill (`routes/workphases.ts:102–149`), `POST /items`
  (`routes/items.ts:182–212`) and `itemHierarchy.ts:401–413`. Consolidate
  them with the rework, which may retire the flag all three read.
  - **The copies already differ** (the A6 re-run's #24, Nathan,
    2026-10-23). They're now at `routes/items.ts:152–183` and
    `itemHierarchy.ts:379–417`. The move appends before its terminal check,
    then drops the position, so a move into a done column that names no
    anchor can fire a reindex whose position it discards. The reindex is
    real and disclosed, just wasted. A create checks the terminal flag first.
- **For the two drag questions above** (#4): today a done list's ghost
  *does* slide with dnd-kit's shuffle, against rule 6, though the release
  is right. It's a Fix Now in that audit, so "nothing in a done list
  slides" holds once it lands.

### 13. The status model: three hard-coded statuses (proposed)
Nathan's plan, recorded on 2026-09-30 during A5's grooming. It's a proposal:
it gets discussed when this epic starts, before any implementation. The
roadmap's Epic 4 entry has the outline.

- **Three hard-coded statuses,** names to be decided: one before a
  workflow (Backlog), one within it (Active), and Done after it. A kanban
  item's workflow and workphases replace or subdivide Active.
- **A Quick Item** has no specific workphase while Active, or ignores it.
- **A Quick Item's status is equal to or later than its Free ancestor's.**
  Under a Backlog ancestor it can take any status; under an Active one,
  only Active or Done.
- **A Free Quick Item** shows in the workflow's first workphase, whether
  it holds a workphase or not; having none is expected. It can be dragged,
  but only to the Done column. Its Card has a checkbox that sets it Done.
- **A Quick Item Stub** has a checkbox too. It stays in its parent's list,
  either open and unchecked, or done and greyed out or struck through.
- **Done is hard-coded,** so it can carry hard-coded rules. Whether an
  `isTerminal` flag survives is open. If it does, it's no longer a setting
  any workphase can take. §12's terminal-flag cases wait on this answer.

**Already ruled ahead of this epic** (A5a's R5, 2026-09-30): a top-level create
may omit its workphase, even in a project with no workflow. Every item
today is a full item, and a full item with no workphase isn't what the
board expects, so it shows in Unsorted, whether it was created that way or
its workphase was deleted (`ON DELETE SET NULL`).

**For the discussion:** under the status model, a full item in Backlog
may have no workphase by design. Unsorted and `needsAttention` would then
flag only an Active full item with none. ATT-5.11 (§12) belongs to the same
discussion.
