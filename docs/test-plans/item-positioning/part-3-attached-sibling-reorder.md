# TC-3 — Attached-sibling reorder

**Next ID:** TC-3.6

| ID | Case | Priority | Status |
|---|---|---|---|
| TC-3.1 | A reorder among attached siblings persists | P0 | Automated |
| TC-3.2 | A reorder among one parent's children touches nothing outside that scope | P0 | Automated |
| TC-3.4 | A new attached child is placed after its own parent's last child | P0 | Automated |
| TC-3.5 | Attached siblings resolve by the same anchor and side rules | P1 | Automated |

---

## TC-3.1 — A reorder among attached siblings persists

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §3

*Given* parent `P` with attached children `A`, `B` and `C`, in that order, *when* `C` is moved before `A`, *then* reading `P`'s children back gives `C`, `A`, `B`.

**Automation test:** `tests/api/itemRepositioningAttachedSiblings.spec.ts`

## TC-3.2 — A reorder among one parent's children touches nothing outside that scope

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §3, wiki item-positioning §2

*Given* a workphase holding Free items, `P`'s attached children and `Q`'s attached children, *when* `P`'s children are reordered, *then* `Q`'s children and the Free items keep their positions exactly.

**Automation test:** `tests/api/itemRepositioningAttachedSiblings.spec.ts`

## TC-3.4 — A new attached child is placed after its own parent's last child

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §3

*Given* parent `P` whose attached children's true last is at `2.0`, in a workphase that also holds Free items and `Q`'s attached children at higher positions, *when* an attached child is created under `P` with no anchor, *then* its position is `3`: after `P`'s last child, whatever is last in the workphase. *And given* `P` has no attached children, *then* it's `1.0`.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-3.5 — Attached siblings resolve by the same anchor and side rules

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §3, wiki positioning §3

*Given* `P`'s attached children `A` (`1.0`), `B` (`2.0`) and `C` (`3.0`), each of these from that starting state:

- *when* `C` is placed before `A`, *then* its position is `0.5` ([TC-2.5](part-2-anchor-resolution.md));
- *when* `C` is placed after `A`, *then* it's `1.5` ([TC-2.1](part-2-anchor-resolution.md));
- *when* `A` is placed after `C`, *then* it's `4` ([TC-2.4](part-2-anchor-resolution.md)).

**Automation test:** `tests/api/itemRepositioningAttachedSiblings.spec.ts`
