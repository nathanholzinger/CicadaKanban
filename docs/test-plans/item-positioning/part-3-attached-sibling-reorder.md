# Part 3 — Attached-child sibling reorder

**Wiki:** [`../../wiki/item-positioning/#3-attached-child-sibling-reordering`](../../wiki/item-positioning/README.md#3-attached-child-sibling-reordering)

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-3.1 | Reordering an attached child persists new order | P0 | ✅ automated |
| TC-3.2 | Reordering scoped strictly to `(parentId, isAttached)` | P0 | ✅ automated |
| TC-3.3 | ~~Dragging a child out of its parent is still blocked~~ — superseded by Epic 3.5 | — | ⏸ superseded |
| TC-3.4 | New attached child positioned among true siblings | P0 | ✅ automated |
| TC-3.5 | Attached-sibling reorder reuses anchor+side resolution | P1 | ✅ automated |

---

## TC-3.1 — Reordering an attached child persists new order

**Priority:** P0 · **Automated:** ✅ automated

*Given* a parent with 3+ attached children, *when* one child is dragged to
a new position among its siblings, *then* the persisted order (by
`position`) reflects the drop location on reload.

**Automation test:** `tests/api/itemRepositioningAttachedSiblings.spec.ts`
— all three cases assert order via `siblingOrder`, which reads
`GET /api/items/:parentId`'s `children` array (a different codepath than
the move response itself) — a genuine reload/persistence check.

## TC-3.2 — Reordering scoped strictly to `(parentId, isAttached)`

**Priority:** P0 · **Automated:** ✅ automated

*Given* a workphase containing both top-level items and two different
parents' attached children, *when* one parent's children are reordered,
*then* the other parent's children and the top-level items retain their
original relative order and are not renumbered.

**Automation test:** `tests/api/itemRepositioningAttachedSiblings.spec.ts`
— every case calls `expectIsolationUnaffected`, checking an unrelated
second parent's attached child and an unrelated top-level item (sharing
the same workphase) after each reorder.

## TC-3.3 — ~~Dragging a child out of its parent is still blocked~~ (superseded by Epic 3.5)

**Priority:** — · **Automated:** ⏸ superseded

*Superseded by Epic 3.5.* This case guarded the Epic 3.2 interim state in
which the cross-boundary gesture was held closed. Epic 3.5 opens it — a
Stub can now be dragged out of its parent Card, and Stubs are classified
individually as targets during a Card drag instead of being blanket-
excluded. The replacing rules and cases:

- Stub → out (detach by drag):
  [`../board-drag-interaction/drag-5-detach-and-overflow.md`](../board-drag-interaction/drag-5-detach-and-overflow.md)
  DRAG-5.1–5.5
- Stubs classified individually during a Card drag (replaces the blanket
  exclusion):
  [`../board-drag-interaction/drag-2-target-classification.md`](../board-drag-interaction/drag-2-target-classification.md)
  DRAG-2.7

*Was:* "Given an attached child rendered in its parent's nested list, when
a drag gesture attempts to move it out of the parent (into the board-level
dnd context), then the drag is rejected/no-ops."

**Automation test:** *(previous mapping — `boardDndUtils.test.ts` ›
`boardCollisionDetection` › "excludes attached-child containers from a card
drag" and "scopes an attached-child drag to siblings under the same parent
only" — now asserts behavior the wiki no longer describes; expected to be
retired or inverted when the replacing cases are automated.)*

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

**Priority:** P1 · **Automated:** ✅ automated

Attached-sibling reorder uses the same anchor+side resolution as
everything else (coarsest-fit, append fallback at scope boundaries) —
covered by re-running [TC-2.1](part-2-anchor-resolution.md)/[TC-2.4](part-2-anchor-resolution.md)/[TC-2.5](part-2-anchor-resolution.md)
with comparison scope = `(parentId, isAttached)` instead of workflow.

**Automation test:** `tests/api/itemRepositioningAttachedSiblings.spec.ts`
— "C before A" (TC-2.5-equivalent: no true predecessor, floor-anchored
coarsest-fit), "C after A / C before B" (TC-2.1-equivalent: true-neighbor
coarsest-fit, asserted from both anchor directions), "A after C"
(TC-2.4-equivalent: no true successor, append fallback). Each asserts the
exact resolved value, not just "some plausible position" — proving these
are the specific coarsest-fit/append-fallback code paths, not just any
change in the right direction.
