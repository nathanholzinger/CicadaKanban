# TREE-4 — A project's position compares among its siblings

**Next ID:** TREE-4.9

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-4.1 | A project write compares and renumbers positions only among the siblings the project ends with | P0 | Automated |
| TREE-4.2 | `GET /api/projects` lists projects by position, then creation time, a missing position first | P1 | Automated |
| TREE-4.3 | The sidebar shows each project's children by position, then creation time | P1 | Automated |
| TREE-4.4 | The sidebar sorts a project with no position as if its position were 0 | P2 | Automated |
| TREE-4.5 | A move that reindexes discloses every renumbered sibling, the moved project included | P1 | Automated |
| TREE-4.6 | A create, and an edit that changes the parent, disclose a reindex too | P1 | Automated |
| TREE-4.7 | The sidebar applies the renumbered pairs, so it shows the server's order without a reload | P1 | Automated |
| TREE-4.8 | After a failed write, the sidebar shows the project where it was before the attempt | P2 | Automated |

---

## TREE-4.1 — A project write compares and renumbers positions only among the siblings the project ends with

**Priority:** P0 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §1, wiki positioning §6

*Given* top-level projects `A` (`1.0`), `B` (`2.0`) and `C` (`3.0`), and `A`'s children `A1` (`1.0`) and `A2` (`3.0`), *when* `C` is moved under `A`, after `A1`, *then* its position is `2`, between `A1` and `A2`: the top-level projects at `2.0` and `3.0` aren't its neighbors there. *And given* `A`'s children sit at `1500` and `1600` instead, *when* `C` is moved under `A` with no neighbor named, *then* `A`'s children are reindexed first, to `1` and `2`, in the same order, and `C` lands at `3`. `A` and `B` keep `1.0` and `2.0` exactly, as does every project outside `A`'s children.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-4.2 — `GET /api/projects` lists projects by position, then creation time, a missing position first

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §1

*Given* only top-level projects: `A` and `B`, both at `2.0`, with `B` created first; `C`, at `1.5`; and `N`, with no position, made by a direct database edit, *when* the projects are listed with `GET /api/projects`, *then* they read `N, C, B, A`.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-4.3 — The sidebar shows each project's children by position, then creation time

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §1

*Given* parent `P`, whose children are `A` and `B`, both at `2.0`, with `B` created first, and `C`, at `1.5`, *when* the sidebar shows `P` expanded, *then* its children read `C, B, A`. *And given* top-level projects tie the same way, *then* the sidebar's top level reads in the same order.

**Automation test:** `tests/ui/project-tree-sidebar.spec.ts`

## TREE-4.4 — The sidebar sorts a project with no position as if its position were 0

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §1

*Given* parent `P`, whose children are `A` (`0.5`) and `B` (`2.0`), and `N`, with no position, made by a direct database edit, *when* the sidebar shows `P` expanded, *then* its children read `N, A, B`, the order `GET /api/projects` gives ([TREE-4.2](tree-4-sibling-order.md)).

**Automation test:** `tests/ui/project-tree-sidebar.spec.ts`

## TREE-4.5 — A move that reindexes discloses every renumbered sibling, the moved project included

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §7

*Given* parent `P`, whose children are `A` (`1500`) and `B` (`1600`), and top-level project `X`, *when* `X` is moved under `P` with no neighbor named, *then* `P`'s children are reindexed ([TREE-4.1](tree-4-sibling-order.md)), and the response carries the renumbered pairs: `A → 1`, `B → 2` and `X → 3`. Each pair is `{id, position}` and nothing more, and `X`'s pair matches the `position` in the response body. *And given* `P`'s children sit at `1.0` and `2.0` instead, *when* the same move is made, *then* the response carries no pairs, or an empty collection, and `X`'s position is `3`.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-4.6 — A create, and an edit that changes the parent, disclose a reindex too

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §7

*Given* parent `P`, whose children are `A` (`1500`) and `B` (`1600`), and top-level project `X`, each of these from that starting state:

- *when* a project is created under `P`, *then* the response carries `A → 1`, `B → 2`, and the new project's pair at `3`;
- *when* `X`'s parent is edited to `P`, *then* the response carries `A → 1`, `B → 2` and `X → 3`.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-4.7 — The sidebar applies the renumbered pairs, so it shows the server's order without a reload

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §8

*Given* the sidebar showing parent `P` expanded, with children `A` (`1500`) and `B` (`1600`), and top-level project `X`, each of these from that starting state:

- *when* `X` is dragged under `P`, after `B`, and released, *then* `P`'s children read `A, B, X`, and still do after a reload. `X` isn't shown first, as a sort of `1500`, `1600` and `3` would put it;
- *when* a project is created under `P`, *then* it's shown last among `P`'s children, after `B`;
- *when* `X`'s parent is edited to `P`, *then* `X` is shown last among `P`'s children, after `B`.

**Automation test:** `tests/ui/project-tree-sidebar.spec.ts`

## TREE-4.8 — After a failed write, the sidebar shows the project where it was before the attempt

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §4

*Given* the sidebar showing top-level projects `A`, `B` and `X`, in that order, where the server refuses the write, each of these from that starting state:

- *when* `X` is dragged under `A` and released, *then* the sidebar shows `A`, `B` and `X` as before, with `X` top-level and last;
- *when* a project is created, *then* no new project is shown;
- *when* `X`'s parent is edited to `A`, *then* `X` is still shown top-level and last.

How the user learns that the write failed isn't asserted. That a collapsed project opened by the drop stays open is [TREE-2.3](tree-2-what-the-drag-shows.md)'s.

**Automation test:** `tests/ui/project-tree-sidebar.spec.ts`
