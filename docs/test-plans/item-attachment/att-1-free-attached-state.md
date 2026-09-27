# ATT-1 — Free / Attached state model

**Next ID:** ATT-1.8

**Wiki:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md) §1, §2, §12

These rules were implemented in Epic 3 and are restated by the wiki as the
foundation the Epic 3.5 rules build on. Cases here exist so the state
model has a home in the catalog; several are cross-references to
[`../item-positioning/`](../item-positioning/) where the positioning
consequence was already catalogued.

| ID | Case | Priority | Automated |
|---|---|---|---|
| ATT-1.1 | A top-level item is always Free | P1 | ⏳ pending triage |
| ATT-1.2 | A detached child is Free — exactly as Free as a top-level item | P0 | ⏳ pending triage |
| ATT-1.3 | An Attached child inherits its parent's workphase, and the cascade reaches every attached descendant | P0 | ⏳ pending triage |
| ATT-1.4 | An Attached child never receives `completedAt` and keeps its position under a terminal inheritance | P0 | ⏳ pending triage |
| ATT-1.5 | A Stub under a done parent reads as done by derivation, with nothing stored | P1 | ⏳ pending triage |
| ATT-1.6 | A detached child is not affected by its parent moving | P0 | ⏳ pending triage |
| ATT-1.7 | The three state consequences always move together | P0 | ⏳ pending triage |

---

## ATT-1.1 — A top-level item is always Free

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* an item with no item-parent (`parentId` empty), *when* its state
is read — and *when* an attempt is made to mark it attached with no
parent — *then* it is Free in every consequence: governed by its own
workphase, positioned in the workflow-wide scope (`positionScope =
"workflow"`, cross-reference [TC-2.17](../item-positioning/part-2-anchor-resolution.md)),
rendered as a Card. Free is not a togglable state for it; there is nothing
for it to be attached to.

*(The wiki states the outcome — the item is Free — but not whether a
parentless "attach" request is rejected or silently ignored. This case
asserts only the outcome; see the flagged questions in
[`INDEX.md`](INDEX.md).)*

**Automation test:** —

## ATT-1.2 — A detached child is Free — exactly as Free as a top-level item

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a child item whose `parentId` names a parent and whose attachment
flag is clear, *when* its state is read, *then* it behaves identically to
a top-level item: its own workphase governs it, its position compares
against the whole workflow (`positionScope = "workflow"`), and it renders
as a Card on the board — not as a Stub inside its parent. There is no
third status distinguishing "detached child" from "top-level" in
behavior; only its place in the hierarchy differs.

**Automation test:** —

## ATT-1.3 — An Attached child inherits its parent's workphase, and the cascade reaches every attached descendant

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `P` with attached child `C1`, `C1` with attached child `C2`, and
`C1` also with a *detached* child `D`, *when* `P`'s workphase changes,
*then* `C1` and `C2` take the new workphase (every attached descendant, at
every depth), and `D` does not (ATT-1.6). An attached child's effective
workphase is always its parent's.

**Automation test:** —

## ATT-1.4 — An Attached child never receives `completedAt` and keeps its position under a terminal inheritance

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [Part 6 TC-6.5](../item-positioning/part-6-active-done-split.md)
and [TC-6.6](../item-positioning/part-6-active-done-split.md). *Given* an
attached child with a sibling-scoped position, *when* its parent moves to
a terminal workphase and the cascade applies, *then* the child's
`completedAt` stays `null`, its `position` is unchanged, and its
`positionScope` stays `"attached-siblings"`.

**Automation test:** — *(expected to map to the same tests as TC-6.5/6.6)*

## ATT-1.5 — A Stub under a done parent reads as done by derivation, with nothing stored

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* an attached child whose parent is in a terminal workphase, *when*
the child is read, *then* its effective workphase is terminal (it "reads
as done") purely because of the inherited workphase — no `completedAt`,
no flag, nothing additional is written on the child. *And when* the
parent is later reopened (moved to a non-terminal workphase), *then* the
child reads as not-done again, and nothing was written or cleared on the
child in either direction beyond the cascaded `workphaseId`.

**Automation test:** —

## ATT-1.6 — A detached child is not affected by its parent moving

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a detached child `D` of `P` with its own workphase `W_D`, position
`p_D`, and `completedAt` (null or set), *when* `P` moves to a different
workphase — including a terminal one, and including back out of a
terminal one — *then* `D`'s `workphaseId`, `position`, and `completedAt`
are all exactly unchanged.

**Automation test:** —

## ATT-1.7 — The three state consequences always move together

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Free item, *when* it becomes Attached (acquires a parent with the
attachment flag set), *then* in the same change: its effective workphase
becomes its parent's, its `positionScope` becomes `"attached-siblings"`
(with a fresh sibling-scoped position — [TC-2.20](../item-positioning/part-2-anchor-resolution.md)),
and it renders as a Stub inside its parent's Card rather than as a Card.

*And given* an Attached item, *when* it becomes Free (detach), *then* in
the same change: it takes its own workphase (the one it holds at that
moment — [ATT-7.3](att-7-detach-preserves-parent.md)), `positionScope`
becomes `"workflow"` with a fresh workflow-scoped position
([TC-2.19](../item-positioning/part-2-anchor-resolution.md)), and it
renders as a Card.

There is no observable intermediate in which one consequence has flipped
and another hasn't.

**Automation test:** —
