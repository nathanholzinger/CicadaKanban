# Test Plan — Board Drag Interaction

**Feature:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/)
**Derived from:** the wiki page as of Epic 3.5 (2026-09-10), updated for
the 2026-09-11 (two-way pop model, frozen band rect) and 2026-09-15
(bounded regions, pop-in clock semantics, set-down no-write, scroll-
following rect, stale-response resync, automation split) amendments. No
implementation code or existing test files were consulted when deriving
these — see `../README.md` for why.

**Suite IDs:** `DRAG-1` … `DRAG-6`. Cases are `TC-n` inside each suite
file; from outside a suite, refer to a case as `DRAG-<suite>.<n>` (e.g.
`DRAG-3.9`).

## What is and isn't here

The wiki splits its rules into drop **resolution** (given a release here,
after this cursor behavior, what change commits) and interaction **feel**
(does the pop feel right, does the ghost read as nesting). Only the first
half is catalogued; the second is manual verification by design, not a
gap. Consequently there are **no cases** for: the tilt, the axis-lock
feel, the pop-snap tween, ghost/highlight rendering quality, the band
guide lines and band tint, overlay palette/weight/dimming/animation, or
the dev/test panel itself — its values, where it lives, who sees it, and
its eventual retirement (per the Product Owner, 2026-09-10; panel
placement ruled unspecified 2026-09-15).

**Parameterization.** Popping has two clocks (§3.1, model ratified
2026-09-15, values unsettled): `POP_OUT` (with an optional
`POP_OUT_DISTANCE` term, shipped disabled) and `POP_IN`, defined in
[DRAG-1](drag-1-contexts-and-popping.md). DRAG-4 and DRAG-5 (Stories 4–6,
not yet built) still say `THRESHOLD`; read it as the two clocks run back
to back, to be split when those suites are refreshed for their stories.
The column bands (`TOP_BAND`/`BOTTOM_BAND`, provisionally 20%), the Stub
bands (`FIRST_CHILD_BAND`/`LAST_CHILD_BAND`/`POP_BAND`, provisionally
50/50 and 20–80%), and the depth cap (`CAP`, provisionally 6) are all
settled *as tunable parameters*. Every case is written against the name,
never the provisional literal.

**Automation split (§3.1 ruling, 2026-09-15).** Automated tests assert
*reachability* — that it is possible to pop out, pop in, place in a
column — and the correctness of the resulting write. A case whose pass
depends on a threshold value ("move here, wait this long, expect that")
stays manual until the values lock, and may stay manual even then. Such
cases carry an **Automation note** in their detail block (DRAG-1.3 in
part, DRAG-1.11, DRAG-1.14). The Automated column is untouched by this —
it remains the Test Reconciler's to set — but the reconciler should read
a threshold-timed case as "manual by rule," not as an automation gap.

## Suites

| Suite | Cases | P0 | P1 | P2 |
|---|---|---|---|---|
| [DRAG-1 — Contexts, reposition default, popping](drag-1-contexts-and-popping.md) | 15 | 9 | 5 | 1 |
| [DRAG-2 — Target classification](drag-2-target-classification.md) | 8 | 4 | 3 | 1 |
| [DRAG-3 — Card → column drop bands](drag-3-card-column-bands.md) | 14 | 9 | 5 | 0 |
| [DRAG-4 — Card → Card attach, Stub bands, hierarchy placement](drag-4-attach-and-stub-placement.md) | 13 | 8 | 5 | 0 |
| [DRAG-5 — Stub → out: detach, depth overflow](drag-5-detach-and-overflow.md) | 8 | 5 | 2 | 1 |
| [DRAG-6 — Optimistic preview, reconciliation, failure](drag-6-preview-reconciliation.md) | 7 | 5 | 2 | 0 |
| **Total** | **65** | **40** | **22** | **3** |

## Status

**All 65 cases are ⏳ pending triage.** Nothing has been compared against
existing automation yet — that's the Test Reconciler's pass. Several
cases supersede Epic 3.2 interim guards in
[`../item-positioning/`](../item-positioning/): `TC-3.3` → DRAG-5.1–5.5
and DRAG-2.7; `TC-X.5` → DRAG-4.5; the resync half of `TC-2.11` →
DRAG-6.6.

**Written ahead of the code (wiki rules marked "code pending"):** DRAG-1.9
and DRAG-1.10 (bounded/visible regions), DRAG-3.14 (frozen rect follows
scroll), DRAG-6.7 (stale-response resync). DRAG-1.15 (Card region
hit-test precedence) is reachable only once Story 4 lands Card regions.
These are expected to fail or be unreachable against the current build;
that is the catalog doing its job, not a defect in the case.

## Explicitly not covered (wiki "Open questions" — do not derive)

- **Overlay visual treatment (§4)** — classification states are
  catalogued (DRAG-2); palette/weight/dimming/animation are not.
- **Free-item reparent as a board gesture** — no case; see
  [`../item-attachment/INDEX.md`](../item-attachment/INDEX.md).

Also not derived, though not in "Open questions": the **interim picture
during a re-drag of a pending item** (§10, "accepted for now," slated to
change with reconciliation #15/#22) — see the DRAG-6 header note.

## Flagged for the Product Owner

1. ~~**§10 — two descriptions of the pre-response state.**~~ **Resolved
   2026-09-15:** the wiki now states the placement is applied
   synchronously on release, before the request is sent, and retires the
   pre-drop-order transient. DRAG-6.1 rewritten to that rule.
2. ~~**§4 — what is Inert?**~~ **Resolved** by the Story 2 text naming
   the Inert set (Unsorted, a broken column, an expanded column's outer
   wrapper; and, interim, everything outside a Stub's own sibling list).
   DRAG-2.8 added.
3. **§7.2 option 3 — where among the anchor's children.** "Below an anchor,
   indented right → child of the anchor" settles the parent but not the
   placement among the anchor's existing children (first? last? anchored
   to the child nearest the cursor?). DRAG-4.10 asserts parent and
   attachment only.
4. **§9 — the overflow-modal hold threshold.** "Holding past a threshold"
   doesn't say whether this is the pop `THRESHOLD` or its own parameter.
   DRAG-5.6 parameterizes on "whatever the panel exposes for it."
5. **§5 middle band, "already in this column," in expanded mode.** The
   new middle-band text says an item *already in this column (a
   covered-set member, §8)* released there is set back down with nothing
   written. In a merged column that's unambiguous. In an expanded column
   the region is a sub-row, and §5's expanded-column paragraph says a
   drop resolves to the sub-row's *exact* workphase — so a covered-set
   member from sub-row `W2` released in sub-row `W3`'s middle band must be
   a workphase change, not a set-down. DRAG-3.12 is written to that
   reading ("already in this *region*"); if "column" was meant literally
   for expanded mode too, DRAG-3.12 and DRAG-1.6 conflict and the wiki
   should say which wins.
6. **§10 — re-drag interim picture.** When reconciliation #15/#22 land
   (restore the pending marker on cancel; keep the ghost through a
   mid-drag response), the "accepted for now" paragraph should be
   replaced with the settled behavior so cases can be derived from it.
   Nothing is catalogued from the interim description.
