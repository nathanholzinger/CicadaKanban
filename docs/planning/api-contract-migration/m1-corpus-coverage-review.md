# M1 — Corpus Case-Claim Review and Reconciler Handoff

**Prepared:** 2026-10-30 by the Architect · **Base:** `ee819ea` · **Scope:** source precheck of every case ID carried by the frozen corpus; not a catalog-stamping run or a substitute for the normal Reconciler

## Result and bounded correction

The pre-change corpus contains **31 case-bearing titles, 38 ID mentions and 35 distinct IDs**, not Batch 1's reported 30/37/34. The earlier count matched numeric suite parts and missed `TC-X.6`. The baseline record is corrected explicitly; the source evidence has not changed retroactively.

One claim is incorrect: `TC-X.6`'s Then places X after A and checks that X was excluded when finding A's next neighbor. The corpus's `item self anchor refused` instead names X itself as the anchor and expects a 400. The corpus title and its snapshot key therefore lose only the `TC-X.6: ` prefix. No replacement ID or catalog mapping is assigned. The real `TC-X.6` surface test remains in `server/tests/routes/items.positioning.test.ts`, titled `TC-X.6: excludes the item itself from its own scope query on reposition`.

After correction there are **30 case-bearing titles, 37 mentions and 34 distinct IDs**, still **77 examples**. Exact source comparison against `ee819ea` proves the title prefix is the sole change to `compatibilityCases.ts`. Parsing both snapshot files and comparing all 77 key/value entries after the single key rename proves every payload string identical; a normal Vitest run also sorts that entry to its new alphabetical location. Captured requests, statuses, messages, bodies, database deltas, fixtures and harness expectations are identical. No snapshot-update command was used and no golden value was regenerated to accommodate a validator.

Every remaining claim was compared with its catalog's complete Given/When/Then, not merely its title. The corpus is useful additional compatibility evidence; many examples cover only one clause or use a narrower fixture. Three claims appear to exercise a complete Then through HTTP, listed below for the Reconciler's judgment. Nothing here adds a catalog pointer, changes a status, replaces an existing surface test or declares coverage supplied by generated schemas.

## Per-case review

Each row identifies a corpus example by its case ID and distinguishing title text from `server/tests/contracts/compatibilityCases.ts`. The harness asserts expected status and refusal/read no-write behavior; snapshots pin the returned representation and database delta. That is stronger than shape validation but still requires business-rule review of the golden values. The catalog's existing automation pointers remain in force.

| Case | Corpus example / evidence | Limit or proposed disposition |
|---|---|---|
| ATT-1.3 | `item workphase-only cascades attached descendants and notifies` | One attached child, not a multi-level attached chain; partial |
| ATT-1.6 | Same workphase-only example | Detached child remains unchanged for this non-terminal move; tagged example does not cover terminal/back-out sequence; partial |
| TC-2.24 | Same workphase-only example | Pins unchanged positioned item; tagged example does not cover no-position fallback; partial |
| ATT-9.11 | `item explicit null workphase clears it` | Free root clear, not full nested detach and create-null scenarios; partial |
| TC-6.1 | `item terminal workphase clears position and sets completion` | Move branch, not create-in-terminal branch; partial |
| TC-6.3 | Same terminal example | Null position on move, not create and detach branches; partial |
| TC-6.2 | `item reopening appends and clears completion` | Done Free item reopens, completion becomes null; candidate additional full-Then evidence |
| TC-6.9 | Same reopening example | Append/no-old-position evidence; fixture differs from catalog's stated last-position setup. Reconciler checks exact expected position against the full case; do not stamp from title |
| ATT-9.1 | `item attached child rejects explicit null workphase` | One refusal; omits accepted parent-workphase/omission/attach/detach combinations; partial |
| ATT-7.1 | `item detach keeps parent and takes shown workphase` | PATCH detach retains parent; edit path remains with existing route tests; partial |
| ATT-9.4 | Same detach example | Omits nested shown-workphase contrast, corrupted stored phase and later parent move; partial |
| ATT-7.7 | `item null parent clears attachment` | Active PATCH branch, not edit and terminal branch; partial |
| ATT-9.5 | Same null-parent example | Omits nested shown-versus-root contrast, corrupt stored phase and edit path; partial |
| ATT-3.11 | `item reparent without flag stays free` | Destination shares the workphase; omits contrasting W2 and edit branch; partial |
| TC-7.11 | `item attach and anchor use resulting sibling scope` | Resulting attached scope exercised with one existing child, not two-child middle gap and the catalog's old-position contrast; partial |
| TC-2.34 | `item empty anchor is a missing row` | After-side refusal only, without simultaneous workphase change; partial |
| TC-X.6 | `item self anchor refused` | Wrong rule association; prefix removed from title/snapshot key only. Existing true case test retained |
| TC-7.10 | `item foreign anchor refused by scope` | Foreign-workflow refusal, not every resulting-scope/reparent/attached-anchor variant; partial |
| TC-2.5 | `item before anchor resolves position` | Single prepend; no repeated-prepend floor invariant; partial |
| TC-5.2 | `item append after large anchor discloses reindex` | Magnitude-trigger example and frozen outcome; verify threshold/result against the catalog, not merely presence of disclosure |
| TC-5.9 | Same append/reindex example | Magnitude trigger, not catalog's precision-gap setup and client-order consequence; partial |
| TC-2.32 | `item explicit position wins over other faults` | Null-position multi-fault refusal, not numeric-alone/with-valid-anchor and batch-endpoint 404 variants; partial |
| ATT-1.8 | `item parentless attach refused` | Parentless PATCH refusal only; omits edit and null-parent-with-explicit-flag variants; partial |
| ATT-9.8 | `item foreign workphase refused` | No-reparent refusal; omits same-project reparent variant; partial |
| TREE-6.2 | Empty-body, both-null-neighbors and reparent-append examples | Same-parent/append and populated-parent outcomes, not the complete child-to-top-level/empty-resulting-parent matrix; partial |
| TREE-6.1 | `project null prev permits next neighbor` | Next-neighbor selection only; omits both reparent directions and self-row exclusion example; partial |
| TREE-6.6 | `project explicit position wins over all field shapes` | Null-position multi-fault example, not numeric-alone/valid-neighbor forms; partial |
| TREE-3.10 | `project empty parent names missing row` | Move only, not create and edit; partial |
| TREE-6.5 | `project self neighbor refused` | Prev/self only, not next/self; partial |
| TREE-6.3 | Outside-resulting-scope and no-position examples | Selected-prev cases, not full four-condition/both-sides matrix; partial |
| TREE-4.5 | `project append after large neighbor discloses reindex` | Top-level anchor case, not catalog's reparent into P plus non-reindex control; partial |
| TC-2.13 | `attached item detail has sibling scope and depth` | HTTP read of attached child returns attached-siblings; candidate additional full-Then evidence |
| TC-2.16 | `unsorted item detail has null workflow and no scope` | No-workphase state constructed without deletion; catalog's workphase-deletion precondition not exercised here; partial |
| TC-2.15 | `done item detail has completion and no scope` | HTTP read of done Free item returns none; candidate additional full-Then evidence |
| TC-7.18 | `foreign item detail derives stored workflow but no scope` | Foreign state injected through fixture, not produced by the catalog's project/workflow transition; partial |

## Normal review still required

- **Reconciler:** check these claims against the finished code and the catalog's existing tests together; verify golden values independently where a full-Then claim is proposed. This precheck grants no new mapping or automatic framework coverage.
- **Whole-catalog lost coverage:** required at the normal M1 closeout because Batch 2 moved/retired test files. The three retained native/integrated/characterization groups and the 77 snapshot expectations remain. This bounded corpus review is not that whole-catalog run.
- **PO/Test Planner:** no new rule or Planned passage is implemented, and no case wording/status is changed. Technical omission/association/conversion probes are infrastructure checks and need no invented business cases.
- **Audit:** the structural-refactor audit follows the committed review scope under the normal workflow. No cold audit, role approval, M1 sign-off or completed-main integration is claimed here.
