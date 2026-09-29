# TC-X — Cross-cutting guards

**Next ID:** TC-X.7

| ID | Case | Priority | Status |
|---|---|---|---|
| TC-X.1 | A detached child is positioned in the workflow, not among its parent's children | P1 | Automated |
| TC-X.6 | A moving item is never its own neighbor | P1 | Automated |

---

## TC-X.1 — A detached child is positioned in the workflow, not among its parent's children

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* `P` with detached children `D1` (`1.0`) and `D2` (`3.0`), and top-level Free item `T` (`2.0`) in the same workflow, *when* `D2` is placed after `D1`, *then* `D2`'s position is `1.5`, between `D1` and its true workflow neighbor `T`. It isn't resolved among `P`'s children, where `D1` would have no successor.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-X.6 — A moving item is never its own neighbor

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §2

*Given* `A` (`1.0`), `X` (`1.5`) and `B` (`3.0`) in one scope, *when* `X` is placed after `A`, *then* `X`'s position is `2`, between `A` and `B`. Counting `X`'s own current row as `A`'s neighbor would give a value below `1.5`.

**Automation test:** `server/tests/routes/items.test.ts`
