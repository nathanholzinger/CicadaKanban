# TREE-2 — What the drag shows

**Next ID:** TREE-2.3

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-2.1 | The dragged project's descendants are dimmed for the whole drag | P2 | Automated |
| TREE-2.2 | A collapsed project opens when a project is dropped into it as its child | P2 | Automated |

---

## TREE-2.1 — The dragged project's descendants are dimmed for the whole drag

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §2

*Given* top-level projects `A` and `X`, where `X` has a child `X1`, and `X1` a child `X1a`, *when* `X` is dragged, *then* `X1` and `X1a` are dimmed from pickup to release, wherever the cursor goes, and `A` isn't. *When* the drag ends, by a release or a cancel, *then* no row is dimmed.

**Automation test:** `tests/ui/project-tree-drag.spec.ts`

## TREE-2.2 — A collapsed project opens when a project is dropped into it as its child

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §2

*Given* top-level projects `T` and `X`, where `T` is collapsed and its children are `T1` and `T2`, *when* `X` is released one tab right of `T`, as its first child, *then* `T` is expanded afterwards, showing `X`, `T1` and `T2` under it. *When* `X` is instead released aligned with `T`, as its sibling, *then* `T` stays collapsed.

**Automation test:** `tests/ui/project-tree-drag.spec.ts`
