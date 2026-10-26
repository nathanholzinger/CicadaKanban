# Item Attachment & Hierarchy Placement

**Test suite:** [`../../test-plans/item-attachment/`](../../test-plans/item-attachment/)

**Related:** [`../item-positioning/`](../item-positioning/) (what an
item's position compares against) · [`../positioning/`](../positioning/)
(how a position resolves) · [`../board-drag-interaction/`](../board-drag-interaction/)
(the gesture that drives these rules from a board) ·
[`../row-references/`](../row-references/) (a reference that names no
row, and how a write names none)

This page answers "what does it mean for one item to be attached to
another, and what is a legal parent," and what follows from those: which
workphase a write leaves an item in, what a create names, and what
happens to an item's descendants when it's deleted. It is deliberately
**gesture-agnostic** — every rule here holds identically whether the
change came from a drag, the Sheet's checkbox, the child badge, or an MCP
tool call.

---

## 1. Every item is either Free or Attached

**Attached** means the item has a parent item *and* its attachment flag is
set. **Free** means anything else — a top-level item, or a child whose
attachment flag is clear ("detached").

- **Top-level items are always Free.** An item with no item-parent is
  relationally a child of a *project*, not of an item. There is no
  meaningful thing for it to be attached to, so Free is not a togglable
  state for it — it's the only state it has.
- **A detached child is Free**, exactly as Free as a top-level item. There
  is no third status. "Detached child" describes where it sits in the
  hierarchy; "Free" describes how it behaves.
- **"Attached with no parent" is rejected, not ignored.** A write that
  sets the attachment flag on an item that has (or would have) no parent,
  a create included, is refused with a 400 and stores nothing. The
  request can only be a client bug, and silently accepting it would leave
  a stray flag on the row that later attaches the item the instant it
  gains a parent. The invariant *attached ⇒ has a parent* holds in the
  stored row, not only in the reading: a create with no parent stores the
  flag clear, and a write that clears `parentId` also clears the flag.

The state determines three things at once, and they always move together:

| | Free | Attached |
|---|---|---|
| Whose workphase governs it | its own | its parent's, inherited |
| What its position compares against | the whole workflow | its attached siblings under the same parent |
| How it renders | a **Card** on the board | a **Stub** inside an ancestor's Card |

## 2. What attachment actually governs

**Attachment is about *following*, not about *belonging*.** The
parent/child relationship is the hierarchy fact; attachment is a separate
choice about whether this item's status tracks its parent's.

- An Attached child **inherits its parent's effective workphase**, and a
  parent's workphase change cascades to every attached descendant.
- An Attached child **never receives `completedAt` and always keeps its
  position**, regardless of whether the workphase it inherited is terminal
  ([`../item-positioning/`](../item-positioning/) §6).
- **A Stub under a done parent reads as done by derivation**, from the
  terminal workphase it inherited. Nothing extra is stored to say so, and
  nothing needs to be un-stored when the parent reopens.
- A **detached** child keeps its own workphase, its own board position, and
  its own `completedAt` — it is not affected by its parent moving.

## 2a. The workphase a write leaves an item in

**A write that leaves an item Attached gives it its parent's
workphase** (§2). It may name the parent's workphase, or none. A write
that names any other, a move or a create, is refused with a 400, and the
message says to omit the workphase or name the parent's. "The parent" is
the one after the write, so two writes stay legal: a detach that files
the item in a workphase in the same write, which is what a Stub dropped
on a column sends, and an attach that names its new parent's workphase.

**An Attached item shows with its parent, whatever its own
`workphaseId` says.** No write makes the two disagree, but a direct
database edit can. The board then still shows the item inside its
ancestor's Card, and not in Unsorted, though the API's
`unsorted.invalidItems` lists it
([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §10).

**A write that leaves an item Free without naming a workphase gives it
the one it was shown in**, so leaving attachment never moves an item on
the board. That's the workphase of its nearest Free ancestor:
- not the root's, since a detached item partway up the tree is Free, and
  its own descendants are shown in its Card;
- not the item's own `workphaseId`, which differs only after a direct
  database edit.

It applies to four writes:
- a detach (§11);
- a detach that also reparents, which §11 counts as a reparent: the item
  takes the workphase it was shown in before the write, under its old
  parent;
- a reparent to root of an Attached item (§11);
- a create under a parent with the flag clear (§14), which takes the
  workphase its parent is shown in.

If that ancestor has no workphase, the write is refused with a 400, and
the message offers two ways out: name a workphase in the same write, or
file the Free ancestor into a workphase first. A write that names
`workphaseId: null` is accepted and leaves the item with no workphase on
purpose; omitting it means "where it was shown". The message doesn't
suggest `null`, since an item with no workphase shows in Unsorted.

**A Free item's workphase belongs to its project's workflow, the one
its project uses ([`../project-tree/`](../project-tree/) §10), or it has
none.** A write that names a workphase its project's workflow doesn't
use, a create or a move, is refused with a 400, with or without a
reparent in the same write. So is a cross-workflow reparent that would
leave a Free item in the moved subtree (§9). What a project that uses
no workflow, its own or an ancestor's, allows isn't a rule yet (Open
questions).

## 3. Reparenting is one-way

**An item may choose a new parent. An item may never choose a new child.**

Every hierarchy change is therefore expressed as a write to the *moving*
item, never to the target. Dropping card A onto card B is "A acquires
parent B" — B's own row is not the subject of the change.

**Why it matters as a testable rule:** it fixes which row a gesture is
allowed to touch, and it means the rules for "is this a legal move" are
always evaluated from the dragged item's point of view (its subtree, its
depth, its project), never from the target's.

## 4. Reparenting an Attached item always resolves a replacement position

**"Reparent but keep your position" is not a valid operation for an
Attached item.** An attached item's position is only meaningful among its
old siblings; carried into a new parent's list it means nothing. So a
reparent always resolves a fresh position in the *new* scope.

Scope note: this rule is about **Attached** items only. A Free item can
also be reparented (below), but its position scope is workflow-wide and
parent-independent, so a reparent alone doesn't touch its position.

The placement is always **before/after a specific anchor**. "First in
list" and "last in list" are that same form with the anchor chosen by the
client as the first or last item it renders in the target context — see
[`../item-positioning/`](../item-positioning/) §7.1. An empty target has no
anchor and takes the append fallback
([`../positioning/`](../positioning/) §3). There is no option that means
"unchanged."

A resolved position may coincidentally come out equal to the old number.
That is not the same thing as keeping it, and does not make the operation
a no-op.

**A Free item may be reparented and stay Free.** Reparenting and
attaching are separate choices (§2), and the API supports every
combination: a request carries `parentId` and, independently, the
attachment flag. **Omitting the flag keeps the item's current state** —
a Free item reparented without the flag is still Free under its new
parent, so a top-level item, whose flag is always clear (§1), becomes a
detached child; an Attached one is still Attached. No reparent attaches
by default. A Free reparent with no anchor leaves the position alone
(its scope is workflow-wide and didn't change); with an anchor it
repositions like any other Free item. Whether the *board gesture* offers
this is open (Open questions); the API rule is settled here.

## 5. Reparent first, then resolve the position

Within the single operation, **the new parent must be in effect before the
position is resolved.** The new position's comparison scope is *derived
from* the new parent, so resolving first would resolve against the scope
the item is leaving.

This is a sequencing rule, not a performance note — reversing it produces a
number drawn from the wrong list, which is silently wrong rather than
loudly wrong.

## 6. One gesture, one atomic commit

**Reparent, attach/detach, workphase change, and position resolution commit
together or not at all.** A single user gesture is a single logical change,
even when it touches four fields and cascades to a subtree.

**Why:** a partial commit can produce states no gesture can otherwise
create and no view can render honestly — an item reparented but still
holding a position from its old sibling list, or moved while its attached
descendants stay behind in the old workphase.

**On failure, nothing changed.** The client's correct response to a
rejected change is to resync from the server, never to keep its optimistic
guess. There is no partial-success outcome to report to the user.

## 7. What makes a target a legal parent

A candidate parent is legal for a given moving item if **all** of the
following hold:

1. **It exists.** A parent reference that names no item is rejected, not
   stored ([`../row-references/`](../row-references/) §1).
2. **It is not the moving item itself.**
3. **It is not a descendant of the moving item.** Moving an item into its
   own subtree would form a cycle.
4. **It leaves the resulting tree within the depth cap** — see §8.

**Cross-project is *not* a disqualifier** (§9). **Cross-workflow is,
whenever the moved subtree would hold a Free item after the write**
(§9).

**Where this is enforced:** at the **UI** (before the drop is offered) and
at the **API** (on the write). Never in the database schema — the hierarchy
link is a soft reference by design, and the schema is not the place to
encode a product policy that a later epic may relax.

**"On the write" means every write.** The rules above apply to any API
request that could give an item a parent — creating an item with a
parent, editing its parent, or moving it — not only to the board's move
endpoint. A rule the move endpoint enforces and the create endpoint
doesn't is not a rule.

**The two enforcement points must agree.** The UI must never present as
droppable a target the API would reject; a validity rule that only the
server knows about produces a gesture that looks like it worked and didn't.
This holds for the board's drag. The Sheet's parent picker is outside it
while the Sheet isn't designed
([`../item-sheet/`](../item-sheet/), Open questions).

## 8. Depth cap

**An item's hierarchy is capped by
[`../hierarchy-placement/`](../hierarchy-placement/) §6's rule,** at the
item cap, `CAP`, with **root items at depth 1**: a target at depth `D`
is a legal parent only if `D + 1 + H <= CAP`, `H` being the moving
item's subtree height. What's particular to items:

**The subtree is the full descendant subtree, attached and detached
alike.** A detached descendant still sits under the moving item in the
hierarchy and still moves with it, so it counts toward the height.

**`CAP` is provisionally 6.** Its real value is open (Open questions).
It's set on its own, apart from any other feature's cap
([`../hierarchy-placement/`](../hierarchy-placement/) §6).

**Grounding for the provisional 6:** an indented hierarchy has to stay
legible in the project sidebar and the expanded-hierarchy modal. The
sidebar is 240px wide, indents 14px per level from a 12px base, so a
depth-6 row still leaves ~158px for its label — roughly twenty
characters. Depth 8 leaves ~130px, which is where it stops reading as a
label and starts reading as a truncation.

## 9. Cross-project reparenting

**Reparenting across projects is allowed on a board, and cascades the new
project to the moving item's entire descendant subtree.**

**Why this is safe rather than alarming:** a board is scoped to one
workflow. So any cross-project drag *on a board* is necessarily between two
projects that already share that workflow — every workphase the moved
subtree references stays valid, and no cross-workflow case can arise from
this gesture.

**"Entire descendant subtree" includes detached descendants.** A detached
child does not follow its parent's *workphase* (§2), but it does follow
its parent's *project* — it is still that parent's child in the
hierarchy, and a hierarchy can't straddle two projects. This is the one
place a detached child is affected by its parent moving; §2's "not
affected" is about workphase, position, and `completedAt`.

**A cross-workflow reparent is refused whenever the moved subtree would
hold a Free item after the write:** the moving item, if it ends Free, or
any detached descendant. Each would keep a workphase of its old workflow
(§2a), and an item write never leaves an item where only Unsorted can
show it. Unsorted is for what gets past, such as a direct database edit,
or a project that comes to use a different workflow
([`../project-tree/`](../project-tree/) §6, §10;
[`../boards-columns-unsorted/`](../boards-columns-unsorted/) §10). The
refusal holds even when the write names a workphase of the new workflow
for the moving item: no write re-files items across workflows (Open
questions). A cross-workflow
reparent that ends with the moving item Attached, with no detached
descendant, is allowed: the item and its attached descendants take the new
parent's workphase (§2), and the item takes a fresh position among its new
siblings, as any item Attached after a reparent does (§4).

A cross-project reparent does **not** on its own change the moved item's
position comparison scope, which never depends on the project: a Free
item's is the workflow, and an Attached item's is its parent's attached
children. Whether the position re-resolves is decided as for any reparent,
never by the project change. An item that is Attached before or after the
write resolves a fresh position (§4;
[`../item-positioning/`](../item-positioning/) §2.1). A Free item that
stays Free keeps its position unless the write carries an anchor (§4). On
a board every reparent is an attach, so it always re-resolves.

## 10. Attaching to a done parent

**Allowed, and unremarkable.** The child inherits the parent's terminal
workphase, receives no `completedAt`, and keeps its position among its new
siblings — all direct consequences of §2, with no special case.

The child then reads as done by derivation. If the parent is later
reopened, the child reads as not-done again, with nothing written or
cleared on the child in either direction.

## 11. Detaching preserves the parent relationship

**Detaching an item clears its attachment; it does *not* clear its
parent.** A Stub pulled out of its parent becomes a Free Card that still
records that parent.

The exception is when the same gesture lands it inside a *different*
parent's context — then it is a reparent (§3–§5), not a plain detach.

On becoming Free, the item:

- takes a board-level position, resolved in the workflow-wide scope
- takes the workphase it was shown in (§2a), and stops tracking its
  former parent's
- becomes eligible for `completedAt` like any other Free item

**Why keep the parent:** per §2, attachment answers "does this follow its
parent," not "does this belong to its parent." A user pulling a child out
onto the board is answering the first question, and there is no reason to
assume they meant to answer the second. Severing the relationship is a
separate, explicit act.

**Severing is "reparent to root."** A write that sets `parentId` to null
makes the item top-level: it clears the parent *and* (per §1's invariant)
the attachment flag, so it is Free with nothing above it. Its workphase is
the one §2a gives it. For an Attached item this is a scope change
(attached-siblings → workflow) and resolves a fresh position like any
detach — including the done-item consequence if that workphase is
terminal, since it is now a Free item in a done workphase; for an
already-Free child it changes nothing about its position scope, and its
position is left alone unless the same write carries an anchor. It is a
legal target for any entry point, including the move endpoint, and needs
no UI gesture to exist.

## 11a. Hierarchy changes are logged

**Any write that changes an item's parent or attachment flag records an
activity entry on the moving item**, whichever entry point produced it.
The entry says what changed — attached to, detached from, reparented
from/to, made top-level — so the Sheet's activity list can account for
why an item is where it is. A write that touches neither field logs
nothing under this rule (a workphase move logs its own entry already).

**Creating an item with a parent counts.** The new item's activity
records the parent it was created under, and whether it's attached to it,
whichever entry point created it. How that reads, and whether the parent's
activity shows it too, isn't a rule yet (Open questions).

## 12. Representation follows state

Naming used throughout the product and these pages (UI vocabulary only —
none of it is stored):

- **Stub** — an attached descendant rendered inside its ancestor's Card. A
  title snippet, enough to identify the item. No independent board position.
- **Card** — a Free item as the board's draggable unit: title, description
  snippet, and a collapsible list of descendant Stubs.
- **Planned:** a Card also shows its item's tags.
- **Sheet** — the full item detail view
  ([`../item-sheet/`](../item-sheet/)). The only place non-positional data
  is edited.
- **Headline** — an item's line in an Inbox list view (title + priority
  tags).

*Dossier* — a hypothetical richer-than-Sheet view — is named but
undesigned.

## 13. Deleting an item deletes its subtree

**Deleting an item permanently deletes every descendant with it,
attached or detached**, whichever entry point makes the delete. Nothing
is left behind: no descendant becomes top-level or moves to another
parent.

A detached descendant goes too, because detaching keeps the parent
(§11), so it's still in the subtree. Attachment is about following, not
belonging (§2), and a delete removes what belongs to the item. On the
board, deleting a Card also removes the Cards of its detached
descendants, wherever they sit.

**Deleting a project deletes its items, each with its subtree**
([`../project-tree/`](../project-tree/) §9).

## 14. Creating an item

**A create names the item's project, its parent, or both.**
- A project alone makes a top-level item in that project.
- A parent alone makes a child in the parent's project.
- Both are accepted when the parent is in that project, and refused with
  a 400 when it isn't: a hierarchy can't straddle two projects (§9).
- Neither is refused with a 400.

A create naming a project that doesn't exist is refused with a 400, and
nothing is stored, as one naming a parent that doesn't exist is (§7;
[`../row-references/`](../row-references/) §1).

**A child is created Attached unless the create clears the flag.** Under
§11, an item becomes Free by an explicit detach, so a child created Free
without asking would be detached with no one detaching it. A child
created with the flag clear is a detached child, Free from the start,
and its workphase follows §2a.

**A workphase is optional.** A top-level create may omit it, even in a
project that uses no workflow, and the item then has none. It shows in
Unsorted on the boards of the workflow its project uses
([`../boards-columns-unsorted/`](../boards-columns-unsorted/) §3, §10). A
project that uses no workflow, its own or an ancestor's, has no board,
so nothing shows the item yet
([`../boards-columns-unsorted/`](../boards-columns-unsorted/), Open
questions). An Attached child created without one takes its parent's
(§2a).

A create is a write like any other: §1, §2a, §7 and §8 hold for it, and
§11a logs a create under a parent.

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

- **Free-item reparent *as a board gesture*.** The API supports it (§4).
  What's open is whether the board offers a drop that means "reparent but
  stay Free" — a third meaning the UI would have to disambiguate against
  attach-on-drop and reposition-on-drop. Undecided whether to build it,
  defer it, or conclude it isn't a board action that makes sense.
- **`CAP`'s real value.** 6 is a provisional working number derived from
  sidebar arithmetic (§8), not from looking at real hierarchies.
- **Beyond the cap.** Trees deep enough that per-level indentation fits
  neither the sidebar nor the expanded-hierarchy modal have no answer yet.
  A pagination or folder scheme would be needed.
- **How a create under a parent reads in the activity lists (§11a).** One
  idea is a single entry that the child shows as "Created on {date} as a
  child of {parent}" and the parent shows as "Child {child} created on
  {date}". Whether the parent's list shows it at all, and whether that
  needs a change to how activity entries are kept, is undecided.
- **Re-filing across workflows (§9).** A cross-workflow reparent that
  would leave a Free item in the moved subtree is refused, even when the
  write names a workphase of the new workflow. How a write could re-file
  a subtree into another workflow, for example with a map from each old
  workphase to a new one, or a single default, is undecided. So is how a
  project that comes to use a different workflow re-files its items
  ([`../project-tree/`](../project-tree/) §10).
- **A project that uses no workflow (§2a, §9),** its own or an
  ancestor's. A Free item's workphase belongs to its project's workflow,
  or it has none. Whether a write may name a workphase for a Free item in
  such a project, and
  whether a reparent into or out of such a project is cross-workflow, is
  undecided.
