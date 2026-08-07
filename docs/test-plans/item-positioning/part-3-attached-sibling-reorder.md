# Part 3 — Attached-child sibling reorder

**Wiki:** [`../../wiki/item-positioning/#3-attached-child-sibling-reordering`](../../wiki/item-positioning/README.md#3-attached-child-sibling-reordering)

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-3.1 | Reordering an attached child persists new order | P0 | ⏳ pending triage |
| TC-3.2 | Reordering scoped strictly to `(parentId, isAttached)` | P0 | ⏳ pending triage |
| TC-3.3 | Dragging a child out of its parent is still blocked | P0 | ✅ automated |
| TC-3.4 | New attached child positioned among true siblings | P0 | ✅ automated |
| TC-3.5 | Attached-sibling reorder reuses anchor+side resolution | P1 | ⏳ pending triage |

---

## TC-3.1 — Reordering an attached child persists new order

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a parent with 3+ attached children, *when* one child is dragged to
a new position among its siblings, *then* the persisted order (by
`position`) reflects the drop location on reload.

**Automation test:** — *(no test reorders 3+ attached siblings and checks
persisted order on reload)*

## TC-3.2 — Reordering scoped strictly to `(parentId, isAttached)`

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a workphase containing both top-level items and two different
parents' attached children, *when* one parent's children are reordered,
*then* the other parent's children and the top-level items retain their
original relative order and are not renumbered.

**Automation test:** — *(no test verifies that reordering one parent's
attached children leaves another parent's children and top-level items'
positions untouched)*

## TC-3.3 — Dragging a child out of its parent is still blocked

**Priority:** P0 (regression/guard) · **Automated:** ✅ automated

*Given* an attached child rendered in its parent's nested list, *when* a
drag gesture attempts to move it out of the parent (into the board-level
dnd context), *then* the drag is rejected/no-ops — this cross-boundary
gesture is explicitly deferred to Epic 3.5.

**Automation test:** `client/src/components/workflow/boardDndUtils.test.ts`
› `boardCollisionDetection` › "excludes attached-child containers from a
card drag (the collision-hijack bug this guards against)" and "scopes an
attached-child drag to siblings under the same parent only"

## TC-3.4 — New attached child positioned among true siblings

**Priority:** P0 · **Automated:** ✅ automated

*Given* a parent with existing attached children in a workphase that also
contains unrelated top-level items and another parent's attached children,
*when* a new attached child is created under that parent with no explicit
position, *then* its resolved position places it after that specific
parent's true last attached child — not after whatever item happens to be
last in the shared workphase.

**Automation test:** `server/tests/routes/items.test.ts` › "POST scopes a
new attached child to its true siblings, not the whole workphase" (exact
scenario: 2 unrelated top-level items + parent + child, child lands at 1.0)

## TC-3.5 — Attached-sibling reorder reuses anchor+side resolution

**Priority:** P1 · **Automated:** ⏳ pending triage

Attached-sibling reorder uses the same anchor+side resolution as
everything else (coarsest-fit, append fallback at scope boundaries) —
covered by re-running [TC-2.1](part-2-anchor-resolution.md)/[TC-2.4](part-2-anchor-resolution.md)/[TC-2.5](part-2-anchor-resolution.md)
with comparison scope = `(parentId, isAttached)` instead of workphase.

**Automation test:** — *(every `positionResolver.test.ts` test scopes with
`eq(items.workphaseId, phase.id)`; none use a `(parentId, isAttached)`-shaped
predicate — the resolver is scope-agnostic by design so this should hold,
but nothing in scope literally instantiates it against an attached-sibling
scope)*
