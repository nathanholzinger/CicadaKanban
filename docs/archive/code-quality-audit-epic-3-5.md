# Code quality audit — Epic 3.5

**Reviewed:** 2026-11-18 · **Status:** review complete; 15 required findings open; five optional structural findings · **Next owner:** Architect, to plan fix batches in [the audit plan](../planning/epic-3-5-stories/epic-3-5-audit.md)

The finished board drag layer, project-sidebar drag layer and their shared infrastructure were read through Duplication & Abstraction, File Responsibility, and Consistency & Drift. All 18 cold instances completed. The required findings are inaccurate comments; no required consolidation or split was established. Source and tests are unchanged.

## Scope and execution

- **Range:** `epic-3-2-complete..6962415c15df41434b557934ce4cbd106c1ab4a9`, 302 commits, excluding the base. The base tag resolves to `16e6a19432a0a2bf9aa31414a53ae5dc83a8a200`.
- **Frozen end:** `6962415c15df41434b557934ce4cbd106c1ab4a9`, the committed Story 10 close and epic-audit planning. Nathan confirmed Story 10 was closed before execution; the initial working tree was clean.
- **Actual review:** 57 code files, 10,999 lines, read whole through all three lenses; root `AGENTS.md` and `client/src/components/workflow/AGENTS.md`, 662 lines, read whole through Drift only. The exact paths, hashes and primary readers are in [the manifest](epic-3-5-scopes/manifest.json).
- **Generated annotations:** the full-range scanner retained 340 eligible files and omitted 766 moved lines from its changed-line annotations. The selected targets have 9,173 changed code lines, 662 changed instruction lines and 21 removal sites. Every selected file was read whole, including its old and moved code; the annotations did not limit that reading.
- **Exclusions:** everything under `docs/` as a quality-review target, all test code, tooling and other unselected files. Plans and routing records were orchestration inputs. Correctness & Security did not run, by Nathan's approved scope; this report makes no new correctness or test-coverage certification.

The split is saved in [config.json](epic-3-5-scopes/config.json), with generated scopes and raw results in [the scope packet](epic-3-5-scopes/README.md). Its four `out` instances were not spawned. A separate check verified actual readers for every selected file, rather than accepting those placeholders as coverage.

| Lens                      | Completed instances                                            |
| ------------------------- | -------------------------------------------------------------- |
| Duplication & Abstraction | map; gesture; writes; rows; targeting; shells; server          |
| File Responsibility       | gesture-targeting; writes-shared; rows-shells; server          |
| Consistency & Drift       | targeting; gesture; writes; rows; shells; server; instructions |

Duplication ran horizontally across the two features. The map first skimmed all 50 client code files, including private helper signatures and responsibility blocks. Its eight nominations were assigned as code-site comparisons to independent job readers. Rows additionally read `HierarchyModal.tsx` and `BoardColumn.tsx`, plus the existing `ConfirmDeleteButton.tsx` contract as direct helper context; targeting additionally read `DragSessionContext.ts` and `dragChrome.tsx`; shells additionally read `dragStructure.ts` and `placement.ts`. Every nominated comparison received full reads, not a verdict from the skim. [Comparison assignments](epic-3-5-scopes/comparison-assignments.json) preserve those additions without changing the 57-file primary manifest.

At most three subagents ran concurrently. One usage-limit interruption stopped targeting, shells and server Duplication; the same instances resumed without restarting completed work. [execution.json](epic-3-5-scopes/execution.json) records task identities, scope hashes, completion records and the interruption. All instances reported no unreviewed assigned files.

The orchestrator independently retraced all 15 required claims and the five optional seams. Reconciliation read the audit plan, MVP Deferrals and the Epic 3.5 roadmap. No finding required an archived story ruling. No additional coverage review ran, as Nathan ruled; no finding needs a coverage-review merge, PO decision or new destination. The frozen forced-stop and out-of-order reconciliation behaviors remain unchanged: the findings there correct descriptions of existing code, not its policy.

## Fix Now

All findings in this section are **Consistency & Drift** findings. Their fixes are comments only; do not change behavior to make the existing prose true.

### 1. Reindex disclosure is justified by a false claim about the database mutation

**Locations:** `server/src/lib/positionResolver.ts:28-30`; implementation at `:301-305`.

The `ReindexedPosition` comment says a reindex changes positions and never another field. The mutation also sets every renumbered row's `updatedAt`. The two-field disclosure is real; its stated reason is false.

**Fix:** describe the disclosure as position pairs only and acknowledge the persisted timestamp update. Preserve the mutation and response shape.

### 2. The position-scope header equates API classification with the resolver's SQL predicate

**Locations:** `server/src/lib/itemPositionScope.ts:1-3`, `:9-10`; implementations at `:26-34`, `:81-88`.

The header calls `positionScopeFor` the classification rule expressed as SQL. Classification returns `none` for Free items in terminal or foreign workphases. The SQL helper instead follows the stored workphase's workflow and has no project-validity lookup; its callers handle the other transition decisions. The contracts cannot be substituted as the header suggests.

**Fix:** distinguish API classification from the resolver's comparison-bucket query and state where the terminal/workflow-validity decisions sit. Preserve both implementations.

### 3. Project move's precedence comment says the unused neighbor is unchecked

**Locations:** `server/src/routes/projects.ts:201-203`; checks at `:218-227`, `:245-255`.

When both neighbors are supplied, the comment says only `prevId` is checked and `nextId` is ignored. Both shapes are checked first: a valid `prevId` with `nextId: 123` is refused. Only row validation and placement use the selected neighbor alone.

**Fix:** say both supplied fields receive shape validation, after which `prevId` takes precedence for row validation and placement.

### 4. Position-threshold comments give the wrong row-count crossover

**Locations:** `server/src/lib/positionResolver.ts:17-18`; implementation at `:309-317`.

The comments say the row-count allowance starts above 1,000 rows. The trigger is actually `candidate >= max(1000, rows + 100)`. At 950 rows, candidate 1,001 does not reindex; the threshold is 1,050. The allowance starts affecting the threshold above 900 rows, and equality triggers it.

**Fix:** describe the two comparisons or their effective maximum accurately. Preserve the threshold logic.

### 5. Collision comments describe a factory and a cached view that do not exist

**Locations:** `client/src/components/workflow/dragCollision.ts:74-75`, `:100-103`; caller at `client/src/components/workflow/useBoardDnd.ts:486-513`.

`resolveBoardCollisions` is described as a factory over a ref-held `CollisionSession`. It directly accepts a view and returns collisions. The callback builds that view locally from the hook's current drag-session ref on each call; it does not cache a `CollisionSession` in a ref.

**Fix:** describe the per-call resolver and caller-supplied view. Preserve the current callback and ref lifetimes.

### 6. The anchor-separation rationale excludes Free descendants that can be named

**Location:** `client/src/components/workflow/dragCollision.ts:288-293`; counterexample described correctly at `:245-249` and implemented at `:274-279`.

The rationale claims the same outcome on both surfaces: no row of the dragged subtree can be Top or Bottom. The sidebar removes its whole subtree, but the board removes only the carried attached branch. Free descendants remain Cards and may be named as adjacent anchors. With sortable Cards `[A, F]`, where Free `F` is a child of `A`, dragging `A` in its own slot can name `F` with side `before`.

**Fix:** distinguish the board's attached branch from the sidebar's whole subtree. Keep the existing reason for separate neighbor and gap readers; do not remove that separation ruling or change anchor behavior.

### 7. Vertical clipping is explained by a nonexistent whole-column scrolling guarantee

**Location:** `client/src/components/workflow/dragStructure.ts:218-220`; board container at `client/src/components/BoardView.tsx:382`.

The comment says horizontal bounds need no clipping because the board scrolls whole columns and never a fraction of one. The board uses ordinary `overflow-x-auto`, without column snapping, so a column may be partially visible.

**Fix:** retain the accurate vertical-only contract and remove the whole-column guarantee. Preserve clipping behavior; if a reason is retained, it must describe the actual constraint.

### 8. Optimistic project moves are described as sent and replayed in send order

**Locations:** `client/src/components/sidebar/useProjectCollection.ts:48-49`; `client/src/lib/hierarchy.ts:51-52`, `:65-66`, `:110`; `client/src/components/sidebar/projectTreeUtils.ts:68-70`; `client/src/components/sidebar/useProjectDragReorder.ts:110-112`.

`reorder` records the move before `writeInTurn` can wait for an earlier write of that project (`useProjectCollection.ts:174-178`). With A1 outstanding, A2 queued and then B released, markers replay in A1/A2/B release order while requests go out A1/B/A2. The comments conflate the optimistic overlay with the request scheduler.

**Fix:** describe released/enqueued moves awaiting settlement and their recorded release order. Keep actual send numbering distinct. Correct all matching descriptions together; preserve queue and replay behavior.

### 9. The workphase-record comment overstates its unchanged-value exemption

**Location:** `client/src/components/workflow/itemWriteReconciliation.ts:96-100`; implementation at `:117-134`.

The comment says a row already holding the answer's workphase is never claimed. The early return checks only the written row. When that row changes, the cascade records every reached attached descendant not protected by a later write, including a child already holding the destination workphase.

**Fix:** distinguish an unchanged written row, which starts no cascade, from the descendants claimed by a changed written row. Preserve the frozen workphase-currency policy; do not add a value-equality filter or new test variant.

### 10. `appliedRows` is described as a synchronous copy of reconciled project state

**Location:** `client/src/components/sidebar/useProjectCollection.ts:61-62`; implementation at `:124-127`.

The ref stores the raw written row, while React state separately receives the reindex fold and newer-position protection. Reindexed peers' ref entries are not updated, and a raw response position can differ from the protected position in state. The ref supports parent comparisons and known-id tracking, not a fully reconciled position snapshot.

**Fix:** narrow its contract to those actual uses and say reconciled positions are not mirrored. Do not expand the ref's responsibility or change reconciliation.

### 11. `isPending` promises to track any outstanding request

**Locations:** `client/src/components/workflow/useItemManagement.ts:43`, supporting description at `:65-67`; implementation at `:88-122`.

The contract says whether a write for the item is outstanding. Begin two sequences for one item, then complete or fail the latest while the older request remains unresolved: the id leaves `inFlight`, so `isPending` is false. That is correct for the latest marker's ownership, but not a statement about all network activity.

**Fix:** describe the item's latest tracked write and marker-restoration purpose. Preserve supersession and tracker behavior.

### 12. The card-list region contract includes broken columns that supply no region

**Location:** `client/src/components/CardList.tsx:17`; callers at `client/src/components/BoardColumn.tsx:79-89`, `:170`.

The contract says a list is a region iff it is a merged column's list or an expanded column's sub-row. Broken columns satisfy those descriptions but deliberately supply no region key in either form.

**Fix:** qualify both forms as belonging to an unbroken column, retaining the Unsorted drag-source distinction.

### 13. The overlay comment assigns shortCard-only meaning to shared paths

**Location:** `client/src/components/KanbanCard.tsx:199-201`; counterexamples at `:206`, `:217`, `:301`.

The comment says `isOverlay` everywhere else means the shortCard drag copy. It remains true for the Stub copy too: both forms use the branch line and explicit width before the Stub-render branch.

**Fix:** describe `isOverlay` as the carried copy in either form and `overlayIsStub` as its Stub selector, or remove the universal claim.

### 14. `useLatest` promises its new value at the wrong effect boundary

**Location:** `client/src/components/workflow/useLatest.ts:5-8`; implementation at `:11-13`.

The contract says the previous value lasts until commit. On updates, its passive `useEffect` updates the ref later than layout effects in that commit. Calling the hook before a consumer's layout effect cannot make its value current there; the separate Escape helper deliberately uses a layout effect for that different requirement.

**Fix:** describe retaining the prior value until this hook's passive effect runs, and its ordering relative to other passive effects. Preserve the ordinary-effect implementation and the separate `useEscapeKey` timing.

### 15. Flash summaries omit the waiting-flash exception to reload cancellation

**Locations:** `client/src/components/workflow/ForcedStopContext.ts:6-7`; `client/src/components/workflow/useForcedStop.ts:3-5`; accurate distinction at `useForcedStop.ts:51-58`.

The summaries say another reload clears the flash. `reloadStarted` clears a playing flash but preserves a waiting one; repeated reload starts before `boardDrawn` still leave that waiting flash to play. The lower implementation comment already states this distinction.

**Fix:** qualify cancellation as applying to an already-playing flash and state that a waiting flash survives those reload starts until the board is drawn. Correct descriptions only; preserve the frozen cue's lifetime, implementation and existing tests, with no new rule or variant.

## Routed to a story's plan

None. Every required finding remains open for this audit's fix planning. Existing MVP deferrals are unchanged.

## Watch List

These five structural suggestions are optional. None establishes that the current structure already makes a change unsafe.

### 16. The gesture hook has a cached-region lifecycle seam [File Responsibility]

**Locations:** `client/src/components/workflow/useBoardDnd.ts:198-211`, `:275-326`, `:359-362`.

Its cached structure, seen-element set, invalidation, sampling and parent lookup form a stateful facility inside gesture orchestration. When reworked, a small hook/helper could own those refs and expose resolution, sampling and parent lookup over the existing pure `dragStructure` algorithms. Keep projection, transitions, modal effects and their ordering in the gesture hook. Current centralized ordering remains readable; length alone does not require a split.

### 17. Generic hierarchy math also constructs control presentation [File Responsibility]

**Locations:** `client/src/lib/hierarchy.ts:29-34`, `:215-262`.

Select options, indentation characters and disabled-action wording have UI callers and reasons to change separately from traversal and positioning. A future hierarchy-controls adapter could call the existing generic math. The current pure helpers are small and adjacent. **Can ride along with #8**, which already edits this file, if the Architect judges the additional extraction worthwhile; it remains optional and is larger than the comment correction.

### 18. Shared drag visuals import board-specific gesture adapters [File Responsibility]

**Locations:** `client/src/components/dragChrome.tsx:42-61`, `:79-139`, `:141-215`, `:218-285`.

Shared tier/line/branch visuals sit with board-specific dnd, session, placement and forced-stop adapters plus `NamedAnchorSync`. On a substantial rework, keep surface-independent visuals together and move board integration separately. Preserve `useItemRow`/indicator colocation: the reason at `:152-157` still applies. No current change risk requires this dependency split.

### 19. The modal and Sheet duplicate a small close control [Duplication & Abstraction]

**Locations:** `client/src/components/ModalShell.tsx:67-73`; direct counterpart `client/src/components/ItemDetailPanel.tsx:320-326`.

The icon, markup and seven Tailwind classes agree; only callback and accessible label differ. A small shared control or named class constant could centralize future changes while preserving today's presentation. There is no existing helper bypass or divergence, so this is optional consolidation, not a new visual-design task.

### 20. Hierarchy transition effects have a separate maintenance seam [File Responsibility]

**Locations:** `server/src/lib/itemHierarchy.ts:330-346`, `:435-480`, `:485-502`.

Activity wording/metadata and notification emission could move to a transition-effects module when they grow. Pass previous/resulting state, relevant rows, timestamp and transaction explicitly. Keep `validateHierarchyRequest`, `resolveCreate` and `applyHierarchyRequest` as the single hierarchy-write interface, and keep effects in the same transaction. The current sections remain readable; no immediate split is required.

## Covered by

No newly raised finding needs a Covered-by disposition.

## Informational

### 21. Full horizontal comparisons support the existing abstraction boundaries [Duplication & Abstraction]

All eight map nominations received full comparisons. Their verdicts are preserved in the raw job results, independently of the discovery skim.

| Comparison                  | Result and code evidence                                                                                                                                                                                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAP-1 — pending insertion   | Keep project replay and board placement adapters: their missing-neighbor fallbacks differ explicitly (`hierarchy.ts:60-102`, `itemListOps.ts:138-172`). A tiny index operation does not justify a new adapter layer.                                                                                        |
| MAP-2 — write orchestration | Common currency already lives in `positionRecord`/`applyWriteResponse`; project queues and item/Sheet lifecycles remain distinct (`useProjectCollection.ts:97-140`, `useItemManagement.ts:88-170`, `positionedWrite.ts:18-71`). This is not a new correctness certification of the frozen reconciliation.   |
| MAP-3 — pickup subtree      | Both traversals call the same `getSubtree`; the sidebar needs the full result while classification exposes subtree ids (`dragTargets.ts:53-89`, `useProjectDragReorder.ts:80-98`). Repeating one pickup-time computation is not a duplicated implementation.                                                |
| MAP-4 — section composition | `hierarchyRows`, `sectionEntries` and `SectionRows` already share the rules; the remaining Card/modal differences are wiring and presentation (`KanbanCard.tsx:237-260`, `HierarchyModal.tsx:147-155`, `StubRows.tsx:202-242`).                                                                             |
| MAP-5 — delete confirmation | The project replaces an action cluster and changes row-wide pending presentation; the existing button has a different contract (`SortableProjectRow.tsx:88-225`, `BoardColumn.tsx:134-145`, `ConfirmDeleteButton.tsx:12-91`). The separation reason is already recorded at `ConfirmDeleteInline.tsx:18-24`. |
| MAP-6 — dwell/cue holds     | Keys, reset policies, tuning and outcomes differ; the cue already shares `ZoomCue` (`popSession.ts:286-303,396-437`, `DragSessionContext.ts:166-186`, `dragChrome.tsx:241-285`). Keep the small policy expressions separate.                                                                                |
| MAP-7 — column facts        | Short metadata projections agree, while placement membership is a different operation (`BoardColumn.tsx:59-89`, `dragStructure.ts:307-340`, `placement.ts:190-196`). No shared placement abstraction is warranted at this size.                                                                             |
| MAP-8 — child wording       | Singular/plural wording agrees; toggle, hidden-child and carried-branch labels have different jobs (`KanbanCard.tsx:325-337`, `StubRows.tsx:120`, `dragChrome.tsx:218-236`). The common fragment is too small to justify another abstraction.                                                               |

The existing board/sidebar seeding, neighbor/gap readers, line placement, indent metrics, process-boundary depth checks and passive/layout ref timing keep their recorded distinctions. Finding #6 corrects a false sentence in one separation rationale without overturning the boundary.

### 22. Large files mostly retain coherent responsibilities [File Responsibility + Duplication & Abstraction]

The pop machine, projection, region vocabulary/DOM adapter and placement modules remain cohesive around their state or data contracts. `BoardView`, `KanbanCard`, `HierarchyModal` and `StubRows` already delegate shared operations and keep their own view lifecycles together. The server's creation, existing-item transition and terminal-flag backfill have different initialization/preservation/batch contracts while sharing position math and scope queries (`routes/items.ts:179-210`, `itemHierarchy.ts:379-417`, direct counterpart `routes/workphases.ts:103-150`). Single-row versus batch lookups and early-exit versus full-level tree walks likewise serve different contracts. No required split or additional consolidation follows from their size or superficial similarity.

## Validation and handoff

All 18 result files and scope hashes were checked, all eight nominations have completed full readers, and the 59 primary targets still match the frozen commit. Source, tests, schemas, wiki and catalog fields are unchanged. No runtime probe, full gate or E2E rerun was needed for this read-only review; documentation/configuration checks are recorded in the execution packet.

The Architect owns fix batching in the audit plan. All 15 required corrections should describe the current code, preserve recorded separation reasons and avoid changing frozen behavior. Optional findings remain optional. The plan's existing code-review, gate, E2E and review/commit stops apply to any ensuing batches. Nathan owns the `epic-3-5-audited` tag; no tag or commit was created here.

## Close-out

Review is complete; the audit remains open until each required finding is fixed, routed to a destination that names it, or rejected with its reason. No implementation disposition is claimed by this review.

| Finding                              | Disposition | Next owner                                                |
| ------------------------------------ | ----------- | --------------------------------------------------------- |
| #1 — reindex mutation description    | Open        | Architect: plan comment correction                        |
| #2 — position-scope contracts        | Open        | Architect: plan comment correction                        |
| #3 — neighbor validation precedence  | Open        | Architect: plan comment correction                        |
| #4 — reindex threshold description   | Open        | Architect: plan comment correction                        |
| #5 — collision resolver contract     | Open        | Architect: plan comment correction                        |
| #6 — branch versus subtree rationale | Open        | Architect: preserve separation reason while correcting it |
| #7 — horizontal scrolling rationale  | Open        | Architect: preserve clipping behavior                     |
| #8 — queued versus sent moves        | Open        | Architect: correct all matching descriptions together     |
| #9 — cascade write ownership         | Open        | Architect: preserve frozen reconciliation policy          |
| #10 — raw project-answer ref         | Open        | Architect: narrow documented responsibility               |
| #11 — latest pending-write contract  | Open        | Architect: preserve marker ownership policy               |
| #12 — broken-column region contract  | Open        | Architect: plan comment correction                        |
| #13 — overlay-form description       | Open        | Architect: plan comment correction                        |
| #14 — passive-effect ref timing      | Open        | Architect: preserve effect timing                         |
| #15 — waiting-flash exception        | Open        | Architect: preserve frozen cue behavior                   |
