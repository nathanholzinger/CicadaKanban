# Part 2 — Anchor+side position resolution

**Next ID:** TC-2.31

**Wiki:** [`../../wiki/item-positioning/#2-position-resolution-anchor--side`](../../wiki/item-positioning/README.md#2-position-resolution-anchor--side)

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-2.1 | Insert between two existing neighbors | P0 | ✅ automated |
| TC-2.2 | Coarsest-fit rounding | P0 | ✅ automated |
| TC-2.3 | Coarsest-fit stops at minimum needed precision | P1 | ✅ automated |
| TC-2.4 | Append fallback, no true successor | P0 | ✅ automated |
| TC-2.5 | Prepend fallback, no true predecessor — floor-bounded, never negative | P0 | ⏳ pending re-triage |
| TC-2.6 | Creation with no anchor at all | P1 | ✅ automated |
| TC-2.7 | Bootstrap: brand-new empty scope | P0 | ✅ automated |
| TC-2.8 | Anchoring against a done item is rejected | P1 | ✅ automated |
| TC-2.9 | Narrow view cannot leapfrog past an unseen true neighbor | P0 | ✅ automated |
| TC-2.10 | True neighbor lookup ignores visibility, only reality | P0 | ✅ automated |
| TC-2.11 | The client never computes a position value, not even for display | P0 | ⏳ pending triage |
| TC-2.12 | Precision exhaustion triggers reindex-then-retry | P0 | ✅ automated |
| TC-2.13 | `positionScope` = `"attached-siblings"` | P1 | ✅ automated |
| TC-2.14 | `positionScope` = `"workflow"` | P1 | ✅ automated |
| TC-2.15 | `positionScope` = `"none"` for a done item | P1 | ✅ automated |
| TC-2.16 | `classifyPositionScope` on a null `workphaseId` → `"none"` | P1 | ✅ automated |
| TC-2.17 | `classifyPositionScope` on an attached-but-parentless item → `"workflow"` | P1 | ✅ automated |
| TC-2.18 | `position`'s shape is unchanged | P2 | ✅ automated |
| TC-2.19 | Attach → detach reassigns position | P0 | ✅ automated |
| TC-2.20 | Detach → attach reassigns position | P0 | ✅ automated |
| TC-2.21 | Reparent while staying attached reassigns position | P0 | ✅ automated |
| TC-2.22 | Reorder-only move does not reassign a fresh position | P0 | ✅ automated |
| TC-2.23 | Redundant re-attach to the same parent is a no-op for position | P1 | ✅ automated |
| TC-2.24 | Workphase-only move with no anchor keeps existing position | P0 | ✅ automated |
| TC-2.25 | Cascade to attached descendants leaves position untouched | P0 | ✅ automated |
| TC-2.26 | Active → done transition reassigns per Part 6 rules | P0 | ✅ automated |
| TC-2.27 | Optimistic feedback is ordinal — an index, not a number | P0 | ⏳ pending triage |
| TC-2.28 | Rendered projection of the server's answer matches the ordinal preview under a narrow view | P0 | ⏳ pending triage |
| TC-2.29 | Ordinal preview holds when the anchor's own value is still in flight | P1 | ⏳ pending triage |
| TC-2.30 | A pending item is never represented as `position: null` | P0 | ⏳ pending triage |

*(TC-2.27–2.30 added by Epic 3.5 from the amended "Client-side role" of §2.
TC-2.11 rewritten by the same amendment; TC-2.5's rule text corrected to
match the wiki's floor-bounded prepend — see each case's note.)*

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

**Priority:** P1 · **Automated:** ✅ automated

*Given* neighbors at 1.0 and 2.0, *when* resolving an insert between them,
*then* the result is at the coarsest precision level that fits, not an
unnecessarily long decimal.

**Automation test:** `positionResolver.test.ts` › `coarsestFit` › "takes
the exact midpoint when it already fits at 0 decimals" ›
`coarsestFit(1, 3) === 2`. Confirmed as the intended mapping, not just an
acceptable proxy: this case's business rule is about *stopping* at the
coarsest precision that fits rather than always searching deeper — the
0-decimal case is the sharpest demonstration of that (TC-2.2 already
separately covers the wiki's 1.5/2.0 → 1.8 walkthrough at 1 decimal,
so mapping TC-2.3 to the same assertion would just duplicate TC-2.2
rather than add distinct coverage).

## TC-2.4 — Append fallback, no true successor

**Priority:** P0 · **Automated:** ✅ automated

*Given* an anchor item that is the true last item in its comparison scope,
*when* inserting with side = `after`, *then* the resolved position is
`round(anchor + 1.0)` and is strictly greater than the anchor.

**Automation test:** `positionResolver.test.ts` › `resolveAnchorPosition`
› "appends past the anchor when it is the true last item"

## TC-2.5 — Prepend fallback, no true predecessor — floor-bounded, never negative

**Priority:** P0 · **Automated:** ⏳ pending re-triage

*Given* an anchor item that is the true first item in its scope, *when*
inserting with side = `before`, *then* the resolved position is the
coarsest-fit value strictly between a virtual floor of `0.0` and the
anchor's position — **not** a symmetric `round(anchor − 1.0)`. The result
is strictly less than the anchor and strictly greater than `0.0`.

*And given* that prepend is repeated many times (each new item anchored
`before` the current true first item), *then* every resolved position stays
strictly above `0.0` — the sequence converges toward the floor rather than
drifting negative without limit, so it can never collide with the
`position ?? 0` sentinel used when sorting alongside unpositioned items
(Part 5's tie-break).

*(Rule text corrected 2026-09-10: this case previously described
`round(anchor − 1.0)`, which the wiki's §2 "Append fallback" paragraph
explicitly rules out. The mapped test below needs re-checking against the
corrected rule by the Test Reconciler — TC-3.5's mapping already describes
the attached-siblings equivalent as "floor-anchored coarsest-fit," so the
implementation is likely already right and only this text was stale.)*

**Automation test:** `positionResolver.test.ts` › `resolveAnchorPosition`
› "prepends past the anchor when it is the true first item" — **verify**
it asserts the floor-bounded coarsest-fit value, not `anchor − 1`, and that
the repeated-prepend bound is covered somewhere.

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

**Priority:** P0 · **Automated:** ✅ automated

*Given* a scope (workflow-wide for a detached/root item, parent-wide for
an attached child) with zero positioned items, *when* an item is
created/moved into it with no anchor, *then* its position starts at
`1.0`.

**Automation test:** `positionResolver.test.ts` › `resolveAppendPosition`
› "returns 1.0 for a genuinely empty scope"

*(This case's rule text previously described a rank-aware bootstrap —
anchoring to the nearest non-empty workphase by rank instead of a flat
`1.0` — which was never implemented. That was resolved architecturally,
not by writing a test: position scope moved from per-workphase to
workflow-wide, which is what actually eliminates the two-empty-workphases
collision this was meant to prevent — see the wiki's §2 bootstrap-fallback
note. The flat `1.0` baseline is now correct as documented, and the
originally-mapped test was right all along.)*

## TC-2.8 — Anchoring against a done item is rejected

**Priority:** P1 · **Automated:** ✅ automated

*Given* a done item (terminal workphase, no stored `position` per Part 6),
*when* it is passed as `anchorId` to a move, *then* the request is
rejected rather than resolving against a nonexistent position — a real
corollary of combining this section's "query the anchor's true current
position" step with Part 6's "done items get no stored position," not a
generic input-validation guard.

**Automation test:** `positionResolver.test.ts` › `resolveAnchorPosition`
› "throws for an anchor with no position (a done item, per Part 6)
(TC-2.8)"; also duplicated at the integration layer by `items.test.ts` ›
"move rejects anchoring to a done item (no position to anchor against)
(TC-2.8)"

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

## TC-2.11 — The client never computes a position value, not even for display

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* any client-side placement (a drop, a reorder, a create with a
target slot), *when* the client prepares its optimistic state and its
request, *then* no `position` number is computed client-side at any point
— not held in local state, not rendered, and not sent. The request carries
only relative intent (anchor + side, or a workphase-only move) and the
written item's `position` in client state is whatever it was before the
write until the server's value lands (see TC-2.30 for what "pending" looks
like instead).

*(Superseded and rewritten by Epic 3.5. This case previously read: "Given a
client computes an optimistic position locally (`positionBetween`) for
instant visual feedback, when the server's resolution disagrees with the
client's guess, then the server's value wins and the client re-syncs
(`loadBoard()`)." The amended §2 "Client-side role" now explicitly rules
out a client-computed number, even for display, so that premise no longer
describes allowed behavior. The still-valid half — a rejected write resyncs
from the server and never keeps the optimistic guess — now lives with the
gesture that exercises it:
[`../board-drag-interaction/drag-6-preview-reconciliation.md`](../board-drag-interaction/drag-6-preview-reconciliation.md)
DRAG-6.6, and as the atomicity rule in
[`../item-attachment/att-3-reparent-placement-atomicity.md`](../item-attachment/att-3-reparent-placement-atomicity.md)
ATT-3.7.)*

**Automation test:** *(previous mapping — `boardDndUtils.test.ts` ›
`applyItemMove` › "falls back to loadBoard and never calls setItems when
the move is rejected" / "updates items via setItems on a successful move" —
covered the old resync premise, not this rule. `applyItemMove` is now
`sendItemMove` in `dragRequest.test.ts` ("DRAG-6.6: a rejected move fails
the write (the guess is dropped) and resyncs via loadBoard" / "begins the
write with its pending placement, completes it with the response, and
never calls loadBoard"); it should be re-pointed at DRAG-6.6 by the Test
Reconciler.)*

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

**Priority:** P1 · **Automated:** ✅ automated

*Given* an item with `isAttached = true` and a `parentId`, *when* fetched
via the API, *then* its `positionScope` field reads `"attached-siblings"`.

**Automation test:** `items.test.ts` › "GET returns positionScope =
'attached-siblings' for an attached child (TC-2.13)"

*(Previously mapped only at the unit layer, and for good reason:
`classifyPositionScope` was exported from `positionResolver.ts` but never
called anywhere else in `server/src` — `positionScope` didn't reach any
API response at all. Fixed 2026-08-18: wired into every item-serializing
response in `items.ts` (`GET/POST/PUT/:id`, `PATCH /:id/move`) and into
the board read path (`boards.ts` — the `positionScope` clients actually
render from). Unit coverage on the pure function stays in
`positionResolver.test.ts`; this is now backed by a real API-level
assertion too.)*

## TC-2.14 — `positionScope` = `"workflow"`

**Priority:** P1 · **Automated:** ✅ automated

*Given* a detached item whose workphase is not terminal, *when* fetched,
*then* `positionScope` reads `"workflow"`.

**Automation test:** `items.test.ts` › "GET returns positionScope =
'workflow' for a detached item in a non-terminal workphase (TC-2.14)"

*(Case name/value updated from the pre-`de80b59` `"workphase"` naming —
see part-2's §2 comparison-scope rewrite.)*

## TC-2.15 — `positionScope` = `"none"` for a done item

**Priority:** P1 · **Automated:** ✅ automated

*Given* a detached/root item whose workphase is terminal, *when* fetched,
*then* `positionScope` reads `"none"`.

**Automation test:** `items.test.ts` › "GET returns positionScope = 'none'
for a done item (TC-2.15)"

## TC-2.16 — `classifyPositionScope` on a null `workphaseId` → `"none"`

**Priority:** P1 · **Automated:** ✅ automated

*Given* an item with a null `workphaseId` (unsorted/invalid — e.g. its
workphase was deleted, SET NULL), *when* its `positionScope` is computed,
*then* it reads `"none"` — the same practical bucket as a done item, even
though the reason differs (not currently ordered at all, rather than
ordered-by-`completedAt`). A fourth `positionScope` state the wiki's §2
description doesn't separately enumerate (only three states are named),
though `classifyPositionScope`'s own null-`workphaseId` branch has always
implemented it.

**Automation test:** `positionResolver.test.ts` › `classifyPositionScope`
› "classifies a null-workphase item as none (unsorted, not currently
ordered) (TC-2.16)"

## TC-2.17 — `classifyPositionScope` on an attached-but-parentless item → `"workflow"`

**Priority:** P1 · **Automated:** ✅ automated

*Given* an item with `isAttached = true` but no `parentId`, *when* its
`positionScope` is computed, *then* it reads `"workflow"`, not
`"attached-siblings"` — the wiki states the AND-condition
(`isAttached && parentId`) for the attached-siblings state, so this
negative case is implied, just not previously enumerated as its own case.

**Automation test:** `positionResolver.test.ts` › `classifyPositionScope`
› "classifies an attached-but-parentless item as workflow, not
attached-siblings (TC-2.17)"

## TC-2.18 — `position`'s shape is unchanged

**Priority:** P2 · **Automated:** ✅ automated

*Given* any item, *when* fetched via the API, *then* `position` is still a
plain `number | null` — existing consumers that only read `position` see
no shape change.

**Automation test:** `items.test.ts` › "POST scopes a new attached child to
its true siblings..." (`typeof child.position === 'number'`) and "POST
into a terminal workphase gets no position..." (`res.body.position`
`toBeNull()`) — explicit shape assertions folded into two already-existing
tests rather than a new test slot.

### Scope-change reassignment principle

## TC-2.19 — Attach → detach reassigns position

**Priority:** P0 · **Automated:** ✅ automated

*Given* an attached child with a position meaningful among its siblings,
*when* it is detached, *then* it receives a fresh position appropriate to
its new workphase-scoped comparison group (append fallback), not a
leftover sibling-scoped value.

**Automation test:** `items.test.ts` › "detaching reassigns a fresh
position scoped to the workphase"

## TC-2.20 — Detach → attach reassigns position

**Priority:** P0 · **Automated:** ✅ automated

*Given* a detached item, *when* it is attached to a parent, *then* it
receives a fresh position among that parent's attached children, not a
leftover workphase-scoped value.

**Automation test:** `items.test.ts` › "attaching to a parent reassigns a
fresh position scoped to the new siblings"

## TC-2.21 — Reparent while staying attached reassigns position

**Priority:** P0 · **Automated:** ✅ automated

*Given* an attached child of parent A, *when* it is reparented to parent B
(same project) while remaining attached, *then* it receives a fresh
position among parent B's children — not an old value from parent A's
sibling scope.

**Automation test:** `items.test.ts` › "reparenting while staying attached
reassigns a fresh position scoped to the new parent"

## TC-2.22 — Reorder-only move does not reassign a fresh position

**Priority:** P0 · **Automated:** ✅ automated

*Given* an item reordered among its existing siblings without changing
parent/attach-state/workphase scope, *when* the move is applied with an
explicit anchor, *then* it receives the anchor-resolved position (per
TC-2.1–2.5), not an unrelated append-fallback value.

**Automation test:** `items.test.ts` › "move resolves anchorId+side
against the true neighbor, not a client-supplied guess" (result lands
strictly between two true neighbors, not an append value)

## TC-2.23 — Redundant re-attach to the same parent is a no-op for position

**Priority:** P1 · **Automated:** ✅ automated

*Given* an already-attached child, *when* it is "re-attached" to the same
parent it already belongs to (no actual scope change), *then* its
`position` is left completely untouched — a corollary of the
scope-change-reassignment principle above (no scope change → no
reassignment) that the table doesn't name as its own scenario.

**Automation test:** `items.test.ts` › "a redundant re-attach to the same
parent leaves position untouched (TC-2.23)"

## TC-2.24 — Workphase-only move with no anchor keeps existing position

**Priority:** P0 · **Automated:** ✅ automated

*Given* an item that already has a real `position`, *when* it moves to a
different workphase with no anchor and no explicit `position` in the
request, *then* its existing `position` value is left completely
unchanged — since position is workflow-scoped, not workphase-scoped
(`de80b59`), the existing value is already comparable against everything
else in the (same) workflow, so no new number needs to be computed. A
deliberate exception to the append-fallback default (steps 4/5 above),
documented explicitly in the wiki's §2 addendum, and the shape the MCP
`move_item` tool already sends (`{workphaseId}` alone). New as of
`de80b59` (2026-08-17) — not in the original 55-case catalog at all.

**Automation test:** `items.test.ts` › "a workphaseId-only move with no
anchor keeps the item's existing position exactly unchanged (TC-2.24)" —
pins the item's position to a value append-fallback could never naturally
produce (so a pass can't be coincidental), then asserts it's exactly that
value after the move. The one pre-existing test in this area
("a workphaseId-only move (no position given) defaults to the end of the
target workphase") turned out to be ambiguous — its `toBeGreaterThan`
assertion passes whether the position was kept unchanged *or* freshly
appended, given the specific values it uses — so it doesn't actually
discriminate between the two behaviors this case cares about.

## TC-2.25 — Cascade to attached descendants leaves position untouched

**Priority:** P0 (regression/guard) · **Automated:** ✅ automated

*Given* an attached child, *when* its parent moves to a different
workphase and the cascade applies to the child, *then* the child's
`position` value is unchanged (scope did not change — still
parent-scoped).

**Automation test:** `items.test.ts` › "cascading a non-terminal-to-
non-terminal move leaves an attached child's position untouched (TC-2.25)"
— reads `position` explicitly before/after, unlike the pre-existing
cascade tests which only ever checked `workphaseId` propagation.

## TC-2.26 — Active → done transition reassigns per Part 6 rules

**Priority:** P0 · **Automated:** ✅ automated

Covered by [Part 6](part-6-active-done-split.md) rather than an ordinary
scope-change append — see TC-6.1–TC-6.4.

**Automation test:** See [Part 6](part-6-active-done-split.md) — TC-6.1–TC-6.4

### Client-side role (amended by Epic 3.5)

These cases apply to *any* client holding a locally-ordered list. The board
drag is what exercises them — the board-specific additions (pending marker
cleared on response, inversion tripwire, per-item response sequencing,
failure resync) are in
[`../board-drag-interaction/drag-6-preview-reconciliation.md`](../board-drag-interaction/drag-6-preview-reconciliation.md),
which cross-references these rather than restating them.

## TC-2.27 — Optimistic feedback is ordinal — an index, not a number

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a rendered list `A, C, E` and a placement of item `X` with anchor
= `A`, side = `after`, *when* the client shows optimistic feedback before
the server responds, *then* `X` is rendered at index 1 (`A, X, C, E`) as an
ordinal placement — `X`'s `position` field is not assigned any client-
invented value to achieve that ordering, and the rendered order is not the
product of re-sorting by `position`.

**Automation test:** —

## TC-2.28 — Rendered projection of the server's answer matches the ordinal preview under a narrow view

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the true full order `A, B, C, D, E` and a client view that has
loaded only `A, C, E`, *when* the client places `X` either as `after A`
or as `before C`, *then*:

- for `after A`, the server resolves `X` strictly between `A` and `B`
  (A's true successor) — and re-rendering the client's loaded set with the
  server's value sorts to `A, X, C, E`;
- for `before C`, the server resolves `X` strictly between `B` and `C`
  (C's true predecessor) — and re-rendering sorts to the same `A, X, C, E`.

In both cases the picture after the server's value lands is exactly the
one the ordinal preview (TC-2.27) already drew. Nothing occupying the gap
between the anchor and its true neighbor can be in the requesting view, so
`X` always lands adjacent to its anchor on the requested side *within the
rendered set*, whatever number it receives.

**Automation test:** —

## TC-2.29 — Ordinal preview holds when the anchor's own value is still in flight

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* item `Y` has just been placed (its write is pending, its
authoritative `position` not yet received), *when* the client immediately
places `X` with anchor = `Y`, side = `after`, *then* the ordinal preview
shows `X` directly after `Y`, and once both server responses land and are
reconciled (§5a), the rendered order still shows `X` directly after `Y` —
the ordinal relationship never depended on either number.

**Automation test:** —

## TC-2.30 — A pending item is never represented as `position: null`

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* an item whose position write is in flight, *when* the client marks
it as pending, *then* its `position` field is left exactly as it was before
the write — specifically it is **not** set to `null` — and pending is
tracked by a separate marker. *And when* anything re-sorts the rendered
list while the write is still pending (e.g. another item's response lands),
*then* the pending item does not jump to the front of the list: `null`
would coerce to `0` under the tie-break and sort ahead of every positioned
item, and would be indistinguishable from a done item ordered by
`completedAt`.

**Automation test:** —
