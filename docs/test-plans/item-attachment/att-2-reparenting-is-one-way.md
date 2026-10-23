# ATT-2 — Reparenting is one-way

**Next ID:** ATT-2.3

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-2.1 | A hierarchy change is a write to the moving item; the target's row is untouched | P0 | Automated |
| ATT-2.2 | Legality is evaluated from the moving item's point of view | P0 | Automated |

---

## ATT-2.1 — A hierarchy change is a write to the moving item; the target's row is untouched

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §3

*Given* Cards `A` and `B`, *when* `A` is attached to `B`, whichever write makes the change, *then* the change is "`A` acquires parent `B`", written to `A`'s row: its `parentId`, attachment flag, workphase and position scope, each as [ATT-1.7](att-1-free-attached-state.md) sets it. `B`'s own row isn't the subject of the change: every field on `B`, including its `parentId`, attachment flag, workphase, position and any modification timestamp, is exactly as it was.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-2.2 — Legality is evaluated from the moving item's point of view

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §3, wiki item-attachment §7

*Given* moving item `A`, with its subtree, depth and project, and target `B`, *when* the move's legality is decided ([ATT-4](att-4-legal-parent-depth-cap.md)), *then* every rule is evaluated against `A`'s facts: whether `B` is in `A`'s subtree, whether `A`'s subtree height plus `B`'s depth exceeds the cap, and which project will cascade (`B`'s, onto `A`'s subtree). None is evaluated as if `B` were the one moving. So `B` being a descendant of `A` makes the move illegal, while `A` being a descendant of `B` doesn't: that's an ordinary move up the tree.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`, `server/tests/routes/items.crossProject.test.ts`
