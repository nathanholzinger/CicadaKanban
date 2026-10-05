# Test Plan — Project Tree

**Wiki page:** project-tree

**Suite IDs:** `TREE-1` and `TREE-2`. A case is written by its full ID, `<suite>.<n>` (e.g. `TREE-1.2`), in its own suite file as everywhere else.

The sidebar places a dragged project by hierarchy-placement's shared rules, which have no catalog of their own, so the cases here test them as the sidebar applies them, beside the sidebar's own.

| Suite | What it covers |
|---|---|
| [TREE-1 — Dragging a project places it by gap and depth](tree-1-gap-and-depth.md) | The indicator line, each gap's depths and their placements, the boundaries and the top level, a collapsed project, the dragged subtree, no depth cap, and a set-down in its own gap |
| [TREE-2 — What the drag shows](tree-2-what-the-drag-shows.md) | The dragged project's descendants dimmed, and a collapsed project opening on a drop into it |
