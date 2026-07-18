# Epic 6+ Deferred Decisions — Inbox & Item Orphaning

Technical decisions captured so `mvp-roadmap.md` can stay high-level. Reference
for when Epic 6 (Inbox) is built. Recorded 2026-07-17 while implementing finding
#1. Nothing here is built yet.

## Context

Finding #1's soft-reference work made `items.workphaseId` tolerate null/misaligned
values (see the `architecture-board-column-workflow` memory). The parallel
question one level up — what happens to items when their **project** is deleted —
was deliberately deferred to Epic 6, because orphaned items need the Inbox to be
visible.

## Decisions

### 1. `items.projectId` stays nullable — items can be orphaned
Rejected making it `NOT NULL`. An item's project is its "home," but the user
should be able to delete a project and keep its items. This mirrors the
workphase tolerate-and-surface model one level up: at every level a reference
degrades gracefully and a catch-all surface exposes the strays.

| Broken reference | Where it surfaces | Fix |
|---|---|---|
| `workphaseId` null/misaligned | board Unsorted, as "Unknown status" | reassign status (done — Epic 3) |
| `projectId` null | **root-level inbox** | reassign project (or leave orphaned) — **Epic 6** |

### 2. Project delete → "reassign or orphan", not forced cascade
Today `deleteProjectById` hard-deletes a project's items (subtree semantics, kept
for now). Epic 6 adds a "this project has X items — reassign them?" flow that lets
the user reassign `projectId` to a new project, or orphan them (`SET NULL`).
Same FK-with-`ON DELETE SET NULL` treatment already applied to `workphaseId` — the
capability is the same tool (see [[architecture-data-modeling]]), just applied to
`projectId`. Don't destroy items over a project deletion.

### 3. The root inbox is just a saved filter (`projectId IS NULL`)
Not a hardcoded special surface — consistent with the board memory's "My
Attention is just a saved filter." Falls out of Epic 6's inbox model for free. An
orphan has no project → no effective workflow → its `workphaseId` reads Unknown
everywhere; it lives only in that inbox.

## Why deferred (not done with finding #1)

Changing project-delete to orphan-instead-of-delete without the inbox would make
orphaned items **invisible** (no surface shows them). So the `projectId`-orphan
behavior waits for Epic 6's inbox. Until then, project delete keeps removing its
items, and `items.projectId` stays a plain nullable FK (no `ON DELETE SET NULL`
yet — that's the one SET-NULL case finding #1 intentionally left out).
