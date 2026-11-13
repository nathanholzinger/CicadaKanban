# Epic 3.5 Story 10 — batch 4g. TREE

**Type:** story plan, one batch of Story 10 · **Written:** 2026-11-13, moved from [Story 10's batch doc](story-10-batches.md), whose standing rules and four stops govern it · **Status:** not started

This file is the batch's plan. It holds the batch's cases, its Proof list, its suggested variants, its Results packet, its Open questions and its Review log, and the Reconciler reads it at the batch's close. A session for this batch reads root `AGENTS.md`, its persona, the batch doc's standing rules and stops, this file, and the cases and wiki sections in scope. It doesn't read the other batches' files or [the 4a to 4d log](story-10-batch-4a-4d-log.md).

## The batch

Moved word for word from the batch doc. "Above" and "below" in it refer to that doc as it stood before the split.

### 4g. TREE

**Specs:** `project-tree-drag.spec.ts`, with TREE-1.4's and TREE-2.1's skips; `project-sidebar.spec.ts`, `project-tree-sidebar.spec.ts` and `project-tree-expansion.spec.ts`; `useProjectCollection.test.ts` for TREE-9.4.

| Kind   | Cases                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| Extend | TREE-1.8, 1.11, 1.12; TREE-2.2, 2.3; TREE-4.7; TREE-11.7                                                              |
| New    | TREE-1.2, 1.5, 1.6, 1.10, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19; TREE-2.10, 2.11, 2.12, 2.13; TREE-4.9, 4.11, 4.15 |
| Rework | TREE-1.4                                                                                                              |
| Split  | TREE-2.1, its skip reworked; TREE-2.4, 2.5, 2.6, 2.7, 2.14                                                            |
| Coder  | TREE-9.4                                                                                                              |

- **TREE-1.14** starts with the Coder's fix: leave out the held rows only, not their children (Inbound deferrals). The depths a gap beside `Y` offers are a behaviour question. If the wiki doesn't settle them, they go to the PO (D6).
- **TREE-9.4:** the Coder fixes its fixture and expected outcome. `X`, already saved in the deleted subtree, is deleted with it and stays absent. Each of the variants with several answers rechecks `Q` and that nothing else was written. If the confirming run still finds no fresh read, a surface test follows.
- **TREE-2.2, 2.3, 4.7 and 4.15** hold the answer with `holdRequests.ts`.
- **TREE-1.19, the shuffle under a still cursor,** is the likeliest to miss D2's bar. If it does, the Planner checks the case's wording before anyone proposes `Manual`.
- **TREE-2.13** measures both the line's top-edge position and its start in the ghost name's column with `boxOf`. Name-column alignment is geometry under D13 and stays automated; only the line's painted strength is Manual.
- **TREE-2.8** is the shared Manual sidebar appearance case; the remaining Split cases keep tier, ghost and line state, branch presence, saved outcomes and geometry. TREE-2.13 keeps its top-edge and name-column measurements; its painted line strength is TREE-2.8's.
- **TREE-2.1's skip** carries #12 from the 8.8, 8.11 and 8.12 audit: its title and reason say "dimmed", so both are replaced (Inbound deferrals).
- **TREE-1.8, 1.11, 1.12, 1.14, 1.19, 2.12, 2.14, 4.9 and 11.7:** the new or extended surface tests cover their App, hook and component candidates, so none of those mappings is needed.
- **The copy's hold, pixel step, styling and glide** are wiki Open questions, not gaps (the roadmap entry's item 10, "From Story 8.12").

## Proof list

Stop 1 writes it: one line per case, naming its one test, the test's layer and the variants the case's Then names.

## Suggested variants

The variants a case's Then doesn't name, one line each, with the case ID. They get no test. At the batch's close they move to [Drag Automation Deferrals](../tech-debt-stories/drag-automation-deferrals.md).

## Results

No packet yet.

## Open questions

## Review log

The QA Engineer appends the desk's questions and replies (each quoting the Then it read), every Test Reviewer verdict and Nathan's declined mappings here, word for word. Results may be replaced; these entries may not. At the close the Reconciler answers each open verdict from the tests.

## Amendments
