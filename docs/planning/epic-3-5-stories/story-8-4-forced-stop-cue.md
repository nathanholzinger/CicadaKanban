# Epic 3.5 Story 8.4 — A cue when the board stops a drag

**Type:** story · **Written:** 2026-10-29 by the Architect, from Nathan's ask of 2026-09-30 (A4's PO handoff) · **Status:** Phase 1 built, for review

## Goal

When a reload ends a drag the user is in the middle of, the board says so, so the drag's end doesn't read as a slip of the user's hand.

**What happens today** (wiki board-drag-interaction §10, DRAG-6.15):
- A failed drop or a stale response resyncs the board. So does a failed column reorder.
- If the user is dragging an item when that lands, the drag ends at once, and nothing is written. The board shows "Loading board…" and then the reloaded board, with the item where the server has it.
- Nothing says why. The carried copy just disappears under the cursor.

**The wiki already carries it as Planned** (§10): "a drag the board stops shows a cue that says so". Its look is under Open questions, with no placeholder. This story designs the look and builds it. The PO clears the marker once Nathan approves it.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"):
- The Coder builds candidate looks, and Nathan picks one hands-on.
- The PO and the Test Planner write the docs once he has.
- No new drag specs. Unit and component tests work as usual.

**Out of scope:**
- **A cue for a failed drop with no drag running.** That resync is silent today (§10, "the client never keeps a guess the server rejected"), and nothing was in the user's hand to stop. If Nathan wants one, it's a story of its own.
- **A column drag stopped by a reload.** The wiki's rule is for an item drag, and `resyncBoard` ends only an item drag's session. If the build shows a reload can stop a column drag, say so in an amendment.
- **A general notice system** for the app. None exists or is planned. The cue is the board's own.

## Scope

- **Wiki passages:** none ahead of the build, under code first. §10's Planned passage and its Open question are the PO's once Nathan approves a look (Living-docs handoff).
- **Test-plan cases:** none ahead of the build. DRAG-6.15, the stop itself, is unchanged. The cue's cases are the Test Planner's once Nathan approves.

## Inbound deferrals

- **From A4's PO handoff** (roadmap, Story 8.4, Nathan, 2026-09-30): the cue.
- No audit routed anything here.

## Approach and phases

### Decisions

**D1. What counts as the board stopping a drag.**
- **It is:** a live item drag ended by a reload the drag layer asks for: `useBoardDnd.ts::resyncBoard`, called with a session running. That's a failed move, a stale response's resync (`dragRequest.ts::sendItemMove`), or a failed column reorder (`useColumnManagement.ts::onColumnDrop`).
- **It isn't:** Escape, any other cancel, a release that writes nothing, or a reload with no drag running. None of those shows the cue.

**D2. One signal, with its cause, from one place.**
- `resyncBoard` reports the stop where it ends the drag. That's a callback the hook takes, such as `onDragStopped(cause, point)`, with the pointer's last position.
- **The cause** is one of two:
  - **a write that failed:** an item move or a column move;
  - **a refresh:** a stale response's resync.

  The caller that asks for the resync knows which, so it passes the cause into `resyncBoard`. The cue's wording can differ by cause. A failed write also undid the earlier drop, which the user may not have noticed.

**D3. The cue lives in `BoardView.tsx`, above the reload.**
- The reload swaps the board for "Loading board…" and unmounts the `DndContext`. So the cue's state sits in `BoardView`, and it renders in both the loading branch and the loaded one.
- **It goes** after a set time, a new tuning value in `dragTuning.ts`, or at the next drag's start, whichever comes first.
- **Its text** is announced to assistive tech (`role="status"`).

**D4. Two candidate looks, switched in the drag tuning panel, for Nathan to pick.**
- **A, a banner** along the board's top edge.
- **B, a note at the point where the drag stopped,** the pointer's last position, fading out.
- **Either way, optionally,** the item that was being dragged flashes where the reloaded board draws it, so the user sees where it went. That's a toggle beside the switch.
- **The wording** is the Coder's draft, by cause, for example "Your last move didn't save, so the board reloaded. Nothing moved." and "The board refreshed, which stopped your drag. Nothing moved." Nathan settles it hands-on, and the PO writes it in.
- **The switch and the toggle are in the drag tuning panel,** which is temporary: no wiki, no cases, no tests. Phase 3 removes whatever Nathan doesn't pick.

**D5. A trigger for the hands-on, in the tuning panel.**
- A real forced stop is hard to cause by hand. §3.2 makes a failed drop nearly unreachable, and a stale response needs a slow server.
- **The trigger:** the panel arms one stop. The next item drag, a set number of seconds after it starts, calls `resyncBoard` with a cause the panel picks. It's the real path: the drag ends, the board reloads, and the cue shows.
- **It stays in the panel** after Phase 3, for tuning the cue's time later, and goes when the panel does.

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus `npm run test:e2e` where the phase says so.

**Phase 1: the signal, the cue's candidates and the trigger** (D1–D5)
- **The signal and its cause** through `resyncBoard`, and its three callers.
- **The cue's state** in `BoardView.tsx`, with candidates A and B, the item flash, the time value, and the panel's switch, toggle and trigger.
- **Tests:**
  - **The hook,** in `useBoardDnd.test.ts`, beside DRAG-6.15's harness:
    - a reload that ends a live drag reports the stop once, with its cause and point;
    - Escape, a cancel, a release that writes nothing, and a reload with no drag running report nothing.
  - **The component:** the cue renders for each cause, and it's still there across the loading branch. It goes after its time, and at the next drag's start.
  - **Show the hook's tests failing first.**
- **Gate:** `npm run check` and `npm run test:e2e`, since `resyncBoard`'s callers change.

**Phase 2: Nathan's hands-on**
- **What to try:**
  - **Arm the trigger and start a drag:** at a column, in a Card's section, and in the hierarchy modal. Then try each candidate, with the flash on and off.
  - **Both causes' wording.**
  - **The time:** long enough to read, short enough not to linger.
  - **Then a real one, if you want to:** with the network throttled in the browser's dev tools, drop an item, and start another drag before the first write returns. A stale response is the likeliest to land.
- **Nathan picks:** the candidate, the flash, the wording and the time.

**Phase 3: settle on the pick**
- Remove the candidate and the switch Nathan didn't pick. Keep the trigger (D5).
- The time stays a tuning value, unless Nathan fixes it.
- The tests follow the kept look.
- **The Coder writes the handoff:** the look, the wording and the time, for the PO.
- **Gate:** `npm run check`. Then a stop for review and commit.
- **No audit runs for this story alone.** Story 8 closes with one over all its stories. Nathan may call one sooner.

## Code map

Filled in by the Coder while building.

| Symbol | Carries |
|---|---|
| `workflow/forcedStop.ts` | `StopCause`, `ForcedStop` (cause, pointer point, item), the wording by cause, `stopLookOf`, `ArmedStop` |
| `useBoardDnd.ts::resyncBoard(cause)` | Ends a live item drag as Escape would, reports it once to `onDragStopped`, then reloads. The column path passes `() => resyncBoard('write-failed')`, so `onColumnDrop` is unchanged |
| `dragRequest.ts::sendItemMove` | Its last argument is now `resync(cause)`: `'write-failed'` for a rejected move, `'refresh'` for a stale response that disclosed a reindex |
| `useBoardDnd.ts` armed-stop effect | The panel's trigger: with `armedStop` set, the next item drag calls `resyncBoard(cause)` `afterMs` after it starts, then `disarmStop`. A drag released first leaves it armed |
| `workflow/useForcedStop.ts` | The stop held in `BoardView` until `forcedStopCueMs` passes; `clear()` at the next drag's start |
| `ForcedStopCue.tsx` | The cue: one always-mounted `role="status"` element, a banner (A) or a note at the pointer (B), with a fade timed to the cue's time |
| `workflow/ForcedStopContext.ts`, `dragChrome.tsx::useItemRow` | The flash: the stopped item's row gets `forced-stop-flash` (`index.css`) |
| `dragTuning.ts` | `forcedStopCueMs` (5000), `forcedStopLook` (`'banner'`), `forcedStopFlash` (true) |
| `DragTuningPanel.tsx` | The look switch, the flash toggle, the cue time, and the trigger (cause, seconds, Arm/Disarm) |

## Amendments

**Phase 1, built.**

1. **`onDragStopped` carries the item too.** D2 named `(cause, point)`. The flash needs the dragged item's id, so the stop is `{ cause, point, itemId }`.
2. **The cue is `fixed`, in both looks,** and sits as the first child of every branch `BoardView` returns (loading, no board, loaded), so one element stays mounted across the reload and no layout shifts. The banner runs along the window's top edge, not the board's own. If Nathan wants it in the board's own column, that is a layout change to pick at the hands-on.
3. **A note without a pointer shows as the banner.** The pointer is always known for a real drag; this only guards the type.
4. **The armed stop is `BoardView` state, not tuning,** so it is not stored and a reload does not re-arm it. The panel's own cause and seconds inputs reset when the board reloads, since the panel unmounts with it.
5. **A column drag stopped by a reload shows no cue.** A column drag has no session (`handleDragStart` returns for it), so `resyncBoard` has nothing to end and reports nothing. Only an item drag live when a failed column save lands is stopped and reported, as D1 says. The wiki's "any other reload" (§10) is not covered either: the workphase and column editors' reloads and the board-switch load call `loadBoard` directly, and each needs a click a held drag can't make. For the PO: §10 says any reload stops the drag; in the code only the reloads the drag layer asks for do.
6. **The flash is two amber pulses,** on whatever rows draw the item on the reloaded board (a Card, a Stub row, a modal row). An item the board does not draw (inside a collapsed section, past an overflow row, in a closed modal) gets none, and nothing is scrolled or expanded to reveal it.
7. **Tests:** the hook's, beside DRAG-6.15's (five cases: a failed write mid-drag reports once with its cause and point; an armed stop reports `'refresh'` and spends the arm; Escape, a release that writes nothing, and a drag released before the arm fires report nothing; the existing no-drag case now also asserts nothing is reported). The three that report were shown failing with the report removed; the three that don't, with a report added to a reload with no drag and to `handleDragCancel`. `sendItemMove`'s tests now assert the cause. `ForcedStopCue` and `useForcedStop` have component and hook tests (each cause's wording, the status element empty with no stop, banner and note, the fallback, the time, the clear). None carries a test-plan case ID; they are the Test Planner's to place. **Not covered by a test:** that the cue stays mounted across the loading branch. `BoardView` has no test, and a stop can only be caused through a real drag, which a drag spec would do and none may be added; the Fragment gives it the same place in all three branches, and the hands-on is where it is seen.

## Open questions

- **For Nathan:** if the look you pick is good enough for now but not final, the PO records it as a working placeholder under §10's Open questions, and the cues' final-look story (roadmap, Story 8, "The cues' final look") takes it up. Otherwise it's a rule, and the Open question comes off.

## Living-docs handoff

- **Behavior decisions made while building, for the PO to rule on:** filled in by the Coder, in Phase 3: the look, the wording by cause, the time, and what ends the cue early.
- **Planned passages now built:** wiki board-drag-interaction §10, "a drag the board stops shows a cue that says so". The PO clears the marker, and the look comes out of Open questions (or stays as a working placeholder; Open questions, For Nathan).
- **Passages superseded:** none expected.
- **Implementation passages to place:** none expected.
- **Test-plan cases affected:** a case for the cue, the Test Planner's, beside DRAG-6.15. Its surface spec, a reload landing mid-drag with the cue shown, is a drag spec, so it waits for Story 10. The hook and component tests are internal; the Reconciler proposes them.
- **For the Architect, at close:** Story 8.4's roadmap heading gets its ✅ and a status line. Story 10's item 10 gains the cue's surface spec, if the Test Planner writes a case for it.
