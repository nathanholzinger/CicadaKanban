# Part 2 — Anchor+side position resolution

**Wiki:** [`../../wiki/item-positioning/#2-position-resolution-anchor--side`](../../wiki/item-positioning/README.md#2-position-resolution-anchor--side)

| ID | Case | Priority | Automated | Automation test |
|---|---|---|---|---|
| TC-2.1 | Insert between two existing neighbors | P0 | ⏳ pending triage | — |
| TC-2.2 | Coarsest-fit rounding | P0 | ⏳ pending triage | — |
| TC-2.3 | Coarsest-fit stops at minimum needed precision | P1 | ⏳ pending triage | — |
| TC-2.4 | Append fallback, no true successor | P0 | ⏳ pending triage | — |
| TC-2.5 | Append fallback, no true predecessor | P0 | ⏳ pending triage | — |
| TC-2.6 | Creation with no anchor at all | P1 | ⏳ pending triage | — |
| TC-2.7 | Bootstrap: brand-new empty scope | P0 | ⏳ pending triage | — |
| TC-2.8 | Bootstrap collision avoidance across two empty scopes | P0 | ⏳ pending triage | — |
| TC-2.9 | Narrow view cannot leapfrog past an unseen true neighbor | P0 | ⏳ pending triage | — |
| TC-2.10 | True neighbor lookup ignores visibility, only reality | P0 | ⏳ pending triage | — |
| TC-2.11 | Server resolution is authoritative over a stale client guess | P0 | ⏳ pending triage | — |
| TC-2.12 | Precision exhaustion triggers reindex-then-retry | P0 | ⏳ pending triage | — |
| TC-2.13 | `positionScope` = `"attached-siblings"` | P1 | ⏳ pending triage | — |
| TC-2.14 | `positionScope` = `"workphase"` | P1 | ⏳ pending triage | — |
| TC-2.15 | `positionScope` = `"none"` for a done item | P1 | ⏳ pending triage | — |
| TC-2.16 | `position`'s shape is unchanged | P2 | ⏳ pending triage | — |
| TC-2.17 | Attach → detach reassigns position | P0 | ⏳ pending triage | — |
| TC-2.18 | Detach → attach reassigns position | P0 | ⏳ pending triage | — |
| TC-2.19 | Reparent while staying attached reassigns position | P0 | ⏳ pending triage | — |
| TC-2.20 | Reorder-only move does not reassign a fresh position | P0 | ⏳ pending triage | — |
| TC-2.21 | Cascade to attached descendants leaves position untouched | P0 | ⏳ pending triage | — |
| TC-2.22 | Active → done transition reassigns per Part 6 rules | P0 | ⏳ pending triage | — |

---

### Core resolution algorithm

## TC-2.1 — Insert between two existing neighbors

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* items at positions 1.0 and 2.0 in a comparison scope, *when* a new
item is inserted with anchor = the item at 1.0, side = `after`, *then* the
resolved position is strictly between 1.0 and 2.0, and it is the coarsest
decimal value that fits (see TC-2.2).

## TC-2.2 — Coarsest-fit rounding

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* two neighbors at 1.5 and 2.0, *when* resolving an insert between
them, *then* the result is 1.8 (the coarsest 1-decimal value that fits),
not the raw midpoint 1.75.

## TC-2.3 — Coarsest-fit stops at minimum needed precision

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* neighbors at 1.0 and 2.0, *when* resolving an insert between them,
*then* the result is at the coarsest precision level that fits, not an
unnecessarily long decimal.

## TC-2.4 — Append fallback, no true successor

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an anchor item that is the true last item in its comparison scope,
*when* inserting with side = `after`, *then* the resolved position is
`round(anchor + 1.0)` and is strictly greater than the anchor.

## TC-2.5 — Append fallback, no true predecessor

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an anchor item that is the true first item in its scope, *when*
inserting with side = `before`, *then* the resolved position is
`round(anchor - 1.0)` and is strictly less than the anchor.

## TC-2.6 — Creation with no anchor at all

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a scope with existing items, *when* a new item is created with no
explicit position, *then* it resolves as if anchored after the scope's
true last item (append fallback).

## TC-2.7 — Bootstrap: brand-new empty scope

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a workphase with zero items, *when* an item is created/moved into
it with no anchor, *then* its position is resolved relative to the nearest
non-empty workphase by rank (not a fixed baseline like 1.0), so that later
merges with adjacent workphases can't collide.

## TC-2.8 — Bootstrap collision avoidance across two empty scopes

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* two different, both-currently-empty workphaces, *when* an item is
bootstrapped into each independently and the workphaces are later viewed
together (e.g. in a merged column), *then* their positions do not collide
or need renumbering — this is the original independent-counter-collision
bug this design fixes.

### Narrow-view correctness (the core bug this feature fixes)

## TC-2.9 — Narrow view cannot leapfrog past an unseen true neighbor

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* the true full order `A(1.0), B(2.8), C(3.0), D(4.0)` and a
narrowed client view that only has `A` and `C` loaded (e.g. a subproject
board that doesn't load the parent project's full item set), *when* the
narrow view drags `D` to sit immediately before `C` (anchor = C, side =
`before`), *then* the server resolves against `C`'s true neighbor `B`
(2.8), producing a position strictly between 2.8 and 3.0 — never a value
less than 2.8 that would silently reorder `D` ahead of `B`, an item the
acting view never saw.

## TC-2.10 — True neighbor lookup ignores visibility, only reality

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a comparison scope where the true bounding neighbor beyond the
anchor is not currently shown in the column/board the move originated
from (e.g. a collapsed/attached item, or an item outside the current
board's range), *when* resolving the insert, *then* that item is still
found and used as the bound — the check is "does a true neighbor exist,"
never "is one visible here."

## TC-2.11 — Server resolution is authoritative over a stale client guess

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a client computes an optimistic position locally
(`positionBetween`) for instant visual feedback, *when* the server's
resolution disagrees with the client's guess (e.g. because of concurrent
writes), *then* the server's value wins and the client re-syncs
(`loadBoard()`) rather than persisting the client's guess.

### Tight-gap → reindex

## TC-2.12 — Precision exhaustion triggers reindex-then-retry

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* two neighbors so close in value that no additional decimal digit
produces a value strictly between them within the max search depth,
*when* an insert is attempted between them, *then* the local comparison
scope is reindexed to clean sequential values first, and the original
insert is retried and succeeds afterward.

### `positionScope` computed field

## TC-2.13 — `positionScope` = `"attached-siblings"`

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an item with `isAttached = true` and a `parentId`, *when* fetched
via the API, *then* its `positionScope` field reads `"attached-siblings"`.

## TC-2.14 — `positionScope` = `"workphase"`

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a detached item whose workphase is not terminal, *when* fetched,
*then* `positionScope` reads `"workphase"`.

## TC-2.15 — `positionScope` = `"none"` for a done item

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a detached/root item whose workphase is terminal, *when* fetched,
*then* `positionScope` reads `"none"`.

## TC-2.16 — `position`'s shape is unchanged

**Priority:** P2 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* any item, *when* fetched via the API, *then* `position` is still a
plain `number | null` — existing consumers that only read `position` see
no shape change.

### Scope-change reassignment principle

## TC-2.17 — Attach → detach reassigns position

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an attached child with a position meaningful among its siblings,
*when* it is detached, *then* it receives a fresh position appropriate to
its new workphace-scoped comparison group (append fallback), not a
leftover sibling-scoped value.

## TC-2.18 — Detach → attach reassigns position

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a detached item, *when* it is attached to a parent, *then* it
receives a fresh position among that parent's attached children, not a
leftover workphase-scoped value.

## TC-2.19 — Reparent while staying attached reassigns position

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an attached child of parent A, *when* it is reparented to parent B
(same project) while remaining attached, *then* it receives a fresh
position among parent B's children — not an old value from parent A's
sibling scope.

## TC-2.20 — Reorder-only move does not reassign a fresh position

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an item reordered among its existing siblings without changing
parent/attach-state/workphase scope, *when* the move is applied with an
explicit anchor, *then* it receives the anchor-resolved position (per
TC-2.1–2.5), not an unrelated append-fallback value.

## TC-2.21 — Cascade to attached descendants leaves position untouched

**Priority:** P0 (regression/guard) · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an attached child, *when* its parent moves to a different
workphase and the cascade applies to the child, *then* the child's
`position` value is unchanged (scope did not change — still
parent-scoped).

## TC-2.22 — Active → done transition reassigns per Part 6 rules

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

Covered by [Part 6](part-6-active-done-split.md) rather than an ordinary
scope-change append — see TC-6.1–TC-6.4.
