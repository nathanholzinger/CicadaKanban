# Test Plan — Board Drag Interaction

**Feature:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/)
**Derived from:** the wiki page as of 2026-09-17 — Stories 1–4 built
(§1.1 layer stack, §5 carve-out bands, §5a, §6 auto-drop, §10 #15/#22)
and Stories 5/6 settled but unbuilt (§1.1 Descendants layer, §7
depth-range placement, §8 two-pop detach). The Story 5/6 rules were
first taken from the Product Owner's design docs ("DnD Gestures at each
Context Layer", "Placement rules for a Hierarchy") and then hardened into
the wiki the same day, so the wiki is again the sole source. Stories 7–9
(§9 overflow, visual polish, Free-item reparent) are open questions with
no cases. No implementation code or existing test files were consulted —
see `../README.md` for why.

**Suite IDs:** `DRAG-1` … `DRAG-6`. Cases are `TC-n` inside each suite
file; from outside a suite, refer to a case as `DRAG-<suite>.<n>` (e.g.
`DRAG-3.9`).

## The model the cases are written against

A drag is always in exactly one of four **layers** — Board → Column/sub-row
→ Card → Descendants (Story 6) — and three rules govern every transition
([DRAG-1](drag-1-contexts-and-popping.md) header): **(1)** a release
always commits the *locked* layer's within-action, wherever the bare
cursor rests; **(2)** a pop moves exactly one layer; **(3)** zooming in is
duration-only, zooming out is duration or distance. The within-actions:
Board → the hovered region's band ([DRAG-3](drag-3-card-column-bands.md));
Column/sub-row → anchor+side reposition; Card → the **auto-drop** (last
child for an item from outside; set back down for the Card's own Stub —
[DRAG-4](drag-4-attach-and-stub-placement.md), [DRAG-5.12](drag-5-detach-and-overflow.md));
Descendants → hierarchy placement by gap and depth range,
`[Bottom … Top + 1]` ([DRAG-4](drag-4-attach-and-stub-placement.md)
header), shared with the project sidebar. A Stub drag starts at
Descendants ([DRAG-5](drag-5-detach-and-overflow.md)).

## What is and isn't here

The wiki splits its rules into drop **resolution** (given a release here,
after this cursor behavior, what change commits) and interaction **feel**
(does the pop feel right, does the ghost read as nesting). Only the first
half is catalogued; the second is manual verification by design, not a
gap. Consequently there are **no cases** for: the tilt, the axis-lock
feel, the pop-snap tween, the locked-layer outline, ghost/highlight
rendering quality, the band guide lines and tint, overlay
palette/weight/dimming/animation, or the dev/test panel itself — its
values, where it lives, who sees it, and its eventual retirement. Two P2
exceptions are catalogued because the wiki states them as rules rather
than looks: the band *label text* (DRAG-3.18 — assertable per the
Product Owner, 2026-09-17) and the dragged card's collapse with its
children unrendered (DRAG-3.19).

**Parameterization.** Four clocks, all tunable and none settled:
`POP_OUT` (with optional `POP_OUT_DISTANCE`, shipped disabled; shared by
every layer's zoom-out), `POP_IN` (Board → Column), `CARD_POP_IN` (Column
→ Card, duration-only), `DESC_POP_IN` (Card → Descendants, duration-only,
Story 6 — name assumed). The column bands derive from one pixel value,
`GHOST_H` (`ghostCardHeightPx`, provisionally 96px); the former
`TOP_BAND`/`BOTTOM_BAND` percentages and the Stub bands
(`FIRST_CHILD_BAND`/`LAST_CHILD_BAND`/`POP_BAND`) are retired. The depth
cap is `CAP` (provisionally 6). Every case is written against the name,
never the provisional literal.

**Automation split (§3.1 ruling, 2026-09-15).** Automated tests assert
*reachability* — that it is possible to pop out, pop in, zoom into a Card,
place in a column — and the correctness of the resulting write. A case
whose pass depends on a threshold value stays manual until the values
lock, and may stay manual even then. Such cases carry an **Automation
note** (DRAG-1.3 in part, DRAG-1.11, DRAG-1.14, DRAG-1.18, DRAG-1.19,
DRAG-5.11). The
Automated column is untouched by this — it remains the Test Reconciler's
to set — but the reconciler should read a threshold-timed case as "manual
by rule," not as an automation gap.

## Suites

| Suite | Cases | P0 | P1 | P2 | ⏸ superseded |
|---|---|---|---|---|---|
| [DRAG-1 — Contexts, layer stack, popping](drag-1-contexts-and-popping.md) | 20 | 12 | 7 | 1 | 1 |
| [DRAG-2 — Target classification](drag-2-target-classification.md) | 8 | 4 | 3 | 1 | 0 |
| [DRAG-3 — Card → column drop bands (Board layer)](drag-3-card-column-bands.md) | 19 | 9 | 7 | 3 | 0 |
| [DRAG-4 — Card → Card attach, Descendants placement](drag-4-attach-and-stub-placement.md) | 15 | 9 | 6 | 0 | 3 |
| [DRAG-5 — Stub → out: detach, depth overflow](drag-5-detach-and-overflow.md) | 9 | 7 | 2 | 0 | 3 |
| [DRAG-6 — Optimistic preview, reconciliation, failure](drag-6-preview-reconciliation.md) | 11 | 5 | 6 | 0 | 0 |
| **Total** | **82** | **46** | **31** | **5** | **7** |

Superseded and withdrawn cases stay in place under their IDs with a
"was:" note and drop out of the counts: DRAG-1.15 (Card hit-tested before
column — Cards are never Board-layer regions), DRAG-4.4 (attach at an
anchored slot), DRAG-4.6 and DRAG-4.7 (the Stub bands), and DRAG-5.6–5.8
(the §9 overflow modal — withdrawn until Story 7 decides whether one
exists).

## Status

**All 82 active cases are ⏳ pending triage.** Nothing has been compared
against existing automation yet — that's the Test Reconciler's pass.
Several cases supersede Epic 3.2 interim guards in
[`../item-positioning/`](../item-positioning/): `TC-3.3` → DRAG-5.1–5.5
and DRAG-2.7; `TC-X.5` → DRAG-4.5; the resync half of `TC-2.11` →
DRAG-6.6.

**Written ahead of the code:**
- **Story 5** (detach): DRAG-5.1–5.5, 5.9–5.12; DRAG-1.1's Stub bullet.
- **Story 6** (Descendants layer): DRAG-1.21, DRAG-4.8–4.11, 4.18; the
  Descendants half of DRAG-1.5 and DRAG-1.18.
- **Story 7** (overflow): nothing — DRAG-5.6–5.8 withdrawn.

These are expected to be unreachable against the current build; that is
the catalog doing its job, not a defect in the case.

## Explicitly not covered (wiki "Open questions" — do not derive)

- **Overlay visual treatment (§4)** — classification states are
  catalogued (DRAG-2); palette/weight/dimming/animation are not.
- **Free-item reparent as a board gesture** (Story 9) — no case; see
  [`../item-attachment/INDEX.md`](../item-attachment/INDEX.md).

## Flagged for the Product Owner

Items 1–13 are resolved (3–13 by Product Owner rulings on 2026-09-17,
now carried by the wiki); 14 is an open follow-up for the hierarchy
design doc only — the wiki's §7 already has the agreed wording.

1. ~~§10 — two descriptions of the pre-response state.~~ Resolved
   2026-09-15 (DRAG-6.1).
2. ~~§4 — what is Inert?~~ Resolved by the Story 2 text (DRAG-2.8).
3. ~~**§7.2 option 3 — where among the anchor's children.**~~
   **Resolved:** tabbed right of Top → Top's **first child**; any other
   slot is reached by anchoring against a sibling. Superseded wholesale
   by the "Placement rules for a Hierarchy" doc's depth-range rule, which
   DRAG-4.8–4.11 and 4.18 are now written to (see flag 14).
4. ~~**§9 — the overflow-modal hold threshold.**~~ **Withdrawn:** Story 7
   will decide whether an overflow modal exists at all; DRAG-5.6–5.8 are
   ⏸ withdrawn and nothing is planned for §9.
5. ~~**§5 middle band, "already in this column," in expanded mode.**~~
   **Resolved:** the wiki should read "already in this column *or
   sub-row*"; DRAG-3.12's region reading stands.
6. ~~**Descendants zoom-out — one layer or two?**~~ **Resolved:** always
   one layer, Descendants → Card → column; no two-at-once rule. The
   distance term is expected to make a decisive pull satisfy both pops in
   quick succession (DRAG-1.19, DRAG-1.21, DRAG-5.11).
7. ~~**A Stub drag starts at Descendants layer.**~~ **Resolved:** yes, so
   a Stub can be reordered manually (DRAG-1.1, DRAG-5.9). The wiki's §1
   "a Stub's context is its parent Card" is incorrect under the layer
   model and should say Descendants.
8. ~~**§7.1 is superseded.**~~ **Resolved:** there is no band; the only
   options are the auto-drop (last child — flag 13) or zoom into the
   hierarchy to place manually (DRAG-4.4/4.6/4.7 stay ⏸).
9. ~~**A childless Card has no Descendants layer.**~~ **Resolved:** with
   no descendants there is nothing to reposition or reparent, so the
   auto drop is the only option (DRAG-1.21, DRAG-4.12).
10. ~~**`DESC_POP_IN` is its own clock.**~~ Kept as a name; whether it
    shares a value with `CARD_POP_IN` is a tuning matter and changes no
    case.
11. ~~**Band labels — rules or looks?**~~ **Resolved:** the label text is
    assertable (DRAG-3.18). DRAG-3.19 (§5a collapse) stays P2 as a stated
    rule.
12. ~~**Wiki edits owed.**~~ **Resolved 2026-09-17** — the wiki now
    carries: §1 a Stub's context is its parent's Descendants layer; §1.1
    four layers, Descendants unreachable for a childless Card; §3.2 the
    invalid-tab-state exception; §5 "already in this column or sub-row";
    §6 the auto-drop's two cases; §7 rewritten as the Descendants layer's
    depth-range rule; §8 the two-pop detach path and the set-back-down
    stop; §9 moved to Open questions. DRAG-4/5 are re-derivable from the
    wiki alone again.
13. ~~**Auto-drop first vs. last child.**~~ **Resolved:** two different
    gestures, two cases. The Card-layer **auto-drop** for an item brought
    in from outside is the **last** child (Story 4 as built — DRAG-4.1,
    4.14; DRAG-5.4). **Manually** dragging a Stub to sit directly beneath
    a line item at Descendants layer, tabbed right, lands it as that
    item's **first** child (DRAG-4.9). The earlier addendum wording
    ("'auto' defaults to 'first child'") is withdrawn.
14. **Hierarchy doc edits agreed but not yet made** ("Placement rules
    for a Hierarchy", review 2026-09-17): say "shallowest/deepest" rather
    than "highest/lowest depth" (the code's depth increases downward);
    state that "after Top" means after Top's whole subtree; record the
    reachable-but-invalid tab state as an explicit exception to §3.2;
    name the root per context (project in the sidebar, the Card on the
    board — never tab out of it) and that the cap uses the Card's
    absolute depth; state the empty-hierarchy case; state that offsets
    past the range clamp. The DRAG-4 header already reflects all six.
