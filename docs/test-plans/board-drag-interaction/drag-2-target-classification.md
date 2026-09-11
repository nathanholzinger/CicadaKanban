# DRAG-2 — Target classification at drag start

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §4

**Suite ID:** `DRAG-2`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-2.n`.

**Settled vs. deferred.** The *classification* — which of the four states
each target is in — is settled and catalogued here. The *visual
treatment* (palette, weight, animation) is an open question (Story 8) and
has no cases. Where the wiki names an overlay ("green," "grey"), cases
assert the classification state the overlay expresses, not the color.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | A legal target is classified Valid | P0 | ⏳ pending triage |
| TC-2 | The dragged item and every descendant are classified Cycle-forming | P0 | ⏳ pending triage |
| TC-3 | A target whose resulting depth would exceed `CAP` is classified Depth-capped | P0 | ⏳ pending triage |
| TC-4 | Classification is computed once at drag start and does not change mid-gesture | P1 | ⏳ pending triage |
| TC-5 | Free descendants of the carried item carry the relationship marker | P1 | ⏳ pending triage |
| TC-6 | Depth-capped targets carry the "real target, not for this item" marker | P2 | ⏳ pending triage |
| TC-7 | Stubs are classified individually during a Card drag — no blanket exclusion | P0 | ⏳ pending triage |

---

## TC-1 — A legal target is classified Valid

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a drag of item `X` and a visible Card `T` that exists, is not `X`,
is not a descendant of `X`, and satisfies `depth(T) + 1 + height(X) <=
CAP`, *when* the drag begins, *then* `T` is classified **Valid** — a legal
drop for `X`.

**Automation test:** —

## TC-2 — The dragged item and every descendant are classified Cycle-forming

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a drag of `X`, where `X` has attached descendant `S` (rendered as a
Stub inside `X`) and detached descendant `D` (rendered as its own Card
elsewhere on the board) and `D` has its own child `D1`, *when* the drag
begins, *then* `X` itself, `S`, `D`, and `D1` are each classified
**Cycle-forming**. Descent is through the hierarchy, regardless of
attachment.

**Automation test:** —

## TC-3 — A target whose resulting depth would exceed `CAP` is classified Depth-capped

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a drag of `X` with subtree height `h` (detached descendants
included — [ATT-4.5](../item-attachment/att-4-legal-parent-depth-cap.md))
and two visible targets `T_ok` at depth `D` with `D + 1 + h = CAP` and
`T_over` at depth `D + 1`, *when* the drag begins, *then* `T_ok` is
**Valid** and `T_over` is **Depth-capped** — legal parent-wise, but the
resulting depth would exceed `CAP`. Parameterize on `CAP`.

**Automation test:** —

## TC-4 — Classification is computed once at drag start and does not change mid-gesture

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a drag of `X` in progress with targets classified per TC-1–TC-3,
*when* the cursor moves across the board — hovering, popping, entering and
leaving contexts — *then* each target's classification is the same at
every point in the gesture as it was at drag start. The item being
carried doesn't change mid-gesture, so what any target *is* to it doesn't
either; classification is a per-drag property, not a per-hover one.

**Automation test:** —

## TC-5 — Free descendants of the carried item carry the relationship marker

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a drag of `X` with a detached (Free) descendant `D` rendered as a
Card elsewhere on the board, *when* the drag begins, *then* `D` carries
the "these are yours" relationship marker (the settled green overlay) for
the duration of the drag, in addition to being Cycle-forming (TC-2). The
marker is asserted as a state; its rendering is not.

**Automation test:** —

## TC-6 — Depth-capped targets carry the "real target, not for this item" marker

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* a Depth-capped target per TC-3, *when* the drag begins, *then* it
carries the marker distinguishing it from Inert (the settled grey overlay)
— it is a real target that this particular item can't use, not a
non-target. Asserted as a state; rendering not.

**Automation test:** —

## TC-7 — Stubs are classified individually during a Card drag — no blanket exclusion

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a drag of Card `X`, and Cards `P` and `Q` each with Stubs, where
`P`'s Stub `S_P` is a legal parent for `X` and `Q`'s Stub `S_Q` would put
`X` past `CAP`, *when* the drag begins, *then* `S_P` is classified
**Valid** and `S_Q` **Depth-capped** — each Stub is classified on its own
merits. No Stub is excluded from consideration merely for being a Stub.

*(Supersedes the Epic 3.2 interim behavior that
[TC-3.3](../item-positioning/part-3-attached-sibling-reorder.md) guarded,
in which a Card drag treated every Stub as a non-target.)*

**Automation test:** —
