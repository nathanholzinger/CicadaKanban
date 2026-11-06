# Test Plan — Project Tree

**Wiki page:** project-tree

**Suite IDs:** `TREE-1` … `TREE-11`, one per section of the page. A case is written by its full ID, `<suite>.<n>` (e.g. `TREE-1.2`), in its own suite file as everywhere else.

Shared rules have no catalog of their own, so the cases here test them as projects apply them, beside the project tree's own: hierarchy-placement's gap and depth, project cap, drag tiers and carried branch; and positioning's rules among a project's siblings. A shared rule items already pin through the same resolution, such as its arithmetic, is tested once, in item-positioning's catalog.

| Suite | What it covers |
|---|---|
| [TREE-1 — Dragging a project places it by gap and depth](tree-1-gap-and-depth.md) | The ghost's slot and shuffle, nearest-row reading and stability, each gap's depths and placements, boundaries and the top level, collapsed and branch rows, pickup snapshots across edits and rollbacks, cap states, an own-gap set-down, and the move a release sends |
| [TREE-2 — What the drag shows](tree-2-what-the-drag-shows.md) | Full/Mid/Low tiers, cap and root boundaries, tier lifetime and a row first drawn after pickup, the ghost's full-strength top-edge line and its start, independent sidebar values, the carried branch and count line, and opening a collapsed project on a drop |
| [TREE-3 — What makes a project a legal parent](tree-3-legal-parent-and-cap.md) | A parent that exists, isn't the project and isn't in its subtree, a create's parent, the project cap, and a deep name in a narrow sidebar |
| [TREE-4 — A project's position compares among its siblings](tree-4-sibling-order.md) | Sibling positions and order, missing positions, reindex disclosure and application, moves drawn at release, independent answers, late answers preserving newer positions, older reads preserving applied writes, the next pickup's tree, and rollback as soon as a move fails |
| [TREE-5 — Creating a project](tree-5-creating-a-project.md) | A create's parent and sibling position, Add subproject at and below the cap, disabled controls and reasons, unread-cap behavior, and the always-offered top-level create |
| [TREE-6 — Moving a project](tree-6-moving-a-project.md) | A named neighbor, no neighbor, a neighbor the move can't use, the subtree going with it, the project as its own neighbor, and a named position |
| [TREE-7 — An edit can change a project's parent](tree-7-editing-the-parent.md) | An edit that keeps the parent, and one that changes it |
| [TREE-8 — A project always has a name](tree-8-a-projects-name.md) | A create's name, an edit that leaves the name out, and an empty, `null` or blank name |
| [TREE-9 — Deleting a project deletes its subtree](tree-9-deleting-a-project.md) | What a delete removes, an item of another project left in a deleted workphase, what a delete leaves alone, and late answers that cannot restore deleted projects |
| [TREE-10 — Which workflow a project uses](tree-10-which-workflow.md) | A workflow given to a project, a move, a deleted workflow, at most one workflow per project, where a new workflow's workphases come from, the required project a create names, and deleting owned or ownerless workflows without deleting items |
| [TREE-11 — Which projects the sidebar shows open](tree-11-sidebar-expansion.md) | Initial and new-project expansion, chevrons and reload, create and parent-change success or failure, and edits that open no parent, including a rename requested before a move's answer |
