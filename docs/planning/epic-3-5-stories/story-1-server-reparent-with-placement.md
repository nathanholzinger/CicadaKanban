# Story 1 — Server: atomic reparent-with-placement

Implementation plan for Epic 3.5 Story 1. Rules live in the wiki; this file
is *how to build them* and becomes a historical record once done.

**Status: done 2026-09-11.** Built as planned, with the deviations recorded
in "As built" at the bottom.

- Story entry: [`epic-3-5-roadmap.md`](epic-3-5-roadmap.md) § Story 1
- Rules: [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md)
  §1, §4–§11a · [`../../wiki/item-positioning/`](../../wiki/item-positioning/README.md)
  §2 (scope-change table), §5 (disclosure), §7
- Cases: [`../../test-plans/item-attachment/`](../../test-plans/item-attachment/INDEX.md)
  ATT-1…ATT-7 · [`../../test-plans/item-positioning/part-7-board-placement-intents.md`](../../test-plans/item-positioning/part-7-board-placement-intents.md)
  TC-7.5…7.15 (server-side halves)

**Verified by API tests alone — no UI changes in this story.**

---

## Decisions made while planning (2026-09-11)

These weren't in the wiki and were settled with the Product Owner before
this plan was written. None of them change a wiki rule; they pin API
surface and scope edges.

1. **`CAP` lives server-side for now.** `ITEM_DEPTH_CAP = 6` is defined once
   in `server/src/lib/itemTree.ts`. Story 2 — the first UI consumer — picks
   the client/server sharing mechanism (a `shared/` module or an API-exposed
   value); this story doesn't pre-build it.
2. **Reindex disclosure is an optional `reindexed` field on the existing
   item response**, on every item write that can reindex (`POST /items`,
   `PUT /items/:id`, `PATCH /items/:id/move`). Absent when no reindex
   fired. The response shape otherwise doesn't change — no `{ item, … }`
   wrapper. `PATCH /projects/:id/move` adapts to the resolver's new return
   type but does not surface the field.
3. **One shared hierarchy primitive, three entry points.** PUT is the
   Sheet's edit endpoint and should eventually be able to do anything move
   can (Epic 7 adds a workphase dropdown to the Sheet). So the primitive is
   built general — parent, flag, workphase, optional anchor — and:
   - `PATCH /move` gets the full surface now (`parentId`, `isAttached`
     added alongside `workphaseId`, `anchorId`/`side`, `position`);
   - `PUT` keeps its current contract (`parentId`, `isAttached`; no
     workphase, no anchor) but calls the same primitive, so widening it
     later is wiring, not reimplementation;
   - `POST` shares the legality guard (exists / cycle / depth cap).
4. **Attached + explicit `workphaseId` is a 400** when the workphase
   differs from the parent's. An attached item inherits; a contradicting
   value is a client bug, same reasoning as §1's parentless-attach.
5. **No `projectId` on move.** Cross-project reparenting is expressed only
   as `parentId` naming an item in another project; the server derives
   `projectId` from the parent and cascades it. Root-level "move to project
   X" is Epic 7's.
6. **Activity type `hierarchy_change`.** The client's `ActivityLog.tsx`
   renders `content` generically, so no client change. `schema.ts`'s
   type-enum comment gets the new value.
7. **MCP tools unchanged.** `move_item`/`update_item` keep their shapes;
   they fan out from Zod in Epic 4.
8. **Tests go in Vitest (`server/tests/`)**, the route-test convention
   since Epic 1.5. The Playwright `tests/api/` specs from Epic 3.2 aren't
   extended. Coverage thresholds gain `src/routes/items.ts` and the new lib
   modules per the extend-per-epic convention.

---

## Target design

### `server/src/lib/itemTree.ts` — depth math (extends the existing module)

```ts
export const ITEM_DEPTH_CAP = 6;

// 1-based: a root item is at depth 1 (wiki §8). Cycle-guarded like the
// rest of this file. items.ts's GET /:id keeps its existing 0-based
// `depth` response field by subtracting 1 — API contract unchanged.
export function hierarchyDepth(itemId: string, tx?: Tx): number;

// Levels *below* the item — a leaf is 0. Counts detached descendants
// (wiki §8: "the subtree is the full descendant subtree").
export function subtreeHeight(itemId: string, tx?: Tx): number;

// null if legal, else the 400 message. `movingId` null means a brand-new
// item (height 0) — POST's case.
export function assertWithinDepthCap(parentId: string, movingId: string | null, tx?: Tx): string | null;
```

`computeDepth` moves out of `items.ts` into here as `hierarchyDepth`.

### `server/src/lib/positionResolver.ts` — reindex disclosure

`reindexPositionsInScope` returns the `{id, position}[]` it wrote. The two
public resolvers return `{ position, reindexed }` instead of a bare
number:

```ts
export type ReindexedPosition = { id: string; position: number };
export type PositionResolution = { position: number; reindexed: ReindexedPosition[] };
```

Every existing call site (`items.ts`, `projects.ts`, `workphases.ts`)
destructures `.position`; the item routes additionally collect
`reindexed`. The written item is included when it was in the reindexed
scope (it always is — the reindex runs before the insert/update, over the
scope minus the subject, so the subject's own value is the fresh one; the
route appends `{id: subject, position: resolved}` only when `reindexed` is
non-empty, per wiki §5 "the written item is included").

### `server/src/lib/workflowItems.ts` — effective workflow for a project

```ts
// Walk projects.parentId upward until a project that owns a workflow
// (workflows.projectId) is found. Inverse of getProjectsUsingWorkflow.
export function effectiveWorkflowIdForProject(projectId: string, tx?: Tx): string | null;
```

Needed to decide whether a subtree item's workphase is foreign after a
cross-workflow reparent (wiki positioning §7.3).

### `server/src/lib/itemHierarchy.ts` — the shared primitive (new)

```ts
export type HierarchyRequest = {
  parentId?: string | null;    // undefined = unchanged; null = reparent to root
  isAttached?: boolean;        // undefined = keep current state
  workphaseId?: string | null; // undefined = unchanged
  anchorId?: string;
  side?: Side;
  position?: number;           // raw escape hatch (move only; PUT never passes it)
};

// Pure pre-transaction validation, against plain `db`, returning the
// first 400 message or null. Mirrors the audit Finding #12 convention:
// nothing inside the transaction bails out by returning.
export function validateHierarchyRequest(item: ItemRow, req: HierarchyRequest): string | null;

// Applies the change inside the caller's transaction. Returns the
// reindex disclosure for the response.
export function applyHierarchyRequest(tx: Tx, item: ItemRow, req: HierarchyRequest): { reindexed: ReindexedPosition[] };
```

**`validateHierarchyRequest` checks, in order:**

1. `isAttached` (if present) is a boolean; `side` valid iff `anchorId`
   given; `position` finite; `workphaseId` (if non-null) exists.
2. Parent, when `parentId` is a string: exists (§7.1), not self (§7.2),
   not a descendant (§7.3, `assertValidReparent`), within cap (§8,
   `assertWithinDepthCap`). **No same-project check** — lifted (§9).
3. Resulting state = `{ parentId, isAttached, workphaseId }` computed from
   request-over-current. Then:
   - resulting attached with no parent → 400 (§1).
   - resulting attached and request carries a `workphaseId` ≠ parent's →
     400 (decision 4).
4. Anchor, when given: exists, has a position, and `sharesPositionScope`
   against the **resulting** state (positioning §7.1 "scope check happens
   against the resulting state").

**`applyHierarchyRequest`, in order** (all inside `tx`):

1. Compute the resulting state (same derivation as validation). Resulting
   `projectId` = new parent's when `parentId` is a string, else unchanged.
   Resulting `workphaseId` = parent's if attached, else
   `req.workphaseId ?? item.workphaseId`.
2. **Project cascade** — if `projectId` changed, write it to the moving
   item and every descendant (`walkItemDescendants`, attached and
   detached alike — §9).
3. **Write parent / flag / workphase** on the moving item.
4. **Resolve position** against the resulting scope
   (`positionScopeFor(resulting, item.id, tx)`) — this is what "reparent
   first, then resolve" (§5) means operationally: the scope is derived
   from the new parent, never the old one.
   - anchor given → `resolvePositionByAnchorAndSide`
   - raw `position` given → as-is
   - scope changed (attach↔detach, reparent-while-attached, root↔child
     for an attached item) with no anchor → `resolveAppendPosition`
   - scope unchanged, no anchor, workphase changed, item has a position →
     keep (§2 addendum)
   - scope unchanged, no anchor, no position to keep → append
   - "scope changed" is the existing `scopeUnchanged` test from PUT
     generalized: a redundant re-attach to the same parent is *not* a
     scope change and keeps its position.
5. **Terminal transition** for the resulting Free item (existing move
   logic, unchanged): terminal workphase → `position = null`,
   `completedAt = now`; non-terminal with a stale `completedAt` → clear.
   Attached items never touch `completedAt` and keep their position (§2).
6. **Workphase cascade** — `cascadeWorkphaseToAttachedDescendants` when
   the item's workphase changed.
7. **Cross-workflow nulling** (positioning §7.3) — when `projectId`
   changed and `effectiveWorkflowIdForProject(newProjectId)` differs from
   the workflow of any subtree item's *own* workphase: null the position
   of each such item that keeps its own workphase — the moving item if
   Free, and every detached descendant. Attached descendants inherit and
   keep their parent-scoped position. Cheap to evaluate: the check is one
   workflow lookup per distinct workphase in the subtree.
8. **Activity log** — one `hierarchy_change` entry on the moving item when
   `parentId` or `isAttached` changed (§11a): "Attached to «B»",
   "Detached from «B»", "Reparented from «A» to «B»", "Made top-level
   (was under «A»)". Metadata `{ fromParentId, toParentId, fromAttached,
   toAttached, fromProjectId?, toProjectId? }`. Plus the existing
   `status_change` entry and `triggersNotification` insert when the
   workphase changed (moved here from the move handler so PUT-driven
   workphase changes get them too — PUT's attach-snap currently logs
   nothing, which §11a's "every entry point" also closes).

The primitive returns the collected `reindexed` pairs; the route attaches
them to the response.

### Route changes

**`PATCH /items/:id/move`** — accepts `parentId`, `isAttached` in addition
to today's fields. The "nothing to do" 400 widens to include them. Body →
`HierarchyRequest`, validate, transaction → `applyHierarchyRequest`, respond
with `withPositionScope(updated)` + `reindexed` when non-empty. The handler
shrinks to plumbing.

**`PUT /items/:id`** — field edits stay inline; when `parentId` or
`isAttached` is present the hierarchy part becomes
`validate → applyHierarchyRequest({ parentId, isAttached })`. The
same-project 400 is deleted. The existing assignment activity entry stays.
Response gains `reindexed` the same way.

**`POST /items`** — `assertWithinDepthCap(parentId, null)` after the
parent-exists check. The explicit-`projectId`-≠-parent's 400 **stays**: it's
not the same-project reparent restriction, it's "a hierarchy can't straddle
two projects" (§9) — the fix for a caller that wants another project is to
omit `projectId` and let it derive. Response gains `reindexed`.

**`GET /items/:id`** — `depth` stays 0-based (`hierarchyDepth(id) - 1`).

---

## Implementation sequence

Each step leaves the suite green. Steps 1–3 are independent and could be
done in any order; 4 depends on all three; 5–7 depend on 4.

### Step 0 — Baseline
`npm run test:unit && npm run typecheck` green before touching anything.
Note the current coverage numbers for `items.ts`.

### Step 1 — Depth math (`itemTree.ts`)
- Add `ITEM_DEPTH_CAP`, `hierarchyDepth`, `subtreeHeight`,
  `assertWithinDepthCap`. Move `computeDepth` out of `items.ts`.
- `server/tests/lib/itemTree.test.ts`: root depth is 1 / leaf height 0
  (ATT-4.6); height counts the detached branch (ATT-4.5); boundary
  `D + 1 + h = CAP` legal, `CAP + 1` not (ATT-4.4); over-cap subtree
  refused for a root target (§8 strict); cycle-guarded on corrupt data
  (existing Finding #11 test pattern). All parameterized on the constant.

### Step 2 — Reindex disclosure (`positionResolver.ts`)
- Return `PositionResolution` from both public resolvers; thread the pairs
  out of `reindexPositionsInScope` through `fitOrReindexAndRetry` /
  `appendOrReindexAndRetry`.
- Adapt call sites: `items.ts` (×5), `projects.ts`, `workphases.ts`.
- `server/tests/lib/positionResolver.test.ts`: no-reindex path returns
  `[]`; magnitude-threshold and tight-gap paths return every renumbered
  row in order; pairs contain only `id` and `position`.

### Step 3 — Effective workflow (`workflowItems.ts`)
- Add `effectiveWorkflowIdForProject`.
- Unit test: owner project, inheriting child, grandchild under an
  intermediate owner, project with no workflow anywhere above → null.

### Step 4 — The primitive (`itemHierarchy.ts`)
- Write `validateHierarchyRequest` + `applyHierarchyRequest` per the
  design above. Lift the hierarchy branch out of PUT and the position /
  terminal / cascade / log / notification branches out of move into it.
- `server/tests/lib/itemHierarchy.test.ts` for validation (pure, cheap
  to enumerate): every 400 in the checklist, including the anchor-scope
  check against the *resulting* state (TC-7.9 accept, TC-7.10 reject).

### Step 5 — Wire PUT
- Replace PUT's inline branch with the primitive. Existing
  `items.test.ts` PUT cases must stay green unchanged (behavior-preserving
  except the two deliberate changes: same-project lifted, depth cap
  added).
- New PUT tests: cross-project reparent cascades `projectId` to the
  subtree, detached descendants included (ATT-5.1/5.2); depth cap
  enforced here too (ATT-4.4 via PUT); `parentId: null` clears the flag
  and re-resolves position for an attached item (§11); parentless
  `isAttached: true` → 400 (ATT-1.1); hierarchy activity entry written
  (§11a).

### Step 6 — Extend move
- Body gains `parentId`, `isAttached`; handler becomes plumbing.
- New move tests (the story's core matrix), one `describe` per wiki
  section:
  - **Attach with placement**: `X` free at 50.0 → attach to `P` after
    `S1=1.0` (`S2=2.0`) → position ∈ (1, 2), `parentId=P`, attached,
    workphase inherited, `X1` cascaded — one read shows all of it
    (TC-7.11, ATT-3.6).
  - **Reparent-while-attached with placement**: disjoint ranges
    (`A: 1,2,3`; `B: 100,200`) → lands in (100, 200), never (1, 3)
    (TC-7.12, ATT-3.5).
  - **Detach with placement**: attached `X` → `isAttached: false`,
    `anchorId: F1, side: after` → Free, `parentId` still `P`, position ∈
    (10, 11) (TC-7.13, ATT-7.1).
  - **Empty Stub list**: attach with no anchor → bootstrap 1.0 (TC-7.7).
  - **Done parent**: attach to a done `P` → inherits terminal workphase,
    no `completedAt`, position kept (ATT-6.1, TC-7.15); anchor on a done
    Free item → 400 (TC-7.8 server half).
  - **Cross-project, same workflow**: sibling projects sharing an
    inherited workflow → `projectId` cascades to the whole subtree, no
    positioning special case (ATT-5.1/5.2, TC-7.14).
  - **Cross-workflow**: reparent into a project on a different workflow →
    Free item's and detached descendants' `workphaseId` untouched,
    `position` nulled, attached descendants cascaded; `GET /boards/:id`
    for the target workflow's board lists the item under Unsorted /
    invalid items (§9, positioning §7.3).
  - **Reparent to root**: `parentId: null` on an attached item → Free,
    flag cleared, workphase unchanged, fresh workflow position — and the
    done consequence if that workphase is terminal (§11).
  - **Free reparent keeps Free**: `parentId` only, flag omitted → still
    Free, position untouched without an anchor (§4).
  - **Atomicity**: depth-cap reject and out-of-scope anchor reject leave
    every field on `X` and `X1` byte-identical (ATT-3.7) — assert on
    full-row equality before/after.
  - **Attached + contradicting workphaseId** → 400 (decision 4).
  - **Disclosure**: force a magnitude-threshold reindex (seed positions
    ≥ 1000 with a small scope) and assert `reindexed` on the response;
    assert it's absent on a normal move.
  - **Regression**: every existing move test unchanged.

### Step 7 — POST cap guard
- `assertWithinDepthCap(parentId, null)`; test the boundary via POST
  (ATT-4.4 "every write").

### Step 8 — E2E drag-helper extraction (`tests/helpers/dragGesture.ts`)
- Export `dragTo`, `boxOf`, `center`, `topQuarter`, `bottomQuarter`,
  `pastColumnEnd` (from `item-repositioning-cross-column-dnd.spec.ts`,
  the copy whose comments are current). Replace both spec copies and
  `attached-children.spec.ts`'s inline pointer sequence with imports. Fix
  the stale file-name comments noted in `epic-3-5-decisions.md` Q2.
- `npm run test:e2e` green. Pure refactor — no new E2E in this story.

### Step 9 — Docs and gates
- `server/vitest.config.ts` thresholds: add `src/routes/items.ts`,
  `src/lib/itemHierarchy.ts`, `src/lib/itemTree.ts` at 80/80/80/80.
- Wiki build-status headers: `item-attachment/` → §1, §4–§11a
  implemented; `item-positioning/` → §7, §5 disclosure, §2 cross-workflow
  row implemented (§5a and the client-side-role amendment stay "Story 2").
- `client/CLAUDE.md`: new lib entries in the file tree; the Attached/
  Detached section's "PUT reparent/attach ... all route through" sentence
  → name the primitive; note move accepts `parentId`/`isAttached`.
- `schema.ts` activity-type comment; `bruno/` move request example gains
  the new fields.
- `epic-3-5-roadmap.md`: Story 1 marked done with a pointer here.
- Test-plan catalog: **not** updated in this story — the test-reconciler
  pass at epic wrap-up maps cases to tests.

### Step 10 — Verification
`npm run test:all` (E2E + unit + typecheck) and `npm run test:coverage`
green; `npm run lint` clean. Manual smoke via MCP `move_item` /
`update_item` to confirm the unchanged tool shapes still work.

---

## Out of scope (deliberately)

- Any client change, including consuming `reindexed` (Story 2).
- `CAP` sharing mechanism (Story 2), its real value (Story 7).
- `projectId` as a request field / root-level move-to-project (Epic 7).
- Extending PUT with `workphaseId` or anchor placement (Epic 7 wires it;
  the primitive already supports it).
- Remapping workphases on cross-workflow reparent (Epic 7 UI).
- MCP tool shape changes (Epic 4, via Zod).
- `PATCH /items/reorder` — untouched.

## Risks / things to watch

- **Behavior-preserving refactor of PUT and move.** The existing route
  tests are the safety net; run them after Step 4 before adding anything.
  The one silent-change hazard is position resolution order — the
  disjoint-range fixture (TC-7.12) exists precisely to catch resolving
  against the old scope.
- **`reindexed` return-type change ripples into `projects.ts` and
  `workphases.ts`.** Mechanical, but typecheck after Step 2 before moving
  on.
- **Cross-workflow nulling touches rows the caller never named.** Keep it
  inside the same transaction and covered by the board-read test so a
  half-applied cascade can't hide.

---

## As built (deviations from the plan above)

- **Reindex disclosure is an optional collector argument, not a changed
  return type.** `resolvePositionByAnchorAndSide` / `resolveAppendPosition`
  keep returning a bare number and take an optional trailing
  `reindexed?: ReindexedPosition[]` that the reindex pushes into. Changing
  the return type would have rippled through ~25 resolver test call sites
  and two route files (`projects.ts`, `workphases.ts`) that don't surface
  the disclosure, for no behavioral gain. Only the item routes pass a
  collector.
- **`logActivity` moved to `server/src/lib/activityLog.ts`** so the
  primitive can log without importing from a route file.
- **The depth cap skips a same-parent attach toggle** (`parentId` equal to
  the item's current parent): that isn't a reparent, and gating it would
  make an already-over-cap item's attach checkbox fail for no reason (§8:
  the cap gates moves, not existing data).
- **A depth cap fixture in the lib tests writes `parentId` directly** —
  once POST enforces the cap, an over-cap chain can't be seeded through the
  API, and the lib tests are about the math, not the guards.
- **One E2E test was rewritten**, not just re-pointed at the helper:
  `attached-children.spec.ts` "attached child whose workphaseId goes
  invalid" used `PATCH /move { workphaseId }` on an *attached* child to
  manufacture a parent/child workphase divergence. Decision 4 makes that a
  400, so the stale-row shape is now reproduced the way a real workphase
  deletion produces it (a Free child in a temp workphase with an attached
  grandchild; delete the workphase). The client guard under test (finding
  #26) is unchanged.
- **Two existing route tests flipped to the new rules**: the same-project
  400 on PUT (now accepted with `projectId` adopted) and the
  `parentId: null` flag-preservation case (now cleared, per §1).
- **Tests:** `server/tests/routes/items.hierarchy.test.ts` (34 cases,
  organized by wiki section) plus additions to `itemTree`,
  `positionResolver`, and a new `workflowItems` lib test. Coverage gate
  extended to `items.ts`, `itemHierarchy.ts`, `itemTree.ts`.
