# Hierarchy Placement — Gap and Depth

**Test suite:** none of its own. Each feature that places by these
rules tests them in its own catalog:
[`../../test-plans/board-drag-interaction/`](../../test-plans/board-drag-interaction/),
[`../../test-plans/item-attachment/`](../../test-plans/item-attachment/)
and [`../../test-plans/project-tree/`](../../test-plans/project-tree/).

**Related:** [`../board-drag-interaction/`](../board-drag-interaction/)
§7 (a Card's descendants section on the board) ·
[`../project-tree/`](../project-tree/) §1, §3 (the project sidebar, and
the project cap) · [`../item-attachment/`](../item-attachment/) §8 (the
item cap)

This page answers "given where a dragged entry is released in a
hierarchy, where does it land, and how deep may a hierarchy go." Its
rules are shared: a Card's descendants section on the board and the
project sidebar both place by them, and §6's depth cap holds for every
write that gives an item or a project a parent, whatever the surface. An
*entry* is one row of the hierarchy: an item, shown as a Stub in a
Card's section, or a project in the sidebar. Each feature's own page
says how it shows the gap, what its root is, and any rule of its own,
and marks as Planned any rule here that it's still to be built to.

---

## 1. Gap and depth

With full context of the hierarchy, a release resolves to a **gap**
between two rendered entries, chosen by vertical position: **Top**, the
entry the dragged one will sit directly under, and **Bottom**, the entry
it will sit directly above. How a surface shows the gap is its own.
**Horizontal offset** then picks a depth from a range of discrete tab
states, depth increasing as you tab **right** (deeper):

> **range = [ Bottom's depth … Top's depth + 1 ]**

- **Top's depth + 1** — tabbed once right of Top: the entry becomes
  **Top's first child**. To land anywhere else among Top's children, the
  user anchors against one of those children instead — never directly
  under the parent.
- **Top's depth** — aligned with Top: the entry becomes Top's sibling,
  positioned **just after Top** — which means after Top's *entire
  subtree* in render order, since that is where the gap is.
- **Each shallower level**, down to Bottom's depth — tabbed left of Top:
  walk Top's ancestors. One tab left → sibling of Top's parent, just after
  it (after *its* subtree); two tabs left → sibling of Top's grandparent;
  and so on. The shallowest of these, at Bottom's depth, is the same
  placement as "Bottom's sibling, just before it" — the client sends one
  relation, and the result is identical either way.
- **Nothing shallower than Bottom.** That would make the entry Bottom's
  ancestor. An entry may choose its parent; it may never choose its
  children.

By and large the entry is being placed somewhere in Top's hierarchy — as
its child, its next sibling, or the next sibling of one of its ancestors.
Bottom only caps how far left the walk can go.

**Worked example.** With the hierarchy rendered as `A › A1 › A1a`, then
`B` at the shallowest level, the gap between `A1a` (Top, depth 2) and `B`
(Bottom, depth 0) offers exactly four states: depth 3, child of `A1a`;
depth 2, after `A1a` under `A1`; depth 1, after `A1` under `A`; depth 0,
after `A` — a.k.a. before `B`. The gap directly beneath `A1` (Bottom `A1a`
is Top's own child) offers exactly **one** state: first child of `A1`,
before `A1a`. Note that "sibling after `A1`" is *not* reached from the gap
under `A1`; it is reached from the gap below the last entry of `A1`'s
subtree, tabbed to `A1`'s depth.

## 2. Boundaries

- **Above the first entry** (no Top): one state, at Bottom's depth — the
  first child of the root.
- **Below the last entry** (no Bottom): every state from the shallowest
  level, the root's own children, up to Top's depth + 1. If the last entry
  is nested, that includes a sibling placement after each of its
  ancestors.
- **An empty hierarchy** (no Top, no Bottom): one state — the root's sole
  child. Each surface's page says whether and when it arises.
- **Offsets past either end clamp** to the nearest valid state. No offset
  produces "no state."

## 3. The root

**The range is floored at the hierarchy's root**, so the shallowest level
anywhere is the root's own children. Each surface's page names its root
([`../board-drag-interaction/`](../board-drag-interaction/) §7.1,
[`../project-tree/`](../project-tree/) §1).

## 4. The dragged entry carries its whole subtree

**The entry and its descendants are removed from the Top/Bottom
candidates before any gap is computed**, so no tab state can make an
entry a child of its own descendant — a cycle is structurally
unreachable, not merely disallowed.

## 5. A set-down in its own gap writes nothing

**An entry set back down in its own gap, at its own depth, writes
nothing.** That gap and depth resolve to the slot it was picked up from.
With full context nothing between Top and Bottom is unseen, so the
release can't move the entry, and there is nothing to save.

## 6. The depth cap

**Each feature caps how deep its hierarchy may go, at a value of its
own:** items at the item cap
([`../item-attachment/`](../item-attachment/) §8), and projects at the
project cap ([`../project-tree/`](../project-tree/) §3). Each is set on
its own, so changing one never changes the other. The rules below hold
whatever the number, with `CAP` the feature's own cap.

**A target at depth `D` is a legal parent only if:**

```
D + 1 + H <= CAP
```

with the hierarchy's top level at depth 1, and `H` the moving entry's
subtree height: the levels *below* it (a leaf has height 0).

**The moving entry brings its whole subtree with it,** so the cap is
checked against the deepest descendant that would result, not against
the moving entry alone. A write is refused when any carried descendant
would end past the cap. Each feature's page says what its subtree holds.

**The formula is the whole rule.** It evaluates the *resulting* depth
and nothing else: not the direction of the move, not the entry's
current depth. A subtree that's already taller than the cap therefore
fails the check for every target, the top level included; it can be
moved only by dismantling it. This is deliberate: over-cap data can only
arise from a later change to `CAP`, or from data the UI and the API
never produced, and a direction-aware exception would cost the UI and
the API a second clause each to stay in agreement.

**The cap gates writes, and never invalidates existing data.** A tree
that's already deeper than the cap, made before the cap existed or left
over it by a lowered `CAP`, stays valid, readable, and operable in every
way that doesn't reparent it. It isn't hidden, flagged or repaired.

**A feature's UI and its API always enforce the same `CAP`:** one value,
so changing it changes it everywhere that feature's entries are placed.

**The cap is a display constraint, not a data constraint.** It exists
because an indented hierarchy has to stay legible, not because deeper
trees are wrong. Each feature's page grounds its value.

**In a drag, validity is per tab state, never per gap.** The range
doesn't depend on the cap (§1, §2), so a state that would put the
subtree past the cap is still offered. It's marked invalid, and a
release in it writes nothing. Sibling states in the same gap that fit
stay valid. How a surface marks the state is its own.

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

None open.
