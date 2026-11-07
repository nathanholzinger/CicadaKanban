# TREE-2 — What the drag shows

**Next ID:** TREE-2.15

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-2.1 | The dragged project's descendants are absent for the whole drag, and its own row is the ghost | P2 | Open |
| TREE-2.2 | A collapsed project opens when a project is dropped into it as its child | P2 | Open |
| TREE-2.3 | A collapsed project opened by a drop stays open if the move fails | P2 | Open |
| TREE-2.4 | Legal parents are Full, the cap boundary is Mid, and deeper rows are Low | P1 | Open |
| TREE-2.5 | Top-level rows take the root's legal-parent answer | P1 | Open |
| TREE-2.6 | A response landing mid-drag does not redraw the pickup tiers | P1 | Open |
| TREE-2.7 | Tiers do not remove the drop line or valid gap states | P1 | Open |
| TREE-2.8 | Sidebar tiers and the ghost use their own configured strengths | P1 | Manual |
| TREE-2.9 | The count line includes the real subtree, including descendants hidden by collapse | P1 | Automated |
| TREE-2.10 | Only the carried copy has the line, outside its one-row box and taking no pointer | P1 | Open |
| TREE-2.11 | The count line is cut short in a narrow sidebar | P2 | Open |
| TREE-2.12 | Every end of the drag draws the branch again under the project | P1 | Open |
| TREE-2.13 | The line starts at the ghost's name on its top edge in every gap after the first move | P1 | Open |
| TREE-2.14 | A project first drawn after pickup stays untiered until the next drag | P2 | Open |

---

## TREE-2.1 — The dragged project's descendants are absent for the whole drag, and its own row is the ghost

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §7, wiki hierarchy-placement §8

*Given* top-level projects `A`, `X` and `B`, where expanded `X` has child `X1`, expanded `X1` has child `X1a`, and there is enough room under the project cap for `A` to take `X`'s whole subtree, *when* `X` is picked up, *then* `X1` and `X1a` are absent for the whole drag. At pickup `B` moves up by the height their rows occupied, including row spacing, with no empty branch-sized space left. Neither descendant is a placement neighbor. `A` and `B` are assigned Full on this shallow fixture; unrelated rows nearer the cap may instead be Mid or Low ([TREE-2.4](tree-2-what-the-drag-shows.md)). `X`'s own row has ghost state and no target tier; it follows the gap and chosen depth while the branch stays absent. *When* the drag ends, by a release or a cancel, *then* the target tiers and ghost state clear, and the branch is drawn again under `X` at its resulting place, with collapsed or expanded states respected.

Painted tier and ghost strengths are [TREE-2.8](tree-2-what-the-drag-shows.md)'s.

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

*Given* project cap `CAP >= 4`, a chain `P1` through `P_CAP`, with `P1` top-level at absolute depth 1 and each following project the previous one's child, and unrelated top-level `X` with one child `X1`, *when* `X` is picked up, *then*:

- `P1` through `P_(CAP-2)` are assigned Full: each can take `X` with subtree height 1 without exceeding `CAP`;
- `P_(CAP-1)` is assigned Mid: it cannot take `X` as a child, but its parent can, so `X` can be its sibling;
- `P_CAP` is assigned Low: neither it nor its parent can take `X`;
- `X1` is absent as part of the carried branch, and `X`'s own row has ghost state without a target tier.

Assigning a tier removes no unrelated row. The carried branch's absence is separate from tier assignment (wiki hierarchy-placement §8). Mid is the one depth immediately after the last legal-parent depth; entries below that boundary remain Low. Top-level projects count from depth 1 in these cap assertions. Painted strengths and colours are [TREE-2.8](tree-2-what-the-drag-shows.md)'s.

**Automation test:** —

## TREE-2.5 — Top-level rows take the root's legal-parent answer

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki project-tree §3, wiki hierarchy-placement §7

*Given* unrelated top-level leaf `A` and top-level dragged project `X` whose subtree height is `CAP - 1`, *when* `X` is picked up, *then* the top of the tree can take `X`: its deepest descendant is at depth `1 + (CAP - 1) = CAP`. `A` is assigned Mid, rather than Low, since `A` cannot parent `X` but the root can. Every other unrelated top-level row is Mid too, and their nested rows are Low.

*Given* instead existing data in which `X`'s subtree height is `CAP`, already too tall even from the top level ([TREE-1.13](tree-1-gap-and-depth.md)), *when* `X` is picked up, *then* every other project row is assigned Low, top-level rows included, because the root cannot take the subtree either. `X`'s own row retains ghost state and no target tier. The lack of a parent project does not itself make a top-level row Low.

Painted strengths are [TREE-2.8](tree-2-what-the-drag-shows.md)'s.

**Automation test:** —

## TREE-2.6 — A response landing mid-drag does not redraw the pickup tiers

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §2, wiki hierarchy-placement §7

*Given* `X` has subtree height 1, unrelated leaf `P` is top-level and assigned Full for `X`, unrelated `Q` is at depth `CAP - 2`, and an earlier parent edit putting `P` under `Q` is still awaiting its answer, *when* `X` is picked up and that answer then lands, *then* the sidebar applies `P`'s saved parent, but `P` keeps its pickup tier, Full, through the rest of this drag. Its new depth would not be a legal parent for `X`, but the answer does not reassign its tier. Existing Mid and Low rows retain their pickup tiers too.

*When* the drag is cancelled, *then* the tiers clear. *When* `X` is picked up again against the now-saved tree, *then* `P`, at depth `CAP - 1`, is assigned Mid: its parent `Q` can take `X`. The separate pickup subtree and height rules are [TREE-1.14](tree-1-gap-and-depth.md), [TREE-1.15](tree-1-gap-and-depth.md) and [TREE-1.16](tree-1-gap-and-depth.md). Painted strengths are [TREE-2.8](tree-2-what-the-drag-shows.md)'s.

**Automation test:** —

## TREE-2.7 — Tiers do not remove the drop line or valid gap states

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §2, wiki hierarchy-placement §7

*Given* `X` of subtree height 1, and a Mid row `S` whose parent can take `X`, *when* the ghost shows a valid placement beside `S` as its sibling, *then* the drop line remains present on the ghost's top edge. `S` retains Mid and the ghost retains its own ghost state without a target tier; neither assignment removes the line or gives it a target tier.

*Given* the cap-depth chain in [TREE-2.4](tree-2-what-the-drag-shows.md), followed by top-level `B`, *when* the ghost is in the gap after Low `P_CAP` and before `B`, and the user tabs to the top-level state, *then* the ghost and its line indicate a valid top-level placement. A release saves `X.parentId = null`, after the chain's top-level project `P1` and before `B`, with `X1` still beneath `X`. Low does not remove the gap or its valid shallower state. A tab state that exceeds the cap remains reachable and writes nothing as in [TREE-1.11](tree-1-gap-and-depth.md).

The line's full painted strength beside tiered rows and the ghost is [TREE-2.8](tree-2-what-the-drag-shows.md)'s.

**Automation test:** —

## TREE-2.8 — Sidebar tiers and the ghost use their own configured strengths

**Priority:** P1 · **Status:** Manual · **Rule:** wiki project-tree §2, wiki hierarchy-placement §7

*Given* the current configured sidebar strengths, chosen independently of the board's, and a drag with rows assigned Full, Mid and Low and a ghost, *when* a person inspects the sidebar through the drag, *then* Full rows have full strength, Mid content uses `projectAnchorOpacity`, Low content uses `projectNeitherOpacity`, and the ghost uses `projectDraggedOpacity`, independently of Low. Tier differences use opacity alone and add no relationship colour. The drop line keeps full strength beside a Mid row and on the dimmed ghost.

*When* an earlier answer adds an untiered row during the drag ([TREE-2.14](tree-2-what-the-drag-shows.md)), *then* that row has full strength for the rest of the drag; on a later pickup its appearance follows the tier then assigned. Existing rows keep their pickup strengths.

*When* only the board's configured opacity values change, *then* a new project drag retains the sidebar's strengths. Changing the sidebar's values instead changes those sidebar strengths while board targets and the board's ghost keep their own configured strengths. The temporary tuning panel's controls and the final look are not assertions of this case. Tier, ghost and line states, presence, placement and geometry remain the other cases' assertions.

**Automation test:** none — manual: a person checks the painted sidebar and ghost strengths, colour independence and full-strength line at the current configured values; tier assignments and geometry are separate assertions.

## TREE-2.9 — The count line includes the real subtree, including descendants hidden by collapse

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §2, wiki hierarchy-placement §8

*Given* each tree below, *when* its project `X` is picked up, *then* the carried copy has exactly the following second line:

| Tree below `X` | Line |
|---|---|
| No children | No line |
| One leaf child | `+ 1 child` |
| Three leaf children | `+ 3 children` |
| One child with one child of its own | `+ 1 child, 2 total descendants` |
| Children `A` and `B`; `A` has child `A1`, `A1` has child `A1a`, and `B` has child `B1` | `+ 2 children, 5 total descendants` |

*Given* the last tree with `A` collapsed, *when* `X` is picked up, *then* `A1` and `A1a` still count, even though their rows were hidden before pickup. The line is "+ 2 children, 5 total descendants", and all five descendants are out of the drawn list. Picking up collapsed `X` gives that same count, with no descendant rows needing to leave. The counts and branch membership are read at pickup and held for the whole drag; moving the cursor does not recalculate them from the shortened list. `X` itself is never counted.

**Automation test:** `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/components/sidebar/SortableProjectRow.test.tsx`

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

*Given* the ghost is in the gap between `A1a` and `B` in [TREE-1.2](tree-1-gap-and-depth.md), *when* each of depths 0, 1, 2 and 3 is selected, *then* the ghost is drawn at that depth, and the line starts in the same column as its name. Each deeper state starts farther right. When `X`'s subtree holds every project instead, no line appears even after pointer movement ([TREE-1.4](tree-1-gap-and-depth.md)). The line's painted strength beside the ghost is [TREE-2.8](tree-2-what-the-drag-shows.md)'s.

**Automation test:** —

## TREE-2.14 — A project first drawn after pickup stays untiered until the next drag

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §1, wiki hierarchy-placement §7

*Given* project cap `PCAP >= 3`, top-level project `X` with one leaf child, and unrelated project `T` at absolute depth `PCAP - 2`, with child `M` at `PCAP - 1` and grandchild `L` at `PCAP`, all expanded, and an earlier create of child `Y` under `T` whose answer has not yet added `Y` to the sidebar, *when* `X` is picked up and the create's answer then adds `Y` at depth `PCAP - 1`, *then* the drag continues and `Y` is present under `T` with no target tier for the rest of this drag. It is not assigned Mid during this drag, even though it cannot parent `X` and `T` can. Existing pickup tiers stay fixed: `T` is Full, `M` is Mid and `L` is Low. `Y` is outside the held branch and remains a placement candidate; its lack of tier does not change the placement or legal-parent rules.

*When* the drag is cancelled and `X` is picked up again against the saved tree, *then* `Y` is now assigned Mid, as `M` is. `T` is Full and `L` is Low. The new pickup includes `Y` in its tier snapshot. The cancelled drag sends no move, and `Y.parentId` remains `T` throughout.

The new row's full painted strength and its later tiered strength are [TREE-2.8](tree-2-what-the-drag-shows.md)'s.

**Automation test:** —
