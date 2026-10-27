# Epic 8+ Deferred Decisions — Events, Alerts & Notifications, and Placeholder UI

Technical decisions and discussion captured so `mvp-roadmap.md` can stay
high-level. Reference doc for when Epic 8 (Notifications / Inbox priority) is
actually built — or when pieces slip into the **post-Epic-7 rework window**.

Companion to the `architecture-events-notifications` memory note, which holds
the detailed table shapes (events, event_recipients, notification_preferences,
the priority cascade, unread model). **This doc is canonical for the decisions;
the memory is the schema sketch.** Where they overlap, this doc wins.

Decisions recorded 2026-07-17 while auditing Epic 3. Nothing here is built yet.

It also holds UI that does enough for now but isn't meant to be the final
product. That UI is revisited in Epic 8, or later (Nathan, 2026-10-05). Those
deferrals are the last sections, after the events material.

---

## Context: notifications today vs. where they're going

Today's `notifications` table is a quick MVP stub: `id, itemId?, workflowId?,
message, type, isRead, createdAt`. Rows are created in exactly one place — the
item move handler, when the destination workphase has `triggersNotification`
set ([items.ts](../../server/src/routes/items.ts)) — and read as a flat global
"unread" list. `type` exists but is descriptive-only (never branched on).
`workflowId` is **write-only / vestigial** (nothing reads or filters by it),
confirmed 2026-07-17 — same inert state `labels.workflowId` was in before its
decouple.

Epic 8 replaces this with an **events + alerts** model. The mental model:
- An **item accrues events** (its activity/history log).
- A **trigger** is a filter defining which of a user's events they care about.
- An **alert** is a relationship between an **event** and a **user**.

---

## Decisions

### 1. The `notifications` table becomes `events` + `event_recipients` (alerts)
One unified events table (which also *is* the activity log) plus a per-recipient
alerts join. Querying by `item_id` gives the activity feed; querying by
`user_id` gives the personal notification feed — same data, two lenses. This
supersedes both today's `notifications` table and the separate `activity_log`
table. See the memory note for the column sketch.

### 2. Notifications are NOT children of workflows — no `workflowId` FK
An event may be *caused* by something workflow-related ("item landed in
Review"), and it's useful to record which workphase/workflow triggered it — but
as **snapshotted payload data, not an FK/PK**. The system must be agnostic to
whether an event was workflow-triggered. The current `notifications.workflowId`
FK is premature specialization (a column hard-wired to one trigger type) and
goes away in the rework. Precedent already in the codebase: `activity_log`
stores `fromWorkphaseId`/`toWorkphaseId` in a JSON `metadata` blob (soft
references, not FKs) — events follow that pattern.

### 3. Level A now (item-anchored); keep the path to Level B open
MVP scope is **item events only** — "this item needs your attention because
X/Y/Z happened." Events anchor on `item_id`. Do **not** build subject
polymorphism now (no `subject_type`/`subject_id`), and do **not** tighten
`item_id` to `NOT NULL` — leave the door open for **Level B** (events on
projects or other concepts, e.g. "alert me when this project changes") without
paying for it yet. The refactor is cheap precisely because today's footprint is
one trigger path + one flat read list.

**Why Level B is nearly free later:** the alert layer (`event_recipients`) is
**subject-agnostic** — it's just event ↔ user ↔ read-state. All item-vs-project
specialization lives on the **event** (`subject`, `type`, `payload`). So adding
project events means generalizing the event's subject; the alert/feed machinery
rides along untouched. This is the concrete form of the earlier "generic
notification layer + typed specialization" intuition: `event_recipients` is the
generic layer, the event's `type`/subject is the specialization. Corollary:
there is never an "alert type" — typing lives on events, which already have a
`type` column today.

### 4. The snapshot boundary: the EVENT snapshots content; the ALERT snapshots only the routing verdict
Both are snapshots, but of different things at different layers:
- **Event = snapshot of *what happened*** (content): message, actor, the
  workphase name at the time, payload. Immutable historical fact, append-only.
  The durable display-snapshot lives here (`event.payload`) so "moved to Review"
  still renders "Review" after that workphase is renamed/deleted.
- **Alert = snapshot of the *routing verdict* only:** `is_priority`, computed
  from the recipient's preferences at insert time. Plus `read_at` (live
  per-recipient state, not a snapshot). The alert copies **nothing else** — for
  content it holds a **reference** to the event.

**The principle:** a value belongs on the alert only if it's *both*
per-recipient *and* determined at a moment that can later drift. `is_priority`
qualifies (per-user, and prefs change later). Event content fails — it's
identical for every recipient and for the activity log, so snapshotting it
per-alert would duplicate it N times and invite divergence. Store it once, on
the event.

### 5. Alert → event is an FK; events are append-only
Events die only when their subject dies (item deleted → its events deleted →
their alerts cascade). Reading sets `alert.read_at`; a new priority event on an
already-read item inserts a fresh unread alert, re-surfacing the item. (Read
model detail lives in the memory note.)

### 6. Semantic snapshot vs. performance denormalization — keep them distinct
Decision 4 says the alert needs no semantic copy of event content. A feed query
("my unread, newest first") might later tempt denormalizing `event.created_at`
or `event.type` onto the alert to skip a join — that's fine as **optimization**,
but it is not meaning. Keep the alert a pure reference-plus-verdict until a real
query proves otherwise; never let a perf denormalization smuggle in content that
can then drift from the event.

---

## Open questions (resolve during Epic 8, not before)

### Q1. Two axes of "should this notify" — how do they combine? (load-bearing)
Today's only trigger is `workphases.triggersNotification` — a **workflow-author**
signal ("arrival at this stage matters, alert on it"). The events/preferences
design models the **recipient** axis ("*I* care about assignee changes /
comments"), with the priority cascade (global < project < ancestor < item).
These are orthogonal axes and the memory only has the second. Does workphase-level
"this stage triggers an alert" survive as one *input* to the preferences system,
or get fully replaced by "user subscribes to event types"? **Lean: keep both** —
an author saying "Review always pings" is genuinely independent of a user's
per-event-type prefs. This is the biggest unresolved schema question.

### Q2. Do cascaded attached-child moves emit events?
When a parent moves and its attached descendants cascade
([items.ts](../../server/src/routes/items.ts) — the cascade updates
`workphaseId` directly and bypasses the trigger block), the children currently
emit **no** notifications. Probably correct (move a parent, don't get N child
pings) — but decide it on purpose in the event model rather than by omission.

### Q3. Item badge count — priority-only or all activity?
The item-detail alert badge (the "3" that expands to show relevant events) maps
to querying events by `item_id`. The memory separates *priority-unread* (badge)
from *non-priority activity* (a distinct counter). Decide whether the item badge
counts only priority alerts or all unread activity. Lean: priority-only.

### Q4. Do items need a global (cross-workphase) order, independent of `position`?
`items.position` is scoped to whatever workphase an item currently sits in — a
cross-workphase move (drag, or `PATCH /:id/move`) recomputes it from scratch
against the *target* workphase's neighbors, discarding any relative order the
item held in its previous column entirely. `createdAt` is immutable and
workphase-independent but isn't wired into any ordering today; nothing
persists "the user cared about this item's rank" once it changes workphase.
Raised while discussing audit finding #25 (the position-append-math helper):
would a global/cross-column rank be worth adding — `createdAt` as the default
order, with a manual reorder establishing a sticky override — so an item
lands somewhere consistent with its rank among peers when it's dragged into a
new column, or when it's listed in a cross-project/cross-workflow surface
(dashboard tiles, Inbox)? No schema support for this exists today; would need
a new field plus a decision on how it interacts with per-workphase `position`.
Not acted on now — flagged for whichever epic ends up owning cross-cutting
item lists.

### Q5. Is it worth testing the MCP layer?
Raised during the Epic 3 test-coverage-gaps discussion (MCP paths currently
have zero coverage). Confirmed architecturally: `server/src/mcp.ts` is a thin
HTTP client over the same REST API the browser uses (`fetch` against
`http://localhost:3001/api`) — not a separate code path — so route tests
already cover the business logic MCP calls into. What tests would uniquely
catch: argument-mapping bugs, `create_item`'s bespoke type-name-resolution
logic (its one piece of real logic), and schema-vs-route contradictions like
the already-found finding #3 (a tool's `inputSchema` requiring something the
route didn't actually enforce).

Not free to add as-is — three prerequisite refactors first: `API`'s base URL
is hardcoded (`http://localhost:3001/api`), not configurable like the routes'
`DB_PATH` pattern; the tool-dispatch switch-case lives inline in the anonymous
`CallToolRequestSchema` handler, not exported/directly callable; and importing
the module unconditionally calls `await server.connect(transport)` with no
`!process.env.VITEST`-style guard (unlike `index.ts`'s `.listen()`). Lower
stakes than usual too: single-user personal tool, and MCP already needs a
manual Claude-session restart to pick up server changes, so a broken tool
tends to surface immediately on next use rather than silently in production.
Decide whether the translation-layer risk is worth the refactor-then-test
cost, or whether this stays an accepted gap.

---

## Now vs. Epic 8 (what NOT to do now)

Unlike labels (decoupled now, because global labels created a live
project-delete correctness bug), notifications have **no forcing function** — the
`workflowId` FK is inert, so nothing is broken today, and the correct target is
the unified events refactor, not a column drop. A half-step now (drop the FK,
keep the stub) is throwaway when Epic 8 rebuilds the table.

**Interim handling for audit finding #1** (workflow-delete cascade): just
`delete notifications where workflowId in (workflowIds)` during workflow
deletion — cheap, correct, and it deletes itself when Epic 8 lands. (If we ever
decide to drop `notifications.workflowId` early for symmetry with labels, it's
confirmed vestigial and low-risk — but the current call is defer.)

---

## Schema implications to remember for Epic 8

- Treat the events/alerts tables as a **greenfield build** that replaces both
  `notifications` and `activity_log`; don't over-invest migrating the current
  stub rows.
- Keep `item_id` **nullable** on events (Level B path); do not add
  `subject_type`/`subject_id` until project (or other) events are actually built.
- Workphase/workflow trigger context goes in `event.payload` as **snapshotted
  values** (names, not just IDs), never as FKs.
- The `event_recipients` (alert) row carries only `is_priority` (snapshot at
  insert) + `read_at` + an FK to the event — no content.
- **Actor / authorship is a snapshot, not a live FK** (the assignment-vs-authorship
  distinction — see the `architecture-data-modeling` memory). An event's `actor`
  identity is snapshotted so attribution survives the actor's deletion, exactly
  like chat message authorship. Related interim state: `chat_threads.agentId`
  landed as `ON DELETE SET NULL` on 2026-07-17 (keeps agents deletable while chat
  has no UI); replace it with an author snapshot when chat is actually built.

---

## Deferred (cross-cutting, not events-specific): system-wide UI consistency pass

Parked here for visibility; **not** an events decision. Epic 8 reworks the notification
UI, which makes it a natural window to do a **system-wide front-end consistency pass**
rather than continuing to fix duplication one component at a time.

The point of the pass is to make deliberate, holistic decisions about **what gets
promoted to shared constants/components vs. what we're content leaving as intentional
one-offs** — inputs/selects, buttons, badges, icons, repeated JSX. (The Epic 3 audit's
individual *Duplication & Abstraction* findings are being addressed now; this note is
about the later once-over across the whole app, not that backlog.) No dependency on the
events work — if Epic 8 slips, spin it out as its own tech-debt ticket.

**Also a good time to revisit remaining ESLint issues.** As of 2026-08-05, a full
`client` lint sweep was triaged and cleaned up: `coverage/` (generated, not source)
excluded from linting; the two `react-refresh/only-export-components` violations
fixed by moving `getAncestors`/`subrowContainerId` into their natural shared-lib
homes (`lib/hierarchy.ts`, `workflow/boardDndUtils.ts`); two confirmed-safe
violations (`ProjectSidebar.tsx`'s ref read, `ProjectPage.tsx`'s narrowed
`useEffect` deps) given documented `eslint-disable-next-line` suppressions rather
than left as unexplained noise. **Three remain, deliberately deferred, all the same
shape:** `react-hooks/set-state-in-effect` in `BoardView.tsx`, `ItemDetailPanel.tsx`,
and `ProjectPage.tsx` — each resets local UI state (loading flags, edit-draft
fields) synchronously inside a `useEffect` when an id/prop changes, then fetches.
Legitimate, common pattern, not a bug — but the properly-idiomatic fix (e.g. keying
these components by `itemId`/`project.id` so React remounts fresh instead of
manually resetting each field) is a real behavioral change worth testing carefully,
not a drive-by lint fix. This UI consistency pass is the natural point to either do
that refactor for all three at once, or make a deliberate, documented call to
suppress them too.

---

## Deferred (not events-specific): column merging-expanding rework

*Moved from `epic-4-decisions.md` §11 (2026-10-05).* It was recorded there as context for that epic's decisions, and was already written as work to defer past it. "This epic" in the first paragraph meant Epic 4. Epic 4's §10, the start datetime feature, points here for the date buckets.

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
   whichever comes first. The done-column rework is Epic 4's, so
   `epic-4-decisions.md` §11 keeps a pointer to this.
3. **List identity** — `Placement` (`itemListOps.ts`) carries
   `workphaseId` / `parentId`, and `isIdentity`'s `sameList` reads "same
   workphase = same list." Two date buckets in one column share a
   workphase, so a bucket-to-bucket move would read as identity and
   no-op. `Placement` gains the bucket; `isIdentity`, `toRequest` and
   `placementFor`'s card-list branch compare and emit it. The ghost /
   pending marker follows for free (wiki board-drag-interaction §10:
   placement is all three), but `itemListOps.ts`'s per-list selectors
   filter by bucket too.
4. **Server** — the board response's `subRows[].workphase` shape becomes a
   bucket, and `PATCH /items/:id/move` has to accept whatever a date/tag
   bucket writes (a `startAt`? a label?) — which is also the open product
   question: what a drop *into* a date bucket means for the item's date.

Not to be pre-built in Epic 3.5. The point of recording it is that Stories
4.1's `kind` discriminant plus the audit's #7/#8 leave the facet work
confined to these four, rather than a branch in twelve places.

---

## Deferred (not events-specific): the board's presentation, from A5c

A5c writes the API's rules for boards, columns and Unsorted out in full, and treats the board's presentation as a minimum-viable placeholder (Nathan, 2026-10-05, A5c's D1). Each item below is under the wiki page's Open questions (boards-columns-unsorted). Nathan confirmed the deferrals at A5c's batch 1 stop (2026-10-05). They're decisions for this epic or later:

- **How columns merge and subdivide,** and how merged and expanded columns look. Nathan expects this reworked. The section above holds the facet idea.
- **A board's column order.** A board orders its columns freely, so it can show workphases out of the workflow's order. Nathan expects that to change.
- **The column editor** (A5c's G2 and G6). It offers ranges the API refuses, one that overlaps another column or spans done and active workphases, then shows the API's 400. It does stop a range whose start comes after its end.
  - **The 400 it shows names an unnamed column by its id** (G6). The messages for an overlap and for a terminal-flag change quote a column's own name, or its id when it has none. Every column a new board starts with has none, so the editor usually shows an id where the board shows the column's name.
  - An API caller has the response's `conflictingColumnId`, so the message matters only where a person reads it, which today is the editor.
- **A board out of step with its workflow** (A5c's G1).
  - **Nathan's principle for the rework:** editing a workflow or its workphases shouldn't need to consider boards. A board recognizes when its configuration is out of sync with its workflow. How precisely is for the rework.
  - **Today a workphase reorder isn't checked against columns.** It can leave two columns overlapping, and the board response then lists that workphase's items in both. It can also leave a column spanning done and active workphases. No UI or MCP tool sends a reorder, so only a direct API call does this.
  - **`broken`** (a column whose start comes after its end) is today's one case of a board recognizing it's out of sync. A broken column keeps showing its items and takes no drop.
  - **Two rules today make a workphase write consider boards,** and both stay on the page until the rework weighs them against the principle (A5c's deduction h):
    - a terminal-flag change that would leave a column spanning done and active is refused. The Quick Items epic is expected to remove the terminal flag, which retires this rule;
    - a workphase delete shrinks the columns covering it, and deletes a column it was the only workphase of.
- **The Unsorted bucket, the "needs attention" badge and the "broken" badge:** how they look, and their tooltips (A5c's G3(b)).
  - The badge is raised by anything in `unsorted`, so it can show over a bucket that lists nothing.
  - **An inherited view:** the badge counts every project's drift, but the bucket lists only the project's own.
  - **An Attached item whose own workphase is missing or foreign** (A5c's deduction i): the API lists it in `unsorted.invalidItems`, but the board shows it with its parent, never in the bucket by itself. A5c ruled that by the wiki, with no code change (its G3(a)).
  - The tooltip mentions only uncovered workphases.
- **The inherited view** (A5c's G5). A project that inherits its workflow sees its ancestor's board, filtered to its own items, with board and workphase management hidden.
  - It shows only the project's own items, not those of its descendants that inherit the same workflow. The owner's board shows them all.
  - Boards are due to become project-owned, paired with URL routing (root `CLAUDE.md`), which would rework this view.
- **A board's show-attached-children setting:** whether Cards open with their attached children showing.
- **A project that uses no workflow** (A5c's G4), its own or an ancestor's, has no board. An item created there with no workphase shows nowhere. `epic-4-decisions.md` §12's ATT-5.11 asks a related question about workflow-less projects, which that epic's status model may settle.

**A5c's calls 1, 3 and 5 stayed on the page:** the last board's 409, a column that can always be deleted, and the overlap 400. Nathan ruled each stays only if the code already does it, and A5c's batch 3 tests show it does.

## Deferred (not events-specific): the project page and the sidebar, from A5d

A5d writes the project tree's API rules out in full. It treats the project page, and the sidebar's controls other than the drag, as a working placeholder, the same two tiers as A5c (Nathan, 2026-10-05, A5d's D1). Each item below is under the wiki page's Open questions (project-tree). This epic reworks navigation, with its tile-based dashboard and quick-nav sidebar, so these are decisions for it or later:

- **The project page:** the breadcrumb, the tabs, the Overview tab with its description, parent dropdown and subprojects list, and the banner over an inherited board.
  - The parent dropdown offers the top level and every project outside the project's own subtree, which is what the API accepts.
  - Whether it also leaves out a parent that would put the subtree past the project depth cap is open. Epic 3.5's Story 7 set that cap at 12.
- **The sidebar's other controls:** the create and delete buttons, how a delete asks first, the collapse chevrons, and the remembered selection. The create dialog trims a name, and refuses an empty one.
- **How the user learns that a project write failed** (A5d's call 11). Nathan ruled that the sidebar puts the project back where it was, which it does today. He deferred telling the user more visibly.
  - A failed create's dialog shows an error.
  - A failed move shows nothing but the project going back. A collapsed project the drop opened stays open.
  - A failed parent change puts the dropdown back on the stored parent, and reaches the user only as a console error.
- **How a tab state over the project cap looks in the sidebar.** A5d plans that it's still offered, its line is marked invalid, and a release in it writes nothing.
- **What a project that uses no workflow shows:** "Set up a Workflow", and no board. The A5c section's entry on such a project holds the rest.
- **Overriding an inherited workflow from the project page** (A5d's G8). Nathan ruled that any project can be given a workflow of its own, and otherwise inherits one. The API accepts an override, and nothing on the page offers one yet.
  - An override, like a move under a different workflow, leaves the subtree's items holding the old workflow's workphases, so they show in Unsorted. Re-filing them is undesigned (`epic-7-decisions.md`'s Q2, and item-attachment's Open questions).

**Not on this list:** the project cap's value, which Epic 3.5's Story 7 set at 12 for items and projects alike.
