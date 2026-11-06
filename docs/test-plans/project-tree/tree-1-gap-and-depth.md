# TREE-1 — Dragging a project places it by gap and depth

**Next ID:** TREE-1.20

**The tree,** for the cases that name it: top-level projects `A`, `B` and `X`, in that order, where `A` has a child `A1`, and `A1` has a child `A1a`. `X` is the project being dragged. Depths count from the top level, at 0:

```
A        (0)
  A1     (1)
    A1a  (2)
B        (0)
X        (0)
```

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-1.1 | The ghost shows the gap and depth, and a release saves exactly that placement | P1 | Open |
| TREE-1.2 | A gap offers the depths from Bottom's to Top's + 1, and each places the project differently | P0 | Open |
| TREE-1.3 | The boundaries: above the first row, below a nested last row, clamping, and the top level as the floor | P1 | Automated |
| TREE-1.4 | When the dragged project's subtree holds every project, its own place is the only one, and no line is drawn | P2 | Open |
| TREE-1.5 | A collapsed project hides its subtree from view, not from placement | P1 | Open |
| TREE-1.6 | Nearest the dragged project's own row means its own gap, with its descendants absent | P1 | Open |
| TREE-1.8 | A project set back down in its own gap, at its own depth, writes nothing | P1 | Open |
| TREE-1.9 | Coming back nearest the dragged project's own row returns the ghost to its own gap | P1 | Open |
| TREE-1.10 | Nearest the dragged project's own row, horizontal offset picks among its own gap's depths | P2 | Open |
| TREE-1.11 | A tab state that would put the dragged subtree past the project cap is offered, marked invalid, and writes nothing | P1 | Open |
| TREE-1.12 | A release saves the placement as a move naming a neighbor, never a position | P1 | Open |
| TREE-1.13 | A subtree already taller than the cap is marked invalid even at the top level | P2 | Open |
| TREE-1.14 | A project added to the dragged subtree after pickup stays a candidate, and a cyclic release is refused | P0 | Open |
| TREE-1.15 | Cap states keep the pickup subtree height when a response grows or shrinks it | P1 | Open |
| TREE-1.16 | A descendant moved out after pickup stays excluded until the next drag | P1 | Open |
| TREE-1.17 | The ghost takes the nearest row's slot, never a row's half | P1 | Open |
| TREE-1.18 | The slot list counts a collapsed project once and leaves hidden children and the branch out | P1 | Open |
| TREE-1.19 | A still carried copy keeps one gap while the rows slide | P1 | Open |

---

## TREE-1.1 — The ghost shows the gap and depth, and a release saves exactly that placement

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §2, wiki project-tree §6, wiki hierarchy-placement §1

*Given* the tree, *when* `X`'s ghost moves to the gap between `A1a` and `B`, at `A1a`'s depth, *then* `X`'s own row is that ghost, drawn there at depth 2. `B` slides down by one row to make room; `A`, `A1` and `A1a` stay where they were. No extra row is added for the ghost and no second `X` row remains at pickup. A full-strength line rides the ghost's top edge, starting where its name starts. *When* `X` is released there, *then* it is drawn and saved as `A1`'s child, directly after `A1a`, exactly where the ghost showed it.

*Given* instead three top-level leaves `A, B, C`, *when* `A` is picked up and its last movement makes `B` the nearest row, with the ghost shown after `B` at the top level, and the user releases without moving again, *then* the saved order is `B, A, C`, with `A.parentId = null`. The move names `B` as the anchor, with side `after`; it neither writes nothing as though the ghost were still at pickup nor requires another movement to catch up. The sidebar keeps `B, A, C` after the answer and a reload.

**Automation test:** —

## TREE-1.2 — A gap offers the depths from Bottom's to Top's + 1, and each places the project differently

**Priority:** P0 · **Status:** Open · **Rule:** wiki hierarchy-placement §1, wiki project-tree §1

*Given* the tree, *when* the ghost is in the gap between `A1a` (Top, depth 2) and `B` (Bottom, depth 0), *then* exactly four depths are offered, and the ghost is drawn at the chosen depth. A release at each saves a different placement:

- depth 3, one tab right of `A1a`: `X` is `A1a`'s first child;
- depth 2, aligned with `A1a`: `X` is `A1`'s child, after `A1a`;
- depth 1: `X` is `A`'s child, after `A1` and its whole subtree;
- depth 0: `X` is a top-level project after `A`, which is the same placement as before `B`.

None is shallower than `B`'s depth, since that would make `X` an ancestor of `B`. *When* the ghost is in the gap between `A1` and `A1a`, *then* exactly one depth is offered: `A1`'s first child, before `A1a`. The line follows the ghost's top edge in either gap.

**Automation test:** —

## TREE-1.3 — The boundaries: above the first row, below a nested last row, clamping, and the top level as the floor

**Priority:** P1 · **Status:** Automated · **Rule:** wiki hierarchy-placement §2, wiki hierarchy-placement §3, wiki project-tree §1

*Given* top-level projects `A` and `B`, where `A`'s only child is `X`, the project being dragged, and `B` has a child `B1`, the last row:

- **above the first row** (no Top, Bottom `A`): one depth is offered, the top level, and a release makes `X` the first top-level project, before `A`;
- **below the last row** (Top `B1`, no Bottom): depths 0 to 2 are offered, which make `X` a top-level project after `B`, `B`'s child after `B1`, and `B1`'s first child;
- **clamping:** an offset further left than the shallowest depth offered resolves as that depth, and one further right than the deepest resolves as the deepest. No offset leaves the ghost without a depth;
- **the floor:** no gap offers a depth shallower than the top level. Below `B1`, with the cursor as far left as it goes, `X` becomes a top-level project after `B`.

**Automation test:** `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/lib/hierarchyPlacement.test.ts`

## TREE-1.4 — When the dragged project's subtree holds every project, its own place is the only one, and no line is drawn

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §1, wiki hierarchy-placement §2, wiki hierarchy-placement §8

*Given* a sidebar whose only top-level project is `X`, with children `X1` and `X2`, so `X`'s subtree holds every project, *when* `X` is picked up and the cursor rests on `X`'s own row, *then* `X1` and `X2` are absent and no row is Top or Bottom. Exactly one depth is offered: the top level, where `X` already is. Moving elsewhere in the sidebar offers no other gap or depth. No line is drawn, and a release sends no request.

The ghost stays in its pickup slot and depth throughout: no move of the carried copy offers a different slot in this empty hierarchy.

**Automation test:** —

## TREE-1.5 — A collapsed project hides its subtree from view, not from placement

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1

*Given* top-level projects `T`, `U` and `X`, in that order, where `T` is collapsed and its children are `T1` and `T2`, *when* `X`'s ghost takes the gap below `T` (Top `T`, Bottom `U`), with its line on the ghost's top edge:

- tabbed once right of `T`, *then* a release makes `X` `T`'s first child, ahead of `T1`, though `T1` isn't shown;
- aligned with `T`, *then* a release makes `X` a top-level project after `T`'s whole subtree, `T2` included, and before `U`.

**Automation test:** —

## TREE-1.6 — Nearest the dragged project's own row means its own gap, with its descendants absent

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki hierarchy-placement §4, wiki hierarchy-placement §8

*Given* top-level projects `A`, `X` and `B`, in that order, where `X` has children `X1` and `X2`, and `A` has none, *when* the carried copy is nearest `X`'s own row, *then* the ghost is in `X`'s own gap, between `A` and `B`, offering that gap's two depths: the top level, `X`'s own, and `A`'s first child. The line rides its top edge at the chosen depth. `X1` and `X2` are absent, so neither has a row to be nearest. *When* `X` is released there as `A`'s first child, *then* it's saved there, with `X1` and `X2` still its children. No depth in any gap makes `X` a child of `X1` or `X2`, since they're never Top or Bottom.

**Automation test:** —

## TREE-1.8 — A project set back down in its own gap, at its own depth, writes nothing

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki hierarchy-placement §5

*Given* the tree, *when* `X` is picked up, dragged until the ghost shows another gap, and released with the ghost back in its own gap, below `B`, at the top level, *then* no request is sent, and `X`'s parent, position and `updatedAt` are unchanged. The line moves with the ghost. *When* `X` is released while its copy remains nearest its own row, at its own depth, *then* the same holds. Coming back nearest `X`'s own row is [TREE-1.9](tree-1-gap-and-depth.md)'s.

**Automation test:** —

## TREE-1.9 — Coming back nearest the dragged project's own row returns the ghost to its own gap

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki hierarchy-placement §4, wiki hierarchy-placement §5, wiki hierarchy-placement §8

*Given* the tree, *when* `X` is dragged until its ghost is in another gap, between `A1a` and `B`, and the carried copy then comes back nearest `X`'s own row, *then* the ghost returns to `X`'s own gap, below `B`, and the line returns with it on its top edge. *When* `X` is released there at the top level, its own depth, *then* no request is sent, as in [TREE-1.8](tree-1-gap-and-depth.md). `X`'s branch has no drawn rows to be nearest; its own row is the only row of that block left ([TREE-1.6](tree-1-gap-and-depth.md)).

**Automation test:** —

## TREE-1.10 — Nearest the dragged project's own row, horizontal offset picks among its own gap's depths

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §1

*Given* the tree, *when* `X` is picked up and its carried copy remains nearest its own row, tabbed one right, *then* the ghost shows `X`'s own gap, below `B`, one level in, with the line on its top edge, and a release makes `X` `B`'s first child. *When* the cursor is tabbed further right than that, *then* the depth clamps to the same one ([TREE-1.3](tree-1-gap-and-depth.md)). At its own depth, a release there writes nothing ([TREE-1.9](tree-1-gap-and-depth.md)).

**Automation test:** —

## TREE-1.11 — A tab state that would put the dragged subtree past the project cap is offered, marked invalid, and writes nothing

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki hierarchy-placement §6, wiki project-tree §3

*Given* a chain of projects, each the only child of the one before, from a top-level project down to `S`, at depth `PCAP − 2`, and `S`'s only child `T`, at depth `PCAP − 1`, where `PCAP` is the project cap and the depths count top-level projects as 1 (wiki project-tree §3); and top-level project `X`, the last row, with a child `X1`, *when* `X` is dragged into the gap below `T`:

- tabbed one right of `T`, which would make `X` `T`'s child and put `X1` at depth `PCAP + 1`, *then* the ghost is drawn at that offered depth, with its line and the carried copy visibly marked invalid. A release there sends no request, and `X` stays where it was;
- aligned with `T`, which makes `X` `S`'s child and puts `X1` at depth `PCAP`, *then* neither the line nor the carried copy is marked invalid, and a release saves `X` as `S`'s child, after `T`.

The line rides the ghost's top edge at either depth. The color, dash pattern and other styling of the invalid cues are not asserted.

**Automation test:** —

## TREE-1.12 — A release saves the placement as a move naming a neighbor, never a position

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §6, wiki positioning §5

*Given* the tree, *when* `X` is released with its ghost between `A1a` and `B`, at `A1a`'s depth, *then* the request is a move naming `A1` as `X`'s parent and `A1a` as the sibling it goes after, and it carries no position. *When* `X` is instead released above the first row, *then* the request is a move naming no parent and `A` as the sibling it goes before, again with no position. Each release saves `X` where the ghost showed it: as `A1`'s child after `A1a`, and as the first top-level project, before `A`. The line follows the ghost's top edge.

**Automation test:** —

## TREE-1.13 — A subtree already taller than the cap is marked invalid even at the top level

**Priority:** P2 · **Status:** Open · **Rule:** wiki hierarchy-placement §6, wiki project-tree §3, wiki project-tree §1

*Given* a tree already deeper than the project cap `PCAP`, made outside the API's writes, since the cap gates only writes ([TREE-3.7](tree-3-legal-parent-and-cap.md)): a chain from top-level project `R` down to `M`, at depth 3, where `M`'s subtree height `H` is `PCAP` or more, and top-level project `B` after `R`, the last row, where depths count top-level projects as 1 (wiki project-tree §3), *when* `M`'s ghost is in the gap below `B`, aligned with `B` at the top level, which would put its deepest descendant at depth `1 + H`, still past `PCAP`, *then* that state is offered, and its line and carried copy are marked invalid. A release there sends no request, and `M` stays where it was. *Given* instead `H` is `PCAP − 1`, *when* `M` is dragged to the same state, *then* its deepest descendant would land at exactly `PCAP`: neither the line nor the carried copy is marked invalid, and a release saves `M` at the top level, after `B`. The API's side of the same move is [TREE-3.8](tree-3-legal-parent-and-cap.md)'s.

**Automation test:** —

## TREE-1.14 — A project added to the dragged subtree after pickup stays a candidate, and a cyclic release is refused

**Priority:** P0 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §3, wiki project-tree §4, wiki hierarchy-placement §8

*Given* top-level projects `X`, `Y` and `B`, with enough cap room, and an earlier parent edit of `Y` to `X` saved but its answer still pending in the sidebar, *when* `X` is picked up before that answer arrives and the answer then lands, *then* the sidebar shows `Y` under `X` and the drag continues. `Y` remains outside the held branch and a placement candidate because it was outside `X`'s subtree at pickup. *When* the user chooses the gap after `Y`, tabbed one level deeper to make `X` its child, *then* the ghost offers that state. A release sends the move, which the server refuses with a 400 because `Y` is now in `X`'s subtree. After that failure `X` is top-level, `Y` remains its child, and both retain the positions saved before the refused release; the successful parent edit is not undone. *When* `X` is picked up again, *then* `Y` is in its branch, hidden and excluded from placement; nearest `X`'s own row means its own gap.

*Given* instead an earlier create of new child `Y` under `X` is answered after `X`'s pickup, *then* the same rule holds: `Y` is drawn, outside the pickup branch, and remains a candidate; a release making `X` its child is refused without undoing the create.

**Automation test:** —

## TREE-1.15 — Cap states keep the pickup subtree height when a response grows or shrinks it

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §3, wiki project-tree §4, wiki hierarchy-placement §6, wiki hierarchy-placement §8

*Given* project cap `PCAP`, unrelated `T` at absolute depth `PCAP - 1`, top-level leaf `X`, and an earlier parent edit putting leaf `Y` under `X` whose answer is still pending, *when* `X` is picked up with height 0 and that answer then lands, *then* the drag continues and the sidebar shows `Y` under `X`. The state making `X` `T`'s child is still offered as valid by the pickup height: `PCAP - 1 + 1 + 0 = PCAP`. *When* released there, *then* the move is sent and refused with a 400, since the saved subtree now has height 1 and would reach `PCAP + 1`. At the failure the sidebar returns `X` to its top-level place with `Y` still its child, and neither saved position changes. On a new pickup that state is marked invalid and sends no request on release. An earlier create of leaf `Y` under `X` answered after pickup gives the same growth and refusal.

*Given instead* top-level `X` with sole child `Y` and an earlier parent edit making `Y` top-level whose answer is pending, *when* `X` is picked up with height 1 and that answer lands, *then* `Y` belongs at the top level but stays hidden in the held branch for this drag. The state under `T` stays marked invalid by the pickup height. Releasing there sends no request; the branch suppression ends and the sidebar draws `X` and `Y` top-level at their saved places. On the next pickup `X` has height 0: the same state is valid, and a release saves `X` as `T`'s child at depth `PCAP`.

**Automation test:** —

## TREE-1.16 — A descendant moved out after pickup stays excluded until the next drag

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §4, wiki hierarchy-placement §4, wiki hierarchy-placement §8

*Given* top-level `X` with child `Y`, unrelated top-level `B`, and an earlier parent edit putting `Y` under `B` whose answer is still pending, *when* `X` is picked up and that answer then lands, *then* the drag continues, but `Y` stays hidden and excluded from placement because it belonged to `X`'s pickup branch. There is no `Y` row to be nearest or to name as Top or Bottom. A release with the ghost in `X`'s own gap at its own depth sends no request. At the drag's end `Y` is drawn under `B`. On the next pickup it is outside the excluded subtree: a gap after `Y`, aligned with it, can place `X` under `B`, after `Y`, and a release saves that placement.

*Given* instead saved `Y` is under `B`, and an earlier drag of `Y` under `X` is drawn while awaiting its answer, *when* `X` is picked up and that earlier drag is refused, *then* `Y`'s parent returns to `B`, but its row stays hidden in `X`'s pickup branch until the drag ends. The read after the refusal does not make `Y` a candidate in this drag. After the drag ends, `Y` is drawn under `B` and a new pickup reads that tree.

**Automation test:** —

## TREE-1.17 — The ghost takes the nearest row's slot, never a row's half

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki hierarchy-placement §1

*Given* top-level leaf projects `A, B, X, C, D` in that order, *when* `X` is picked up and its copy is nearest each row below, from that pickup order, *then* the ghost occupies exactly these slots:

| Nearest row | Drawn order, with `X` as the ghost | Top / Bottom |
|---|---|---|
| `A` | `X, A, B, C, D` | none / `A` |
| `B` | `A, X, B, C, D` | `A` / `B` |
| `X` | `A, B, X, C, D` | `B` / `C` |
| `C` | `A, B, C, X, D` | `C` / `D` |
| `D` | `A, B, C, D, X` | `D` / none |

Every gap, including both ends, is reached from one row. While the same row remains nearest, moving the copy from above to below that row's middle does not select a second gap. A release places `X` at the ghost's gap and chosen depth, not at another slot inferred from the row's half.

**Automation test:** —

## TREE-1.18 — The slot list counts a collapsed project once and leaves hidden children and the branch out

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §2, wiki hierarchy-placement §1, wiki hierarchy-placement §8

*Given* top-level projects `A, T, X, B`, with collapsed `T` hiding children `T1, T2`, and expanded `X` with children `X1, X2`, *when* `X` is picked up, *then* the slot list consists of `A, T, X, B`: `T` counts once, its two hidden children count zero times, and `X1` and `X2` are absent with the carried branch. Nearest `T`, the ghost takes the gap between `A` and `T`; nearest `B`, it takes the gap after `B`; nearest its own row, it takes the gap between `T` and `B`. No slot is offered for a hidden child or branch row. With the ghost in the gap between `T` and `B`, tabbing right of `T` still places `X` before real first child `T1`, as in [TREE-1.5](tree-1-gap-and-depth.md): counting drawn rows does not remove hidden children from the hierarchy used for placement.

**Automation test:** —

## TREE-1.19 — A still carried copy keeps one gap while the rows slide

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki hierarchy-placement §1

*Given* top-level leaf projects `A, B, X, C, D`, *when* `X`'s copy moves nearest `A` and is held still while the rows slide aside, *then* the ghost stays above `A`, with Top absent and Bottom `A`. The order settles as `X, A, B, C, D`, without alternating to a neighboring gap as `A` and `B` move. Held nearest `D` from the same pickup order, the ghost likewise stays below `D`, Top `D` and Bottom absent. No pointer movement means no new gap from the shuffle alone.

**Automation test:** —
