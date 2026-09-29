# TC-1 — Position is one value per item

**Next ID:** TC-1.2

| ID | Case | Priority | Status |
|---|---|---|---|
| TC-1.1 | Every board reads the same position for an item | P2 | Automated |

---

## TC-1.1 — Every board reads the same position for an item

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-positioning §1

*Given* an item in a workphase that two boards of the same workflow both cover, *when* the item is read through each board, *then* both report the same `position`. No board keeps a value of its own.

**Automation test:** `server/tests/routes/boards.test.ts`
