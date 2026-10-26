# TREE-6 — Moving a project

**Next ID:** TREE-6.8

What a move does to the workflow the project and its subtree use is [TREE-10.2](tree-10-which-workflow.md)'s, and what it does to their items is [BCU-1.6](../boards-columns-unsorted/bcu-1-boards-and-what-they-show.md)'s and [TC-7.20](../item-positioning/part-7-board-placement-intents.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-6.1 | A move places the project next to the sibling it names | P0 | Automated |
| TREE-6.2 | A move naming no neighbor places the project after its true last sibling, even under the same parent | P1 | Automated |
| TREE-6.3 | A neighbor the move can't use is refused, and nothing changes | P1 | Automated |
| TREE-6.4 | A moved project's subtree goes with it, keeping its parents and positions | P1 | Automated |
| TREE-6.5 | A move naming the project itself as its neighbor is refused | P2 | Automated |
| TREE-6.6 | A move can't name a position | P1 | Automated |
| TREE-6.7 | A neighbor given as an empty string names no project, and is refused | P2 | Automated |

---

## TREE-6.1 — A move places the project next to the sibling it names

**Priority:** P0 · **Status:** Automated · **Rule:** wiki project-tree §6, wiki positioning §2, wiki positioning §3

*Given* top-level projects `A` (`1.0`), `B` (`2.0`) and `C` (`3.0`), and `A`'s child `X`, each of these from that starting state:

- *when* `X` is moved to the top level, after `A`, *then* it's top-level, at `1.5`;
- *when* `X` is moved to the top level, before `C`, *then* it's top-level, at `2.5`.

*And given* top-level projects `A` (`1.0`), `X` (`1.5`) and `B` (`3.0`), *when* `X` is moved after `A`, its parent unchanged, *then* it's at `2`, between `A` and `B`: its own place isn't counted as `A`'s neighbor.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-6.2 — A move naming no neighbor places the project after its true last sibling, even under the same parent

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §6, wiki positioning §4

*Given* top-level projects `A` (`1.0`), `B` (`2.0`) and `C` (`3.0`), `A`'s child `X`, and `B`'s child `Q`, with no children, each of these from that starting state:

- *when* `X` is moved to the top level with no neighbor named, *then* it's at `4`;
- *when* `X` is moved under `Q` with no neighbor named, *then* it's `Q`'s only child, at `1`.

*And given* top-level projects `A` (`1.0`), `X` (`1.5`), `B` (`2.0`) and `C` (`3.0`), *when* `X` is moved with no neighbor named, its parent unchanged, *then* it's at `4`, after `C`: a move always places the project.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-6.3 — A neighbor the move can't use is refused, and nothing changes

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §6, wiki positioning §2

*Given* top-level projects `A`, `X` and `P`, where `P` has children `P1` and `P2`, and top-level project `N`, with no position, made by a direct database edit, *when* `X` is moved:

- under `P`, naming as its neighbor an id that's no project;
- under `P`, naming `A`, a sibling in `X`'s current group but not in the resulting one;
- to the top level, naming `P1`;
- to the top level, naming `N`;

*then* each is refused with a 400, whether the neighbor is named as the sibling `X` goes after or as the one it goes before, and `X`'s parent and position are unchanged. No fallback places `X` at the end instead.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-6.4 — A moved project's subtree goes with it, keeping its parents and positions

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §6

*Given* top-level projects `A` and `X`, where `X` has children `X1` (`1.0`) and `X2` (`2.0`), and `X1` has a child `X1a` (`1.0`), *when* `X` is moved under `A`, *then* `X1` and `X2` are still `X`'s children, at `1.0` and `2.0`, and `X1a` is still `X1`'s, at `1.0`.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-6.5 — A move naming the project itself as its neighbor is refused

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §6, wiki positioning §2

*Given* top-level projects `A` and `X`, *when* `X` is moved naming itself as the sibling it goes after, or as the one it goes before, *then* each is refused with a 400 whose message says the neighbor is the project itself, and `X`'s parent and position are unchanged.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-6.6 — A move can't name a position

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §6, wiki positioning §2

*Given* top-level projects `X` (`2.0`) and `A` (`4.0`), *when* a move names `position: 3.0` for `X`, alone or with `A` as the sibling it goes after, *then* it's refused with a 400 whose message says to name a neighbor instead, and `X.position` is still `2.0`.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-6.7 — A neighbor given as an empty string names no project, and is refused

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §6, wiki positioning §2, wiki row-references §1

*Given* top-level projects `A`, `X` and `P`, where `P` has children `P1` and `P2`, *when* `X` is moved under `P` naming `""` as its neighbor, *then* it's refused with a 400, whether the empty string is named as the sibling `X` goes after or as the one it goes before, and `X`'s parent and position are unchanged. No fallback reads it as no neighbor and places `X` after its last sibling, as a move naming none does ([TREE-6.2](tree-6-moving-a-project.md)). A neighbor that's no project is [TREE-6.3](tree-6-moving-a-project.md)'s.

**Automation test:** `server/tests/routes/projects.test.ts`
