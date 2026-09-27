# Wiki–Code Reconciliation Report — Epic 3.5 (Board Drag Interaction)

**Run:** 2026-09-14, read-only pass — nothing in the repo edited.
**Wiki pages compared:** [`docs/wiki/board-drag-interaction/`](../wiki/board-drag-interaction/README.md),
[`docs/wiki/item-positioning/`](../wiki/item-positioning/README.md)
**Product owner's baseline:** `38b1287` ("epic 3.5 planning and documentation") — the wiki as the PO last saw it.
**Wiki as amended / code:** `e77e31f` ("implementing story 3 - Pop state machine + Card/Column drop bands") — HEAD.

**Purpose.** Story 3's hands-on work amended the wiki several times to describe what got built (two-way popping, a
snap tween, band guides, a frozen band rect). Those amendments were never reviewed by the product owner as
*decisions* — they were written as implementation notes. This report finds every place the wiki and the code
disagree, or where the wiki was changed to match the code without the PO in the loop, so the PO can decide for each
one whether to amend the page or treat it as a requirement the code is missing.

**Convention:** every entry that quotes the wiki tags the quote **[original]** (the PO's own text at `38b1287`) or
**[amended]** (added during Stories 1–3, not reviewed). Entries keep the numbering from the working-session pass
(1–27) so they can be cross-referenced. Each entry ends with a `**Decision:**` line, left blank on purpose — fill it
in in place as calls are made, the same convention as the code-quality audits in this folder.

**Out of scope:** the test-plan catalog (the test-reconciler's job at epic wrap-up), all server code, and the
item-attachment wiki page beyond entry 27 (flagged but not audited).

**Outcome (walkthrough with the product owner, 2026-09-15).** Every entry has a decision. Two entries were added
during the walkthrough (section F). The wiki pages were edited in place for each ruling; the story record got two
dated corrections (decision 5, the `DragTuningContext` bullet). Code follow-ups, in priority order:

1. **Built during the review:** #14 — done-list comparator (`itemListOps.ts`), unit-tested.
2. **Built right after the review (2026-09-15):** #29 — reopened-done-item preview slot; #20 + #21 — bounded
   regions, sub-row clipping, scroll-aware frozen rect, `regionAt` tests, the `pastColumnEnd` E2E fix; #15 + #22 —
   pulled forward from "ride-along with Story 4/5" once #20's `regionAt` rewrite touched the same files anyway:
   resync on a dropped response that carried reindex pairs, restore the pending marker on cancel, keep the active
   drag's ghost through a mid-drag response. See each entry's own Status line for what actually landed, including
   two bugs the real-browser E2E run caught that unit tests alone didn't (§20's status: a `overflow-x-auto`-implies-
   `overflow-y: auto` CSS quirk, and a DOMRect-spread hazard). client 199 unit / 131 E2E (6 pre-existing skips) /
   316 server, tsc + eslint + prettier clean.
3. **Known gap, not this epic:** #28 — cross-item stale pair, transport-dependent, needs per-row versioning.

Standing rulings that outlive this report: the DnD threshold *values* are unlocked and automated tests assert
reachability, not timing (#3); the drag tuning panel is a tuning-phase tool, retired once the values lock (#23);
errors go to the console, warnings don't (#18).

---

## A. Code behavior the original wiki didn't specify (12)

Each of these is built and working. The wiki was amended during implementation to describe it, so the page now
*reads* as settled — but the PO never saw the change. The question for each is whether the amendment stands.

### 1. Two-way pop with a free "popped-out" state
**File:** `client/src/components/workflow/popSession.ts:70-108`

**[original]** drag §3: "When the cursor establishes a *different* context, the item pops into it. On popping: the
axis lock releases. The item snaps to the cursor and follows it fully thereafter. The item is now being positioned
within the *new* context, under that context's rules." One transition, straight into the new context.

**[amended]** "Popping is two-way … **Pop out** … the item pops out: it snaps to the cursor and follows it freely,
belonging to no context. **Pop in**. A popped-out item enters a context when the cursor rests in that context's
pop-eligible band … past the pop-in threshold."

**Code does:** three states — locked (clamped to its context) → popped out (belongs to nothing, follows the
cursor) → locked again in whichever region the cursor rests in. A release while popped out still resolves by the
band under the cursor. The popped-out state is a real, reachable place, not a transition.

**Decision:** Ratified (2026-09-15). The two-way model is better than the one-shot pop originally written — leaving
and entering are separate, deliberate acts. Amendment stands.

### 2. Pop-in re-clamps the card to the new context
**File:** `client/src/components/workflow/useBoardDnd.ts:383-397`

**[original]** drag §2: "The axis lock releases. The item snaps to the cursor and follows it fully thereafter.
*(Existing free-drag behavior.)*" — once popped, free for the rest of the drag.

**[amended]** "It is now positioned within that context under its rules **and bounded by it**, exactly as it was
bounded by the origin."

**Code does:** after a pop-in the DragOverlay is clamped to the new context's rect exactly as it was to the origin —
sideways for a merged column, both axes for a sub-row. Leaving again takes another full pop-out.

**Decision:** Ratified (2026-09-15). Follows from entry 1 — a context is a context whether it's the origin or one
popped into. Amendment stands.

### 3. A second threshold, `popInDelayMs` — in-context placement in another column now costs two waits
**File:** `client/src/components/workflow/dragTuning.ts:34-47`, `popSession.ts:104`, `popSession.ts:135`

**[original]** drag §3.1: "Provisional value: the cursor rests inside (or outside) a context window continuously
for **0.5 seconds**." §5: "Holding there past the threshold pops the Card into the column." One window.

**[amended]** §3.1: "two clocks … **Pop-out** … fires once `popDelayMs` has elapsed … **Pop-in** … fires from the
middle band only." §5: "out of its old context first, then in (§3: two thresholds, run back to back when the
cursor simply rests)."

**Code does:** `popDelayMs` 500 ms for the pop-out and `popInDelayMs` 500 ms for the pop-in, each its own panel
value. Resting in another column's middle band reaches its in-context (anchor + side) placement after 1.0 s by
default, not 0.5 s.

**Decision:** Model ratified, values deliberately unlocked (2026-09-15). Pop-out → pop-in, two clocks, is the
intended mechanic. `popDelayMs` / `popInDelayMs` are **not** locked — still being tuned by feel via the panel, no
target settle time committed; the 1.0 s default is where the tuning currently sits, not a decision. **Testing
ruling, standing beyond this entry:** automated tests assert *reachability* ("it is possible to pop out / pop in /
place in a column") and the correctness of the resulting write — never a timing sequence. A case whose pass
depends on a threshold value (move here, wait this long, expect that) is fragile against retuning and is a feel
judgment ("appropriate balance of friction and allowance") besides; it belongs in the manual test-plan catalog
until the values settle, and may stay manual even then. The test-reconciler and the epic's test-plan work from
this split. Written into §3.1.

### 4. Pop-out fires anywhere outside the context, not only in another context
**File:** `client/src/components/workflow/popSession.ts:84-96`

**[original]** drag §3: "When the cursor establishes a *different* context, the item pops into it." The trigger is
another context.

**[amended]** "When the cursor has stayed *outside* the card's context — anywhere: another column, the gap between
columns, Unsorted — past the pop-out threshold, the item pops out."

**Code does:** the pop-out clock starts the moment the cursor leaves the context and runs wherever it is — the gap
between columns, Unsorted, a broken column — and resets only when it comes back inside. No other context has to be
established.

**Decision:** Ratified (2026-09-15). Leaving is its own act; it shouldn't need a destination to count. Note that
under entry 20's bounded regions "outside" now includes straight up or down out of the box, which is the same
rule applied more places. Amendment stands.

### 5. The snap is a tween
**File:** `client/src/components/workflow/useBoardDnd.ts:129-145`, `:226-236`

**[original]** drag §3: "The item snaps to the cursor." No animation stated.

**[amended]** "*As built:* a short tween (`popSnapMs`, a panel value; 0 teleports) from where the card was clamped
to the cursor, chasing the cursor if it moves meanwhile."

**Code does:** 150 ms ease-out cubic tween from the card's last drawn position toward the live clamped target,
re-rendered each animation frame so it chases a moving cursor. `popSnapMs` is a panel value; 0 teleports.

**Decision:** Ratified (2026-09-15). Cosmetic; a panel value; Story 8 owns the final look. Amendment stands.

### 6. Band guides are drawn during a Card drag
**File:** `client/src/components/BandGuides.tsx`, `BoardColumn.tsx:135-182`, `WorkphaseCardList.tsx:65-66`

**[original]** drag §5: no band visualization anywhere — only the ghost and a card-edge highlight (see entry 13).

**[amended]** "**The bands are shown while a Card is carried** (`BandGuides.tsx`, added after Story 3's hands-on):
every region the card doesn't currently belong to draws two subtle dashed lines at the boundaries, and the region
the cursor is in tints the band the cursor is in … Look is provisional (Story 8)."

**Code does:** dashed lines at `columnTopBand` and `1 − columnBottomBand` on every region the card doesn't belong
to; the hovered region's band tinted, drawn as one fixed-position box from the frozen entry rect. The card's own
context draws nothing.

**Decision:** Ratified (2026-09-15). The guides are how the bands become learnable; look is Story 8's, already
marked provisional. Under entry 13 the tinted band is also what replaced the card-edge highlight. Amendment stands.

### 7. Bands are measured against the region's rect frozen on entry
**File:** `client/src/components/workflow/popSession.ts:37-43`, `:113-125`, `:191`

**[original]** silent — a band measured against the live rect is the natural reading.

**[amended]** "**A band is measured against the region's rect as it was when the cursor entered it**, for as long as
the cursor stays … *(Settled in Story 3.)*"

**Code does:** `PopHover.rect` is captured on region entry and used for the band on every sample and on release.
Added to fix an expanded-column E2E failure (the ghost's insertion pushed the next sub-row under the pointer).
"Settled" here means settled by implementation, not by the product owner.

**Decision:** Ratified, now settled by the product owner too (2026-09-15) — with one refinement from entries 20/21:
the freeze is against the ghost's insertion *only*; the frozen rect follows scroll. §5 says both. Amendment stands.

### 8. The distance term is either/or, and applies to pop-out only
**File:** `client/src/components/workflow/popSession.ts:127-139`

**[original]** drag §3.1: "Candidate refinements the tuning should make comparable — a **distance** term alongside
duration (the further outside the context the cursor travels, the sooner the pop), *either* threshold satisfying
rather than both, or a combined function."

**[amended]** "fires once `popDelayMs` has elapsed **or** — when `popDistancePx` is non-zero — once the cursor is
at least that far outside the context's rect (either satisfies; distance ships disabled)."

**Code does:** `popDistancePx` pops out as soon as the cursor is that far outside the context rect, either
threshold satisfying; ships at 0 (off). It has no effect on pop-in, which is duration-only.

**Note:** planning decision 1 settled the either/or shape with the PO before the story; the pop-in exclusion came
with the two-way model and wasn't decided separately.

**Decision:** Ratified, including the pop-in exclusion (2026-09-15). Either/or was decided before the story;
distance-based pop-in isn't a thing — entering is duration-only. Amendment stands.

### 9. A drag from Unsorted begins with no context — and §1 still says every drag has one
**File:** `client/src/components/workflow/useBoardDnd.ts:277-282`, `boardDndUtils.ts:66`

**[original / unchanged]** drag §1: "**A drag always begins inside a context** … Every drag starts inside exactly
one, determined by what the item already is and how its column is currently displayed."

**[amended]** drag §3: "The one drag that starts without a context is one picked up outside every context
(Unsorted is drag-source only): it begins popped out."

**Code does:** Unsorted registers no region, so a card picked up there starts with `contextKey: null` — popped out,
following the cursor, with no collision targets until it pops into a column. §1 and §3 now contradict each other;
only §3 was amended.

**Decision:** Code is right; §1 was the doc bug, fixed (2026-09-15). Unsorted is a catch bucket for items the board
can't place (incomplete or mismatching data): drag-source only, never a drop target. Weighed "not a context" against
"a context guarded against drops" and chose **not a context**: it's already built, and it makes the invariant
structural — there is no drop path to have a bug in — where a guard is a check that can regress. Also, the §4
classification map already tags Unsorted Inert independently, so nothing is foreclosed. §1 now carves out the
exception ("except a drag picked up from Unsorted, which starts popped out with no context"). Forward note on entry
25: when Story 4 makes §3.2 real, check whether Unsorted's Inert tag should surface any hover feedback or whether
staying invisible (same as dead space) is fine — don't build that now.

### 10. The inversion tripwire runs only for writes the board previewed
**File:** `client/src/components/workflow/itemListOps.ts:258-260`

**[original]** positioning §5a: "Applies to any client holding a locally-ordered list, though the board drag is
what exercises it." Then, for every position write: "3. Check for inversions among items with real positions.
4. Re-sort only if an inversion was found."

**[amended]** "The check only runs for a write the board previewed; a Sheet edit that reassigns a position made no
ordinal claim."

**Code does:** `completeItemWrite` returns before the check when the written item has no placement — a Sheet edit
that reparents, or an inline create, never trips it. Step 4 has no separate mechanism: render order is derived from
`position` every render, so applying the rows is the re-sort.

**Decision:** Ratified (2026-09-15). Correct scope — a write that made no ordinal claim has nothing to invert
against. Amendment stands.

### 11. §10's closing paragraph was deleted
**File:** `client/src/components/workflow/useBoardDnd.ts:352-353`, `useItemManagement.ts:53-57`

**[original]** drag §10: "Position is resolved server-side against true current data, so there is no cheap
always-correct client-side position to preview — the board may briefly show its pre-drop order until the response
lands. This is a documented, deliberate tradeoff carried over from Epic 3.2, not a correctness gap."

**[amended]** paragraph removed; replaced with an "As built (Story 3)" description of the placement layer.

**Code does:** the pending placement is set synchronously on release, so there is no pre-drop transient to
describe. Removed by planning decision 4 because it contradicted §10's own ordinal-preview rule — but it is a
deletion of the product owner's text.

**Decision:** Deletion was correct; the silence wasn't — replaced, not just removed (2026-09-15). The paragraph
described a transient that no longer exists: the placement the request implies is computed client-side
(`pendingPlacementFor` — a pure function of the same request being sent) and applied to render state synchronously
in `writes.begin()` on release, *before* the request goes out. §10 now carries a one-paragraph note saying exactly
that and quoting the retired caveat, so the old reasoning stays traceable instead of erased.

### 12. §4 gained three rulings during Story 2
**File:** `client/src/components/workflow/dragClassification.ts:55-71`, `useBoardDnd.ts:267-269`

**[amended]** drag §4: "**Cycle-forming wins.** A descendant of the carried item is Cycle-forming even when it
would also fail the depth cap." · "**What is Inert** (settled in Story 2)" — Unsorted, a broken column, an
expanded column's outer wrapper; and the interim Stub-drag rule. · "**The depth cap reaches the board over the
API.** `GET /boards/:id` carries `itemDepthCap`."

**Code does:** all three are built as described. None of the text is the product owner's; the original §4 stopped
at the four-state table, "computed once," and the two overlay assignments.

**Decision:** All three ratified (2026-09-15). Cycle-forming-wins, the Inert list, and the cap-over-the-API are
legitimate settled rules, not implementation notes. Amendment stands.

---

## B. Wiki rules the code doesn't meet (5)

The wiki states a behavior and the build does something else, or nothing. These are the candidates for "the code is
missing a requirement" — or for the rule being retired.

### 13. The band table's card-edge highlight isn't built
**File:** `client/src/components/workflow/boardDndUtils.ts:53-56`, `KanbanCard.tsx:16-21`

**[original]** drag §5, top band: "Ghost renders at the top; **highlight on the top edge of the current first
card**." Bottom band: "Ghost renders at the bottom; **highlight on the bottom edge of the current last card**."
Unchanged since the baseline.

**Code does:** when the cursor is in another region, collision detection returns that region's container and never
a card, so the card-edge side indicator (which needs `over` to be a card) never fires. The ghost at the slot and the
tinted band stand in for the highlight.

**Decision:** Retired (2026-09-15). The highlight's job was to show the insertion point; the ghost is now inserted
in the list at that slot and the band is tinted under the cursor, so the highlight would be redundant — and in the
one case where the ghost is off-screen (long column, scrolled) the first card's edge is off-screen too. §5's band
table now describes what the user actually sees per band. No code.

### 14. The ordinal preview is wrong for a done column
**File:** `client/src/components/workflow/itemListOps.ts:117-119`, `:210`

**[original]** drag §10: "the rendered projection of the server's answer is exactly what the client already drew."
drag §5: "A drop into a done column resolves as a workphase change; ordering there is by completion time."

**Code does:** done lists sort by `completedAt` ascending with null coerced to 0, so the ghost and the pending
marker draw at the **top** of Done; the server stamps `completedAt` and the item lands at the **bottom**. No
tripwire fires because done items are unpositioned and excluded from the check.

**Note:** from code reading; not observed in the browser. E2E DRAG-3.9 asserts the write, not the preview.

**Decision:** Code is missing the requirement; fixed (2026-09-15). §10 stands as written — completing an item is the
most common drag on the board, so a preview that jumps from top to bottom on every drop into Done is main-path, not
an edge case. Requirement, not implementation: *the preview for a drop into a done column lands where the list's
own sort will put the item once the server stamps it* — so if Done is ever flipped to newest-first, the preview
flips with it. Built as: a done list's comparator treats a missing `completedAt` as "completing now" (newest), the
same reading the server applies on the write (`itemHierarchy.ts` active/done split). Unit-tested in
`itemListOps.test.ts`. No wiki change.

### 15. A stale response drops its reindex pairs — two wiki rules conflict
**File:** `client/src/components/workflow/useItemManagement.ts:59-63`

**[original]** positioning §5: "A caller **applies the pairs it holds and ignores the rest**." drag §10: "Responses
must be sequenced per item so a stale one can't be applied last." Nothing says which wins when a stale response
carries pairs.

**Code does:** a response that isn't the item's latest sequence is dropped whole, pairs included. If write 1
triggered a reindex and its response lands after write 2's, the other rows' renumbered positions are never applied
— the exact silent-wrong order §5 warns about. Planning decision 5 chose this.

**Correction to the entry (2026-09-15):** arrival order is not the trigger. `begin()` bumps the item's sequence
when write 2 is *sent*, so response 1 is dropped whether it arrives before or after response 2. What's lost is the
same either way: the pairs describe *other* rows, and response 2 carries only the reindex it caused itself, so
nothing re-delivers them. Decision 5's "the later response supersedes them" was wrong on that point; corrected in
the story record.

**Decision:** Code is missing the requirement; fix rides along with the next touch of the write tracker (Story 4
or 5), not stop-the-line. Rule: *a stale response's own row is discarded — the newer write supersedes it — and if
the stale response also carried reindex pairs, the client resyncs (reloads the board).* Resync rather than
apply-the-pairs because the client can't tell whether the pairs are still current; a reload replaces every row
with the server's number and is correct in either arrival order. Engineer's choice between immediate (reload when
the stale response arrives) and deferred (a needs-resync flag, one reload after the item's latest write completes)
— deferred if it isn't costly to build or hold the state, since it needs no ordering assumption and coalesces a
burst into one reload; immediate otherwise. Priority reasoning: needs the same item re-dragged inside the response
window *and* write 1 to have reindexed; visual only, the DB is right throughout, a page refresh clears it; and the
realistic source of rapid writes is automated API calls, where the board isn't in play to keep state anyway. Covers
the same-item hole only — see entry 28 for the cross-item cousin. Entry 22's two picture fixes (restore the pending
marker on cancel; keep the active drag's ghost through a mid-drag response) ride along with this work.

**Status (2026-09-15):** built — immediate variant. `ItemWriteTracker.complete` now returns
`{ applied, needsResync }`: a stale response's row is still discarded, but `needsResync` is `true` whenever it
carried `reindexed` pairs, and `sendItemMove` reloads the board when it is. `boardDndUtils.test.ts` covers both the
resync and the no-op (no pairs disclosed) cases.

### 16. Depth-capped targets: "grey overlay" vs. dimming
**File:** `client/src/components/KanbanCard.tsx:32`

**[original]** drag §4, under "Settled overlay assignments": "**Depth-capped targets** get the **grey** overlay —
'real target, not for this item.'" Palette, weight and animation are deferred to Story 8, but the assignment itself
is stated as settled.

**Code does:** the target is dimmed through opacity (`overlayDepthCappedOpacity`, 0.4 by default, a panel value).
No grey layer is drawn.

**Decision:** Dimming ratified as the interim treatment (2026-09-15). "Grey overlay" was a name for a treatment;
what the assignment actually settles is the semantic — depth-capped is *de-emphasized, not hidden*, distinct from
Inert. Dimming meets that. §4 now states the semantic and marks the rendering as-built and Story 8's to finish.
No code.

### 17. Stub drags aren't bounded by their context
**File:** `client/src/components/workflow/useBoardDnd.ts:270-273`, `boardDndUtils.ts:61-63`

**[original]** drag §1: "**A Card** — the context for its Stubs (its attached descendants)." §2, while in-context:
"It is **bounded by its context**."

**Code does:** a Stub drag has no machine (`pop: null`) and no clamp; the overlay follows the cursor anywhere and
the drag is confined only by collision filtering to its siblings. Held closed pending Story 5 per the page header —
listed for completeness, not as a defect.

**Decision:** Requirement stands as written (2026-09-15). §1/§2 are the spec Story 5 builds to — a Stub's context is
its Card, and it is bounded by it. Not a Story 3 finding; no wiki change. Recorded so the next audit doesn't re-flag
it before Story 5 lands.

---

## C. Wiki text that claims more than the code does (2)

Amended text that describes the build inaccurately. Either the sentence is corrected or the code grows into it.

### 18. "Logged to the console" — it isn't
**File:** `client/src/components/workflow/itemListOps.ts:264-266`, `DragTuningPanel.tsx:126-136`

**[amended]** drag §10: "An inversion is logged to the console and counted in the dev/test panel." **[original]**
"If one fires, the client and server disagreed about what the drop meant — worth surfacing, not silently
repairing."

**Code does:** no console output. The inversion is appended to `inversions` in state and rendered only while the
dev/test panel is open. The original's "worth surfacing" is met only for a viewer who has the panel open at the
time.

**Decision:** Wording fix; the panel is the surfacing mechanism (2026-09-15). Checked the codebase's actual console
convention first: every client `console.*` call is `console.error` for a failed request (33 of them, one shape),
and the server logs only lifecycle milestones — there is no informational or warning logging anywhere. Ruling:
keep it that way for now — errors go to the console, warnings don't. The inversion log is kept across board
reloads while the board is open, so nothing is lost, just quiet until the panel is opened. §10 now says exactly
that and no longer claims console output. No code. Revisit only if inversions start firing in practice and the
panel proves too quiet.

### 19. The pop-in clock counts time in the region, not time in the band
**File:** `client/src/components/workflow/popSession.ts:120-124`, `:104`

**[amended]** drag §3: "A popped-out item enters a context when the cursor **rests in that context's pop-eligible
band** (§5: the middle band) past the pop-in threshold." §3.1: "**Pop-in** — starts when a popped-out card's cursor
enters a region … fires from the middle band only."

**Code does:** the hover's `since` survives band changes inside one region; pop-in fires when the band is middle
*and* the region entry is older than `popInDelayMs`. 400 ms in the top band followed by 100 ms in the middle pops
in. §3.1's wording is the accurate one; §3's is not.

**Decision:** Region clock ratified, on purpose (2026-09-15). The product owner's reading: hovering anywhere in a
region long enough means "I want *into* this column's context to choose the position myself" (or, once §6 lands,
to go on into a card's context); the bands are three quick auto-placements for when the column change is what
matters and the exact position isn't. Time in the top or bottom band therefore counts toward entering — the
middle band is a gate at fire time, not a separate clock. §3's pop-in bullet now says so, and the two-intents
framing is written into §3 as the *why*. No code. Part of the unlocked feel set per entry 3 (values), but the
mechanic itself is settled.

---

## D. Behavior neither version of the wiki addresses (6)

The code had to decide something the rules don't cover. Each is a choice the PO may want to ratify, change, or
write down.

### 20. A region is the column's full horizontal stripe, unbounded vertically
**File:** `client/src/components/workflow/dragRegions.ts:104-119`, `:130-136`

Silent on where a region ends vertically. The amended §3.1 states the rule as built: "The cursor's region is
decided by the column's horizontal extent, so a drag only leaves a region by moving sideways."

**Code does:** any point whose x falls within a column belongs to that column's region; above or below the body
clamps to the nearest band, and between two sub-rows the nearer wins. The cursor over the toolbar or below "+ Add
item" is still "in the column," and a column can never be left vertically.

**Decision:** Rejected as built; the wiki now states the rule and the code has to follow (2026-09-15). No reasoning
for the stripe exists anywhere — the story record says only "x-range hit test, nearest sub-row vertically." What it
bought (no accidental pop-out from vertical overshoot; no dead zones in a column) is real but the product owner
prefers the other reading: drifting off a column vertically *is* the user wanting out of its context, and the
gaps are nowhere just as the gap between columns is. **Rule:** a region is a bounded box — a merged column's
list box, or a sub-row's block — clipped to what's visible, and a Card's region (Story 4) is the same kind of box
hit-tested before its column, so there is one rule for every region and no special case for Story 4 to inherit.
Two companions make it coherent, both decided here: (1) a sub-row region is clipped to its column's visible
scroll box — a sub-row scrolled out of view isn't a region until it scrolls back in; (2) the frozen band rect
follows scroll (held in scroll-content coordinates, translated by the live offset) — the freeze was only ever
against the ghost's insertion. Written into §1, §3.1 and §5. Sub-row → sub-row was already pop-out-then-pop-in
(each sub-row is its own context); bounding changes only what the gaps and the outside are. **Code pending** —
`dragRegions.ts::regionAt` (containment only), sub-row clipping, the scroll-aware freeze in `popSession.ts`, the
`regionAt` unit tests, and any E2E that reaches a band from above or below the box (`pastColumnEnd` is the
suspect). Same Story 3 follow-up set as entries 14 (built) and 29.

**Status (2026-09-15):** built. `regionAt` is plain containment; `measureDragRegions` clips a sub-row's rect to its
column's `overflow-y-auto` scroll box via `findVerticalScrollAncestor` + `clipToVisible`, bounded to stop at the
board root (walking past it hit a real Chromium quirk — `overflow-x-auto` alone computes `overflow-y: auto` per the
CSS Overflow spec, so an unbounded walk found the board's own horizontal scroller and clipped every region against
it). `pastColumnEnd` (`tests/helpers/dragGesture.ts`) now targets the last `[data-drag-region]` inside the column
group instead of the group's own bottom edge, which sits below the region in the "+ Add item" row — the older
cross-column/cross-project suites' 1.b/2.b cases exercise exactly this. Caught along the way: `clipToVisible` spread
its input rect (`{ ...rect, ... }`), which silently drops every field from a *real* DOMRect (DOMRect's properties
are prototype getters, not the instance's own enumerable ones — jsdom's happens not to work that way, which is why
the unit tests didn't catch it; only a real Chromium run did). Fixed by reading each field explicitly; regression
test in `dragRegions.test.ts` uses a getter-based fake to reproduce the hazard rather than jsdom's own DOMRect.

### 21. The frozen rect doesn't follow auto-scroll
**File:** `client/src/components/workflow/popSession.ts:113-125`, `BandGuides.tsx:58-77`

Silent. Follows from entry 7's frozen-rect rule, which the amended §5 states without qualification.

**Code does:** in a long expanded column, dnd-kit's auto-scroll moves the hovered sub-row but the frozen entry rect
and the fixed-position guide box stay where they were; the band resolves against the stale rect until the cursor
changes region. By construction — not observed.

**Decision:** Resolved by entry 20's ruling (2026-09-15), not accepted as a limitation. Under the stripe rule this
was a tolerable wobble; under bounded regions "which sub-row, which band" is a precise question and a stale rect
gives a precisely wrong answer, so it had to be decided with #20. The frozen rect follows scroll (§5); the band
guide box follows with it. Code pending, same follow-up set.

**Status (2026-09-15):** built. `DragRegion.scrollTop` (the region's scrolling ancestor's live offset, 0 for a
merged column) is measured alongside its rect; `PopHover` carries the last-seen `scrollTop` next to the frozen
`rect`, and `popSession.ts::translateRect` shifts the frozen rect by the change in it each sample — a real scroll
carries the band with it, the ghost's own insertion (which never touches `scrollTop`) still can't. `BandGuides.tsx`
needed no change: `HoveredBandGuide` already reads `hover.rect` directly. Regression test in `popSession.test.ts`
(scroll one way, then back, same rect).

### 22. Re-dragging an item whose write is still pending
**File:** `client/src/components/workflow/useBoardDnd.ts:282`, `:287-293`, `:346-351`, `itemListOps.ts:260-263`

**[original]** drag §10: "**Re-dragging an item whose write is still pending** puts two writes in flight against
one row. Responses must be sequenced per item so a stale one can't be applied last." Nothing about what the board
shows meanwhile.

**Code does:** drag start overwrites the pending placement with the ghost. Escape, or a release that writes
nothing, then clears it — the item snaps back to its pre-write slot until the response lands. A response arriving
mid-drag of the same item clears the ghost.

**Decision:** Ratified as acceptable for now, documented in §10, improvements ride along with #15 (2026-09-15).
Two separate behaviors, both picture-only and self-correcting: (a) cancel / no-op release after a re-drag clears
the placement, so the item shows at its *pre-write* slot until the response lands; (b) a response landing
mid-drag clears the ghost, and the ghost is only re-asserted on the pop machine's next state change
(`useBoardDnd.ts:163-167`), not per pointer move — hold still and the in-list ghost is gone until you cross a band.
Same trigger window as #15 (re-drag inside the round trip; not reachable by hand on localhost). Fixes, both small,
folded into the #15 work since it's the same state in the same files: stash the pending marker on drag start and
restore it on cancel while the write is still in flight; don't let a response clear the active drag's placement.
Not a separate item. Unrelated to 14/28/29 — those are about where the preview draws, this is about what's shown
while two writes overlap.

**Status (2026-09-15):** built. (a) `handleDragStart` reads the item's current placement into the session's new
`priorPlacement` before the ghost overwrites it; a cancel or a release that writes nothing calls
`ItemWriteTracker.isPending` (backed by an `inFlight` id set in `useItemManagement.ts`, separate from `placements`
itself, which the live ghost also occupies) and restores `priorPlacement` instead of clearing outright when that
write is still outstanding. (b) a small reactive effect in `useBoardDnd.ts`, keyed on the placements map's
identity, re-asserts the active drag's ghost the moment it's found missing — compared against a
`wantedPlacementRef` (what the machine itself last asked to be shown), not mere presence: the ghost legitimately
reads as absent whenever the cursor is over nothing, and reacting to *that* looped the app against
`previewPlacement`'s own Map churn (`withPlacement` always returns a new Map, even setting the same value) until
the comparison was made ref-based rather than presence-based.

### 23. The dev/test panel is a production toolbar button
**File:** `client/src/components/BoardToolbar.tsx:161-165`, `workflow/dragTuning.ts:49`, `:69-92`

**[original]** drag §3.1: "**The dev/test panel exposing every threshold is a required deliverable of this
feature, not a debugging convenience.**" Nothing about where it lives or who sees it.

**Code does:** a "Drag tuning" button in the board toolbar, always shown — read-only boards included. Values
persist per browser in `localStorage` under `kanban_drag_tuning`. Planning decision 2 said "always available
(single-user app)".

**Decision:** Fine as is; no prescriptive wiki text about the tool (2026-09-15). The panel exists to let the humans
change the numbers and feel the difference; it is a tuning-phase tool that goes away once the values lock and
become constants, so where it lives and who sees it isn't worth specifying. §3.1 records only that — the lifetime
and the deliberate non-specification — so a later reader doesn't polish or gate it. No code.

### 24. A middle-band release by a covered-set member writes nothing
**File:** `client/src/components/workflow/boardDndUtils.ts:267-270`

**[original]** drag §5, middle band: "The item takes the column's workphase and keeps the position it already
has." §8: "§5's 'takes the first workphase in the range' applies only to a drop into a column the item wasn't
already in."

**Code does:** for an item already in the column's covered set, `bandDropResolution` returns null and no request is
sent. Consistent with §8's spirit, but §5's sentence is never literally executed for a member — the only way to be
in one's own column's band is to have popped out of it.

**Decision:** Ratified, and the reading is now explicit (2026-09-15): releasing in the middle band of the column the
item was already in is *setting the card back down*, not a reposition — no call is made. §5's middle-band row now
says so and points at §8, so it no longer reads as if a member should be written. No code.

### 25. §3.2 is currently vacuous — nothing reads the classification to decide poppability
**File:** `client/src/components/workflow/useBoardDnd.ts:269`, `popSession.ts:99-107`

**[original]** drag §3.2: "**A context the drop would be rejected from must not be enterable.** … Validity is
decided before the affordance is offered."

**Code does:** the §4 classification map is computed at drag start, but the pop machine never consults it: column
regions are always valid for a Card, and a Card is not yet a context. The rule becomes real in Story 4.

**Decision:** No action; Story 4's to make real (2026-09-15). Two forward notes for that story: (1) from entry 9 —
Unsorted is not a pop-region *and* is tagged Inert in the §4 map; when §3.2 goes live, decide whether that tag
should produce any hover feedback or whether invisible-like-dead-space is fine; (2) from entry 20 — a Card's region
is a bounded box hit-tested before the column that contains it, same rule as every other region.

---

## E. Doc-internal inconsistencies (2)

Not wiki-versus-code — records that disagree with themselves, or pages that aren't the product owner's original
either.

### 26. The Story 3 record contradicts itself on `DragTuningContext`
**File:** `docs/planning/epic-3-5-stories/story-3-pop-state-machine-column-bands.md:295-296`, `:343-345`;
`client/src/components/workflow/DragTuningContext.ts`

Line 343: "`DragTuningContext` was planned and dropped — the hook takes the tuning as a dep, the panel takes it as
props … nothing needed a context." Line 295, fifty lines earlier: "the tuning values reach the guides through a
small `DragTuningContext`."

**Code does:** the context exists and the band guides read it. The "dropped" bullet predates the guides and is
stale.

**Decision:** Doc hygiene, done (2026-09-15). The stale bullet now says the context exists for the band guides only,
with a parenthetical that the earlier "dropped" claim predated them.

### 27. The item-attachment page also carries Story 1 amendments
**File:** `docs/wiki/item-attachment/README.md` (`git diff 38b1287 e77e31f -- docs/wiki/item-attachment/`)

Added during Story 1: "Attached with no parent" is rejected; a Free item may be reparented and stay Free; "on the
write means every write"; the subtree includes detached descendants; "the formula is the whole rule";
cross-workflow reparenting is accepted at the API.

**Code does:** server-side and outside the gesture, so not audited in this pass. Flagged only so that page isn't
taken as the product owner's original when the drag pages are reviewed.

**Decision:** Out of scope here; gets its own reconciliation when Stories 4/5 touch that page (2026-09-15). Until
then the item-attachment page's Story 1 amendments are to be read as unreviewed, same convention as this report's
**[amended]** tag.

---

## F. Found during the product owner's walkthrough (2)

Not from the read-only pass — surfaced while tracing entries 14 and 15 with the product owner on 2026-09-15.
Numbered on from 27 so they can be cross-referenced the same way.

### 28. A stale reindex pair can land after a fresher response for a *different* item
**File:** `client/src/components/workflow/itemListOps.ts:188-197` (`applyItemWriteResponse`),
`useItemManagement.ts:59-63`

Cousin of entry 15 with no discard involved. Write X reindexes and renumbers A as a side effect; A's own write is
in flight at the same time; A's response arrives *before* X's. X's pairs then set A back to its number as of write
X, overwriting A's fresher row. Per-item sequencing never engages (X's response *is* X's latest), and the tripwire
is silent (X's own claim holds; A's was checked before it was regressed).

**Trigger condition:** response arrival order inverted relative to server commit order. `PATCH /items/:id/move`
is synchronous end to end (`server/src/routes/items.ts:318-347`, better-sqlite3), so the server emits responses in
commit order; the inversion needs the transport to reorder two back-to-back responses. Doesn't happen on localhost
in practice. Becomes real if the server ever runs over a network or a handler gains an `await` before its
transaction.

**Decision:** Known gap, recorded, not for this epic. Entry 15's resync doesn't cover it (nothing is dropped, so
nothing fires); closing it means per-row versioning — a pair applies only if it's newer than what the row already
holds — which is a design change to the write path. Revisit if either trigger condition changes.

### 29. The mirror of entry 14: a reopened done item previews at the top, lands at the bottom
**File:** `client/src/components/workflow/itemListOps.ts:91-93` (`byPositionThenCreatedAt`),
`server/src/lib/itemHierarchy.ts:243-249`

A *done* item dragged into an *active* column's middle band: slot `'existing'`, the item's `position` is `null`,
`byPositionThenCreatedAt` coerces null to `0` → the ghost and pending marker draw at the **top**. The server's
append fallback ("an item with no position to keep — reopened done item — takes the append fallback") lands it at
the **bottom**. Same class as entry 14 in the other direction; the tripwire misses it for the same reason
(unpositioned items are excluded). Reopening is far rarer than completing.

**Not fixed with 14** because the comparator is shared: Stub lists and the Unsorted bucket sort through it too,
and a null there would flip from first to last. Arbitrary either way, but a wider change than 14's.

**Decision:** Fix, right after this review (2026-09-15). Same requirement as 14 — the preview lands where the server
will — but fixed at the placement, not the comparator: when the carried item has no position and the target is an
active region's middle band (or a bare workphase move), the preview slot is `'last'`, which is literally the
server's rule ("no position to keep → append fallback"). `placementFor` and `pendingPlacementFor` plus a test each;
no effect on Stub lists or Unsorted. No wiki change — §10 already states the rule.

**Status (2026-09-15):** built, at the placement as planned. `placementFor` (`popSession.ts`) and
`pendingPlacementFor` (`boardDndUtils.ts`) each take the active item's `position` now and preview `'last'` instead
of `'existing'` whenever it's `null` and the target region isn't terminal — covering both places band resolution
lands on `'existing'` (a bare workphase move and, after popping in, the in-context case). `byPositionThenCreatedAt`
untouched, as decided.

The product owner's text was taken as the two wiki pages at `38b1287` ("epic 3.5 planning and documentation"); the
amended text as the same pages at `e77e31f` ("implementing story 3"); the code as the client at `e77e31f`. Every
claim above comes from reading the files below in full and diffing the wiki pages between the two commits. Nothing
was run in a browser for this pass, and nothing in the repository was edited.

Files read in full:

- `client/src/components/workflow/` — `popSession.ts`, `dragRegions.ts`, `useBoardDnd.ts`, `boardDndUtils.ts`,
  `itemListOps.ts`, `useItemManagement.ts`, `dragTuning.ts`, `dragClassification.ts`, `DragSessionContext.ts`,
  `DragTuningContext.ts`
- `client/src/components/` — `BoardView.tsx`, `BoardColumn.tsx`, `WorkphaseCardList.tsx`, `KanbanCard.tsx`,
  `BandGuides.tsx`, `DragTuningPanel.tsx`, `BoardToolbar.tsx`
- Tests consulted for intent: `popSession.test.ts`, `tests/ui/drag-column-bands.spec.ts`

Companion to the code-quality audits in this folder. Line numbers refer to `e77e31f`.
