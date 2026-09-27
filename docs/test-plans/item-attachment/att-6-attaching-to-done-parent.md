# ATT-6 — Attaching to a done parent

**Next ID:** ATT-6.4

**Wiki:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md) §10

| ID | Case | Priority | Automated |
|---|---|---|---|
| ATT-6.1 | Attaching to a done parent is allowed and follows the ordinary attach consequences | P0 | ⏳ pending triage |
| ATT-6.2 | The child then reads as done by derivation, with nothing stored on it | P1 | ⏳ pending triage |
| ATT-6.3 | Reopening the parent makes the child read not-done, with nothing written or cleared on the child | P1 | ⏳ pending triage |

---

## ATT-6.1 — Attaching to a done parent is allowed and follows the ordinary attach consequences

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Card `P` in a terminal workphase `W_done` (`completedAt` set,
`position = null`) with attached children `S1, S2`, and a Free item `X`
in a non-terminal workphase with `completedAt = null`, *when* `X` is
attached to `P` (with an anchor among `S1, S2`, or without), *then* the
request is accepted and `X` reads: `parentId = P`, attached,
`workphaseId = W_done` (inherited), `completedAt = null` (**not** set —
attached children never receive one), and a real `position` among `P`'s
siblings (`positionScope = "attached-siblings"`). No special case for the
parent being done.

Cross-reference [TC-7.15](../item-positioning/part-7-board-placement-intents.md)
for the anchored placement inside a done Card.

**Automation test:** —

## ATT-6.2 — The child then reads as done by derivation, with nothing stored on it

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `X` attached to done parent `P` per ATT-6.1, *when* `X` is read,
*then* its effective workphase is `W_done` — it reads as done — and this
is solely a consequence of the inherited `workphaseId`; `completedAt` is
`null` and no other field on `X` records done-ness.

**Automation test:** —

## ATT-6.3 — Reopening the parent makes the child read not-done, with nothing written or cleared on the child

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `X` attached to done parent `P`, *when* `P` is moved to a non-
terminal workphase `W_open`, *then* `X.workphaseId = W_open` via the
ordinary cascade and `X` reads as not-done; `X.completedAt` was `null`
before and is `null` after, and `X.position` is unchanged — nothing was
written or cleared on `X` in either direction beyond the cascaded
workphase.

**Automation test:** —
