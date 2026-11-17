# Project Tree

**Test suite:** [`../../test-plans/project-tree/`](../../test-plans/project-tree/)

**Related:** [`../hierarchy-placement/`](../hierarchy-placement/) (the
gap-and-depth rule the sidebar places by, the depth cap, and the drag's
tiers and carried branch) ·
[`../positioning/`](../positioning/) (how a project's position
resolves) · [`../boards-columns-unsorted/`](../boards-columns-unsorted/)
(which projects' items a board shows) ·
[`../item-attachment/`](../item-attachment/) (an item's own tree) ·
[`../row-references/`](../row-references/) (a reference that names no
row)

This page answers "what is the project tree, how does a write change it,
and which workflow does each project use." Its numbered sections state
what the API does, and what the sidebar's drag and collapse add to it.
The project page, and the sidebar's controls other than the drag and
the collapse (§11), are a working placeholder: they're under Open
questions, and no test case is derived from them. A dragged project is
placed by [`../hierarchy-placement/`](../hierarchy-placement/)'s gap and
depth, and a project's position resolves by
[`../positioning/`](../positioning/)'s rules, which items share. Which
items a board shows is
[`../boards-columns-unsorted/`](../boards-columns-unsorted/)'s.

---

## 1. Dragging a project places it by gap and depth

**A project dragged in the sidebar is placed by
[`../hierarchy-placement/`](../hierarchy-placement/)'s gap and depth**,
against the whole project tree, and a release saves the placement as a
move (§6). What the sidebar adds:

- **The dragged project's own row is its ghost, and moves to the gap**
  ([`../hierarchy-placement/`](../hierarchy-placement/) §1). It takes
  the slot of the row the drag copy is nearest: a row below the ghost's
  own slot puts it in the gap after that row, one above in the gap
  before it, and its own row in its own gap. So every gap, the list's
  two ends included, is reached from one row. The rows sliding aside
  never move the gap, so a still cursor holds one. A release saves
  exactly the gap and depth the ghost shows.
- **The list is the rows drawn.** A collapsed project counts once, and
  the rows it hides and the dragged project's branch (§2) not at all.
  Placement still reads the real tree (below).
- **The root is the top of the tree**, above every project
  ([`../hierarchy-placement/`](../hierarchy-placement/) §3). Its children
  are the top-level projects, those with no parent, so no project can be
  tabbed shallower than the top level.
- **The sidebar always has full context.** A collapsed project hides its
  subtree from view, not from placement: the sidebar places against the
  real tree. Tabbed right of a collapsed Top, a project goes ahead of
  Top's real first child; aligned with it, after Top's whole subtree,
  shown or not.
- **Nearest the dragged project's own row, the ghost is in its own
  gap,** with its depth range. The rows of its branch aren't drawn while
  it's dragged (§2), and none of them is ever Top or Bottom
  ([`../hierarchy-placement/`](../hierarchy-placement/) §4), as on the
  board ([`../board-drag-interaction/`](../board-drag-interaction/)
  §7.2).
- **An empty hierarchy arises when the dragged project's subtree holds
  every project**, since that subtree is never a candidate: for example, a
  sidebar with one top-level project. It offers one state, at the top
  level ([`../hierarchy-placement/`](../hierarchy-placement/) §2). No line
  is drawn, and the ghost stays where it is, since the one state is
  where the project already is, and a release writes nothing.
- **A tab state that would put the dragged project's subtree past the
  project cap (§3) is still offered, its line and the drag copy are
  marked invalid, and a release in it writes nothing**
  ([`../hierarchy-placement/`](../hierarchy-placement/) §6). Every other
  tab state in the range is valid. How the invalid state looks isn't a
  rule yet (Open questions).
- **A project set back down in its own gap, at its own depth, writes
  nothing** ([`../hierarchy-placement/`](../hierarchy-placement/) §5).
- **The drag counts the tree as it was at pickup,** for the whole drag:
  the dragged project's subtree, whose rows are left out of placement,
  and the subtree's height, which the cap reads. A drag's own move is
  drawn at its release (§4), so the next pickup counts it. What can
  still land mid-drag is a change no drag drew: the answer to an
  earlier create (§5) or parent edit (§7), and a refused move going back
  (§4), with the read of the tree that follows it. If one puts a project
  under the dragged one, that project's row stays a place to drop. A
  row such a change adds is drawn untiered
  ([`../hierarchy-placement/`](../hierarchy-placement/) §7). A release
  that would make a cycle, or put the grown subtree past the cap, is
  refused by the server (§3), and nothing changes. It's the one
  place a cycle is reachable by a drag
  ([`../hierarchy-placement/`](../hierarchy-placement/) §4). Why not
  stop the drag, as the board does at a reload: the window is one
  response's time, and a refused drop costs one retry.

## 2. What the drag shows

**Every row is drawn by what it can be to the dragged project,** by
[`../hierarchy-placement/`](../hierarchy-placement/) §7's tiers: Full,
a project that can be its parent; Mid, one that can't, whose parent
can; and Low, one whose parent can't. Every row is an entry, since
placing a project beside a row always gives it that row's parent.

- **The top of the tree takes the dragged project** when its whole
  subtree fits from the top level (§3). So a top-level row is Full or
  Mid. Only a subtree already past the cap leaves every row Low.
- **Mid shows only near the cap.** A row is past the cap when its depth
  plus 1 plus the dragged subtree's height is over it (§3), so Mid is
  the one depth of rows just past the cap, and the rows under them are
  Low. On a tree well within the cap, every row is Full, and only the
  ghost is dimmed.
- **The dragged project's descendants aren't drawn** (below). They'd be
  Low, and none of them is a place to drop (§1).
- **The dragged project's own row is its ghost** (§1), drawn at a
  strength of its own, at the depth a release in its gap gives the
  project.
- **The sidebar's values:** Mid is drawn at `projectAnchorOpacity`,
  about 0.6, Low at `projectNeitherOpacity`, about 0.3, and the ghost at
  `projectDraggedOpacity`, about 0.3. All three are tunable, and apart
  from the board's.

Example, with the cap at 12: a chain of projects runs from `P1`, at the
top level, down to `P12`, and `X`, with one child, is dragged. `P1` to
`P10` are Full, `P11` is Mid, and `P12` is Low. `X`'s child isn't
drawn.

The tiers are settled. Their final look isn't a rule yet (Open
questions).

**A line rides the ghost's top edge,** between it and the row above, in
every gap, the gap above the first row included. **Why the top:** the
depth is decided against the project above, Top
([`../hierarchy-placement/`](../hierarchy-placement/) §1). The line
starts where the ghost's name starts, at the depth a release would give
the project, so each depth of a gap starts at a column of its own. It
keeps full strength, though the ghost it rides is dimmed. No line is
drawn in an empty hierarchy (§1).

**A pickup takes the dragged project's whole subtree out of the rows,**
as its branch ([`../hierarchy-placement/`](../hierarchy-placement/)
§8). Projects have no Free links, so every descendant goes with it, and
so does one under a collapsed project, which no row drew. At the pickup,
the rows below move up by the branch's height, and the project's own
row stays, as the ghost.
- **The drag copy's second line** counts the project's children and its
  whole subtree, the rows under a collapsed project included. In a
  narrow sidebar it's cut short.

**A collapsed project opens when a project is dropped into it** as its
child (§11).

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
cap, and is 12, for the item cap's reason
([`../item-attachment/`](../item-attachment/) §8): depth would be
unlimited if the UI could show any depth, and 12 shows well while
leaving room real use should rarely outgrow.

**The sidebar's width doesn't limit the cap.** A deep project, or a
long name, is read in full by dragging the sidebar wider, as in an
IDE's file pane. A narrow sidebar cuts the deepest names short, or
leaves them no room at all. That's the trade a user makes for a wider
board.

Example, with the cap at 12: a chain of projects runs from `P1`, at the
top level, down to `P11`, at depth 11. A project with one child can be
moved under `P10` (10 + 1 + 1 = 12), but not under `P11`
(11 + 1 + 1 = 13).

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

**A drag's move is drawn at its release,** at the project's new place
with its branch, before the server answers, by the relation the move
sends (§6). The answer puts the project where it's already drawn
([`../positioning/`](../positioning/) §5), so a move that succeeds
doesn't visibly change. Moves released one after another each settle
by their own answer.

**An older answer never undoes a newer one.** An answer to a write
doesn't overwrite a position a later-sent write has set
([`../positioning/`](../positioning/) §8), and none shows a deleted
project back (§9).

**A read of the tree that began before a write's answer was applied
never undoes that write,** however late it lands, and the first read
the sidebar makes is no exception. **Why:** the read holds the tree as
it was before the write, so applying it would put back a name, a parent
or an order the user has already changed.

**After a failed write, the sidebar shows the project where it was
before the attempt.** A failed create shows no new project, and a failed
edit leaves the project where it was. A failed move goes back as soon
as it fails, without waiting for the tree to be read again. How the user
learns that a write failed isn't a rule yet (Open questions).

## 5. Creating a project

**A create makes a top-level project, or a child of the parent it names
(§3), and places it after its siblings' true last**
([`../positioning/`](../positioning/) §3, §4). Example: with siblings at
`1.0` and `2.0`, a create lands at `3`. A parent's first child lands at
`1`.

A create needs a name (§8). The new project uses the workflow its parent
uses, until it's given one of its own (§10). A collapsed parent opens in
the sidebar once the create succeeds (§11).

**"Add subproject" shows disabled at a parent the project cap allows no
child under** ([`../hierarchy-placement/`](../hierarchy-placement/)
§6), on a sidebar row and on a project's Overview tab alike. "New
project", at the sidebar's top, makes a top-level project, so it's
always offered. Until the client has read the cap, every "Add
subproject" is offered, and the API still refuses a create past the cap
(§3).

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
must be legal (§3). A collapsed new parent opens in the sidebar once the
edit succeeds (§11).

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

**A deleted project stays gone from the sidebar.** No answer to an
earlier write, whenever it lands, shows the project back, or shows
another project under it.

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
through it. The create names the project by `projectId`, a required
reference ([`../row-references/`](../row-references/) §1): one left out,
or naming no project, is refused with a 400, and nothing is created.

**A project has at most one workflow of its own.** A workflow create for
a project that already has one is refused with a 409 whose message
names that workflow, and nothing is created.

Example: `P` owns `W1`, and has a child `C`, whose child `D` owns `W2`.
`C` uses `W1`, and `D` and its descendants use `W2`. A workflow given to
`C` makes `C` use it, and leaves `D` as it is.

**A workflow create may name where its workphases come from:** a
template, by `templateId`, or another workflow, by `sourceWorkflowId`.
The new workflow starts with a copy of that one's workphases. Leaving
both out makes a workflow with no workphases, and a field given as
`null` names none, as leaving it out does. Both fields are references
([`../row-references/`](../row-references/) §1), so one that names no
template, or no workflow, is refused with a 400, and nothing is
created.

**A create naming both a template and a workflow is refused** with a
400, and nothing is created. A field given as `null` isn't named, so a
create naming a template, with `sourceWorkflowId: null`, starts with
the template's workphases. Why refuse it: taking either one would drop
the other without a sign, and hide the caller's mistake, as a fallback
would ([`../row-references/`](../row-references/) §1).

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
they're re-filed isn't a rule yet (Open questions).

**`DELETE /api/workflows/:id` deletes the workflow with its boards and
their columns, its workphases and its notifications, and never an
item.** An item holding one of its workphases survives with none, and
shows in Unsorted
([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §8, §10).
No other item changes. That holds whether or not a project owns the
workflow: one with no owner deletes the same way.

## 11. Which projects the sidebar shows open

**Every project in the sidebar starts open, a new one included,** and
stays open until the user collapses it by its chevron. A collapse isn't
kept: a reload opens every project. A collapsed project hides its
subtree from view, not from placement (§1). **Why a new one starts
open:** a project that started collapsed would hide the first
subproject made under it.

**A collapsed project opens when the app puts a project under it,** so
that project is in view, even where the user collapsed it by hand:
- **A drop** into it as a child opens it on the drop, so it stays open
  if the move fails and the project goes back (§4).
- **A create** under it (§5), and **an edit that changes a project's
  parent** to it (§7), open it once the write succeeds. A failed one
  leaves it collapsed.
- **Only a write that gives a project a parent it didn't have opens
  one.** A rename, or an edit naming the parent the project already
  has, leaves a collapsed parent collapsed. A top-level project has no
  parent to open.

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

- **The project page.** The breadcrumb, the tabs, the Overview tab with
  its description, parent dropdown and subprojects list, and the banner
  over an inherited board. The dropdown offers the top level and every
  project outside the project's own subtree, which is what §3 accepts.
  Whether it also leaves out a parent over the project cap (§3) is open.
- **The sidebar's other controls.** The create and delete buttons, how
  the delete asks before deleting, and the remembered selection. The
  create dialog trims a name, and refuses an empty one.
- **The sidebar's width (§3).** A handle on the sidebar's right edge
  drags it wider or narrower: 240px by default, held between 120px and
  420px, and kept in the browser for each viewer. It has no keyboard
  control and no reset gesture. At 420px, a long name at the deepest
  level is still cut short. Collapsing or hiding the sidebar is
  undesigned.
- **How the user learns that a project write failed (§4).** A failed
  create's dialog shows an error. A failed parent change puts the
  dropdown back on the stored parent, and reaches the user only as a
  console error.
- **The look of the drag's cues (§1, §2).** How an over-cap tab state
  looks, the tiers' and the ghost's final look, and the drag copy's,
  with its second line. Today:
  - the tiers and the ghost are drawn as the board's are, by opacity
    alone;
  - past the cap the line is red, and the copy has the board's dashed
    red outline;
  - the copy is held to the sidebar's width, following the pointer only
    up and down, and is laid out as the project's row at the ghost's
    depth, its name over the ghost's. A level is about 14px of indent,
    and of the pointer's sideways travel;
  - the copy glides into the project's new place at a drop, and back to
    its own slot, where the ghost returns, at an end that writes nothing;
  - the second line has the board's placeholder look.
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
