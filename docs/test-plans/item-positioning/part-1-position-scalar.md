# Part 1 — Position remains a single item-owned scalar

**Wiki:** [`../../wiki/item-positioning/#1-position-is-a-single-item-owned-scalar`](../../wiki/item-positioning/README.md#1-position-is-a-single-item-owned-scalar)

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1.1 | Position is a single value across boards | P2 | ✅ automated |

---

## TC-1.1 — Position is a single value across boards

**Priority:** P2 (regression/guard) · **Automated:** ✅ automated

*Given* an item visible on two different boards (two boards whose column
ranges both cover the item's workphase), *when* the item is queried via
each board, *then* both report the identical `position` value — there is
no per-board override.

**Automation test:** `server/tests/routes/boards.test.ts` › "reports
identical position for the same item across two different boards on one
workflow (TC-1.1)" — a genuine second board (`POST /api/boards`) on the
same workflow, not the parent/child-project-inheritance view of one board
`tests/ui/boards.spec.ts` already covered.
