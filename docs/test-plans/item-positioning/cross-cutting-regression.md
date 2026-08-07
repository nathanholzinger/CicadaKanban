# Cross-cutting / regression guards

Explicitly "already correct, don't break" behaviors named in the design —
see [`../../wiki/item-positioning/#already-correct-not-touched-by-this-feature`](../../wiki/item-positioning/README.md#already-correct-not-touched-by-this-feature).

| ID | Case | Priority | Automated | Automation test |
|---|---|---|---|---|
| TC-X.1 | Detached-child free positioning unaffected | P1 | ⏳ pending triage | — |
| TC-X.2 | Cycle prevention still holds | P1 | ⏳ pending triage | — |
| TC-X.3 | Same-project reparent constraint still holds | P1 | ⏳ pending triage | — |
| TC-X.4 | MCP tools reflect new scoping/resolution rules | P1 | ⏳ pending triage | — |
| TC-X.5 | Minimal anchor=card/side=before default is what ships now | P2 | ⏳ pending triage | — |

---

## TC-X.1 — Detached-child free positioning unaffected

**Priority:** P1 (regression/guard) · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* detached children sharing a workphase, *when* they're reordered,
*then* behavior matches pre-feature behavior (this feature explicitly does
not touch it).

## TC-X.2 — Cycle prevention still holds

**Priority:** P1 (regression/guard) · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an attempted reparent that would create a cycle, *when* attempted
alongside a position change, *then* the cycle is still rejected exactly as
before.

## TC-X.3 — Same-project reparent constraint still holds

**Priority:** P1 (regression/guard) · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an attempted reparent across projects, *when* attempted, *then* it
is still rejected exactly as before, independent of any position
resolution changes.

## TC-X.4 — MCP tools reflect new scoping/resolution rules

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* `create_item` and `move_item` MCP tools, *when* used to create an
attached child or move an item with an anchor, *then* the resulting
position/scope matches what the equivalent UI/API action would produce
([TC-3.4](part-3-attached-sibling-reorder.md), [TC-2.1](part-2-anchor-resolution.md) families).

## TC-X.5 — Minimal anchor=card/side=before default is what ships now

**Priority:** P2 · **Automated:** ⏳ pending triage · **Automation test:** —

Epic 3.5's deferred visual anchor/side hover cue is out of scope; the
minimal default (drop-on-card-X resolves anchor=X, side=`before`) is what
this feature ships. *Given* a drop directly on another card with no finer
hover-half detection, *when* resolved, *then* it behaves as anchor = that
card, side = `before` — no test should assume a polished upper/lower-half
indicator exists yet.
