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
| `server/src/routes/projects.ts` | 3a, 3b done | **3a:** index pointers on the create (§5, §8), the edit (§7), the move (§6, and positioning §2 on the neighbor check), the delete (§9) and the sibling scope and the list (§4); the list's "NULLS LAST" comment, which was wrong, now says what SQLite does. **3b:** `parentError`, the legality rules (§3) and the project cap, for the create (G2), the edit and the move. `resolveProjectPosition`, one resolution for the create, the move and an edit that changes the parent (G1). `projectResponse`, the renumbered pairs on all three, the written project's own included (G5). `isValidName`, for the create and the edit (G9, call 10). The move refuses its own id as a neighbor (G3) and a position (G4). `GET /depth-cap` |
| `server/src/routes/workflows.ts` | 3b done | G7: the create refuses a project that already has a workflow, with a 409 naming it, and its pointer (§10) |
| `server/src/lib/workflowItems.ts` | 3a done | The pointer on inheritance (§10), on `effectiveWorkflowIdForProject` |
| `server/src/lib/itemTree.ts` | 3a, 3b done | **3a:** comments re-pointed (the formula's two sites, and the item cap's one-value rule, to hierarchy-placement §6). **3b:** `PROJECT_DEPTH_CAP`, a value of its own beside `ITEM_DEPTH_CAP`. The depth, the subtree height and the cap check are table-generic, and one BFS (`walkSelfRefLevels`) serves items and projects, so `assertWithinProjectDepthCap` is a twin of `assertWithinDepthCap` over the same formula |
| `server/src/db/schema.ts` | 3b done | `projects.parentId` declares its foreign key, as migration 0003 made it, with no `ON DELETE` action. No migration: the only drizzle snapshot is 0000's |
| `server/src/lib/positionResolver.ts`, `coarsestFit.ts` | 3a, 3b done | **3a:** header and `reindexed` pointers re-pointed to the shared page (§3, §6, §7). **3b:** the collector's comment says the project writes pass one too |
| Other comments citing item-positioning §2, §5, §5.1 or §5a, or item-attachment §8 | 3a done | Re-pointed by the anchor map: `api/items.ts`, `itemListOps.ts`, `itemWriteReconciliation.ts`, `dragClassification.ts`, `lib/hierarchy.ts`, `itemHierarchy.ts`, `routes/items.ts`, `routes/boards.ts`, `routes/testHelpers.ts`, and the two test helpers that name the refusal of a final position. The ones that cite an item-only part stay (the list is in the Amendments) |
| `client/src/App.tsx` | 3a, 3b done | **3a:** a pointer on `effectiveWorkflow` (§10), and one on `handleReorderProject`'s catch (§4). **3b:** reads the project cap, and the create, move and edit handlers fold their responses through `applyWriteResponse` (G5) |
| `client/src/api/projects.ts`, `shared.ts`, `items.ts` | 3b done | `ProjectWriteResponse` and `fetchProjectDepthCap`; `ReindexedPosition` moves to `shared.ts`, which `items.ts` re-exports. `types.ts` needs no change: the pairs ride on the response type, not on `Project` |
| `client/src/lib/positionedWrite.ts` (new) | 3b done | `applyWriteResponse`: the pairs first, then the written row, for items and projects. `itemWriteReconciliation.ts::applyItemWriteResponse` delegates to it |
| `client/src/components/sidebar/projectTreeUtils.ts` | 3b done | G6: a missing position counts as 0, with its pointer (positioning §1) |
| `client/src/components/sidebar/useProjectDragReorder.ts`, `SortableProjectRow.tsx`, `ProjectSidebar.tsx`, `dragChrome.tsx` | 3a, 3b done | **3a:** the release's "never a computed position" comment cites positioning §5. **3b:** call 1, deduction n: the hook takes the cap, marks a tab state past it (`dropInvalid`), and a release in it writes nothing; the row draws that line red with `data-drop-invalid` |
| `server/src/routes/testHelpers.ts` | 3a, 3b done | `PATCH /api/test/projects/:id/position`, to pin a project's position or clear it, `/created-at`, to pin its creation time, and `/parent`, to build a tree past the cap. All mounted only under `ENABLE_TEST_ROUTES`. No project write gives a project a position of its choosing, or none, a creation time, or a tree that deep |
| `server/tests/routes/projects.test.ts`, `workflows.test.ts`, `server/tests/fixtures.ts` | 3a, 3b done | 19 TREE tests in 3a and 12 in 3b (the Amendments' tables), and the depth-cap route's. `fixtures.ts` gains `setProjectPosition`, and `itemIdsOn` and `templatedWorkflow` move there from `boards.test.ts`. Two older tests that made two workflows for one project (`boards.test.ts`, `workflows.test.ts`) use two projects now |
| `tests/ui/project-tree-drag.spec.ts`, `project-tree-sidebar.spec.ts` (new), `tests/helpers/projectTreeDrag.ts` (new), `tests/helpers/seed.ts` | 3a, 3b done | **3a:** TREE-1.12 and TREE-2.3 in the drag spec, TREE-4.3 and TREE-4.8 in the sidebar spec. **3b:** TREE-1.11 in the drag spec, replacing TREE-1.7's test; TREE-3.7, 4.4 and 4.7 in the sidebar spec. `seed.ts` gains `pinProjectPosition`, `pinProjectCreatedAt`, `pinProjectParent` and `fetchProjectDepthCap` |
| Client tests | 3b done | `positionedWrite.test.ts` (new), and the hook's cap tests and `projectTreeUtils.test.ts`'s two sort tests, which change for G6. None carries a case ID: surface tests cover TREE-1.11, 3.7, 4.4 and 4.7 whole, so none is proposed for approval |
| `server/tests/routes/columns.test.ts` | 3a done | D6: BCU-3.2 and BCU-3.3 written whole on the case's setup (`W1` to `W3`, `D1`, `D2`), replacing TC-6.7's two tests and TC-6.8's one, which each asserted part |
| `CLAUDE.md` | 2, close | Done. Batch 2: "Positioning" cites the shared page, "Workflow inheritance" project-tree §10 and the server's site, and the attach bullet the cap's formula. After 3b: reindex disclosure covers project writes, the data model's projects are depth-capped, and the API table lists the depth cap |
| `docs/planning/mvp-roadmap.md` | 2 | Done. The Projects and Work Items lines lose unlimited depth (call 1, and Nathan's answer in batch 2) |
| `docs/planning/epic-8-decisions.md`, `epic-7-decisions.md`, `tech-debt-stories/api-contract-zod-openapi.md` | 2, close | Done. Epic 8: the placeholder tier. Epic 7: re-filing a project's items. The API contract epic: D5's field names under Story 1, and after 3b the new depth-cap route under Story 2 |

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
  - **Built, and the markers are off** (PO, at Close, 2026-10-06), from the Coder's batch 3b handoff. Every passage above lost its marker, and §1's "Every tab state in the range is valid. Projects have no depth cap", which the cap replaced, is deleted with its note. No section number changed. Reworded as the markers came off, so the cases follow:
    - **§3:** the cap is the fourth condition in the list of what makes a parent legal, and the create is named among the writes the list holds for. "The project cap" paragraph holds the formula, the value, and the example.
    - **§4:** the sidebar and the list are said together to sort a project with no position first, as if its position were 0.
    - **§6:** the refusal of a named position joins the first bullet, and the project itself joins the second's list of neighbors the move can't use.
    - **§8:** a create's "no name" is spelled out as one left out, `null`, an empty one, or one of only spaces, and an edit allows exactly the names a create does.
    - **§10:** "at most one workflow" moves up, after the paragraph on giving a project a workflow.
- **For the Test Planner:**
  - **Rule lines** follow the two maps above. A case that tests a shared rule as items apply it may cite both pages: positioning's section, and item-positioning's for the item's part. ATT-4's cases that test the formula cite hierarchy-placement §6 as well as item-attachment §8.
  - **TREE-1.7** pins §1's "Projects have no depth cap", which stays the rule until the Planned cap is built.
  - **project-tree §8's "or an empty one"** for a create is worded from G9's description. If a test shows a create takes an empty name, it comes back to the PO.
  - **BCU-1.5:** boards-columns-unsorted §3 now links project-tree §10 for which workflow a project uses (D7).
  - **The placeholder tier** is under project-tree's Open questions, and gets no cases.
- **For the Coder (batch 3):** a comment that cites item-positioning §2, §2.1, §5, §5.1, §5a or §7.1 for a rule that moved, or item-attachment §8 for the formula, is re-pointed by the maps. Index pointers go on project-tree §3 to §10's enforcing sites.
- **For the Architect (batch 2):** project-tree's Open questions hold the placeholder tier as written, for `epic-8-decisions.md`: the project page, the sidebar's other controls, how the user learns that a write failed, how an over-cap tab state looks, the project cap's real value (Epic 3.5's Story 7), a project that uses no workflow, overriding an inherited workflow from the page, and re-filing. Root `CLAUDE.md`'s "Positioning" bullet points to wiki positioning, and "Workflow inheritance" to wiki project-tree §10.
- **From the Coder, batch 3a (2026-10-06).**
  - **For the Test Planner:**
    - **Nothing open.** The Test Planner moved TC-6.7 and TC-6.8 to BCU-3.2 and BCU-3.3, and the Coder wrote both whole (the Amendments).
  - **For the PO:** nothing comes off the page. Every `Open` case's test passed against the code on its first run, so calls 9 and 11, §3's three messages and §8's empty-name 400 are what the code does.
  - **For the Reconciler:**
    - **The Amendments' table gives each case's file.** TREE-1.12, 2.3, 4.3 and 4.8 are E2E tests, and the rest of the live cases are route tests. TREE-1.7 keeps its UI test until the project cap is built.
    - **Unmapped support:** `tests/api/projects.spec.ts` (a route test asserts each rule it pins in whole, or it pins one half of a two-write case), `project-page.spec.ts` and `project-sidebar.spec.ts` (the placeholder tier), and the cascade test in `projects.test.ts`, which pins the dependent rows a delete leaves (the items' foreign keys), a rule TREE-9 doesn't state.
    - **TREE-1.12's saved placement** is read from the stored row: `X` is `A1`'s child after `A1a`, and then before `A`, with the sidebar showing it first.
    - **No internal test is mapped.** TREE-4.3 and TREE-1.12 have surface tests, so `projectTreeUtils.test.ts` and `useProjectDragReorder.test.ts` get no new TREE mapping, and none is proposed for Nathan's approval.
    - **Not built, so not mapped:** the `Planned` cases, which are 3b's.
- **From the Coder, batch 3b (2026-10-06).**
  - **For the PO, at Close:**
    - **Every `**Planned:**` marker on project-tree comes off:** §1's over-cap bullet, with the "*Replaced by …*" note on the bullet it replaces, §3's create and cap paragraphs, §4's two, §6's two, §7's, §8's two, and §10's. The code does each as the page words it.
    - **A name that isn't a string counts as no name,** for a create and an edit. §8 says "no name, or an empty one" and "only spaces". `{"name": 5}` was stored as the text `5`, and is refused with a 400 now. It's the same check, so the page can say a name is a non-blank string, or leave it.
    - **The cap's one value (hierarchy-placement §6)** is held by one route, `GET /api/projects/depth-cap`, which the sidebar reads, as the board reads `itemDepthCap` off its own response. The page needs no change.
  - **For the Test Planner:** nothing open. The cases moved to `Open` and TREE-1.7 is deleted, since TREE-1.11's test replaced its test. TREE-3.7 has two tests, one through the API and one through the sidebar.
  - **For the Reconciler:** the Amendments' second table gives each fix's test. TREE-4.7's three tests each wait for `X` to show at its new depth before reading the order, since the order they expect is also the order before the write. No test carries a client-test ID: the surface tests cover TREE-1.11, 3.7, 4.4 and 4.7 whole, and the hook's and `projectTreeUtils.test.ts`'s unit tests are unmapped support.
  - **For the Architect, at Close:**
    - **Root `CLAUDE.md`'s "Reindex disclosure" convention** covers project writes now. Every project write folds its response through `client/src/lib/positionedWrite.ts::applyWriteResponse`, the generalization of what `completeItemWrite` calls for items, and the server's `routes/projects.ts::projectResponse` is the twin of `routes/items.ts::respondWithItem`.
    - **Its data model's "unlimited depth" for projects** is a cap of 6 now, `PROJECT_DEPTH_CAP` in `lib/itemTree.ts`.
    - **`GET /api/projects/depth-cap` is new API surface.** `api-contract-zod-openapi.md`'s Story 1 lists the project routes, so it may want the line.
    - **The story's audit** (G4, G7 and G9 change what the API accepts) is the checklist's, not the Coder's.

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
- **2026-10-06, batch 3a (the Coder): the tests and the pointers.** No source behavior changed, and no project rule comes off the page: every `Open` case's test passed against the code on its first run. Besides the comments, one test-only route was added (the Code map), and the "NULLS LAST" comment on the project list, wrong since the list sorts a missing position first, now says what SQLite does.
  - **The cases and their tests.** Where a test already asserted part of a case, it's extended or replaced, and the partial tests it replaces are deleted. A case with one whole test needs no second one, so the API spec and the placeholder UI specs stay unmapped support. Positions the API can't give (a tie, a fractional position, none) are set by a direct database edit in the route tests, and by the new test route in the E2E tests.

    | Case | Test, in | What |
    |---|---|---|
    | TREE-1.12 | `project-tree-drag.spec.ts` | New E2E: two releases, between `A1a` and `B` at `A1a`'s depth, and above the first row. Each request body is compared whole (`parentId`, `prevId`, `nextId`, no position), then the stored order |
    | TREE-2.3 | `project-tree-drag.spec.ts` | New E2E: the move is refused by a route stub, and `T` is open with `T1` and `T2`, and `X` is back after them at the top level |
    | TREE-3.1, 3.2, 3.3 | `projects.test.ts` | New, each making the edit and the move. They replace six tests (a parent that's no project, the project itself and a descendant, for `PUT` and for the move). 3.3 adds the message, that `A` is unchanged, and the move up the tree |
    | TREE-4.1 | `projects.test.ts` | New: a move after `A1` lands between `A1` and `A2`, and with `A`'s children at `1500` and `1600` they're reindexed and `A` and `B` keep `1` and `2` |
    | TREE-4.2 | `projects.test.ts` | The "ordered by position then createdAt" test, replaced by the case: a tie, a lower position, and a missing one |
    | TREE-4.3 | `project-tree-sidebar.spec.ts` | New E2E: children and top level, read in one depth-first order |
    | TREE-4.8 | `project-tree-sidebar.spec.ts` | New E2E: a route stub refuses every project write, and the sidebar is read after a drag, a create and a parent edit |
    | TREE-5.1 | `projects.test.ts` | New, replacing the test that a child is created when `parentId` is given: positions `3`, `1`, `2` and `5` |
    | TREE-6.1 | `projects.test.ts` | New, replacing the `prevId` and `nextId` tests, which asserted order only: positions `1.5`, `2.5` and `2` |
    | TREE-6.2 | `projects.test.ts` | New, replacing three tests (no body fields, a reparent with no anchor, explicit nulls). The nulls are in the second scenario |
    | TREE-6.3 | `projects.test.ts` | New, replacing the foreign-sibling and no-such-project tests: four refusals, each with `prevId` and with `nextId`, each leaving `X` unchanged |
    | TREE-6.4, 7.1, 8.2, 9.3 | `projects.test.ts` | New |
    | TREE-8.1 | `projects.test.ts` | The missing-name test, extended: an empty name too, and that the list is unchanged |
    | TREE-9.1 | `projects.test.ts` | New. The cascade test stays: it pins the dependent rows a delete leaves, which TREE-9 doesn't state |
    | TREE-9.2 | `projects.test.ts` | The test that another project's item survives, replaced by the case: `Q` is moved under `R` first, and the item is read in `R`'s Unsorted |
    | TREE-10.2 | `projects.test.ts` | New. BCU-1.6 tests one project's move; this adds the subtree, a project that owns a workflow, and a moved owner |
    | TREE-10.1, 10.3 | `workflows.test.ts` | New |
    | TREE-1.7 | `project-tree-drag.spec.ts` | Unchanged: it keeps its ID until the project cap is built |
    | BCU-3.2, 3.3 | `columns.test.ts` | New, on the case's setup, replacing TC-6.7's two tests and TC-6.8's one. Those asserted part of each: the all-terminal create but not the all-active one or the columns' coverage, and a different, smaller setup |
  - **Pointers** are on the Code map's sites. Four differ from the Handoff's list:
    - **The legality rule (§3) has one pointer,** on the edit's parent check. The move's check is the same code and carries none. If 3b folds the edit's, the move's and the create's (G2) into one helper, the pointer goes there.
    - **The inheritance rule (§10) is pointed at `workflowItems.ts::effectiveWorkflowIdForProject`** and, as a guard where it would look like duplication, at `App.tsx::effectiveWorkflow`. `getProjectsUsingWorkflow` carries none: its comment already names the client's twin.
    - **The neighbor refusal is pointed at `verifyAnchor`,** to positioning §2, not at project-tree §6, since §6 cites it.
    - **The sidebar's failed write (§4) is on `App.tsx::handleReorderProject`'s catch.** The create and edit handlers carry none: they throw, and the dialog and the dropdown handle the rest.
  - **Comments re-pointed by the maps,** each now citing the page that holds its rule: `api/items.ts` (positioning §2, §7), `itemListOps.ts` (§1, §5), `itemWriteReconciliation.ts` (§8), `positionResolver.ts` (§3, §6, §7), `coarsestFit.ts` (§3), `itemHierarchy.ts` (the cap gating reparents to hierarchy-placement §6; the anchor's resulting scope and the disclosure to positioning §2 and §7), `itemTree.ts` and `lib/hierarchy.ts` (depth counting and the formula to hierarchy-placement §6), `routes/boards.ts` (the cap the UI and API share, to hierarchy-placement §6), and `routes/items.ts`, `routes/testHelpers.ts`, `tests/helpers/seed.ts` and `server/tests/fixtures.ts` (the refusal of a final position, to positioning §2).
  - **Citations that stay,** since they name an item-only part: `item-positioning §2` on `positionScope` and the workphase-only move, `§2.1` on the table, `§6` on the active/done split, `§7.1` on the board's first and last anchors, `routes/items.ts::respondWithItem`'s `§5.1` (which item writes disclose), and `item-attachment §8` on the item cap's value and on a detached child counting toward `H`.
  - **Checks:** `npm run check` passes (364 server tests, 426 client, 75 scripts, 0 checker hits on 283 files), and so does the full E2E suite (158 passed, 8 skipped). Each new route assertion was made to fail by breaking its rule in the source, 24 breaks in all (three of them for BCU-3.2 and BCU-3.3), and each new E2E test by breaking the client (a position in the move's body, `prevId` and `nextId` swapped, the collapsed parent not opening, the sibling tie-break reversed, and a refused move, create and edit each left showing). Every break was caught by the case it targets, and each file was put back. The four new E2E tests passed four runs in a row. The source diff is comments, plus the test-only route.
- **2026-10-06, after batch 3a (the Test Planner): TC-6.7 is BCU-3.2, and TC-6.8 is BCU-3.3** (D6).
  - **The cases moved with their rule,** to boards-columns-unsorted §6, keeping their priorities, P0 and P1. Each is rewritten on BCU-3's setup with concrete ranges. BCU-3.2 asserts the 400 and that nothing changes. It names no column, since §6 names one only for an overlap and a flag change.
  - **Both are `Open` until the Reconciler's run,** as DRAG-6.14 was in A5b: a new ID's status is the Test Planner's to set, and `Automated` is the Reconciler's.
  - **BCU-3.4's links** now point to BCU-3.2 and BCU-3.3, and item-positioning's INDEX line for TC-6 drops column ranges.
  - **For the Coder:** `columns.test.ts`'s two TC-6.7 tests become BCU-3.2, and its TC-6.8 test becomes BCU-3.3. Until then, `check:docs` reports exactly those three titles (3 hits).
  - **From the Coder's notes:**
    - **TREE-6.3** now says the neighbor is refused whether it's named as the sibling `X` goes after or as the one it goes before. The test already makes each refusal both ways.
    - **TREE-1.12's last sentence** now reads "Each release saves `X` where the line showed it", naming both placements, which is what the test's stored-order check asserts.
    - **TREE-4.2** is unchanged. "With `B` created first" is the setup, and how a test arranges it, here a direct edit of `createdAt`, is the test's.
  - **The catalog:** 342 cases: 195 `Automated`, 124 `Open`, 17 `Planned`, 4 `Manual` and 2 `Pending PO`.
  - **TC-6.7 and TC-6.8 (D6), after the Test Planner moved them to BCU-3.2 and BCU-3.3:** the three tests asserted part of each case on a smaller setup, so BCU-3.2 and BCU-3.3 are written whole, and the three tests are deleted. No test or comment cites TC-6.7 or TC-6.8 any more. TREE-1.12's test also reads the first release's saved placement now, as the reworded case says.
- **2026-10-06, batch 3b (the Coder): the fixes.** Every fix ruled "fix now" is built, each with a test carrying its case ID, and the code does each as the page words it, except for the three edges below.
  - **The cases and their tests.**

    | Case | Test, in | What |
    |---|---|---|
    | TREE-3.4 | `projects.test.ts` | New: a create naming a parent that's no project is a 400 with the message `PUT` and the move give, and the list is unchanged |
    | TREE-3.5 | `projects.test.ts` | New: the move, the edit and the create, each from a fresh tree at the cap's boundary |
    | TREE-3.6 | `projects.test.ts` | New: `M` with a height of 2 fits under a project at depth `PCAP − 3` and not under one at `PCAP − 2` |
    | TREE-3.7 | `projects.test.ts`, `project-tree-sidebar.spec.ts` | New, two tests. A tree two levels past the cap is built by writing rows: the API lists every project, and a rename and a move among siblings are accepted. The sidebar shows every project, at its depth, with no line and no flag |
    | TREE-3.8 | `projects.test.ts` | New: `M` at depth 3 with `PCAP` descendants is refused a move to the top level |
    | TREE-1.11 | `project-tree-drag.spec.ts` | New, replacing TREE-1.7's test, which is deleted: the state one tab right of `T` is offered, its line marked invalid, and a release writes nothing; aligned with `T` it saves |
    | TREE-4.4 | `project-tree-sidebar.spec.ts` | New: `N`, created last and given no position, reads ahead of `A` at `0.5` |
    | TREE-4.5, 4.6 | `projects.test.ts` | New: the pairs for a move, a create and an edit, the written project's own last, and none when nothing was renumbered |
    | TREE-4.7 | `project-tree-sidebar.spec.ts` | New, three tests (a drag, which is read again after a reload, a create, an edit) |
    | TREE-6.5, 6.6 | `projects.test.ts` | New: the project as `prevId` and as `nextId`; a position alone, and with a neighbor |
    | TREE-7.2 | `projects.test.ts` | New: the edit lands at `4`, then back at the top level at `2` |
    | TREE-8.3, 8.4 | `projects.test.ts` | New: `""` and `null`; a name of only spaces for a create and an edit |
    | TREE-10.4 | `workflows.test.ts` | New: a second workflow is a 409 naming the first, and a child that inherits may have one |
  - **How the fixes are built.**
    - **One legality check** (`routes/projects.ts::parentError`) serves the create, the edit and the move: the parent exists, isn't the project and isn't in its subtree, and the cap. The cap gates a write that changes the parent, including to the top level (TREE-3.8), so a rename or a move among siblings is never checked (TREE-3.7).
    - **One position resolution** (`resolveProjectPosition`) serves the create, the move and an edit that changes the parent, so G1 can't drift from the move. An edit that keeps the parent keeps the position.
    - **The cap is generic.** `lib/itemTree.ts` has one depth walk, one height walk and one cap check over both tables, with `ITEM_DEPTH_CAP` and `PROJECT_DEPTH_CAP` as separate values. The item BFS that walked only `items` is now the generic one, so deleting an item and the item cap run through it: `items.hierarchy.test.ts` and `items.test.ts` pass unchanged.
    - **The client folds every project write through `applyWriteResponse`,** which the item reconciliation now delegates to, so its tests cover both.
    - **`projects.parentId` declares its foreign key** in `schema.ts`. No migration: the database has had it since 0003, and the only drizzle snapshot is 0000's.
  - **Three edges the page doesn't state,** each the smaller choice:
    - **A name that isn't a string is refused** (the Handoff).
    - **The sidebar reads the cap from a new route,** `GET /api/projects/depth-cap`. The board gets `itemDepthCap` on its own response, but no project response is a natural place for the cap. The other way is a constant on each side, which the wiki's "one value" rules out.
    - **A move naming both `prevId` and `nextId` still uses `prevId` alone** (D5), so the self-neighbor refusal covers the one it uses.
  - **Older tests changed** because a project can have one workflow now: `boards.test.ts`'s board-list test and `workflows.test.ts`'s clone test each made a second workflow for one project, and use a second project. A sort test pair in `projectTreeUtils.test.ts` changed for G6.
  - **Checks:** `npm run check` passes (378 server tests, 432 client, 75 scripts, 0 checker hits on 285 files), and so does the full E2E suite (163 passed, 8 skipped). Each new route assertion was made to fail by breaking its rule in the source, 17 breaks in all (the create's parent check, the cap's height, level count, unchanged-parent and top-level cases and its boundary, the edit's position, the self-neighbor and position refusals, the pairs and the written project's own pair, the name checks and the second workflow), and each new E2E test by breaking the client in 7 ways (the pairs never applied, a missing position counted as its creation time, the cap check one level off, a release past the cap still writing, the line never marked invalid, the sidebar never given the cap, and rows past the cap hidden). Every break was caught by the case it targets, and each file was put back. One of those showed one of TREE-4.7's first-draft tests passing vacuously, since the order it expected was also the order before the write, so its tests wait for `X` to show at its new depth first. The three TREE-4.7 tests and TREE-1.11 passed three runs in a row.
- **2026-10-06, after batch 3b (the Architect),** from the Coder's notes for the Architect. `npm run check:docs` reports 0 hits on 285 files.
  - **Root `CLAUDE.md`:**
    - **"Reindex disclosure"** covers project writes. It names the two server sites that attach the pairs (`respondWithItem` and `projectResponse`), and `lib/positionedWrite.ts::applyWriteResponse` as the one fold. The board's item writes reach it through `completeItemWrite`, and the sidebar's project writes from `App.tsx`;
    - **the data model** says projects are depth-capped, naming `PROJECT_DEPTH_CAP`, where it said unlimited depth;
    - **the API table's `/api/projects` row** lists the depth cap.
  - **`client/src/components/workflow/CLAUDE.md` needs no change.** Its reindex line is about the board's item writes, which still fold through `completeItemWrite`. It's the Coder's file in any case.
  - **`api-contract-zod-openapi.md`'s Story 2:** the endpoint count is 53, and the items-and-projects bullet gains `GET /api/projects/depth-cap`. It also notes that the item cap comes as `itemDepthCap` on the board's response instead, so whether both caps come the same way is that batch's call. Story 1 lists only the two move routes, so the line went in Story 2 rather than Story 1, as the Coder suggested.
  - **Left at Close for the Architect:** archiving this plan, once the PO, the Test Planner, the Reconciler and the audit are done and Nathan signs off.
- **2026-10-06, Close, step 2 (the PO): the Coder's batch 3b handoff applied.** The Handoff's Planned list records the markers coming off, and the rewording.
  - **A name that isn't a string** (the Coder's behavior decision): project-tree §8 doesn't state it. *Deduction p,* from Nathan's ruling on what the page takes ("If it API contract details like - the Request needs these request params … then we'll leave documentation to openapi"): a field's type is the request's contract, so it belongs to the API contract epic's projects schema, not the page. The refusal the Coder built agrees with what that schema will do, so nothing changes back. For the Architect: Story 2's projects schema gives `name` a non-blank string, which also covers §8's rule.
  - **`GET /api/projects/depth-cap`** needs no page change: hierarchy-placement §6 says a feature's UI and API enforce one value, and how the sidebar reads it is contract. The Coder routed the route itself to the Architect.
- **2026-10-06, Close, step 3 (the Test Planner): the handoff applied to the test plans.** The checker reports 0 hits on 285 files. The catalog holds 341 cases: 194 `Automated`, 140 `Open`, 4 `Manual`, 2 `Pending PO` and 1 `Planned`, which is another story's.
  - **`Planned` → `Open`,** with the markers off: TREE-1.11, TREE-3.4 to TREE-3.8, TREE-4.4 to TREE-4.7, TREE-6.5, TREE-6.6, TREE-7.2, TREE-8.3, TREE-8.4 and TREE-10.4. TREE-1.11 no longer says it replaces anything.
  - **TREE-1.7 is deleted,** with the passage it derived from ("Every tab state in the range is valid. Projects have no depth cap"). Its ID stays retired, and it leaves the Scope.
  - **Two cases follow the PO's rewording:**
    - **TREE-3.5:** the cap is now §3's fourth condition, so its refusal's message says which condition it breaks, as the other three's do. The case now says the message names the project cap. The move's refusal states it, and the edit's and the create's are "refused the same way".
    - **TREE-8.1:** §8 spells out a create's "no name" as one left out, `null`, an empty one, or one of only spaces. The case adds `null`, and its title says so. Spaces stay TREE-8.4's.
  - **For the Coder, before the clean commit:** if a test doesn't yet assert either addition, it needs extending, or the Reconciler leaves that case `Open`:
    - TREE-3.5's cap refusal message;
    - TREE-8.1's `null` on a create. 3a's table extends TREE-8.1's test with an empty name only.
  - **Nothing else changes.** The rest of the rewording moves rules within their sections, and the cases already state them as worded: §6's own-neighbor and position refusals, §4's sort of a missing position, and §10's one workflow. A name that isn't a string has no case, since deduction p sends it to the API contract epic. No new question for the PO.
  - **Scope:** unchanged but for TREE-1.7. Every case in it is now `Open` or `Automated`, ready for the Reconciler's run on the clean commit.
  - **Two cases the Test Planner reworded, checked before the commit:** TREE-3.5's three refusals (the move, the edit and the create) now each assert the message says the write would put the subtree past the cap, and TREE-8.1's test names `null` on a create beside the missing and empty names. Each was made to fail by breaking its rule (the message, and a create that takes `null`), and was caught.
- **2026-10-06, Close, step 5: the Reconciler's run on `91cdbd1`.** Report: `docs/audits/test-reconciliation-a5d-close.md`.
  - **The result:** 70 cases went from `Open` to `Automated`. Every project-tree case in Scope is now `Automated`, and so are 31 of the 32 boards-columns-unsorted cases.
  - **What it found clean:** no lost coverage, and no test title carrying an unknown ID.
  - **Nothing for Nathan's approval.**
- **2026-10-06, after the Reconciler's run (the Test Planner).** The checker reports 0 hits on 285 files. The catalog holds 342 cases: 264 `Automated`, 71 `Open`, 4 `Manual`, 2 `Pending PO` and 1 `Planned`. Two `Open` cases are in Scope, BCU-1.5 and TREE-3.9. The other 69 are routed, as before.
  - **BCU-1.5 is reworded** (the report's gap). The case had top-level `Z` on `D`'s `WF2`, which can't be built: a top-level project uses only its own workflow (wiki project-tree §10). The case misread a clear page, so no ruling is needed. `Z` now owns `WZ`, and `WF2`'s board lists `d` and `e`, not `z`. The report says the test already asserts this version.
  - **TREE-3.5's message is worded as the rule needs it:** the refusal "says the resulting depth would exceed the cap", the condition §3 says it breaks. The run read the test's `/exceeds the cap/` as meeting the earlier wording too. This takes the doubt out.
  - **TREE-3.9 is new, `Open`, and in Scope** (the report's first candidate): the sidebar's project cap is the one the API enforces (hierarchy-placement §6). Items have DRAG-2.10 for the same rule.
  - **BCU-5.5 is unchanged.** Its top-level `D` and the test's detached child are both a nearest Free ancestor, as the rule says. The other setups the run judged equivalent need no change either.
  - **TC-6.13's question** (outside Scope, Epic 4's) now says the server today gives one flag change's items increasing `completedAt` in position order, so they don't tie. It asks whether one flag change should tie them.
  - **For the Coder, before the re-check:**
    - **TREE-3.9 needs its ID on two tests.**
      - The route test that the API reports the project cap. The report says it compares the reported value with the constant. It should check that value against what the API enforces: accepted at that depth, refused one deeper.
      - TREE-1.11's E2E test, which reads the cap from the API.
    - **Optional, from the report's Test Quality section:**
      - TREE-4.3's creation-time tie rests on two creates landing in different milliseconds. Pinning `createdAt`, as TREE-4.2's route test does, makes it certain.
      - TREE-4.5's and TREE-4.6's tests pin the order of the pairs, which positioning §7 doesn't state.
  - **For the PO, not A5d's:** no page says what happens to an item's dependent rows (comments, attachments, notifications, chat) when the item, or its project, is deleted. The report rates it low priority, since attachments and chat are schema only and labels are due to be replaced. It isn't in A5d's Scope.
  - **Then the Reconciler re-checks only BCU-1.5, TREE-3.5 and TREE-3.9** (the checklist's step 5).
- **2026-10-06, Nathan deferred an item's dependent rows to Epic 7.** He expects an item to be closed more often than hard deleted. When one is deleted, anything it would leave orphaned should probably go with it, and it's revisited when the Sheet gives the front end access to comments, attachments and the rest. Recorded as Q4 in `epic-7-decisions.md`. No case is written meanwhile.
- **2026-10-06, after the Reconciler's run (the Coder).** TREE-3.9 is on two tests, and two of the report's test-quality notes are closed.
  - **TREE-3.9:** `projects.test.ts` has a test that reads the cap off `GET /api/projects/depth-cap`, builds a chain of that depth through the API, and checks a project below it is refused, so it never reads the code's constant. TREE-1.11's UI test carries the ID too, since it builds its chain from the reported cap and checks the sidebar's marking against what a release saves. Each was made to fail by reporting a cap one deeper than the API enforces, and the route test also by reporting one shallower. The UI test passes for the shallower one, since it takes its chain from the reported value, so the route test is the one that holds that half.
  - **TREE-4.3's tie** is pinned: `PATCH /api/test/projects/:id/created-at` sets `B`'s and `TB`'s creation times ahead of `A`'s and `TA`'s.
  - **TREE-4.5's and 4.6's pairs** are compared by id, still with their exact shape and count, since §7 gives no order.
  - **Not done:** the report's note that TREE-3.5's message names "the cap" rather than "the project cap" is the Test Planner's call. If it wants the word "project", the projects' message needs a noun the items' doesn't, in `lib/itemTree.ts::withinCapError`, and the test's pattern follows.
  - **Checks:** `npm run check` passes (378 server tests, 432 client, 75 scripts, 0 checker hits on 285 files), and so does the full E2E suite (163 passed, 8 skipped).
