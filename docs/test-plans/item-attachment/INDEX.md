# Test Plan — Item Attachment & Hierarchy Placement

**Wiki page:** item-attachment

**Suite IDs:** `ATT-1` … `ATT-8`. A case is written by its full ID, `<suite>.<n>` (e.g. `ATT-4.5`), in its own suite file as everywhere else.

The page is gesture-agnostic, so each case holds whichever write makes the change, a board gesture or a direct API call. A case names a write only where the rule does.

| Suite | What it covers |
|---|---|
| [ATT-1 — Free / Attached state model](att-1-free-attached-state.md) | The two states, what each governs, the stored-row invariant, and what a Card and a Stub show |
| [ATT-2 — Reparenting is one-way](att-2-reparenting-is-one-way.md) | Which row a hierarchy change writes, and whose point of view decides legality |
| [ATT-3 — Reparent placement and atomic commit](att-3-reparent-placement-atomicity.md) | Re-resolving an Attached item's position, reparenting a Free item, the sequencing, and one commit |
| [ATT-4 — What makes a target a legal parent, and the depth cap](att-4-legal-parent-depth-cap.md) | The four legality rules, the cap's formula, every write enforcing them, and the UI agreeing with the API |
| [ATT-5 — Cross-project and cross-workflow reparenting](att-5-cross-project-reparenting.md) | The project cascade, and what a move to another workflow keeps |
| [ATT-6 — Attaching to a done parent](att-6-attaching-to-done-parent.md) | Attaching under a terminal workphase, and reading as done by derivation |
| [ATT-7 — Detaching preserves the parent, and severing it](att-7-detach-preserves-parent.md) | What a detach keeps and changes, re-attaching, and reparenting to root |
| [ATT-8 — Hierarchy changes are logged](att-8-hierarchy-changes-logged.md) | The activity entry a parent or attachment change records |
