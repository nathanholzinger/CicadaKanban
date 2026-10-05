# ATT-3 — Reparent placement and atomic commit

**Next ID:** ATT-3.12

What a placement looks like (an anchor and a side, first and last, the append fallback) and which number it resolves to are item-positioning's ([part 7](../item-positioning/part-7-board-placement-intents.md)). This suite holds the attachment side: that a reparent re-resolves, reparenting a Free item, the sequencing, and the atomic commit.

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-3.1 | Reparenting an Attached item always resolves a replacement position; "keep" isn't an option | P0 | Automated |
| ATT-3.4 | A coincidentally equal resolved position is still a real re-resolution | P2 | Automated |
| ATT-3.5 | The new parent is in effect before the position is resolved | P0 | Automated |
| ATT-3.6 | One write, one commit: every field and the cascade land together | P0 | Automated |
| ATT-3.7 | On failure, nothing changed | P0 | Automated |
| ATT-3.9 | Reparenting and attaching are separate: omitting the attachment flag keeps the item's state | P0 | Automated |
| ATT-3.10 | A Free item's reparent leaves its position alone unless it carries an anchor | P1 | Automated |
| ATT-3.11 | A top-level item reparented without the attachment flag becomes a detached child | P1 | Open |

---

## ATT-3.1 — Reparenting an Attached item always resolves a replacement position; "keep" isn't an option

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §4

*Given* attached child `X` of `A` with sibling-scoped position `p`, *when* `X` is reparented to `B` and stays attached, with or without an anchor, *then* `X`'s position is freshly resolved in `B`'s attached-sibling scope: against the anchor and side if one is given, by the append fallback if not. No request form carries `p` across unchanged ([TC-2.21](../item-positioning/part-2-anchor-resolution.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`, `server/tests/routes/items.test.ts`

## ATT-3.4 — A coincidentally equal resolved position is still a real re-resolution

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §4

*Given* attached child `X` of `A` at position `1.0`, and parent `B` with no attached children, *when* `X` is reparented to `B` and the append fallback's first value comes out as `1.0`, equal to the old one, *then* the write isn't treated as a no-op: `X.parentId` is `B`, its scope is `B`'s attached siblings, and `1.0` is the new scope's first value, not the old number kept.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-3.5 — The new parent is in effect before the position is resolved

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §5

*Given* a reparent with an anchor, where the old parent's attached siblings and the new parent's have positions in ranges that don't overlap, *when* the position is resolved, *then* the scope it's resolved in is the new parent's: the resulting number lies among the new siblings, never among the old. Resolving against the old scope would give a number that looks valid but comes from the wrong list.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-3.6 — One write, one commit: every field and the cascade land together

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §6

*Given* Free Card `X` in workphase `W1` with attached child `X1`, and Card `B` in workphase `W2` with attached children, *when* one write attaches `X` to `B` at an anchored slot, *then* a single read afterward shows all of these, and no read shows only some of them: `X.parentId = B`, `X` attached, `X.workphaseId = W2` (inherited), `X.position` resolved in `B`'s attached-sibling scope, and `X1.workphaseId = W2` (cascaded). If `X` and `B` are in different projects, the new `projectId` on `X` and its subtree lands in the same commit ([ATT-5.2](att-5-cross-project-reparenting.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-3.7 — On failure, nothing changed

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §6

*Given* the fixture of [ATT-3.6](att-3-reparent-placement-atomicity.md), *when* the write is rejected, for example because `B` fails the depth cap ([ATT-4.4](att-4-legal-parent-depth-cap.md)) or the anchor is outside the resulting scope ([TC-7.10](../item-positioning/part-7-board-placement-intents.md)), *then* `X` and every descendant are exactly as before: the same `parentId`, attachment flag, `workphaseId`, `position`, `projectId` and `completedAt`. No state exists in which `X` was reparented but still holds a position from its old sibling list, or moved while `X1` stayed in `W1`. What the board does with a rejection is [DRAG-6.6](../board-drag-interaction/drag-6-preview-reconciliation.md)'s.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-3.9 — Reparenting and attaching are separate: omitting the attachment flag keeps the item's state

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §4, wiki item-attachment §2

*Given* Free item `X`, a detached child of `A`, Attached item `Y` under `A`, and item `B`, *when* each is reparented to `B` by a write that carries `parentId` and no attachment flag, *then*:

- `X.parentId = B`, and `X` is still Free: it keeps its own workphase, stays in the workflow-wide position scope, and renders as a Card;
- `Y.parentId = B`, and `Y` is still Attached: it inherits `B`'s workphase and is positioned among `B`'s attached siblings ([ATT-3.1](att-3-reparent-placement-atomicity.md)).

*And when* the write carries the flag as well, *then* every combination is accepted: Free to Free, Free to Attached, Attached to Free, and Attached to Attached, each landing in the state the flag names. A top-level item is [ATT-3.11](att-3-reparent-placement-atomicity.md)'s.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`, `tests/ui/attached-children.spec.ts`

## ATT-3.10 — A Free item's reparent leaves its position alone unless it carries an anchor

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §4

*Given* Free item `X` at workflow-scoped position `p`, *when* `X` is reparented to `B` and stays Free, with no anchor, *then* `X.position` is still `p`: its scope is workflow-wide and didn't change. *When* the same write carries an anchor and side instead, *then* `X` is repositioned against that anchor in the workflow-wide scope, as any Free item is.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-3.11 — A top-level item reparented without the attachment flag becomes a detached child

**Priority:** P1 · **Status:** Open · **Rule:** wiki item-attachment §4

*Given* top-level item `X` in workphase `W1` at workflow position `p`, and item `B` in workphase `W2` of the same workflow, *when* a write gives `X` parent `B` and doesn't mention the attachment flag, whether it edits `X` or moves it, *then* `X` is a detached child of `B`: its flag is clear, and it's still Free, in `W1`, at position `p`. No reparent attaches by default.

**Automation test:** —
