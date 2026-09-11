# ATT-4 — What makes a target a legal parent, and the depth cap

**Wiki:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md) §7, §8

**Suite ID:** `ATT-4`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `ATT-4.n`.

**Parameterization:** every depth-cap case is written against the named
constant `CAP` (provisionally 6), never a literal. Root items are at depth
1; `draggedSubtreeHeight` counts the levels *below* the dragged item (a
leaf has height 0). Legality: `D + 1 + draggedSubtreeHeight <= CAP` where
`D` is the target's depth. Per the Product Owner (2026-09-10), the dragged
subtree — and therefore its height — includes **detached** descendants,
not only attached ones.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | A parent reference naming no item is rejected, not stored | P0 | ⏳ pending triage |
| TC-2 | The moving item itself is not a legal parent | P0 | ⏳ pending triage |
| TC-3 | A descendant of the moving item is not a legal parent | P0 | ⏳ pending triage |
| TC-4 | Depth cap boundary: exactly `CAP` is legal, `CAP + 1` is not | P0 | ⏳ pending triage |
| TC-5 | Subtree height is the deepest resulting leaf, detached descendants included | P0 | ⏳ pending triage |
| TC-6 | Root depth is 1 and a leaf's height is 0 | P1 | ⏳ pending triage |
| TC-7 | The cap gates moves, not existing data | P1 | ⏳ pending triage |
| TC-8 | `CAP` is one constant: changing it moves both enforcement points together | P1 | ⏳ pending triage |
| TC-9 | The UI and the API agree on every target's legality | P0 | ⏳ pending triage |

---

## TC-1 — A parent reference naming no item is rejected, not stored

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a reparent request whose `parentId` names an id that does not
exist (never existed, or was deleted), *when* it is submitted, *then* the
request is rejected and the moving item's `parentId` is unchanged — the
dangling reference is never stored.

**Automation test:** —

## TC-2 — The moving item itself is not a legal parent

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* item `A`, *when* a request sets `A.parentId = A`, *then* it is
rejected and `A` is unchanged. Cross-reference
[TC-X.2](../item-positioning/cross-cutting-regression.md).

**Automation test:** —

## TC-3 — A descendant of the moving item is not a legal parent

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `A` → `B` → `C` (each a child of the previous; attachment state
irrelevant — hierarchy is the fact, not attachment), *when* a request sets
`A.parentId = B` (direct child) or `A.parentId = C` (deeper descendant),
*then* each is rejected as cycle-forming and `A` is unchanged. *And when*
a request sets `C.parentId = A` (moving *up* the tree), *then* it is
accepted — the check is "is the target in the moving item's subtree,"
evaluated from the moving item's side ([ATT-2.2](att-2-reparenting-is-one-way.md)).

**Automation test:** —

## TC-4 — Depth cap boundary: exactly `CAP` is legal, `CAP + 1` is not

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a target `T` at depth `D` and a moving item `M` with subtree
height `h`, arranged so that `D + 1 + h = CAP` exactly, *when* `M` is
reparented to `T`, *then* it is accepted and the resulting deepest leaf
sits at depth `CAP`. *And given* an arrangement where `D + 1 + h = CAP +
1` (one deeper — via a deeper target, or one more level under `M`),
*when* the same reparent is attempted, *then* it is rejected as
depth-capped and nothing changes ([ATT-3.7](att-3-reparent-placement-atomicity.md)).

Parameterize on `CAP`; do not hard-code 6.

**Automation test:** —

## TC-5 — Subtree height is the deepest resulting leaf, detached descendants included

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* moving item `M` with an attached child `M1` (height 1 via that
branch) and a *detached* child `M2` that itself has a child `M2a` (height
2 via that branch), *when* `M` is reparented to a target `T` at depth `D`,
*then* the cap check uses `h = 2` — the deepest leaf that would result,
through the detached branch — so the move is accepted iff `D + 1 + 2 <=
CAP`. Checking `M` alone (`h = 0`) or only its attached branch (`h = 1`)
would admit a tree that ends up past the cap.

**Automation test:** —

## TC-6 — Root depth is 1 and a leaf's height is 0

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a root item `R` (no parent) and a leaf item `L` (no children),
*when* `L` is reparented to `R`, *then* the check evaluates `1 + 1 + 0 =
2 <= CAP` and is accepted, and `L` now sits at depth 2. This pins the
counting convention the formula depends on.

**Automation test:** —

## TC-7 — The cap gates moves, not existing data

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a pre-existing tree already deeper than `CAP` (created before the
cap existed, or imported), *when* its items are read, listed on a board,
or shown in the sidebar, *then* they load and are operable — the data is
valid and readable, and nothing rejects or hides it. *And when* a move is
attempted that would push a resulting leaf past `CAP` (TC-4), *then* that
move — and only a move — is refused.

*(The wiki says "only a gesture that would *increase* depth past the cap
is refused," while the formula in §8 evaluates the *resulting* depth
regardless of direction. For a subtree already taller than `CAP`, those
two readings can disagree — see the flagged question in
[`INDEX.md`](INDEX.md). This case deliberately covers only the
uncontested parts: over-cap data is readable, and a depth-increasing move
past the cap is refused.)*

**Automation test:** —

## TC-8 — `CAP` is one constant: changing it moves both enforcement points together

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* the single named `CAP` constant, *when* its value is changed
(e.g. from 6 to 5) and nothing else is touched, *then* both the API's
acceptance boundary (TC-4) and the UI's Depth-capped classification
([DRAG-2.3](../board-drag-interaction/drag-2-target-classification.md))
move to the new value — the same fixture that was accepted at the old
value's boundary is now rejected/classified Depth-capped at the new one.

**Automation test:** —

## TC-9 — The UI and the API agree on every target's legality

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a fixed board state and a moving item `M`, *when* the UI classifies
every visible target for `M` ([DRAG-2](../board-drag-interaction/drag-2-target-classification.md))
and the API is asked to perform the reparent for each of those targets,
*then* every target the UI classifies **Valid** is accepted by the API,
and every target the UI classifies **Cycle-forming** or **Depth-capped**
is rejected by the API. The UI never presents as droppable a target the
API would refuse, and never withholds one it would accept, across the
whole classification — not only on a sample.

Neither point enforces the rule in the database schema; the hierarchy
link remains a soft reference.

**Automation test:** —
