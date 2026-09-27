# ATT-5 — Cross-project reparenting

**Next ID:** ATT-5.4

**Wiki:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md) §9

**Supersedes** [`TC-X.3`](../item-positioning/cross-cutting-regression.md)
(the Epic 3.2 same-project constraint).

**No case for cross-*workflow*.** The wiki says cross-workflow moves are
not a board gesture and belong to Epic 7's Sheet-level "move to project,"
and states no rule for what the API does with such a request today. That
open question is recorded in
[`../../planning/epic-7-decisions.md`](../../planning/epic-7-decisions.md);
nothing here asserts either acceptance or rejection of a parent whose
project is on a different workflow.

| ID | Case | Priority | Automated |
|---|---|---|---|
| ATT-5.1 | Reparenting across two projects on the same workflow is accepted | P0 | ⏳ pending triage |
| ATT-5.2 | The new project cascades to the entire descendant subtree, detached descendants included | P0 | ⏳ pending triage |
| ATT-5.3 | Position is re-resolved in the same workflow scope — the project change adds nothing | P1 | ⏳ pending triage |

---

## ATT-5.1 — Reparenting across two projects on the same workflow is accepted

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* projects `P1` and `P2` both on workflow `W`, Free Card `X` in
`P1`, and Card `B` in `P2`, *when* `X` is attached to `B`, *then* the
request is accepted: `X.parentId = B`, `X` attached, `X.projectId = P2`,
`X.workphaseId = B.workphaseId` (a workphase of `W`, still valid). Cross-
project is not a disqualifier.

*(This inverts the Epic 3.2 behavior that `TC-X.3` guarded.)*

**Automation test:** —

## ATT-5.2 — The new project cascades to the entire descendant subtree, detached descendants included

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `X` in `P1` with attached child `X1`, detached child `X2`, and
`X2`'s own child `X2a`, *when* `X` is reparented under `B` in `P2`,
*then* `X`, `X1`, `X2`, and `X2a` all read `projectId = P2` after the one
commit ([ATT-3.6](att-3-reparent-placement-atomicity.md)). The cascade
follows the *hierarchy*, not the attachment flag — a detached child still
belongs to its parent's subtree and moves project with it (confirmed by
the Product Owner, 2026-09-10; the wiki's wording is "entire descendant
subtree"). No descendant is left behind in `P1` with a `parentId` that now
points into `P2`.

Workphase handling is unchanged by the project cascade: `X1` (attached)
takes `B`'s workphase via the ordinary cascade; `X2` and `X2a` (detached)
keep their own workphases, which remain valid because `P1` and `P2` share
workflow `W`.

**Automation test:** —

## ATT-5.3 — Position is re-resolved in the same workflow scope — the project change adds nothing

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [TC-7.14](../item-positioning/part-7-board-placement-intents.md).
*Given* a cross-project reparent, *when* the moved item's position is
resolved, *then* it is re-resolved because every reparent re-resolves
([ATT-3.1](att-3-reparent-placement-atomicity.md)) — and the number
produced is the same one a same-project reparent with the same anchor
would produce, because the comparison scope (workflow `W` for a Free
item; the new parent's siblings for an Attached one) is unchanged by the
project.

**Automation test:** —
