# ATT-6 — Attaching to a done parent

**Next ID:** ATT-6.4

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-6.1 | Attaching to a done parent is allowed and follows the ordinary attach consequences | P0 | Automated |
| ATT-6.2 | The child then reads as done by derivation, with nothing stored on it | P1 | Automated |
| ATT-6.3 | Reopening the parent makes the child read not done, with nothing written or cleared on the child | P1 | Automated |

---

## ATT-6.1 — Attaching to a done parent is allowed and follows the ordinary attach consequences

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-attachment §10

*Given* Card `P` in terminal workphase `W_done` (`completedAt` set, `position` null) with attached children `S1, S2`, and Free item `X` in a non-terminal workphase with `completedAt` null, *when* `X` is attached to `P`, with an anchor among `S1, S2` or without one, *then* it is accepted, and `X` reads: `parentId = P`, attached, `workphaseId = W_done` (inherited), `completedAt` null, since attached children never receive one, and a real `position` among `P`'s attached children (`positionScope = "attached-siblings"`). A done parent needs no special case ([TC-7.15](../item-positioning/part-7-board-placement-intents.md)).

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-6.2 — The child then reads as done by derivation, with nothing stored on it

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §10

*Given* `X` attached to done parent `P` as in [ATT-6.1](att-6-attaching-to-done-parent.md), *when* `X` is read, *then* its effective workphase is `W_done`, so it reads as done, and only because of the `workphaseId` it inherited: `completedAt` is null, and no other field on `X` records that it's done.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## ATT-6.3 — Reopening the parent makes the child read not done, with nothing written or cleared on the child

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §10

*Given* `X` attached to done parent `P`, *when* `P` moves to non-terminal workphase `W_open`, *then* `X.workphaseId = W_open` through the ordinary cascade, and `X` reads as not done. `X.completedAt` is null before and after, and `X.position` is unchanged. Nothing on `X` records whether it's done, in either direction: the only field the reopen sets on `X` is the cascaded workphase, along with the modification timestamp any write updates.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`
