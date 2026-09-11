# Test Plan — Board Drag Interaction

**Feature:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/)
**Derived from:** the wiki page as of Epic 3.5 (2026-09-10). No
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
feel, ghost/highlight rendering quality, overlay palette/weight/animation,
or the dev/test panel itself (per the Product Owner, 2026-09-10).

**Parameterization.** The pop threshold (`THRESHOLD`, provisionally
0.5 s), the column bands (`TOP_BAND`/`BOTTOM_BAND`, provisionally 20%),
the Stub bands (`FIRST_CHILD_BAND`/`LAST_CHILD_BAND`/`POP_BAND`,
provisionally 50/50 and 20–80%), and the depth cap (`CAP`, provisionally
6) are all settled *as tunable parameters*. Every case is written against
the name, never the provisional literal.

## Suites

| Suite | Cases | P0 | P1 | P2 |
|---|---|---|---|---|
| [DRAG-1 — Contexts, reposition default, popping](drag-1-contexts-and-popping.md) | 8 | 8 | 0 | 0 |
| [DRAG-2 — Target classification](drag-2-target-classification.md) | 7 | 4 | 2 | 1 |
| [DRAG-3 — Card → column drop bands](drag-3-card-column-bands.md) | 11 | 8 | 3 | 0 |
| [DRAG-4 — Card → Card attach, Stub bands, hierarchy placement](drag-4-attach-and-stub-placement.md) | 13 | 8 | 5 | 0 |
| [DRAG-5 — Stub → out: detach, depth overflow](drag-5-detach-and-overflow.md) | 8 | 5 | 2 | 1 |
| [DRAG-6 — Optimistic preview, reconciliation, failure](drag-6-preview-reconciliation.md) | 6 | 5 | 1 | 0 |
| **Total** | **53** | **38** | **13** | **2** |

## Status

**All 53 cases are ⏳ pending triage.** Nothing has been compared against
existing automation yet — that's the Test Reconciler's pass. Several
cases supersede Epic 3.2 interim guards in
[`../item-positioning/`](../item-positioning/): `TC-3.3` → DRAG-5.1–5.5
and DRAG-2.7; `TC-X.5` → DRAG-4.5; the resync half of `TC-2.11` →
DRAG-6.6.

## Explicitly not covered (wiki "Open questions" — do not derive)

- **Overlay visual treatment (§4)** — classification states are
  catalogued (DRAG-2); palette/weight/animation are not.
- **Free-item reparent as a board gesture** — no case; see
  [`../item-attachment/INDEX.md`](../item-attachment/INDEX.md).

## Flagged for the Product Owner

1. **§10 — two descriptions of the pre-response state.** The section opens
   with "the board previews a drop ordinally: the item is placed at the
   ghost's index," and closes with "the board may briefly show its
   pre-drop order until the response lands … a documented, deliberate
   tradeoff carried over from Epic 3.2." Under the amended §2 client-side
   role those read as different behaviors. DRAG-6.1 is written to the
   ordinal-preview statement; no case asserts the pre-drop-order
   statement. If the closing paragraph is a stale carry-over, it should
   go; if it describes a real transient (e.g. between release and preview
   render), it should say when.
2. **§4 — what is Inert?** The table defines Inert as "not a target for
   this drag at all" but nothing on the page names an example. No case
   asserts anything is Inert. If there are intended Inert targets (e.g.
   a column region during a Stub drag that can't detach?), name one.
3. **§7.2 option 3 — where among the anchor's children.** "Below an anchor,
   indented right → child of the anchor" settles the parent but not the
   placement among the anchor's existing children (first? last? anchored
   to the child nearest the cursor?). DRAG-4.10 asserts parent and
   attachment only.
4. **§9 — the overflow-modal hold threshold.** "Holding past a threshold"
   doesn't say whether this is the pop `THRESHOLD` or its own parameter.
   DRAG-5.6 parameterizes on "whatever the panel exposes for it."
