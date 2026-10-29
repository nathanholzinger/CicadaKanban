# Story 8.1 — Wiki and comment drift review

**Date:** 2026-10-29  
**Reviewed HEAD:** `e6ed208252df5214adb0a3ca13d4fcf81456d4fb`  
**Implementation range:** `2c4a7f9..e6ed208`, including the fold, overlay/measurement fix, and Phase 3b cleanup.

The wiki still describes the removed Card layer. Most implementation comments have followed the change, but several still describe its separate region, dashed attach ghost, or timing assumptions. This report lists **nine wiki update groups, seven production-comment findings, and seven test-source comment groups**.

This is a documentation handoff against the current implementation, which Nathan reports behaves as expected. It does not propose restoring the old behavior or prescribe replacement prose. No wiki, source comment, test, or test-plan file was edited.

## Scope and interpretation

- Reviewed `docs/wiki/board-drag-interaction/README.md` against the current region, pop, projection, rendering, overlay, and release code. Searched the related hierarchy-placement, attachment, positioning, and boards wiki pages for affected rules.
- Reviewed comments in the affected production modules and surrounding drag helpers, including the workflow directory's `CLAUDE.md`. Test-source comments are included; adjacent titles are noted where they repeat the same obsolete claim. Test bodies, coverage, and test-plan reconciliation are outside this review.
- Plans, roadmaps, archived documents, and the earlier cleanup report are not living-description findings here. Their historical descriptions are not treated as stale code comments.
- Locations below are file lines at the reviewed HEAD. Short excerpts identify the passage; the explanation describes the mismatch and the facts its owner needs to account for.
- Production and test-source comment findings are **Fix Now for accuracy** under the Auditor guide. That is a documentation tier, not a runtime defect classification. Skipped tests remain explicitly identified; the report does not recommend unskipping or changing their assertions without their owner's review.

The implementation now has the stack **Board → Column/sub-row → a Card's Descendants**. On the board, the Descendants region is the Card's root box; in the hierarchy modal, the list carries the region and the dialog supplies its outer bounds. Every Card can provide the layer, including a childless one. Zooming from the column enters it directly; leaving it previews the item Free in the column. A release inside it uses the projection's gap and depth.

## Wiki handoff — Product Owner

All locations in this section are in `docs/wiki/board-drag-interaction/README.md`.

### 1. The context definitions and layer table still contain a separate Card layer

**Locations:** §1, lines **45–53**, **69–74**; §1.1, **85–97**, **107–120**, **133–137**; §5, **507–508**.

The context list gives a Card an auto-drop within-action and puts Descendants another layer inside it. The table says “exactly four layers.” The Stub-start paragraph says popping out lands on the Card; the transition rules describe the intermediate Card state and a second pop from it. The guide-visibility explanation also refers to a separately locked Card.

There are now three layers. A Card's Descendants context is reached directly from its column or sub-row, and its parent is that same column or sub-row. The visible Card remains the container, but there is no additional Card context with an auto-drop action. The prohibition on direct sibling-to-sibling hops still holds: moving between Cards passes through their column context.

**Code evidence:** `dragRegions.ts:95–111`; `dragStructure.ts:236–246`, `:259–278`; `popSession.ts:192–224`.

### 2. The pop description and tuning list still require the removed zoom step

**Locations:** §3, **252–276**; §3.1, **322–333**.

The pop-out description gives Descendants a Card parent. The pop-in description requires a second hold over the section after entering the Card. The tuning list still names a `Card → Descendants` edge and `descendantsPopInDelayMs`.

The named-Card dwell and cue now enter Descendants directly. Only the column-entry clock and the two-stage Card zoom remain as entry clocks; there is no section-entry timer after that zoom. The pop-out clock measures departure from the current Card box or modal dialog and leads to the column/sub-row.

**Code evidence:** `popSession.ts:152–157`, `:203–224`, `:270–284`; `dragTuning.ts::DragTuning` and `DEFAULT_DRAG_TUNING`.

### 3. Childless Cards are still described as having no Descendants layer

**Locations:** §1.1, **94–97**; §7.1, **721–723**.

The wiki says their Descendants layer is unreachable and that an empty hierarchy never occurs on the board.

A childless Card now registers the same Descendants region as any other Card. Its placement space has one gap at depth zero: the root's sole child. The shared empty-hierarchy rule in wiki hierarchy-placement §2 already describes that boundary correctly; the board page's exclusion of it is obsolete.

**Code evidence:** `KanbanCard.tsx:217–225`; `descendantsProjection.ts:94–127`, `:246–253`; `lib/hierarchyPlacement.ts::depthRangeFor`.

### 4. Attaching is still described as an unconditional last-child auto-drop

**Locations:** §6, **586–601**, **621–627**; §8, **868–872**.

The opening says attaching is “always as the last child,” with “no band, no anchor, no choice of position.” It distinguishes a Card-layer auto-drop from manual placement another layer deeper and says the ghost stays pinned last regardless of cursor movement. The reparent paragraph repeats that two-stage choice.

Last-child placement is now the **entry seed for an item arriving from outside**, not the only result of a release in the Card. Once inside Descendants, the cursor chooses gap and depth, and the release can attach at that resolved location in the target hierarchy. A Stub returning to its own Card can seed at its original slot instead. There is no intervening auto-drop-only context.

**Code evidence:** `descendantsProjection.ts:102–138`, `:246–253`, `:278–284`; `placement.ts:120–140`; `useBoardDnd.ts:705–712`.

### 5. The section-entry explanation still depends on a ghost already shown at the Card layer

**Locations:** §7, **678–705**.

The section is reached by entering a Card and then holding over its descendants. The text explains its seed as “where the Card layer showed it” and says an immediate release commits what it would have at that layer. The argument against bands also relies on the Card's auto-drop within-action.

There is one zoom from the column. The seed preserves the intended default: last child for an outside item, the pickup slot for the Card's own Stub when visible, or last child when that original slot is hidden. An immediate release at the visible own slot writes nothing. Returning from the modal requires leaving to the column and zooming back; it no longer starts from a Card-layer stop. The reasons for gap/depth placement must stand without an auto-drop layer.

**Code evidence:** `useBoardDnd.ts:183–187`, `:545–562`; `descendantsProjection.ts:102–116`, `:209–214`, `:246–253`, `:278–284`.

### 6. The modal-opening hold still uses the section's smaller box

**Location:** §7.3, **771–775**.

The hold requires the cursor inside “the section's box” and resets when it leaves the section.

On the board, containment now uses the whole Card's region. Moving into Card padding or the title area does not by itself leave Descendants or cancel the hold. The hold continues only if its gap/depth/side target also remains unchanged; leaving the Card's bounds ends it. This is a behavior-boundary change, not simply replacing a layer name.

**Code evidence:** `KanbanCard.tsx:217–225`; `popSession.ts:200–229`, `::containmentRect`; `useBoardDnd.ts:371–378`; `popSession.ts:399–410`.

### 7. The detach section still promises two pops and an intermediate safe set-down

**Location:** §8, **842–866**.

The numbered sequence is `Descendants → Card → column/sub-row`. Its distance explanation compares two nested boxes, and the intermediate Card state allows a release that always restores the Stub without writing.

Leaving the Descendants region now takes one pop to the containing column/sub-row, where the item previews Free. The Card title is still inside Descendants, so releasing there uses the current gap and depth; it is not an unconditional safe stop. A no-write set-down remains available at the Stub's own gap/depth, and an invalid projection also writes nothing, but neither is the removed intermediate state.

The later rules that a committed detach preserves `parentId` and keeps an already-covered workphase remain valid.

**Code evidence:** `dragStructure.ts:236–246`; `placement.ts:138–158`; `descendantsProjection.ts:278–284`; `dragRequest.ts:92–98`.

### 8. The modal exit descriptions and their rationale still count the removed layer

**Locations:** §7.3, **805–811**, **823–826**.

Leaving either a hold-opened or click-opened modal is said to land at the Card layer, with another pop needed to detach. The rationale against a separate modal layer says it would take three pops to leave the Card. Reopening the modal is described as being back in the section without explaining the return through the column.

The modal is still the same Descendants layer, but its parent is now the containing column/sub-row. A pop outside its dialog closes it and previews the item Free there. To return to the section and open the modal again, the drag must zoom back into the Card from the column. A hypothetical extra modal layer would add an extra step to today's one-pop departure, rather than to the former two-pop departure.

**Code evidence:** `HierarchyModal.tsx::HierarchyModal` region registration; `dragStructure.ts:259–278`; `useBoardDnd.ts:389–392`, `:672–681`.

### 9. The visual descriptions still refer to the removed Card-layer placeholder

**Locations:** §5a, **548–557**; §6.1, **648–651**; §7, **683–686**; Open questions, **1050–1055**.

The form-switch explanation starts “From the Card layer down — Card and Descendants.” Zoom completion opens the Card “with its placeholder Stub.” The Open questions passage describes that current placeholder as dashed blue like the zoom cue.

Both copies are Stub rows at Descendants; they switch at the direct column-to-Descendants boundary. The in-list ghost is now an ordinary sortable section row, not the deleted inert dashed attach ghost. The zoom cue itself remains a dashed outline with a fill bar, so that part of the current-look description is still accurate. The proposed future morph can remain an open design question; its description of today's placeholder needs to follow the actual row.

**Code evidence:** `placement.ts::overlayFormFor`; `StubRows.tsx:209–224`; `KanbanCard.tsx:239–249`; `dragChrome.tsx:163–180`.

## Production comments — Fix Now for accuracy

Paths here are relative to `client/src/components/` unless otherwise stated.

### 10. Collision safety is still attributed to the old timing separation

**Location:** `workflow/dragCollision.ts:144–147`.

The comment says painted region geometry and stored droppable rectangles are safe to mix because a Card's sortable transform “at the default clocks can't overlap a Descendants lock.”

The direct zoom removed that timing separation. The current safeguard is that `KanbanCard.tsx:173–178` disables the locked Card's transition so its rows are measured at rest. Also, dnd-kit's transform-agnostic measurement does not generally remove ancestor transforms; the blanket “without transforms” explanation is too broad for the failure this safeguard addresses. The explanation needs to account for the actual measurement/transition invariant, rather than depend on default timer values.

### 11. Reseeding still explains `own` as being read from previewed rows

**Location:** `workflow/descendantsProjection.ts:180–185`.

The rationale says `slotHidden` must stay because “the rows `own` is read from still place the Stub as the Card's last child,” where a real move could be mistaken for the original slot.

`own` is now derived from the pickup snapshot, `sample.ownSlot`, at lines **102–103**. `pickupSlot` reads that original slot once, and `useBoardDnd` retains it even while the Stub is previewed elsewhere. The statement about where `own` comes from is therefore false. `slotHidden` is still preserved by `reseedProjection` and still affects preview/no-op handling; its explanation needs to describe that current role without claiming a live-row lookup.

### 12. Placement still refers to two layers below a card list

**Location:** `workflow/placement.ts:143–146`.

The detach-preview comment says a card-list region can be “reached from either layer below.” There is now only one layer below a column/sub-row: Descendants. The `parentId: null` preview behavior it explains remains correct.

### 13. The parent-validity helper still describes two separate region registrations

**Location:** `workflow/dragClassification.ts:45–48`.

The region-gate explanation asks whether “a Card, or its Descendants section” resolves as a region. Those were distinct registrations. The Card's root now is its Descendants region, and only the modal substitutes another element for that same key. The shared validity check remains correct; the description of the surfaces it gates is outdated.

### 14. The Card render comment still claims both drag copies are always shortCards

**Location:** `KanbanCard.tsx:157–163`.

It says the DragOverlay and in-list copy “both render as a shortCard.” This needs a scope qualification. At Descendants, the carried copy uses the Stub branch at **241–246**, and the in-list item uses `AttachedChildRow` in `StubRows.tsx:214–224`. The shortCard explanation applies while the copies are in a card-list/Board presentation. The module header already distinguishes the overlay's Stub form, so this local explanation now disagrees with its own file.

### 15. `StubBody` still lists the removed dashed ghost as one of its renderers

**Location:** `StubRows.tsx:17–22`.

The shared-body explanation lists outer boxes as “dashed ghost, sortable row, static row, carried shadow.” The dashed attach-ghost renderer was removed. The active section ghost now shares the sortable row path; there is no separate dashed ghost box to keep in sync. The other listed renderers still exist.

### 16. The shared cue is still described as always ending in a layer change

**Location:** `dragChrome.tsx:143–152`.

The opening calls this “The cue of a hold that ends in a layer change,” then lists both Card zoom and modal opening. The modal hold opens another presentation of the same Descendants context; its context key does not change. The two uses still share a cue, but they do not share that transition property. This mismatch predates the fold and remains visible in the code reviewed.

**Code evidence:** `useBoardDnd.ts:371–396`; `popSession.ts:390–410`; the directory's `CLAUDE.md:81–88` already identifies modal opening as not being a layer change.

## Test-source comments and adjacent labels

These are text-accuracy findings, not an assessment of whether the tests prove their cases. Accurate skip reasons that explicitly say the Card layer is gone are not findings. Locations inside skipped tests are retained here so their owners can distinguish obsolete setup explanations from descriptions of current behavior.

### 17. Active detach tests still describe the deleted two-pop route

**File:** `tests/ui/drag-5-stub-detach.spec.ts`.

- **185**, **210–213**: the title and comment say two pop-outs fire back to back before reaching the column. That arrival is now one pop from Descendants.
- **236–244**, **268–271**: the cascade explanation and title name `Descendants → Card → Column`, two nested boxes, and an intermediate Card state. Those states no longer exist. The general need to resample after a layer change remains valid, but this narrative does not describe today's route.
- **295–298**, **310–315**: the reparent setup counts two outward pops followed by a third zoom clock. There is one departure to the column, followed by the named Card's dwell and cue into its Descendants. The explanation of the layout shift needs that current sequence.

### 18. Skipped set-down tests still describe Card titles as a separate safe state

**File:** `tests/ui/drag-5-stub-detach.spec.ts`.

- **111**, **132–134**: the skipped grandchild case's title and comment rely on the Card-layer set-down and contrast it with an inert attach ghost that lacks item attributes/children. Both the separate state and ghost renderer are gone.
- **148**, **170–173**: the skipped own-Stub case says resting over the title pops from Descendants to Card and then stops before a second pop. The title area is now inside Descendants, so it causes no layer change. Release uses projection, with no blanket guarantee of restoring the pickup slot.

The skip reasons at **110** and **147** already explain the removal correctly.

### 19. The modal helper and exit labels still return to the removed Card layer

**File:** `tests/ui/drag-7-hierarchy-modal.spec.ts`.

- **65–67**: `pullOutAndZoomBack` is described as leaving the modal at the Card layer and returning to the section from there. Modal departure now lands in the column; return requires a named-Card zoom from that context.
- **338**, **362**: the skipped exit case's title and release comment promise the old Card-layer no-write set-down. A release after departure now follows the column's placement and can commit a detach.
- **368**: the active detach title calls it a “second pop” and says “two pops, as from the section.” There is one pop from either presentation of Descendants to the column.

The skip reason at **337** is already accurate.

### 20. Modal-hold comments still use the smaller section boundary and old return path

**File:** `tests/ui/drag-7-modal-hold.spec.ts`.

- **190**, **205–207**, **215**: the skipped boundary case's title and comments say the Card's padding is outside the hold's area and that returning to the section restarts it. Padding remains inside the whole-Card layer; leaving the section alone does not reset an otherwise unchanged hold. Its skip explanation at **189** correctly states this.
- **736**, **741**: the skipped reopen case says modal departure leaves the drag at Card layer, followed by moving back into the section. The current route is departure to the column, then zoom back into the Card's Descendants before another overflow hold. Its skip explanation at **716** already records the new route.

### 21. Classification commentary still justifies a target using the intermediate stop

**Location:** `tests/ui/drag-target-classification.spec.ts:138–140`.

The comment says `P` is Valid “for the intermediate Card-layer stop.” There is no such stop. `P` remains the source Card whose Descendants the Stub may return to, and the classification assertions can be described without the removed layer.

### 22. The hierarchy-walk example still names an attach-ghost leaf workaround that was removed

**Location:** `client/src/components/workflow/itemListOps.test.ts:227–229`.

The generic point—that a callback returning no children stops recursion—is still true. The claim that `KanbanCard.tsx` relies on it “to keep its attach-ghost row a leaf” is stale. `KanbanCard` now passes its ordinary placement-aware child accessor to `hierarchyRows` at **200–203**, without that special leaf callback, and the inert attach ghost is gone.

### 23. The column-end helper still describes separate Card and section region elements

**Location:** `tests/helpers/dragGesture.ts:230–235`.

It says a Card carries `data-drag-region` “and so does its Descendants section,” and that excluding `descendants:` would still pick a Card's section. On the board, the Card root is now the single `descendants:` element; its section wrapper has no second region. Excluding that prefix would exclude the Card root too.

The positive `CARD_LIST_REGION_SELECTOR` remains the correct implementation. What needs updating is the explanation of why that selector is used, not the selector itself.

## Statements checked that should not be changed merely because the fold happened

- **“Two pops” is not universally obsolete.** `popSession.ts:160–165` still correctly describes a decisive pull that can cascade from Descendants through the column to Board. The wiki's §1.1 rule 3 example at **126–131** also has a valid two-hop interpretation in today's stack. The obsolete sequence is specifically `Descendants → Card → column`.
- **“Card” is still a valid name for the visible container.** Comments such as `useIsLockedAtCard` and the active-context outline need not be renamed just because there is no separate Card-layer state. Findings above concern claims of an additional layer or region, not every use of that word.
- **The workflow `CLAUDE.md` already describes the folded stack, whole-Card bounds, pickup slot, and overlay origin.** No additional stale removed-symbol description was found there. The cleanup's `cardListAt` and release-path comments also follow their current APIs.
- **The shared empty-hierarchy rule is already correct.** The required update is the board wiki's assertion that it cannot arise, not a change to wiki hierarchy-placement §2.
- **The other related wiki pages did not reveal another fold-specific contradiction in the passages searched.** Attachment consequences, hierarchy limits, workphase inheritance, and position ownership are unchanged by the layer removal.
- **The cue's final look and zoom-in morph remain open design work.** Removing references to a current dashed attach ghost does not settle those design questions.

## Verification and handoff

This was a static comparison of current source, comments, and wiki passages, with the Phase 3b diff checked so already-updated explanations were not reported again. `npm.cmd run check:docs` passed (386 files, zero hits). No runtime or browser verification was repeated for this documentation-only report. No test-plan reconciliation was performed.

The Product Owner can use findings **1–9** for the wiki pass. The code-comment owner can use **10–16**, and the test-source owner can use **17–23** alongside their eventual test review. The report supplies current behavior and implementation evidence; wording and edits remain with those owners.
