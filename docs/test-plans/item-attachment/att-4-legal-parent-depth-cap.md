# ATT-4 — What makes a target a legal parent, and the depth cap

**Next ID:** ATT-4.14

**Terms.** Every depth case is written against `CAP`, never a number, since the cap's value is open. Root items are at depth 1, and `H` is the moving item's subtree height: the levels below it, so a leaf has height 0. The board's copy of `CAP` is [DRAG-2.10](../board-drag-interaction/drag-2-target-classification.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-4.1 | A parent reference naming no item is rejected, not stored | P0 | Automated |
| ATT-4.2 | The moving item itself isn't a legal parent | P0 | Automated |
| ATT-4.3 | A descendant of the moving item isn't a legal parent | P0 | Automated |
| ATT-4.4 | Depth cap boundary: exactly `CAP` is legal, `CAP + 1` isn't | P0 | Automated |
| ATT-4.5 | Subtree height is the deepest resulting leaf, detached descendants included | P0 | Automated |
| ATT-4.6 | Root depth is 1 and a leaf's height is 0 | P1 | Automated |
| ATT-4.7 | The cap gates reparents, not existing data | P1 | Automated |
| ATT-4.9 | The UI and the API agree on every target's legality | P0 | Open |
| ATT-4.10 | Every write that can give an item a parent enforces the same rules | P0 | Automated |
| ATT-4.11 | A move that makes an over-cap tree shallower, but still over the cap, is rejected | P1 | Automated |

---

## ATT-4.1 — A parent reference naming no item is rejected, not stored

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §7

*Given* a reparent whose `parentId` names an id that doesn't exist (never existed, or was deleted), *when* it is submitted, *then* it is rejected, and the moving item's `parentId` is unchanged. The reference that names nothing is never stored.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-4.2 — The moving item itself isn't a legal parent

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §7

*Given* item `A`, *when* a write sets `A.parentId = A`, *then* it is rejected, and `A` is unchanged.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-4.3 — A descendant of the moving item isn't a legal parent

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §7

*Given* `A` → `B` → `C`, each a child of the one before, attached or not (the hierarchy decides, not the attachment flag), *when* a write sets `A.parentId = B` (a direct child) or `A.parentId = C` (a deeper descendant), *then* each is rejected as cycle-forming, and `A` is unchanged. *And when* a write sets `C.parentId = A`, moving up the tree, *then* it is accepted: the check is whether the target is in the moving item's subtree ([ATT-2.2](att-2-reparenting-is-one-way.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-4.4 — Depth cap boundary: exactly `CAP` is legal, `CAP + 1` isn't

**Priority:** P0 · **Status:** Automated · **Rule:** wiki hierarchy-placement §6, wiki item-attachment §8

*Given* target `T` at depth `D` and moving item `M` with subtree height `H`, arranged so that `D + 1 + H = CAP`, *when* `M` is reparented to `T`, *then* it is accepted, and the resulting deepest leaf sits at depth `CAP`. *And given* an arrangement where `D + 1 + H = CAP + 1`, through a deeper target or one more level under `M`, *when* the same reparent is attempted, *then* it is rejected as depth-capped, and nothing changes ([ATT-3.7](att-3-reparent-placement-atomicity.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-4.5 — Subtree height is the deepest resulting leaf, detached descendants included

**Priority:** P0 · **Status:** Automated · **Rule:** wiki hierarchy-placement §6, wiki item-attachment §8

*Given* moving item `M` with an attached child `M1` (height 1 through that branch) and a detached child `M2` that has a child `M2a` (height 2 through that branch), *when* `M` is reparented to target `T` at depth `D`, *then* the cap check uses `H = 2`, the deepest leaf that would result, through the detached branch: the move is accepted if and only if `D + 1 + 2 <= CAP`. Checking `M` alone (`H = 0`) or only its attached branch (`H = 1`) would admit a tree that ends up past the cap.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-4.6 — Root depth is 1 and a leaf's height is 0

**Priority:** P1 · **Status:** Automated · **Rule:** wiki hierarchy-placement §6, wiki item-attachment §8

*Given* root item `R` (no parent) and leaf item `L` (no children), *when* `L` is reparented to `R`, *then* the check evaluates `1 + 1 + 0 = 2 <= CAP` and accepts it, and `L` sits at depth 2. This pins the counting the formula depends on.

**Automation test:** `server/tests/lib/itemTree.test.ts`

## ATT-4.7 — The cap gates reparents, not existing data

**Priority:** P1 · **Status:** Automated · **Rule:** wiki hierarchy-placement §6, wiki item-attachment §8

*Given* a tree already deeper than `CAP`, such as one stored before a lower `CAP`, *when* its items are read or listed on a board, *then* they load like any others: nothing hides them, flags them or repairs them. *And when* one of them is changed in a way that doesn't reparent it (its workphase moves, it's reordered among its attached siblings, or its title is edited), *then* the change is accepted. Only a reparent is checked against the cap ([ATT-4.4](att-4-legal-parent-depth-cap.md), [ATT-4.11](att-4-legal-parent-depth-cap.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-4.9 — The UI and the API agree on every target's legality

**Priority:** P0 · **Status:** Open · **Rule:** wiki item-attachment §7, wiki hierarchy-placement §6

*Given* a fixed board and a moving item `M`, *when* the UI classifies every visible target for `M` ([DRAG-2](../board-drag-interaction/drag-2-target-classification.md)) and the API is asked to reparent `M` to each of those targets, *then* every target the UI classifies Valid is accepted by the API, and every target it classifies Cycle-forming or Depth-capped is rejected. The UI never offers a target the API would refuse, and never withholds one it would accept, across the whole board, not just a sample.

**Automation test:** —

## ATT-4.10 — Every write that can give an item a parent enforces the same rules

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §7, wiki hierarchy-placement §6, wiki item-attachment §8

*Given* each write that can give an item a parent (creating an item with a parent, editing an item's parent, and moving an item), *when* the write names:

- a parent that doesn't exist, *then* it is rejected;
- the item itself, or one of its descendants (editing and moving only, since a new item has no subtree), *then* it is rejected;
- a parent whose depth would put the resulting deepest leaf past `CAP`, *then* it is rejected;

and nothing is stored in any of them. *When* it names a legal parent, *then* each write accepts it: for example, creating a leaf under a parent at depth `CAP − 1` is accepted, and under a parent at depth `CAP` is rejected. No write enforces a rule another write skips.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`, `server/tests/routes/items.test.ts`, `server/tests/routes/items.attached.test.ts`

## ATT-4.11 — A move that makes an over-cap tree shallower, but still over the cap, is rejected

**Priority:** P1 · **Status:** Automated · **Rule:** wiki hierarchy-placement §6, wiki item-attachment §8

*Given* item `M` at depth 3 in a tree already deeper than `CAP`, with subtree height `H` such that `1 + 1 + H > CAP`, *when* `M` is reparented to a shallower target, one that would bring its deepest leaf up but not back within `CAP` (a root item at depth 1, for instance), *then* the reparent is rejected, and `M` is unchanged. *When* `M` is moved to the top level instead, by a move or by editing its parent, *then* its deepest leaf would land at depth `1 + H`. With `H` at `CAP` or more, that's still past `CAP`, and the write is rejected the same way. With `H` at `CAP − 1`, it's exactly `CAP`, and the write is accepted, though the tree `M` leaves was over the cap. The formula judges only the resulting depth, not whether the move improves it, so a subtree of height `CAP` or more can be moved only once it's dismantled.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`
