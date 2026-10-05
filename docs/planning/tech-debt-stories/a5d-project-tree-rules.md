# A5d — Write the Project Tree's Rules Out in Full

**Type:** tech-debt story. It may change behavior where a ruling settles a gap below, and if it does it carries a test for each change. · **Written:** 2026-10-05 by the Architect, from A5b's D5 · **Ready for:** planning, once A5b closes · **Sequenced:** after A5c, before A6

## Goal

No wiki page says how projects behave. A5b gives the project tree a page, but only for the sidebar's placement rules, which it moves off board-drag-interaction. This story writes out the rest of the project tree's rules, gives them a test plan, and settles the gaps that come up as rulings.

**What the page takes** (Nathan, 2026-10-05): "If it's a rule that might be described as a business rule or a behavior rule (position is determined by anchor+side, midpoint is coarsest fit, etc) then it belongs in the wiki. If it API contract details like - the Request needs these request params to do the calculation and the UI needs those return params to display everything - then we'll leave documentation to openapi". That's the split C7 of `api-contract-zod-openapi.md` already makes.

Out of scope:
- **The API contract:** request and response fields. They go to OpenAPI.
- **Re-filing items when a project moves under a different workflow.** It's an Open question on item-attachment and item-positioning, and a later design.
- **The sidebar's placement rules,** which A5b writes.

## Decisions

*Added by the Architect (2026-10-05), from A5b's planning:*
- **Rules the code and tests hold that no page states.** These are the candidates. The PO decides what the page holds, and each one is a ruling for Nathan in the first batch:
  - creating a project, at the top level or under a parent, after its siblings;
  - moving a project:
    - the write names a neighbor, never a position number;
    - a neighbor that isn't a sibling in the resulting group is refused;
    - with no neighbor named, the project goes to the true end of its siblings, never trusting that the group is empty;
    - a move under the project's own descendant is refused;
  - reparenting a project from its own page;
  - deleting a project. It deletes the whole subtree: descendant projects, their workflows, boards and workphases, and the items they own. An item of another project sitting in one of the deleted workphases survives, with no workphase, and shows in Unsorted;
  - a project with no workflow uses its nearest ancestor's (root `CLAUDE.md`, "Workflow inheritance"). No page states this either, so the PO decides whether it belongs here or on boards-columns-unsorted.
- **Two gaps, from A5b's D5,** each a ruling:
  - **A reparent through `PUT /projects/:id` keeps the project's old position number,** which is then compared against its new siblings. `PATCH /projects/:id/move` re-resolves the position. The project page's parent dropdown uses `PUT`. Item-positioning §2.1 re-resolves an item whose scope changes, and Nathan wants project and item tree operations to match.
  - **`POST /projects` stores a `parentId` that names no project.** The project is orphaned, and the sidebar never shows it. `PUT` and `PATCH /move` check, and an item create is refused the same way (ATT-4.1).
*Added by the PO, from A5b's batch 1 (2026-10-05):*
- **Shared rules get a page of their own** (Nathan, A5b's call 1). Each component's page points to the shared page, and states only its own handling and exceptions. The shared page has no catalog. Each component's catalog tests the shared rules as that component applies them. A5b applies this to hierarchy placement, with a new `hierarchy-placement` page that the board and the project tree both cite.
- **This story applies it to positions** (Nathan, 2026-10-05). Projects and items share the position system: anchor and side, coarsest-fit rounding, the append and bootstrap fallbacks, reindexing and its disclosure. This story splits item-positioning into a shared positioning page and the item-only rules (attached-sibling scope, merged columns, the active/done split, the board's placement intents). The project tree's page then points at the shared page for its positions, rather than at item-positioning. Many TC cases change their Rule lines, and the comments citing item-positioning's shared sections are re-pointed.
- **Tests that already pin these rules without case IDs.** Once the cases exist, mapping these tests is the Test Planner's and the Coder's job:
  - `server/tests/routes/projects.test.ts`;
  - `tests/api/projects.spec.ts`;
  - `tests/ui/project-page.spec.ts` and `tests/ui/project-sidebar.spec.ts`.

## Work, in batches

Written when this story is planned, after A5b closes.

## Code map

Starting points: `server/src/routes/projects.ts` (create, the `PUT` reparent, move, the delete cascade), and `client/src/components/ProjectOverviewTab.tsx` (the parent dropdown).

## Acceptance

## Handoff

## Amendments
