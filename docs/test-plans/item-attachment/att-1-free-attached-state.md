# ATT-1 — Free / Attached state model

**Next ID:** ATT-1.15

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-1.1 | A top-level item is always Free | P1 | Automated |
| ATT-1.2 | A detached child is Free, exactly as Free as a top-level item | P0 | Automated |
| ATT-1.3 | An Attached child inherits its parent's workphase, and the cascade reaches every attached descendant | P0 | Automated |
| ATT-1.4 | An Attached child never receives `completedAt` and keeps its position under a terminal inheritance | P0 | Automated |
| ATT-1.5 | A Stub under a done parent reads as done by derivation, with nothing stored | P1 | Automated |
| ATT-1.6 | A detached child is not affected by its parent moving | P0 | Automated |
| ATT-1.7 | The three state consequences always move together | P0 | Automated |
| ATT-1.8 | A move or an edit that would leave the attachment flag on a parentless item is refused | P0 | Open |
| ATT-1.9 | A Card shows its descendant Stubs; a Stub shows a title snippet and has no board position of its own | P2 | Automated |
| ATT-1.10 | A Card shows its tags | P2 | Planned |
| ATT-1.12 | Attaching a done Free item clears its `completedAt` and gives it a sibling position | P1 | Automated |
| ATT-1.14 | A create can't set the attachment flag without a parent, and a parentless create stores it clear | P0 | Planned |

---

## ATT-1.1 — A top-level item is always Free

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §1

*Given* an item with no item-parent (`parentId` empty), *when* its state is read, *then* it is Free in every consequence: its own workphase governs it, its position compares against the whole workflow (`positionScope = "workflow"`), and it renders as a Card. Free isn't a state it can leave while it has no parent.

**Automation test:** `server/tests/routes/items.test.ts`, `tests/ui/attached-children.spec.ts`

## ATT-1.2 — A detached child is Free, exactly as Free as a top-level item

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §1

*Given* a child item whose `parentId` names a parent and whose attachment flag is clear, *when* its state is read, *then* it behaves exactly as a top-level item does: its own workphase governs it, its position compares against the whole workflow (`positionScope = "workflow"`), and it renders as a Card on the board, not as a Stub inside its parent. Only its place in the hierarchy differs.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`, `tests/ui/attached-children.spec.ts`

## ATT-1.3 — An Attached child inherits its parent's workphase, and the cascade reaches every attached descendant

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §2

*Given* `P` with attached child `C1`, `C1` with attached child `C2`, and `C1` also with a detached child `D`, *when* `P`'s workphase changes, *then* `C1` and `C2` take the new workphase, at every depth, and `D` doesn't ([ATT-1.6](att-1-free-attached-state.md)). An attached child's effective workphase is always its parent's.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-1.4 — An Attached child never receives `completedAt` and keeps its position under a terminal inheritance

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §2

*Given* an attached child with a sibling-scoped position, *when* its parent moves to a terminal workphase and the cascade applies, *then* the child's `completedAt` stays `null`, its `position` is unchanged, and its `positionScope` stays `"attached-siblings"`. The position half is also item-positioning's ([TC-6.5](../item-positioning/part-6-active-done-split.md), [TC-6.6](../item-positioning/part-6-active-done-split.md)).

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-1.5 — A Stub under a done parent reads as done by derivation, with nothing stored

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §2

*Given* an attached child whose parent is in a terminal workphase, *when* the child is read, *then* its effective workphase is terminal, so it reads as done, purely because of the workphase it inherited: no `completedAt`, no flag, nothing else is written on the child. *And when* the parent is later reopened (moved to a non-terminal workphase), *then* the child reads as not done again. Neither change writes anything on the child that records whether it's done: `completedAt` is null throughout, and its position is unchanged. The only field either change sets is the cascaded `workphaseId`, along with the modification timestamp any write updates.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-1.6 — A detached child is not affected by its parent moving

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §2

*Given* a detached child `D` of `P` with its own workphase `W_D`, position `p_D`, and `completedAt` (null or set), *when* `P` moves to a different workphase, including a terminal one and back out of a terminal one, *then* `D`'s `workphaseId`, `position` and `completedAt` are all exactly unchanged.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-1.7 — The three state consequences always move together

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §1

*Given* a Free item, *when* it becomes Attached (it acquires a parent with the attachment flag set), *then* in the same change its effective workphase becomes its parent's, its `positionScope` becomes `"attached-siblings"` with a fresh sibling-scoped position ([TC-2.20](../item-positioning/part-2-anchor-resolution.md)), and it renders as a Stub inside the Card of its nearest Free ancestor, not as a Card.

*And given* an Attached item, *when* it becomes Free (a detach), *then* in the same change it takes its own workphase, the one it holds at that moment ([ATT-7.3](att-7-detach-preserves-parent.md)), its `positionScope` becomes `"workflow"` with a fresh workflow-scoped position ([TC-2.19](../item-positioning/part-2-anchor-resolution.md)), and it renders as a Card.

No read shows one consequence flipped and another not.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`, `tests/ui/attached-children.spec.ts`

## ATT-1.8 — A move or an edit that would leave the attachment flag on a parentless item is refused

**Priority:** P0 · **Status:** Open · **Rule:** wiki item-attachment §1

*Given* top-level item `X`, and item `Y` attached to `P`, *when* a move or an edit sets `X`'s attachment flag without giving it a parent, or sets `Y.parentId` to null and sets the flag, *then* each is refused with a 400, and nothing is stored: `X` and `Y` are exactly as before. *When* a write sets `Y.parentId` to null and doesn't mention the flag, *then* it's accepted, and `Y`'s flag is clear ([ATT-7.7](att-7-detach-preserves-parent.md)). A create is [ATT-1.14](att-1-free-attached-state.md)'s.

**Automation test:** —

## ATT-1.9 — A Card shows its descendant Stubs; a Stub shows a title snippet and has no board position of its own

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §12

*Given* Free item `P` with attached descendants `S1` and `S1a` (a child of `S1`), *when* the board renders, *then* `P` is a Card showing its title, a snippet of its description, and a collapsible list of its descendant Stubs, `S1` and `S1a` among them. Its tags are [ATT-1.10](att-1-free-attached-state.md)'s. Each Stub shows a snippet of its title, enough to identify it, and neither `S1` nor `S1a` appears anywhere on the board outside `P`'s Card.

**Automation test:** `tests/ui/attached-children.spec.ts`

## ATT-1.10 — A Card shows its tags

**Priority:** P2 · **Status:** Planned · **Rule:** wiki item-attachment §12

*Given* Free item `P` with tags, *when* the board renders, *then* `P`'s Card shows each of its tags.

**Automation test:** —

## ATT-1.12 — Attaching a done Free item clears its `completedAt` and gives it a sibling position

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §2, wiki item-attachment §1

*Given* Free item `X` in a terminal workphase (`completedAt` set, `position` null), and item `P` in a non-terminal workphase, *when* `X` is attached to `P`, *then* `X` is attached, with `P`'s workphase, `completedAt` null, and a position among `P`'s attached children (`positionScope = "attached-siblings"`). *And given* `P` is in a terminal workphase too, *then* `X` takes `P`'s terminal workphase, and its `completedAt` is still cleared: an attached child never holds one.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-1.14 — A create can't set the attachment flag without a parent, and a parentless create stores it clear

**Priority:** P0 · **Status:** Planned · **Rule:** wiki item-attachment §1

*Given* project `P1`, *when* a create makes a top-level item in `P1` and sets the attachment flag, *then* it's refused with a 400, and no item is created. *When* a create makes a top-level item in `P1` and doesn't mention the flag, *then* the new item's flag is clear, as every top-level item's is.

**Automation test:** —
