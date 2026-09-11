# ATT-3 — Reparent placement and atomic commit

**Wiki:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md) §4, §5, §6

**Suite ID:** `ATT-3`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `ATT-3.n`.

§4–§5's *numeric* consequences (which number comes out, and from which
scope) are catalogued in [`../item-positioning/part-7-board-placement-intents.md`](../item-positioning/part-7-board-placement-intents.md)
TC-7.7 and TC-7.11–7.13. This suite holds the attachment-side rules: that
a reparent always re-resolves, the sequencing, and atomicity.

**Scope note (from the wiki):** §4's rule is about **Attached** items.
Whether a Free item can be reparented while staying Free is an open
question; no case here covers it.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | Reparenting an Attached item always resolves a replacement position — "keep" is not an option | P0 | ⏳ pending triage |
| TC-2 | Placement is always before/after an anchor; first/last are that same form | P1 | ⏳ pending triage |
| TC-3 | An empty target has no anchor and takes the append fallback | P1 | ⏳ pending triage |
| TC-4 | A coincidentally-equal resolved position is still a real re-resolution | P2 | ⏳ pending triage |
| TC-5 | The new parent is in effect before the position is resolved | P0 | ⏳ pending triage |
| TC-6 | One gesture, one commit: every field and the cascade land together | P0 | ⏳ pending triage |
| TC-7 | On failure, nothing changed | P0 | ⏳ pending triage |
| TC-8 | A rejected change is answered by resync, never by keeping the guess | P1 | ⏳ pending triage |

---

## TC-1 — Reparenting an Attached item always resolves a replacement position — "keep" is not an option

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* attached child `X` of `A` with sibling-scoped position `p`, *when*
`X` is reparented to `B` (staying attached) by any entry point, with or
without an explicit anchor, *then* `X`'s position is freshly resolved in
`B`'s `(parentId, isAttached)` scope — anchor+side if given, append
fallback if not — and there is no request form that carries `p` across
unchanged. Cross-reference [TC-2.21](../item-positioning/part-2-anchor-resolution.md)
(the no-anchor form) and [TC-7.12](../item-positioning/part-7-board-placement-intents.md)
(the with-anchor form).

**Automation test:** —

## TC-2 — Placement is always before/after an anchor; first/last are that same form

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [TC-7.1](../item-positioning/part-7-board-placement-intents.md)
/ [TC-7.2](../item-positioning/part-7-board-placement-intents.md). *Given*
a reparent with placement, *when* the request is formed, *then* the
placement is an `anchorId` + `side` pair; "first in list" names the first
item the client renders in the target context with `side = before`, "last
in list" the last with `side = after`. No other placement form exists.

**Automation test:** —

## TC-3 — An empty target has no anchor and takes the append fallback

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference [TC-7.7](../item-positioning/part-7-board-placement-intents.md).
*Given* a target parent with no attached children, *when* an item is
reparented into it, *then* the request carries no anchor and the position
resolves via the append fallback in the new (empty) scope.

**Automation test:** —

## TC-4 — A coincidentally-equal resolved position is still a real re-resolution

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* attached child `X` of `A` at position `1.0`, and parent `B` with
no attached children, *when* `X` is reparented to `B` and the append
fallback's bootstrap resolves to `1.0` — numerically equal to the old
value — *then* the operation is not treated as a no-op: `X`'s `parentId`
is `B`, its scope is `B`'s siblings, and the value `1.0` is the *new
scope's* bootstrap, not a retained old number. Equality of the number is
not the same thing as keeping it.

**Automation test:** —

## TC-5 — The new parent is in effect before the position is resolved

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [TC-7.12](../item-positioning/part-7-board-placement-intents.md)
for the discriminating fixture (old and new sibling scopes in disjoint
numeric ranges). *Given* a single reparent-with-placement operation,
*when* the position is resolved, *then* its comparison scope is the one
derived from the **new** parent — the resolved number lies among the new
siblings, never among the old. Resolving against the old scope produces a
number that looks valid and is drawn from the wrong list — silently wrong.

**Automation test:** —

## TC-6 — One gesture, one commit: every field and the cascade land together

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Free Card `X` in workphase `W1` with attached child `X1`, and
Card `B` in workphase `W2` with attached children, *when* one gesture
attaches `X` to `B` at an anchored slot, *then* a single read afterward
shows all of the following, and there is no read at which only some of
them hold: `X.parentId = B`, `X` attached, `X.workphaseId = W2`
(inherited), `X.position` resolved in `B`'s sibling scope, and
`X1.workphaseId = W2` (cascaded). If the two Cards are in different
projects, `projectId` on `X` and its subtree lands in the same commit
([ATT-5](att-5-cross-project-reparenting.md)).

**Automation test:** —

## TC-7 — On failure, nothing changed

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same fixture, *when* a gesture is rejected partway through its
consequences — for example the target fails the depth cap
([ATT-4.4](att-4-legal-parent-depth-cap.md)), or the anchor is outside
the resulting scope ([TC-7.10](../item-positioning/part-7-board-placement-intents.md))
— *then* `X` and every descendant are exactly as before: same `parentId`,
attachment flag, `workphaseId`, `position`, `projectId`, `completedAt`.
No partial state exists in which `X` was reparented but still holds a
position from its old sibling list, or moved while `X1` stayed behind in
`W1`.

**Automation test:** —

## TC-8 — A rejected change is answered by resync, never by keeping the guess

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a client that optimistically previewed a reparent, *when* the
server rejects it, *then* the client resyncs its state from the server and
the previewed placement is discarded. There is no partial-success outcome
to report. The board-specific behavior is
[DRAG-6.6](../board-drag-interaction/drag-6-preview-reconciliation.md);
this case is the gesture-agnostic rule (Sheet, badge, any client).

**Automation test:** —
