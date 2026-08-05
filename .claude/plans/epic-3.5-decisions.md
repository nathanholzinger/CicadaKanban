# Epic 3.5+ Deferred Decisions — Drag-and-Drop Attach/Detach Gesture

Technical decisions and discussion captured so `mvp-roadmap.md` can stay
high-level. Reference doc for when Epic 3.5 (the board drag gesture to
attach/detach, split out of Epic 3 per audit finding #13) is actually built.

Recorded 2026-08-05 while closing out the Epic 3 audit's test-coverage gaps.
Nothing in Epic 3.5 itself is built yet.

---

## Context: what just got proven about DnD testing

Epic 3 audit test-coverage gap #2 ("DnD cascade integration — drag a parent
across columns, assert attached children follow") had been treated as
manual-only, on the reasoning that DnD is inherently unreliable to automate.
That determination didn't hold once actually tried: a real mouse-based drag
simulation against this app's `@dnd-kit` setup (`PointerSensor`,
`activationConstraint: { distance: 5 }`, no custom collision detection) —
`pointerdown` → move past the activation distance → several intermediate
`pointermove`s → `pointerup` — ran clean **6/6 times** with no retries. That
test is now permanent: `tests/ui/attached-children.spec.ts` — "dragging a
parent card across columns cascades its attached child."

The nuance: that test asserts **data correctness** (the right item moved to
the right workphase, the cascade fired server-side), not the drag's visual
*feel* (drag-overlay animation, `isOver` highlight timing, cursor states).
The feel genuinely is better judged by hand — that half of the original
"manual testing" call still stands.

---

## Open questions

### Q1. How much of Epic 3.5's new gesture should get automated E2E coverage, vs. stay manual?

Epic 3.5 adds a **new** drag interaction on top of the existing move/reorder
DnD: dropping a card onto another card attaches it as a child; dragging an
attached child out of its parent detaches it. Decide the coverage split
before implementing, not after:

- **Already covered elsewhere, don't re-test via drag:** the underlying
  attach/detach *state change* and its consequences (workphase snap on
  attach, cascade to descendants, cycle rejection, same-project rejection)
  are already unit- and E2E-tested via the detail-panel checkbox and
  child-badge controls (non-drag paths) and the server route tests. Epic 3.5
  doesn't need to re-prove that logic through a drag gesture — only that the
  **gesture itself** correctly triggers it.
- **Worth a real drag-based E2E test (data correctness, cheap given the
  proof above):** "drop card A onto card B → B becomes A's parent, A attaches
  and snaps to B's workphase"; "drag an attached child out of its parent's
  nested list onto the board → it detaches and stays in place." Same
  technique as the promoted test — real `page.mouse` events, assert on
  end-state (parent/attach fields, board render after), not on the animation.
- **Leave manual:** drag-overlay feel while attaching (does it read as "this
  will nest," not "this will replace"?), the hover-highlight affordance for a
  valid attach target vs. an invalid one (cross-project, would-be-cycle),
  and general discoverability of "you can drag a child out to detach it" —
  none of that is meaningfully assertable in an automated test, and manual
  spot-checking is the right tool for interaction feel.

**Lean:** automate the two data-correctness cases above the same way the
promoted test does; don't try to automate the feel/affordance half — that's
still explicitly a manual-verification job, not a gap to close.
