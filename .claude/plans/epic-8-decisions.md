# Epic 8+ Deferred Decisions — Events, Alerts & Notifications

Technical decisions and discussion captured so `mvp-roadmap.md` can stay
high-level. Reference doc for when Epic 8 (Notifications / Inbox priority) is
actually built — or when pieces slip into the **post-Epic-7 rework window**.

Companion to the `architecture-events-notifications` memory note, which holds
the detailed table shapes (events, event_recipients, notification_preferences,
the priority cascade, unread model). **This doc is canonical for the decisions;
the memory is the schema sketch.** Where they overlap, this doc wins.

Decisions recorded 2026-07-17 while auditing Epic 3. Nothing here is built yet.

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
