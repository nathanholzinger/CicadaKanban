# Cross-cutting / regression guards

Explicitly "already correct, don't break" behaviors named in the design —
see [`../../wiki/item-positioning/#already-correct-not-touched-by-this-feature`](../../wiki/item-positioning/README.md#already-correct-not-touched-by-this-feature).

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-X.1 | Detached-child free positioning unaffected | P1 | ✅ automated |
| TC-X.2 | Cycle prevention still holds | P1 | ✅ automated |
| TC-X.3 | ~~Same-project reparent constraint still holds~~ — superseded by Epic 3.5 | — | ⏸ superseded |
| TC-X.5 | ~~Minimal anchor=card/side=before default is what ships now~~ — superseded by Epic 3.5 | — | ⏸ superseded |
| TC-X.6 | An item excludes its own stale row from its own scope query | P1 | ✅ automated |

---

## TC-X.1 — Detached-child free positioning unaffected

**Priority:** P1 (regression/guard) · **Automated:** ✅ automated

*Given* detached children sharing a workphase, *when* they're reordered,
*then* behavior matches pre-feature behavior (this feature explicitly does
not touch it).

**Automation test:** `items.test.ts` › `describe('detached siblings
sharing one workphase (TC-X.1 — unaffected pre-feature reorder
behavior)', ...)` — three boundary/interior anchor+side moves on plain
detached A/B/C siblings, with a fresh-GET persisted-order check on each.
The original "likely already covered outside scope" hedge turned out to
be wrong — a broader search (beyond the reconciled 8 files, across the
whole suite) found no coverage anywhere before this.

## TC-X.2 — Cycle prevention still holds

**Priority:** P1 (regression/guard) · **Automated:** ✅ automated

*Given* an attempted reparent that would create a cycle, *when* attempted
alongside a position change, *then* the cycle is still rejected exactly as
before.

*(Epic 3.5 restates cycle prevention as a validity rule in
[`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md) §7;
the fuller cases — self, direct child, deeper descendant, and the UI-side
"cycle-forming" classification — are
[`../item-attachment/att-4-legal-parent-depth-cap.md`](../item-attachment/att-4-legal-parent-depth-cap.md)
ATT-4.2/4.3 and
[`../board-drag-interaction/drag-2-target-classification.md`](../board-drag-interaction/drag-2-target-classification.md)
DRAG-2.2. This guard stays as-is: the rule is unchanged.)*

**Automation test:** `server/tests/routes/items.test.ts` › "rejects an item
becoming its own parent or reparenting to a descendant"

## TC-X.3 — ~~Same-project reparent constraint still holds~~ (superseded by Epic 3.5)

**Priority:** — · **Automated:** ⏸ superseded

*Superseded by Epic 3.5.* The same-project reparent constraint is
deliberately **lifted** — reparenting across projects that share a
workflow is now allowed and cascades the new project to the moved subtree.
The replacing cases:
[`../item-attachment/att-5-cross-project-reparenting.md`](../item-attachment/att-5-cross-project-reparenting.md)
ATT-5.1–5.3, and the positioning consequence
[Part 7 TC-7.14](part-7-board-placement-intents.md).

The cross-*workflow* case has no rule yet and no case — see
[`../../planning/epic-7-decisions.md`](../../planning/epic-7-decisions.md).

*Was:* "Given an attempted reparent across projects, when attempted, then
it is still rejected exactly as before, independent of any position
resolution changes."

**Automation test:** *(previous mapping — `items.test.ts` › "rejects
reparenting an item under a parent in a different project (finding #11)"
— now asserts the opposite of the wiki; expected to be inverted into
ATT-5.1's automation.)*

## TC-X.5 — ~~Minimal anchor=card/side=before default is what ships now~~ (superseded by Epic 3.5)

**Priority:** — · **Automated:** ⏸ superseded

*Superseded by Epic 3.5.* The Epic 3.2 interim — "dropping directly on
card X resolves to anchor = X, side = `before`, with no finer hover
detection" — is replaced by the full drop model: a drop on a Card without
a sustained hold is a *reposition* resolved by anchor+side hovering within
a column context, and a sustained hold *attaches*. The replacing cases:
[`../board-drag-interaction/drag-1-contexts-and-popping.md`](../board-drag-interaction/drag-1-contexts-and-popping.md)
and
[`../board-drag-interaction/drag-4-attach-and-stub-placement.md`](../board-drag-interaction/drag-4-attach-and-stub-placement.md)
DRAG-4.5.

The rect-measurement mismatch this case's previous automation note
described (dnd-kit's swap-preview reflow vs. `resolveDropSide`) is
implementation detail for the coder building the gesture, not a business
rule — the test plan carries no case for it.

*Was:* "Given a drop directly on another card with no finer hover-half
detection, when resolved, then it behaves as anchor = that card, side =
`before`."

**Automation test:** *(previous mapping — `dragCollision.test.ts` ›
`resolveDropSide` (7 cases, split out of the retired `boardDndUtils.test.ts`)
— is pure-function coverage of a mechanism the new gesture may or may not
keep; the Test Reconciler should decide whether it maps to any DRAG case.)*

## TC-X.6 — An item excludes its own stale row from its own scope query

**Priority:** P1 (regression/guard) · **Automated:** ✅ automated

*Given* an item being repositioned, *when* its own comparison scope is
queried for true neighbors, *then* its own (possibly just-updated, now
stale) row is excluded from that query — otherwise an item could end up
comparing against its own pre-move position. A regression-style
implementation-correctness guard rather than a stated product-facing
business rule (closer to `positionScopeFor`'s `excludeId` parameter
working correctly than to a rule a user would ever observe directly),
which is why it lives here alongside TC-X.2/X.3 rather than in Part 2's
more rule-driven cases.

**Automation test:** `items.test.ts` › "excludes the item itself from its
own scope query on reposition (TC-X.6)"
