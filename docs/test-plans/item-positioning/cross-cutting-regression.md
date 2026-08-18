# Cross-cutting / regression guards

Explicitly "already correct, don't break" behaviors named in the design —
see [`../../wiki/item-positioning/#already-correct-not-touched-by-this-feature`](../../wiki/item-positioning/README.md#already-correct-not-touched-by-this-feature).

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-X.1 | Detached-child free positioning unaffected | P1 | ✅ automated |
| TC-X.2 | Cycle prevention still holds | P1 | ✅ automated |
| TC-X.3 | Same-project reparent constraint still holds | P1 | ✅ automated |
| TC-X.5 | Minimal anchor=card/side=before default is what ships now | P2 | ⏸ deferred (Epic 3.5) |

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

**Automation test:** `server/tests/routes/items.test.ts` › "rejects an item
becoming its own parent or reparenting to a descendant"

## TC-X.3 — Same-project reparent constraint still holds

**Priority:** P1 (regression/guard) · **Automated:** ✅ automated

*Given* an attempted reparent across projects, *when* attempted, *then* it
is still rejected exactly as before, independent of any position
resolution changes.

**Automation test:** `items.test.ts` › "rejects reparenting an item under a
parent in a different project (finding #11)"


## TC-X.5 — Minimal anchor=card/side=before default is what ships now

**Priority:** P2 · **Automated:** ⏸ deferred (Epic 3.5)

Epic 3.5's deferred visual anchor/side hover cue is out of scope; the
minimal default (drop-on-card-X resolves anchor=X, side=`before`) is what
this feature ships. *Given* a drop directly on another card with no finer
hover-half detection, *when* resolved, *then* it behaves as anchor = that
card, side = `before` — no test should assume a polished upper/lower-half
indicator exists yet.

**Automation test:** the pure-function mechanics are covered —
`boardDndUtils.test.ts` › `resolveDropSide` (7 cases: missing-rect
defaults, upper/lower region, tie/near-tie/just-outside-epsilon). What's
explicitly **not** chased right now: whether a real browser drag gesture's
measured rects agree with that function closely enough to reliably reach
`side: 'after'` in practice — `tests/ui/item-repositioning-cross-column-dnd.spec.ts`
and `tests/ui/item-repositioning-cross-project-dnd.spec.ts` document a
live mismatch here (dnd-kit's swap-preview reflow interacting with the
rect measurement), but that's exactly the kind of drag-and-drop tune-up
Epic 3.5 owns — deferred, not a gap to close now.
