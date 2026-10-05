# Project Tree

**Test suite:** [`../../test-plans/project-tree/`](../../test-plans/project-tree/)

**Related:** [`../hierarchy-placement/`](../hierarchy-placement/) (the
gap-and-depth rule the sidebar places by)

This page answers "how does the project sidebar rearrange the project
tree." A dragged project is placed by the same rule as a Stub in a Card's
descendants section, which
[`../hierarchy-placement/`](../hierarchy-placement/) states once. This
page holds what the sidebar adds.

---

## 1. Dragging a project places it by gap and depth

**A project dragged in the sidebar is placed by
[`../hierarchy-placement/`](../hierarchy-placement/)'s gap and depth**,
against the whole project tree. What the sidebar adds:

- **An indicator line, not a ghost.** Rows don't slide aside to make
  room. The sidebar draws a line at the gap, and the line's position is
  the gap. A release saves exactly the gap and depth the line shows, so
  the line is the only cue, and it always matches the save.
- **The root is the top of the tree**, above every project
  ([`../hierarchy-placement/`](../hierarchy-placement/) §3). Its children
  are the top-level projects, those with no parent, so no project can be
  tabbed shallower than the top level.
- **The sidebar always has full context.** A collapsed project hides its
  subtree from view, not from placement: the sidebar places against the
  real tree. Tabbed right of a collapsed Top, a project goes ahead of
  Top's real first child; aligned with it, after Top's whole subtree,
  shown or not.
- **Resting on a row of the dragged project's own subtree means the gap
  that subtree collapses to**, which is the project's own gap, with its
  depth range. The subtree's rows stay drawn (§2), but they're never Top
  or Bottom ([`../hierarchy-placement/`](../hierarchy-placement/) §4), so
  the line goes where the subtree was. On the board the same space is the
  ghost's own slot, since a Stub's subtree travels with the carried copy.
- **An empty hierarchy arises when the dragged project's subtree holds
  every project**, since that subtree is never a candidate: for example, a
  sidebar with one top-level project. It offers one state, at the top
  level ([`../hierarchy-placement/`](../hierarchy-placement/) §2).
- **Every tab state in the range is valid.** Projects have no depth cap,
  unlike items ([`../item-attachment/`](../item-attachment/) §8).
- **Planned:** a project set back down in its own gap, at its own depth,
  writes nothing ([`../hierarchy-placement/`](../hierarchy-placement/)
  §5).

## 2. What the drag shows

- **The dragged project's descendants are dimmed for the whole drag**, so
  the branch reads as going with it, and none of its rows is a place to
  drop (§1).
- **A collapsed project opens when a project is dropped into it** as its
  child, so the moved project is in view.

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

None open.
