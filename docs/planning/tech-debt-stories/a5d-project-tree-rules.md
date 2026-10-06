# A5d — Write the Project Tree's Rules Out in Full

**Type:** tech-debt story. It changes behavior: Nathan ruled D3's nine gaps, eight of them fixes, and each fix carries a test. G4, G7 and G9, the project depth cap (call 1) and a name of only spaces (call 10) change what the API accepts, so the story closes by the full story-done checklist, audit included, as A5a did. · **Written:** 2026-10-05 by the Architect, from A5b's D5; planned the same day by the Architect · **Status:** approved 2026-10-05, with Nathan's answers to its open questions and his rulings on all of D3's gaps; batch 1 (the PO) is next · **Sequenced:** after A5c (archived), before A6

## Goal

No wiki page says how projects behave. A5b gave the project tree a page, but only for the sidebar's placement rules, which it moved off board-drag-interaction. This story:
- **writes out the rest of the project tree's rules:** creating, moving, reparenting and deleting a project, how siblings are ordered, depth, and which workflow a project uses;
- **splits item-positioning** into a shared positioning page and the item-only rules, so the project tree's positions cite the shared page (the PO's decision below, which Nathan ruled);
- **gives the new rules a catalog,** and settles each gap as a ruling.

**What the page takes** (Nathan, 2026-10-05): "If it's a rule that might be described as a business rule or a behavior rule (position is determined by anchor+side, midpoint is coarsest fit, etc) then it belongs in the wiki. If it API contract details like - the Request needs these request params to do the calculation and the UI needs those return params to display everything - then we'll leave documentation to openapi". That's the split C7 of `api-contract-zod-openapi.md` already makes.

Out of scope:
- **The API contract:** request and response fields. They go to OpenAPI. That includes the move's field names (D5).
- **Re-filing items when a project comes to use a different workflow.** It's an Open question on item-attachment and item-positioning, and a later design.
- **The sidebar's placement rules,** which A5b wrote.
- **Whether a create or an edit takes a position.** `positioning-on-create-and-edit.md` asks that for projects and items together.
- **Workflows beyond which one a project uses:** templates, copying a workflow, and its workphases. No page states them yet, and none is needed for this story.

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
  - a project with no workflow uses its nearest ancestor's (root `CLAUDE.md`, "Workflow inheritance"). No page states this either. *Settled by Nathan during A5c's planning (2026-10-05):* it goes on the project tree's page. Which items a board shows, including a project's inherited view of its ancestor's board, goes on boards-columns-unsorted (A5c's D4). Each page links the other.
- **Two gaps, from A5b's D5,** each a ruling:
  - **A reparent through `PUT /projects/:id` keeps the project's old position number,** which is then compared against its new siblings. `PATCH /projects/:id/move` re-resolves the position. The project page's parent dropdown uses `PUT`. Item-positioning §2.1 re-resolves an item whose scope changes, and Nathan wants project and item tree operations to match.
  - **`POST /projects` stores a `parentId` that names no project.** The project is orphaned, and the sidebar never shows it. `PUT` and `PATCH /move` check, and an item create is refused the same way (ATT-4.1).
    - *Corrected at planning (2026-10-05):* it's a 500, not an orphan. The database refuses the insert (D3, G2).

*Added by the PO, from A5b's batch 1 (2026-10-05):*
- **Shared rules get a page of their own** (Nathan, A5b's call 1). Each component's page points to the shared page, and states only its own handling and exceptions. The shared page has no catalog. Each component's catalog tests the shared rules as that component applies them. A5b applies this to hierarchy placement, with a new `hierarchy-placement` page that the board and the project tree both cite.
- **This story applies it to positions** (Nathan, 2026-10-05). Projects and items share the position system: anchor and side, coarsest-fit rounding, the append and bootstrap fallbacks, reindexing and its disclosure. This story splits item-positioning into a shared positioning page and the item-only rules (attached-sibling scope, merged columns, the active/done split, the board's placement intents). The project tree's page then points at the shared page for its positions, rather than at item-positioning. Many TC cases change their Rule lines, and the comments citing item-positioning's shared sections are re-pointed.
- **Tests that already pin these rules without case IDs.** Once the cases exist, mapping these tests is the Test Planner's and the Coder's job:
  - `server/tests/routes/projects.test.ts`;
  - `tests/api/projects.spec.ts`;
  - `tests/ui/project-page.spec.ts` and `tests/ui/project-sidebar.spec.ts`.

*Planned by the Architect (2026-10-05).* The gaps were found by reading `routes/projects.ts`, `routes/workflows.ts`, `lib/workflowItems.ts`, `App.tsx` and the sidebar. Each one marked "probe" was confirmed by a throwaway route test, deleted afterward.

### D1 The API's rules are firm; the project page is a placeholder (Open question 1)

*Ruled at approval (Nathan, 2026-10-05):* the same two tiers as A5c.

This is A5c's two tiers (Nathan, A5c's D1), applied here. The sidebar's drag already has firm rules (§1 and §2, from A5b). The Dashboard, Navigation & Notifications epic reworks navigation: its tile-based dashboard and its quick-nav sidebar. So the project page, and the sidebar's controls other than the drag, are a placeholder.

**The Architect's starting split, for the PO's batch 1.** The PO decides where each piece lands.

| Firm: the API's rules | Placeholder: the project page and the sidebar's other controls |
|---|---|
| **Creating a project,** at the top level or under a parent, after its siblings (G2) | **The project page:** the breadcrumb, the tabs, the Overview tab (description, parent dropdown, subprojects list), and the banner over an inherited board |
| **How siblings are ordered:** by position, then creation time. A5b's closing Reconciler run found no page states it (G6) | **The sidebar's other controls:** the create and delete buttons, the delete's red state, the collapse chevrons, and the remembered selection |
| **Moving a project** (G3, G4, G5) | **What a project with no workflow shows:** "Set up a Workflow". The page offers no way to override an inherited workflow, though the API accepts one (G8) |
| **Reparenting from the project page:** what the API does with the write (G1). That the dropdown offers only legal parents is the placeholder's. It offers the top level and every project outside the project's own subtree, which is exactly what the API accepts | |
| **Depth has no cap.** A5b's call 4 left stating the tree's depth rule to this story | |
| **Deleting a project** | |
| **Which workflow a project uses** (G7, G8) | |
| **A project always has a name** (G9) | |

The placeholder tier goes under the page's Open questions, and the Architect records it in `epic-8-decisions.md`, as A5c's was.

### D2 The rules the page newly states, each a ruling in batch 1

The stub's list above, refined by reading the code:
- **Creating a project.** A create makes a top-level project, or a child when it names a parent, placed after its siblings' true last. A create with no name is refused with a 400.
- **How siblings are ordered.** `GET /api/projects` lists projects by position, then creation time, and the sidebar orders each project's children the same way. That's the shared tie-break (D4), with G6's exception.
- **Moving a project.**
  - The move names the project's resulting predecessor or successor, never a number.
  - A neighbor that doesn't exist, or isn't a sibling in the resulting group, is refused with a 400, and nothing changes.
  - With no neighbor named, the project goes after its true last sibling, never trusting that the group is empty. That holds even when the parent doesn't change, so a move always re-resolves the position.
  - A new parent that's the project itself, or in its subtree, is refused with a 400. So is one that names no project.
  - A move may change which workflow the project uses (below).
- **Depth.** Projects nest without a cap, unlike items (item-attachment §8).
- **Deleting a project.**
  - It's never refused: the project page and the sidebar ask "are you sure" first.
  - It deletes the whole subtree: descendant projects, the workflows they own with their boards, columns and workphases, and the items the subtree's projects own.
  - An item's own subtree goes with it, since a hierarchy never straddles two projects (item-attachment §9). That matches deleting an item (item-attachment §13).
  - An item of another project sitting in one of the deleted workphases survives with no workphase, and shows in Unsorted (boards-columns-unsorted §10). Labels are global, and stay.
- **Which workflow a project uses.**
  - Its own, or else its nearest ancestor's: inherit or override (G8). When no ancestor has one, it uses none, which is A5c's deferred G4.
  - A project's own workflow is used by its whole subtree, except below a descendant that has one of its own.
  - What changes the workflow a project uses: a move, a workflow created for it or for a project between it and the owner (G8), or the owner's workflow deleted.
  - What that does to the project's items is boards-columns-unsorted §3's: they come along, still holding the old workflow's workphases, and show in Unsorted. A workflow delete leaves them with none (§8 there).
  - boards-columns-unsorted §3 states the first rule in a clause, which the PO cuts to a link once this page states it (A5c's handoff).
- **A project always has a name** (G9).

Each rule is written descriptively. Rules an API caller can see get cases. The placeholder tier gets none (D1).

### D3 The gaps: fix now or defer, each Nathan's call

As in A5c (Nathan, A5c's D3): the PO's batch 1 proposes a rule for each gap, and Nathan rules at batch 1's stop. He chooses between fixing it in batch 3 and deferring it. A gap ruled "fix now" goes on the page as `**Planned:**`. A deferred one goes under Open questions, and the Architect records it where its ruling sends it. The Architect's recommendations:

*Ruled ahead of batch 1 (Nathan, 2026-10-05):* every gap, each under its gap below. Eight are fixes for batch 3, and G8 is a rule with no code change. So batch 1 words each gap's rule rather than proposing one.

- **G1. A reparent through `PUT` keeps the old position** (the stub's gap; probe). A top-level project at `2.0`, reparented under a parent whose children sit at `1.0`, `2.0` and `3.0`, keeps `2.0`, exactly tying its new sibling. The creation-time tie-break puts it after that sibling.
  - **Recommended: fix now.** A `PUT` that changes the parent places the project after its new siblings' true last, as a move with no neighbor does. That's item-positioning §2.1's scope-change rule, which goes on the shared page (D4). A `PUT` naming the current parent is no scope change, and keeps the position.
  - Both writes run one shared resolution, so they can't disagree. That's how items work: both of their writes go through one primitive (root `CLAUDE.md`, "One hierarchy-write primitive").
  - The other way: `PUT` refuses `parentId`, and the dropdown sends a move. That breaks symmetry with `PUT /items/:id`, which takes a parent.
  - **Ruled: fix now** (Nathan, 2026-10-05): "reparenting from the Project page should produce the same position as if the project were dragged to be that parent's last sibling".
- **G2. A create naming a parent that doesn't exist gets a 500** (probe). The stub said the project is stored orphaned. In fact the database refuses the insert: `projects.parent_id` has a foreign key, from migration 0003's hand-written SQL, though `schema.ts` doesn't declare it.
  - **Recommended: fix now.** A 400 with the message `PUT` and the move give.
  - **Ruled: fix now** (Nathan, 2026-10-05), with a 400 whose message says why.
- **G3. A move naming the project itself as its neighbor gets a 500** (probe), for `prevId` and for `nextId`. The route's neighbor check passes, then the resolver finds no such sibling, since the project is left out of its own group. An item's move naming itself as its anchor is refused with a 400 (TC-7.10).
  - **Recommended: fix now,** with a 400.
  - **Ruled: fix now** (Nathan, 2026-10-05), with a 400 and a message like the item's.
- **G4. A move naming a position ignores it** (probe). The project is placed as if no neighbor were named, at the end. An item's move refuses it with a 400 that says to name an anchor and side (item-positioning §2, TC-2.32). That rule goes on the shared page (D4), so projects would break it.
  - **Recommended: fix now,** with a 400 that says to name a neighbor.
  - That a create or an edit ignores a position is `positioning-on-create-and-edit.md`'s question, not this one.
  - **Ruled: fix now** (Nathan, 2026-10-05, just after approval), as recommended.
- **G5. A project write doesn't disclose a reindex** (probe on the server; the client by reading). Siblings at `1500` and `1600`, and a move to the end: the siblings are renumbered to `1` and `2`, and the response carries only the project, at `3`.
  - The sidebar merges only the written project (`App.tsx`'s create and move handlers). So it holds `1500`, `1600` and `3`, and shows the moved project first until the next reload. That's item-positioning §5.1's "why silence is unsafe", on the sidebar. A5b's Coder found it by reading and handed it here.
  - It's rare. It needs a sibling group past the magnitude threshold, or about 40 placements into one gap.
  - **Recommended: fix now.** The create, the move and a `PUT` that reparents (after G1) carry the renumbered pairs, as item writes do. The sidebar applies the pairs before it places the written project, the order item-positioning §5a gives.
  - The other way: the sidebar refetches the projects after every write. That's simpler, but it leaves the shared disclosure rule broken for any other caller.
  - **Ruled: fix now** (Nathan, 2026-10-05). Projects get the same treatment as items: the response carries the renumbered `{id, position}` pairs, and the sidebar applies them.
- **G6. A project with no position sorts differently on each side.** The server sorts it first (SQLite sorts a null first ascending). The sidebar sorts it as if its position were its creation time, which puts it last. The items' tie-break counts it as 0 (item-positioning §5a).
  - Only a direct database edit makes one. Every write gives a position, and migration 0004 backfilled the old rows.
  - `projects.ts`'s comment says "NULLS LAST", which is wrong.
  - **Recommended: fix now.** The sidebar counts a missing position as 0, and the shared tie-break holds on both sides. It's one comparator, and `projectTreeUtils.test.ts`'s two tests on it change.
  - **Ruled: as recommended.** Nathan left it to the Architect, since only a direct database edit makes one.
- **G7. A project can be given a second workflow** (probe: two creates for one project both return 201). The roadmap says a project has one ("A project has one workflow"). No UI offers a second.
  - With two, the project's items show on both workflows' boards. Which one the project page shows depends on row order, as does which one the server's `effectiveWorkflowIdForProject` returns.
  - **Recommended: fix now.** `POST /workflows` refuses a project that already has one, and names that workflow. Nothing on the roadmap changes that.
  - **Ruled: fix now** (Nathan, 2026-10-05): a project has at most one workflow.
- **G8. A workflow can be created for a project that uses an ancestor's.** The roadmap intends it: "Subprojects inherit or override". No UI offers it yet. The project switches to the new workflow, and so does every descendant that inherited through it. Their items keep the ancestor's workphases, so they show in Unsorted, the same as after a move (boards-columns-unsorted §3).
  - **Recommended: state it as a rule, and defer re-filing** with item-attachment's Open question. It's an intended action whose consequence Unsorted catches, as for a move.
  - The other way: refuse it until re-filing is designed, as A5a refused item writes that would leave a Free item in another workflow. A5a didn't refuse project moves, though, which have the same effect.
  - **Ruled: as recommended** (Nathan, 2026-10-05): "Any project can be assigned a workflow, but if one isn't assigned then it inherits its parent's." The page states it as inherit or override. Re-sorting a project's items into its new workflow is deferred, with re-filing. The API already accepts an override, so no code changes. That the project page doesn't offer one is the placeholder tier's (D1).
- **G9. An edit can set an empty name** (probe: `PUT` with `name: ""` returns 200). A create with no name gets a 400.
  - **Recommended: fix now,** with a 400.
  - The other way: leave it to the API contract epic's request schemas (its C1), which validate every field.
  - **Ruled: fix now** (Nathan, 2026-10-05): an edit allows the same names a create does. An edit that leaves the name out keeps it. Today an edit naming `null` keeps it too. Whether that stays, or is refused like a create with no name, is the PO's to word in batch 1.

### D4 The shared positioning page

The PO's decision above, ruled by Nathan. It's a page split, so it follows the wiki README's "Sections, anchors and references": the Handoff carries a map from each old anchor to its new one.

**The Architect's starting split, for the PO's batch 1.** The PO decides where each piece lands, and the page's name and sections. `positioning` is the Architect's suggestion for the name.

| Shared: the new page | Stays on item-positioning |
|---|---|
| **A write names a neighbor and a side, never a number.** The API takes no final position from any caller, and a move that names one is refused (§2's first paragraphs; G4) | **§1:** one position per item, never per board |
| **Resolution against a fresh query, never the caller's view:** the steps, coarsest fit, the append fallback with its virtual floor, the bootstrap fallback, and the tight-gap trigger (§2) | **An item's comparison scope:** the whole workflow for a Free item, the parent's attached children for an Attached one (§2, §3). That includes the bootstrap's "why not rank-aware", which rests on the workflow-wide scope |
| **Each feature names its comparison scope.** New wording, so the page holds for items and projects alike: a project's is its siblings | **The workphase-only move** (§2, §7.5) |
| **The client never computes a number.** Its feedback is ordinal, with the reason and the worked example (§2's "Client-side role") | **`positionScope`,** and the pending item's marker (§2) |
| **A scope change with no neighbor named takes a fresh position at the end, and an unchanged scope keeps its own** (§2.1's principle; G1) | **§2.1's table** of item operations |
| **Reindexing:** what it does, its two triggers and the threshold (§5) | **Active items reindex as one scope, and done items are left out** (§5, §6) |
| **A write that reindexes discloses the renumbered pairs** (§5.1; G5) | **Which item writes disclose** (§5.1's list of routes) |
| **Applying a response:** the pairs first, then the written row, then any comparison. And the tie-break (§5a; G6) | **§4, §6 and §7** |

- **Section numbers on item-positioning stay.** A section whose rule moves keeps its number for its item-only part, with a pointer to the shared page. A section left with nothing item-only is removed, and its number stays unused. The PO decides each, and the anchor map records them.
- **Cases.**
  - item-positioning's catalog keeps every case, and the Test Planner re-points their Rule lines by the anchor map. That's about 70 Rule lines that cite §2, §2.1, §5, §5.1 or §5a.
  - project-tree's catalog tests the shared rules as projects apply them. `positionResolver.ts` is one module for both tables, and TC-2 already pins its arithmetic through items. So the Architect suggests repeating only what differs for projects: the sibling scope, naming a neighbor, no neighbor meaning the true end, a reparent's fresh position, disclosure, and the tie-break. Which cases is the Test Planner's call.
- **Links and pointers.**
  - **Other pages' links to §2, §2.1 and §5a** (board-drag-interaction, item-attachment, the wiki README's example) are re-pointed by the PO.
  - **About 25 code comments cite §2, §5, §5.1 or §5a.** The Coder re-points those whose rule moved, by the anchor map: `positionResolver.ts`'s header, `coarsestFit.ts`, and the tie-break and reconciliation comments in `itemListOps.ts` and `itemWriteReconciliation.ts`, among others.
  - **Root `CLAUDE.md`'s "Positioning" bullet** sends readers to item-positioning for the full rules, and the Architect re-points it.

### D5 Routed elsewhere

- **The move's field names, to the API contract epic's Story 1,** which puts both moves on schemas as its pilot. *(Was Story 2, corrected in batch 2.)* A project's move names its neighbor as `prevId` or `nextId`, and an item's as `anchorId` and `side`.
  - Both are the same rule in words, a neighbor and a side, so the page holds either way. Nathan wants project and item operations symmetrical, and whether the two shapes become one is a contract change.
  - A move naming both `prevId` and `nextId` uses `prevId`, and doesn't check `nextId`. That's contract too.
  - The Architect adds both to `api-contract-zod-openapi.md` in batch 2.
- **A create or an edit naming a position, to `positioning-on-create-and-edit.md`.** `PUT /projects/:id` ignores one, and a test pins that. That story already names projects.
- **Re-filing,** to item-attachment's Open question, as before (G8).
- **The placeholder tier and each deferred gap, to `epic-8-decisions.md`** (D1), unless a ruling sends one elsewhere.

### D6 Carried in from A5c's close (Open question 2)

A5c's plan was archived with its batch 3 commit, before its Close ran. Still open:
- **TC-6.7 and TC-6.8 haven't moved** to BCU-3.2 and BCU-3.3. Three tests in `columns.test.ts` keep the old IDs.
- **No Reconciler has run** over the boards-columns-unsorted catalog, item-positioning or item-attachment.
- **boards-columns-unsorted §3's clause** on which workflow a project uses was already handed to this story.

**Recommended: carry them in.** *Ruled at approval (Nathan, 2026-10-05):* folded into A5d, as recommended.
- The Test Planner moves the two cases in batch 2, while re-pointing item-positioning's catalog anyway.
- The Coder re-titles their tests in batch 3.
- A5d's closing Reconciler run covers boards-columns-unsorted too.

### D7 Tests and pointers

- **Tests already pin many of the firm rules without case IDs:**
  - `server/tests/routes/projects.test.ts`, and `tests/api/projects.spec.ts`. These are a route test and an API spec, so they count without approval;
  - `client/src/components/sidebar/projectTreeUtils.test.ts`, on sibling order. It's a client test, so mapping it needs Nathan's approval;
  - BCU-1.5's test, on which projects use a workflow (`boards.test.ts`). The Test Planner decides whether project-tree's inheritance case cites it, or gets a test of its own.
- **The UI specs** `tests/ui/project-page.spec.ts` and `project-sidebar.spec.ts` mostly pin the placeholder tier. They stay as unmapped support, except where one asserts a firm rule.
- **New tests** cover a rule no test pins, and each fix ruled in batch 1.
- **Index pointers** go on each rule's enforcing site, once the sections are numbered:
  - `routes/projects.ts`'s create, edit, move and delete;
  - inheritance: `workflowItems.ts`, and `App.tsx`'s `effectiveWorkflow` on the client;
  - `routes/workflows.ts`'s create, if G7 is fixed.
- **The foreign key on `projects.parent_id`** exists in the database but not in `schema.ts`, which only has a comment. If `schema.ts` is meant to describe the database, the Coder declares it while fixing G2, or says why not.

## Work, in batches

Each batch ends with a stop for Nathan's review and commit. A batch that changes code ends with the gate first.

**Batch 1: the PO's proposal.** No living doc changes yet.
- **The project tree's sections,** from §3, since A5b's §1 and §2 stay. That includes the firm/placeholder split (D1), the opening paragraph's new scope, and the Related links.
- **The shared page:** its name, its sections, what item-positioning keeps, and a draft anchor map (D4).
- **A ruling for each newly stated rule** (D2), and the wording of each gap's rule (D3), all of which are ruled.
- **A sweep of the other pages** for project rules, or shared positioning rules, stated somewhere else. boards-columns-unsorted §3's clause is one, and item-attachment §13's delete may need a link.
- All of it goes in this plan's Amendments, for Nathan.
- **Stop:** Nathan rules on the structure and the rules.

**Batch 2: the pages and the cases.** The split goes first, then the project tree's sections. If Nathan wants to review the split alone, the PO and the Test Planner stop between the two.
- **The PO:**
  - writes the shared page, and trims item-positioning to its item-only rules, with pointers;
  - re-points other pages' links by the anchor map;
  - writes project-tree's new sections, and cuts boards-columns-unsorted §3's clause to a link;
  - marks each gap ruled "fix now" `**Planned:**`, and puts the placeholder tier and each deferred gap under Open questions;
  - fills in the Handoff: the anchor map, and the sections added, changed, moved or removed.
- **The Test Planner:**
  - re-points item-positioning's Rule lines by the anchor map;
  - writes project-tree's new suites, with each fix's cases `Planned`;
  - moves TC-6.7 and TC-6.8 to BCU-3.2 and BCU-3.3 (D6);
  - updates the INDEX pages, and the test-plans README if the split calls for it.
- **The Architect:**
  - re-points root `CLAUDE.md`'s "Positioning" bullet, and any guide that cites a rule that moved;
  - records the placeholder tier and each deferred gap in `epic-8-decisions.md`, or where its ruling sends it;
  - adds D5's field-name lines to `api-contract-zod-openapi.md`;
  - points root `CLAUDE.md`'s "Workflow inheritance" bullet to project-tree §10, once the page states it;
  - corrects the MVP roadmap's Projects line, "Unlimited-depth hierarchical folders", for the project depth cap (call 1).
- `npm run check:docs` reports 0 hits.
- **Stop:** Nathan reviews the pages and the cases.

**Batch 3: the code** (Coder). It has two parts, each with its own stop, so the part that changes no behavior is reviewed apart from the part that does.
- **3a, no behavior change:**
  - re-titles the existing tests that assert a firm rule (D7), and TC-6.7's and TC-6.8's three tests (D6);
  - adds index pointers, and re-points comments by the anchor map;
  - proposes any client test's mapping, for Nathan's approval;
  - the gate.
- **3b, the fixes:**
  - each fix ruled "fix now", with a test carrying its case ID. Besides D3's gaps, those are the project depth cap (call 1) and a name of only spaces (call 10);
  - the gate, then `npm run test:e2e` if an E2E spec changed or the sidebar did (G5, G6, the cap's tab states).
- **Stop after each:** Nathan approves the mappings, and reviews.

**Close.**
- **The PO** takes the markers off, and brings the Handoff up to date.
- **The Test Planner** applies the Handoff, and moves the fixes' cases from `Planned` to `Open`.
- **The Reconciler** runs over project-tree, item-positioning (its Rule lines moved), and boards-columns-unsorted (D6).
- **The full story-done checklist applies, audit included:** G4, G7 and G9 change what the API accepts.
- **The Architect,** once the fixes are built, extends root `CLAUDE.md`'s "Reindex disclosure" convention to project writes (G5) and corrects its data model's "unlimited depth" for projects (call 1). Then archives this plan when Nathan signs off.

## Code map

The starting list. The Coder keeps it current.

| File | Batch | Change |
|---|---|---|
| `server/src/routes/projects.ts` | 3 | G1: `PUT` that reparents shares the move's resolution. G2: the create checks the parent. G3: a move naming the project itself is refused. G4: a move naming a position is refused. G5: the create, the move and `PUT` return the renumbered pairs. G9 and call 10: the create and `PUT` refuse a name of only spaces, and `PUT` refuses an empty name or `null`. Call 1: the create, the move and `PUT` refuse a parent that would put the subtree past the project cap. Pointers on each write. The list route's "NULLS LAST" comment (G6) |
| `server/src/routes/workflows.ts` | 3 | G7: the create refuses a project that already has a workflow |
| `server/src/lib/workflowItems.ts` | 3 | Pointers on inheritance |
| `server/src/lib/itemTree.ts` | 3 | Call 1: the project cap, a value of its own beside `ITEM_DEPTH_CAP`, and the depth check generalized to projects, or a project twin of `assertWithinDepthCap`. The Coder decides, by "One position math layer" |
| `server/src/db/schema.ts` | 3 | `projects.parentId`'s foreign key (D7) |
| `server/src/lib/positionResolver.ts`, `coarsestFit.ts` | 3 | Header pointers re-pointed to the shared page |
| Other comments citing item-positioning §2, §5, §5.1 or §5a | 3 | Re-pointed by the anchor map |
| `client/src/App.tsx` | 3 | G5: the create and move handlers apply the pairs. A pointer on `effectiveWorkflow` |
| `client/src/api/projects.ts`, `client/src/types.ts` | 3 | G5: the responses' renumbered pairs |
| `client/src/components/sidebar/projectTreeUtils.ts` | 3 | G6: a missing position counts as 0 |
| `client/src/components/sidebar/useProjectDragReorder.ts`, `SortableProjectRow.tsx` | 3 | Call 1, deduction n: a tab state over the project cap is still offered, its line is marked invalid, and a release in it writes nothing |
| `server/tests/routes/projects.test.ts`, `workflows.test.ts`, `tests/api/projects.spec.ts`, client tests | 3 | Re-titles, and the new tests |
| `server/tests/routes/columns.test.ts` | 3 | TC-6.7's and TC-6.8's tests re-titled BCU-3.2 and BCU-3.3 (D6) |
| `CLAUDE.md` | 2, close | Batch 2, done: "Positioning" cites the shared page, "Workflow inheritance" project-tree §10 and the server's site, and the attach bullet the cap's formula. At close: reindex disclosure for project writes, and the project cap in the data model |
| `docs/planning/mvp-roadmap.md` | 2 | Done. The Projects and Work Items lines lose unlimited depth (call 1, and Nathan's answer in batch 2) |
| `docs/planning/epic-8-decisions.md`, `epic-7-decisions.md`, `tech-debt-stories/api-contract-zod-openapi.md` | 2 | Done. Epic 8: the placeholder tier. Epic 7: re-filing a project's items. The API contract epic's Story 1: D5's field names |

## Acceptance

- **The shared page** states the rules both features share. item-positioning keeps only the item-only rules, each moved rule leaving a pointer, and the Handoff maps every old anchor to its new one.
- **The project tree's page** has numbered sections for the API's rules. Its opening paragraph says the project page is a placeholder, and its Open questions hold the placeholder tier and each deferred gap.
- **The catalogs:** every case for a firm project rule is `Automated`, or routed by ID. Every item-positioning Rule line cites the section that now holds its rule. TC-6.7 and TC-6.8 are BCU-3.2 and BCU-3.3.
- **The fixes:** each fix ruled "fix now" is built, and a test carrying its case ID shows it.
- **The gate:** `npm run check` passes, as does `npm run test:e2e` if a spec changed. `check:docs` reports 0 hits. The Reconciler's run reports no lost coverage.
- **Pointers:** each project rule's enforcing site has its pointer, and no comment cites item-positioning for a rule that moved.
- **Routing:** each deferred gap is recorded where its ruling sends it, and D5's lines are in the API contract epic's plan.

## Handoff

- **Wiki sections added, changed, moved or removed** (PO, batch 2). No section was renumbered or removed.
  - **Added:**
    - wiki positioning, a page of shared rules, §1 to §8, with no catalog of its own;
    - wiki hierarchy-placement §6, the depth cap;
    - wiki project-tree §3 to §10.
  - **Moved, item-positioning to positioning.** Each item-positioning section keeps its number and its item-only part, with a pointer:
    - §2's relative intent, the refusal of a final position, and why: to positioning §2. The refusal's message now reads "name a neighbor and a side";
    - §2's resolution steps, coarsest fit, the append fallback and its virtual floor, the bootstrap, and the tight-gap trigger: to positioning §3. §2 keeps which item writes take the append fallback, and the bootstrap's workflow-wide reading with why it isn't rank-aware;
    - §2's "Client-side role", with its worked example and the flip side: to positioning §5. §2 keeps the pending marker;
    - §2.1's principle: to positioning §4. §2.1 keeps the table;
    - §5's account of a reindex, its two triggers and the threshold: to positioning §6. §5 keeps active items as one scope and done items left out;
    - §5.1's rule, why silence is unsafe, and the pairs' shape: to positioning §7. §5.1 keeps the item writes that disclose, and `reindexed`;
    - §5a's outcome, its three steps, and why the order matters: to positioning §8. §5a keeps which item writes it covers, and the board's exceptions;
    - §5a's tie-break: to positioning §1;
    - §7.1's refusal of an anchor that doesn't exist, has no position, or is outside the resulting scope, with no fallback: to positioning §2. §7.1 keeps the board's case, a Card dropped as a Stub, and that nothing in the request commits.
  - **Moved, item-attachment §8 to hierarchy-placement §6:** the formula and what `H` counts; that the formula is the whole rule; that the cap gates writes and leaves existing data valid; that a feature's UI and API enforce one value; and that it's a display constraint. §8 keeps root items at depth 1, that a detached descendant counts toward `H`, the item cap's provisional 6, and its grounding.
  - **Newly stated** (Amendments, batch 2): positioning §2's "an entry is never its own neighbor", with an example, which TC-X.6 and TC-7.10 read from §2 and §7.1; positioning §6's "a reindex renumbers the whole scope it fires in, and nothing outside it", and item-positioning §5's attached children as a scope of their own; hierarchy-placement §6's per-tab-state validity (deduction n).
  - **Retitled, numbers kept:** item-positioning §2, "An item's comparison scope and the workphase-only move"; §2.1, "Which item writes take a new position"; §5, "Which items reindex together"; §5.1, "Which item writes disclose a reindex"; §5a, "Which item writes the client reconciles".
  - **Changed in place:**
    - item-positioning: a new opening paragraph, Related, the pointers in §3 and §7 to §7.1, and §7.3 with its Open question (deduction k);
    - item-attachment: Related, §2a's link to project-tree §10, §4's link to positioning §3, §9's "an item write never leaves …" and its cause (deduction k), §13's new last paragraph on a project's delete, and the re-filing Open question;
    - boards-columns-unsorted: Related; §3's clause on which workflow a project uses, cut to a link to project-tree §10 (A5c's handoff), and its example, which gains an override; the Open question on a project that uses no workflow;
    - board-drag-interaction: Related; §2's rule 5 and §10's links, now to positioning §5 and §8, and to item-positioning §2 for the pending marker; §7.2's link, now to hierarchy-placement §6 as well;
    - hierarchy-placement: the Test suite line, Related, and the opening paragraph;
    - project-tree: the opening paragraph, Related, §1's pointer to §6 and its Planned over-cap bullet, and §2's failed-move clause (deduction o);
    - the wiki README's example, which links positioning §2.
- **Planned passages this story builds:**
  - wiki project-tree §1: a tab state over the project cap (call 1);
  - wiki project-tree §3: a create checks its parent (G2), and the project cap (call 1);
  - wiki project-tree §4: the sidebar's sort of a missing position (G6), and reindex disclosure (G5);
  - wiki project-tree §6: the project as its own neighbor (G3), and a named position (G4);
  - wiki project-tree §7: an edit that changes the parent (G1);
  - wiki project-tree §8: an edit's empty name or `null` (G9), and a name of only spaces (call 10);
  - wiki project-tree §10: at most one workflow (G7).
- **For the Test Planner:**
  - **Rule lines** follow the two maps above. A case that tests a shared rule as items apply it may cite both pages: positioning's section, and item-positioning's for the item's part. ATT-4's cases that test the formula cite hierarchy-placement §6 as well as item-attachment §8.
  - **TREE-1.7** pins §1's "Projects have no depth cap", which stays the rule until the Planned cap is built.
  - **project-tree §8's "or an empty one"** for a create is worded from G9's description. If a test shows a create takes an empty name, it comes back to the PO.
  - **BCU-1.5:** boards-columns-unsorted §3 now links project-tree §10 for which workflow a project uses (D7).
  - **The placeholder tier** is under project-tree's Open questions, and gets no cases.
- **For the Coder (batch 3):** a comment that cites item-positioning §2, §2.1, §5, §5.1, §5a or §7.1 for a rule that moved, or item-attachment §8 for the formula, is re-pointed by the maps. Index pointers go on project-tree §3 to §10's enforcing sites.
- **For the Architect (batch 2):** project-tree's Open questions hold the placeholder tier as written, for `epic-8-decisions.md`: the project page, the sidebar's other controls, how the user learns that a write failed, how an over-cap tab state looks, the project cap's real value (Epic 3.5's Story 7), a project that uses no workflow, overriding an inherited workflow from the page, and re-filing. Root `CLAUDE.md`'s "Positioning" bullet points to wiki positioning, and "Workflow inheritance" to wiki project-tree §10.

## Open questions

For Nathan, at plan approval.

1. **Two tiers, as in A5c** (D1). The API's rules are firm. The project page, and the sidebar's controls other than the drag, are a placeholder under Open questions, recorded in `epic-8-decisions.md` for the Dashboard, Navigation & Notifications epic or later.
   - **Recommended: yes.** That epic reworks navigation. The sidebar's drag rules, which A5b made firm, stay firm.
   - **Answered (Nathan, 2026-10-05):** yes, the same two tiers.
2. **A5c's unfinished close** (D6). TC-6.7 and TC-6.8 haven't moved, and no Reconciler has run.
   - **Recommended: carry both into A5d.** Batch 2 re-points item-positioning's catalog anyway, and A5d's closing Reconciler run can cover boards-columns-unsorted.
   - The other way: finish A5c's close first, as its own small step, before A5d's batch 1.
   - **Answered (Nathan, 2026-10-05):** fold it into A5d.
3. **For the Architect, from the PO's batch 1:** code facts that batch 1's calls depend on.
   - **§3:** what an edit gets for a parent that's the project itself, is in its subtree, or isn't a project. The page says a 400, as for the move.
   - **Call 9:** what the move does with a neighbor that has no position.
   - **Call 10:** whether a create takes a name of only spaces.
   - **Call 11:** whether the sidebar, after a create, a move or an edit fails, puts the project back where it was before the attempt.
   - Since Nathan's rulings on calls 9 to 11, each of their facts decides whether that call adds a fix to batch 3 (Amendments).
   - **Answered (Architect, 2026-10-05).** Calls 9 and 11, and §3's edit, are what the code does today, so they go on the page unmarked. Call 10 is a fix. The server facts come from a throwaway route test, deleted afterward. The sidebar's come from reading.
     - **§3: today's code.** An edit naming the project itself as its parent gets a 400 ("A project cannot be its own parent"), and so does one naming a project in its subtree ("Cannot reparent to a descendant"), or an id that's no project ("parentId does not reference an existing project"). Nothing changes. `projects.test.ts`'s `PUT` tests already pin all three. Only the create's case is a fix (G2).
     - **Call 9: today's code.** The move refuses a neighbor with no position with a 400 ("prevId has no position to anchor against", and the same for `nextId`), and nothing changes. It checks before it writes. So the shared rule (deduction b) holds for projects unmarked, and G3's line stays about the project itself.
     - **Call 10: a fix.** A create takes a name of only spaces (a 201, stored as sent), and so does an edit (a 200). The create checks only that a name is given. So under Nathan's ruling, the fix goes with G9, and §8 marks that part of the create's rule `**Planned:**`. The create dialog trims the name and refuses an empty one, so only a direct API call sends one today.
     - **Call 11: today's code.** The sidebar keeps no state of its own for a write in flight. It shows the project list the app holds, and the list changes only when a write succeeds.
       - **A move:** once the drag ends, the project shows where it was, and the app refetches the list after the failure.
       - **A create:** no new project shows. The create dialog stays open with "Failed to create project. Please try again."
       - **An edit of the parent:** the dropdown shows the stored parent again, since the stored value controls it.
       - **One detail for the PO:** a drop into a collapsed project opens it before the write is sent (§2), and it stays open after a failure. The moved project is back in place. Whether §4's rule mentions the open parent is the PO's call. It reads as presentation.
       - A failed edit reaches the user only as a console error. That's the deferred question of how the sidebar tells the user a write failed.

## Amendments

- **2026-10-05, at approval (Architect):** Nathan answered both open questions as recommended, and ruled every gap but G4 ahead of batch 1 (D3). The Type and Status lines, D1, D2, D3, D6, batch 1, Close and the Code map now say so.
  - D1's placeholder tier gains that the project page offers no way to override an inherited workflow (G8).
  - Close gains root `CLAUDE.md`'s reindex convention, which covers only item writes until G5 is built.
- **2026-10-05, after approval (Architect):** Nathan ruled G4 a fix, as recommended. Every gap is ruled now, so batch 1 proposes none, and its stop rules on the structure and the rules alone. The Type and Status lines, D3, batch 1, Close and the Code map say so.
- **2026-10-05, batch 1 (the PO): the proposal.** No living doc has changed. Each numbered call is for Nathan, with the PO's recommendation first. Each deduction is lettered and names the rules it follows from. D2's rules are worded from the Architect's reading of the code, so batch 3's tests pin each one, and any the code turns out not to do comes back to Nathan, as in A5c. The code facts the PO needs are Open question 3, for the Architect.
  - **The shared page: `positioning`, titled "Positioning — Anchor, Side and Reindexing"** (D4). Like hierarchy-placement, it has no catalog of its own: its Test suite line names item-positioning's and project-tree's.
    - **Opening paragraph (draft):** "This page answers "how does a write place an entry among others, and how does a client keep the order the server saved." Its rules are shared: items and projects both place by them. An *entry* is one thing a position orders: an item or a project. Each feature's page names its comparison scopes, says which of its writes place an entry, and states any rule of its own, marking as Planned any rule here that it's still to be built to."
    - **Related:** item-positioning (an item's scopes, the active/done split, and the board's placements) · project-tree §4 (a project's siblings).
    - **Sections:**
      - **§1, "A position orders an entry within its comparison scope":** a position compares only against the other entries in its scope, and each feature's page names its scopes (D4's new wording). Then the tie-break, moved from item-positioning §5a, with a worked example: `A` and `B` both at `2.0`, `A` created first, and `C` with no position, read `C, A, B`.
      - **§2, "A write names a neighbor and a side, never a number":** item-positioning §2's first three paragraphs, said of entries: relative intent, no final position, and why. Then the rules for a named neighbor, moved from §7.1: one that doesn't exist, has no position, or isn't in the entry's resulting scope is refused with a 400, nothing changes, and no fallback ignores it (deduction b). An entry is never its own neighbor (deduction a).
      - **§3, "How a position resolves":** §2's five steps, coarsest fit, the append fallback and its virtual floor, the bootstrap, and the tight-gap trigger. Besides §2's coarsest-fit example (`1.5` and `2.0` give `1.8`), it gains two: an append after a true last at `4.2` gives `5`, and a prepend before a true first at `1.0` gives `0.5`.
      - **§4, "When a write gives an entry a new position":** §2.1's principle, worded for both features (deduction c).
      - **§5, "The client never computes a position":** §2's "Client-side role" and its worked example, said of entries, plus how it meets hierarchy-placement §5 (deduction d).
      - **§6, "Reindexing":** what a reindex does, its two triggers and the threshold, from §5, plus deduction e. The example is G5's: entries at `1500` and `1600`, and one placed after the last. The append would give `1601`, past the threshold of `1000`, so the scope is reindexed first, to `1` and `2`, and the entry lands at `3`.
      - **§7, "A write that reindexes discloses it":** §5.1's rule, why silence is unsafe, and the pairs' shape. Which writes disclose is each feature's.
      - **§8, "Applying a response":** §5a's outcome, its three steps, and why the order matters. Each feature's page names its exceptions.
      - **Open questions:** none. Whether a create or an edit takes a position is `positioning-on-create-and-edit.md`'s. Nathan ruled that ignoring one is acceptable for now, which meets §2, so nothing on the page is unsettled.
    - **Two changes to D4's starting split, the PO's:**
      - the tie-break goes to §1, not with §5a's steps in §8, since every sort uses it, with or without a response;
      - the named-neighbor rules go to §2, out of item-positioning §7.1, since a project's move has them too (D2, G3).
  - **What item-positioning keeps.** No section is renumbered or removed. A section that loses a rule keeps its item-only part, and a pointer to the shared page:
    - §2: an item's comparison scope, that a merged column isn't a boundary, which item writes take the append fallback, why the bootstrap isn't rank-aware, the workphase-only move, `positionScope`, and the pending marker;
    - §2.1: the table of item writes, and a done item's exception (§6);
    - §5: active items reindex as one scope, and done items are left out;
    - §5.1: which item writes disclose, in `reindexed`;
    - §5a: which item writes it covers, and the board's exceptions (board-drag-interaction §10);
    - §7.1: the board's case of the resulting scope, a Card dropped as a Stub, and that nothing in the request commits (item-attachment §6);
    - §1, §3, §4, §6 and §7.2 to §7.5: unchanged, except for pointers re-pointed by the anchor map.
    - **The page gains an opening paragraph,** which the wiki README's layout requires and the page lacks (draft): "This page answers "what does an item's position compare against, and how does a drop on the board place an item." How a position resolves, is reindexed and is applied by a client is [positioning]'s, since items share those rules with projects. This page holds an item's own scopes, merged columns, the active/done split, and the board's placement intents." Related gains positioning.
  - **The draft anchor map,** from item-positioning. Batch 2's Handoff carries the final one. Everything not listed stays where it is.
    - §2's relative intent, no final position, and why: to positioning §2.
    - §2's steps, coarsest fit, the append and bootstrap fallbacks, and the tight-gap trigger: to positioning §3.
    - §2's "Client-side role": to positioning §5.
    - §2.1's principle: to positioning §4.
    - §5's account of a reindex, its triggers and the threshold: to positioning §6.
    - §5.1's rule, why, and the pairs' shape: to positioning §7.
    - §5a's outcome, steps, and why the order matters: to positioning §8.
    - §5a's tie-break: to positioning §1.
    - §7.1's anchor that doesn't exist, has no position, or is outside the resulting scope, and that no fallback ignores it: to positioning §2.
  - **The project tree's page.** A5b's §1 and §2 stay. The new sections start at §3.
    - **Opening paragraph (draft):** "This page answers "what is the project tree, how does a write change it, and which workflow does each project use." Its numbered sections state what the API does, and what the sidebar's drag adds to it. The project page, and the sidebar's controls other than the drag, are a working placeholder: they're under Open questions, and no test case is derived from them. A dragged project is placed by [hierarchy-placement]'s gap and depth, and a project's position resolves by [positioning]'s rules, which items share. Which items a board shows is [boards-columns-unsorted]'s."
    - **Related:** hierarchy-placement (the gap-and-depth rule the sidebar places by) · positioning (how a project's position resolves) · boards-columns-unsorted (which projects' items a board shows) · item-attachment (an item's own tree, which has a depth cap).
    - **§1 gains two pointers:** a release saves its placement as a move (§6), and the bullet on depth points to §3.
    - **The sections.** Calls 1 to 7 rule what each states.
      - **§3, "Projects form a tree with no depth cap":** a project with no parent is top-level. A write that gives a project a parent names one that exists, isn't the project itself and isn't in its subtree, or it's refused with a 400, and nothing changes. Any depth is legal, unlike an item's (item-attachment §8). `**Planned:**` (G2) a create naming a parent that isn't a project is refused the same way, with a message that says why.
      - **§4, "A project's position compares among its siblings":** a project's comparison scope is its siblings, the projects with the same parent, or the other top-level projects. They're ordered by positioning §1's tie-break: `GET /api/projects` lists them in that order, and the sidebar shows each project's children so. A write compares and renumbers positions only among the siblings the project ends with (deduction e). `**Planned:**` (G6) the sidebar counts a missing position as 0, as the list does (deduction j). `**Planned:**` (G5) the create, the move and an edit that changes the parent disclose a reindex (positioning §7), and the sidebar applies the pairs before it places the written project (positioning §8).
      - **§5, "Creating a project":** it's top-level, or a child of the parent it names (§3), and goes after its siblings' true last (positioning §3, §4). Example: with siblings at `1.0` and `2.0`, a create lands at `3`, and a parent's first child lands at `1`. It has a name (§8), and uses the workflow its parent uses, until it's given its own (§10).
      - **§6, "Moving a project":** the move names the sibling the project goes directly after or directly before, never a number (positioning §2). A neighbor that doesn't exist, or isn't a sibling in the resulting group, is refused with a 400, and nothing changes. With none named, the project goes after its true last sibling in the resulting group, even when its parent doesn't change, so a move always places it (positioning §4). The new parent follows §3. The subtree goes with the project (deduction f), and the move may change which workflow they use (§10). It isn't refused for that, unlike an item's cross-workflow reparent (item-attachment §9): the items show in Unsorted (boards-columns-unsorted §3). Example: siblings `A` at `1.0`, `B` at `2.0` and `C` at `3.0`. A project moved after `A` lands at `1.5`, and one moved with no neighbor named lands at `4`.
        - `**Planned:**` (G3) a move naming the project itself as its neighbor is refused with a 400 whose message says why, and nothing changes (positioning §2).
        - `**Planned:**` (G4) a move naming a position is refused with a 400 whose message says to name a neighbor instead, and nothing changes (positioning §2).
      - **§7, "An edit can change a project's parent":** the project page's parent dropdown sends one (Open questions). The new parent follows §3. An edit that leaves the parent as it is keeps the position. `**Planned:**` (G1) an edit that changes the parent places the project after its new siblings' true last, as a move naming no neighbor does (§6; positioning §4). Example: a project at `2.0`, edited to a parent whose children sit at `1.0`, `2.0` and `3.0`, lands at `4`.
      - **§8, "A project always has a name":** a create with no name is refused with a 400, and nothing is stored. An edit that leaves the name out keeps it. `**Planned:**` (G9) an edit naming an empty name, or `null`, is refused with a 400, and nothing changes (deduction g).
      - **§9, "Deleting a project deletes its subtree":** D2's rule. It's never refused, and nothing in the subtree is kept: its projects, the workflows they own with their boards, columns and workphases, and their items, each with its own subtree, since a hierarchy never straddles two projects (item-attachment §9, §13).
        - An item of another project in one of the deleted workphases survives, with no workphase, and shows in Unsorted (boards-columns-unsorted §8, §10). One way it gets there: its project moved out of the subtree, and its items still hold the old workflow's workphases (boards-columns-unsorted §3).
        - Labels are global, and stay. Deduction h says what the delete leaves alone.
      - **§10, "Which workflow a project uses":** D2's rule, as inherit or override, with what changes it (G8, unmarked: the API already accepts an override), and deduction i.
        - Example: `P` owns `W1`, and has a child `C`, whose child `D` owns `W2`. `C` uses `W1`, and `D` and its descendants use `W2`. A workflow given to `C` makes `C` use it, and leaves `D` as it is.
        - What a change does to a project's items is boards-columns-unsorted §3's.
        - `**Planned:**` (G7) a workflow create for a project that already has one is refused with the status call 8 rules on, and a message naming that workflow, and nothing is created.
      - **Open questions,** D1's placeholder tier, all of it:
        - **the project page:** the breadcrumb, the tabs, the Overview tab with its description, parent dropdown and subprojects list, and the banner over an inherited board. The dropdown offers the top level and every project outside the project's subtree, which is what §3 accepts;
        - **the sidebar's other controls:** the create and delete buttons, how the delete asks first, the collapse chevrons, the remembered selection, and how a deep tree indents, since projects have no cap (§3);
        - **what a project that uses no workflow shows,** "Set up a Workflow", and that nothing offers an override, though the API takes one (§10). It points to boards-columns-unsorted's and item-attachment's questions on such a project;
        - **re-filing a project's items when it comes to use another workflow,** pointing to item-attachment's question.
  - **Rules the page newly states (D2).** Each is recommended yes.
    - **Call 1: a project's parent (§3).** It's the item's legal-parent rule (item-attachment §7) without the depth cap. It holds for every write that gives a project a parent, once G2 brings the create in.
    - **Call 2: creating a project (§5).** Top-level or under a parent, after its siblings' true last, with a name.
    - **Call 3: how siblings are ordered (§4).** Position, then creation time, a missing one counting as 0: the items' tie-break, now shared. The sidebar's sort of a missing position is G6.
    - **Call 4: moving a project (§6).** A move always places the project, even under the same parent. An item's move within its own workphase that names no anchor does the same (item-positioning §2's append fallback), so the two stay symmetrical.
    - **Call 5: deleting a project (§9).** The API never refuses it. Asking "are you sure" is the placeholder's, under Open questions, with the sidebar's delete button.
    - **Call 6: which workflow a project uses (§10).** Inherit or override. What it does to the items is already boards-columns-unsorted §3's rule, so §10 links it rather than restating it.
    - **Call 7: a project always has a name (§8).**
  - **New questions, found while drafting.**
    - **Call 8: G7's status code.** Nathan ruled the refusal, and the page needs its code.
      - **Recommended: a 409.** The request is well-formed, and it's refused for what's already stored, which is what the last board's 409 means (boards-columns-unsorted §1).
      - The other way: a 400, like a column overlap (boards-columns-unsorted §6), which also names the row in the way.
    - **Call 9: a project named as a neighbor while it has no position.** Only a direct database edit leaves a project with none, as with G6. The shared rule refuses such a neighbor (deduction b), as an item's move does (item-positioning §7.1). What the project move does is a code fact (Open question 3).
      - **Recommended:** if the move doesn't refuse it with a 400, fix it with G3, which has the same shape. G6 is fixed though only a direct database edit reaches it too.
      - The other way: leave the case unstated for projects. project-tree then says the shared rule holds for a project except for a neighbor with no position, under Open questions.
    - **Call 10: a name of only spaces.** G9 makes an edit take the names a create takes. If a create takes a name of only spaces (Open question 3), so does an edit, and the sidebar shows a blank row.
      - **Recommended: count it as no name, refused by both writes, and fix it with G9.** It's the same check, and Nathan chose a fix over the API contract epic for G9.
      - The other way: leave it to the API contract epic's request schemas (its C1), which validate every field.
    - **Call 11: what the sidebar shows when a project write fails.** item-attachment §6 says the client resyncs after a refused item write, and board-drag-interaction §10 says how the board does it. No page says it for the sidebar.
      - **Recommended:** if the sidebar already shows the tree as the server has it after a failed write (Open question 3), §4 says so as a rule. If it doesn't, the question goes under Open questions with the sidebar's placeholder, and to `epic-8-decisions.md`. That's how Nathan ruled A5c's calls 1, 3 and 5.
  - **Deductions.**
    - **a. An entry is never its own neighbor.** A position compares against the *other* entries in its scope (item-positioning §2: "every other active item"), so resolution leaves the entry out, and naming it is naming a neighbor outside the scope, which is refused (§7.1). G3 is projects' case of it.
    - **b. A neighbor with no position is refused, whatever the entry.** Resolution starts from the neighbor's position (§2's first step), and no fallback ignores a named neighbor (§7.1).
    - **c. When a write gives an entry a new position.** A write that places the entry names a neighbor, or names none and goes after its scope's true last (§2's fifth step, and the append fallback's "a same-workphase reorder/append with no specific target card"). A write that changes the entry's scope without naming a neighbor goes after its new scope's true last (§2.1). Any other write keeps the position (§2's workphase-only move), except where a feature's page says otherwise: an item made done loses it (§6). Nathan's G1 ruling makes a project edit that changes the parent one that changes the scope.
    - **d. With full context, a set-down in its own gap writes nothing.** §2's "Client-side role" puts anything between two rendered neighbors outside the view. With full context nothing is, so the two relations name one true slot, which is hierarchy-placement §5's no-op. Where the view may be narrower, a set-down with a neighbor is a real write (board-drag-interaction §2).
    - **e. A reindex renumbers the whole scope it fires in, and nothing outside it.** From §5: "that local comparison scope", "the relevant scope", and never a whole-project sweep. So a project write reindexes only the siblings the project ends with.
    - **f. A move carries the project's subtree.** Its descendants keep their parents, so their scopes don't change, and they keep their positions (positioning §4). Which workflow they use may change (§10).
    - **g. An edit naming `null` for the name is refused.** Nathan ruled that an edit takes the names a create takes, and a create with no name is refused. Naming `null` asks for no name, as naming `parentId: null` asks for no parent (item-attachment §11). Leaving the name out still keeps it. Today `null` keeps it, so this joins G9's fix. D3 left this to the PO.
    - **h. A delete never changes which workflow a project outside the subtree uses.** A project inherits only from its ancestors (§10), and every descendant of a deleted project is in the subtree, so no project outside it inherits from inside it.
    - **i. A project whose workflow is deleted uses the nearest one left above it, or none.** The rule, "its own, or else its nearest ancestor's", holds of whatever is stored. The deleted workflow's items lose their workphases (boards-columns-unsorted §8), so they show in Unsorted on the boards of the workflow they now use.
    - **j. The list already meets the tie-break.** No write gives a position at or below 0 (positioning §3: the bootstrap starts at 1, an append adds 1, and the virtual floor keeps a prepend above 0; a reindex numbers from 1). So sorting a missing position first, as the list does, is the same order as counting it as 0. G6 changes the sidebar only.
    - **k. The cause widens:** "a project moving under a different workflow" becomes "a project that comes to use a different workflow" (project-tree §10), in item-attachment §9 and its Open question on re-filing, and in item-positioning §7.3 and its Open question. G8's override does the same to a project's items as a move does. boards-columns-unsorted §3 and §10 already say it that way.
  - **The sweep.** The PO read the other pages for project rules, and for shared positioning rules, stated somewhere else. Besides deduction k:
    - **boards-columns-unsorted:** §3's clause on which workflow a project uses is cut to a link to project-tree §10 (A5c's handoff), and §3's example gains "or is given a workflow of its own". Related's note on project-tree becomes "(which workflow a project uses)". The Open question on a project that uses no workflow links §10.
    - **item-attachment:** §9's "a write never leaves an item where only Unsorted can show it" becomes "an item write never …", since a project's move or override can (project-tree §6, §10). §13 gains that deleting a project deletes its items, each with its subtree (project-tree §9). §2a's "its project's workflow" links project-tree §10 once. §4's "append fallback" links positioning §3. Related gains positioning.
    - **board-drag-interaction:** Related gains positioning. §2's rule 5 and §10's "Client-side role" link go to positioning §5, and §10's response order to positioning §8. §10's "Same reference as above", for the pending marker, becomes item-positioning §2, which keeps it. Its other links stay, on rules item-positioning keeps: §5's, §8's, and §10's on an item with no position to keep.
    - **The wiki README's example** links positioning §2.
    - **Looked at and left in place:** item-attachment §8's cap, which it grounds partly in the sidebar's width. Projects have no cap, so how a deep tree indents goes under project-tree's placeholder (above). item-attachment §9's link to item-positioning §2.1, whose table stays. hierarchy-placement and item-sheet hold nothing that moves.
    - **Outside the wiki:**
      - `positioning-on-create-and-edit.md`'s Handoff names item-positioning §2 for the PO's answer, which would now go on positioning §2. It's another story's entry, so the PO re-points it in batch 2 only if Nathan clears it.
      - For the Architect in batch 2: root `CLAUDE.md`'s "Workflow inheritance" bullet could point to project-tree §10, beside "Positioning" (D4).
- **2026-10-05, Nathan's rulings on calls 8 to 11.** Calls 1 to 7, the structure, and clearing the PO to re-point `positioning-on-create-and-edit.md` are still open for batch 1's stop.
  - **Call 8, as recommended:** G7's refusal is a 409. project-tree §10's Planned line says so.
  - **Call 9, as recommended:** if the project move doesn't refuse a neighbor with no position with a 400 (Open question 3), the fix goes with G3, and §6's G3 line covers both. If it does, the shared rule (deduction b) holds for projects unmarked.
  - **Call 10, as recommended:** a name of only spaces counts as no name, and a create and an edit both refuse it with a 400. If a create takes one today (Open question 3), the fix goes with G9, and project-tree §8 marks that part of the create's rule Planned too.
  - **Call 11, ruled: after a failed write, the sidebar puts the project back where it was before the attempt.** Telling the user more visibly that the write failed is deferred.
    - **project-tree §4** states it: unmarked if the sidebar does this today, and `**Planned:**`, with a fix in batch 3, if it doesn't (Open question 3).
    - *Deduction l,* from this ruling and "nothing changes" on a refused write (§3, §6): it holds for each project write. A failed create shows no new project, and a failed move or edit leaves the project where it was.
    - **project-tree's Open questions** gain how the sidebar tells the user a write failed, under the sidebar's placeholder. The Architect records it in `epic-8-decisions.md` with D1's placeholder tier.
  - **For the Architect:** calls 9, 10 and 11 may each add a fix to batch 3, depending on Open question 3's facts. Batch 3 and the Code map follow once those are known.
- **2026-10-05, Nathan cleared the PO** to re-point `positioning-on-create-and-edit.md`'s Handoff from item-positioning §2 to positioning §2. The PO does it in batch 2, once the shared page exists. Calls 1 to 7 and the structure are still open for batch 1's stop.
- **2026-10-05, Nathan's rulings on calls 1 to 7.** Calls 2 to 7 as recommended. Call 1 as recommended, except for depth.
  - **Call 1, ruled: projects have a depth cap.** Its value is provisional, and Epic 3.5's Story 7 sets the real one. Nathan left the provisional value to the PO. The ruling reverses project-tree §1's "Every tab state in the range is valid. Projects have no depth cap", which A5b wrote, so it's a fix for batch 3, and it changes what the API accepts.
    - **The value: 6, the same as items'.** item-attachment §8 grounds items' 6 in the sidebar's width, where projects are shown too, and Story 7 derives the real cap from what the sidebar can show. Each feature names its own value, so Story 7 can set them apart if it finds they differ.
    - **The rule is the items' formula** (item-attachment §8): a parent at depth `D` is legal only if `D + 1 + H` is at most the cap, with top-level projects at depth 1, and `H` the height of the moving project's subtree. It holds for every write that gives a project a parent: the create, the move and an edit (§3).
    - *Deduction m,* from Nathan's ruling that shared rules get a page of their own (A5b's call 1): the cap is now a rule both features apply, so it's stated once, on hierarchy-placement, as a new §6, "The depth cap". hierarchy-placement already holds the depth range both surfaces share.
      - **What moves from item-attachment §8:** the formula and what `H` counts; that the formula is the whole rule, with no exception for a subtree already over the cap; that the cap gates writes and leaves existing data valid; that a feature's UI and API enforce one value; and that it's a display constraint, with the sidebar arithmetic that grounds 6.
      - **What item-attachment §8 keeps:** items' value, that a detached descendant counts toward `H`, and its Open questions on the real value and beyond the cap.
      - **hierarchy-placement's opening paragraph** widens: §6 holds for every write that gives an entry a parent, whatever the surface.
    - *Deduction n,* from hierarchy-placement §1 and §2 (the range doesn't depend on the cap, and no offset produces no state) and project-tree §1 (the line always matches the save): in the sidebar, a tab state over the cap is still offered, its line is marked invalid, and a release in it writes nothing. That's how the board treats an over-cap state (board-drag-interaction §7.2). How the invalid line looks is the placeholder's.
    - **On the page:**
      - **§1:** a `**Planned:**` bullet for deduction n, replacing "Every tab state in the range is valid". The bullet it replaces gets a "*Replaced by … once built*" note, pointing to it and to §3.
      - **§3,** retitled "What makes a project a legal parent": a `**Planned:**` paragraph saying that a write that would put the project's subtree past the cap is refused with a 400, and nothing changes. The cap is provisionally 6 (hierarchy-placement §6). It replaces §1's "Projects have no depth cap".
      - **Open questions:** the project cap's real value, which replaces the proposed "how a deep tree indents". The project page's dropdown entry adds that whether it leaves out a parent over the cap is the placeholder's too.
      - **Other pages:** board-drag-interaction §3.2's and §7.2's links, and item-sheet's, go to hierarchy-placement §6 where they cite the formula.
    - **The anchor map gains** item-attachment §8's shared parts, to hierarchy-placement §6.
    - **For the Test Planner:** once the cap is built, TREE-1.7 ("projects have no depth cap") reads the other way. The ATT-4 cases that cite item-attachment §8 re-point by the map.
    - **For the Architect:**
      - batch 3 and the Code map gain the cap, on the project writes and the sidebar's tab states;
      - root `CLAUDE.md`'s data model, and the MVP roadmap's Projects line, say projects have unlimited depth;
      - Epic 3.5's Story 7 now sets the project cap too. The PO can add that to its entry if Nathan clears it.
  - **Calls 2 to 7, as recommended.** With calls 8 to 11 ruled, every call in batch 1 is ruled. The structure, with deduction m's move, is still open for batch 1's stop.
- **2026-10-05, Nathan's ruling on deduction m's move.** The move goes ahead in A5d, for the rules that hold whatever the number, such as "a reparent is refused when any carried descendant would end past the cap". The project cap and the item cap are configured independently, though they'll very likely share a value. That settles batch 1's stop.
  - **hierarchy-placement §6 states:** the formula, with each feature's own cap; what `H` counts; that the formula is the whole rule, with no exception for a subtree already over the cap; that the cap gates writes and leaves existing data valid; that it's a display constraint; and that a feature's UI and API enforce the same value.
  - **It also states, from this ruling:** each feature's cap is set on its own, so changing one never changes the other.
  - **Each feature's page keeps its value and its grounding,** since both depend on the number. This changes the previous entry's "what moves": the sidebar arithmetic stays on item-attachment §8, with items' 6. project-tree §3 gives the project cap's provisional 6 the same grounding, the depth the sidebar can indent legibly, and links item-attachment §8 for the arithmetic.
  - **For the Coder (batch 3):** the project cap is a separate value from `ITEM_DEPTH_CAP`, though it starts at the same number.
- **2026-10-05, with Nathan's clearance:** the PO added the project cap to Epic 3.5's Story 7 entry in `epic-3-5-roadmap.md`, which now sets both caps' real values.
- **2026-10-05, Open question 3 answered (Architect).** Calls 9 and 11, and §3's edit, are today's code, and go on the page unmarked. Call 10 is a fix, with G9. So batch 3 gains two fixes besides D3's gaps: call 10's, and the project depth cap from Nathan's ruling on call 1. The Type line, batch 2's Architect items, batch 3, Close and the Code map say so.
- **2026-10-05, after Open question 3's answers (PO): what batch 2 marks.** No living doc has changed yet.
  - **Unmarked, as today's code:**
    - **project-tree §3:** an edit or a move naming a parent that's the project itself, is in its subtree, or isn't a project is refused with a 400, and nothing changes. Only the create's case is `**Planned:**` (G2), and the depth cap (call 1).
    - **A neighbor with no position (call 9):** positioning §2's rule holds for projects unmarked. project-tree §6 cites it with the other neighbor refusals, and G3's line stays about the project itself.
    - **A failed write (call 11), in project-tree §4:** the sidebar shows the project where it was before the attempt. A failed create shows no new project, and a failed move or edit leaves the project where it was.
  - **`**Planned:**`, call 10, in project-tree §8:** a name of only spaces counts as no name, so a create and an edit both refuse it with a 400, and nothing changes. The create's rule stays unmarked for a missing name. The edit's line joins G9's (an empty name, or `null`).
  - **Placeholder, under project-tree's Open questions** (how the sidebar tells the user a write failed): the create dialog's error, the parent dropdown going back to the stored parent, a failed edit reaching the user only as a console error, and the create dialog trimming a name and refusing a blank one.
  - *Deduction o, the PO's call the Architect left:* §2's collapsed project stays open if the write fails. §2 opens it on the drop, not on the save, and Nathan's call 11 ruling puts the moved project back, not the parent's open state. §2 gains a clause saying so, pointing to §4, so the case doesn't have to ask.
- **2026-10-05, batch 2 (the PO): the pages.** The Handoff lists every section added, changed, moved or removed. With Nathan's clearance, the PO re-pointed `positioning-on-create-and-edit.md`'s references to item-positioning §2 to wiki positioning §2, §3 and §6. Choices made while writing, beyond batch 1's entries:
  - **Deduction n is stated once, on hierarchy-placement §6,** since it follows from that page's §1 and §2 for every surface. board-drag-interaction §7.2 keeps the board's own handling, the ghost and its exception to §3.2, and links §6.
  - **hierarchy-placement's "entry"** widens to an item or a project, since §6 holds for every write, not only a drag.
  - **item-positioning §5 gains attached children as a scope of their own,** from §3 and positioning §6. TC-5.7 and TC-5.8 test it today.
  - **positioning §2 states "an entry is never its own neighbor",** with an example, which TC-X.6 and TC-7.10 read from item-positioning §2 and §7.1 (deduction a).
  - **The move's refusal of a position** says to name "a neighbor and a side", so it reads for items and projects alike. An item's message says "an anchor and side", which is the same thing.
  - **project-tree §8's create refuses "no name, or an empty one",** from G9's description, "A create with no name gets a 400".
- **2026-10-06, batch 2 (the Test Planner): the cases.** `npm run check:docs` reports 0 hits on 281 files. The catalog holds 342 cases: 197 `Automated`, 122 `Open`, 17 `Planned`, 4 `Manual` and 2 `Pending PO`. No new question for the PO.
  - **Rule lines, by the two maps.** 49 lines changed:
    - **item-positioning:** TC-2.1 to TC-2.12, TC-2.19 to TC-2.33, TC-3.5, TC-5.1 to TC-5.15, TC-5a, TC-7.3, TC-7.10 and TC-X.6. A case that tests a shared rule cites positioning's section. Where it also tests the item's part (a scope, which writes, `reindexed`, the board's exceptions), it cites item-positioning's section as well.
    - **ATT-4.4 to ATT-4.11** cite hierarchy-placement §6 beside item-attachment §8 or §7.
    - **The rest stay.** They cite only an item-only part, such as `positionScope`, the workphase-only move, the pending marker, §5's active scope and done items, §5.1's routes, §7.1's board case and empty target context, and §2.1's table. Statuses are untouched. The Reconciler checks them at Close.
  - **project-tree's new suites,** one per section: TREE-3 to TREE-10. Projects get the shared rules that differ for them: the sibling scope, naming a neighbor, no neighbor meaning the true end, an edit's fresh position, disclosure, applying it, and the tie-break. Resolution's arithmetic stays tested once, in TC-2 (D4). The project cap is written as `PCAP`, defined in TREE-3's terms.
  - **Each fix's `Planned` cases:**
    - G1: TREE-7.2.
    - G2: TREE-3.4.
    - G3: TREE-6.5.
    - G4: TREE-6.6.
    - G5: TREE-4.5, TREE-4.6 and TREE-4.7.
    - G6: TREE-4.4.
    - G7: TREE-10.4.
    - G9: TREE-8.3.
    - Call 10: TREE-8.4.
    - Call 1, the project cap:
      - TREE-3.5 to TREE-3.8 on the API;
      - TREE-1.11 in the sidebar, `Planned, replaces TREE-1.7`. TREE-1.7 stays `Automated` until the cap is built (Handoff), and is then deleted.
  - **Live rules newly cased (`Open`):**
    - TREE-3.1 to TREE-3.3, a parent's legality on an edit and a move;
    - TREE-4.1 to TREE-4.3, the sibling scope and order;
    - TREE-4.8, the sidebar after a failed write (call 11);
    - TREE-5.1, a create's place;
    - TREE-6.1 to TREE-6.4, a move. TREE-6.3 includes a neighbor with no position (call 9);
    - TREE-7.1, an edit that keeps the parent;
    - TREE-8.1 and TREE-8.2, a name;
    - TREE-9.1 to TREE-9.3, a delete;
    - TREE-10.1 to TREE-10.3, an override (G8), a move, and a deleted workflow (deduction i);
    - TREE-1.12, a release sends a move naming a neighbor, never a position (positioning §5);
    - TREE-2.3, the collapsed parent staying open after a failed move (deduction o).
  - **Inheritance itself (D7) stays BCU-1.5's.** Its six projects already test "its own, or its nearest ancestor's" through the boards, so it now cites project-tree §10 rather than getting a twin. TREE-10 covers the rest of §10.
    - BCU-1.6 cites project-tree §10 too.
    - TC-7.20 cites project-tree §6, since it asserts that a move changing the workflow is accepted.
  - **TC-6.7 and TC-6.8 move in batch 3a, not batch 2,** to BCU-3.2 and BCU-3.3, beside the Coder's re-title. `check:docs` flags a test title carrying an ID the catalog doesn't have. Moving them now would fail batch 2's 0-hit gate until 3a, so they move as TC-5a.6 did in A5b. BCU-3.4's links follow them, and item-positioning's INDEX line for TC-6 drops column ranges. The test-plans README needs no change: its Layout already covers a page of shared rules.
  - **For the Coder (batch 3a):**
    - **Tests to re-title.** Many `Open` cases pin today's code: TREE-3.1 to TREE-3.3, TREE-4.1 to TREE-4.3, TREE-5.1, TREE-6.1 to TREE-6.4, TREE-7.1, TREE-8.1, TREE-8.2, TREE-9.1 to TREE-9.3, and TREE-10.1 to TREE-10.3. `projects.test.ts` and `projects.spec.ts` likely hold several. A case a test asserts only in part stays `Open`, and the Reconciler names the gap.
    - **Setups the API can't make.** These need a direct database edit or a test route:
      - TREE-4.2, TREE-4.4 and TREE-6.3: a project with no position;
      - TREE-3.7 and TREE-3.8: a tree deeper than `PCAP`.
    - **UI cases:**
      - TREE-1.11, TREE-1.12, TREE-2.3, TREE-4.3, TREE-4.4, TREE-4.7, TREE-4.8, and TREE-3.7's sidebar part.
      - TREE-1.12 is a request rule whose only surface is a drag, so a client test of it counts without approval (test-plans README).
      - TREE-4.3 and TREE-4.4 show in the sidebar's render. A client test there, such as `projectTreeUtils.test.ts`, needs Nathan's approval, or a UI test.
    - **TREE-4.5's pairs** include the moved project's own, as TC-5.11 asserts for an item, since its write's scope was reindexed.
  - **Scope (the cases in A5d):**
    - project-tree: TREE-1.7 and TREE-1.11 to TREE-1.12, TREE-2.3, TREE-3.1 to TREE-3.8, TREE-4.1 to TREE-4.8, TREE-5.1, TREE-6.1 to TREE-6.6, TREE-7.1 to TREE-7.2, TREE-8.1 to TREE-8.4, TREE-9.1 to TREE-9.3, and TREE-10.1 to TREE-10.4;
    - boards-columns-unsorted: every case, for the closing Reconciler run (D6), with BCU-3.2 and BCU-3.3 once moved;
    - item-positioning and item-attachment: the Rule lines above. The closing Reconciler run confirms none lost coverage.
- **2026-10-06, batch 2 (the Architect).** `npm run check:docs` reports 0 hits on 281 files.
  - **Root `CLAUDE.md`:**
    - "Positioning" sends the shared rules to wiki positioning, and an item's own scopes and the board's placements to item-positioning;
    - "Workflow inheritance" says a project's own workflow overrides what it would inherit, names the server's site beside `App.tsx`, and cites wiki project-tree §10;
    - the attach bullet cites wiki hierarchy-placement §6 for the depth cap's formula.
    - Its data model still says projects have unlimited depth, and its reindex convention still covers item writes alone. Both stay true until batch 3b builds the cap and G5, so they change at Close.
  - **The guides need no change.** None cites a rule that moved. `code-comments.md`'s example, `wiki item-attachment §8`, still names a section that exists.
  - **The deferrals, routed by what each is:**
    - **`epic-8-decisions.md`** gains "the project page and the sidebar, from A5d". It lists project-tree's placeholder Open questions: the project page, the sidebar's other controls, how the user learns a write failed (call 11), how an over-cap tab state looks, what a project that uses no workflow shows, and overriding an inherited workflow from the page (G8).
    - **The project cap's real value** isn't there, since Epic 3.5's Story 7 sets it (the PO's earlier entry).
    - **Re-filing** isn't placeholder UI. It joins `epic-7-decisions.md`'s Q2, which already asks how an item's project change re-files its subtree. It gains that a project that comes to use a different workflow, by a move or an override, has the same problem.
    - **D6, carried in from A5c:** the A5c section's "Three more may join this list" now says calls 1, 3 and 5 stayed on the page, since A5c's batch 3 tests show the code does all three.
  - **`api-contract-zod-openapi.md`:** D5's two lines go under Story 1, not Story 2 as D5 said, since Story 1 puts both moves on schemas as its pilot. D5 is corrected.
  - **The MVP roadmap's Projects line** reads "Hierarchical folders, nested up to a depth cap (provisionally 6, as for items; Epic 3.5's Story 7 sets both)".
    - *For Nathan:* its Work Items line still says "Unlimited depth", though items have had a cap since Epic 3. The ruling covered projects only, so it's left as it is.
  - *For Nathan, outside this story:* `epic-7-decisions.md`'s Q1 still records the 2026-09-10 decision to accept every cross-workflow reparent. A5a's R3 now refuses one that would leave a Free item in the moved subtree (item-attachment §9). Epic 7's planning should start from R3. The Architect can add a line there if Nathan wants.
- **2026-10-06, Nathan's answers to the Architect's batch 2 notes.**
  - **The Work Items line:** unlimited depth is the ultimate goal, but it comes out of the MVP roadmap, since the UI has no way to show very deep items yet. The line now reads "Nested up to a depth cap (provisionally 6; Epic 3.5's Story 7 sets it)".
  - **`epic-7-decisions.md`'s Q1 stays as it is.** Epic 7's Sheet will allow movements the board doesn't, and whether that changes the current endpoints or adds new ones is decided then.
