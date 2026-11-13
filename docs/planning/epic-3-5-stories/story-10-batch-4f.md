# Epic 3.5 Story 10 — batch 4f. DRAG-2 and ATT-4.9

**Type:** story plan, one batch of Story 10 · **Written:** 2026-11-13, moved from [Story 10's batch doc](story-10-batches.md), whose standing rules and four stops govern it · **Status:** not started

This file is the batch's plan. It holds the batch's cases, its Proof list, its suggested variants, its Results packet, its Open questions and its Review log, and the Reconciler reads it at the batch's close. A session for this batch reads root `AGENTS.md`, its persona, the batch doc's standing rules and stops, this file, and the cases and wiki sections in scope. It doesn't read the other batches' files or [the 4a to 4d log](story-10-batch-4a-4d-log.md).

## The batch

Moved word for word from the batch doc. "Above" and "below" in it refer to that doc as it stood before the split.

### 4f. DRAG-2 and ATT-4.9

**Specs:** `drag-target-classification.spec.ts`.

| Kind   | Cases                                                     |
| ------ | --------------------------------------------------------- |
| Extend | DRAG-2.4, 2.8, 2.22; ATT-4.9                              |
| New    | DRAG-2.12                                                 |
| Split  | DRAG-2.14, 2.15, 2.16, 2.17, 2.18, 2.19, 2.20, 2.21, 2.23 |

- **It comes after 4e,** since DRAG-2.17–2.19 check tiers across pop-out, zoom, the modal and the carried branch.
- **The tiers are read from `data-drop-tier`.** Each Split case's look is the board's tiers (D13).
- **ATT-4.9 is A3's option (a):** each target the spec classifies is replayed against the move endpoint, each from the same starting state.

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
