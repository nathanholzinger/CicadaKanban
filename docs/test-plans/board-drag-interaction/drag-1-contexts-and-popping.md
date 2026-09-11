# DRAG-1 — Contexts, the reposition default, and popping

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §1, §2, §3

**Suite ID:** `DRAG-1`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-1.n`.

**What's in scope here.** Per the wiki's own note, only drop *resolution*
is catalogued — given a release at this place, after this cursor
behavior, what change is committed. The tilt, the axis-lock feel, the
ghost/highlight rendering, and whether the pop *reads* right are manual-
verification by design and have no cases.

**Parameterization.** Every case that depends on the pop threshold is
written against `THRESHOLD` (provisionally 0.5 s of sustained cursor
presence), never the literal. "Sustained" means the cursor rests in the
candidate context continuously for ≥ `THRESHOLD`; "momentary" means it
leaves before `THRESHOLD` elapses.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | A drag starts in exactly one context, determined by the item and the column's display mode | P0 | ⏳ pending triage |
| TC-2 | In-context release is a reposition: anchor+side, workphase and parent unchanged | P0 | ⏳ pending triage |
| TC-3 | A sustained cursor signal in a different context pops; a momentary one does not | P0 | ⏳ pending triage |
| TC-4 | Brushing past a Card while reordering never attaches | P0 | ⏳ pending triage |
| TC-5 | After a pop, placement follows the new context's rules | P0 | ⏳ pending triage |
| TC-6 | Expanded mode: a sibling sub-row is a different context | P0 | ⏳ pending triage |
| TC-7 | A cycle-forming target is never poppable | P0 | ⏳ pending triage |
| TC-8 | A depth-capped target is never poppable | P0 | ⏳ pending triage |

---

## TC-1 — A drag starts in exactly one context, determined by the item and the column's display mode

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* each of the following, *when* a drag begins, *then* the drag's
starting context is:

- a Free item (Card) in a **merged** column → the whole column;
- a Free item (Card) in an **expanded** column → the individual sub-row
  the item is rendered in, not the column;
- an Attached item (Stub) → its parent Card.

The context is determined entirely by what the item already is and how
its column is currently displayed; no input from the user selects it.

**Automation test:** —

## TC-2 — In-context release is a reposition: anchor+side, workphase and parent unchanged

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card in a merged column rendering `A, B, C` with the Card
being `C`, *when* the user drags `C` and releases with the cursor still
within the column, hovering the lower half of `A`, *then* the committed
change is a reposition: `{anchorId: A, side: after}`, `workphaseId`
unchanged, `parentId` and attachment unchanged. Likewise for a Stub
released within its parent Card among its siblings — a sibling reorder
([TC-3.1](../item-positioning/part-3-attached-sibling-reorder.md)),
parent unchanged.

The default assumption is reposition until the user demonstrates
otherwise.

**Automation test:** —

## TC-3 — A sustained cursor signal in a different context pops; a momentary one does not

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card being dragged within its column context and a neighboring
Card `Q` (a Valid target), *when* the cursor enters `Q`'s context and rests
there continuously for ≥ `THRESHOLD`, *then* the item pops into `Q`'s
context — it is thereafter positioned under `Q`'s rules (TC-5), and a
release commits an attach ([DRAG-4.1](drag-4-attach-and-stub-placement.md)).

*And given* the same setup, *when* the cursor enters `Q`'s context but
leaves before `THRESHOLD` elapses, *then* no pop occurs and the drag is
still in its original context.

Assert *that* sustained pops and momentary doesn't, parameterized on
`THRESHOLD` — never on 0.5 s itself. The same holds for whichever
refinement the tuning settles on (a distance term, either-of, or a
combined function): the case is about the boundary the parameter defines.

**Automation test:** —

## TC-4 — Brushing past a Card while reordering never attaches

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` being reordered within its column past neighboring
Cards `A` and `B`, *when* the cursor's path crosses `A`'s and `B`'s
regions (each for less than `THRESHOLD`) and the user releases between
`A` and `B`, *then* the committed change is a reposition — `X` anchored
against `A` or `B` — and `X.parentId` is unchanged. Popping is never
incidental; hovering between two cards is a reposition no matter how
precise the aim.

**Automation test:** —

## TC-5 — After a pop, placement follows the new context's rules

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card that has popped into another Card `Q`'s context, *when*
the cursor then hovers among `Q`'s Stubs and releases, *then* the commit is
an anchor+side placement among `Q`'s attached children
([DRAG-4.8–4.10](drag-4-attach-and-stub-placement.md)) — not a column-band
resolution. *And given* a Card that has popped into a different column
region's context (by holding in its middle band —
[DRAG-3.4](drag-3-card-column-bands.md)), *when* it is released hovering a
specific card there, *then* the commit is anchor+side against that card —
not the band it happens to be in.

**Automation test:** —

## TC-6 — Expanded mode: a sibling sub-row is a different context

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* an expanded column with sub-rows for `W1` and `W2` and a Card
starting in the `W1` sub-row, *when* the cursor moves into the `W2`
sub-row and releases immediately (momentary), *then* the commit is the
`W2` sub-row's band meaning ([DRAG-3.8](drag-3-card-column-bands.md)) —
a genuine workphase change to exactly `W2` — never an in-context
reposition that happens to have crossed a line. *And when* the cursor
rests in the `W2` sub-row for ≥ `THRESHOLD`, *then* it pops into the `W2`
sub-row context and is then positioned there by anchor+side (TC-5).

Sibling sub-rows of one column are separate contexts; moving between them
is a context change like any other.

**Automation test:** —

## TC-7 — A cycle-forming target is never poppable

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` with descendant `D` (attached or detached) also visible
on the board, *when* `X` is dragged and the cursor rests over `D` — or
over `X`'s own region — for well past `THRESHOLD`, *then* no pop occurs,
no attach is offered, and a release there commits nothing that reparents
`X`. Validity is decided before the affordance is offered, using the same
rule the API enforces ([ATT-4.2/4.3](../item-attachment/att-4-legal-parent-depth-cap.md)).
The user never watches the item settle and bounce back.

**Automation test:** —

## TC-8 — A depth-capped target is never poppable

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card `X` with subtree height `h` and a target Card `T` at depth
`D` with `D + 1 + h > CAP` (parameterized on `CAP`, see
[ATT-4.4](../item-attachment/att-4-legal-parent-depth-cap.md)), *when*
`X` is dragged and the cursor rests over `T` for well past `THRESHOLD`,
*then* no pop occurs and no attach is offered. `T` remains a legitimate
target for *other* drags whose subtree fits.

**Automation test:** —
