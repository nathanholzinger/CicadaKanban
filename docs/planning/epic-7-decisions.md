# Epic 7+ Deferred Decisions — Sheet-Level "Move to Project"

Technical decisions and open questions captured so `mvp-roadmap.md` can stay
high-level. Recorded 2026-09-10 during Epic 3.5 test planning; nothing here
is built yet.

---

## Context: where this came from

Epic 3.5 lifts the same-project reparent constraint for the **board drag
gesture** ([`../wiki/item-attachment/`](../wiki/item-attachment/README.md)
§9). That's safe on a board because a board is scoped to one workflow — any
two projects visible on it already share the workflow, so every workphase
the moved subtree references stays valid.

The same wiki page is deliberately gesture-agnostic: its rules "hold
identically whether the change came from a drag, the Sheet's checkbox, the
child badge, or an MCP tool call." That leaves a case no board gesture can
reach but a non-board entry point can: **a reparent whose target parent
lives in a project on a different workflow.** The wiki says cross-workflow
moves "belong to the Sheet-level 'move to project' action (Epic 7)" and
writes no rule for what the API does with such a request today.

Test planning for Epic 3.5 deliberately wrote **no case** for this — there
is no settled rule to derive one from. It's parked here instead.

---

## Open questions

### Q1. What does the API do with a cross-*workflow* reparent request?

Once the Sheet lets an item be reparented to anything via a dropdown, a user
can pick a parent in a project on a different workflow. The moved subtree's
`workphaseId`s then reference workphases that don't exist in the new
workflow.

Options, not yet weighed:

- **Reject at the API** until Epic 7's remapping UI exists — the simplest
  interim guard, and consistent with "the two enforcement points must agree"
  (the Sheet dropdown would filter such parents out).
- **Accept and remap** — Epic 7's actual job: present the workphase-remapping
  problem to the user (which workphase in the new workflow does each old one
  map to?), then commit the reparent + remap + project cascade atomically.
- **Accept and null out** `workphaseId` on the moved subtree (`SET NULL`
  semantics, "Unknown status") — cheap, but produces items that don't render
  on any board until the user fixes each one.

Whichever lands, the same rule must hold at both the Sheet (before the
option is offered) and the API (on the write) — see
[`../wiki/item-attachment/`](../wiki/item-attachment/README.md) §7.

**Until this is decided, the interim behavior of the API for a cross-
workflow parent is unspecified**, and the Epic 3.5 test plans say so
explicitly rather than guessing.

### Q2. Does "move to project" also cover *non-reparenting* project changes?

A top-level item moved to a different project (no parent involved) has the
same cross-workflow remapping problem. Worth deciding whether Epic 7's
action is "move to project" (item-level, parent optional) or "reparent
anywhere" (parent-level, project follows) — they're the same remapping
problem with different UI framing.
