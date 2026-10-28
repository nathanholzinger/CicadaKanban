# Test Plan — Project Tree

**Wiki page:** project-tree

**Suite IDs:** `TREE-1` … `TREE-10`, one per section of the page. A case is written by its full ID, `<suite>.<n>` (e.g. `TREE-1.2`), in its own suite file as everywhere else.

Projects apply three pages of shared rules, which have no catalog of their own, so the cases here test them as projects apply them, beside the project tree's own: hierarchy-placement's gap and depth, as the sidebar places a dragged project; hierarchy-placement's depth cap, at the project cap; and positioning's rules, among a project's siblings. A shared rule items already pin through the same resolution, such as its arithmetic, is tested once, in item-positioning's catalog.

| Suite | What it covers |
|---|---|
| [TREE-1 — Dragging a project places it by gap and depth](tree-1-gap-and-depth.md) | The indicator line, each gap's depths and their placements, the boundaries and the top level, a collapsed project, the dragged subtree, a tab state past the project cap, a set-down in its own gap, and the move a release sends |
| [TREE-2 — What the drag shows](tree-2-what-the-drag-shows.md) | The dragged project's descendants dimmed, and a collapsed project opening on a drop into it, and staying open if the move fails |
| [TREE-3 — What makes a project a legal parent](tree-3-legal-parent-and-cap.md) | A parent that exists, isn't the project and isn't in its subtree, a create's parent, the project cap, and a deep name in a narrow sidebar |
| [TREE-4 — A project's position compares among its siblings](tree-4-sibling-order.md) | Siblings as the comparison and reindex scope, their order in the list and the sidebar, a missing position, disclosing a reindex and applying it, and the sidebar after a failed write |
| [TREE-5 — Creating a project](tree-5-creating-a-project.md) | A create's parent and its place after its siblings |
| [TREE-6 — Moving a project](tree-6-moving-a-project.md) | A named neighbor, no neighbor, a neighbor the move can't use, the subtree going with it, the project as its own neighbor, and a named position |
| [TREE-7 — An edit can change a project's parent](tree-7-editing-the-parent.md) | An edit that keeps the parent, and one that changes it |
| [TREE-8 — A project always has a name](tree-8-a-projects-name.md) | A create's name, an edit that leaves the name out, and an empty, `null` or blank name |
| [TREE-9 — Deleting a project deletes its subtree](tree-9-deleting-a-project.md) | What a delete removes, an item of another project left in a deleted workphase, and what a delete leaves alone |
| [TREE-10 — Which workflow a project uses](tree-10-which-workflow.md) | A workflow given to a project, a move, a deleted workflow, and at most one workflow per project |
