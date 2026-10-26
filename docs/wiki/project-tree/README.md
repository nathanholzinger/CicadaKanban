# Project Tree

**Test suite:** [`../../test-plans/project-tree/`](../../test-plans/project-tree/)

**Related:** [`../hierarchy-placement/`](../hierarchy-placement/) (the
gap-and-depth rule the sidebar places by, and the depth cap) ·
[`../positioning/`](../positioning/) (how a project's position
resolves) · [`../boards-columns-unsorted/`](../boards-columns-unsorted/)
(which projects' items a board shows) ·
[`../item-attachment/`](../item-attachment/) (an item's own tree) ·
[`../row-references/`](../row-references/) (a reference that names no
row)

This page answers "what is the project tree, how does a write change it,
and which workflow does each project use." Its numbered sections state
what the API does, and what the sidebar's drag adds to it. The project
page, and the sidebar's controls other than the drag, are a working
placeholder: they're under Open questions, and no test case is derived
from them. A dragged project is placed by
[`../hierarchy-placement/`](../hierarchy-placement/)'s gap and depth,
and a project's position resolves by
[`../positioning/`](../positioning/)'s rules, which items share. Which
items a board shows is
[`../boards-columns-unsorted/`](../boards-columns-unsorted/)'s.

---

## 1. Dragging a project places it by gap and depth

**A project dragged in the sidebar is placed by
[`../hierarchy-placement/`](../hierarchy-placement/)'s gap and depth**,
against the whole project tree, and a release saves the placement as a
move (§6). What the sidebar adds:

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
- **Resting on the dragged project's own row, or a row of its subtree,
  means the gap the subtree collapses to**, which is the project's own
  gap, with its depth range. Those rows stay in place, the subtree's
  dimmed (§2), but none of them is ever Top or Bottom
  ([`../hierarchy-placement/`](../hierarchy-placement/) §4), so the line
  goes where the subtree was. On the board the same space is the ghost's
  own slot, since a Stub's subtree travels with the carried copy.
- **An empty hierarchy arises when the dragged project's subtree holds
  every project**, since that subtree is never a candidate: for example, a
  sidebar with one top-level project. It offers one state, at the top
  level ([`../hierarchy-placement/`](../hierarchy-placement/) §2). No line
  is drawn, since the one state is where the project already is, and a
  release writes nothing.
- **A tab state that would put the dragged project's subtree past the
  project cap (§3) is still offered, its line is marked invalid, and a
  release in it writes nothing**
  ([`../hierarchy-placement/`](../hierarchy-placement/) §6). Every other
  tab state in the range is valid. How the invalid line looks isn't a
  rule yet (Open questions).
- **A project set back down in its own gap, at its own depth, writes
  nothing** ([`../hierarchy-placement/`](../hierarchy-placement/) §5).

## 2. What the drag shows

- **The dragged project's descendants are dimmed for the whole drag**, so
  the branch reads as going with it, and none of its rows is a place to
  drop (§1).
- **A collapsed project opens when a project is dropped into it** as its
  child, so the moved project is in view. It opens on the drop, so it
  stays open if the move fails and the project goes back (§4).

## 3. What makes a project a legal parent

**A project with no parent is top-level. A write that gives a project a
parent, a create, an edit or a move, names a legal one, or none, for the
top level.** A candidate parent is legal if:
1. **It exists** ([`../row-references/`](../row-references/) §1).
2. **It isn't the project itself.**
3. **It isn't in the project's subtree,** which would form a cycle.
4. **It leaves the project's subtree within the project cap** (below).

A write naming a parent that isn't legal is refused with a 400 whose
message says which of these it breaks, and nothing changes.

**The project cap.** A parent at depth `D` is legal only if `D + 1 + H`
is at most the cap, with top-level projects at depth 1, and `H` the
height of the project's subtree, every descendant project counting
([`../hierarchy-placement/`](../hierarchy-placement/) §6). A create has
no subtree, so its `H` is 0. The project cap is set apart from the item
cap, and is provisionally 6, the depth the sidebar can indent legibly,
as for items ([`../item-attachment/`](../item-attachment/) §8). Its real
value is open (Open questions).

Example, with the cap at 6: a chain of projects runs from `P1`, at the
top level, down to `P5`, at depth 5. A project with one child can be
moved under `P4` (4 + 1 + 1 = 6), but not under `P5` (5 + 1 + 1 = 7).

## 4. A project's position compares among its siblings

**A project's comparison scope is its siblings**
([`../positioning/`](../positioning/) §1): the projects with the same
parent, or, for a top-level project, the other top-level projects. A
project write places the project among the siblings it ends with, and
renumbers nothing outside them ([`../positioning/`](../positioning/)
§6).

**Siblings are ordered by position, then creation time,** by
[`../positioning/`](../positioning/) §1's tie-break. `GET /api/projects`
lists projects in that order, and the sidebar shows each project's
children so. Only a direct database edit leaves a project with no
position. The list and the sidebar both sort it first, as if its
position were 0, since no write gives a position at or below 0
([`../positioning/`](../positioning/) §3).

**A project write that reindexes discloses the renumbered pairs**
([`../positioning/`](../positioning/) §7): a create (§5), a move (§6),
and an edit that changes the parent (§7). The sidebar applies the
pairs, then the written project's position, before it orders anything
([`../positioning/`](../positioning/) §8), so it shows the order the
server saved without a reload.

**After a failed write, the sidebar shows the project where it was
before the attempt.** A failed create shows no new project, and a failed
move or edit leaves the project where it was. How the user learns that
a write failed isn't a rule yet (Open questions).

## 5. Creating a project

**A create makes a top-level project, or a child of the parent it names
(§3), and places it after its siblings' true last**
([`../positioning/`](../positioning/) §3, §4). Example: with siblings at
`1.0` and `2.0`, a create lands at `3`. A parent's first child lands at
`1`.

A create needs a name (§8). The new project uses the workflow its parent
uses, until it's given one of its own (§10).

## 6. Moving a project

**`PATCH /api/projects/:id/move` places a project under a new parent, or
its current one, next to a named sibling or at the end:**
- **It names the sibling the project goes directly after, or directly
  before, never a number** ([`../positioning/`](../positioning/) §2). A
  move that names a position is refused with a 400 whose message says to
  name a neighbor instead, and nothing changes.
- **A neighbor the move can't use is refused with a 400, and nothing
  changes:** one that doesn't exist, one with no position, the project
  itself, or one that isn't a sibling in the resulting group, the new
  parent's children ([`../positioning/`](../positioning/) §2;
  [`../row-references/`](../row-references/) §1).
- **With no neighbor named, the project goes after its true last sibling
  in the resulting group,** even when its parent doesn't change, so a
  move always places the project ([`../positioning/`](../positioning/)
  §4).
- **The new parent must be legal** (§3).
- **The project's subtree goes with it.** Its descendants keep their
  parents, so their sibling groups don't change, and they keep their
  positions.
- **A move may change which workflow the project and its subtree use**
  (§10). It isn't refused for that, unlike an item's cross-workflow
  reparent ([`../item-attachment/`](../item-attachment/) §9): their items
  come along, and show in Unsorted
  ([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §3).

Example: siblings `A` at `1.0`, `B` at `2.0` and `C` at `3.0`. A project
moved after `A` lands at `1.5`, and one moved with no neighbor named
lands at `4`.

## 7. An edit can change a project's parent

**`PUT /api/projects/:id` can change a project's parent,** as the
project page's parent dropdown does (Open questions). The new parent
must be legal (§3).

**An edit that changes the parent places the project after its new
siblings' true last,** the position a move naming no neighbor gives it
(§6; [`../positioning/`](../positioning/) §4). An edit that leaves the
parent as it is keeps the project's position. Example: a project at
`2.0`, edited to a parent whose children sit at `1.0`, `2.0` and `3.0`,
lands at `4`.

## 8. A project always has a name

**A create with no name is refused with a 400, and nothing is
stored.** No name is one left out, `null`, an empty one, or one of only
spaces.

**An edit allows exactly the names a create does.** An edit naming
`null`, an empty name, or a name of only spaces is refused with a 400,
and nothing changes. An edit that leaves the name out keeps the
project's name.

## 9. Deleting a project deletes its subtree

**`DELETE /api/projects/:id` deletes the project and its whole subtree,
and is never refused.** Nothing in the subtree is kept:
- its descendant projects;
- the workflows the subtree's projects own, with their boards, columns
  and workphases;
- the items the subtree's projects own, each with its own subtree, since
  a hierarchy never straddles two projects
  ([`../item-attachment/`](../item-attachment/) §9, §13).

**An item of another project in one of the deleted workphases survives,
with no workphase,** and shows in Unsorted
([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §8, §10).
One way it gets there: its project moved out of the subtree, and its
items still hold the old workflow's workphases
([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §3).
Labels are global, and stay.

**A delete never changes which workflow a project outside the subtree
uses,** since a project inherits only from its ancestors (§10), and none
of an outside project's ancestors is in the subtree.

Example: `P` owns workflow `W`, and its child `C` uses `W` too. `Q`,
outside `P`'s subtree, has an item holding one of `W`'s workphases.
Deleting `P` deletes `P`, `C`, `W` with its boards, columns and
workphases, and every item of `P` and `C`. `Q`'s item survives, with no
workphase.

## 10. Which workflow a project uses

**A project uses its own workflow, or, when it has none, that of its
nearest ancestor that has one.** When no ancestor has one, it uses none
(Open questions). So a project's own workflow is used by its whole
subtree, except below a descendant that has one of its own.

**Any project can be given a workflow of its own** by
`POST /api/workflows`, whether or not it uses an ancestor's. It then
uses its own, and so does each descendant that used the ancestor's
through it.

**A project has at most one workflow of its own.** A workflow create for
a project that already has one is refused with a 409 whose message
names that workflow, and nothing is created.

Example: `P` owns `W1`, and has a child `C`, whose child `D` owns `W2`.
`C` uses `W1`, and `D` and its descendants use `W2`. A workflow given to
`C` makes `C` use it, and leaves `D` as it is.

**What changes the workflow a project uses:**
- a move (§6), when the project has no workflow of its own, and its new
  nearest ancestor with one uses a different one;
- a workflow given to the project, or to a project between it and the
  one whose workflow it uses;
- the deletion of the workflow it uses, after which it uses that of its
  nearest ancestor that still has one, or none.

**The project's items come along,** still holding the old workflow's
workphases, so they show in Unsorted on the new workflow's boards
([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §3). How
they're re-filed isn't a rule yet (Open questions). After a workflow is
deleted, its items hold no workphase at all
([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §8).

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

- **The project page.** The breadcrumb, the tabs, the Overview tab with
  its description, parent dropdown and subprojects list, and the banner
  over an inherited board. The dropdown offers the top level and every
  project outside the project's own subtree, which is what §3 accepts.
  Whether it also leaves out a parent over the project cap (§3) is open.
- **The sidebar's other controls.** The create and delete buttons, how
  the delete asks before deleting, the collapse chevrons, and the
  remembered selection. The create dialog trims a name, and refuses an
  empty one.
- **How the user learns that a project write failed (§4).** A failed
  create's dialog shows an error. A failed parent change puts the
  dropdown back on the stored parent, and reaches the user only as a
  console error.
- **How an over-cap tab state looks (§1).**
- **The project cap's real value (§3).** 6 is a provisional working
  number, taken from the sidebar's arithmetic for the item cap
  ([`../item-attachment/`](../item-attachment/) §8).
- **A project that uses no workflow (§10).** It shows "Set up a
  Workflow", and has no board
  ([`../boards-columns-unsorted/`](../boards-columns-unsorted/), Open
  questions). What its items may hold is
  [`../item-attachment/`](../item-attachment/)'s open question.
- **Overriding an inherited workflow from the project page (§10).** The
  API takes one, and nothing on the project page offers it.
- **Re-filing a project's items (§10).** When a project comes to use a
  different workflow, its items keep the old one's workphases. How
  they're re-filed into the new one is undecided
  ([`../item-attachment/`](../item-attachment/), Open questions).
