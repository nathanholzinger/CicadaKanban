# DRAG-7 — Depth overflow and the hierarchy modal

**Next ID:** DRAG-7.31

**Terms.** `L` is the number of levels a Card's section shows, a tuning-panel value. A row's *level* is its depth below Card `P`: `P`'s children are at level 1, so the section shows levels 1 to `L`, and an overflow row sits at the level of the children it stands for. *The tree* is `P`'s hierarchy, with `P` top-level, `L` at least 2, and `CAP` deep enough for every state a case names, unless a case says otherwise:
- `A`, at level 1, heads a chain of attached Stubs, one per level, down to `Q`, at level `L − 1`. When `L` is 2, `Q` is `A`.
- `Q` has two attached children at level `L`: `R`, then `T`.
- `R` has attached children `R1`, then `R2`, at level `L + 1`, and `R1` has an attached child, `R1a`, at level `L + 2`. `R` also has a Free child, `F`.
- `T` has no attached children, and one Free child, `G`.
- `B`, at level 1, comes after `A`'s subtree, with no children.

So the section's rows are `A` … `Q`, `R`, `R`'s overflow row, `T` and `B`, and the modal's are `A` … `Q`, `R`, `R1`, `R1a`, `R2`, `T` and `B`. Where a case drags `X`, it's an item with no children at `P`'s Descendants layer: a Free Card from elsewhere on the board, zoomed into `P` and on into its section ([DRAG-1.21](drag-1-contexts-and-popping.md)), or a Stub of `P`'s outside the tree, picked up in the section ([DRAG-5.9](drag-5-detach-and-overflow.md)). Placement at the layer is the same for both, so a case holds for either, unless it names one. *The modal hold* is the hold that opens the modal during a drag: a dwell, then a cue, each a tuning-panel value. Placement by gap and depth is [DRAG-4](drag-4-attach-and-stub-placement.md)'s; cases here assert what the overflow row and the modal add to it.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-7.1 | A Card's section shows `L` levels below the Card, and an overflow row stands for a row's hidden children | P1 | Automated |
| DRAG-7.2 | An overflow row counts its row's attached children, not their descendants or Free children, and leaves out one being dragged | P1 | Automated |
| DRAG-7.3 | Between a row and its overflow row, the one state is the row's first child | P0 | Automated |
| DRAG-7.4 | Below an overflow row, the states run from Bottom's depth to the hidden children's level, and none lies right of it | P0 | Automated |
| DRAG-7.5 | Below a last-level row with no attached children, one tab right makes the item its only attached child | P1 | Automated |
| DRAG-7.6 | Back in the section, a Stub whose own slot is hidden starts as the Card's last child | P1 | Automated |
| DRAG-7.7 | Clicking an overflow row opens the hierarchy modal, centered, with the Card's attached descendants at every level | P1 | Automated |
| DRAG-7.8 | With no drag running, the modal closes by its X, a click outside it, or Escape, and nothing is written | P1 | Automated |
| DRAG-7.9 | A drag in the modal starts at the Card's Descendants layer and places by gap and depth at any level | P0 | Automated |
| DRAG-7.10 | Leaving the modal is the pop out of Descendants: the modal closes, and detaching still takes two pops | P1 | Open |
| DRAG-7.11 | While the modal is open, the Card and its section under the backdrop take no part in the drag | P1 | Automated |
| DRAG-7.12 | The modal's rows carry the drag's classification, as the section's do | P2 | Automated |
| DRAG-7.13 | A hold beside an overflow row is a silent dwell, then a cue on the row, ending in the modal opening | P1 | Open |
| DRAG-7.14 | The modal hold resets when the ghost changes gap or level or the cursor leaves the section, not while the carried copy moves within the gap | P1 | Automated |
| DRAG-7.15 | A hold opens the modal with the ghost's spot under the cursor, so a release right after commits the same placement | P1 | Open |
| DRAG-7.16 | A modal kept inside the window at an edge reads the ghost afresh from the cursor | P1 | Open |
| DRAG-7.17 | When the row's children run longer than the modal, its list scrolls to put the ghost's spot under the cursor | P2 | Automated |
| DRAG-7.18 | After leaving the modal, a hold beside an overflow row opens it again in the same drag | P2 | Automated |
| DRAG-7.19 | After a drag ends in the modal, by a release or a cancel, the modal stays open where it is | P1 | Automated |
| DRAG-7.20 | The modal hold feels deliberate, and the ghost doesn't jump as the modal opens | P2 | Manual |
| DRAG-7.21 | An over-cap state beside an overflow row doesn't start the modal hold | P2 | Automated |
| DRAG-7.22 | A press on an overflow row's count starts no drag, and a click on it opens the modal, not the Card's Sheet | P2 | Automated |
| DRAG-7.23 | A board reload leaves an open modal open while its Card still has attached descendants | P2 | Automated |
| DRAG-7.24 | A press on an overflow row's indent is the Card's | P2 | Automated |
| DRAG-7.25 | After a reload, a modal a hold opened is centered | P2 | Open |
| DRAG-7.26 | The modal closes when its Card is gone or has no attached descendants left | P2 | Open |
| DRAG-7.27 | A dragged row carries its overflow row, which is never a neighbor | P2 | Open |
| DRAG-7.28 | A click on a row in the modal opens nothing | P2 | Automated |
| DRAG-7.29 | The side highlight can name an overflow row, and a release still places by gap and depth | P2 | Open |
| DRAG-7.30 | A section shows at least one level | P2 | Automated |

---

## DRAG-7.1 — A Card's section shows `L` levels below the Card, and an overflow row stands for a row's hidden children

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §9, wiki item-attachment §12

*Given* the tree, *when* the board renders, *then* `P`'s section shows `A` … `Q`, `R`, an overflow row one level under `R`, at level `L + 1`, then `T` and `B`, each at its level. `R1`, `R2` and `R1a` aren't in the section: they're the modal's ([DRAG-7.7](drag-7-overflow-and-hierarchy-modal.md)). Every row above level `L` shows its attached children, so only a row at level `L` can have an overflow row. *Given* instead `P` is a detached child at depth `d` in the workflow, *then* the section shows the same rows, at depths `d + 1` to `d + L`: the levels count from the Card, not from the top of the tree. *When* `L` is raised by one in the tuning panel, *then* `R1` and `R2` show at the new last level, `R1` with an overflow row under it for `R1a`, and `R` has none.

**Automation test:** `tests/ui/drag-7-overflow-row.spec.ts`

## DRAG-7.2 — An overflow row counts its row's attached children, not their descendants or Free children, and leaves out one being dragged

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §9

*Given* the tree, *then* `R`'s overflow row reads "2 children", for `R1` and `R2`. It doesn't count `R1a`, a grandchild: the overflow row sits at `R`'s children's level and stands for them. Nor does it count `F`, `R`'s Free child, which shows on the board as a Card of its own. `T`, whose only child `G` is Free, has no overflow row. *Given* instead `R`'s only attached child is `R1`, *then* it reads "1 child".

*When* an item is dropped beside `R`'s overflow row, as `R`'s first or last child ([DRAG-7.3](drag-7-overflow-and-hierarchy-modal.md), [DRAG-7.4](drag-7-overflow-and-hierarchy-modal.md)), *then* from the release on it reads "3 children". *When* `R1` is dragged in the section ([DRAG-7.6](drag-7-overflow-and-hierarchy-modal.md)), *then* while it's dragged the overflow row reads "1 child", leaving `R1` out, since the ghost shows it. *And given* `R1` is `R`'s only attached child, *then* `R` has no overflow row while `R1` is dragged.

**Automation test:** `tests/ui/drag-7-overflow-row.spec.ts`, `tests/ui/drag-7-hierarchy-modal.spec.ts`

## DRAG-7.3 — Between a row and its overflow row, the one state is the row's first child

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.1, wiki hierarchy-placement §1

*Given* the tree, *when* the ghost of `X` is in the gap between `R` and `R`'s overflow row, *then* the overflow row slides aside below the ghost, as any row does, and exactly one state is offered, at level `L + 1`: `R`'s first child. A release there commits `X.parentId = R`, attached, first among `R`'s attached children, before `R1`. From the release on, the section doesn't show `X`, which is at a hidden level, and the overflow row reads "3 children" ([DRAG-7.2](drag-7-overflow-and-hierarchy-modal.md)). This is the gap under any row whose child is below it ([DRAG-4.8](drag-4-attach-and-stub-placement.md)), with the overflow row standing for `R`'s children.

**Automation test:** `tests/ui/drag-7-overflow-row.spec.ts`

## DRAG-7.4 — Below an overflow row, the states run from Bottom's depth to the hidden children's level, and none lies right of it

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.1, wiki hierarchy-placement §1, wiki hierarchy-placement §2

*Given* the tree, with the ghost of `X` in the gap between `R`'s overflow row (Top) and `T` (Bottom), *then* exactly two states are offered:
- level `L + 1`, aligned with the overflow row: `R`'s last child. A release commits `X.parentId = R`, attached, last among `R`'s attached children, after `R2`, and the overflow row then reads "3 children";
- level `L`, aligned with `R`: `R`'s next sibling, after `R`'s whole subtree, its hidden levels included. A release commits `X.parentId = Q`, attached, between `R` and `T`.

No state lies right of the overflow row: an offset past level `L + 1` clamps to it, so no release here makes `X` a child of `R2`, or places it anywhere else inside `R`'s hidden subtree. *Given* instead `T` isn't there, so `B` is Bottom, *then* the states run from level 1 to level `L + 1`, the shallower ones walking `R`'s ancestors as in any gap ([DRAG-4.10](drag-4-attach-and-stub-placement.md)). No gap in the section places `X` between `R1` and `R2`: that's the modal's ([DRAG-7.9](drag-7-overflow-and-hierarchy-modal.md)).

**Automation test:** `tests/ui/drag-7-overflow-row.spec.ts`

## DRAG-7.5 — Below a last-level row with no attached children, one tab right makes the item its only attached child

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.1, wiki board-drag-interaction §9

*Given* the tree, with the ghost of `X` in the gap between `T` (Top, level `L`) and `B` (Bottom, level 1), *when* `X` is tabbed once right of `T`, to level `L + 1`, *then* that state is offered, and a release commits `X.parentId = T`, attached, `T`'s only attached child, one level deeper than the section shows. `G` is unchanged, still `T`'s Free child. From the release on, the section doesn't show `X`, and an overflow row under `T` reads "1 child". The gap offers every level from 1 to `L + 1`, and `L + 1` is its deepest ([DRAG-4.8](drag-4-attach-and-stub-placement.md)).

**Automation test:** `tests/ui/drag-7-overflow-row.spec.ts`

## DRAG-7.6 — Back in the section, a Stub whose own slot is hidden starts as the Card's last child

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7, wiki board-drag-interaction §7.3

*Given* the tree, with the modal open by a click ([DRAG-7.7](drag-7-overflow-and-hierarchy-modal.md)), *when* `R1` is picked up in the modal and pulled out of it, so the modal closes and the drag is at `P`'s Card layer ([DRAG-7.10](drag-7-overflow-and-hierarchy-modal.md)), and the drag then zooms back into `P`'s section and the cursor hasn't moved since, *then* the ghost is in the last gap, below `B`, at level 1, as `P`'s last child. `R1`'s own slot, under `R`, is behind `R`'s overflow row, which reads "1 child" meanwhile ([DRAG-7.2](drag-7-overflow-and-hierarchy-modal.md)). A release then commits `R1.parentId = P`, attached, last among `P`'s attached children, after `B`, with `R1a` still its child. Released at `P`'s Card layer instead, before zooming back in, `R1` is set back down, and nothing is written ([DRAG-5.12](drag-5-detach-and-overflow.md)).

*Given* instead `R`, whose slot the section shows, is picked up in the modal and pulled out the same way, *then* back in the section its ghost starts in its own slot, between `Q` and `T`, at level `L`, and a release there writes nothing ([DRAG-4.30](drag-4-attach-and-stub-placement.md), [DRAG-4.29](drag-4-attach-and-stub-placement.md)).

**Automation test:** `tests/ui/drag-7-hierarchy-modal.spec.ts`

## DRAG-7.7 — Clicking an overflow row opens the hierarchy modal, centered, with the Card's attached descendants at every level

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §9, wiki item-attachment §12

*Given* the tree, with no drag running, *when* `R`'s overflow row is clicked, *then* the hierarchy modal opens, centered in the window, with `P` at its root. It lists `P`'s attached descendants at every level, each at its level, in the order the section draws them: `A` … `Q`, `R`, `R1`, `R1a`, `R2`, `T`, `B`. It has no overflow rows. `F` and `G` aren't in it: they're Free, and show on the board as Cards of their own. Nothing is written. *Given* `P`'s section has more than one overflow row, *then* clicking any of them opens the same modal, `P`'s whole hierarchy. The modal's size, and how it shows `P` at its root, are open, and aren't asserted.

**Automation test:** `tests/ui/drag-7-hierarchy-modal.spec.ts`

## DRAG-7.8 — With no drag running, the modal closes by its X, a click outside it, or Escape, and nothing is written

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §9

*Given* the modal open by a click, with no drag running, *when* its X button is clicked, *when* a click lands anywhere outside it, or *when* Escape is pressed, *then* each closes the modal, and nothing is written: the board is as it was before the modal opened, `P`'s section and its overflow row included. During a drag, Escape cancels the drag instead, and the modal stays open ([DRAG-7.19](drag-7-overflow-and-hierarchy-modal.md)).

**Automation test:** `tests/ui/drag-7-hierarchy-modal.spec.ts`

## DRAG-7.9 — A drag in the modal starts at the Card's Descendants layer and places by gap and depth at any level

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.3, wiki board-drag-interaction §7.1, wiki board-drag-interaction §7.2, wiki hierarchy-placement §1, wiki hierarchy-placement §5

*Given* the tree, with the modal open by a click, *when* `R2` is picked up from its row in the modal, *then* its drag starts at `P`'s Descendants layer, with no pop, as any Stub's does ([DRAG-5.9](drag-5-detach-and-overflow.md)). *When* it's released:
- in the gap between `R1` and `R1a` → one state, `R1`'s first child: `R2.parentId = R1`, attached, before `R1a`;
- in the gap between `R1a` and `T`, with `R2` itself passed over, aligned with `R1a` at level `L + 2` → `R2.parentId = R1`, attached, after `R1a`;
- in that gap at level `L + 1`, its own gap and depth → nothing is written ([DRAG-4.29](drag-4-attach-and-stub-placement.md)): the modal shows every level, so nothing between Top and Bottom is unseen;
- in a tab state whose resulting depth exceeds `CAP` → marked invalid, and a release writes nothing ([DRAG-4.18](drag-4-attach-and-stub-placement.md));

*then* `R2` stays attached throughout, with `P`'s workphase. The modal offers every placement the section does, and those among hidden rows that the section doesn't ([DRAG-7.4](drag-7-overflow-and-hierarchy-modal.md)).

**Automation test:** `tests/ui/drag-7-hierarchy-modal.spec.ts`

## DRAG-7.10 — Leaving the modal is the pop out of Descendants: the modal closes, and detaching still takes two pops

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.3, wiki board-drag-interaction §8

*Given* a drag in the modal, opened by a click or by a hold, *when* the cursor stays outside the modal's box for `popDelayMs`, or is `popDistancePx` outside it when that's above 0, *then* the modal closes, and the drag is at `P`'s Card layer, bounded by `P`'s box. A release there is the Card layer's auto-drop: `P`'s own Stub is set back down, and nothing is written ([DRAG-5.12](drag-5-detach-and-overflow.md)); an item from outside `P` attaches as `P`'s last child ([DRAG-4.1](drag-4-attach-and-stub-placement.md)). *When* the cursor then stays outside `P`'s box for `popDelayMs`, *then* the item pops out to `P`'s column, Free, and a release there commits the detach ([DRAG-5.1](drag-5-detach-and-overflow.md)): two pops, as from the section. *When* the cursor instead leaves the modal's box for less than `popDelayMs` and comes back, *then* the modal stays open, and the drag stays in it ([DRAG-5.5](drag-5-detach-and-overflow.md)). The modal's box includes its header: *when* the cursor rests over the header for well past `popDelayMs`, *then* no pop happens, and the modal stays open.

**Automation test:** —

## DRAG-7.11 — While the modal is open, the Card and its section under the backdrop take no part in the drag

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.3

*Given* a drag in the modal, *when* the cursor rests over `P`'s Card or its section, outside the modal's box, behind the backdrop, *then* none of the section's rows is Top or Bottom: the ghost doesn't move to a gap in the section, the carried copy stays inside the modal's list, and the pop-out clock runs as it does anywhere outside the modal's box ([DRAG-7.10](drag-7-overflow-and-hierarchy-modal.md)). While the modal is open, only its rows place the item.

**Automation test:** `tests/ui/drag-7-hierarchy-modal.spec.ts`

## DRAG-7.12 — The modal's rows carry the drag's classification, as the section's do

**Priority:** P2 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.3, wiki board-drag-interaction §4

*Given* a drag of `X`, with subtree height `H`, where `R1a` is Depth-capped for `X` ([DRAG-2.3](drag-2-target-classification.md)) and `R` isn't, *when* the modal opens during the drag, *then* `R1a`'s row in it is de-emphasized by `overlayDepthCappedOpacity`, as a Depth-capped Stub in the section is ([DRAG-2.6](drag-2-target-classification.md)), and `R`'s row isn't. Opening the modal changes no classification: it's the drag's, computed once at its start ([DRAG-2.4](drag-2-target-classification.md)).

**Automation test:** `tests/ui/drag-7-modal-hold.spec.ts`, `tests/ui/drag-7-hierarchy-modal.spec.ts`

## DRAG-7.13 — A hold beside an overflow row is a silent dwell, then a cue on the row, ending in the modal opening

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.3, wiki board-drag-interaction §9

*Given* the tree, with the ghost of `X`, a Free Card zoomed in from outside `P`, in the gap between `R` and `R`'s overflow row, as `R`'s first child ([DRAG-7.3](drag-7-overflow-and-hierarchy-modal.md)), held there:
- *during* the modal hold's dwell, *then* nothing new is shown;
- *then* a visible cue shows on `R`'s overflow row, for the cue's length;
- *when* the cue completes, *then* the hierarchy modal opens, with the drag at `P`'s Descendants layer in it ([DRAG-7.15](drag-7-overflow-and-hierarchy-modal.md)).

*When* the user releases before the cue completes, *then* the modal doesn't open, and the release commits `X` as `R`'s first child. The same holds below the overflow row, with the ghost at level `L + 1`, as `R`'s last child ([DRAG-7.4](drag-7-overflow-and-hierarchy-modal.md)). Any item at the Descendants layer can open the modal: *given* instead a drag of `B`, `P`'s own Stub, picked up in the section, *then* the same hold opens it. The cue's look is open; this case asserts only that it's there.

**Automation test:** —

## DRAG-7.14 — The modal hold resets when the ghost changes gap or level or the cursor leaves the section, not while the carried copy moves within the gap

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.3

*Given* the modal hold running beside `R`'s overflow row:
- *when* the ghost moves to another gap, such as the one below `T`, *then* the hold resets: any cue showing disappears at once, and the modal doesn't open;
- *when* the ghost, in the gap below the overflow row, is tabbed from level `L + 1` to level `L`, *then* the hold resets the same way, and tabbing back starts a fresh dwell;
- *when* the cursor leaves the section's box while the ghost stays in its gap, *then* the hold resets the same way, and no dwell runs until the cursor is back inside it;
- *when* the carried copy moves within the gap without the ghost changing gap or level, such as crossing the ghost's middle, *then* the hold runs on. It holds the gap and the level steady, where a Card's zoom-in resets when the named relation changes ([DRAG-4.22](drag-4-attach-and-stub-placement.md)).

This case asserts the clock's logic, with its thresholds as parameters; its pass never depends on the tuned values. Whether they feel right is [DRAG-7.20](drag-7-overflow-and-hierarchy-modal.md).

**Automation test:** `tests/ui/drag-7-modal-hold.spec.ts`, `client/src/components/workflow/popSession.test.ts`

## DRAG-7.15 — A hold opens the modal with the ghost's spot under the cursor, so a release right after commits the same placement

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.3

*Given* the modal hold beside `R`'s overflow row completes with the cursor still, where a modal placed under the cursor fits inside the window, *then* the modal opens with the ghost's spot under the cursor: from the gap above the overflow row, the gap before `R1`, at `R1`'s level; from the gap below it, the gap after `R2`, at `R2`'s level. The ghost is there, and it's the gap and the depth the cursor reads over the modal's rows. A release without moving the cursor commits what it would have before the modal opened: `X` first among `R`'s attached children, before `R1`, or last, after `R2` ([DRAG-7.3](drag-7-overflow-and-hierarchy-modal.md), [DRAG-7.4](drag-7-overflow-and-hierarchy-modal.md)). No pop happened: the drag is still at `P`'s Descendants layer.

The same holds whichever way the cursor came to the gap: moving down to it, from the rows above, or moving up to it, from those below. *And given* the item held carries a subtree, such as a Stub of `P`'s with an attached child of its own, *then* the same holds: the modal opens with the item's spot under the cursor, and a release right after commits the item there, its child still under it.

**Automation test:** —

## DRAG-7.16 — A modal kept inside the window at an edge reads the ghost afresh from the cursor

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.3

*Given* `R`'s overflow row near an edge of the window, top, bottom, left or right, so that a modal placed with the ghost's spot under the cursor ([DRAG-7.15](drag-7-overflow-and-hierarchy-modal.md)) would cross that edge, *when* the modal hold completes, *then* the modal lies wholly inside the window, the cursor lies inside the modal's box, and the ghost is at the gap and the depth the cursor reads over the modal's rows, which needn't be `R`'s first or last child. A release without moving the cursor commits that placement. Opening the modal reads the ghost afresh from the cursor, where a zoom into the section doesn't move it ([DRAG-4.30](drag-4-attach-and-stub-placement.md)).

**Automation test:** —

## DRAG-7.17 — When the row's children run longer than the modal, its list scrolls to put the ghost's spot under the cursor

**Priority:** P2 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.3

*Given* `R` with more attached children than the modal can show at once, *when* the modal hold completes from either gap beside `R`'s overflow row, *then* the modal's list is scrolled so that the ghost's spot ([DRAG-7.15](drag-7-overflow-and-hierarchy-modal.md)) sits under the cursor, and a release without moving the cursor commits it: `X` first, or last, among `R`'s attached children.

**Automation test:** `tests/ui/drag-7-modal-hold.spec.ts`

## DRAG-7.18 — After leaving the modal, a hold beside an overflow row opens it again in the same drag

**Priority:** P2 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.3

*Given* a drag that opened the modal by a hold and then left it for `P`'s Card layer ([DRAG-7.10](drag-7-overflow-and-hierarchy-modal.md)), *when* the drag zooms back into `P`'s section and holds beside an overflow row again ([DRAG-7.13](drag-7-overflow-and-hierarchy-modal.md)), *then* the modal opens again, and a release in it places `X` by gap and depth ([DRAG-7.9](drag-7-overflow-and-hierarchy-modal.md)). It opens as often as the drag needs.

**Automation test:** `tests/ui/drag-7-modal-hold.spec.ts`

## DRAG-7.19 — After a drag ends in the modal, by a release or a cancel, the modal stays open where it is

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.3, wiki board-drag-interaction §10

*Given* the modal open during a drag, *when* `X` is released in it as `R1`'s first child, *then* the modal stays open, in the same place on screen, and shows `X` there, under `R1` and before `R1a`, marked pending until the response lands, as the section would ([DRAG-6.2](drag-6-preview-reconciliation.md)). Once the response lands, `X` is unmarked, in the same place. `X` can be picked up again from its row in the modal ([DRAG-7.9](drag-7-overflow-and-hierarchy-modal.md)). *When* instead Escape is pressed during the drag, *then* the drag is cancelled, nothing is written, `X` is back where it was picked up, and the modal stays open in the same place. With no drag running, Escape then closes it ([DRAG-7.8](drag-7-overflow-and-hierarchy-modal.md)). A modal opened by a click stays open after a drag ends in it the same way, and so does one whose release writes nothing.

**Automation test:** `tests/ui/drag-7-hierarchy-modal.spec.ts`, `tests/ui/drag-7-modal-hold.spec.ts`

## DRAG-7.20 — The modal hold feels deliberate, and the ghost doesn't jump as the modal opens

**Priority:** P2 · **Status:** Manual · **Rule:** wiki board-drag-interaction §7.3

*Given* ordinary use at a natural pace, *when* a person drags an item beside an overflow row, *then* an ordinary pause there, to drop as `R`'s first or last child, doesn't open the modal, and a deliberate hold opens it without feeling sluggish. The cue's progress says how long to keep holding, and that letting go still drops where the ghost is. Away from the window's edges, the ghost stays about where it was on screen as the modal opens, with no visible jump. This is the judgment the modal hold's values are set by.

**Automation test:** none — manual: feel, whose pass depends on the tuned values of the modal hold's dwell and cue

## DRAG-7.21 — An over-cap state beside an overflow row doesn't start the modal hold

**Priority:** P2 · **Status:** Automated · **Rule:** wiki board-drag-interaction §7.3, wiki board-drag-interaction §7.2

*Given* `X` with subtree height `H`, where level `L + 1` is past `CAP` for `X`, so both states beside `R`'s overflow row are marked invalid ([DRAG-4.18](drag-4-attach-and-stub-placement.md)), *when* the ghost is held in either, the gap between `R` and its overflow row or the gap below it at level `L + 1`, for well past the modal hold's dwell and cue, *then* no dwell runs, no cue shows on the overflow row, and the modal doesn't open. A release commits nothing, as in any over-cap state. *When* the ghost, still below the overflow row, is tabbed to level `L`, where `X` fits, *then* it's a valid state, and no hold runs there either: the hold runs only at the overflow row's level ([DRAG-7.13](drag-7-overflow-and-hierarchy-modal.md)).

**Automation test:** `tests/ui/drag-7-modal-hold.spec.ts`

## DRAG-7.22 — A press on an overflow row's count starts no drag, and a click on it opens the modal, not the Card's Sheet

**Priority:** P2 · **Status:** Automated · **Rule:** wiki board-drag-interaction §9

*Given* the tree, with no drag running, *when* a press on the count of `R`'s overflow row moves well past the distance that starts a drag anywhere else, *then* no drag starts: not of `P`, and not of any item. No carried copy shows, no row moves, and nothing is written. *When* the count is clicked instead, *then* the hierarchy modal opens ([DRAG-7.7](drag-7-overflow-and-hierarchy-modal.md)), and `P`'s Sheet doesn't open. The overflow row is a control, not an item.

**Automation test:** `tests/ui/drag-7-overflow-row.spec.ts`

## DRAG-7.23 — A board reload leaves an open modal open while its Card still has attached descendants

**Priority:** P2 · **Status:** Automated · **Rule:** wiki board-drag-interaction §9, wiki board-drag-interaction §10

*Given* the modal open, *when* the board reloads from the server after a release in the modal whose write failed ([DRAG-6.6](drag-6-preview-reconciliation.md)), *then* the modal stays open, and lists `P`'s attached descendants as the reloaded board has them: the released item back where the server has it. *When* instead a reload lands mid-drag in the modal, *then* the drag stops ([DRAG-6.15](drag-6-preview-reconciliation.md)), nothing is written, and the modal stays open the same way. Where the modal sits after the reload is [DRAG-7.25](drag-7-overflow-and-hierarchy-modal.md)'s. When the reloaded board leaves `P` with nothing to show, the modal closes ([DRAG-7.26](drag-7-overflow-and-hierarchy-modal.md)).

**Automation test:** `tests/ui/drag-7-hierarchy-modal.spec.ts`

## DRAG-7.24 — A press on an overflow row's indent is the Card's

**Priority:** P2 · **Status:** Automated · **Rule:** wiki board-drag-interaction §9

*Given* the tree, with no drag running, *when* a press on the indent of `R`'s overflow row, left of its count, moves past the distance that starts a drag, *then* `P`'s drag starts, as from a press on the indent beside a Stub row, and `P` is the item carried. *When* the indent is clicked instead, *then* `P`'s Sheet opens, as a click on `P` does, and the modal doesn't open. Only the count is the overflow row's control ([DRAG-7.22](drag-7-overflow-and-hierarchy-modal.md)).

**Automation test:** `tests/ui/drag-7-overflow-row.spec.ts`

## DRAG-7.25 — After a reload, a modal a hold opened is centered

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §9

*Given* the modal opened by a hold during a drag, under the cursor and away from the window's center ([DRAG-7.15](drag-7-overflow-and-hierarchy-modal.md)), *when* the board reloads, mid-drag or after a release in the modal whose write failed, and the modal stays open ([DRAG-7.23](drag-7-overflow-and-hierarchy-modal.md)), *then* the modal is centered in the window, as one opened by a click is ([DRAG-7.7](drag-7-overflow-and-hierarchy-modal.md)). A modal opened by a click stays centered across the reload.

**Automation test:** —

## DRAG-7.26 — The modal closes when its Card is gone or has no attached descendants left

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §9

*Given* the modal open, with no drag running, *when* the board reloads and `P` has been deleted, *then* the modal closes. *When* instead the board reloads and `P` still exists but none of its descendants is attached, *then* the modal closes, and `P`'s section has no rows. *Given* the reloaded board still shows `P` with at least one attached descendant, *then* the modal stays open ([DRAG-7.23](drag-7-overflow-and-hierarchy-modal.md)).

**Automation test:** —

## DRAG-7.27 — A dragged row carries its overflow row, which is never a neighbor

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §9, wiki board-drag-interaction §7.2

*Given* the tree, *when* `R` is picked up in the section, *then* its overflow row travels with it, as `R`'s subtree does: it isn't one of the rows the ghost moves among, and while `R` is dragged the side highlight never names it. Every gap reads as though `R`'s overflow row weren't in the list: the gap after `Q` runs to `T`. *When* `R` is released as `B`'s next sibling, at level 1 ([DRAG-4.10](drag-4-attach-and-stub-placement.md)), *then* `R.parentId = P`, after `B`, with `R1` and `R2` still its attached children. At level 1, `R` is no longer at the last shown level, so its children show in the section, and `R1` has an overflow row reading "1 child" when `L` is 2.

**Automation test:** —

## DRAG-7.28 — A click on a row in the modal opens nothing

**Priority:** P2 · **Status:** Automated · **Rule:** wiki board-drag-interaction §9

*Given* the modal open, with no drag running, *when* `R1`'s row in it is clicked, *then* no Sheet opens, the modal stays open as it was, and nothing is written.

**Automation test:** `tests/ui/drag-7-hierarchy-modal.spec.ts`

## DRAG-7.29 — The side highlight can name an overflow row, and a release still places by gap and depth

**Priority:** P2 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.1, wiki board-drag-interaction §7

*Given* the tree, with the ghost of `X` in a gap beside `R`'s overflow row, *when* the side highlight names the overflow row as the ghost's neighbor, *then* it's drawn on the overflow row, as it is on any row it names. A release commits what the gap and the depth say, never `X` as a child of the overflow row: from the gap between `R` and the overflow row, `R`'s first child ([DRAG-7.3](drag-7-overflow-and-hierarchy-modal.md)); from the gap below it at level `L + 1`, `R`'s last child ([DRAG-7.4](drag-7-overflow-and-hierarchy-modal.md)).

**Automation test:** —

## DRAG-7.30 — A section shows at least one level

**Priority:** P2 · **Status:** Automated · **Rule:** wiki board-drag-interaction §9, wiki board-drag-interaction §3.1

*Given* the tree, built with `L` at 2, so `A` is `Q`, with children `R` and `T`, *when* the section's level count is then set below 1 in the tuning panel, such as to 0, *then* `P`'s section shows one level: `A` and `B`, with an overflow row under `A` reading "2 children", for `R` and `T`. A section never shows `P` with no rows while `P` has attached children.

**Automation test:** `tests/ui/drag-7-overflow-row.spec.ts`
