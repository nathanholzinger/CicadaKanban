# Cross-cutting / regression guards

Explicitly "already correct, don't break" behaviors named in the design —
see [`../../wiki/item-positioning/#already-correct-not-touched-by-this-feature`](../../wiki/item-positioning/README.md#already-correct-not-touched-by-this-feature).

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-X.1 | Detached-child free positioning unaffected | P1 | ⏳ pending triage |
| TC-X.2 | Cycle prevention still holds | P1 | ✅ automated |
| TC-X.3 | Same-project reparent constraint still holds | P1 | ✅ automated |
| TC-X.4 | MCP tools reflect new scoping/resolution rules | P1 | ⏳ pending triage |
| TC-X.5 | Minimal anchor=card/side=before default is what ships now | P2 | ⏳ pending triage |

---

## TC-X.1 — Detached-child free positioning unaffected

**Priority:** P1 (regression/guard) · **Automated:** ⏳ pending triage

*Given* detached children sharing a workphase, *when* they're reordered,
*then* behavior matches pre-feature behavior (this feature explicitly does
not touch it).

**Automation test:** — *(likely already covered by pre-`epic-3-complete`
tests outside the reconciled scope — not confirmed, not searched for)*

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

## TC-X.4 — MCP tools reflect new scoping/resolution rules

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `create_item` and `move_item` MCP tools, *when* used to create an
attached child or move an item with an anchor, *then* the resulting
position/scope matches what the equivalent UI/API action would produce
([TC-3.4](part-3-attached-sibling-reorder.md), [TC-2.1](part-2-anchor-resolution.md) families).

**Automation test:** — *(no MCP tool test content exists in any of the
reconciled files at all)*

## TC-X.5 — Minimal anchor=card/side=before default is what ships now

**Priority:** P2 · **Automated:** ⏳ pending triage

Epic 3.5's deferred visual anchor/side hover cue is out of scope; the
minimal default (drop-on-card-X resolves anchor=X, side=`before`) is what
this feature ships. *Given* a drop directly on another card with no finer
hover-half detection, *when* resolved, *then* it behaves as anchor = that
card, side = `before` — no test should assume a polished upper/lower-half
indicator exists yet.

**Automation test:** — *(the client's `DropResolution` type has no `side`
field at all; nothing in scope verifies the client defaults to
`side: 'before'` when translating a card-drop into an API call)*
