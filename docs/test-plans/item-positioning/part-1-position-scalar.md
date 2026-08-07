# Part 1 — Position remains a single item-owned scalar

**Wiki:** [`../../wiki/item-positioning/#1-position-is-a-single-item-owned-scalar`](../../wiki/item-positioning/README.md#1-position-is-a-single-item-owned-scalar)

| ID | Case | Priority | Automated | Automation test |
|---|---|---|---|---|
| TC-1.1 | Position is a single value across boards | P2 | ⏳ pending triage | — |

---

## TC-1.1 — Position is a single value across boards

**Priority:** P2 (regression/guard) · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an item visible on two different boards (two boards whose column
ranges both cover the item's workphase), *when* the item is queried via
each board, *then* both report the identical `position` value — there is
no per-board override.
