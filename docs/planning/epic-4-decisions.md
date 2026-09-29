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
discussion (`docs/audits/code-quality-audit-epic-3-5-story-4.md` #1 and the
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

### 11. Column merging-expanding rework
Right now a column can only merge-expand on one category - workphases. When 
start time is implemented we will also like the ability to expand by start date
so a column can have date buckets. Column expanding eventually will have a 
more generalized group-by-tag feature. This is probably not an effort to 
implement for this epic, but we should figure out where the work will live.

**Where the drag-side work will live** (recorded 2026-09-21, from the
Story 4 code-quality audit discussion of #7/#8 — the `CardList`
consolidation and the `isCardList` predicate). The framing that keeps
those two fixes stable: a bucket is a **facet on a sub-row, not a new
region kind**. The layer stack (Board → Column/sub-row → Card →
Descendants) is untouched by group-by; a date bucket is still `kind:
'subrow'`. What varies per facet is the sub-row's *within-action write*
— workphase today, a date range or label later. So the region-kind
predicates, `placementRegion`, `DragCarveFrame` and the facet-agnostic
`CardList` never change for this; the four places that do:

1. **Region identity** — `subrowRegionKey` / `subrowContainerId`'s
   `<columnId>:<workphaseId>` format and `parseRegionKey`'s parse of it
   (`client/src/components/workflow/dragRegions.ts`, the format's one
   owner). Becomes `<columnId>:<bucketKey>` with the facet resolved from the
   column definition.
2. **Item selection** — `useBoardDnd.ts`'s `regionItems`: today a
   `kind === 'column' ? merged : byWorkphase` switch. A bucket sub-row is
   "the column's items filtered by bucket," so the selector becomes a
   fact the region carries (or a facet switch here), not a kind switch.
   This is the one *positive* kind test the audit's #8 didn't list; it is
   the site group-by touches.
   *Deferred here by Epic 3.5 Story 6.1 (ledger C-6b, 2026-09-24):* the
   same card-list facts (covered workphases, `isTerminal`) are derived in
   three places:
   - `BoardColumn.tsx`, for the render;
   - `dragRegions.ts::cardListStructure`, for the region;
   - `regionItems`, for the release's `others` list.

   All three call the same two selectors, so they agree only by
   convention. Make them read one derivation when this point reshapes
   item selection, or when the done-column rework settles `isTerminal`,
   whichever comes first.
3. **List identity** — `Placement` (`itemListOps.ts`) carries
   `workphaseId` / `parentId`, and `isIdentity`'s `sameList` reads "same
   workphase = same list." Two date buckets in one column share a
   workphase, so a bucket-to-bucket move would read as identity and
   no-op. `Placement` gains the bucket; `isIdentity`, `toRequest` and
   `placementFor`'s card-list branch compare and emit it. The ghost /
   pending marker follows for free (§10: placement is all three), but
   `itemListOps.ts`'s per-list selectors filter by bucket too.
4. **Server** — the board response's `subRows[].workphase` shape becomes a
   bucket, and `PATCH /items/:id/move` has to accept whatever a date/tag
   bucket writes (a `startAt`? a label?) — which is also the open product
   question: what a drop *into* a date bucket means for the item's date.

Not to be pre-built in Epic 3.5. The point of recording it is that Stories
4.1's `kind` discriminant plus the audit's #7/#8 leave the facet work
confined to these four, rather than a branch in twelve places.

### 12. Revisit with the done-column rework: dragging within a done column, and three test-plan cases
These wait for this epic's done-column rework. Nathan routed the drag
questions on 2026-09-27 and 2026-09-28, TC-5.15 at A3 batch 5's Stop 1,
and TC-6.11 and 6.12 at batch 6's.

**Three test-plan cases, routed here by ID.** Each stays `Open` until this
rework lands.

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
- **TC-6.12: a flag change that would leave a column spanning terminal and
  non-terminal workphases is rejected.** The wiki says only that a range
  "cannot span" both. The rejection is the Test Planner's reading, which
  Nathan kept.

Nathan routed TC-6.11 and 6.12 here because the rework may retire the
terminal flag. Their tests exist in `server/tests/routes/workphases.test.ts`
but carry no ID: lines 102, 130 and 160 for TC-6.11, and 72 and 92 for
TC-6.12. The flag tests compare with `toBeLessThan` rather than the case's
values (`docs/audits/test-reconciliation-a3-close.md`, Test Quality 5).

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
