# MVP Deferrals

**Type:** deferral catalog · **Written:** 2026-11-13, from Nathan's rulings in the [MVP test-process trim](tech-debt-stories/mvp-test-process-trim.md) · **Status:** open until the MVP closes, then archived

What's ruled out of the MVP, what's built and frozen, and where deferred work goes. Root `AGENTS.md` and the personas and agents that raise findings point here.

## How to use it

- **Read it before you raise a gap, a case, a rule question or a test variant.** A finding in an area listed below gets one line in the destination named for it, and nothing else: no verdict, no case, no Pending PO question and no session.
- **Ruled out doesn't mean removed.** Code that's already built stays. The area gets no new rule, case or test during the MVP.
- **Only Nathan adds or removes an entry.** Any role may propose one, in its plan's Open questions or its report.

## Ruled out of the MVP

| Area | What it covers | Where a finding goes |
|---|---|---|
| Assistive tech and screen reading | Announcements, live regions, and how a control is exposed to assistive tech. Keyboard use isn't in this area: a control that takes no keyboard focus is a rule. `ForcedStopCue.tsx`'s `role="status"` may stay, with no rule and no test. | [Findings with no story yet](#findings-with-no-story-yet) |
| UI recovery after a server failure | How the UI shows a write that failed or timed out, beyond what's built, when the database stays correct and a refresh brings the UI back in line with it. | [Findings with no story yet](#findings-with-no-story-yet) |
| The final look | The cues' final look, the zoom-in morph, placeholder UI and the system-wide consistency pass. | [Epic 8+ decisions](epic-8-decisions.md), its Deferred sections |
| Message banners | A banner's look, placement and kinds, the forced-stop banner's included. | [UI Message Banners](tech-debt-stories/ui-message-banners.md) |
| Drag automation beyond one test per case | A test variant the case's Then doesn't name, a Reconciler's candidate new case, a hardening test, and a test re-weighed on cost or flakiness, in the board and sidebar drag suites. | [Drag Automation Deferrals](tech-debt-stories/drag-automation-deferrals.md) |
| The same, outside the drag suites | As the row above, for any other feature. | [Findings with no story yet](#findings-with-no-story-yet) |

## Built and frozen

What's listed here stays as it is, with its existing tests. During the MVP it gets no new case, no new variant and no new rule. A defect found in it goes to Nathan to route.

- **The forced-stop cue:** the banner, its text by cause, its lifetime, and the flash.
- **Out-of-order write reconciliation:** the reindex fold, and which answer wins a row's position and workphase when answers land out of order (`positionedWrite.ts::positionRecord` and `setLater`, `itemWriteReconciliation.ts`'s `workphaseSetBy`).

## Deferred stories

- [Drag Automation Deferrals](tech-debt-stories/drag-automation-deferrals.md): after the smoke suite. It holds Epic 3.5 Story 10's returned and deferred work.
- [E2E Smoke Suite](tech-debt-stories/e2e-smoke-suite.md): after Story 10.
- [UI Message Banners](tech-debt-stories/ui-message-banners.md)
- [Descendants Highlight Cue](tech-debt-stories/descendants-highlight-cue.md)
- [Epic 8+ decisions](epic-8-decisions.md): placeholder UI, the column merge and expand rework, and the board's presentation.

## Findings with no story yet

One line each: the finding, where it came from, and the area above it falls under. A story is written for an area once Nathan schedules it.

- **Selected-board reload failure:** existing `useBoardLoad.test.ts` tests keep the drawn board and finish loading/cue after a reload or repeated read fails, beyond the two BCU cases' specified outcomes; defer this outside-drag failure-recovery candidate from [Story 10 close slice 6](../audits/test-reconciliation-story-10-close-slice-6.md#candidate-new-cases), with the built cue frozen and no new case or ruling request.
