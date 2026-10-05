# TREE-1 — Dragging a project places it by gap and depth

**Next ID:** TREE-1.11

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
| TREE-1.1 | An indicator line shows the gap, and a release saves exactly what the line shows | P1 | Automated |
| TREE-1.2 | A gap offers the depths from Bottom's to Top's + 1, and each places the project differently | P0 | Automated |
| TREE-1.3 | The boundaries: above the first row, below a nested last row, clamping, and the top level as the floor | P1 | Automated |
| TREE-1.4 | When the dragged project's subtree holds every project, its own place is the only one, and no line is drawn | P2 | Automated |
| TREE-1.5 | A collapsed project hides its subtree from view, not from placement | P1 | Automated |
| TREE-1.6 | Resting on a row of the dragged project's own subtree means its own gap | P1 | Automated |
| TREE-1.7 | Every depth offered is valid: projects have no depth cap | P2 | Automated |
| TREE-1.8 | A project set back down in its own gap, at its own depth, writes nothing | P1 | Automated |
| TREE-1.9 | Coming back to the dragged project's own row means its own gap | P1 | Automated |
| TREE-1.10 | On the dragged project's own row, the cursor picks among its own gap's depths | P2 | Automated |

---

## TREE-1.1 — An indicator line shows the gap, and a release saves exactly what the line shows

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §1

*Given* the tree, *when* `X` is dragged over the sidebar, *then* no row slides aside to make room, and no ghost is shown. A line is drawn at the gap the cursor picks, showing the depth its horizontal offset picks. *When* `X` is released with the line between `A1a` and `B`, at `A1a`'s depth, *then* `X` is saved as `A1`'s child, directly after `A1a`, where the line showed it.

**Automation test:** `tests/ui/project-tree-drag.spec.ts`

## TREE-1.2 — A gap offers the depths from Bottom's to Top's + 1, and each places the project differently

**Priority:** P0 · **Status:** Automated · **Rule:** wiki hierarchy-placement §1, wiki project-tree §1

*Given* the tree, *when* the line is in the gap between `A1a` (Top, depth 2) and `B` (Bottom, depth 0), *then* exactly four depths are offered, and a release at each saves a different placement:

- depth 3, one tab right of `A1a`: `X` is `A1a`'s first child;
- depth 2, aligned with `A1a`: `X` is `A1`'s child, after `A1a`;
- depth 1: `X` is `A`'s child, after `A1` and its whole subtree;
- depth 0: `X` is a top-level project after `A`, which is the same placement as before `B`.

None is shallower than `B`'s depth, since that would make `X` an ancestor of `B`. *When* the line is in the gap between `A1` and `A1a`, *then* exactly one depth is offered: `A1`'s first child, before `A1a`.

**Automation test:** `client/src/components/sidebar/useProjectDragReorder.test.ts`

## TREE-1.3 — The boundaries: above the first row, below a nested last row, clamping, and the top level as the floor

**Priority:** P1 · **Status:** Automated · **Rule:** wiki hierarchy-placement §2, wiki hierarchy-placement §3, wiki project-tree §1

*Given* top-level projects `A` and `B`, where `A`'s only child is `X`, the project being dragged, and `B` has a child `B1`, the last row:

- **above the first row** (no Top, Bottom `A`): one depth is offered, the top level, and a release makes `X` the first top-level project, before `A`;
- **below the last row** (Top `B1`, no Bottom): depths 0 to 2 are offered, which make `X` a top-level project after `B`, `B`'s child after `B1`, and `B1`'s first child;
- **clamping:** an offset further left than the shallowest depth offered resolves as that depth, and one further right than the deepest resolves as the deepest. No offset leaves the line without a depth;
- **the floor:** no gap offers a depth shallower than the top level. Below `B1`, with the cursor as far left as it goes, `X` becomes a top-level project after `B`.

**Automation test:** `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/lib/hierarchyPlacement.test.ts`

## TREE-1.4 — When the dragged project's subtree holds every project, its own place is the only one, and no line is drawn

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §1, wiki hierarchy-placement §2

*Given* a sidebar whose only top-level project is `X`, with children `X1` and `X2`, so `X`'s subtree holds every project, *when* `X` is dragged, *then* no row is ever Top or Bottom, and wherever the cursor goes, exactly one depth is offered: the top level, where `X` already is. No line is drawn, and a release sends no request.

**Automation test:** `tests/ui/project-tree-drag.spec.ts`

## TREE-1.5 — A collapsed project hides its subtree from view, not from placement

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §1

*Given* top-level projects `T`, `U` and `X`, in that order, where `T` is collapsed and its children are `T1` and `T2`, *when* `X` is dragged into the gap below `T` (Top `T`, Bottom `U`):

- tabbed once right of `T`, *then* a release makes `X` `T`'s first child, ahead of `T1`, though `T1` isn't shown;
- aligned with `T`, *then* a release makes `X` a top-level project after `T`'s whole subtree, `T2` included, and before `U`.

**Automation test:** `client/src/components/sidebar/useProjectDragReorder.test.ts`, `client/src/lib/hierarchyPlacement.test.ts`, `client/src/components/sidebar/projectTreeUtils.test.ts`

## TREE-1.6 — Resting on a row of the dragged project's own subtree means its own gap

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §1, wiki hierarchy-placement §4

*Given* top-level projects `A`, `X` and `B`, in that order, where `X` has children `X1` and `X2`, and `A` has none, *when* `X` is dragged and the cursor rests on `X1`'s or `X2`'s row, *then* the line is in `X`'s own gap, between `A` and `B`, offering that gap's two depths: the top level, `X`'s own, and `A`'s first child. *When* `X` is released there as `A`'s first child, *then* it's saved there, with `X1` and `X2` still its children. No depth in any gap makes `X` a child of `X1` or `X2`, since they're never Top or Bottom.

**Automation test:** `client/src/components/sidebar/useProjectDragReorder.test.ts`

## TREE-1.7 — Every depth offered is valid: projects have no depth cap

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §1

*Given* a chain of projects, each the only child of the one before, deeper than the item depth cap `CAP` (wiki item-attachment §8), with `D` its deepest, and top-level project `X` with a child `X1`, *when* `X` is tabbed one right of `D`, *then* that depth is offered and isn't marked invalid, and a release saves `X` as `D`'s first child, with `X1` a level deeper still. No depth in any gap is marked invalid.

**Automation test:** `tests/ui/project-tree-drag.spec.ts`

## TREE-1.8 — A project set back down in its own gap, at its own depth, writes nothing

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §1, wiki hierarchy-placement §5

*Given* the tree, *when* `X` is picked up, dragged until the line shows another gap, and released with the line back in its own gap, below `B`, at the top level, *then* no request is sent, and `X`'s parent, position and `updatedAt` are unchanged. *When* `X` is released before the cursor has left its row, at its own depth, *then* the same holds. Coming back to `X`'s own row is [TREE-1.9](tree-1-gap-and-depth.md)'s.

**Automation test:** `tests/ui/project-tree-drag.spec.ts`

## TREE-1.9 — Coming back to the dragged project's own row means its own gap

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §1, wiki hierarchy-placement §4, wiki hierarchy-placement §5

*Given* the tree, *when* `X` is dragged until the line shows another gap, between `A1a` and `B`, and the cursor then comes back to `X`'s own row, *then* the line moves to `X`'s own gap, below `B`. *When* `X` is released there at the top level, its own depth, *then* no request is sent, as in [TREE-1.8](tree-1-gap-and-depth.md). A row of `X`'s subtree means the same gap ([TREE-1.6](tree-1-gap-and-depth.md)).

**Automation test:** `tests/ui/project-tree-drag.spec.ts`

## TREE-1.10 — On the dragged project's own row, the cursor picks among its own gap's depths

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §1

*Given* the tree, *when* `X` is picked up and the cursor rests on `X`'s own row, tabbed one right, *then* the line shows `X`'s own gap, below `B`, one level in, and a release makes `X` `B`'s first child. *When* the cursor is tabbed further right than that, *then* the depth clamps to the same one ([TREE-1.3](tree-1-gap-and-depth.md)). At its own depth, a release there writes nothing ([TREE-1.9](tree-1-gap-and-depth.md)).

**Automation test:** `client/src/components/sidebar/useProjectDragReorder.test.ts`
