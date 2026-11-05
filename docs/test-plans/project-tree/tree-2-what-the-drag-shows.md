# TREE-2 — What the drag shows

**Next ID:** TREE-2.14

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-2.1 | The dragged project's descendants are absent for the whole drag, and its own row is the ghost | P2 | Open |
| TREE-2.2 | A collapsed project opens when a project is dropped into it as its child | P2 | Open |
| TREE-2.3 | A collapsed project opened by a drop stays open if the move fails | P2 | Open |
| TREE-2.4 | Legal parents are Full, the cap boundary is Mid, and deeper rows are Low | P1 | Open |
| TREE-2.5 | Top-level rows take the root's legal-parent answer | P1 | Open |
| TREE-2.6 | A response landing mid-drag does not redraw the pickup tiers | P1 | Open |
| TREE-2.7 | Tiers leave the drop line at full strength and do not remove valid gap states | P1 | Open |
| TREE-2.8 | The sidebar uses opacity values independent of the board's | P1 | Open |
| TREE-2.9 | The count line includes the real subtree, including descendants hidden by collapse | P1 | Open |
| TREE-2.10 | Only the carried copy has the line, outside its one-row box and taking no pointer | P1 | Open |
| TREE-2.11 | The count line is cut short in a narrow sidebar | P2 | Open |
| TREE-2.12 | Every end of the drag draws the branch again under the project | P1 | Open |
| TREE-2.13 | The line starts at the ghost's name on its top edge in every gap after the first move | P1 | Open |

---

## TREE-2.1 — The dragged project's descendants are absent for the whole drag, and its own row is the ghost

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §7, wiki hierarchy-placement §8

*Given* top-level projects `A`, `X` and `B`, where expanded `X` has child `X1`, expanded `X1` has child `X1a`, and there is enough room under the project cap for `A` to take `X`'s whole subtree, *when* `X` is picked up, *then* `X1` and `X1a` are absent for the whole drag, not drawn at Low. At pickup `B` moves up by the height their rows occupied, including row spacing, with no empty branch-sized space left. Neither descendant is a placement neighbor. `A` and `B` are Full on this shallow fixture; unrelated rows nearer the cap may instead be Mid or Low ([TREE-2.4](tree-2-what-the-drag-shows.md)). `X`'s own row is its ghost, drawn at `projectDraggedOpacity` without a target tier; it follows the gap and chosen depth while the branch stays absent. *When* the drag ends, by a release or a cancel, *then* the tiers and ghost dim clear, and the branch is drawn again under `X` at its resulting place, with the projects' collapsed or expanded states respected.

**Automation test:** —

## TREE-2.2 — A collapsed project opens when a project is dropped into it as its child

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §2, wiki project-tree §11

*Given* top-level projects `T` and `X`, where `T` is collapsed and its children are `T1` and `T2`, *when* `X` is released one tab right of `T`, as its first child, *then* at release, before the answer, `T` is expanded, showing `X`, `T1` and `T2` under it. *When* `X` is instead released aligned with `T`, as its sibling, *then* `T` stays collapsed.

**Automation test:** —

## TREE-2.3 — A collapsed project opened by a drop stays open if the move fails

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §2, wiki project-tree §4, wiki project-tree §11

*Given* top-level projects `T` and `X`, where `T` is collapsed and its children are `T1` and `T2`, *when* `X` is released one tab right of `T`, as its first child, *then* at release `T` opens and shows `X`, `T1` and `T2` under it, before the answer. *When* the server refuses the move, *then* `X` returns top-level, after `T`, where it was, as soon as the failure arrives, while `T` stays expanded with `T1` and `T2` visible ([TREE-4.8](tree-4-sibling-order.md)).

**Automation test:** —

## TREE-2.4 — Legal parents are Full, the cap boundary is Mid, and deeper rows are Low

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki project-tree §3, wiki hierarchy-placement §7, wiki hierarchy-placement §8

*Given* the project cap `CAP >= 4`, a chain `P1` through `P_CAP`, with `P1` top-level at absolute depth 1 and each following project the previous one's child, and unrelated top-level `X` with one child `X1`, *when* `X` is picked up, *then*:

- `P1` through `P_(CAP-2)` are Full: each can take `X` with subtree height 1 without exceeding `CAP`;
- `P_(CAP-1)` is Mid at `projectAnchorOpacity`: it cannot take `X` as a child, but its parent can, so `X` can be its sibling;
- `P_CAP` is Low at `projectNeitherOpacity`: neither it nor its parent can take `X`;
- `X1` is absent as part of the carried branch, and `X`'s ghost takes `projectDraggedOpacity` without a target tier.

Each tier changes only opacity, adding no relationship color and removing no unrelated row. The carried branch's absence is separate from those tiers (wiki hierarchy-placement §8). The Mid boundary is the one depth immediately after the last legal parent depth; entries below that boundary remain Low. Top-level projects count from depth 1 in these cap assertions.

**Automation test:** —

## TREE-2.5 — Top-level rows take the root's legal-parent answer

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki project-tree §3, wiki hierarchy-placement §7

*Given* unrelated top-level leaf `A` and a top-level dragged project `X` whose subtree height is `CAP - 1`, *when* `X` is picked up, *then* the top of the tree can still take `X`: its deepest descendant is at depth `1 + (CAP - 1) = CAP`. `A` is Mid, rather than Low, since `A` cannot parent `X` but the root can. Every other unrelated top-level row is Mid too, and their nested rows are Low.

*Given* instead existing data in which `X`'s subtree height is `CAP`, already too tall even from the top level ([TREE-1.13](tree-1-gap-and-depth.md)), *when* `X` is picked up, *then* every other project row is Low, top-level rows included, because the root cannot take the subtree either. `X`'s ghost remains separate at `projectDraggedOpacity`. The lack of a parent project does not itself make a top-level row Low.

**Automation test:** —

## TREE-2.6 — A response landing mid-drag does not redraw the pickup tiers

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §7

*Given* `X` has subtree height 1, unrelated leaf `P` is top-level and Full for `X`, unrelated `Q` is at depth `CAP - 2`, and an earlier parent edit putting `P` under `Q` is still awaiting its answer, *when* `X` is picked up and that answer then lands, *then* the sidebar applies `P`'s saved parent, but `P` stays drawn at its pickup tier, Full, through the rest of this drag. Its new depth would not be a legal parent for `X`, but the answer does not redraw the tiers. Existing Mid and Low rows retain their pickup tiers too.

*When* the drag is cancelled, *then* the tiers clear. *When* `X` is picked up again against the now-saved tree, *then* `P`, at depth `CAP - 1`, is Mid: its parent `Q` can take `X`. This case asserts tier lifetime. The separate pickup subtree and height rules are [TREE-1.14](tree-1-gap-and-depth.md), [TREE-1.15](tree-1-gap-and-depth.md) and [TREE-1.16](tree-1-gap-and-depth.md).

**Automation test:** —

## TREE-2.7 — Tiers leave the drop line at full strength and do not remove valid gap states

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §2, wiki hierarchy-placement §7

*Given* `X` of subtree height 1, and a Mid row `S` whose parent can take `X`, *when* the ghost shows a valid placement beside `S` as its sibling, *then* the drop line is at full strength on the ghost's top edge, while `S`'s content remains at `projectAnchorOpacity` and the ghost at `projectDraggedOpacity`. The line inherits neither row's dim.

*Given* the cap-depth chain in [TREE-2.4](tree-2-what-the-drag-shows.md), followed by top-level `B`, *when* the ghost is in the gap after Low `P_CAP` and before `B`, and the user tabs to the top-level state, *then* the ghost and its line show a valid top-level placement. A release saves `X.parentId = null`, after the chain's top-level project `P1` and before `B`, with `X1` still beneath `X`. Low does not remove the gap or its valid shallower state. A tab state that exceeds the cap remains reachable and writes nothing as in [TREE-1.11](tree-1-gap-and-depth.md); tier opacity does not choose validity.

**Automation test:** —

## TREE-2.8 — The sidebar uses opacity values independent of the board's

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §7

*Given* a board and sidebar with different configured opacity values, *when* a project drag starts with Mid and Low rows, *then* their own content uses `projectAnchorOpacity` and `projectNeitherOpacity`, while the dragged project's ghost uses `projectDraggedOpacity`. Each has its own value, even when the Low and ghost values differ. No board opacity value substitutes for any of them.

*When* only the board's opacity values change, *then* a new project drag retains the sidebar's configured strengths. With the sidebar's values changed instead, its next drag uses those values while board targets and the board's ghost retain their own configured strengths. The rule is independent configuration of the two surfaces; the temporary tuning panel's controls are not part of this case.

**Automation test:** —

## TREE-2.9 — The count line includes the real subtree, including descendants hidden by collapse

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §8

*Given* each tree below, *when* its project `X` is picked up, *then* the carried copy has exactly the following second line:

| Tree below `X` | Line |
|---|---|
| No children | No line |
| One leaf child | `+ 1 child` |
| Three leaf children | `+ 3 children` |
| One child with one child of its own | `+ 1 child, 2 total descendants` |
| Children `A` and `B`; `A` has child `A1`, `A1` has child `A1a`, and `B` has child `B1` | `+ 2 children, 5 total descendants` |

*Given* the last tree with `A` collapsed, *when* `X` is picked up, *then* `A1` and `A1a` still count, even though their rows were hidden before pickup. The line is "+ 2 children, 5 total descendants", and all five descendants are out of the drawn list. Picking up collapsed `X` gives that same count, with no descendant rows needing to leave. The counts and branch membership are read at pickup and held for the whole drag; moving the cursor does not recalculate them from the shortened list. `X` itself is never counted.

**Automation test:** —

## TREE-2.10 — Only the carried copy has the line, outside its one-row box and taking no pointer

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §8

*Given* project `X` has children and next drawn row `B`, *when* `X` is picked up, *then* its carried copy has the count line but its ghost in the list has none. The copy's measured box remains one project-row tall, equal to the box of a carried leaf project; the second line hangs below it, one row tall. It covers what is below the copy without adding a second row of space to the sidebar or changing the box used to resolve the drag. Where that line covers `B`, the pointer still reaches the row below: the line intercepts no pointer and is not itself a placement target.

**Automation test:** —

## TREE-2.11 — The count line is cut short in a narrow sidebar

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §8

*Given* project `X` has two children and five total descendants, and the sidebar is too narrow to fit "+ 2 children, 5 total descendants" on one line, *when* `X` is picked up, *then* the second line is cut short to the sidebar row's width. It does not wrap to a third line or widen the sidebar. With enough width the whole text is shown. The underlying children and descendant counts are the same at either width.

**Automation test:** —

## TREE-2.12 — Every end of the drag draws the branch again under the project

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki project-tree §4, wiki hierarchy-placement §8, wiki hierarchy-placement §5, wiki hierarchy-placement §6

*Given* top-level project `X` with children `A` and `B`, where `A` has child `A1`, all expanded, *when* `X` is picked up, *then* those three descendant rows leave. *When* the drag ends in each way below, *then* its branch is drawn again at once under the row where the hierarchy then has `X`, with `A` before `B` and `A1` under `A`:

- a valid drop under unrelated project `Q`: at release, before the answer, `X` and its branch are drawn under `Q`, with the three descendant links unchanged; a successful answer leaves that tree in place;
- Escape: no move is sent and `X` stays top-level;
- a release in `X`'s own gap at its own depth: no move is sent and its parent and position stay unchanged;
- a release in a state that would put the carried subtree past the project cap: no move is sent and its parent and position stay unchanged.

The copy's second line ends with the drag. If `A` was collapsed at pickup, its child `A1` stays hidden after the drag; restoration does not expand it.

**Automation test:** —

## TREE-2.13 — The line starts at the ghost's name on its top edge in every gap after the first move

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki project-tree §1, wiki hierarchy-placement §1

*Given* the sidebar has other projects outside dragged `X`'s branch, *when* `X` is picked up before the pointer's first move in the drag, *then* the ghost is at its pickup depth and no drop line is drawn. *When* the pointer moves and the ghost takes any gap, above the first row, between rows or below the last row, *then* exactly one drop line rides the ghost's top edge, between the ghost and Top when Top exists. It never switches to the ghost's bottom edge at a list boundary.

*Given* the ghost is in the gap between `A1a` and `B` in [TREE-1.2](tree-1-gap-and-depth.md), *when* each of depths 0, 1, 2 and 3 is selected, *then* the ghost is drawn at that depth, and the line starts in the same column as its name. Each deeper state starts farther right. The line keeps full strength while its ghost is dimmed. When `X`'s subtree holds every project instead, no line appears even after pointer movement ([TREE-1.4](tree-1-gap-and-depth.md)).

**Automation test:** —
