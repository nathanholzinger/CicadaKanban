# TREE-2 — What the drag shows

**Next ID:** TREE-2.9

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-2.1 | The dragged project's descendants are dimmed for the whole drag | P2 | Open |
| TREE-2.2 | A collapsed project opens when a project is dropped into it as its child | P2 | Automated |
| TREE-2.3 | A collapsed project opened by a drop stays open if the move fails | P2 | Automated |
| TREE-2.4 | Legal parents are Full, the cap boundary is Mid, and deeper rows are Low | P1 | Open |
| TREE-2.5 | Top-level rows take the root's legal-parent answer | P1 | Open |
| TREE-2.6 | A response landing mid-drag does not redraw the pickup tiers | P1 | Open |
| TREE-2.7 | Tiers leave the drop line at full strength and do not remove valid gap states | P1 | Open |
| TREE-2.8 | The sidebar uses opacity values independent of the board's | P1 | Open |

---

## TREE-2.1 — The dragged project's descendants are dimmed for the whole drag

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §7

*Given* top-level projects `A` and `X`, where `X` has a child `X1`, and `X1` a child `X1a`, with enough room under the project cap for `A` to take `X`'s whole subtree, *when* `X` is dragged, *then* `X1` and `X1a` stay drawn in place at Low, using `projectNeitherOpacity`, wherever the cursor goes. Neither is a placement neighbor. `A` is Full on this shallow fixture; unrelated rows nearer the cap may instead be Mid or Low ([TREE-2.4](tree-2-what-the-drag-shows.md)). `X`'s own row is drawn separately at `projectDraggedOpacity`, without a target tier. *When* the drag ends, by a release or a cancel, *then* the tiers and dragged-row dim clear, and every row is drawn at full strength at its resulting place.

**Automation test:** —

## TREE-2.2 — A collapsed project opens when a project is dropped into it as its child

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §2

*Given* top-level projects `T` and `X`, where `T` is collapsed and its children are `T1` and `T2`, *when* `X` is released one tab right of `T`, as its first child, *then* `T` is expanded afterwards, showing `X`, `T1` and `T2` under it. *When* `X` is instead released aligned with `T`, as its sibling, *then* `T` stays collapsed.

**Automation test:** `tests/ui/project-tree-drag.spec.ts`

## TREE-2.3 — A collapsed project opened by a drop stays open if the move fails

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §2, wiki project-tree §4

*Given* top-level projects `T` and `X`, where `T` is collapsed and its children are `T1` and `T2`, *when* `X` is released one tab right of `T`, as its first child, and the server refuses the move, *then* `T` is expanded, showing `T1` and `T2` under it, and `X` is shown top-level again, after `T`, where it was ([TREE-4.8](tree-4-sibling-order.md)).

**Automation test:** `tests/ui/project-tree-drag.spec.ts`

## TREE-2.4 — Legal parents are Full, the cap boundary is Mid, and deeper rows are Low

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki project-tree §3, wiki hierarchy-placement §7

*Given* the project cap `CAP >= 4`, a chain `P1` through `P_CAP`, with `P1` top-level at absolute depth 1 and each following project the previous one's child, and unrelated top-level `X` with one child `X1`, *when* `X` is picked up, *then*:

- `P1` through `P_(CAP-2)` are Full: each can take `X` with subtree height 1 without exceeding `CAP`;
- `P_(CAP-1)` is Mid at `projectAnchorOpacity`: it cannot take `X` as a child, but its parent can, so `X` can be its sibling;
- `P_CAP` is Low at `projectNeitherOpacity`: neither it nor its parent can take `X`;
- `X1` is Low by descent from `X`, and `X`'s own row takes `projectDraggedOpacity` without a target tier.

Each tier changes only opacity, adding no relationship color and removing no row. The Mid boundary is the one depth immediately after the last legal parent depth; entries below that boundary remain Low. Top-level projects count from depth 1 in these cap assertions.

**Automation test:** —

## TREE-2.5 — Top-level rows take the root's legal-parent answer

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki project-tree §3, wiki hierarchy-placement §7

*Given* unrelated top-level leaf `A` and a top-level dragged project `X` whose subtree height is `CAP - 1`, *when* `X` is picked up, *then* the top of the tree can still take `X`: its deepest descendant is at depth `1 + (CAP - 1) = CAP`. `A` is Mid, rather than Low, since `A` cannot parent `X` but the root can. Every other unrelated top-level row is Mid too, and their nested rows are Low.

*Given* instead existing data in which `X`'s subtree height is `CAP`, already too tall even from the top level ([TREE-1.13](tree-1-gap-and-depth.md)), *when* `X` is picked up, *then* every other project row is Low, top-level rows included, because the root cannot take the subtree either. `X`'s own row remains separate at `projectDraggedOpacity`. The lack of a parent project does not itself make a top-level row Low.

**Automation test:** —

## TREE-2.6 — A response landing mid-drag does not redraw the pickup tiers

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §7

*Given* `X` has subtree height 1, unrelated leaf `P` is top-level and Full for `X`, unrelated `Q` is at depth `CAP - 2`, and an earlier move reparenting `P` under `Q` is still awaiting its response, *when* `X` is picked up and that response then lands, *then* the sidebar applies `P`'s saved parent, but `P` stays drawn at its pickup tier, Full, through the rest of this drag. Its new depth would not be a legal parent for `X`, but the response does not redraw the tiers. Existing Mid and Low rows retain their pickup tiers too.

*When* the drag is cancelled, *then* the tiers clear. *When* `X` is picked up again against the now-saved tree, *then* `P`, at depth `CAP - 1`, is Mid: its parent `Q` can take `X`. This case asserts tier lifetime, not a snapshot of which rows the placement logic may name after a response.

**Automation test:** —

## TREE-2.7 — Tiers leave the drop line at full strength and do not remove valid gap states

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §2, wiki hierarchy-placement §7

*Given* `X` of subtree height 1, and a Mid row `S` whose parent can take `X`, *when* the indicator names a valid placement beside `S` as its sibling, *then* the drop line is at full strength while `S`'s content remains at `projectAnchorOpacity`. The line does not inherit the row's dim.

*Given* the cap-depth chain in [TREE-2.4](tree-2-what-the-drag-shows.md), followed by top-level `B`, *when* the cursor names the gap after Low `P_CAP` and before `B`, and the user tabs to the top-level state, *then* the line shows a valid top-level placement. A release saves `X.parentId = null`, after the chain's top-level project `P1` and before `B`, with `X1` still beneath `X`. Low does not remove the gap or its valid shallower state. A tab state that exceeds the cap remains reachable and writes nothing as in [TREE-1.11](tree-1-gap-and-depth.md); tier opacity does not choose validity.

**Automation test:** —

## TREE-2.8 — The sidebar uses opacity values independent of the board's

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §7

*Given* a board and sidebar with different configured opacity values, *when* a project drag starts with Mid and Low rows, *then* their own content uses `projectAnchorOpacity` and `projectNeitherOpacity`, while the dragged project's own row uses `projectDraggedOpacity`. Each has its own value, even when the Low and dragged-row values differ. No board opacity value substitutes for any of them.

*When* only the board's opacity values change, *then* a new project drag retains the sidebar's configured strengths. With the sidebar's values changed instead, its next drag uses those values while board targets and the board's ghost retain their own configured strengths. The rule is independent configuration of the two surfaces; the temporary tuning panel's controls are not part of this case.

**Automation test:** —
