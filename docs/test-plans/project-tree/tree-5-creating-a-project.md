# TREE-5 — Creating a project

**Next ID:** TREE-5.2

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-5.1 | A create makes a top-level project or a child, after its siblings' true last | P1 | Open |

---

## TREE-5.1 — A create makes a top-level project or a child, after its siblings' true last

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §5, wiki positioning §3, wiki positioning §4

*Given* top-level projects `A` (`1.0`) and `P` (`2.0`), where `P` has no children, *when* a project is created naming no parent, *then* it's top-level, at `3`. *When* a project is created naming `P` as its parent, *then* it's `P`'s child, at `1`, and a second one created under `P` is at `2`. *And given* `A`'s children sit at `1.0` and `4.2`, *when* a project is created under `A`, *then* it's at `5`, whatever the top-level projects' positions. A create with no name is [TREE-8.1](tree-8-a-projects-name.md)'s, and which workflow the new project uses is [BCU-1.5](../boards-columns-unsorted/bcu-1-boards-and-what-they-show.md)'s.

**Automation test:** —
