# Item Attachment & Hierarchy Placement

**Build status:** The Free/Attached state model and its consequences are
**implemented as of Epic 3**. The rules below that describe *reparenting
placement* (§4–§8) are **settled but not yet implemented** — Epic 3.5
Story 1 builds them.

**Test suite:** [`../../test-plans/item-attachment/`](../../test-plans/item-attachment/) *(not yet written)*

**Related:** [`../item-positioning/`](../item-positioning/) (what a position
means and how it resolves) · [`../board-drag-interaction/`](../board-drag-interaction/)
(the gesture that drives these rules from a board)

This page answers "what does it mean for one item to be attached to
another, and what is a legal parent." It is deliberately **gesture-
agnostic** — every rule here holds identically whether the change came from
a drag, the Sheet's checkbox, the child badge, or an MCP tool call.

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
  position**, regardless of whether the workphase it inherited is terminal.
  (This is Epic 3.2's model, unchanged by Epic 3.5 — see
  [`../item-positioning/`](../item-positioning/) §6.)
- **A Stub under a done parent reads as done by derivation**, from the
  terminal workphase it inherited. Nothing extra is stored to say so, and
  nothing needs to be un-stored when the parent reopens.
- A **detached** child keeps its own workphase, its own board position, and
  its own `completedAt` — it is not affected by its parent moving.

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

Scope note: this rule is about **Attached** items only. Whether a Free item
can be reparented at all is an open question (below), so this page states
no rule either way for that case.

The placement is always **before/after a specific anchor**. "First in
list" and "last in list" are that same form with the anchor chosen by the
client as the first or last item it renders in the target context — see
[`../item-positioning/`](../item-positioning/) §7.1. An empty target has no
anchor and takes the append fallback. There is no option that means
"unchanged."

A resolved position may coincidentally come out equal to the old number.
That is not the same thing as keeping it, and does not make the operation
a no-op.

*(A Free item's position scope is workflow-wide and therefore
parent-independent, so this rule's rationale doesn't reach it. That case is
deliberately unsettled — see Open questions, not a rule here.)*

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
   stored.
2. **It is not the moving item itself.**
3. **It is not a descendant of the moving item.** Moving an item into its
   own subtree would form a cycle.
4. **It leaves the resulting tree within the depth cap** — see §8.

**Cross-project is *not* a disqualifier.** See §9.

**Where this is enforced:** at the **UI** (before the drop is offered) and
at the **API** (on the write). Never in the database schema — the hierarchy
link is a soft reference by design, and the schema is not the place to
encode a product policy that a later epic may relax.

**The two enforcement points must agree.** The UI must never present as
droppable a target the API would reject; a validity rule that only the
server knows about produces a gesture that looks like it worked and didn't.

## 8. Depth cap

**A target at depth `D` is a legal parent only if:**

```
D + 1 + draggedSubtreeHeight <= CAP
```

with **root items at depth 1**, and `draggedSubtreeHeight` counting the
levels *below* the dragged item (a leaf being dragged has height 0).

The moving item brings its whole subtree with it, so the cap is checked
against the deepest leaf that would result — not against the dragged item
alone.

**`CAP` is provisionally 6, pending Story 7's empirical determination.**

The cap is a **display** constraint, not a data constraint: it exists
because indented hierarchy has to stay legible in the project sidebar and
the expanded-hierarchy modal, not because deeper trees are semantically
wrong. Grounding for the provisional 6: the sidebar is 240px wide, indents
14px per level from a 12px base, so a depth-6 row still leaves ~158px for
its label — roughly twenty characters. Depth 8 leaves ~130px, which is
where it stops reading as a label and starts reading as a truncation.

**`CAP` is a single named constant with one definition**, consumed by both
the UI and the API. Story 7 changes its value; nothing else should need to
change with it. Derived test cases parameterize on it rather than hard-
coding 6.

**The cap does not retroactively invalidate existing data.** It gates
*moves*; a tree that is already deeper than the cap (imported, or created
before the cap existed) stays valid and readable. Only a gesture that would
*increase* depth past the cap is refused.

## 9. Cross-project reparenting

**Reparenting across projects is allowed on a board, and cascades the new
project to the moving item's entire descendant subtree.**

**Why this is safe rather than alarming:** a board is scoped to one
workflow. So any cross-project drag *on a board* is necessarily between two
projects that already share that workflow — every workphase the moved
subtree references stays valid, and no cross-workflow case can arise from
this gesture.

**Cross-*workflow* moves are not a board gesture at all.** They belong to
the Sheet-level "move to project" action (Epic 7), where the workphase
remapping problem can be presented to the user properly.

A cross-project reparent does **not** on its own change the moved item's
position comparison scope — position is workflow-wide, and the workflow is
unchanged. The position is still re-resolved, but because §4 says a
reparent always re-resolves, not because the project changed.

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
- takes its own workphase and stops tracking its former parent's
- becomes eligible for `completedAt` like any other Free item

**Why keep the parent:** per §2, attachment answers "does this follow its
parent," not "does this belong to its parent." A user pulling a child out
onto the board is answering the first question, and there is no reason to
assume they meant to answer the second. Severing the relationship is a
separate, explicit act.

## 12. Representation follows state

Naming used throughout the product and these pages (UI vocabulary only —
none of it is stored):

- **Stub** — an attached descendant rendered inside its ancestor's Card. A
  title snippet, enough to identify the item. No independent board position.
- **Card** — a Free item as the board's draggable unit: title, description
  snippet, tags, and a collapsible list of descendant Stubs.
- **Sheet** — the full item detail view. The only place non-positional data
  is edited.
- **Headline** — an item's line in an Inbox list view (title + priority
  tags). Pre-existing design-doc term.

*Dossier* — a hypothetical richer-than-Sheet view — is named but explicitly
undesigned and post-MVP.

---

## Open questions

Not settled. **Do not derive test cases from anything in this section.**
Everything *outside* this section is settled and derivable — including the
depth cap, whose *rule* is settled and whose *value* is provisional.

- **Free-item reparent (Story 9).** May a Free item be reparented while
  *staying* Free? Cheap on the server — a Free item's position scope is
  parent-independent, so §4's re-resolution isn't strictly needed — but it
  introduces a third meaning for a drop that the UI must disambiguate
  against attach-on-drop and reposition-on-drop. Undecided whether to
  build, defer, or conclude it isn't a board action that makes sense.
  - **Known trap if it is built:** a reparent request that doesn't
    *explicitly* carry "stay detached" silently attaches, because attaching
    is the default for a newly-parented item.
- **`CAP`'s real value (Story 7).** 6 is a provisional working number
  derived from sidebar arithmetic, not from looking at real hierarchies.
- **Beyond the cap.** Trees deep enough that per-level indentation fits
  neither the sidebar nor the expanded-hierarchy modal have no answer yet.
  A pagination/folder scheme would be needed; explicitly not MVP.
