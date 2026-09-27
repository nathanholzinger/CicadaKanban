# DRAG-2 — Target classification at drag start

**Next ID:** DRAG-2.9

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §4

**Settled vs. deferred.** The *classification* — which of the four states
each target is in — is settled and catalogued here. The *visual
treatment* (palette, weight, animation) is an open question (Story 8) and
has no cases. Where the wiki names an overlay ("green" for descendants,
"de-emphasized" for depth-capped), cases assert the classification state
the overlay expresses, not the color or the dimming amount.

| ID | Case | Priority | Automated |
|---|---|---|---|
| DRAG-2.1 | A legal target is classified Valid | P0 | ⏳ pending triage |
| DRAG-2.2 | The dragged item and every descendant are classified Cycle-forming | P0 | ⏳ pending triage |
| DRAG-2.3 | A target whose resulting depth would exceed `CAP` is classified Depth-capped | P0 | ⏳ pending triage |
| DRAG-2.4 | Classification is computed once at drag start and does not change mid-gesture | P1 | ⏳ pending triage |
| DRAG-2.5 | Free descendants of the carried item carry the relationship marker | P1 | ⏳ pending triage |
| DRAG-2.6 | Depth-capped targets are de-emphasized, not hidden | P2 | ⏳ pending triage |
| DRAG-2.7 | Stubs are classified individually during a Card drag — no blanket exclusion | P0 | ⏳ pending triage |
| DRAG-2.8 | Inert targets: non-targets for every item, not just this one | P1 | ⏳ pending triage |

---

## DRAG-2.1 — A legal target is classified Valid

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a drag of item `X` and a visible Card `T` that exists, is not `X`,
is not a descendant of `X`, and satisfies `depth(T) + 1 + height(X) <=
CAP`, *when* the drag begins, *then* `T` is classified **Valid** — a legal
drop for `X`.

**Automation test:** —

## DRAG-2.2 — The dragged item and every descendant are classified Cycle-forming

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a drag of `X`, where `X` has attached descendant `S` (rendered as a
Stub inside `X`) and detached descendant `D` (rendered as its own Card
elsewhere on the board) and `D` has its own child `D1`, *when* the drag
begins, *then* `X` itself, `S`, `D`, and `D1` are each classified
**Cycle-forming**. Descent is through the hierarchy, regardless of
attachment.

**Automation test:** —

## DRAG-2.3 — A target whose resulting depth would exceed `CAP` is classified Depth-capped

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a drag of `X` with subtree height `h` (detached descendants
included — [ATT-4.5](../item-attachment/att-4-legal-parent-depth-cap.md))
and two visible targets `T_ok` at depth `D` with `D + 1 + h = CAP` and
`T_over` at depth `D + 1`, *when* the drag begins, *then* `T_ok` is
**Valid** and `T_over` is **Depth-capped** — legal parent-wise, but the
resulting depth would exceed `CAP`. Parameterize on `CAP`.

**Automation test:** —

## DRAG-2.4 — Classification is computed once at drag start and does not change mid-gesture

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a drag of `X` in progress with targets classified per DRAG-2.1–DRAG-2.3,
*when* the cursor moves across the board — hovering, popping, entering and
leaving contexts — *then* each target's classification is the same at
every point in the gesture as it was at drag start. The item being
carried doesn't change mid-gesture, so what any target *is* to it doesn't
either; classification is a per-drag property, not a per-hover one.

**Automation test:** —

## DRAG-2.5 — Free descendants of the carried item carry the relationship marker

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a drag of `X` with a detached (Free) descendant `D` rendered as a
Card elsewhere on the board, *when* the drag begins, *then* `D` carries
the "these are yours" relationship marker (the settled green overlay) for
the duration of the drag, in addition to being Cycle-forming (DRAG-2.2). The
marker is asserted as a state; its rendering is not.

**Automation test:** —

## DRAG-2.6 — Depth-capped targets are de-emphasized, not hidden

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* a Depth-capped target per DRAG-2.3, *when* the drag begins, *then* it
is still rendered on the board — not removed, not collapsed — and carries
the marker distinguishing it from Inert: "real target, not for this
item." It is a real target that this particular item can't use, not a
non-target. Asserted as a state plus presence; the dimming treatment
itself (a panel value until Story 8 settles it) is not asserted.

**Automation test:** —

## DRAG-2.7 — Stubs are classified individually during a Card drag — no blanket exclusion

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

## DRAG-2.8 — Inert targets: non-targets for every item, not just this one

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a drag of a **Card** `X`, *when* the drag begins, *then* each of
the following is classified **Inert** regardless of `X`'s depth or
descendants: the Unsorted bucket; a broken column; an expanded column's
outer wrapper (a drop must land on a specific sub-row). What separates
Inert from Depth-capped (DRAG-2.6) is that these are non-targets for *every*
item — the same drag with a different item classifies them identically.

*And given* a drag of a **Stub** `S` under parent `P` (interim rule until
Story 5 opens the detach direction), *when* the drag begins, *then* `S`'s
siblings in `P`'s Stub list are **Valid** (reposition targets) and every
target outside that list — `P` itself, other Cards, other Cards' Stubs —
is **Inert**.

*(The Stub half is superseded when Story 5 lands the full classification;
it stays here under this ID with a "was:" note at that point.)*

**Automation test:** —
