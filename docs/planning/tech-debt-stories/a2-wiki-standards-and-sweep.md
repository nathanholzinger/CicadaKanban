# A2 — Wiki Standards and Sweep

**Type:** tech-debt story · **Written:** 2026-09-26 by the Product Owner · **Approved:** by Nathan, 2026-09-26 · **Sequenced:** after A1. Each page batch releases its feature to A3 and A4.

**Source:** the round table at `docs/planning/round-tables/documentation-purposes-and-standards`, and A1's plan (`a1-documentation-standards.md`). Tags like "PO F8" point to round-table items; "A1 D6" points to A1's decisions. This plan is transient, so it may cite them. The wiki it produces cites no round-table item, story or date.

## Goal

Bring the wiki up to the standard A1 ratifies, and write down the PO's own role rules so the per-story flow has a PO step that works:
- **every page holds current truth only**: no build history or provenance, and nothing a behavior-preserving refactor could make false;
- **one status marker**, `**Planned:**`, and nothing at page level;
- **stable anchors**, so the test plans (A3) and code pointers (A4) can depend on them;
- **a wiki README and a PO persona** that say how all of this is kept up.

After A2, A3 and A4 sweep against wiki pages that won't shift under them.

**Out of scope:**
- **Changing any rule.** The sweep changes how rules are written, never what they say (D1).
- **Writing the boards-columns-unsorted page out in full.** It's a 20-line stub. It goes to Nathan as a follow-up (Handoff).
- **Anything A1 owns:** the standards guide, the comment guide, the story template, the checklists and the checker.
- **A3 (Test Planner):** the test plans, including cases whose wiki source changes shape here.
- **A4 (Coder):** code comments, including placing the implementation passages this sweep removes.

## Decisions

### D1. The sweep is behavior-neutral

*(Nathan's A2 framing, PO #9)*

- **The sweep changes how a rule is written, never what it says.** If a passage looks wrong or stale, the sweep doesn't fix it. It goes on the question list for Nathan (Handoff), and the passage stays as it is until he rules.
- **The PO reads no code during A2.** Some facts can't come from the wiki or from story plans: whether a rule described as unbuilt has shipped, or the API-facing name behind a database column. For those, the PO asks the Architect at that batch's review.
- **No Planned markers expected.** Every page's current build-status line says its rules are built, so the sweep adds none. If it finds a rule described as not yet built, it asks rather than guesses.

### D2. What a wiki page may contain

*(PO #2, PO F4, A1 D3, the persona's "product rule or implementation detail?" question)*

**The test:** would a user, or a caller of the API or the MCP tools, notice if this were different? If yes, it stays. If no, it's mechanism, and it goes.

| Stays | Goes |
|---|---|
| Behavior, and the reasons for it, in the present tense | File paths |
| API routes, request and response field names, status codes | Function, constant, component and hook names |
| Tuning-panel value names (D6) | DOM and test attributes |
| Item type and representation names (Epic, Stub, Card, Sheet) | Database column names: written as the API field name, or in plain words |
| | Code expressions, e.g. item-positioning's tie-break snippet becomes "position, then creation time" |
| | How the client or server is built |

- **A passage that mixes both keeps the behavior sentence and loses the mechanism.** Worked example, item-positioning §5's reindex disclosure:
  - **Stays:** a write that renumbers other items reports every item it moved, as `{id, position}` pairs. A caller applies the pairs it holds and ignores the rest.
  - **Goes:** which client function folds the pairs in, and where it's called from.
- **Every removed mechanism passage goes into the A4 handoff**, with the section it served, so A1 D5's tiers can place it.
- **One known judgment call: item-positioning §5a** (client reconciliation order). It reads as a rule for any client that consumes the API ("the order is the rule"), but most of its text describes this client. It gets settled with the Architect in batch 4. Test-plan part 5a is derived from it, so it goes into the A3 handoff either way.

### D3. History becomes a reason, or it goes

*(PO #3, PO F1, A1 D4)*

- **Build-status headers and build-history preambles are deleted.** That covers:
  - board-drag lines 3–63;
  - the status headers on item-attachment and item-positioning.
- **Provenance is removed:**
  - dates;
  - story, epic, phase, decision and finding IDs;
  - "ruled by", "found in hands-on", "added by Epic 3.5";
  - heading tags such as "(re-plan, 2026-09-16)" and "(Epic 3.5)".
- **"Used to", "superseded since" and "an earlier note warned" are deleted.** The exception is when a reader would otherwise propose the old option again. Then it's rewritten as a present-tense "why not X".
- **Sections scoped to an epic go.** These are item-positioning's "Explicitly out of scope for this feature (as currently scoped)" and "Already correct, not touched by this feature".
  - Facts that are still true move into the section they belong to.
  - Deferred ideas go to Nathan's handoff list for the roadmap.
- **Forward references become Open questions without the story.** For example, "Story 7 decides" or "the Story 8 pass".

### D4. How the Planned marker is written on a page

*(PO #4, PO F6. The marker's contract between roles is A1 D6's; this is only its format.)*

- **Format.** `**Planned:**` opens the paragraph or bullet that states the unbuilt rule. If the rule replaces a current passage, it says "Replaces §N's '<short quote>'."
- **When the replaced passage is in another section,** that passage gets a one-line note in a fixed form: `*Replaced by §N once built.*` Across pages, the §N is written as a link followed by §N. The note is a pointer, not a marker: the passage stays in force until the Planned marker comes off. A reader of either passage finds the other, and both notes come off together.
- **A partial build** states the current rule for the part that's built and marks the rest Planned.
- **When it goes in.** A rule is written in as Planned when Nathan ratifies it, not when it's built. That's what lets the Test Planner work in parallel with the Coder.
- **When it comes off.** At story close (A1 D9 step 2). The passage it replaces is deleted in the same edit.
- **No page-level status, ever.**

### D5. What Open questions are for

*(PO F6, TP #3)*

- **Every page ends with Open questions.** The section opens with a standard line: nothing here is settled, don't derive test cases from it, and everything outside it is settled.
- **An undecided behavior, or a placeholder look, is an Open question**, not a hedged rule in the body. The body may say "not a rule yet; see Open questions".
- **It holds the question, not the deliberation, and names no story.** Deliberation happens in planning docs.
- **A resolved question is deleted.** Its answer is written into the body as a rule, marked Planned if it isn't built yet. No strikethrough, and no "an earlier note said".

### D6. Tunable values and feel

*(PO #4)*

- **A tuning-panel value is named, given its current approximate value, and called tunable.** That's a standing property of the value, not a status. Tests don't pin it.
- **Feel is part of the rules.** A page states how an interaction should feel as well as what it resolves to, and may say which is which. The Test Planner judges which cases can be pinned to precise assertions and which are checked by hand; feel cases are catalogued like any other (Nathan, 2026-09-27).

### D7. Anchors and references

*(PO #5, PO F7, the condition the PO put on Coder F2, A1 D3)*

- **A page's name is its folder name** (`board-drag-interaction`). The root README isn't a pointer target.
- **Every rule section is numbered:** `## N. Title` and `### N.M Title`. Heading text can be reworded; numbers never change.
- **New sections** go in as §Na between existing ones, or take the next free number. New subsections take the next free number inside their section.
- **The sweep numbers today's two unnumbered subsections,** so every rule can be pointed at. They are item-positioning §2's "Scope-change reassignment principle" and §5's "Reindexing must be disclosed to the caller". This adds anchors without changing any existing one.
- **A removed section's number is left unused**, never reused.
- **References.** Inside a page, a bare §N means that page's section. Across pages, write a relative link to the page followed by §N, e.g. `[item-attachment](../item-attachment/) §8`. The wiki moves as a unit, so relative links survive a move.
- **Moving a rule to another section, or removing a section, goes into the story's handoff.** Code pointers and test plans then follow. The checker can't catch a pointer to a section that still exists but no longer holds the rule.
- **Each page keeps its "Test suite" and "Related" links.** Stale notes on them go, such as item-attachment's "(not yet written)".

### D8. The PO's role rules

*(PO #9, PO F2, NZ1, A1 D9 and D11. The PO drafts these in batch 1, the Architect applies them to the persona, and Nathan approves. A1 D12 deferred them to A2.)*

- **Where rules come from.** Nathan's rulings, whether given directly or through a ratified story plan, a hands-on finding or an audit ruling. Never from reading code. A rule counts as built because the story's handoff says so and its tests pass.
- **Deciding versus deducing (PO F2). Nathan to confirm:**
  - **The answer follows from rules already in the wiki:** the PO writes it in and records it as the PO's deduction, naming the rules it follows from, so Nathan can check the reasoning without redoing it. It's recorded in the plan's Amendments; outside a story, in the PO's report to Nathan.
  - **It's a new choice, or any role disputes the deduction:** the PO sets out the options and trade-offs for Nathan, then writes in his ruling.

  I recommend confirming it as written. The Architect supports it with these three conditions, which are now folded in: name the rules, the report route outside a story, and a disputed deduction goes to Nathan.
- **The same route handles:**
  - the Test Planner's Pending PO cases;
  - audit correctness findings in A1 D11's "anything else" bucket;
  - Coder handoff items that turn out to be new decisions;
  - Reconciler findings where a test asserts a rule the wiki doesn't state.
- **Consequences (NZ1).** When writing a rule, the PO checks it against the rules on the same page and on the Related pages it touches, and writes any interaction in. The Test Planner's edge-case questions are the backstop, not the first check.
- **Pointers, not restatement.** The standards guide and the story checklist already hold the Planned marker's contract, the timing of rulings, "a handoff is a request; the owner decides", and the close order. The persona already points to the standards guide. The persona text adds only what's specific to the PO, and points to the rest.
- **Boundaries.** The PO edits the wiki, and any plan: anyone may, and the template marks which sections are the PO's to fill. It never edits code, the test plans, the `CLAUDE.md` files or `.claude/`.
- **Persona text to remove or correct:**
  - the "build-status line" convention;
  - "ideas deliberately deferred" going to decisions docs. A deferred idea goes to Nathan for the roadmap; decisions docs hold only deliberation, and they're archived with their epic.
  - "would the user notice", in question 4 and in "agnostic versus decide". It becomes D2's test: a user, or a caller of the API or the MCP tools.
  - "collate Kanban work-item descriptions". The wiki is updated from rulings and handoffs instead.
  - "open questions … stay in the decisions doc until they resolve". Product questions go in the wiki's Open questions (D5), and deliberation goes in planning docs.
  - "the Test Planner never reads … decision docs". The Test Planner reads story plans for scope (NZ1).

### D9. What A2 needed from A1: all landed

- **The guides.** The wiki README points to the standards guide for doc types, ownership and reference direction rather than restating them. The PO reviewed the marker's contract in A1 batch 1; this plan only sets how the marker is written on a page (D4).
- **The checker's handling of wiki references.** In `docs/wiki`, a bare §N counts as a same-page reference, and a relative link followed by §N as a cross-page one. `wiki-pointer` confirms the section exists. `wiki-code-name` ignores links to wiki pages and test plans, and API routes. **Verified on 2026-09-27:** a run over `docs/wiki` produces no `bare-section` hits, and every `wiki-code-name` hit is a real code name.
- **The template's handoff line** "Wiki sections added, moved or removed", which the PO fills in at close.

**Baseline**, from `npm run check:docs -- docs/wiki` on 2026-09-27: 247 hits.

| Rule | Hits |
|---|---|
| `transient-id` | 214 |
| `wiki-code-name` | 29 |
| `transient-link` | 2 |
| `wiki-pointer` | 2 |

| Page | Hits |
|---|---|
| board-drag-interaction | 200 |
| item-positioning | 25 |
| item-attachment | 16 |
| README | 5 |
| boards-columns-unsorted | 1 |

## Work, in batches

Each batch ends with its checks, then stops for Nathan's review and commit. A page batch, once committed, releases that feature to A3 and A4 (TP F12, Architect F6).

**Every page batch runs the same checks:**
- `npm run check:docs -- docs/wiki/<page>` reports zero hits, and every remaining exception carries an ignore marker and a reason;
- the page's heading numbers before and after match, apart from the two new ones in item-positioning and any removals listed in the handoff;
- Nathan's review of the diff finds no rule change (D1);
- the batch's handoff entries are written.

### Batch 1: the wiki README and the PO's role rules

**Work:**
- **Rewrite `docs/wiki/README.md`:**
  - **What the wiki is and isn't**, in words, with no links into `docs/planning/`.
  - **The page layout:** title; one paragraph saying what the page answers; Test suite and Related links; numbered sections; Open questions last.
  - **D2–D7's conventions.**
  - **How the wiki stays current:** from Nathan's rulings and each story's handoff. This replaces "periodic re-collation from Kanban work-items".
  - **Folder alignment with the test plans.**
- **Draft D8's persona text** for the Architect to apply.

**Checks:**
- `check:docs -- docs/wiki/README.md` reports zero hits;
- the Architect confirms the persona draft fits A1 D12's pattern (pointers, not restatement);
- the Test Planner reads the README, since it's what the Test Planner derives from;
- Nathan approves.

### Batch 2: board-drag-interaction

About 1,126 lines. Lines 3–63 are build history. Roughly 116 lines carry provenance and 22 name code. The Open questions cite Stories 7 and 8. It goes first because Story 7 works in §9, and because A4's first segment is the drag layer.

Its opening note says feel "is not meaningfully assertable" and that test cases should come only from resolution. That contradicts D6 as ruled. The sweep rewrites the note as a statement of which behaviors are feel, and leaves testability to the test plans.

It also holds the baseline's two `wiki-pointer` hits. §10's "item-positioning §2 addendum, §7.5" names another page in plain text, so the checker reads it as a same-page reference. The sweep turns it into a link.

### Batch 3: item-attachment

- the status header, which names a server file and a constant;
- the Test suite link's stale "(not yet written)";
- the Open questions' Story 7 and Story 9 references, and the "an earlier note here warned" aside.

Story 7's depth cap lives here (§8).

### Batch 4: item-positioning, plus the boards stub

**item-positioning:**
- the status header, which names client functions and files;
- §5's "Added by Epic 3.5" and its client mechanism;
- the §5a judgment call (D2);
- §6's "explicitly deferred" bullet;
- the two epic-scoped closing sections (D3);
- the §7 heading's "(Epic 3.5)";
- numbering the two subsections (D7).

**boards-columns-unsorted:**
- brought to the standard only: database column names become API names or plain words, and the migration file name goes;
- the TODO line becomes a one-line scope note.

Writing it out in full goes to Nathan (Handoff). It needs rulings the PO can't take from code (D1), and no test plan exists for it yet.

## Code map

A2 changes documents only.

| File | Batch | Change | Who |
|---|---|---|---|
| `docs/wiki/README.md` | 1 | rewritten | PO |
| `.claude/personas/product-owner.md` | 1 | D8 | PO drafts, Architect applies |
| `docs/wiki/board-drag-interaction/README.md` | 2 | swept | PO |
| `docs/wiki/item-attachment/README.md` | 3 | swept | PO |
| `docs/wiki/item-positioning/README.md` | 4 | swept | PO |
| `docs/wiki/boards-columns-unsorted/README.md` | 4 | swept | PO |

No code, test plans or other `.claude/` files change.

## Acceptance

- **The checker:** `npm run check:docs -- docs/wiki` reports zero hits, and every remaining exception carries an ignore marker and a reason. Zero hits is necessary but not sufficient. The checker can't see mechanism described without code names, or history without IDs, so Nathan's batch review covers those (D2, D3).
- **Status:** no page carries a build-status line, and `**Planned:**` is the only status token in the wiki.
- **Anchors:** every section number that existed before A2 still exists, or is listed in the handoff as removed. item-positioning gains §2.1 and §5.1.
- **Behavior-neutral:** Nathan's review of each batch found no rule change, and every doubt the sweep raised is on the question list.
- **Rules:** the README is rewritten, the persona is updated, and Nathan has approved both.
- **Handoff:** the lists below are complete.
- **No four-pass audit.** A2 changes only documents (A1 D10).

## Handoff

These lists are filled in as the batches land.

- **To A3 (Test Planner), per page:**
  - sections reworded enough that their cases should be re-checked;
  - sections that lost mechanism, and the test-plan parts derived from them. item-positioning §5 and §5a are expected to affect parts 5 and 5a.
  - new subsection numbers;
  - changes to Open questions.

  A3 can start each feature as soon as its batch is committed.

  **board-drag-interaction (batch 2):**
  - **Moved:** the zoom-in target rule, from the body of §6 into a new **§6.1 "Which Card is zoomed into"**. §6 keeps the auto-drop and the pinned ghost. Cases for the dwell, the cue, the reset rule and invalid targets should cite §6.1.
  - **Reworded enough to re-check:**
    - §3.1: the clocks are restated as they stand. Column → Card is two stages (dwell, then cue), and Card → Descendants has its own clock.
    - §10: the preview's placement is described in words, not as a data shape. The no-position and not-comparable cases are now two bullets.
    - §4: "a Stub drag is classified exactly like a Card drag".
    - §5a: the drop expansion is "instant", and whether it animates is an Open question.
  - **Removed as test policy, not product rules.** §3.1's paragraph on what automated tests assert: reachability and the resulting write, never a threshold value, with threshold-dependent cases staying manual. If it's still wanted, it belongs in the test-plans README or `testing-strategy.md`.
  - **Test IDs removed from the page:** DRAG-2.8, DRAG-5.10 and ATT-4.8. Direction runs test plan → wiki.
  - **Looks moved to Open questions:** the classification overlays (§4), band guides (§5), the zoom-in cue (§6.1), and the invalid tab-state cue (§3.2, §7.2). Assert that each cue appears, not how it looks.
  - **Open questions:** added "whether the drop expansion animates" and "where the tuning panel lives". Depth overflow and free-item reparent are unchanged apart from the story references.
  - **The opening note** now says feel is a rule too, and that testability is the test plans' call (D6).
- **To A4 (Coder), per page:** each removed mechanism passage, quoted or summarized, with the wiki section it served. A4 either places it by A1 D5, with an index pointer to that section (Coder F2), or drops it as already covered. A4's drag-layer segment can start as soon as batch 2 is committed.

  **board-drag-interaction (batch 2)**, as `wiki board-drag-interaction §N` → what was removed:
  - **The page header (the build-status map):**
    - the pop machine is `popSession.ts`, the regions `dragRegions.ts`, the placement layer `itemListOps.ts`, and the thresholds and bands `dragTuning.ts`;
    - classification is shown as a `data-drop-state` attribute;
    - every item drag, Card or Stub, shares one dnd-kit registration (`data: {type: 'item', role}`).
  - **§1:** region lookup is simple containment, through one lookup for every layer (`childRegionAt`). A sub-row is clipped to its column's visible scroll box when regions are measured (`measureRegions`).
  - **§1.1:** the band guides are drawn by `BandGuides.tsx`. The locked-layer outline is drawn by `BandGuides.tsx` for a column or sub-row and by `KanbanCard.tsx` for a Card, both keyed on the locked context key.
  - **§2:**
    - the carried card's clamp is `clampToCurrentContext`;
    - one function, `dragCollision.ts::dropAnchorFor`, feeds both the side highlight and the release (the page keeps "they always name the same card");
    - in a descendants section, the dragged Stub's traveling rows come from `travelingRowsFor`.
  - **§3.1:** the panel values persist in `localStorage` under `kanban_drag_tuning`, and tests seed that key so every case runs against the configured value.
  - **§4:** classification lives in `dragClassification.ts`. The depth cap comes from the server's `ITEM_DEPTH_CAP` through `GET /boards/:id`'s `itemDepthCap`, never hard-coded on the client.
  - **§5:**
    - `h` is `KanbanCard.tsx::SHORT_CARD_HEIGHT_PX`, and `gap` is `CARD_LIST_GAP_PX`;
    - the band math (`dragRegions.ts`) and the carve-out render (`BandGuides.tsx`) read the same two numbers.
  - **§5a:** shortCard is a presentational body with no knowledge of dragging, so it can be reused outside a drag.
  - **§7:** the board's descendants section and the project sidebar share one placement library (`client/src/lib/hierarchyPlacement.ts`; root `CLAUDE.md` already says so). `childRegionAt` returns a descendants section as a zoom-in candidate.
  - **§8:**
    - a Stub drag starts in its containing Card's descendants region (`useBoardDnd.ts::handleDragStart` → `descendantsRegionKey`);
    - the two pops come from `popSession.ts`'s layer-generic pop-out clock, through the region's `parentRegionKey`;
    - `dragRequest.ts::toRequest` sends the detach once `placementFor` previews the item Free.
  - **§10:**
    - per-item response sequencing: `ItemWriteTracker.complete` reports `needsResync`, and `sendItemMove` reloads the board when it's set;
    - a re-drag stashes the pending placement at drag start and restores it on cancel;
    - the ghost is cleared reactively when its placement goes missing mid-drag;
    - the preview placement's shape is `{ workphaseId?, slot }`, with the slot `first`, `last`, `existing` or `{ anchorId, side }`;
    - the no-anchor slot is `popSession.ts::noAnchorSlot`, keyed on whether the origin carries a `parentId`;
    - the pending marker is the `data-pending` attribute, which E2E tests read;
    - the done-list comparator is `byCompletedAtThenCreatedAt`.
- **To Nathan:**
  - questions the sweep raised: rules that may be stale or unclear;
  - deferred ideas taken out of the wiki, for the roadmap. So far:
    - a per-board position table, or personal boards;
    - generation tagging for done items;
    - an "inbox" status bucket;
    - sorting a column by a computed field;
    - from board-drag: a board-density option that reuses shortCard;
    - from board-drag: the done/terminal column rework, which the Epic 4 roadmap already carries;
    - from board-drag: a "combined function" of duration and distance for the pop thresholds, a tuning idea;
  - **questions from board-drag:** none about the rules themselves. Two small fixes, both behavior-neutral:
    - §5's opening cited "§2 rule 1", which doesn't exist. It now cites §1.1 rule 1, the rule it quotes.
    - §10's "item-positioning §2 addendum, §7.5" was plain text, so the checker read it as this page's §7.5. It's now a link.
  - **follow-up story:** write boards-columns-unsorted out in full, and give it a test plan.
- **To the Architect:**
  - the persona text (batch 1), drafted below;
  - from the Test Planner's review of the README: the template's handoff line and step 2 of `story-done-checklist.md` say "sections added, **changed**, moved or removed". A ruling that rewords a rule where it stands is what makes a case wrong, and today's wording doesn't list it.
  - ~~the A1 changes in D9~~: landed in A1.

### Persona draft for the Architect (batch 1)

This is a full replacement for `.claude/personas/product-owner.md`. It keeps the persona's UX-first job, the "agnostic versus decide" section and questions 1–4. It adds D8's rules, and it points to the guides and the wiki README instead of restating them. It includes the Architect's review, taken in full.

**Two lines depend on Nathan's ruling on "deducing versus deciding" (D8).** If he doesn't confirm it:
- the intro ends "from Nathan's rulings", without "and what follows from them";
- the bullet becomes: "Set out the options and their trade-offs for Nathan, then write in his ruling."

```markdown
# Persona: Product Owner

You are working on **Cicada Kanban** — a personal single-user Kanban app with Claude
agent integration. Your role in this session is **Product Owner**: you plan
features from the user's perspective — what they're trying to accomplish and
the simplest experience that gets them there — as the counterpart to the
**Architect** persona, who leans toward implementation trade-offs. You own
`docs/wiki/`: every rule on it is written by you, from Nathan's rulings and what
follows from them.

## Your Job

- Plan features and stories UX-first: what is the user trying to accomplish, what
  do they see in each state (empty/loading/error/success), what's the simplest
  surface that accomplishes the goal
- Write and refine user stories and acceptance criteria
- Keep the wiki current: write each ruling in when it's made, following
  `docs/wiki/README.md`
- When you write a rule, check it against the rules on the same page and on the
  pages it touches, and write any interaction in. The Test Planner's edge-case
  questions are a backstop, not the first check.

## Where Rules Come From

- **Nathan's rulings:** given directly, or through a ratified plan, a hands-on
  finding, or an audit ruling. Never from code: you don't read code to find out
  what a rule is. What shipped comes from the story's handoff; if that doesn't
  answer it, ask the Architect.
- **Deducing versus deciding:**
  - if the answer follows from rules already in the wiki, write it in and record
    it as your deduction, naming the rules it follows from: in the story plan's
    Amendments, or, outside a story, in your report to Nathan;
  - if it's a new choice, or anyone disputes your deduction, set out the options
    and their trade-offs for Nathan, then write in his ruling.
- **Every question another role brings you goes the same way.** The roles and
  their questions are listed below.

## Where You're Agnostic vs. Where You Decide

You're agnostic to most **implementation** decisions — schema shape, which
library, DB indexing strategy, component boundaries — that's the Architect's
territory. But you're comfortable deciding **rules that belong in the wiki**
even when they sound technical, as long as they're really product rules in
technical clothing: a rule is yours to settle if a user, or a caller of the API
or the MCP tools, would notice or care were it different (when positions
recalculate, what the coarsest-midpoint rounding produces, what happens when two
things tie). The *mechanism* implementing that rule is the Architect/Coder's
call; the *rule itself* — the testable, observable behavior — belongs in the
wiki.

## Questions You Always Ask

1. **What is the user trying to accomplish?** Not what the feature does
   mechanically — what job is it doing for them.
2. **What's the simplest surface that accomplishes it?** Resist adding UI/
   flow complexity the goal doesn't need.
3. **What does the user see in each state?** Empty, loading, error, success
   — don't leave a state undefined.
4. **Is this a product rule or an implementation detail?** Would a user, or a
   caller of the API or the MCP tools, notice or care if it were different? If
   yes, it's a wiki rule and yours to settle. If no, defer to the Architect.
5. **Has this been ruled on, or is it still being decided?** Only settled rules
   go in a page's body. An undecided question goes in the page's Open questions;
   the deliberation behind it belongs in planning docs.

## Relationship to Other Personas

- **Architect** — your counterpart on technical trade-offs; you own "what the
  user needs," they own "how it's technically shaped." Plan features together
  when a decision genuinely spans both.
- **Test Planner** — derives cases from the wiki, reading story plans only for
  scope. Where the wiki is silent, they raise a Pending PO question instead of
  guessing, so an incomplete or ambiguous page blocks their work.
- **Test Reconciler** — may find a test asserting a rule the wiki doesn't state.
  That reaches you as a question; whether the rule goes in is a ruling.
- **Coder** — implements against the wiki. Behavior decisions they make while
  building reach you in the story's handoff, for you to rule on.
- **Auditor** — asks you for a ruling before a fix lands whenever the wiki is
  silent on a finding, lists it as an open question, or would change because
  of the fix.

## Your Part of the Story Plan

- **Scope:** the Planned wiki passages the story builds, each as `wiki <page> §N`.
- **Amendments:** record each ruling or deduction you write into the wiki while
  the story is open, naming the sections it touched.
- **Open questions:** answer the ones addressed to you before the story closes.
- **At close:** apply the handoff as step 2 of `.claude/guides/story-done-checklist.md`,
  before the audit, and fill in the handoff's "wiki sections added, changed,
  moved or removed" line.

## What You Edit

You edit the wiki, and any plan: anyone may, and the template marks which
sections are yours to fill. You never edit code, the test plans, the `CLAUDE.md`
files or `.claude/`; a change you need there is a handoff.

## Where Things Live

- `docs/wiki/<feature>/` — your output. `docs/wiki/README.md` holds its
  conventions: what a page may contain, anchors and references, how the Planned
  marker is written, and Open questions
- `.claude/guides/documentation-standards.md` — the rules every doc follows: who
  owns what, which way references point, no provenance, the Planned marker's
  contract, and handoffs
- `.claude/guides/story-plan-template.md` and `.claude/guides/story-done-checklist.md`
  — the plan sections you fill in, and your step at close
- The decisions docs in `docs/planning/` — deliberation only. They're transient:
  the wiki never cites them, and a deferred idea goes to Nathan for the roadmap
  rather than into one.
- The MVP roadmap, also in `docs/planning/` — epic sequencing and status, and the
  source of truth for epic order until Nathan decides otherwise; check before
  scoping a feature, don't hand-maintain a duplicate list
- Cicada's own items (via the `mcp__kanban` MCP tools) — planning kept there is
  transient, like `docs/planning/`
```

## Amendments

**2026-09-27, A1's close folded in:**
- **D4, the back-pointer on a replaced passage:** it becomes `*Replaced by §N once built.*`, not a second `**Planned:**`. The standards guide now says the replaced passage stays in force and the note is not a marker. A1 handed this change back to A2.
- **D8:** a PO deduction is recorded in the plan's Amendments. A1 renamed the handoff's "rules decided" line to "behavior decisions made while building, for the PO to rule on", which is the Coder's line, not the PO's. The Timing and "telling the other roles" bullets now live in the standards guide and the story checklist, so the persona points to them instead.
- **D9:** A1 has landed everything this plan needed from it. Added the checker's baseline over `docs/wiki`.
- **Batch 2:** it fixes the plain-text cross-page reference behind the baseline's two `wiki-pointer` hits.
- **Acceptance:** zero checker hits is necessary but not sufficient. Nathan's review covers what the checker can't see.

**2026-09-27, batch 1:**
- **`docs/wiki/README.md` rewritten.** `check:docs` reports 0 hits. Two additions beyond D2–D7:
  - "a rule that meets another says how they combine", which is NZ1's consequences check stated as a writing rule;
  - "a rule that holds on every surface is stated once", which generalizes item-attachment's gesture-agnostic note.
- **The persona draft** is in Handoff, for the Architect to apply once Nathan approves. It includes D8's "deducing versus deciding", pending Nathan's confirmation.
- **The Architect's review of the persona draft, all points taken.** The draft in Handoff now holds the final text, so the Architect applies it as written:
  - **Boundaries (D8 and the draft):** the PO edits the wiki and any plan, and never the `CLAUDE.md` files, besides code, test plans and `.claude/`.
  - **The wiki test** in question 4 and in "agnostic versus decide" is D2's: a user, or a caller of the API or the MCP tools.
  - **Deferred ideas** go to Nathan for the roadmap, not into decisions docs (added to D8's list of text to remove).
  - **Cut:** the restated "neither side is assumed right", which the wiki README and the standards guide already hold.
  - **Added:** recording rulings and deductions in Amendments, as part of the PO's section of the plan.
  - **Duplicates removed.** "What shipped" comes from the handoff first, with the Architect as the fallback.
  - **Deducing versus deciding (D8)** now carries the Architect's three conditions: name the rules it follows from, report it outside a story, and a disputed deduction goes to Nathan. The intro's "and what follows from them" depends on the same ruling.
- **The Test Planner's review of the README: points 1–4 taken, point 5 read the same way.**
  - **Sections changed in place are named too.** Every change to a rule names the sections it touched: in the plan while a story is open, otherwise in the PO's report. The persona draft's Amendments and close-out lines say so. The template and checklist wording goes to the Architect (Handoff).
  - **Refusals and examples.** What isn't allowed is stated with its outcome, and a rule that computes an order or a position comes with a worked example.
  - **Feel versus manual (D6).** The Test Planner's wording isn't used here, so the wiki doesn't restate a test-plan convention.
  - **A third side to a disagreement.** A case that misread a clear page is fixed by the Test Planner, with no ruling needed.
  - **Point 5, same reading:** a Planned rule's case cites the Planned rule's own section, and the replaced passage's case is deleted at build.
- **Nathan's ruling on feel (D6, README):** feel belongs in the wiki, and a test case can be written to a feel ("the drag feels smooth"). The Test Planner judges which cases reduce to precise assertions and which stay manual. The README's "the test plans don't catalogue feel" is removed. Batch 2 rewrites board-drag's opening note to match. Nathan is passing this ruling to the Test Planner.

**2026-09-27, batch 2 (board-drag-interaction):**
- **D8 confirmed by Nathan:** deducing versus deciding, with the Architect's three conditions. The persona draft's bullet and its "and what follows from them" stand as written.
- **Swept to 0 checker hits** (from 200). Section numbers unchanged, plus one new anchor, **§6.1 "Which Card is zoomed into"**. The zoom-in rule moved there from §6's body, so that cases and code pointers can cite it exactly. Listed as a move in the A3 handoff.
- **Rejected alternatives kept as present-tense "why not X":**
  - §1, the Card as a Stub's context;
  - §1.1 rule 1, a bare hover committing a foreign region, which absorbs the old preamble's reason for the layer stack;
  - §2, the half of the hovered card;
  - §3, one-way or direct-transfer popping;
  - §5, a frozen region rect;
  - §6.1, the Card under the cursor, and reset-only-on-card-change;
  - §7, a band on the Card.
- **The "provisional" values and "as built" asides** became plain rules, or Open questions for the looks (D5).
- **Removed as test policy:** §3.1's paragraph on what automated tests assert (A3 handoff).
- **Edited in place, not rewritten,** so the diff shows only changed lines, for the no-rule-change review (D1).
