# ATT-10 — Creating an item

**Next ID:** ATT-10.8

The rules every write is held to hold for a create too. A parentless create's attachment flag is [ATT-1.14](att-1-free-attached-state.md)'s, a create's workphase is [ATT-9](att-9-workphase-a-write-leaves.md)'s, a child's project is [ATT-5.6](att-5-cross-project-reparenting.md)'s and [ATT-5.7](att-5-cross-project-reparenting.md)'s, a parent's legality is [ATT-4.10](att-4-legal-parent-depth-cap.md)'s, and the activity entry is [ATT-8.3](att-8-hierarchy-changes-logged.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-10.1 | A create names its project, its parent, or both, and is refused with neither | P1 | Automated |
| ATT-10.2 | A child is created Attached unless the create clears the flag | P1 | Automated |
| ATT-10.3 | A create may omit the workphase | P2 | Automated |
| ATT-10.4 | A create naming a project that doesn't exist is refused, and nothing is stored | P2 | Automated |
| ATT-10.5 | A create whose project is an empty string is refused, and nothing is stored | P2 | Automated |
| ATT-10.6 | The Sheet allows adding a child that reaches exactly the item cap | P1 | Automated |
| ATT-10.7 | The Sheet's add-child control stays drawn but disabled at or past the item cap | P1 | Automated |

---

## ATT-10.1 — A create names its project, its parent, or both, and is refused with neither

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §14

*Given* project `P1` holding item `P`, *when* a create names:

- `P1` and no parent, *then* the new item is top-level in `P1`, with `parentId` null;
- `P1` and `P`, *then* it's accepted, and the new item is a child of `P` in `P1`;
- neither a project nor a parent, *then* it's refused with a 400, and no item is created.

A parent alone is [ATT-5.6](att-5-cross-project-reparenting.md)'s, and a project other than the parent's is [ATT-5.7](att-5-cross-project-reparenting.md)'s.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-10.2 — A child is created Attached unless the create clears the flag

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §14

*Given* item `P` in workphase `W1` of workflow `WF`, and workphase `W2` of `WF`, *when* a create names `P` as the parent and doesn't mention the attachment flag, *then* the new item is attached to `P`, in `W1`, with `positionScope` `"attached-siblings"`. *When* the create instead clears the flag and names `W2`, *then* the new item is a detached child of `P`: Free, in `W2`, with `positionScope` `"workflow"`. A detached child created with no workphase is [ATT-9.6](att-9-workphase-a-write-leaves.md)'s.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-10.3 — A create may omit the workphase

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §14, wiki item-attachment §2a, wiki boards-columns-unsorted §10

*Given* project `P1` on workflow `WF1`, project `P0`, which uses no workflow, its own or an ancestor's, and item `P` in `P1` at workphase `W1`, *when* a create makes a top-level item in `P1` and names no workphase, *then* it's accepted, and the item has none: its `workphaseId` is null, its `positionScope` is `"none"` ([TC-2.16](../item-positioning/part-2-anchor-resolution.md)), and a board of `WF1` lists it under Unsorted. *When* a create makes a top-level item in `P0`, *then* it's accepted the same way, with no workphase. *When* a create makes a child attached to `P` and names no workphase, or `W1`, *then* the child is in `W1`, `P`'s.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-10.4 — A create naming a project that doesn't exist is refused, and nothing is stored

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §14

*Given* project `P1` holding item `P`, and an id `Z` that names no project, *when* a create names `Z` and no parent, *then* it's refused with a 400, and no item is created. *When* a create names `Z` and `P` as the parent, *then* it's refused with a 400 the same way. A parent that doesn't exist is [ATT-4.10](att-4-legal-parent-depth-cap.md)'s.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-10.5 — A create whose project is an empty string is refused, and nothing is stored

**Priority:** P2 · **Status:** Automated · **Rule:** wiki item-attachment §14, wiki row-references §1

*Given* project `P1` holding item `P`, *when* a create names `projectId: ""` and no parent, *then* it's refused with a 400, and no item is created. *When* a create names `projectId: ""` and `P` as the parent, *then* it's refused with a 400 the same way: an empty string names no project, not the parent's. A create naming only its parent takes the parent's project ([ATT-5.6](att-5-cross-project-reparenting.md)), and a project that doesn't exist is [ATT-10.4](att-10-creating-an-item.md)'s.

**Automation test:** `server/tests/routes/items.test.ts`

## ATT-10.6 — The Sheet allows adding a child that reaches exactly the item cap

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §14, wiki item-attachment §8, wiki hierarchy-placement §6

*Given* parent item `P` at absolute depth `CAP - 1`, with root items at depth 1 and `CAP` the board's item cap, *when* its Sheet is opened, *then* the add-child control is present and enabled. Activating it offers a child create under `P`; submitting a valid title creates the child at exactly `CAP`. It is Attached to `P` and takes `P`'s workphase, as in [ATT-10.2](att-10-creating-an-item.md). A legal final level is not disabled by counting the root one level too deep. The control uses the server's item cap, not the project cap.

**Automation test:** `tests/ui/item-create-cap.spec.ts`

## ATT-10.7 — The Sheet's add-child control stays drawn but disabled at or past the item cap

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-attachment §14, wiki item-attachment §8, wiki hierarchy-placement §6

*Given* parent item `P` at absolute depth `CAP`, with root items at depth 1 and `CAP` the board's item cap, *when* its Sheet is opened, *then* the add-child control remains present but disabled. Hovering it gives exactly `At the depth cap (N levels)`, with `N = CAP`. It is exposed as disabled to assistive technology, takes no keyboard focus and cannot open a child-create input or send a create request by pointer or keyboard activation.

*Given* instead existing `P` is at depth `CAP + 1` in data the API did not create, *then* the control behaves the same way, and the reason names the item cap, not `P`'s depth or the project cap. `P` remains readable in its Sheet. The disabled control's color, opacity and cursor are not assertions of this case.

**Automation test:** `tests/ui/item-create-cap.spec.ts`
