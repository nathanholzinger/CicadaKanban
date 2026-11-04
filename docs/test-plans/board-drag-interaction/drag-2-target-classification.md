# DRAG-2 — Target classification at drag start

**Next ID:** DRAG-2.24

The classification states and the Full, Mid and Low tiers are separate assertions. Cases use the named opacity values; they do not pin tuned numbers or the cues' final look. Tiers change opacity alone, without adding a relationship color, and leave targets drawn in place.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-2.1 | A legal target is classified Valid | P0 | Automated |
| DRAG-2.2 | The dragged item and every descendant are classified Cycle-forming | P0 | Automated |
| DRAG-2.3 | A target whose resulting depth would exceed `CAP` is classified Depth-capped | P0 | Automated |
| DRAG-2.4 | Classification is computed once at drag start and doesn't change mid-gesture | P1 | Open |
| DRAG-2.7 | Every Stub is classified individually | P0 | Automated |
| DRAG-2.8 | A Stub drag is classified exactly like a Card drag, and a place that's no target isn't classified | P1 | Open |
| DRAG-2.9 | Cycle-forming wins over Depth-capped | P1 | Automated |
| DRAG-2.10 | The board's depth cap is the one the API enforces, carried by `GET /boards/:id` | P1 | Automated |
| DRAG-2.11 | Depth classification includes pending parent changes and a detaching item's kept parent | P0 | Open |
| DRAG-2.12 | Cycle classification includes pending parent changes and a detaching item's kept parent | P0 | Open |
| DRAG-2.14 | Valid Cards and Stubs are Full | P1 | Open |
| DRAG-2.15 | A Free Card that is not Valid is Mid, never Low | P1 | Open |
| DRAG-2.16 | A Depth-capped Stub is Mid with a Valid parent, and its children are Low | P1 | Open |
| DRAG-2.17 | A dragged Stub's descendants stay drawn at Low and are never placement neighbors | P1 | Open |
| DRAG-2.18 | An overflow row is Full with a Valid owner and Low otherwise, never Mid | P1 | Open |
| DRAG-2.19 | Tiers stay fixed across layers and clear when the drag ends | P1 | Open |
| DRAG-2.20 | The ghost, carried copy, backdrop rows and non-targets take no target tier | P1 | Open |
| DRAG-2.21 | A tier dims only the row's own content, leaving its drop line and nested rows independent | P1 | Open |
| DRAG-2.22 | Dimmed targets never start a zoom-in or modal-hold cue | P1 | Open |
| DRAG-2.23 | Tier assignment uses pending attachment and parent changes at pickup | P1 | Open |

---

## DRAG-2.1 — A legal target is classified Valid

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of item `X` with subtree height `H`, and a visible Card `T` at depth `D` that isn't `X`, isn't a descendant of `X`, and satisfies `D + 1 + H <= CAP` (wiki item-attachment §8), *when* the drag begins, *then* `T` is classified **Valid**.

**Automation test:** `tests/ui/drag-target-classification.spec.ts`

## DRAG-2.2 — The dragged item and every descendant are classified Cycle-forming

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of `X`, where `X` has a detached descendant `D` (its own Card elsewhere on the board), and `D` has an attached Stub `D1`, shown inside `D`'s Card, *when* the drag begins, *then* `X` itself, `D` and `D1` are each classified **Cycle-forming**. Descent follows the hierarchy, attached or not: `D` is reached through a detached link, and `D1` through an attached one. (`X`'s own attached Stubs travel with `X` and aren't shown during its drag, wiki board-drag-interaction §5a, so they aren't on the board to classify.)

**Automation test:** `tests/ui/drag-target-classification.spec.ts`

## DRAG-2.3 — A target whose resulting depth would exceed `CAP` is classified Depth-capped

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of `X` with subtree height `H`, counting detached descendants ([ATT-4.5](../item-attachment/att-4-legal-parent-depth-cap.md)), and two visible targets, `T_ok` at depth `D` with `D + 1 + H = CAP` and `T_over` at depth `D + 1`, *when* the drag begins, *then* `T_ok` is **Valid** and `T_over` is **Depth-capped**: legal as a parent, but the resulting depth would exceed `CAP`.

**Automation test:** `tests/ui/drag-target-classification.spec.ts`

## DRAG-2.4 — Classification is computed once at drag start and doesn't change mid-gesture

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4

*Given* a drag of `X` in progress, with targets classified as in [DRAG-2.1](drag-2-target-classification.md), [DRAG-2.2](drag-2-target-classification.md) and [DRAG-2.3](drag-2-target-classification.md), *when* the cursor moves across the board, hovering, popping, and entering and leaving contexts, *then* every target keeps the classification it had at drag start. The item being carried doesn't change mid-gesture, so neither does what any target is to it.

**Automation test:** —

## DRAG-2.7 — Every Stub is classified individually

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of Card `X`, and Cards `P` and `Q` with Stubs, where `P`'s Stub `S_P` is a legal parent for `X` and `Q`'s Stub `S_Q` would put `X` past `CAP`, *when* the drag begins, *then* `S_P` is classified **Valid** and `S_Q` **Depth-capped**. No Stub is excluded just for being a Stub.

**Automation test:** `tests/ui/drag-target-classification.spec.ts`

## DRAG-2.8 — A Stub drag is classified exactly like a Card drag, and a place that's no target isn't classified

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4

*Given* a drag of a Stub, *when* the drag begins, *then* every target is classified by the same rules as for a Card drag: Valid, Cycle-forming or Depth-capped ([DRAG-2.1](drag-2-target-classification.md), [DRAG-2.2](drag-2-target-classification.md), [DRAG-2.3](drag-2-target-classification.md)). No target is excluded because the dragged item is a Stub.

*And given* any drag, *when* it begins, *then* the Unsorted bucket, a broken column and an expanded column's outer wrapper carry no classification at all. They're nowhere: no drag enters them, and a release there writes nothing ([DRAG-1.9](drag-1-contexts-and-popping.md)).

**Automation test:** —

## DRAG-2.9 — Cycle-forming wins over Depth-capped

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a drag of `X` with a descendant `D` placed deep enough that `D` would also fail the depth cap as a parent for `X`, *when* the drag begins, *then* `D` is classified **Cycle-forming**, not Depth-capped. A descendant is never a real target for its own ancestor.

**Automation test:** `client/src/components/workflow/dragClassification.test.ts`

## DRAG-2.10 — The board's depth cap is the one the API enforces, carried by `GET /boards/:id`

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §4

*Given* a board, *when* it is read with `GET /boards/:id`, *then* the response carries `itemDepthCap`, equal to the cap the API enforces: a write that puts the moving subtree's deepest item at depth `itemDepthCap` is accepted, and one that puts it at `itemDepthCap + 1` is refused ([ATT-4.4](../item-attachment/att-4-legal-parent-depth-cap.md)). The board classifies Depth-capped targets against that same value, so a target the board classifies Valid is never one the API refuses.

**Automation test:** `server/tests/routes/boards.test.ts`, `tests/ui/drag-target-classification.spec.ts`

## DRAG-2.11 — Depth classification includes pending parent changes and a detaching item's kept parent

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §4, wiki hierarchy-placement §6, wiki item-attachment §11

*Given* `CAP >= 3`, Free Card `A` with attached leaf `Y`, a legal target `B` at depth `CAP - 2`, and a pending write attaching or reparenting `A` under `B`, *when* unrelated leaf Card `X` is picked up before that write's response arrives, *then* classification counts `A` at depth `CAP - 1` and `Y` at depth `CAP`: `A` is **Valid** for `X`, and `Y` is **Depth-capped**. The shallower parent chain awaiting the response doesn't make `Y` Valid.

*And given* instead `D` at depth `CAP`, attached to `P` at depth `CAP - 1`, with a pending detach that previews `D` as a Free Card but keeps `D.parentId = P`, *when* unrelated leaf `X` is picked up, *then* `D` is **Depth-capped**. Its depth still counts the link to `P`; appearing as a Free Card doesn't make it a root item. In both setups classification uses the parent links the pending writes leave, without waiting for their responses.

**Automation test:** —

## DRAG-2.12 — Cycle classification includes pending parent changes and a detaching item's kept parent

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §4, wiki item-attachment §11

*Given* Free Card `A` with a Free child `D` elsewhere on the board, and a pending write attaching or reparenting `A` under Card `X`, *when* `X` is picked up before the response arrives, *then* visible `D` is **Cycle-forming**: the parent chain is `D → A → X`, even though the stored parent of `A` hasn't caught up. `D` is never offered as a Valid parent for `X`.

*And given* instead `D` is a child of `X` whose detach is pending, so it previews as a Free Card while keeping `parentId = X`, *when* `X` is picked up, *then* `D` is **Cycle-forming**. Detaching doesn't break the parent chain, and classification doesn't treat the preview's separate Card as an unrelated root.

**Automation test:** —

## DRAG-2.14 — Valid Cards and Stubs are Full

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4.1

*Given* unrelated Card `P` and its attached Stub `S`, both Valid parents for the carried item `X`, *when* `X` is picked up, *then* each target's own content is drawn at Full strength. The tier does not dim either row or add a relationship color. Both retain their Valid classification: the tier does not replace the legal-parent rule.

**Automation test:** —

## DRAG-2.15 — A Free Card that is not Valid is Mid, never Low

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4.1, wiki board-drag-interaction §6.1

*Given* `X` has a Free descendant Card `D`, and an unrelated Free Card `T` is Depth-capped for `X`, *when* `X` is picked up, *then* `D` remains Cycle-forming and `T` remains Depth-capped, but both are Mid, drawn at `overlayAnchorOpacity`. Neither becomes Low or gains a relationship color. Each can still be the named neighbor for a reposition in its column/sub-row, which assigns no parent; neither can receive `X` as a child. Any attached Stub inside `D` or `T` is Low, at `overlayNeitherOpacity`.

**Automation test:** —

## DRAG-2.16 — A Depth-capped Stub is Mid with a Valid parent, and its children are Low

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4.1, wiki hierarchy-placement §6

*Given* carried item `X` of subtree height `H >= 1`, unrelated parent `P` at absolute depth `CAP - H - 1`, its attached child `S` at `CAP - H`, and an attached child `C` of `S`, with all existing rows within `CAP`, *when* `X` is picked up, *then* `P` is Valid and Full. `S` is Depth-capped as a parent for `X`, but is Mid at `overlayAnchorOpacity`: placing `X` beside `S` gives it parent `P`, and its deepest descendant fits exactly at `CAP`. `C` is Low at `overlayNeitherOpacity`, since placing `X` beside it would give it invalid parent `S`. Every further attached descendant below `C` is Low too. No row is removed or collapsed to express the tier.

**Automation test:** —

## DRAG-2.17 — A dragged Stub's descendants stay drawn at Low and are never placement neighbors

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4.1, wiki board-drag-interaction §7.2

*Given* Stub `X` in Card `P`'s section has an attached child `C` with attached child `G`, both shown, *when* `X` is dragged to a different gap, *then* `C` and `G` stay drawn in the section at Low, at `overlayNeitherOpacity`. They do not ride with the carried copy, and neither is ever Top, Bottom or the named neighbor. Their Low strength stays the same after `X` pops out to the column or zooms into a different Card. The branch still moves with `X` in the hierarchy on release.

*And given* `X` also has a Free descendant Card `D` with attached Stub `D1`, *then* `D` is Mid by the Free Card rule, while `D1` is Low. A detached link does not make `D1` a legal neighbor for its ancestor.

**Automation test:** —

## DRAG-2.18 — An overflow row is Full with a Valid owner and Low otherwise, never Mid

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4.1, wiki board-drag-interaction §9

*Given* visible overflow rows owned by Valid `V`, Depth-capped `T` and Cycle-forming `C` for the carried item, *when* the drag begins, *then* `V`'s overflow row is Full, and `T`'s and `C`'s are Low at `overlayNeitherOpacity`. None is Mid, even when its owner's own row is Mid. Each overflow row remains drawn in place and keeps its count meaning; it never becomes an item or a possible parent itself.

**Automation test:** —

## DRAG-2.19 — Tiers stay fixed across layers and clear when the drag ends

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4.1, wiki board-drag-interaction §10

*Given* `X` is picked up with targets at Full, Mid and Low, *when* the drag moves through Board, column/sub-row and Descendants layers, and into a hierarchy modal, *then* each active target representation retains its pickup tier. A Stub does not dim further just because the drag is in a column, nor a column Card because the drag is in Descendants. *When* the drag ends by a drop, cancel or forced stop, *then* target tiers clear. After a drop, rows at the previewed placement have Full base strength, with a still-pending row's pulse applied independently ([DRAG-6.23](drag-6-preview-reconciliation.md)).

**Automation test:** —

## DRAG-2.20 — The ghost, carried copy, backdrop rows and non-targets take no target tier

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4.1, wiki board-drag-interaction §7.3

*Given* Full, Mid and Low targets, *when* the drag begins, *then* the in-list ghost uses `overlayGhostOpacity`, independently of `overlayNeitherOpacity`, and the carried copy takes none of the target-tier dim. The two named values remain independent even when configured differently. *When* the hierarchy modal opens, *then* its active rows have their own tiers, while static section rows under its backdrop take no target tier. Places that are no target, such as Unsorted, a broken column or the outer wrapper of an expanded column, take none either. Modal-backdrop shading is separate from target-tier opacity.

**Automation test:** —

## DRAG-2.21 — A tier dims only the row's own content, leaving its drop line and nested rows independent

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4.1

*Given* a Mid Free Card `P` with attached Stub `S`, *when* the drag begins, *then* `P`'s own content is drawn at `overlayAnchorOpacity`, and `S`'s at `overlayNeitherOpacity`, rather than their product. A deeper Stub beneath `S` is also Low, no darker from the ancestor tiers. *When* a Mid row is the ghost's named neighbor, *then* its drop line remains at Full strength while the row's own content stays Mid. The same isolation holds for a Mid Stub row's drop line. This case does not prescribe the Card's border or background treatment.

**Automation test:** —

## DRAG-2.22 — Dimmed targets never start a zoom-in or modal-hold cue

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4.1, wiki board-drag-interaction §6.1, wiki board-drag-interaction §7.3

*Given* a Mid Card is the named neighbor, *when* the cursor remains on its zoom-in aim, *then* no zoom-in dwell or progress cue starts and the drag never enters it. *Given* an overflow row whose owner is Depth-capped, *when* the ghost sits beside it at its hidden children's level with the cursor inside the Card, *then* the over-cap state starts no modal dwell, shows no hold-progress cue, and opens no modal. *Given* instead a Cycle-forming owner, *then* its overflow row is passed over, never named, and cannot start the hold. A Full overflow row with a Valid owner retains the ordinary valid hold behavior ([DRAG-7.13](drag-7-overflow-and-hierarchy-modal.md)).

**Automation test:** —

## DRAG-2.23 — Tier assignment uses pending attachment and parent changes at pickup

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §4, wiki board-drag-interaction §4.1, wiki board-drag-interaction §10, wiki item-attachment §11

*Given* carried item `X` has subtree height 1, unrelated `P` is at depth `CAP - 2`, unrelated `Q` at `CAP - 1`, and leaf `D` has a pending attach or reparent, *when* `X` is picked up before that write responds, *then*:

- previewed as a Stub of `P`, `D` is Depth-capped but Mid, since its previewed parent `P` is Valid for `X`;
- previewed as a Stub of `Q`, `D` is Low, since its previewed parent `Q` is Depth-capped for `X`.

Neither `D`'s stored attachment flag nor its previous parent determines its tier. *Given* instead `D` has a pending detach from `Q`, *then* it previews as a Free Card and is Mid, while keeping `parentId = Q` and its Depth-capped classification. *Given* a child `D` of carried Card `X` is pending detach, *then* its previewed Free Card is Cycle-forming and Mid; with a pending attach into `X`, there is no separate Free Card for `D`, since the carried Card's attached Stubs are not shown. Pending writes are counted as landed for tier assignment, without waiting for their responses.

**Automation test:** —
