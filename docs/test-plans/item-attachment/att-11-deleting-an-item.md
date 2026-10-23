# ATT-11 — Deleting an item deletes its subtree

**Next ID:** ATT-11.3

Deleting a project, which deletes its items, each with its subtree, is [TREE-9](../project-tree/tree-9-deleting-a-project.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-11.1 | Deleting an item deletes every descendant, attached and detached, and nothing else | P0 | Automated |
| ATT-11.2 | On the board, deleting a Card removes its detached descendants' Cards, wherever they sit | P1 | Automated |

---

## ATT-11.1 — Deleting an item deletes every descendant, attached and detached, and nothing else

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §13

*Given* project `P1` holding:
- Free item `P` in workphase `w1`, with attached child `A`, and `A`'s detached child `A1`, Free in `w3`;
- `P`'s detached child `D`, Free in `w2`, and `D`'s attached child `D1`;
- top-level item `Q`, unrelated to `P`;

*when* `P` is deleted, *then* it's accepted, and `P`, `A`, `A1`, `D` and `D1` no longer exist: a read of any of them finds no item, and none is among `P1`'s items. None is left top-level or under another parent. `Q` is unchanged. *When* instead `A` is deleted, *then* `A` and `A1` go, and `P`, `D`, `D1` and `Q` are unchanged.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-11.2 — On the board, deleting a Card removes its detached descendants' Cards, wherever they sit

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §13

*Given* a board whose column `C1` shows Card `P`, with its attached child `A` as a Stub in `P`'s Card, and whose column `C2` shows the Card of `P`'s detached child `D`, beside another Card `E`, *when* `P` is deleted from the board, *then*, with no reload of the page, the board shows none of `P`'s Card, `A`'s Stub and `D`'s Card. `E`, and the other Cards in `C1`, are unchanged.

**Automation test:** `tests/ui/attached-children.spec.ts`
