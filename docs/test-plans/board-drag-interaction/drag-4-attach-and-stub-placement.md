# DRAG-4 — Card → Card attach, Stub drop bands, and hierarchy placement

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §6, §7

**Suite ID:** `DRAG-4`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-4.n`.

**Parameterization.** The Stub bands are tunable: `FIRST_CHILD_BAND`
(provisionally the top 50% of the Card), `LAST_CHILD_BAND` (the bottom
50%), and `POP_BAND` (provisionally 20%–80%, overlapping both). Written
against those names and against `THRESHOLD`, never literals.

The consequences of an attach — inheritance, cascade, project cascade,
done-parent legality — are [`../item-attachment/`](../item-attachment/)'s
rules applied unmodified; cases here assert the gesture produces the
right request and cross-reference the consequence.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | Dropping a Card onto a Card (after a pop) attaches it as a Stub, inheriting the parent's workphase | P0 | ⏳ pending triage |
| TC-2 | Attach across projects triggers the project cascade | P1 | ⏳ pending triage |
| TC-3 | Attach onto a done Card is allowed | P1 | ⏳ pending triage |
| TC-4 | Attach at a slot: the anchor is one of the new parent's Stubs | P0 | ⏳ pending triage |
| TC-5 | Same geometry, two meanings: quick release inserts between, a hold attaches | P0 | ⏳ pending triage |
| TC-6 | `FIRST_CHILD_BAND` quick release → first child; `LAST_CHILD_BAND` quick release → last child | P0 | ⏳ pending triage |
| TC-7 | In the overlap, time decides: release commits the quick-drop, holding pops | P0 | ⏳ pending triage |
| TC-8 | Hierarchy placement — above an anchor → sibling before it | P0 | ⏳ pending triage |
| TC-9 | Hierarchy placement — below an anchor → sibling after it | P0 | ⏳ pending triage |
| TC-10 | Hierarchy placement — below an anchor, indented → child of the anchor | P0 | ⏳ pending triage |
| TC-11 | Options 2 and 3 are distinguished by horizontal cursor offset alone | P1 | ⏳ pending triage |
| TC-12 | Attach into an empty Stub list takes the append fallback | P1 | ⏳ pending triage |
| TC-13 | Placement inside a done Card's Stub list works normally | P1 | ⏳ pending triage |

---

## TC-1 — Dropping a Card onto a Card (after a pop) attaches it as a Stub, inheriting the parent's workphase

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Free Card `X` in workphase `W1` and Card `P` in `W2`, *when* `X`
is dragged, pops into `P`'s context ([DRAG-1.3](drag-1-contexts-and-popping.md)),
and is released, *then* the committed change is: `X.parentId = P`, `X`
attached, `X.workphaseId = W2`, `X` positioned among `P`'s attached
children at the dropped slot, and `X` now renders as a Stub inside `P`.
`P`'s row is untouched ([ATT-2.1](../item-attachment/att-2-reparenting-is-one-way.md)).
All fields land in one commit ([ATT-3.6](../item-attachment/att-3-reparent-placement-atomicity.md)).

**Automation test:** —

## TC-2 — Attach across projects triggers the project cascade

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [ATT-5.1](../item-attachment/att-5-cross-project-reparenting.md)
/ [ATT-5.2](../item-attachment/att-5-cross-project-reparenting.md). *Given*
`X` in project `P1` and `P` in project `P2` (same workflow, both on the
board), *when* `X` is attached to `P` by drag, *then* `X` and its entire
descendant subtree read `projectId = P2`.

**Automation test:** —

## TC-3 — Attach onto a done Card is allowed

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [ATT-6.1](../item-attachment/att-6-attaching-to-done-parent.md).
*Given* `P` in a terminal workphase rendered in a done column, *when* `X`
pops into `P`'s context and is released, *then* the attach is committed:
`X` inherits the terminal workphase, receives no `completedAt`, and is
positioned among `P`'s Stubs.

**Automation test:** —

## TC-4 — Attach at a slot: the anchor is one of the new parent's Stubs

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `P` with Stubs `S1, S2` and `X` popped into `P`'s context, *when*
`X` is released hovering the lower half of `S1`, *then* the request
carries `parentId = P`, attached, and `{anchorId: S1, side: after}` —
an anchor from the scope `X` is *entering*, validated against `X`'s
resulting state ([TC-7.9](../item-positioning/part-7-board-placement-intents.md))
— and the server places `X` strictly between `S1` and `S2`
([TC-7.11](../item-positioning/part-7-board-placement-intents.md)).

**Automation test:** —

## TC-5 — Same geometry, two meanings: quick release inserts between, a hold attaches

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Cards `A` and `B` adjacent in a column and a dragged Card `X`
with the cursor at the boundary between them, over the edge of `B`,
*when* the user releases before `THRESHOLD`, *then* the commit is a
reposition — `X` anchored against `A` or `B`, `X.parentId` unchanged —
insertion is the default. *And when* the user instead holds there for ≥
`THRESHOLD` with the cursor in `B`'s context and then releases, *then*
the commit is an attach to `B` (TC-1). The pop threshold separates the
two, not aim.

*(Supersedes the Epic 3.2 interim "drop on card X = anchor X, side
before" default that [TC-X.5](../item-positioning/cross-cutting-regression.md)
guarded.)*

**Automation test:** —

## TC-6 — `FIRST_CHILD_BAND` quick release → first child; `LAST_CHILD_BAND` quick release → last child

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `P` with Stubs `S1, S2, S3` and a dragged Card `X` over `P`,
*when* the cursor is in `FIRST_CHILD_BAND` (and outside `POP_BAND`, or
inside it but released before `THRESHOLD`) and the user releases, *then*
the request is attach-to-`P` with `{anchorId: S1, side: before}` — first
child. *And when* the cursor is in `LAST_CHILD_BAND` and the user
releases, *then* `{anchorId: S3, side: after}` — last child.
`S1`/`S3` are the first/last Stubs of the client's rendered order under
the tie-break ([TC-7.3](../item-positioning/part-7-board-placement-intents.md)).

**Automation test:** —

## TC-7 — In the overlap, time decides: release commits the quick-drop, holding pops

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the cursor inside `POP_BAND` — which overlaps both
`FIRST_CHILD_BAND` and `LAST_CHILD_BAND` on purpose — *when* the user
releases before `THRESHOLD`, *then* the quick-drop meaning of whichever
half the cursor is in commits (TC-6). *And when* the cursor rests there
for ≥ `THRESHOLD`, *then* `X` pops into `P`'s full hierarchy context and
placement follows TC-8–TC-10. The overlap is resolved by time, never by
geometry.

**Automation test:** —

## TC-8 — Hierarchy placement — above an anchor → sibling before it

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `X` popped into `P`'s hierarchy context, where `P`'s Stubs are
`S1` and `S2`, and `S1` itself has attached child `S1a`, *when* `X` is
released hovering *above* `S1a`, *then* `X` becomes a sibling of `S1a`:
`X.parentId = S1` (the anchor's parent), attached, placed `{anchorId:
S1a, side: before}`.

**Automation test:** —

## TC-9 — Hierarchy placement — below an anchor → sibling after it

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same tree, *when* `X` is released hovering *below* `S1a`
with no rightward indent, *then* `X` becomes a sibling of `S1a`:
`X.parentId = S1`, attached, placed `{anchorId: S1a, side: after}`.

**Automation test:** —

## TC-10 — Hierarchy placement — below an anchor, indented → child of the anchor

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same tree, *when* `X` is released hovering *below* `S1a`
with the cursor offset rightward (indented), *then* `X` becomes a child
of the anchor: `X.parentId = S1a`, attached. The depth cap applies to the
resulting depth ([ATT-4.4](../item-attachment/att-4-legal-parent-depth-cap.md));
if `S1a` is Depth-capped for `X` the option isn't offered
([DRAG-1.8](drag-1-contexts-and-popping.md)).

*(The wiki settles the parent — the anchor — but not where among the
anchor's existing children `X` is placed. This case asserts parent and
attachment only; see the flagged question in [`INDEX.md`](INDEX.md).)*

**Automation test:** —

## TC-11 — Options 2 and 3 are distinguished by horizontal cursor offset alone

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* two releases at the *same vertical position* below anchor `S1a`,
one with the cursor at the anchor's own indent level and one offset
rightward past the configured indent step, *when* each is committed,
*then* the first produces TC-9's result (sibling after) and the second
TC-10's (child of) — the vertical position is identical, so only the
horizontal offset can be what decided. Same ruleset as the project
sidebar.

**Automation test:** —

## TC-12 — Attach into an empty Stub list takes the append fallback

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [TC-7.7](../item-positioning/part-7-board-placement-intents.md).
*Given* `P` with no Stubs, *when* `X` pops into `P` and is released
(any band — there is no first or last child to anchor to), *then* the
request is attach-to-`P` with no anchor and the position resolves via the
append fallback in the new (empty) scope.

**Automation test:** —

## TC-13 — Placement inside a done Card's Stub list works normally

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [TC-7.15](../item-positioning/part-7-board-placement-intents.md).
*Given* `P` done (terminal workphase) with Stubs `S1, S2` that retain
their positions, *when* `X` is placed among them via TC-6's bands or
TC-8–TC-10's hierarchy placement, *then* the anchor requests are
produced and accepted exactly as for a non-done parent — the Stubs are
anchorable; `P`'s terminality is irrelevant to its Stubs' scope.

**Automation test:** —
