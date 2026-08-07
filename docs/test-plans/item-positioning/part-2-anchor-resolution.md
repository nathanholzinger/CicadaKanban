# Part 2 — Anchor+side position resolution

**Wiki:** [`../../wiki/item-positioning/#2-position-resolution-anchor--side`](../../wiki/item-positioning/README.md#2-position-resolution-anchor--side)

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-2.1 | Insert between two existing neighbors | P0 | ✅ automated |
| TC-2.2 | Coarsest-fit rounding | P0 | ✅ automated |
| TC-2.3 | Coarsest-fit stops at minimum needed precision | P1 | ⏳ pending triage |
| TC-2.4 | Append fallback, no true successor | P0 | ✅ automated |
| TC-2.5 | Append fallback, no true predecessor | P0 | ✅ automated |
| TC-2.6 | Creation with no anchor at all | P1 | ✅ automated |
| TC-2.7 | Bootstrap: brand-new empty scope | P0 | ⏳ pending triage |
| TC-2.8 | Bootstrap collision avoidance across two empty scopes | P0 | ⏳ pending triage |
| TC-2.9 | Narrow view cannot leapfrog past an unseen true neighbor | P0 | ✅ automated |
| TC-2.10 | True neighbor lookup ignores visibility, only reality | P0 | ✅ automated |
| TC-2.11 | Server resolution is authoritative over a stale client guess | P0 | ⏳ pending triage |
| TC-2.12 | Precision exhaustion triggers reindex-then-retry | P0 | ✅ automated |
| TC-2.13 | `positionScope` = `"attached-siblings"` | P1 | ⏳ pending triage |
| TC-2.14 | `positionScope` = `"workphase"` | P1 | ⏳ pending triage |
| TC-2.15 | `positionScope` = `"none"` for a done item | P1 | ⏳ pending triage |
| TC-2.16 | `position`'s shape is unchanged | P2 | ⏳ pending triage |
| TC-2.17 | Attach → detach reassigns position | P0 | ✅ automated |
| TC-2.18 | Detach → attach reassigns position | P0 | ✅ automated |
| TC-2.19 | Reparent while staying attached reassigns position | P0 | ✅ automated |
| TC-2.20 | Reorder-only move does not reassign a fresh position | P0 | ✅ automated |
| TC-2.21 | Cascade to attached descendants leaves position untouched | P0 | ⏳ pending triage |
| TC-2.22 | Active → done transition reassigns per Part 6 rules | P0 | ✅ automated |

---

### Core resolution algorithm

## TC-2.1 — Insert between two existing neighbors

**Priority:** P0 · **Automated:** ✅ automated

*Given* items at positions 1.0 and 2.0 in a comparison scope, *when* a new
item is inserted with anchor = the item at 1.0, side = `after`, *then* the
resolved position is strictly between 1.0 and 2.0, and it is the coarsest
decimal value that fits (see TC-2.2).

**Automation test:** `server/tests/lib/positionResolver.test.ts` ›
`resolveAnchorPosition` › "coarsest-fits between the anchor and its true
next neighbor"; also duplicated at the integration layer by
`server/tests/routes/items.test.ts` › "move resolves anchorId+side against
the true neighbor, not a client-supplied guess"

## TC-2.2 — Coarsest-fit rounding

**Priority:** P0 · **Automated:** ✅ automated

*Given* two neighbors at 1.5 and 2.0, *when* resolving an insert between
them, *then* the result is 1.8 (the coarsest 1-decimal value that fits),
not the raw midpoint 1.75.

**Automation test:** `positionResolver.test.ts` › `coarsestFit` › "rounds
to the coarsest precision that still fits strictly between the neighbors"
(uses the wiki's exact 1.5/2.0 → 1.8 example)

## TC-2.3 — Coarsest-fit stops at minimum needed precision

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* neighbors at 1.0 and 2.0, *when* resolving an insert between them,
*then* the result is at the coarsest precision level that fits, not an
unnecessarily long decimal.

**Automation test:** — *(candidate: `positionResolver.test.ts` ›
`coarsestFit` › `coarsestFit(1, 3) === 2` — uses different neighbor values
than this case's example; confirm as an acceptable proxy or add a case
matching 1.0/2.0 literally before marking automated)*

## TC-2.4 — Append fallback, no true successor

**Priority:** P0 · **Automated:** ✅ automated

*Given* an anchor item that is the true last item in its comparison scope,
*when* inserting with side = `after`, *then* the resolved position is
`round(anchor + 1.0)` and is strictly greater than the anchor.

**Automation test:** `positionResolver.test.ts` › `resolveAnchorPosition`
› "appends past the anchor when it is the true last item"

## TC-2.5 — Append fallback, no true predecessor

**Priority:** P0 · **Automated:** ✅ automated

*Given* an anchor item that is the true first item in its scope, *when*
inserting with side = `before`, *then* the resolved position is
`round(anchor - 1.0)` and is strictly less than the anchor.

**Automation test:** `positionResolver.test.ts` › `resolveAnchorPosition`
› "prepends past the anchor when it is the true first item"

## TC-2.6 — Creation with no anchor at all

**Priority:** P1 · **Automated:** ✅ automated

*Given* a scope with existing items, *when* a new item is created with no
explicit position, *then* it resolves as if anchored after the scope's
true last item (append fallback).

**Automation test:** `positionResolver.test.ts` › `resolveAppendPosition`
› "appends past the true last item in a non-empty scope"; also duplicated
at the integration layer by `items.test.ts` › POST /api/items › "positions
the first item in a workphase at 1.0 and the next at max + 1.0"

## TC-2.7 — Bootstrap: brand-new empty scope

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a workphase with zero items, *when* an item is created/moved into
it with no anchor, *then* its position is resolved relative to the nearest
non-empty workphase by rank (not a fixed baseline like 1.0), so that later
merges with adjacent workphases can't collide.

**Automation test:** — *(the mapped test, `positionResolver.test.ts` ›
`resolveAppendPosition` › "returns 1.0 for a genuinely empty scope,"
asserts the flat baseline this case's rule explicitly says NOT to use —
the rank-aware bootstrap this case describes may not be implemented
anywhere in the reconciled scope; needs an Architect/Coder check, not just
a test)*

## TC-2.8 — Bootstrap collision avoidance across two empty scopes

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* two different, both-currently-empty workphaces, *when* an item is
bootstrapped into each independently and the workphaces are later viewed
together (e.g. in a merged column), *then* their positions do not collide
or need renumbering — this is the original independent-counter-collision
bug this design fixes.

**Automation test:** —

### Narrow-view correctness (the core bug this feature fixes)

## TC-2.9 — Narrow view cannot leapfrog past an unseen true neighbor

**Priority:** P0 · **Automated:** ✅ automated

*Given* the true full order `A(1.0), B(2.8), C(3.0), D(4.0)` and a
narrowed client view that only has `A` and `C` loaded (e.g. a subproject
board that doesn't load the parent project's full item set), *when* the
narrow view drags `D` to sit immediately before `C` (anchor = C, side =
`before`), *then* the server resolves against `C`'s true neighbor `B`
(2.8), producing a position strictly between 2.8 and 3.0 — never a value
less than 2.8 that would silently reorder `D` ahead of `B`, an item the
acting view never saw.

**Automation test:** `positionResolver.test.ts` › `resolveAnchorPosition`
› "finds the true neighbor even when it is not the literal next row
created" (uses the wiki's exact A(1.0)/B(2.8)/C(3.0) fixture)

## TC-2.10 — True neighbor lookup ignores visibility, only reality

**Priority:** P0 · **Automated:** ✅ automated

*Given* a comparison scope where the true bounding neighbor beyond the
anchor is not currently shown in the column/board the move originated
from (e.g. a collapsed/attached item, or an item outside the current
board's range), *when* resolving the insert, *then* that item is still
found and used as the bound — the check is "does a true neighbor exist,"
never "is one visible here."

**Automation test:** Same test as TC-2.9 — the server-side resolver has no
concept of "visible" at all, so one test structurally covers both

## TC-2.11 — Server resolution is authoritative over a stale client guess

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a client computes an optimistic position locally
(`positionBetween`) for instant visual feedback, *when* the server's
resolution disagrees with the client's guess (e.g. because of concurrent
writes), *then* the server's value wins and the client re-syncs
(`loadBoard()`) rather than persisting the client's guess.

**Automation test:** — *(no test simulates a client optimistic guess
disagreeing with server resolution plus the `loadBoard()` resync path —
that logic lives in `useBoardDnd.ts`, not covered by any file in the
reconciled scope)*

### Tight-gap → reindex

## TC-2.12 — Precision exhaustion triggers reindex-then-retry

**Priority:** P0 · **Automated:** ✅ automated

*Given* two neighbors so close in value that no additional decimal digit
produces a value strictly between them within the max search depth,
*when* an insert is attempted between them, *then* the local comparison
scope is reindexed to clean sequential values first, and the original
insert is retried and succeeds afterward.

**Automation test:** `positionResolver.test.ts` › `resolveAnchorPosition`
› "reindexes the scope and retries when the gap is too tight for any
precision"

### `positionScope` computed field

## TC-2.13 — `positionScope` = `"attached-siblings"`

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* an item with `isAttached = true` and a `parentId`, *when* fetched
via the API, *then* its `positionScope` field reads `"attached-siblings"`.

**Automation test:** — *(candidate: `classifyPositionScope` › "classifies
an attached child with a parent as attached-siblings" — unit-only, never
asserted on an actual API response)*

## TC-2.14 — `positionScope` = `"workphase"`

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a detached item whose workphase is not terminal, *when* fetched,
*then* `positionScope` reads `"workphase"`.

**Automation test:** — *(candidate: `classifyPositionScope` › "classifies
a detached/root item in a non-terminal workphase as workphase" — same
unit-only caveat as TC-2.13)*

## TC-2.15 — `positionScope` = `"none"` for a done item

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a detached/root item whose workphase is terminal, *when* fetched,
*then* `positionScope` reads `"none"`.

**Automation test:** — *(candidate: `classifyPositionScope` › "classifies
a detached/root item in a terminal workphase as none (done, ordered by
completedAt)" — same unit-only caveat as TC-2.13)*

## TC-2.16 — `position`'s shape is unchanged

**Priority:** P2 · **Automated:** ⏳ pending triage

*Given* any item, *when* fetched via the API, *then* `position` is still a
plain `number | null` — existing consumers that only read `position` see
no shape change.

**Automation test:** —

### Scope-change reassignment principle

## TC-2.17 — Attach → detach reassigns position

**Priority:** P0 · **Automated:** ✅ automated

*Given* an attached child with a position meaningful among its siblings,
*when* it is detached, *then* it receives a fresh position appropriate to
its new workphace-scoped comparison group (append fallback), not a
leftover sibling-scoped value.

**Automation test:** `items.test.ts` › "detaching reassigns a fresh
position scoped to the workphase"

## TC-2.18 — Detach → attach reassigns position

**Priority:** P0 · **Automated:** ✅ automated

*Given* a detached item, *when* it is attached to a parent, *then* it
receives a fresh position among that parent's attached children, not a
leftover workphase-scoped value.

**Automation test:** `items.test.ts` › "attaching to a parent reassigns a
fresh position scoped to the new siblings"

## TC-2.19 — Reparent while staying attached reassigns position

**Priority:** P0 · **Automated:** ✅ automated

*Given* an attached child of parent A, *when* it is reparented to parent B
(same project) while remaining attached, *then* it receives a fresh
position among parent B's children — not an old value from parent A's
sibling scope.

**Automation test:** `items.test.ts` › "reparenting while staying attached
reassigns a fresh position scoped to the new parent"

## TC-2.20 — Reorder-only move does not reassign a fresh position

**Priority:** P0 · **Automated:** ✅ automated

*Given* an item reordered among its existing siblings without changing
parent/attach-state/workphase scope, *when* the move is applied with an
explicit anchor, *then* it receives the anchor-resolved position (per
TC-2.1–2.5), not an unrelated append-fallback value.

**Automation test:** `items.test.ts` › "move resolves anchorId+side
against the true neighbor, not a client-supplied guess" (result lands
strictly between two true neighbors, not an append value)

## TC-2.21 — Cascade to attached descendants leaves position untouched

**Priority:** P0 (regression/guard) · **Automated:** ⏳ pending triage

*Given* an attached child, *when* its parent moves to a different
workphase and the cascade applies to the child, *then* the child's
`position` value is unchanged (scope did not change — still
parent-scoped).

**Automation test:** — *(the cascade tests in `items.test.ts` only check
`workphaseId` propagation, not that the child's `position` is specifically
unchanged)*

## TC-2.22 — Active → done transition reassigns per Part 6 rules

**Priority:** P0 · **Automated:** ✅ automated

Covered by [Part 6](part-6-active-done-split.md) rather than an ordinary
scope-change append — see TC-6.1–TC-6.4.

**Automation test:** See [Part 6](part-6-active-done-split.md) — TC-6.1–TC-6.4
