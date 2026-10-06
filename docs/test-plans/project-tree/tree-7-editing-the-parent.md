# TREE-7 — An edit can change a project's parent

**Next ID:** TREE-7.3

An edit naming a parent that isn't legal is [TREE-3.1](tree-3-legal-parent-and-cap.md)'s, [TREE-3.2](tree-3-legal-parent-and-cap.md)'s and [TREE-3.3](tree-3-legal-parent-and-cap.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-7.1 | An edit that leaves the parent as it is keeps the project's position | P1 | Open |
| TREE-7.2 | An edit that changes the parent places the project after its new siblings' true last | P1 | Planned |

---

## TREE-7.1 — An edit that leaves the parent as it is keeps the project's position

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §7, wiki positioning §4

*Given* `P`'s children `A` (`1.0`), `X` (`2.37`) and `B` (`3.0`), *when* `X` is renamed, naming no parent, *then* `X` is still `P`'s child, at exactly `2.37`. *When* an edit names `P` as `X`'s parent again, *then* the same holds.

**Automation test:** —

## TREE-7.2 — An edit that changes the parent places the project after its new siblings' true last

**Priority:** P1 · **Status:** Planned · **Rule:** wiki project-tree §7, wiki positioning §4

*Given* top-level projects `P` (`1.0`) and `X` (`2.0`), where `P`'s children sit at `1.0`, `2.0` and `3.0`, *when* `X`'s parent is edited to `P`, *then* `X` is `P`'s child at `4`, the position a move under `P` naming no neighbor gives it ([TREE-6.2](tree-6-moving-a-project.md)). It doesn't keep `2.0`, which would tie a new sibling. *When* `X`'s parent is then edited to none, *then* it's top-level at `2`, after `P`, the true last top-level project.

**Automation test:** —
