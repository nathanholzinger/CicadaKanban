# TREE-3 — What makes a project a legal parent

**Next ID:** TREE-3.10

**Terms.** Every depth case is written against the project cap, `PCAP`, never a number, since its value is open. Top-level projects are at depth 1, and `H` is the moving project's subtree height: the levels below it, so a project with no children has height 0.

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-3.1 | A parent that names no project is refused | P0 | Automated |
| TREE-3.2 | A project can't be its own parent | P0 | Automated |
| TREE-3.3 | A project in the moving project's subtree isn't a legal parent | P0 | Automated |
| TREE-3.4 | A create naming a parent that isn't a project is refused, and nothing is stored | P1 | Automated |
| TREE-3.5 | Project cap boundary: a write that leaves the deepest descendant at `PCAP` is accepted, and one past it isn't | P1 | Automated |
| TREE-3.6 | Subtree height is the project's deepest descendant | P1 | Automated |
| TREE-3.7 | The project cap gates writes that give a parent, not existing data | P2 | Automated |
| TREE-3.8 | A subtree already taller than the cap allows can't be moved, even to a shallower place | P2 | Automated |
| TREE-3.9 | The sidebar's project cap is the one the API enforces | P1 | Automated |

---

## TREE-3.1 — A parent that names no project is refused

**Priority:** P0 · **Status:** Automated · **Rule:** wiki project-tree §3

*Given* top-level project `X`, *when* an edit names as `X`'s parent an id that's no project, *then* it's refused with a 400 whose message says the parent isn't a project, and `X` is still top-level, at the same position. *When* a move names that id as `X`'s new parent, *then* it's refused the same way, and nothing changes. A create naming such a parent is [TREE-3.4](tree-3-legal-parent-and-cap.md)'s.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-3.2 — A project can't be its own parent

**Priority:** P0 · **Status:** Automated · **Rule:** wiki project-tree §3

*Given* top-level project `X`, *when* an edit names `X` as its own parent, or a move names `X` as its new parent, *then* each is refused with a 400 whose message says a project can't be its own parent, and `X` is still top-level, at the same position.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-3.3 — A project in the moving project's subtree isn't a legal parent

**Priority:** P0 · **Status:** Automated · **Rule:** wiki project-tree §3

*Given* `A` → `B` → `C`, each the child of the one before, with `A` top-level, *when* an edit or a move names `B`, `A`'s child, or `C`, its grandchild, as `A`'s new parent, *then* each is refused with a 400 whose message says the parent is in the project's subtree, and `A` is unchanged. *When* `C` is moved under `A` instead, up the tree, *then* it's accepted: the check is whether the new parent is in the moving project's subtree.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-3.4 — A create naming a parent that isn't a project is refused, and nothing is stored

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §3

*Given* any projects, *when* a project is created naming as its parent an id that's no project, *then* it's refused with a 400 whose message says the parent isn't a project, and no project is stored: `GET /api/projects` lists the same projects as before. A create under a project that exists is [TREE-5.1](tree-5-creating-a-project.md)'s.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-3.5 — Project cap boundary: a write that leaves the deepest descendant at `PCAP` is accepted, and one past it isn't

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §3, wiki hierarchy-placement §6

*Given* a chain of projects, each the only child of the one before, from a top-level project down to `T`, at depth `PCAP − 1`, whose parent is `S`, at depth `PCAP − 2`; and top-level project `M` with one child, `M1`, so `M`'s `H` is 1, each of these from that starting state:

- *when* `M` is moved under `S`, *then* it's accepted, and `M1` sits at depth `PCAP`;
- *when* `M` is moved under `T`, *then* it's refused with a 400 whose message says the resulting depth would exceed the cap, and `M` is still top-level: `M1` would sit at depth `PCAP + 1`;
- *when* `M`'s parent is edited to `S`, or to `T`, *then* the same holds: accepted under `S`, and refused the same way under `T`;
- *when* a project `N` is created under `T`, *then* it's accepted, at depth `PCAP`, since a new project has no subtree. *When* a project is then created under `N`, at depth `PCAP + 1`, *then* it's refused the same way, and nothing is stored.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-3.6 — Subtree height is the project's deepest descendant

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §3, wiki hierarchy-placement §6

*Given* top-level project `M` with children `M1` and `M2`, where `M1` has no children and `M2` has a child `M2a`, and target `T` at depth `D`, *when* `M` is moved under `T`, *then* the check uses `H = 2`, through `M2a`: the move is accepted if and only if `D + 1 + 2` is at most `PCAP`. Checking `M` alone (`H = 0`), or counting its descendants (3), would judge the move wrongly.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-3.7 — The project cap gates writes that give a parent, not existing data

**Priority:** P2 · **Status:** Automated · **Rule:** wiki hierarchy-placement §6, wiki project-tree §3

*Given* a tree of projects already deeper than `PCAP`, such as one stored before a lower `PCAP`, *when* the projects are listed with `GET /api/projects`, *then* every one of them is returned, and the sidebar shows each of them: nothing hides them, flags them or repairs them. *And when* one of them past the cap is renamed, or moved among its own siblings, its parent unchanged, *then* each write is accepted. Only a write that gives a project a parent is checked against the cap.

**Automation test:** `server/tests/routes/projects.test.ts`, `tests/ui/project-tree-sidebar.spec.ts`

## TREE-3.8 — A subtree already taller than the cap allows can't be moved, even to a shallower place

**Priority:** P2 · **Status:** Automated · **Rule:** wiki hierarchy-placement §6, wiki project-tree §3

*Given* project `M` at depth 3 in a tree already deeper than `PCAP`, whose subtree height `H` is `PCAP` or more, *when* `M` is moved to the top level, which would bring its deepest descendant up to depth `1 + H`, still past `PCAP`, *then* it's refused with a 400, and `M` is unchanged. The cap judges only the resulting depth, not whether the move improves it, so this subtree can be moved only once it's dismantled.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-3.9 — The sidebar's project cap is the one the API enforces

**Priority:** P1 · **Status:** Automated · **Rule:** wiki hierarchy-placement §6, wiki project-tree §1, wiki project-tree §3

*Given* the project cap the API enforces, `PCAP`, where a write that puts the moving subtree's deepest project at depth `PCAP` is accepted, and one that puts it at `PCAP + 1` is refused ([TREE-3.5](tree-3-legal-parent-and-cap.md)), *when* the API is asked for the project cap, *then* it reports `PCAP`. The sidebar marks tab states against that reported value, holding none of its own ([TREE-1.11](tree-1-gap-and-depth.md)), so a state it shows as valid is never one the API refuses.

**Automation test:** `server/tests/routes/projects.test.ts`, `tests/ui/project-tree-drag.spec.ts`
