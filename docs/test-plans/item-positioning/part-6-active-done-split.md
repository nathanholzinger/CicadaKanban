# Part 6 — Active/done split

**Wiki:** [`../../wiki/item-positioning/#6-activedone-split`](../../wiki/item-positioning/README.md#6-activedone-split)

| ID | Case | Priority | Automated | Automation test |
|---|---|---|---|---|
| TC-6.1 | `completedAt` set on transition to terminal | P0 | ⏳ pending triage | — |
| TC-6.2 | `completedAt` cleared on reopen | P0 | ⏳ pending triage | — |
| TC-6.3 | Done items store no position | P0 | ⏳ pending triage | — |
| TC-6.4 | Done-item ordering is purely `completedAt`-based | P0 | ⏳ pending triage | — |
| TC-6.5 | Attached children keep position under terminal cascade | P0 | ⏳ pending triage | — |
| TC-6.6 | `positionScope` stays `"attached-siblings"` under terminal cascade | P0 | ⏳ pending triage | — |
| TC-6.7 | Column range validation rejects terminal+non-terminal mix | P0 | ⏳ pending triage | — |
| TC-6.8 | Range entirely terminal or entirely non-terminal remains valid | P1 | ⏳ pending triage | — |
| TC-6.9 | Reopening a done item doesn't resurrect a stale position | P1 | ⏳ pending triage | — |

---

## TC-6.1 — `completedAt` set on transition to terminal

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a detached/root item currently in a non-terminal workphase with
`completedAt = null`, *when* its effective workphace transitions to a
terminal one, *then* `completedAt` is set to the transition time.

## TC-6.2 — `completedAt` cleared on reopen

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a done item with `completedAt` set, *when* it is moved back to a
non-terminal workphase, *then* `completedAt` is cleared to `null`.

## TC-6.3 — Done items store no position

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an item transitioning to a terminal workphace, *when* the
transition completes, *then* its `position` is not written/updated as
part of that transition — ordering among done items is derived from
`completedAt`, not a stored `position` value.

## TC-6.4 — Done-item ordering is purely `completedAt`-based

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* several done items with different `completedAt` timestamps,
*when* they are listed/sorted, *then* the order follows `completedAt`
(e.g. most recently completed first, or whatever direction is specified),
never a `position` comparison.

## TC-6.5 — Attached children keep position under terminal cascade

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an attached child whose parent (and thus the child's cascaded
effective workphace) transitions to terminal, *when* the cascade applies,
*then* the child's `position` is retained and still meaningful within
`(parentId, isAttached)` — only detached/root items lose position on
terminal transition.

## TC-6.6 — `positionScope` stays `"attached-siblings"` under terminal cascade

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

Cross-reference [TC-2.13](part-2-anchor-resolution.md). An attached child
cascaded to terminal still reports `"attached-siblings"`, not `"none"`.

## TC-6.7 — Column range validation rejects terminal+non-terminal mix

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an attempt to create or edit a board column whose configured
status range includes both a terminal and a non-terminal workphace,
*when* the range is validated, *then* it is rejected with an error,
alongside the existing overlap/direction/foreign-workphase checks.

## TC-6.8 — Range entirely terminal or entirely non-terminal remains valid

**Priority:** P1 (regression/guard) · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a column range that covers only non-terminal statuses (or only
terminal ones), *when* validated, *then* it is accepted — the new check
only rejects a *mixed* range.

## TC-6.9 — Reopening a done item doesn't resurrect a stale position

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a detached/root done item with no stored position, *when* it's
reopened (moved to non-terminal), *then* it receives a fresh position via
the append-fallback mechanism ([Part 2](part-2-anchor-resolution.md)),
consistent with any other scope-change reassignment.
