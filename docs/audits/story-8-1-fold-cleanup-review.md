# Story 8.1 — Production-code cleanup review

**Date:** 2026-10-29  
**Reviewed HEAD:** `004185b1cd9d1b67a54f56e9a354e61aa34f979f`  
**Change range:** `2c4a7f9..004185b` — three commits: the fold, its E2E pass, and the overlay/measurement fix.

The fold is substantially complete. I found no remaining executable Card-layer branch and no confirmed runtime defect in the paths traced. There is one unused type export, two opportunities to narrow APIs that served the old layer stack, and avoidable DOM work. A broader hierarchy-selector optimization is worth considering only if profiling justifies it.

This is a focused Architect/Auditor review, not the formal story-close audit or a behavior sign-off. Findings concern production code only. Wiki, comment, test-plan, and test cleanup are excluded, per Nathan's instruction. No production code was changed.

## Scope and evidence

Reviewed the fold's 16 changed production files and the surrounding callers that govern region registration, parent resolution, popping, projection, overlay geometry, rendering, and release. Read the Architect/Auditor guidance, repository guardrails, Story 8.1, and the epic roadmap to establish the intended boundaries. The story's decisions govern the folded behavior while the wiki awaits its update.

The review traced both Free-Card entry and a Stub's departure/return, including modal ownership of the Descendants region. Repository-wide tracked-source searches checked consumers of removed and surviving abstractions. The installed dnd-kit implementation was inspected for the overlay's initial rectangle and modifier pipeline.

`npm.cmd run check` passed: type checks, lint, formatting, 430 server tests, 582 client tests, and 217 script tests. Existing tests were run as a verification gate; their design and future cleanup are outside this report. Browser gestures and performance timings were not measured in this review. Passing checks do not establish how the drag feels.

## Findings

There are no Fix Now production correctness findings. The Watch List items below are optional structural changes under the audit guide's tier definitions; none requires a broad rewrite.

### 1. Watch List — Resolve modal bounds once, rather than searching for them for every Card

**Lenses:** efficiency, duplication/abstraction.  
**Locations:** `client/src/components/workflow/dragStructure.ts:95–109`, `:171–173`, `:227–238`.

`resolveDragStructure` calls `boundsElementOf(root, key)` for every Descendants element. After the fold, that includes every rendered Card, including collapsed and childless Cards. Ordinary board Cards have no bounds element; only the hierarchy modal needs one. With N registered board Cards and no modal, a structural resolve performs N root-scoped selector queries that all return null.

The resolver also finds scroll ancestors, bounds, and parent regions before `descendantsStructure` rejects an invalid target. Those reads cannot contribute to a structure entry that is discarded.

**Recommendation:** collect bounds elements into a key-to-element map once per structural resolve, then use map lookups while constructing records. Alternatively, limit the lookup to the modal's externally parented region using the existing DOM contract. Move the inexpensive Card-validity/origin check ahead of DOM work, keeping that decision in one place and preserving the origin Card exception.

This reduces redundant searches without changing per-sample rectangle measurement. Do not cache painted rectangles as part of it. Structural resolves run at pickup, layer changes, and detected DOM changes; the bounds search itself is not on every pointer sample. No measured latency regression is claimed.

### 2. Watch List — Narrow the hit-test API to its remaining Board-level responsibility

**Lenses:** architecture, duplication/abstraction.  
**Locations:** `client/src/components/workflow/dragRegions.ts:240–246`; callers at `popSession.ts:184` and `useBoardDnd.ts:567`.

`childRegionAt` still accepts an arbitrary `parentKey` and returns any `DragRegion`. Both production callers now pass null. The former caller that hit-tested a Card's Descendants child is gone; a column now enters a Card through the named anchor instead.

The API therefore still exposes a capability the gesture no longer uses. `advancePopSession` compensates with an additional `isCardList` check after the lookup, even though Board's children are already card lists by the region model.

**Recommendation:** replace it with a Board-level lookup, for example `cardListAt(regions, point): CardListRegion | null`, using `isCardList` and containment inside the helper. Remove the unused parent argument and the caller's redundant kind check.

Keep `parentRegionKey` on regions: popping out, structural fallback, and scoped measurement still need the parent chain. The simplification applies to the hit-test API, not the region model. The benefit is a smaller contract and clearer types, not a meaningful speedup.

### 3. Watch List — Narrow the release-list path after the Descendants branch returns

**Lenses:** architecture, file responsibility.  
**Locations:** `client/src/components/workflow/useBoardDnd.ts:543–547`, `:773–810`; `placement.ts:213–221`.

`handleDragEnd` handles a Descendants release and returns before calling `releaseListFor`. With the Card region removed, the remaining region is a card list or absent. Nevertheless, `releaseListFor` accepts the entire region union, checks its kind again, and constructs a nullable `{ rows, containerId }` wrapper for the only caller. The release then carries that nullable wrapper through anchor resolution and commit.

**Recommendation:** handle the absent-region case explicitly, restoring the prior pending placement as the current null-placement commit does. The remaining region is then a `CardListRegion`: read its rows once with `regionItems`, pass its existing `containerId` to anchor resolution, and commit against those rows. Remove the wrapper helper if that leaves the release easier to read.

Preserve `commitRelease` as the common write/restore tail. A missing region must continue to write nothing and restore an earlier pending marker when appropriate. Board-band placement and terminal-list behavior must remain unchanged.

This is a small optional simplification. The present helper is correct and has one caller, so retaining it is also reasonable if the explicit control flow becomes longer.

### 4. Watch List — Repeated full-item scans are the larger potential hierarchy cost

**Lenses:** efficiency, architecture.  
**Locations:** `client/src/components/workflow/descendantsProjection.ts:96–100`; `itemListOps.ts:223–231`, `:247–248`; `useItemManagement.ts:120–122`; `useBoardDnd.ts:291–310`, `:668–671`.

Every projection sample rebuilds the section hierarchy. Its child accessor filters the full board item array and sorts the matching children on each call. A hierarchy walk with K descendants calls that accessor for the root and each descendant, including leaves. For N board items, that means roughly `(K + 1) × N` filter visits per walk, before sorting and projection work. Both raw pointer movement and dnd-kit movement can evaluate the projection.

**This predates the fold.** The fold makes the Descendants path the direct destination of every Card zoom; it did not introduce this algorithm. There is no measured slowdown here, so this should not expand the first cleanup batch automatically.

**Recommendation if profiling warrants it:** memoize the placement-aware child accessor by parent ID for each immutable `items`/`placements` snapshot in `useItemManagement`, or build a shared placement-aware children index there. Reuse the existing ordering and placement helpers so rendering and projection keep the same answer.

Do not freeze a hierarchy for the entire drag: ghost placements and pending responses can change its inputs. Do not key the cache on the accessor's function identity alone; the current accessor is recreated on render. This is broader selector work, not dead Card-layer code.

### 5. Informational — `RegionKind` is an unused export left by the timer refactor

**Lenses:** duplication/abstraction, dead code.  
**Location:** `client/src/components/workflow/dragRegions.ts:34`.

`RegionKind` has no remaining consumer. A tracked-source search finds only its declaration. Before the fold, `popInDelayFor(kind, tuning)` imported it; that function and import are gone. The actual region types already declare their kind literals independently.

**Recommendation:** delete the alias. This is the clearest safe removal and has no runtime effect. If a future consumer needs the union, derive it from `DragRegion['kind']` rather than maintaining another independent list. No replacement abstraction is needed now.

## Safeguards to retain

These surviving mechanisms are necessary, rather than vestiges of the removed layer:

- **The pickup slot** (`useBoardDnd.ts:184–188`, `:559–561`; `descendantsProjection.ts:102–107`). A Stub previewed Free in its column has no row in its original section. Its return needs the original slot; deriving it from the current section would lose that information.
- **The entry-anchor filter** (`descendantsProjection.ts:114`). The transition sample can still name the column's Card. Treating that as a section anchor would replace the intended seed with the last gap.
- **`slotHidden`** (`descendantsProjection.ts:132`; `placement.ts:138–140`). A Stub whose original slot is outside the section's shown levels needs a drawable seed and preview. The fold does not remove that case.
- **The pickup rectangle** (`useBoardDnd.ts:199`, `:504–515`). The source's live rectangle can move when its Card row becomes a section ghost. The overlay re-anchor needs the pickup origin.
- **The locked Card's disabled transition** (`KanbanCard.tsx:171–178`). It prevents ancestor movement from invalidating the rows' mounting measurements. Replacing it with extra collision-only measurements would leave the sortable strategy and anchor geometry on a different answer.
- **The structural parent lookup and resampling loop** (`useBoardDnd.ts:321`, `:363–370`). A context can be clipped out of the measured set, and a transition can require regions outside the previous measurement scope. Removing a layer does not remove either condition. The loop's literal bound is not enough evidence to safely reduce or delete the mechanism.
- **The preview/release distinction** (`placement.ts:118–140`; `useBoardDnd.ts:720–723`). The static placement supplies list membership and the sortable starting slot; the projection supplies the eventual gap and depth. Consolidating these into one live placement would change how the sortable shuffle works.

## Recommended cleanup order

1. Remove the unused `RegionKind` alias (#5).
2. Narrow the Board hit test (#2) and remove unnecessary structural DOM queries (#1).
3. Consider the release-path simplification (#3) if it improves readability in practice.
4. Profile before undertaking the broader child-selector change (#4).

Behavior verification should cover childless-Card entry, foreign-Card entry, a Stub's immediate return to its own slot, return from a hidden slot, and modal departure/return. Include scrolling and cross-column entry when checking the retained geometry safeguards. Documentation and test revisions follow the code cleanup and hands-on verification, as requested.
