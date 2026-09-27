# A1 — Documentation and Comment Standards

**Type:** tech-debt story · **Written:** 2026-09-26 by the Architect · **Decisions approved:** Nathan, 2026-09-26 · **Sequenced:** after `tooling-gates.md`. Batch 1 may run alongside it, since they touch different files; batch 2 waits for it.

**Source:** the round table at `docs/planning/round-tables/documentation-purposes-and-standards`. Tags like "PO F6" or "NZ5" point to items there. This plan is transient, so it may cite them. The guides it produces are living, so they cite no round-table item, story or date.

## Goal

This story turns what the round table agreed on into three things:
- **living rules** that every role reads;
- **a checker** that enforces the rules that can be checked mechanically;
- **`CLAUDE.md` and `.claude/` files** that already follow those rules.

After A1, the later passes (wiki, test plans, code comments, audits) all sweep against one written standard.

**Out of scope, each owned by a later action item:**
- **A0:** Zod and OpenAPI.
- **A2 (PO):** the wiki README rewrite, the wiki sweep, and the PO's own role rules.
- **A3 (Test Planner):** the test-plans README, the status vocabulary, case IDs in test titles, and the Test Planner's and Reconciler's role rules.
- **A4 (Coder):** the code-comment sweep, and adding the checker to `npm run lint`.
- **A5 (Auditor):** revisiting audit guidance beyond D11, plus a dry-run audit.

## Decisions

These answer every question the work below depends on. Each names the round-table items it settles.

### D1. Five process documents, each written for one audience

*(PO F9, Architect F4, NZ4)*

| File in `.claude/guides/` | What it holds | Who reads it |
|---|---|---|
| `documentation-standards.md` (new) | Doc types, ownership, which way references point, the history rule, where implementation knowledge lives, the `**Planned:**` marker's contract, the handoff flow, the archive rule | Every persona |
| `code-comments.md` (new) | When to comment, what a comment may contain, pointer formats, the module-header norm, the checker's ignore marker | Coder, Architect, the audit passes |
| `story-plan-template.md` (new) | The story template and its tech-debt variant | Whoever writes a plan; other roles fill in their sections |
| `story-done-checklist.md` (new) | The order of steps when a story closes | Everyone, at story close |
| `epic-done-checklist.md` (revised) | The steps when an epic closes. Per-story steps point to the story checklist | Everyone, at epic close |

Conventions that belong to a single doc stay with that doc: `docs/wiki/README.md` (PO, A2) and `docs/test-plans/README.md` (Test Planner, A3). The guides point to those READMEs rather than restating them.

### D2. Doc types and owners

*(NZ5, Architect F2/F3, Coder F3, Auditor F1, Coder F8)*

The standards guide carries this table:

| Doc | Type | Owner | Other roles |
|---|---|---|---|
| `docs/wiki/**` | living | PO | Hand changes off to the PO |
| `docs/test-plans/**` | living | Test Planner | Hand changes off to the Test Planner |
| Code comments and module headers | living | Whoever changes the code, in the same change | — |
| A directory's `CLAUDE.md` | living | Whoever changes code in that directory, in the same change | — |
| Root `CLAUDE.md` | living | Architect | May fix a statement their own change made false, in the same change, and list it in the handoff |
| `.claude/` guides, personas, agents | living | Architect; Nathan approves | A role drafts changes to its own persona on request |
| Agent memory | living, shared by every persona | Architect runs the pruning passes | Any agent writes memories |
| Roadmaps, epic plans, story plans | transient | Whoever writes it (usually Nathan, the Architect or the PO) | Anyone may write or edit one; each role fills in its own template sections |
| Decisions docs | transient | Whichever role runs the deliberation | — |
| Audits | transient | The Auditor session that runs the audit | — |
| Reconciler reports, round tables | transient | Their author | — |
| `docs/archive/**` | frozen | Nobody edits these | — |

A3 will amend the test-plan row if the Reconciler gets write access to its two fields (TP F3).

### D3. Which way references point

*(PO #1, PO #2, PO F7, Coder F2, Auditor F4, NZ5)*

- **Transient → anything:** allowed. The reference is expected to go stale.
- **Living → transient:** not allowed, with one exception. A process doc may name a transient doc as *the place where open work is tracked* (for example, the roadmap). It may never cite one as an authority or an example. Each such exception carries the checker's ignore marker, so every one is visible.
- **Living → living:** allowed, but only to stable anchors:
  - a wiki section, as `wiki <page> §N`: the page's name, not its path;
  - a test-plan case, by its qualified ID (`DRAG-5.5`, `TC-4.3`);
  - code, as `file::symbol`, never a line number.
- **The wiki names no code:** no file paths, function names, constants, or DOM and test attributes. Behavior surfaces are allowed: API field names, status codes, and tuning-panel value names.
- **Code comments never name `.claude/` files or `CLAUDE.md` files.**
- **Test plan → test file:** A3 settles this. NZ11 leans toward a file-level pointer plus the case ID in the test's title.

### D4. History

*(the proposal, PO #3, Architect #6, PO F1, Architect F1, Auditor F3)*

- A living doc states what is true now.
- **No provenance:** who decided, when, or which story, audit, or decision.
- **No "used to."**
- **A reason stays, in the present tense.** A rejected alternative is written as "why not X."
- **Past versions live in git.** Commit messages are not required to carry provenance.

### D5. Where implementation knowledge lives

*(Architect F2, Coder F3, NZ5)*

| Scope | Home | What it holds |
|---|---|---|
| One file | Its module header | What the file owns, and what it deliberately doesn't. Two to four lines is the norm, not a cap: a state machine's header also names its states and what moves it between them. |
| One directory | That directory's `CLAUDE.md` | The mental model, rules that span modules, "don't reinvent this" rules, and one line per file. Never a second copy of a module header. |
| The whole repo | Root `CLAUDE.md` | Repo-wide architecture and conventions |
| Process | `.claude/guides/` | How the work is done |

There is no separate consolidated implementation doc. The walkthrough step has already been dropped from the epic checklist.

### D6. The Planned marker: a contract between roles, defined in the standards guide

*(PO F6, Auditor F2, TP F4)*

- **The token.** One fixed token, `**Planned:**`, marks a wiki passage that is decided but not yet built.
- **What it names.** It names the passage it will replace, if there is one. It never names a story.
- **How it gets built and cleared.** A story's plan lists the Planned passages the story builds, and the PO removes the markers when the story closes.
- **Who else relies on it:**
  - the Test Planner derives Planned cases from marked passages;
  - an audit doesn't flag code that lags behind a Planned passage.

How to write the marker on a page belongs in the wiki README (A2). **The PO reviews this section.**

### D7. The comment guide

*(Auditor F6 as the base, plus Coder #3, Coder F1–F3, TP F9, NZ9, and the NZ intro)*

- **The umbrella test:** would this comment still be true and useful if every plan and audit were deleted?
- **When to comment:** where breaking the code wouldn't fail a test. Comments are dense where behavior is tested by hand (drag timing and feel) and sparse where tests pin the rules (the CRUD routes).
- **Rules (a)–(g), from Auditor F6.** Rule (a) absorbs "no provenance" (NZ9) and TP F9's exception for qualified case IDs in test titles and test comments.
- **Wiki pointers have two jobs, and a pointer needs one of them to exist** (PO F7, Coder F2):
  - **guard:** at code that would otherwise look wrong or safe to delete;
  - **index:** at a rule's main enforcement site, one pointer per rule.
- **Rulings that something is "deliberately separate" or "looks wrong but isn't"** are written at the site they apply to (Auditor F7).
- **Module headers** follow D5.
- **Examples of forbidden forms** go inside fenced code blocks, which the checker skips.

### D8. The checker

*(Coder F5, Auditor F6's ✓ items, Architect F6)*

**How it runs:**
- `npm run check:docs -- [paths...]` from the repo root. With no paths, it checks the default scope.
- It lives in `scripts/check-docs/`, written in TypeScript and run through Node 24's built-in type stripping. That means `.mts` files and erasable syntax only.
- `typescript` becomes a root devDependency, for its scanner.
- The scripts join the root type-check, lint and format checks that `tooling-gates.md` sets up, so `npm run check` covers them from the start.
- Tests run with `node --test`, as `npm run test:scripts`. `npm run test:unit` runs them too.

**How it reads files:**
- **Code:** comments come from the TypeScript scanner, not line regexes, so strings and code never match.
- **Test titles:** `it` / `test` / `describe` titles are read as titles.
- **Markdown:** read as text, skipping fenced code blocks.

**Rules.** Each has an ID used in the output and in ignore markers:

| Rule ID | Flags |
|---|---|
| `transient-id` | Any of the following, matched in its ID shape (`Story 6`, `Epic 3.5`, `Phase D`), never the bare word, since Epic, Story and Task are item types in the app: story, epic and phase IDs; audit findings (`audit … #12`, `finding 3`); ledger IDs (`L1-7a`, `C-2`); plan decision IDs (`decision 4`); ISO dates |
| `bare-section` | A `§N` not written as `wiki <page> §N`. Doesn't apply inside `docs/wiki/`; see `wiki-pointer` |
| `wiki-pointer` | A section reference whose page or section doesn't exist. Everywhere this means `wiki <page> §N`, where N may be a subsection or an inserted section (`7.1`, `5a`, `11a`). Inside `docs/wiki/` two more forms are valid: a bare `§N` refers to the same page, and a relative link followed by `§N` refers to the linked page. Test plans use only `wiki <page> §N` (A3 D8), so `bare-section` applies to them |
| `symbol-ref` | `file::symbol` where the file can't be found, the symbol isn't in it, or the file part matches more than one file. The file part is the name alone when it's unique, or else the shortest unique path suffix (`api/items.ts::…`) |
| `bare-case-id` | `TC-n` with no suite part, in test titles and comments |
| `claude-ref` | A code comment that names `.claude/` or a `CLAUDE.md` file |
| `transient-link` | A living doc referencing a file under `docs/planning/`, `docs/audits/` or `docs/archive/`, by link or by path. It runs over Markdown, code comments and test titles alike. It also matches the bare file name of a file that exists in one of those folders, since comments often cite a decisions doc by name alone. Naming one of the folders, for example to say where closed docs go, isn't a reference |
| `wiki-code-name` | In `docs/wiki/**` only: a file path or a `::` name. Relative links to wiki pages or to `../../test-plans/…`, and API routes such as `PATCH /items/:id/move`, are not code names. This is A2's acceptance check. |

**Placeholders:** a name in angle brackets (`<page>`, `<file>::<symbol>`) is never a reference, so the guides can describe the formats in prose.

**Ignore marker:** `check-docs-ignore-next-line <rule-id>[, <rule-id>] -- <reason>`, inside a `//` or `<!-- -->` comment. It covers one line at a time, and the reason is required.

**Default scope:**
- **Checked:** `client/src`, `server/src`, `server/tests`, `tests`, every `CLAUDE.md`, `.claude/**/*.md`, `docs/wiki`, `docs/test-plans`.
- **Never checked:** `docs/planning`, `docs/audits`, `docs/archive`, `node_modules`.

**Output:** one line per hit (`path:line:col rule-id message`) and a count per rule. It exits 1 if there is any hit.

**Where it runs:** in A1, only on A1's own files. It joins `npm run lint` once A4 finishes; until then the areas not yet swept would fail it.

### D9. The order of steps at story close

*(TP F10 as amended by Auditor F8; PO F9; NZ4)*

`story-done-checklist.md`:
1. The Coder writes the living-docs handoff in the story plan.
2. The PO applies the handoff to the wiki: new rulings in, Planned markers off. This lands before the audit.
3. The Test Planner's pass and the story's audit run in parallel.
4. The story's remaining code work lands: the audit's Fix Now batches, plus tests for the cases in scope.
5. The Reconciler runs once, against the finished code.
6. Nathan signs off. The story plan and its audit move to `docs/archive/`.

**What must hold before sign-off:** every test-plan case the story scoped is automated or approved as manual-only, and no question is still waiting on the PO. A3 restates these in its own status vocabulary.

**`epic-done-checklist.md` changes:**
- drop the "Build status line" item, which D6 replaces;
- add the end-of-epic test-plan pass (NZ4);
- point per-story items to the story checklist;
- keep the epic-wide audit.

### D10. The story-plan template

*(Architect F4, Coder F7, TP F4, PO F6, Auditor #2)*

**Full story sections:**
- **Goal**
- **Scope:** the Planned wiki passages it builds, and the test-plan case IDs in scope.
- **Inbound deferrals:** audit findings routed to this story, each named. A finding routed here before the plan exists waits in the story's roadmap entry, and whoever writes the plan moves it into this section.
- **Approach and phases**
- **Code map:** which symbols carry which decision. It is kept current while the story is open, and it's the source for an N.1 story's "Makes dead" list.
- **Amendments:** dated, and appended while the story is open.
- **Open questions:** including cases waiting on the PO.
- **Living-docs handoff:**
  - rules decided or changed;
  - Planned passages now built;
  - passages superseded;
  - implementation passages to place (D5);
  - wiki sections added, moved or removed, which the PO fills in at close (A2 D7, D8).

**The tech-debt variant**, which this plan uses:
- **Sections:** Goal, Decisions, Work, Code map, Acceptance, Handoff.
- **Checks:** a tech-debt story passes the gate and its own acceptance checks.
- **Audit:** only when it restructures code. A0 would need one; A1 doesn't.

### D11. The audit-side edits land in A1

*(Auditor F2, F4, F9)*

A1 ratifies "closed audits aren't edited" and the comment guide, so the audit files that contradict those rules change now:

- **`audit-workflow.md` §5 becomes a close-out.** It currently tracks Status lines under findings over time. Instead, every required finding gets a disposition; then the report moves to `docs/archive/` and is never edited again.
- **Tiers:**
  - **Required:** Fix Now, Routed to a story's plan, and Covered by.
  - **Optional:** Watch List and Informational.
  - **A deferral counts only once its destination names it:** in the destination plan's "Inbound deferrals" section (D10), or in the destination's roadmap entry if that plan isn't written yet.
  - **An optional finding that keeps recurring** can be promoted to required.
- **The reconcile step classifies each correctness finding against the wiki:**
  - the code breaks a rule with no Planned marker: fix it;
  - the code differs from a Planned passage: not a finding;
  - anything else: get a PO ruling before the fix lands.
- **The report format is described in the guide itself,** since the Epic 1 example it pointed to is now archived.
- **Stale instructions:** spawn the four dedicated `auditor-*` agents instead of general-purpose ones, and fix the `personas/auditor-*` paths.
- **`auditor-consistency-drift`:**
  - points to the comment guide;
  - checks only comments, module headers and `CLAUDE.md` files;
  - flags claims that are wrong, and leaves citation hygiene to the checker.

The Auditor drafts these edits and the Architect applies them. A5 revisits them after a dry run.

### D12. What changes in each persona: pointers and conflicts only

- **Pointers.** Every persona and agent definition points to the standards guide. The code-facing ones (Coder, Architect, the four audit agents) also point to the comment guide.
- **What A1 edits.** It removes text the guides now hold, and fixes statements that contradict them.
- **What waits.** Role-specific rules wait for their own action item: the PO's for A2, the Test Planner's and the Reconciler's for A3, and audit rules beyond D11 for A5.

**The Coder persona gets Coder F6's full list now,** since no later item covers it:
- The stale `positions.ts` paths and the client-side midpoint math become anchor + side, resolved by the server.
- "Follow the patterns already in the codebase" becomes "follow the guides; where existing code disagrees with a guide, the guide wins."
- Root `CLAUDE.md`'s guardrails are pointed to, not restated.
- Writing the story plan's handoff becomes a Coder duty.
- "Don't edit test plans" widens to "don't edit living docs you don't own."

### D13. Memory: one pruning pass, run by the Architect

*(Coder F8, NZ2)*

Memory is shared by every persona, so one pass covers it:
- an entry that restates a ratified rule becomes a pointer to the guide that holds it;
- an entry that calls the decisions docs "canonical", or sends readers into `docs/planning/`, `docs/audits/` or `docs/archive/` for a rule, is corrected.

This pass runs last, once the guides exist.

## Work, in batches

Each batch ends with the checks listed for it, then stops for Nathan's review and commit.

**Order:** batch 1, with batch 2 alongside it; then batch 3; then batch 4; then batch 5. Batch 3 comes before batch 4 because the personas will point at `CLAUDE.md` content.

### Batch 1: the guides (Architect)

**Work:** write the four new guides and revise `epic-done-checklist.md`, per D1–D7, D9 and D10.

**Reviews:**
- the PO reviews D6's marker and the rules for handoffs and references;
- the Test Planner reviews the close order and the test-plan rows;
- the Auditor and the Coder review the comment guide;
- Nathan approves.

### Batch 2: the checker (Coder)

**Work:** build the checker per D8.

**When:** it can run alongside batch 1's review, because this plan pins the spec. The rules' tests use their own fixtures, not the guides' text.

**Check:** its tests pass, and it reports zero hits on batch 1's guides.

### Batch 3: the `CLAUDE.md` files

**Root `CLAUDE.md` (Architect):**
- **Add:**
  - pointers to the new guides;
  - a line saying that `docs/archive/` holds closed transient docs and should be skipped unless someone asks for it (Coder F7).
- **Fix what's already known:**
  - the "Epic 3.5 Story 6 §7" citation;
  - the "See Epic 7 in `docs/planning/mvp-roadmap.md`" forward reference, restated as a present-tense constraint;
  - the `[[project_epic6_labels_rework]]` memory link, and the forward reference it carries;
  - "canonical decisions" in the `docs/planning/` line;
  - the pointer to a `client/CLAUDE.md` that doesn't exist;
  - the `docs/` layout lines, which should say `audits/` holds open audits and should add `archive/`.

**`client/src/components/workflow/CLAUDE.md` (Coder):**
- keep "The mental model";
- cut "Where each concern lives" down to one line per file;
- move each piece of per-function rationale into the module it describes, rewritten to the comment guide. For example, the `layoutRect` paragraph moves to `dragRegions.ts`;
- remove the provenance from the 22 lines that cite it;
- write each of the 11 lines' bare `§N` as `wiki <page> §N`, resolving each one to its page.

**Check:** `check:docs` reports zero hits on both files and on the module headers that received moved text. The client gate passes: typecheck, eslint, Prettier on the touched files, and Vitest.

### Batch 4: personas, agents and guides (Architect; the Auditor drafts D11)

**Work:**
- apply D11 and D12;
- strip the provenance lines from `testing-strategy.md`, plus any other hits the checker finds in `.claude/`.

**Check:** `check:docs -- .claude` reports zero hits, with every remaining exception carrying an ignore marker and a reason.

### Batch 5: memory (Architect)

**Work:** D13.

## Code map

| File | Batch | Change | Who |
|---|---|---|---|
| `.claude/guides/documentation-standards.md`, `code-comments.md`, `story-plan-template.md`, `story-done-checklist.md` | 1 | new | Architect |
| `.claude/guides/epic-done-checklist.md` | 1 | revised | Architect |
| `scripts/check-docs/**`, root `package.json` scripts. The root type-check, ESLint `files` and `format:check` globs from `tooling-gates.md` each extend to `scripts/`. Likely a `scripts/tsconfig.json` (`module: nodenext`, `erasableSyntaxOnly`) called from the root type-check, since the root tsconfig is CommonJS. `typescript` is already a root dev dependency | 2 | new | Coder |
| `CLAUDE.md` | 3 | swept | Architect |
| `client/src/components/workflow/CLAUDE.md`, plus the module headers that receive its moved rationale | 3 | swept | Coder |
| `.claude/guides/audit-workflow.md`, `.claude/personas/auditor.md`, `.claude/agents/auditor-*.md` | 4 | D11 | Auditor drafts, Architect applies |
| `.claude/personas/{architect,coder,product-owner,test-planner}.md`, `.claude/agents/test-reconciler.md`, `.claude/guides/testing-strategy.md` | 4 | D12 | Architect |
| The memory directory (outside the repo) | 5 | D13 | Architect |

## Acceptance

- **The guides:** all four new guides exist, the batch 1 reviewers have signed off on their sections, and Nathan has approved.
- **The checker:**
  - `npm run check:docs` exists, and its tests cover each rule with a hit, a clean case and an ignored case;
  - `npm run test:unit` and a typecheck both include it;
  - `npm run check:docs -- CLAUDE.md client/src/components/workflow/CLAUDE.md .claude` reports zero hits, and every remaining exception carries an ignore marker with a reason.
- **The pointers:**
  - every persona and agent definition names `documentation-standards.md`;
  - the Coder, the Architect and the four audit agents also name `code-comments.md`.
- **The client gate:** it passes for batch 3's module-header edits. No runtime code changes, so E2E is unaffected.
- **Memory:** no entry restates a rule a guide holds, or sends readers into `docs/planning/`, `docs/audits/` or `docs/archive/` for a rule.
- **No four-pass audit** (D10).

## Handoff

What the later action items inherit from A1:

- **A2 (PO):**
  - rewrite `docs/wiki/README.md` against the standards guide: how to write the Planned marker, no page-level build status, no code names;
  - the wiki sweep, which is done when `wiki-code-name` reports zero hits;
  - the PO persona's role rules (PO #9, PO F2).
- **A3 (Test Planner):**
  - rewrite `docs/test-plans/README.md`: TP F4's statuses, the case-ID rules, and NZ11's file-level pointers;
  - the Test Planner persona and the Reconciler's definition (TP F1–F3);
  - the flow for putting case IDs in test titles (Coder F4);
  - bring the standards guide's test-plan row and reference rule into line, and restate the story checklist's sign-off conditions in the new vocabulary;
  - TP F11's coverage gap.
- **A4 (Coder):**
  - the comment sweep, in segments (Architect F6). Board drag goes first, and the Story 6 audit's #24 and #30 rulings are written at their sites before that audit is archived;
  - then `check:docs` joins `npm run lint`.
- **A5 (Auditor):** revisit the audit guidance, then a dry-run audit.
- **The round table** moves to the archive once A0–A5 are all written up (Nathan).

## Amendments

Changes made after Nathan approved the decisions. They're already folded into the sections above.

**2026-09-26:**
- **Sequencing:** `tooling-gates.md` runs first. Batch 1 may run alongside it; batch 2 waits for it. The checker's scripts join the root type-check and lint that it sets up (D8, Code map).
- **Plan ownership (D1, D2):** roadmaps, epic plans and story plans belong to whoever writes them, usually Nathan, the Architect or the PO. Anyone may write or edit one. This came from the Test Planner, with Nathan's direction.
- **Checker rules (D8), from A2 D9:**
  - inside `docs/wiki/`, a bare `§N` (same page) and a relative link followed by `§N` (the linked page) are valid, and `wiki-pointer` checks that the section exists;
  - `wiki-code-name` ignores relative links to wiki pages and test plans, and API routes.
- **Handoff line (D10), from A2 D9:** "wiki sections added, moved or removed", which the PO fills in at close.
- **Deferrals (D10, D11), from A5 D6:** when a deferral's destination plan isn't written yet, the destination's roadmap entry names it. Whoever writes the plan later moves it into Inbound deferrals.
- **`transient-link` (D8), clarified while writing batch 1:** it flags references to files in the transient folders, not the folder names. The standards guide has to name the folders in order to describe them.
- **The PO's batch 1 review, all seven points taken, in the guides:**
  - **What's in force:** a Planned passage's replaced rule stays in force until the marker comes off.
  - **Clearing markers:** at close, only passages the handoff lists as built lose their marker.
  - **Handoffs:** a handoff is a request, and the owner decides. D10's "rules decided or changed" becomes "behavior decisions made while building, for the PO to rule on".
  - **Rulings during a story:** they go into the wiki straight away, recorded in Amendments.
  - **Page names:** part of the anchor contract; a rename or split carries an old → new map.
  - **Feature folders:** a stable anchor.
  - **History:** the rule forbids narration of how the doc or the code used to be, not describing a state change.

  The back-pointer on a replaced passage should use a phrase other than `**Planned:**`. That's for the PO to change in A2 D4.
- **The Test Planner's batch 1 review, all seven points taken, in the checklists and the standards guide:**
  - **Step 3:** the Test Planner's pass applies the handoff wherever it lands, and adds new or reopened cases to Scope.
  - **Step 5:** the Reconciler also checks the whole catalog for cases whose test is gone, and re-checks only the gaps it sent back.
  - **Sign-off:** a new lost-coverage condition.
  - **Tech-debt stories:** the same check whenever the story deleted, moved or split test files.
  - **Epic test condition:** exceptions for Planned and routed cases.
  - **Regrouped suites:** tests are re-titled before the Reconciler runs.
  - **Archiving:** the Reconciler report is archived with the plan and audit, and "explicitly deferred" becomes "routed to a destination that names it".
- **D8, from A3 D8:** test plans use only `wiki <page> §N`, not the wiki's in-page forms.
- **The Auditor's batch 1 review of `code-comments.md`, all eight points taken:**
  - **`prettier-ignore`:** it takes its reason on the line above. Prettier ignores the directive if any text follows it, which the Auditor verified in a scratch file.
  - **Rule (a):** also bans paths into planning, audit and archive docs. D8's `transient-link` runs over code comments and test titles, and the guide's table maps it.
  - **Coupling comments:** written as "also read by `<file>::<symbol>`", never as a complete list.
  - **Module headers:** required for every non-test module; test files only where the name doesn't say what they cover.
  - **Test titles:** they follow the comment rules.
  - **The "not checkable" list:** it's now the drift pass's whole checklist, with three items added.
  - **Rule (f):** a ruling without its reason doesn't count.
  - **Placeholders:** D8 now says angle-bracket placeholders are never references.
- **The Coder's batch 1 review of `code-comments.md`.** Four of its seven points overlapped the Auditor's review. The other three:
  - **Ambiguous file names:** `<file>::<symbol>` uses the file name alone when it's unique, or else the shortest unique path. The 12 client `api/` files share names with server route files, and there are two `index.ts` files. `symbol-ref` reports an ambiguous name (D8).
  - **Transient-doc pointers by name:** rule (a) bans pointers to plans, decisions docs, audits and reports by file name as well as by path, and `transient-link` matches bare names of files in those folders (D8).
  - **Section numbers:** N may be a subsection or an inserted section (D8).
  - **Plus a line:** a coupling comment says where to look; confirm with a search before acting on it.
- **Module headers, a conflict between the reviews, decided by the Architect:**
  - **The Coder's rule:** a header only where the file name doesn't say what the file owns, plus every shared-logic module (`server/src/lib/`, `client/src/lib/`, the drag modules in `workflow/`).
  - **The Auditor's rule for tests:** a test file only where its name doesn't say what it covers.
  - **Why:** this keeps "no comment is the default", and saves A4 about 41 headers on files like `api/labels.ts`. The Coder updates A4's scope to match.
