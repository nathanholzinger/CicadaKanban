# ATT-10 — Creating an item

**Next ID:** ATT-10.5

The rules every write is held to hold for a create too. A parentless create's attachment flag is [ATT-1.14](att-1-free-attached-state.md)'s, a create's workphase is [ATT-9](att-9-workphase-a-write-leaves.md)'s, a child's project is [ATT-5.6](att-5-cross-project-reparenting.md)'s and [ATT-5.7](att-5-cross-project-reparenting.md)'s, a parent's legality is [ATT-4.10](att-4-legal-parent-depth-cap.md)'s, and the activity entry is [ATT-8.3](att-8-hierarchy-changes-logged.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| ATT-10.1 | A create names its project, its parent, or both, and is refused with neither | P1 | Automated |
| ATT-10.2 | A child is created Attached unless the create clears the flag | P1 | Automated |
| ATT-10.3 | A create may omit the workphase | P2 | Automated |
| ATT-10.4 | A create naming a project that doesn't exist is refused, and nothing is stored | P2 | Automated |

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
