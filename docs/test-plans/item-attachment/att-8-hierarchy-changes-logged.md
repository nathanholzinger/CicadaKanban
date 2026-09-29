# ATT-8 — Hierarchy changes are logged

**Next ID:** ATT-8.5

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-8.1 | Every change to an item's parent or attachment records one activity entry on the moving item | P1 | Automated |
| ATT-8.2 | A write that changes neither the parent nor the attachment logs no hierarchy entry | P2 | Automated |
| ATT-8.3 | Creating an item with a parent records that parent in the new item's activity | P2 | Automated |
| ATT-8.4 | A hierarchy change that also changes the workphase logs the workphase change too | P2 | Automated |

---

## ATT-8.1 — Every change to an item's parent or attachment records one activity entry on the moving item

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §11a

*Given* item `X`, *when* each of these writes is made to `X`, both by editing `X` and by moving it:

- `X`, Free, is attached to `P`;
- `X` is detached from `P`;
- `X` is reparented from `P` to `Q`, attached or Free;
- `X` is made top-level, from under `P`;

*then* each records exactly one hierarchy entry on `X`, saying what changed and naming the parents involved: attached to `P`, detached from `P`, reparented from `P` to `Q`, made top-level. Nothing is recorded on `P` or `Q` for it.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-8.2 — A write that changes neither the parent nor the attachment logs no hierarchy entry

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §11a

*Given* Free item `X` under `P`, and `Y` attached to `P`, *when* `X`'s workphase changes, `X` is repositioned, or `Y` is re-attached to `P`, which it's already attached to, *then* no hierarchy entry is recorded. A workphase change logs its own kind of entry, which isn't this rule's.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-8.3 — Creating an item with a parent records that parent in the new item's activity

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §11a

*Given* a write that creates item `X` under parent `P`, attached or not, whichever entry point creates it, *when* it is accepted, *then* `X`'s activity records the parent it was created under, and whether `X` is attached to it. How the entry reads, and whether `P`'s activity shows it too, aren't asserted.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-8.4 — A hierarchy change that also changes the workphase logs the workphase change too

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §11a

*Given* Free item `X` in workphase `W1`, and item `P` in workphase `W2`, *when* `X` is attached to `P` and inherits `W2`, both by editing `X` and by moving it, *then* `X`'s activity has its hierarchy entry ([ATT-8.1](att-8-hierarchy-changes-logged.md)) and, separately, the entry a workphase change logs.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`
