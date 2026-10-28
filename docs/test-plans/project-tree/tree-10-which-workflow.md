# TREE-10 — Which workflow a project uses

**Next ID:** TREE-10.12

Which workflow a project uses is read through the boards: a board of that workflow lists the project's items, and no other workflow's board does. A project with no workflow of its own using its nearest ancestor's is [BCU-1.5](../boards-columns-unsorted/bcu-1-boards-and-what-they-show.md)'s.

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-10.1 | A workflow given to a project makes it, and each descendant that used the ancestor's through it, use the new one | P1 | Automated |
| TREE-10.2 | A move changes the workflow a project with none of its own uses, and its subtree's | P1 | Automated |
| TREE-10.3 | After the workflow a project uses is deleted, it uses the nearest one left above it, or none | P2 | Automated |
| TREE-10.4 | A project has at most one workflow of its own | P1 | Automated |
| TREE-10.5 | A workflow created from a template starts with a copy of the template's workphases | P1 | Open |
| TREE-10.6 | A workflow created from another workflow starts with a copy of that workflow's workphases | P1 | Open |
| TREE-10.7 | A workflow created from neither starts with no workphases | P2 | Open |
| TREE-10.8 | A template or a source workflow that doesn't exist is refused, and nothing is created | P2 | Open |
| TREE-10.9 | A template or a source workflow given as an empty string names no row, and is refused | P2 | Automated |
| TREE-10.10 | A template or a source workflow given as `null` names none | P2 | Open |
| TREE-10.11 | A create naming both a template and a source workflow is refused, and nothing is created | P2 | Planned |

---

## TREE-10.1 — A workflow given to a project makes it, and each descendant that used the ancestor's through it, use the new one

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §10

*Given* top-level project `P`, owning workflow `W1`, with child `C`; `C`'s children `D`, owning workflow `W2`, and `E`, with no workflow of its own; and an item in each of `P`, `C`, `D` and `E`, in a workphase of the workflow each uses, *when* workflow `W3` is created for `C`, *then* it's accepted, though `C` used `P`'s. A board of `W3` lists `C`'s and `E`'s items, in `unsorted.invalidItems`, since they still hold `W1`'s workphases ([BCU-5.2](../boards-columns-unsorted/bcu-5-unsorted.md)), and `W1`'s boards no longer list them. `D`'s item is still on `W2`'s boards, and `P`'s on `W1`'s.

**Automation test:** `server/tests/routes/workflows.test.ts`

## TREE-10.2 — A move changes the workflow a project with none of its own uses, and its subtree's

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §10, wiki project-tree §6

*Given* project `P1`, with no workflow of its own, under top-level project `Q1`, on workflow `WF1`; `P1`'s children `P1a`, with no workflow of its own, and `P1b`, owning workflow `W3`; top-level project `Q2`, on workflow `WF2`; and an item in each of `P1`, `P1a` and `P1b`, *when* `P1` is moved under `Q2`, *then* it's accepted. A board of `WF2` lists `P1`'s and `P1a`'s items, in `unsorted.invalidItems`, and `WF1`'s boards no longer list them. `P1b`'s item is still on `W3`'s boards. *And given* top-level project `Q3`, owning workflow `W4`, with an item, *when* `Q3` is moved under `Q2`, *then* its item is still on `W4`'s boards, and not on `WF2`'s.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-10.3 — After the workflow a project uses is deleted, it uses the nearest one left above it, or none

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §10

*Given* top-level project `P`, owning workflow `W1`; `P`'s child `C`, owning workflow `W2`; `C`'s child `D`, with no workflow of its own; an item in each of them, in a workphase of the workflow each uses; and top-level project `Z`, on workflow `WZ`, *when* `W2` is deleted, *then* a board of `W1` lists `C`'s and `D`'s items, each with no `workphaseId`, in `unsorted.invalidItems`. *When* `W1` is then deleted, *then* `P`, `C` and `D` use no workflow: `WZ`'s boards don't list their items.

**Automation test:** `server/tests/routes/workflows.test.ts`

## TREE-10.4 — A project has at most one workflow of its own

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §10

*Given* project `P`, owning workflow `W1`, with child `C`, which has no workflow of its own, *when* another workflow is created for `P`, *then* it's refused with a 409 whose message names `W1`, and no workflow is created: `P` still owns `W1` alone. *When* a workflow is created for `C`, *then* it's accepted ([TREE-10.1](tree-10-which-workflow.md)).

**Automation test:** `server/tests/routes/workflows.test.ts`

## TREE-10.5 — A workflow created from a template starts with a copy of the template's workphases

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §10

*Given* project `P`, with no workflow of its own, and template `T`, with workphases, *when* a workflow is created for `P` naming `T` by `templateId`, *then* it's accepted, and the new workflow's workphases are a copy of `T`'s: the same names, in `T`'s order, each with its counterpart's settings, its terminal flag among them.

**Automation test:** —

## TREE-10.6 — A workflow created from another workflow starts with a copy of that workflow's workphases

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §10

*Given* top-level project `Q`, owning workflow `W1`, with workphases, and project `P`, with no workflow of its own, *when* workflow `W2` is created for `P` naming `W1` by `sourceWorkflowId`, *then* it's accepted, and `W2`'s workphases are a copy of `W1`'s: the same names, in `W1`'s order, each with its counterpart's settings, its terminal flag among them. They're `W2`'s own: `W1` still has its workphases, unchanged. *When* one of `W2`'s workphases is renamed, *then* its counterpart in `W1` keeps its name.

**Automation test:** —

## TREE-10.7 — A workflow created from neither starts with no workphases

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §10

*Given* project `P`, with no workflow of its own, *when* a workflow is created for `P` that leaves out both `templateId` and `sourceWorkflowId`, *then* it's accepted, and the new workflow has no workphases.

**Automation test:** —

## TREE-10.8 — A template or a source workflow that doesn't exist is refused, and nothing is created

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §10, wiki row-references §1

*Given* project `P`, with no workflow of its own, *when* a workflow is created for `P` naming a `templateId` no template has, or a `sourceWorkflowId` no workflow has, *then* each is refused with a 400, and no workflow is created: `P` still has none of its own, so a create for it that leaves both out is then accepted, where a second workflow would be refused ([TREE-10.4](tree-10-which-workflow.md)).

**Automation test:** —

## TREE-10.9 — A template or a source workflow given as an empty string names no row, and is refused

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §10, wiki row-references §1

*Given* project `P`, with no workflow of its own, *when* a workflow is created for `P` with `templateId: ""`, or with `sourceWorkflowId: ""`, *then* each is refused with a 400, and no workflow is created, as in [TREE-10.8](tree-10-which-workflow.md). No fallback reads the empty string as none and makes a workflow with no workphases, as a create that leaves both out does ([TREE-10.7](tree-10-which-workflow.md)).

**Automation test:** `server/tests/routes/workflows.test.ts`

## TREE-10.10 — A template or a source workflow given as `null` names none

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §10

*Given* project `P`, with no workflow of its own, *when* a workflow is created for `P` with `templateId: null` and no source workflow, *then* it's accepted, and the new workflow has no workphases, as a create that leaves both out does ([TREE-10.7](tree-10-which-workflow.md)). The same holds for `sourceWorkflowId: null` and no template. *Given* template `T`, with workphases, *when* a workflow is created for another project with no workflow of its own, naming `T` by `templateId`, with `sourceWorkflowId: null`, *then* it's accepted, with a copy of `T`'s workphases ([TREE-10.5](tree-10-which-workflow.md)). *And given* workflow `W1`, with workphases, *when* one is created naming `W1` by `sourceWorkflowId`, with `templateId: null`, *then* it's accepted, with a copy of `W1`'s ([TREE-10.6](tree-10-which-workflow.md)).

**Automation test:** —

## TREE-10.11 — A create naming both a template and a source workflow is refused, and nothing is created

**Priority:** P2 · **Status:** Planned · **Rule:** wiki project-tree §10

*Given* project `P`, with no workflow of its own, template `T`, and workflow `W1` of another project, *when* a workflow is created for `P` naming both `T` by `templateId` and `W1` by `sourceWorkflowId`, *then* it's refused with a 400, and no workflow is created: `P` still has none of its own, and a create for it naming `T` alone is then accepted, with `T`'s workphases ([TREE-10.5](tree-10-which-workflow.md)). The refusal doesn't depend on which of the two exists: a create naming a `templateId` no template has and a `sourceWorkflowId` no workflow has is refused too, and nothing is created. A field given as `null` isn't named ([TREE-10.10](tree-10-which-workflow.md)).

**Automation test:** —
