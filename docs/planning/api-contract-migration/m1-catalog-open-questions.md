# M1 — Catalog of Open Questions Found by the Audit

**Prepared:** 2026-11-07 by the Auditor, at Nathan's direction; extended 2026-11-08 by the Architect · **Source:** the [M1 story audit](../../audits/code-quality-audit-m1-foundation.md) and the [M1 Reconciler run](../../audits/m1-reconciler-report.md): findings that would change an app behavior or an existing test's expectation · **Status:** deferred until the migration is complete; nothing here is decided or scheduled

## Purpose and boundary

The Zod migration changes as little as possible in tests and API behavior. The existing suite is what proves the migration caused no regressions, so a behavior fix made along the way would blur that proof. Nathan's direction: record these, don't tackle them now, and work through the catalog after the migration finishes.

Each entry is current behavior that looks like a bug or an enhancement. The wiki says nothing about any of them, so each needs a PO ruling before a fix lands. Until then:

- **Preserve the current outcome.** The migration neither fixes nor loosens them.
- **Capture it where a receiving batch characterizes the route** (M2 for items), so the frozen outcome is visible and a later fix is a deliberate, reviewed change to a test.
- **A fix is its own story** through the normal PO / Test Planner / Coder / audit workflow, with its own expectations updated on purpose.

These sit beside CF1–CF7 in [the post-migration decisions queue](../tech-debt-stories/api-contract-compatibility-follow-ups.md). They are numbered OQ here so they don't collide with those. Where an entry is the same class as a CF, it's decided with that CF. OQ1–OQ9 are behavior questions for the PO; OQ10–OQ11 are test-suite changes the migration doesn't need.

## OQ1 — `POST /items` reads `isAttached` by truthiness

- **Observed:** a create with a parent stores `Boolean(isAttached)` when the field is present, so any truthy value attaches the child. `"false"` stores an attached child (`is_attached = 1`) and `"true"` attaches by the same accident. `null` with a parent stores a detached child. Without a parent, any truthy value is refused as "attached with no parent".
- **Where:** `server/src/lib/itemHierarchy.ts:230-231` (`resolveCreate`: `!parent && req.isAttached`, then `Boolean(req.isAttached)`); reached from `server/src/routes/items.ts` (POST `/`).
- **Reachability:** nothing in the repo sends a string. The client types the field as `boolean` (`client/src/api/items.ts`). MCP advertises `is_attached` as `type: 'boolean'` (`server/src/mcp.ts`), but its dispatcher forwards raw arguments without validating them (CF5), so an agent that ignores the advertised type reaches this. A raw REST caller can too.
- **The inconsistency:** `PUT /items/:id` and `PATCH /items/:id/move` refuse any non-boolean with 400 "isAttached must be a boolean" (`server/src/schemas/items.ts`). The code says a create and a move can't disagree (`itemHierarchy.ts`, above `resolveCreate`; wiki item-attachment §14), yet they disagree here.
- **Nathan's expectation:** `"false"` should be detached and `"true"` should be attached.
- **Decision needed (PO):** two ways to get there, with a trade-off:
  - **Coerce the strings** on create, as Nathan expects. Unlike refusing, this accepts `"true"`/`"false"` on POST while PUT and PATCH refuse them, unless coercion is extended there too. Existing tests pin the PATCH refusal (`server/tests/routes/items.hierarchy.test.ts:168` sends `isAttached: 'yes'` and expects a refusal), so extending it to PATCH would change a test on purpose.
  - **Refuse any non-boolean** on create with the same 400 as PUT and PATCH, so all three entry points agree and an agent that sends `"false"` gets an error it can act on, not a silently wrong item. The Auditor leans this way; it is a smaller change, but it isn't what Nathan described.
  - Either way, decide `null` with a parent (today: detached; PATCH refuses it) and `0`/`1`, `"yes"`.
- **Migration boundary:** preserve today's outcome. M2 Batch 1's characterization of `POST /items` should record `"false"` → attached and `null` → detached as current behavior. The compatibility corpus has no POST case yet, and no existing test pins either value.

## OQ2 — A rename and a move in one `PUT` write the old title into the notification

- **Observed:** the notification text is `"<title>" moved to "<workphase>"`, stored as a string and shown as stored (`client/src/components/NotificationsBell.tsx`). When one `PUT /items/:id` both changes the title and changes attachment or parent so that the item lands in a workphase that triggers a notification, the stored text uses the title from before the rename. The item is then called by a name it no longer has, and the text stays that way. The text doesn't say the old name is the new one; it names a title the board no longer shows.
- **Where:** the route writes the new title inside its transaction, then calls `applyHierarchyRequest(tx, item, …)` with the `item` row read before that write (`server/src/routes/items.ts`, the PUT handler); the notification message is built from `item.title` at `server/src/lib/itemHierarchy.ts:464`.
- **Example:** MCP `update_item {title: "New", is_attached: true}` on a detached child whose parent sits in a workphase with `triggersNotification` stores `"Old" moved to "Review"`.
- **Reach:** narrow. The UI's attach and detach gestures use `PATCH /items/:id/move`, which carries no title, so in practice only a caller sending both fields to PUT gets here (an agent, through MCP). The other `item.title` uses in `itemHierarchy.ts` are in error messages built before the update, so they are correct.
- **Decision needed (PO):** the wiki is silent on notification text. The fix is small (pass the title being written into `applyHierarchyRequest`, or re-read the row inside the transaction), but whether the text should show the new title, both, or something else is a ruling.
- **Migration boundary:** preserve. No existing test is known to pin a rename-and-move together. The snapshot does pin the text for a move without a rename (`server/tests/contracts/__snapshots__/apiCompatibility.test.ts.snap`, the `"Moving" moved to "Active"` entries). M2's characterization of `PUT /items/:id` should record this combined case.

## OQ3 — A move to no workphase is logged as `to "unknown"`

- **Observed:** moving an item to no workphase (`PATCH /items/:id/move {workphaseId: null}`, filing it into Unsorted) records the activity entry `Moved from "Todo" to "unknown"`. The "from" side already writes `"none"` for no workphase. The code can't tell a deliberate move to nothing from a workphase id whose row doesn't resolve, and writes `"unknown"` for both.
- **Where:** `server/src/lib/itemHierarchy.ts:454` (`newWorkphase?.name || 'unknown'`); the matching "from" side is `oldWorkphase?.name || 'none'` on the same line.
- **Nathan's expectation:** `"unknown"` may be acceptable, but a deliberate move to no workphase should read as `"none"` or `"no workphase"` or similar.
- **Decision needed (PO):** the wording. The Auditor suggests `none` for a deliberate `null` to match the "from" side, keeping `unknown` only for an id with no row; `no workphase` or `Unsorted` are the alternatives.
- **Migration boundary:** preserve. This one is pinned: the ATT-9.11 snapshot freezes the string (`apiCompatibility.test.ts.snap`, the `"Moved from "Todo" to "unknown""` entry), so the fix story updates that snapshot entry on purpose and nothing in the migration touches it.

## OQ4 — A move naming its neighbor as `null`: items refuse it, projects ignore it

- **Observed:** an item move with `{anchorId: null, side: 'after'}` gets 400 "anchorId does not reference an existing item". A project move with `{prevId: null, nextId: null}` reads both as "no neighbor" and appends.
- **Pinned by:** the corpus examples "item null anchor is not omission" and "TREE-6.2: project both null neighbors append"; `server/tests/routes/projects.test.ts:409` and `:466`, under TREE-6.2's and TREE-6.7's IDs, though neither case's text names `null`.
- **Source:** Reconciler run, Candidate New Cases item 1.
- **The inconsistency:** item and project tree operations are meant to behave alike. Wiki row-references §2 leaves what `null` means to the field's page, and neither positioning §2 nor project-tree §6 says, for a neighbor.
- **Decision needed (PO):** one meaning for both trees. Decide with CF1, which covers an unused `nextId`. Either way, a test changes on purpose.
- **Migration boundary:** preserve both.

## OQ5 — `workphaseId: null` on a write that leaves an item Attached

- **Observed:** when the parent is in a workphase, the write is refused with ATT-9.1's message.
- **Pinned by:** the corpus example "ATT-9.1: item attached child rejects explicit null workphase".
- **Source:** Reconciler run, Candidate New Cases item 2 and Test Quality Concerns item 6.
- **The gap:** wiki item-attachment §2a says such a write "may name the parent's workphase, or none". It doesn't say whether an explicit `null` is "none" or "any other", nor what applies when the parent itself has no workphase, so `null` *is* the parent's.
- **Decision needed (PO), then Test Planner:** if `null` counts as "any other", ATT-9.1 gains a clause and the corpus title's claim stands. Otherwise the behavior changes and the claim is retitled. The corpus title stays as it is until the ruling.
- **Migration boundary:** preserve.

## OQ6 — Non-string input values reach a 500

- **Observed:** a non-string comment `content`, and an object `title`, `parentId` or `workphaseId` passed through to better-sqlite3, end at the global handler's 500 instead of a 400.
- **Where:** `server/src/routes/items.ts:100, 237, 339-340`.
- **Source:** audit #31.
- **Decision needed:** the same class as CF2 (malformed input reaching 500), so decide with CF2.
- **Migration boundary:** preserve. M2 Batch 1 captures the create and comment routes with these outcomes.

## OQ7 — MCP `urlPart` lets `.` and `..` through

- **Observed:** `get_workflow {workflow_id: "."}` sends `GET /api/workflows/` and returns every workflow. No harmful write was found.
- **Where:** `server/src/lib/urlPart.ts:9-11`.
- **Source:** audit #32.
- **Decision needed:** whether MCP tools refuse such ids is a change to tool behavior, so decide with CF5.
- **Migration boundary:** preserve.

## OQ8 — A reindex bumps `updatedAt` on rows whose position doesn't change

- **Observed:** every row in a reindexed scope gets a new `updatedAt`, including rows the reindex left at the same number.
- **Where:** `server/src/lib/positionResolver.ts:300-305`.
- **Pinned by:** the TC-5.2 and TREE-4.5 corpus snapshots.
- **Source:** audit #35.
- **Decision needed (PO):** whether `updatedAt` means "row content changed" or "row was written". The wiki is silent.
- **Migration boundary:** preserve.

## OQ9 — Item-detail activity with equal timestamps has no stable order

- **Observed:** the activity list sorts by `created_at` alone, so entries with the same timestamp come back in SQLite's incidental order.
- **Where:** `server/src/routes/items.ts:83-88`.
- **Pinned by:** the TC-2.13 corpus snapshot pins whichever order SQLite gives today. If that order shifts, the snapshot fails for a reason unrelated to the migration.
- **Source:** audit #35.
- **Decision needed (PO):** the tiebreak, for example insertion order. Adding one may reorder today's output.
- **Migration boundary:** preserve. If the snapshot flakes during the migration, treat it as evidence for this entry, not a regression.

## OQ10 — The corpus's `foreign-item` variant also creates an impossible attached child

- **Observed:** `setItemWorkphase` moves only the parent, so the attached child is left in a workphase other than its parent's. `server/tests/fixtures.ts:195-197` lists that as a state no write produces.
- **Where:** `server/tests/contracts/compatibilityHarness.ts:149`; snapshot lines 1018-1036.
- **Source:** audit #20.
- **Why deferred:** a test-only defect. Fixing the fixture changes a snapshot the migration relies on. If M2 changes how such a child is read, the corpus will report a diff for a state no user can reach. Read that diff as this entry, not a regression.
- **Owner:** Architect/Coder, with the Reconciler, after the migration. No PO ruling is needed.

## OQ11 — ATT-7.1's edit path is asserted only through log text

- **Observed:** the only test carrying ATT-7.1 detaches by move. On a PUT detach, the kept `parentId` is asserted only indirectly, through ATT-8.1's log-content tests.
- **Proposed fix:** add `parentId: a.id` to the `toMatchObject` at `server/tests/routes/items.workphase.test.ts:169`, then stamp ATT-7.1 on that test (WP:160).
- **Source:** Reconciler run, Proposed Stamps item 1 and Test Quality Concerns item 5.
- **Why deferred:** it adds an assertion to an existing product test that the migration doesn't need, and the file is shared with `main`. ATT-7.1 stays `Automated` either way.
- **Owner:** Reconciler and Test Planner, after the main merge (M5's post-merge list names it).

## Handoff

- **PO:** rulings on OQ1 (coerce or refuse, and the `null`/other-value cases), OQ2 (what the notification should say), OQ3 (the wording), OQ4 (one `null`-neighbor meaning, with CF1), OQ5 (whether `null` is "none"), OQ6 (with CF2), OQ7 (with CF5), OQ8 (`updatedAt`'s meaning) and OQ9 (the tiebreak), after the migration is accepted. None blocks M1–M5.
- **Test Planner:** a ruling adds or changes test-plan cases. The wiki and catalog are the owners' to edit, and are not edited here.
- **M2:** characterize `POST /items` and `PUT /items/:id`, and the comment route, with OQ1, OQ2 and OQ6's outcomes captured as current behavior, not corrected.
- **Receiving story:** a fix for any entry gets its own plan through the normal workflow, and carries the entry's ID.
