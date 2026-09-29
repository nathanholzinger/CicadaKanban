# Test Reconciliation: A3 batch 4, item-attachment (proposing run)

**The Addendum at the end ("Addendum: after the Test Planner's response") supersedes the earlier sections for every case it names. Totals reflect the catalog after that response: 56 cases.**

**After the confirming run:** "Confirming run (2026-09-28)", the last section, records what the catalog now says, after Stop 1's rulings.

**Run:** proposing (A3 batch 4, step 2), 2026-09-28. Nothing in `docs/test-plans/`, the wiki or any test was edited. This report is the only write.

**Scope:** `docs/test-plans/item-attachment/` (ATT-1 … ATT-8, 46 cases), against `docs/wiki/item-attachment/README.md` as swept. The catalog-wide checks cover every suite.

**Skipped by instruction:** ATT-8.3 (`Pending PO`). ATT-7.6 still carries the legacy ✅ and is mapped like any case; its internal pointer counts as approved.

**Rules applied:** the README's many-to-many rule (a case is `Automated` once the tests carrying its ID assert all of it, together), batch 3's Stop 1 rulings (a partial test still gets its ID; pointer lines list only the tests that make a case `Automated`; every UI drag gap goes to Story 10), and D10.

## How to read this report

**Outcome codes,** one per mapped case:

| Code | Meaning | At the confirming run |
|---|---|---|
| **Stamp** | Surface tests already assert the whole *Then*. They need only the ID in their titles. | `Automated` |
| **Stamp + A3 route** | Surface tests assert part. They get the ID now, and a route or Playwright API test closes the rest in A3. | `Open` until the gap closes |
| **Stamp + A3 UI** | As above, but the missing part is a Playwright UI assertion with no drag. | `Open` until the gap closes |
| **A3 route** | No test yet. A route or Playwright API test can close it in A3. | `Open` until written |
| **Internal** | Only an internal test asserts it. | `Automated` if approved |
| **Ruling** | A test for the case can't pass until Nathan or the PO rules (see below). | `Open` |

**"Unchanged" after a rejection.** Where a *Then* says an item is unchanged after a refused write, I count it asserted when the test checks the fields that write would have changed. For a legality refusal that's `parentId`. For "nothing is stored" I need the stored row, or proof that no row was created.

**"Whichever write makes the change"** (ATT-2.1, 7.1) is the page's gesture-agnostic wording (INDEX), so one entry point is enough. Where a case names the writes, as ATT-4.10 and ATT-8.1 do, each one named has to be asserted.

**File aliases:**

| Alias | File |
|---|---|
| hier | `server/tests/routes/items.hierarchy.test.ts` |
| items | `server/tests/routes/items.test.ts` |
| boardsRoute | `server/tests/routes/boards.test.ts` |
| itemTree | `server/tests/lib/itemTree.test.ts` |
| scopeLib | `server/tests/lib/itemPositionScope.test.ts` |
| attachedAPI | `tests/api/attachedChildren.spec.ts` |
| itemsAPI | `tests/api/items.spec.ts` |
| attachedUI | `tests/ui/attached-children.spec.ts` |
| classify | `tests/ui/drag-target-classification.spec.ts` |
| detach | `tests/ui/drag-5-stub-detach.spec.ts` |
| dragClassification | `client/src/components/workflow/dragClassification.test.ts` |
| dragRequest | `client/src/components/workflow/dragRequest.test.ts` |
| clientHierarchy | `client/src/lib/hierarchy.test.ts` |

Tests are cited as `alias:line` with the title as it reads today.

## Rulings this batch needs before Stop 1 closes

**Ruling A: a top-level item's stored attachment flag.** This is the most important finding in this run.
- **What the code does.**
  - `POST /items` stores `isAttached = 1` on a top-level item unless the request says otherwise. The route defaults it, and so does the schema column.
  - The hierarchy primitive deliberately keeps that flag while the item has no parent (`itemHierarchy.ts::deriveResultingState`).
  - So a later write that gives the item a parent without mentioning the flag **attaches** it.
- **What the wiki says.**
  - §1: "A write that sets the attachment flag on an item that has (or would have) no parent is refused with a 400 and stores nothing … The invariant *attached ⇒ has a parent* holds in the stored row."
  - §1 again: silently accepting such a flag "would leave a stray flag on the row that later attaches the item the instant it gains a parent". That is exactly what happens today.
  - §4: "Omitting the flag keeps the item's current state … Nothing attaches by default."
- **Tests that pin the code's behavior:**
  - items:1202 'creates a parentless item with isAttached true (the default) and respects its explicit workphaseId' expects a 201 with `isAttached: 1`.
  - attachedUI:328 'the Parent dropdown excludes descendants, and reparenting nests the item under its new parent'. The Sheet's picker sends only `parentId`, and the top-level Item A ends up nested in Item B, i.e. Attached.
- **A test that sidesteps it:** hier:293 'a Free item can be reparented and stay Free…' creates `X` with `isAttached: false` explicitly. An item created the ordinary way would attach.
- **What it affects:**
  - ATT-3.9's top-level variant fails today.
  - The stored-row half of ATT-1.8.
  - Candidate new case 1.
- **Why it's a ruling.** Per the README ("When a test for a case fails"), the page is clear, so the PO rules on the wiki against the code.
- **The cost of a code change.** It touches:
  - the create route;
  - the primitive's handling of a parentless row's flag;
  - the schema default, and the existing rows;
  - items:1202 and attachedUI:328.

  A3's Acceptance says it restructures no code, so the fix probably wants its own story. Batch 3's DRAG-4.29 and 4.30 fixes were much smaller.
- **A second question inside it: what should the Sheet's picker send?** If Nathan wants the picker to attach, it should send `isAttached: true`. attachedUI:328 would then be a valid Free → Attached render test for ATT-1.7.

**Ruling B: tags on a Card.**
- §12 says a Card shows "title, description snippet, tags, and a collapsible list of descendant Stubs".
- `KanbanCard.tsx` renders the title and description, and no labels at all.
- So ATT-1.9's tags clause can't pass. Labels are provisional (the Tags rework).
- The options:
  - the PO marks the tags clause `**Planned:**`, and the Test Planner splits it out of ATT-1.9;
  - or the Card renders labels.

**Ruling C: D10's line for ATT-4.9.** The recommended test picks up and cancels a drag, and uses no precise cursor placement and no timer margin. See Gaps.

**Heads-ups, with no ruling asked:**
- **ATT-8.3.** Open question 9 is answered in the wiki (§11a, "Creating an item with a parent counts"), but the case is still `Pending PO` in its file, so this run skips it. `POST /items` logs only its 'Created' entry today, so ATT-8.3's first test will fail until the create path logs a hierarchy entry.
- **ATT-1.5 and ATT-6.3** say nothing is written on the child "beyond the cascaded `workphaseId`". The cascade also bumps `updatedAt`. A test that compares the whole row will fail on it. The Test Planner should say whether `updatedAt` is part of the cascade (ATT-2.1, by contrast, names "any modification timestamp" explicitly).
- **ATT-4.7** says an over-cap tree loads when "shown in the sidebar". The project sidebar lists projects, not items, so that clause has no surface today.

---

## Coverage Mapping

No test title starts with an ATT ID today. Fifteen hier titles and four internal titles carry ATT IDs mid-title, in parentheses. The "Tests" column names the tests I propose to stamp. Other tests that also touch a case are in Duplication.

### ATT-1: Free / Attached state model

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| ATT-1.1 | P1 | items:638 'GET returns positionScope = "workflow" for a detached item in a non-terminal workphase (TC-2.14)' (its item is top-level); attachedUI:12 'shows attached children nested under the parent card, and the toggle collapses them' (top-level 'Parent Card' is an article) | `positionScope = "workflow"`; renders as a Card | Nothing. For a top-level item, "its own workphase governs it" means only the workphase it holds, and ATT-1.8 holds the "can't leave Free" clause | Stamp |
| ATT-1.2 | P0 | hier:236 'detaches with placement into the workflow scope, keeping the parent (TC-7.13, ATT-7.1)'; attachedUI:40 'a detached child renders as its own top-level card, not nested' | A detached child: `positionScope = "workflow"`, keeps its workphase, renders as an article | That it isn't *also* drawn as a Stub inside its parent's Card: the title says "not nested", but the body only checks the article | Stamp + A3 UI |
| ATT-1.3 | P0 | items:1004 'moving a parent cascades through attached children and grandchildren'; items:1058 'a detached child halts the cascade for its whole branch' | C1 and C2 follow; a detached child and its branch don't | Nothing. The detached child sits under the root rather than under C1, and the rule is the same | Stamp |
| ATT-1.4 | P0 | items:1034 'an attached child keeps its position (and stays out of Part 6 done-tracking) when its parent cascades into a terminal workphase (TC-6.5)' | Workphase terminal, `completedAt` null, position unchanged | `positionScope` still `"attached-siblings"` (only scopeLib:11 asserts it, at the lib) | Stamp + A3 route |
| ATT-1.5 | P1 | items:1034 | Done half: terminal workphase inherited, `completedAt` null, position kept | The reopen half: `P` back in a non-terminal workphase, and the child reads not done with nothing else written (see the `updatedAt` heads-up) | Stamp + A3 route |
| ATT-1.6 | P0 | items:1058 | `workphaseId` unchanged when `P` moves between non-terminal workphases | `position` and `completedAt` unchanged; `P` into a terminal workphase and back out; `D` with `completedAt` set | Stamp + A3 route |
| ATT-1.7 | P0 | hier:194 'attaches with placement: every field and the cascade land in one commit (TC-7.11, ATT-3.6)'; hier:236; attachedUI:366 "unchecking Attached in the item's own panel detaches it onto the board" | Free → Attached data in one response (inherited workphase, `"attached-siblings"`, a position from `P`'s list); Attached → Free data (hier:236) and its Card render (attachedUI:366) | Free → Attached render: `X` shows as a Stub inside its nearest Free ancestor's Card, not as a Card | Stamp + A3 UI |
| ATT-1.8 | P0 | hier:115 'rejects isAttached: true with no resulting parent (ATT-1.1)'; hier:668 'PUT rejects a parentless attach (ATT-1.1)'; hier:306 'reparent to root (parentId: null) clears the flag and re-resolves a workflow position (wiki §11)' | 400 for a parentless attach (move and PUT) and for attach-and-clear in one write; clearing `parentId` clears the flag | "Nothing is stored: `X` is unchanged". The root refusals assert status only; attach-and-clear asserts `parentId` only. Both titles misattribute the rule to ATT-1.1 | Stamp + A3 route |
| ATT-1.9 | P2 | attachedUI:12; attachedUI:177 'the child badge counts only attached children and nesting recurses through grandchildren' | Child and grandchild Stubs inside `P`'s Card; the list collapses; the attached child isn't an article | `P`'s description snippet and **tags** (Ruling B); each Stub's title; that `S1a` is nowhere outside `P`'s Card | Stamp + A3 UI (tags: Ruling) |

### ATT-2: Reparenting is one-way

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| ATT-2.1 | P0 | none. hier:194 and :214 check the siblings' positions, never the target's row | — | All of it: `B`'s whole row, `updatedAt` included, unchanged after `A` attaches to it | A3 route |
| ATT-2.2 | P0 | hier:84 'rejects the item itself and its descendants as parents; accepts moving up the tree (ATT-4.2, ATT-4.3)'; hier:100 'enforces the depth cap on move: exactly CAP is legal, CAP + 1 is not (ATT-4.4)'; hier:381 'cascades projectId to the whole subtree, detached descendants included, and places normally (ATT-5.1, ATT-5.2, TC-7.14)' | The cycle check runs from the mover's side (`A` under `B`/`C` is refused; `C` under `A` is accepted). The cap uses the mover's height and the target's depth: swapping them would accept hier:100's refused move. The target's project cascades onto the mover's subtree | — | Stamp |

### ATT-3: Reparent placement and atomic commit

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| ATT-3.1 | P0 | hier:214 "reparents while attached against the NEW parent's scope, never the old (TC-7.12, ATT-3.5)"; items:376 'reparenting while staying attached reassigns a fresh position scoped to the new parent' | Anchored: between `B1` and `B2`, not 3.0. Unanchored (PUT): 2.0, past `B`'s child, not the old 1.0 | — | Stamp |
| ATT-3.4 | P2 | none | — | All of it | A3 route |
| ATT-3.5 | P0 | hier:214 | The case's own fixture; `B1` and `B2` untouched | — | Stamp |
| ATT-3.6 | P0 | hier:194; hier:381 | Every field, and `X1`'s cascade, from one move; the project cascade in the same commit | — | Stamp |
| ATT-3.7 | P0 | hier:164 'rejects an anchor outside the resulting scope, committing nothing (TC-7.10, ATT-3.7)'; hier:534 'a depth-cap rejection leaves the item and its subtree byte-identical (ATT-3.7)' | The full rows of `X` and `X1` unchanged after an anchor rejection and after a depth-cap rejection; nothing logged | — | Stamp |
| ATT-3.9 | P0 | hier:293 'a Free item can be reparented and stay Free; without an anchor its position is untouched (wiki §4)'; hier:214 | A top-level `X` created with the flag clear stays Free when the flag is omitted. An attached `Y` stays attached when the flag is omitted, positioned among `B`'s Stubs | `X` as a detached child of `A`; `X` as a top-level item created without the flag (**fails today, Ruling A**); Attached → Free and Attached → Attached with an explicit flag (Free → Free and Free → Attached are asserted at hier:520 and hier:194); `X` renders as a Card | Stamp + A3 route (Ruling A) |
| ATT-3.10 | P1 | hier:293 | The no-anchor half | The anchored half | Stamp + A3 route |

### ATT-4: Legal parents and the depth cap

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| ATT-4.1 | P0 | hier:75 'rejects a parentId naming no item, and stores nothing (ATT-4.1)' | 400; `parentId` still null | — | Stamp |
| ATT-4.2 | P0 | hier:84 | 400; `parentId` unchanged | — | Stamp |
| ATT-4.3 | P0 | hier:84 | Direct child and deeper descendant refused (one attached, one detached); moving up accepted | — | Stamp |
| ATT-4.4 | P0 | hier:100; hier:534 | `CAP` accepted; `CAP + 1` refused with "exceeds the cap"; the full rows unchanged | — | Stamp |
| ATT-4.5 | P0 | No route test. The UI half exists: classify:35 (DRAG-2.3's fixture counts `X → D → D1`). Internal: itemTree:85, dragClassification:87 | The UI's classification counts the detached branch | The API: the move is accepted if and only if `D + 1 + 2 <= CAP` | A3 route |
| ATT-4.6 | P1 | Internal only: itemTree:75 'a root item is at depth 1 and a leaf has height 0 (ATT-4.6)'; client counterpart clientHierarchy:55, :61 | The whole *Then*, at the lib | — | Internal |
| ATT-4.7 | P1 | none | — | All of it (and see the sidebar heads-up) | A3 route |
| ATT-4.9 | P0 | none. classify:35 classifies every target, but nothing replays those targets at the API | — | All of it | See Gaps |
| ATT-4.10 | P0 | Move: hier:75, :84, :100. PUT: items:1142 'rejects reparenting to a non-existent parentId', items:1127 'rejects an item becoming its own parent or reparenting to a descendant', hier:649 'PUT enforces the depth cap'. POST: items:106 'returns 400 for a non-existent parentId instead of storing an invisible orphan', hier:658 'POST enforces the depth cap: a child at depth CAP is fine, CAP + 1 is refused' | Every rule is refused at every write that can break it. POST under a parent at depth `CAP − 1` is accepted, and under one at `CAP` is refused | "Nothing is stored in any of them" for PUT and POST: the PUT refusals assert status only (no row check), and the POST refusals don't show that no item was created | Stamp + A3 route |
| ATT-4.11 | P1 | Internal: itemTree:122 'an already-over-cap subtree is refused for every target, even a root (§8 strict)'. It moves a depth-1 mover under a root, which is deeper, not shallower, and doesn't assert `M` unchanged | — | All of it, at the API | A3 route |

### ATT-5: Cross-project and cross-workflow

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| ATT-5.1 | P0 | hier:381 | 200; `projectId = P2`; `X1`'s workphase is `Q`'s, which implies `X`'s | `X.parentId`, the attached flag and `X.workphaseId` in the response | Stamp + A3 route |
| ATT-5.2 | P0 | hier:381; hier:675 'PUT cascades projectId to detached descendants on a cross-project reparent (ATT-5.2)' | All of it: four `projectId`s after one move; `X1` takes `Q`'s workphase; `X2` and `X2a` keep theirs | — | Stamp |
| ATT-5.4 | P1 | hier:421 'a Free reparent keeps every workphase, nulls foreign positions, and surfaces as Unknown status on the new board' | All of it, including Unknown status on `P2`'s board | — (`X2` shares `X`'s workphase in the fixture; both are asserted unchanged) | Stamp |
| ATT-5.5 | P1 | hier:453 "an attached reparent inherits the new workflow's workphase; only detached descendants are left foreign" | `X` and `X1` take `B`'s workphase; `X2` keeps its own; 1.0 in `PB`'s empty Stub list | `X` starting attached to `A` (the test's `X` is Free and attaches with the flag); `projectId = P2` on `X`, `X1` and `X2` | Stamp + A3 route |

### ATT-6: Attaching to a done parent

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| ATT-6.1 | P0 | hier:334 'attaching to a done parent inherits the terminal workphase, no completedAt, keeps a position (ATT-6.1, TC-7.15)' | Anchored attach: the done workphase, `completedAt` null, a position between `S1` and `S2` | `parentId`, the attached flag, `positionScope`; `P.completedAt` set in the *Given*; the attach with no anchor | Stamp + A3 route |
| ATT-6.2 | P1 | hier:334 | `completedAt` null; a real position | `positionScope` still `"attached-siblings"`, not `"none"` | Stamp + A3 route |
| ATT-6.3 | P1 | none | — | All of it (and see the `updatedAt` heads-up) | A3 route |

### ATT-7: Detaching preserves the parent, and severing it

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| ATT-7.1 | P0 | hier:236 | The flag is clear; `parentId` is still `P` | — | Stamp |
| ATT-7.2 | P0 | hier:236; items:354 'detaching reassigns a fresh position scoped to the workphase' | Anchored: between `F1` and `F2`, `"workflow"`. Unanchored: appended | — | Stamp |
| ATT-7.3 | P0 | hier:236; attachedUI:279 'detaching a child via the detail panel keeps it in place when the parent moves' | Keeps the workphase it held; stays there when `P` moves | — | Stamp |
| ATT-7.4 | P1 | items:365 'detaching into a terminal workphase clears position and sets completedAt' | The detach-in-place half, under a done parent | A detached child (`parentId` still `P`) moving to a terminal workphase | Stamp + A3 route |
| ATT-7.5 | P0 | hier:214. The board side is detach:248 (DRAG-5.4, `Automated` in board-drag) | An attached reparent stays attached and lands among the new parent's Stubs | At the API: `parentId = Q`; a workphase inherited from a `Q` in a *different* workphase; one write that never passes through Free with `parentId = P` (exactly one "Reparented" entry, no "Detached") | Stamp + A3 route |
| ATT-7.6 | P0 (✅) | hier:277 'a detached child re-attached to the parent it still names is a real attach (ATT-7.6)'; hier:264 'a redundant re-attach to the same parent is not a scope change and keeps its position' | All of it: attached, workphase re-inherited, `"attached-siblings"`, last, the 'Attached to "P"' entry; and the contrast (the redundant re-attach keeps position 1.0 and logs nothing) | — | Stamp |
| ATT-7.7 | P0 | hier:306; hier:321 'reparent to root from under a done parent makes it a done Free item (wiki §11)'; items:1218 'reparenting to null while attached clears isAttached and keeps the workphase (wiki §1, §11)' | All of it, by move and by PUT, and the terminal case | — | Stamp |
| ATT-7.8 | P1 | none | — | All of it | A3 route |

### ATT-8: Hierarchy changes are logged

| Case | P | Tests | Asserted | Missing | Outcome |
|---|---|---|---|---|---|
| ATT-8.1 | P1 | hier:550 'logs attach, detach, reparent and top-level with the right content, at both entry points'; hier:277; hier:410 'records the project change in the hierarchy activity entry' | The four kinds, one entry each, with parent names. Attach and reparent by move; detach by PUT and by move; top-level by PUT | Attach and reparent by PUT; top-level by move; a Free reparent `P → Q`; nothing recorded on `P` or `Q` | Stamp + A3 route |
| ATT-8.2 | P2 | hier:264 | `Y`'s redundant re-attach logs nothing | `X` (Free under `P`): a workphase change and a reposition log no hierarchy entry | Stamp + A3 route |
| ATT-8.3 | P2 | — | Skipped (`Pending PO`) | — | — |

---

## Lost Coverage

- **item-attachment:** no case is `Automated`, so none can have lost coverage. ATT-7.6's ✅ is backed: hier:277 and hier:264 assert all of it. hier:277 carries "ATT-7.6" only mid-title, so by the README's rule no test carries the ID until the Coder moves it to the front.
- **board-drag-interaction:** all 42 `Automated` cases still have at least one test whose title starts with their ID. Checked: DRAG-1.3, 1.4, 1.7, 1.8, 1.10, 1.11, 1.23, 1.25, 1.30; 2.1, 2.2, 2.3, 2.7, 2.10; 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 3.15, 3.21; 4.8, 4.9, 4.10, 4.11, 4.18, 4.19, 4.23, 4.29, 4.30; 5.4, 5.5, 5.12; 6.1, 6.5, 6.10, 6.12, 6.13. Nothing moves back to `Open`.
- **item-positioning:** still on legacy ✅ marks, which are batch 5's to convert. It has no `Automated` case to check.
- **`Manual` cases carried by a test:** none. No test carries DRAG-1.29, 1.32, 4.24 or 4.25, and item-attachment has no `Manual` case.

## Unknown IDs

**In test titles:** one, the known ATT-3.3 at hier:254 'attaching into an empty Stub list takes the append fallback — bootstrap 1.0 (TC-7.7, ATT-3.3)'. Every other DRAG, ATT and TC ID in a title, at the front or mid-title, names a case that exists.

**Elsewhere:**
- The three known comment references to ATT-4.8: dragClassification:8, itemTree:73, boardsRoute:93.
- **In the catalog, for batch 5's Test Planner:** `docs/test-plans/item-positioning/cross-cutting-regression.md` line 63 reads "ATT-5.1–5.3". The range ends on the deleted ATT-5.3. The checker doesn't read a range's tail (D7), so it can't catch this.

**Tests that cover a deleted case, and the live case each maps to.** No test outside the four known references carries a deleted ATT ID.

| Deleted | Now owned by | Tests that assert its rule |
|---|---|---|
| ATT-3.2 (anchor + side; first/last are the client's choice of anchor) | TC-7.1, TC-7.2 | None carried ATT-3.2. The board side is DRAG-3.1 and 3.2 (`tests/ui/drag-column-bands.spec.ts:244`, `Automated`). dragRequest:127 "first/last resolve to a concrete anchor beside others' own edge (DRAG-3.1, 3.2)" carries them mid-title, with no approved mapping |
| ATT-3.3 (append fallback into an empty target) | TC-7.7 | hier:254 (known). hier:453 and hier:357 also land at 1.0 in an empty Stub list, incidentally. They map to ATT-5.5 and to candidate 2 below |
| ATT-3.8 (resync on a rejection) | DRAG-6.6 | dragRequest:276 already carries DRAG-6.6. No other |
| ATT-4.8 (one `CAP` for the UI and the API) | DRAG-2.10 | boardsRoute:95 and classify:35 already carry DRAG-2.10. Also the three known comments |
| ATT-5.3 (a cross-project reparent's position) | TC-7.14 | hier:381 already carries TC-7.14. `tests/api/itemRepositioningCrossProject.spec.ts` and `tests/ui/item-repositioning-cross-project-dnd.spec.ts` move Free items across sibling projects with no reparent. Those are item-positioning's, not ATT-5.3's |

---

## Proposed Stamps

These are surface tests, so no approval is needed. Each proposed title keeps the rest of its text and drops the parenthesized IDs the stamp replaces. ATT IDs come first, then any TC ID the title already carries. **[+TC]** marks a test that covers an ATT case and a TC case both. The TC IDs are batch 5's to map.

### hier (`server/tests/routes/items.hierarchy.test.ts`)

| Line | Current title (start) | Proposed stamp | Note |
|---|---|---|---|
| 75 | 'rejects a parentId naming no item, and stores nothing (ATT-4.1)' | `ATT-4.1, ATT-4.10:` | |
| 84 | 'rejects the item itself and its descendants as parents; accepts moving up…' | `ATT-2.2, ATT-4.2, ATT-4.3, ATT-4.10:` | |
| 100 | 'enforces the depth cap on move: exactly CAP is legal, CAP + 1 is not (ATT-4.4)' | `ATT-2.2, ATT-4.4, ATT-4.10:` | |
| 115 | 'rejects isAttached: true with no resulting parent (ATT-1.1)' | `ATT-1.8:` | Drops the misattributed ATT-1.1 |
| 164 | 'rejects an anchor outside the resulting scope, committing nothing (TC-7.10, ATT-3.7)' | `ATT-3.7, TC-7.10:` | [+TC] |
| 194 | 'attaches with placement: every field and the cascade land in one commit (TC-7.11, ATT-3.6)' | `ATT-1.7, ATT-3.6, TC-7.11:` | [+TC] |
| 214 | "reparents while attached against the NEW parent's scope… (TC-7.12, ATT-3.5)" | `ATT-3.1, ATT-3.5, ATT-3.9, ATT-7.5, TC-7.12:` | [+TC]; partial for 3.9 and 7.5 |
| 236 | 'detaches with placement into the workflow scope, keeping the parent (TC-7.13, ATT-7.1)' | `ATT-1.2, ATT-1.7, ATT-7.1, ATT-7.2, ATT-7.3, TC-7.13:` | [+TC]; partial for 1.2 and 1.7 |
| 254 | 'attaching into an empty Stub list takes the append fallback — bootstrap 1.0 (TC-7.7, ATT-3.3)' | `TC-7.7:` | Drops the deleted ATT-3.3 (known); no live ATT case |
| 264 | 'a redundant re-attach to the same parent is not a scope change and keeps its position' | `ATT-7.6, ATT-8.2:` | |
| 277 | 'a detached child re-attached to the parent it still names is a real attach (ATT-7.6)' | `ATT-7.6, ATT-8.1:` | |
| 293 | 'a Free item can be reparented and stay Free; without an anchor its position is untouched (wiki §4)' | `ATT-3.9, ATT-3.10:` | Partial for both; "(wiki §4)" can go |
| 306 | 'reparent to root (parentId: null) clears the flag and re-resolves a workflow position (wiki §11)' | `ATT-1.8, ATT-7.7:` | |
| 321 | 'reparent to root from under a done parent makes it a done Free item (wiki §11)' | `ATT-7.7:` | |
| 334 | 'attaching to a done parent inherits the terminal workphase… (ATT-6.1, TC-7.15)' | `ATT-6.1, ATT-6.2, TC-7.15:` | [+TC]; partial for both |
| 381 | 'cascades projectId to the whole subtree… (ATT-5.1, ATT-5.2, TC-7.14)' | `ATT-2.2, ATT-3.6, ATT-5.1, ATT-5.2, TC-7.14:` | [+TC]; partial for 5.1 |
| 410 | 'records the project change in the hierarchy activity entry' | `ATT-8.1:` | Partial |
| 421 | 'a Free reparent keeps every workphase, nulls foreign positions, and surfaces as Unknown status…' | `ATT-5.4:` | Its "nulls foreign positions" is item-positioning §7.3's; batch 5 may add a TC ID |
| 453 | "an attached reparent inherits the new workflow's workphase; only detached descendants are left foreign" | `ATT-5.5:` | Partial |
| 534 | 'a depth-cap rejection leaves the item and its subtree byte-identical (ATT-3.7)' | `ATT-3.7, ATT-4.4:` | |
| 550 | 'logs attach, detach, reparent and top-level with the right content, at both entry points' | `ATT-8.1:` | Partial |
| 649 | 'PUT enforces the depth cap' | `ATT-4.10:` | Partial |
| 658 | 'POST enforces the depth cap: a child at depth CAP is fine, CAP + 1 is refused' | `ATT-4.10:` | Partial |
| 668 | 'PUT rejects a parentless attach (ATT-1.1)' | `ATT-1.8:` | Drops the misattributed ATT-1.1 |
| 675 | 'PUT cascades projectId to detached descendants on a cross-project reparent (ATT-5.2)' | `ATT-5.2:` | |

### items (`server/tests/routes/items.test.ts`)

| Line | Current title (start) | Proposed stamp | Note |
|---|---|---|---|
| 106 | 'returns 400 for a non-existent parentId instead of storing an invisible orphan' | `ATT-4.10:` | Partial. ATT-4.1 is whole at hier:75 |
| 354 | 'detaching reassigns a fresh position scoped to the workphase' | `ATT-7.2:` | The title says "workphase", but the scope is the workflow (Test Quality 5) |
| 365 | 'detaching into a terminal workphase clears position and sets completedAt' | `ATT-7.4:` | Partial |
| 376 | 'reparenting while staying attached reassigns a fresh position scoped to the new parent' | `ATT-3.1:` | TC-2.21's pointer names this test; batch 5 may add it |
| 638 | 'GET returns positionScope = "workflow" for a detached item in a non-terminal workphase (TC-2.14)' | `ATT-1.1, TC-2.14:` | [+TC] |
| 1004 | 'moving a parent cascades through attached children and grandchildren' | `ATT-1.3:` | |
| 1034 | 'an attached child keeps its position (and stays out of Part 6 done-tracking)… (TC-6.5)' | `ATT-1.4, ATT-1.5, TC-6.5:` | [+TC]; partial for both |
| 1058 | 'a detached child halts the cascade for its whole branch' | `ATT-1.3, ATT-1.6:` | Partial for 1.6 |
| 1127 | 'rejects an item becoming its own parent or reparenting to a descendant' | `ATT-4.10:` | Partial |
| 1142 | 'rejects reparenting to a non-existent parentId' | `ATT-4.10:` | Partial |
| 1218 | 'reparenting to null while attached clears isAttached and keeps the workphase (wiki §1, §11)' | `ATT-7.7:` | "(wiki §1, §11)" can go |

### attachedUI (`tests/ui/attached-children.spec.ts`)

| Line | Current title (start) | Proposed stamp | Note |
|---|---|---|---|
| 12 | 'shows attached children nested under the parent card, and the toggle collapses them' | `ATT-1.1, ATT-1.9:` | Partial for 1.9 |
| 40 | 'a detached child renders as its own top-level card, not nested' | `ATT-1.2:` | Partial |
| 177 | 'the child badge counts only attached children and nesting recurses through grandchildren' | `ATT-1.9:` | Partial |
| 279 | 'detaching a child via the detail panel keeps it in place when the parent moves' | `ATT-7.3:` | |
| 366 | "unchecking Attached in the item's own panel detaches it onto the board" | `ATT-1.7:` | Partial |

**Counts:** 40 ATT stamps on surface tests (24 in hier, 11 in items, 5 in attachedUI), plus hier:254, which only drops ATT-3.3. Eight of them also keep a TC ID. If every stamp lands, 18 cases are `Automated` at the confirming run with no new test.

**Not stamped on purpose.** They'd only add a file to a pointer line for a case other tests already cover (Stop 1):
- attachedAPI:10, :47, :66, :81;
- items:388, :1077, :1097, :1155, :1167, :1187;
- detach:248;
- dragRequest:69 (see Internal Mappings).

They're listed in Duplication.

### For the Coder (step 3)

- **Misattributed IDs:** hier:115 and hier:668 say ATT-1.1, but assert ATT-1.8's rule.
- **References to deleted cases** (known): hier:254's ATT-3.3; the ATT-4.8 comments at dragClassification:8, itemTree:73 and boardsRoute:93, which re-point to DRAG-2.10.
- **hier line 14** reads "(TC-7.n)" in the file's header comment. It's the bare-`TC-n` hit the plan left for batch 4 or 5. The file is touched in this batch, so under Nathan's ruling it's qualified here. The same header's "Epic 3.5 Story 1" is A4's.
- **Provenance in titles.** None of the titles proposed for a stamp carries a story, audit ID or date. One wrapper does: items:305's `describe('Epic 3.2 — position resolution', …)` holds items:354, :365, :376 and :638, so its "Epic 3.2 —" should go when those are stamped.
- **Provenance in the same files, not proposed for a stamp.** These are batch 5's or batch 6's, unless the Coder strips them while in the file:
  - hier:179 '(audit epic-3-5-story-1 #2)';
  - items:115 '(finding #11)';
  - items:925 '(finding #27 — …)';
  - items:1111 '(finding #10)';
  - items:509 `describe` '(Finding #7)';
  - attachedUI:213 '(audit test-coverage-gap #2)'.
- **Wiki pointers in titles.** "(wiki §4)", "(wiki §11)" and "(wiki §1, §11)" are redundant once a title carries the case ID. Dropping them is optional.

---

## Proposed Internal Mappings (need approval)

1. **ATT-4.6 → itemTree:75** 'a root item is at depth 1 and a leaf has height 0 (ATT-4.6)'. Stamp: `ATT-4.6: a root item is at depth 1 and a leaf has height 0`.
   - It asserts exactly the *Then*: `hierarchyDepth(root) = 1`, `subtreeHeight(leaf) = 0`, and the check passes for `1 + 1 + 0`.
   - **Why internal.** The API's only depth readout, `depth` on `GET /items/:id`, counts from 0 (items:25 pins root = 0 and child = 1). A route test can pin the cap's counting only through the boundary, which ATT-4.4's hier:100 and ATT-4.10's hier:658 already do.
   - With approval, ATT-4.6 is `Automated`. The client counterpart, clientHierarchy:55 'a root is at depth 1; depth counts the ancestor chain' and :61 'a leaf has height 0…', could carry the ID too. It isn't needed.
2. **ATT-7.6's existing pointer to dragRequest** is approved, since it already exists.
   - **Recommendation:** don't stamp dragRequest:69. hier:277 and hier:264 make ATT-7.6 `Automated` alone, so under Stop 1 its pointer line becomes `server/tests/routes/items.hierarchy.test.ts` only.
   - dragRequest:69 "a detached child re-attaching to its own former parent is not identity…" guards the board's half: the client doesn't read "same `parentId`" as a no-op. DRAG-4.1's "And given `X` is a detached child of `P`" clause states that half, and DRAG-4.1 is routed to Story 10.
   - If Nathan wants it under ATT-7.6 anyway, stamp it `ATT-7.6:`.
3. **Internal titles carrying an ATT ID mid-title, with no mapping proposed.** They're supporting only. Following batch 3's precedent, the Coder leaves them, and the confirming run lists rather than maps them:
   - itemTree:85 (ATT-4.5): asserts the height, not the move;
   - itemTree:94 (ATT-4.4): route tests cover it;
   - dragClassification:87 (ATT-4.5): classify:35 covers the UI half at the surface.

   itemTree:122 asserts ATT-4.11's rule only in part (Coverage Mapping) and isn't proposed either.

## Proposed Manual (need approval)

None. Every rule on this page reduces to stored fields, response bodies, activity entries or what the board renders. None depends on feel or on a tuned value.

---

## Gaps

### A3, route or API test (22 cases)

**Partly asserted.** Extend a stamped test or write a new one; that's the Coder's call. Each item says roughly what the missing part asserts.

| Case | P | What the test asserts |
|---|---|---|
| ATT-1.4 | P0 | After `P` cascades into a terminal workphase, the child reads `positionScope = "attached-siblings"`. One assertion on items:1034 |
| ATT-1.5 | P1 | `P` moves back to a non-terminal workphase: the child's `workphaseId` follows, `completedAt` is still null, position unchanged, and nothing else written (the `updatedAt` heads-up applies) |
| ATT-1.6 | P0 | Detached `D`, with its own workphase and position, and a variant with `completedAt` set: all three fields identical after `P → W2`, `P →` Done, and `P →` back out |
| ATT-1.8 | P0 | The full stored row is unchanged after each refusal: a top-level `X` with `isAttached: true` (move and PUT), and `X` attached to `P` with `{parentId: null, isAttached: true}` |
| ATT-3.9 | P0 | Blocked on **Ruling A**. Flag omitted: a detached child of `A`, and a top-level item created *without* the flag, each reparented to `B`, stay Free (`isAttached` 0, `"workflow"`, their own workphase). With the flag: Attached → Free and Attached → Attached land as named. "Renders as a Card" is a UI clause; attachedUI:328 is its natural home once Ruling A settles what the picker sends |
| ATT-3.10 | P1 | A Free `X` reparented with an anchor and side lands between the anchor and its neighbor in the workflow scope, still Free |
| ATT-4.10 | P0 | PUT refusals (a missing parent, itself, a descendant, depth): the row is unchanged. POST refusals (a missing parent, depth): no item with that title exists afterward |
| ATT-5.1 | P0 | hier:381's response: `parentId = Q`, `isAttached = 1`, `workphaseId` = `Q`'s |
| ATT-5.5 | P1 | `X` attached to `A` in `P1`/`W1`, reparented to `B` in `P2`/`W2` with the flag omitted: `X` and `X1` take `w2`; `X` is among `B`'s Stubs; `X2` keeps `w1b`; all three have `projectId = P2` |
| ATT-6.1, ATT-6.2 | P0, P1 | hier:334: `parentId = P`, `isAttached = 1`, `positionScope = "attached-siblings"`; `P.completedAt` non-null in the *Given*; a second attach with no anchor lands last among `P`'s Stubs |
| ATT-7.4 | P1 | A detached child (`parentId = P`) moved to Done gets `completedAt` set and `position` null, and keeps `parentId = P` |
| ATT-7.5 | P0 | `X` attached to `P` (in `W1`); `Q` in `W2`, with Stubs. One move to `Q`: `parentId = Q`, attached, `W2`, a position among `Q`'s Stubs. `X`'s hierarchy entries are exactly one 'Reparented from "P" to "Q" (attached)' |
| ATT-8.1 | P1 | Attach, detach, reparent (attached and Free) and top-level, each by PUT *and* by move: exactly one entry per write, naming the parents; no entry on `P` or `Q` |
| ATT-8.2 | P2 | `X`, Free under `P`: a workphase move and an anchored reposition add no `hierarchy_change` entry (a `status_change` is fine) |

**No test yet.**

| Case | P | What the test asserts |
|---|---|---|
| ATT-2.1 | P0 | `A` attaches to `B` (move; PUT too if cheap): `B`'s stored row identical before and after, `updatedAt` included |
| ATT-3.4 | P2 | `X`, alone under `A` at 1.0, and a childless `B`. Move `X` to `B` with the flag omitted: 200, `parentId = B`, attached, `"attached-siblings"`, position 1.0, one 'Reparented' entry (so it wasn't a no-op); `A` has no attached children left |
| ATT-4.5 | P0 | `M` with attached `M1`, and detached `M2` with its child `M2a`. Under a target at depth `CAP − 3`: 200. Under a target at depth `CAP − 2`: 400 "exceeds the cap", and `M` unchanged |
| ATT-4.7 | P1 | An over-cap chain seeded directly, as itemTree's `seedChain` does, since no write can produce one. `GET /items/:id` and `GET /boards/:id` return every member, unflagged. A workphase move of the tree's Free root, an anchored reorder among attached siblings, and a title edit each return 200. An attached member's own workphase can't be moved (hier:130), so the workphase move is the root's |
| ATT-4.11 | P1 | A chain of `CAP + 2` seeded directly; `M = L3` (depth 3, height `CAP − 1`). Move `M` under a root item: 400, and `M`'s row unchanged |
| ATT-6.3 | P1 | `X` attached to a done `P`; `P` moves to a non-terminal workphase: `X.workphaseId` follows, `completedAt` null before and after, position unchanged (the `updatedAt` heads-up applies) |
| ATT-7.8 | P1 | A detached child of `P` at 7.5, set to `{parentId: null}`: top-level, position still 7.5. The same with an anchor: between the anchor and its neighbor |

### A3, UI without a drag (3 cases)

For Nathan to rule on apart from the rest. Each uses only a board render, or the item panel's controls.

| Case | P | What the test asserts |
|---|---|---|
| ATT-1.2 | P0 | Extend attachedUI:40: 'Parent With Detached''s Card doesn't show 'Detached Kid' among its Stubs |
| ATT-1.7 | P0 | Detached `X` under `P`, where `P` is itself a Stub of Free Card `G`. Checking "Attached" in `X`'s own panel makes `X` render inside `G`'s Card (its nearest Free ancestor) and never as an article. If Ruling A has the picker send the flag, attachedUI:328 already shows this |
| ATT-1.9 | P2 | `P` with a description and a label, Stub `S1`, and `S1`'s Stub `S1a`. `P`'s Card shows its title, the description snippet, the label, and both Stubs by title. Neither Stub is an article anywhere. **The label half is blocked on Ruling B** |

### ATT-4.9: the UI and the API agree on every target's legality (P0)

The rule spans both layers, so the test has to read the UI's answer and put each target to the API. Two ways to close it:

- **(a) Recommended: extend classify:35, the DRAG-2.1/2.2/2.3/2.7/2.10 spec.**
  - During its pickup, collect every `[data-drop-state]` row's item id and state. Then cancel.
  - Replay each target with `PATCH /items/:id/move` for `X`: every `valid` target returns 200 (put `X` back with `{parentId: null}` afterward), and every `cycle-forming` and `depth-capped` target returns 400 with `X`'s row unchanged.
  - The fixture already has all three states, a detached branch and a Stub chain, and the spec seeds `NO_POP`.
  - **Its drag is a pickup and a cancel only**, with no precise cursor placement and no timer margin. D10 would put it in A3, and Story 10's own text exempts "classification/overlay assertions" from its deferral. But Stop 1 sent every UI drag gap to Story 10, including DRAG-2.4–2.9's classification tests. By that precedent it's **Story 10**. Ruling C.
- **(b) No drag.**
  - A `tests/api/` spec feeds the items `GET /boards/:id` returns, and its `itemDepthCap`, into `classifyDragTargets` (`client/src/components/workflow/dragClassification.ts`). It then replays every target against `PATCH /items/:id/move` the same way.
  - It proves the client's rule and the API's agree over a whole board. It doesn't prove the board draws what `classifyDragTargets` returns; classify:35 (DRAG-2.1–2.3, `Automated`) covers that wiring.
  - It calls a client module, so it needs Nathan's approval. **A3 if approved.**

### Story 10

None, unless Ruling C routes ATT-4.9 (a) there. No other gap needs a drag.

### Internal only (1 case)

- **ATT-4.6 (P1).** The counting is observable at the API only through the cap boundary, and ATT-4.4's route tests already pin that boundary. See Proposed Internal Mappings 1.

### Manual proposal

None.

---

## Duplication

Reported, not judged.

- **Parent legality across entry points and layers.**
  - Self and descendant: hier:84 (move), items:1127 (PUT), attachedAPI:66 'rejects reparenting an item to its own descendant' and attachedAPI:81 'rejects an item being its own parent' (PUT again, from Playwright).
  - A missing parent: hier:75 (move), items:1142 (PUT), items:106 (POST).
- **The depth cap on four layers:** hier:100 and :534 (route), itemTree:94 (server lib), dragClassification's `isWithinDepthCap` test and its `it.each` at line 78 (client), classify:35 (UI).
- **The detached-branch height on three layers:** itemTree:85, dragClassification:87, classify:35.
- **Root depth 1, leaf height 0:** itemTree:75 (server) and clientHierarchy:55, :61 (client). These are the two implementations the wiki's "the UI and the API always enforce the same `CAP`" relies on.
- **The attach cascade:** items:1004 (route), attachedAPI:10 (Playwright API), and attachedUI:213 'dragging a parent card across columns cascades its attached child (audit test-coverage-gap #2)' (UI drag, which polls the server).
- **Detached children don't follow their parent:** items:1058, attachedAPI:10, attachedUI:279.
- **A redundant re-attach keeps its position:** hier:264 and items:388 (TC-2.23).
- **Re-attaching a detached child to the parent it names:** hier:277 (move), items:1077 'reattaching snaps to the parent workphase and cascades to own attached descendants' (PUT), attachedAPI:47 "reattaching a child snaps it to the parent's current workphase" (PUT), and dragRequest:69 (client).
- **An attached reparent:**
  - hier:214 and items:376 (the position);
  - items:1097 'reparenting an attached item shifts it and its attached descendants to the new parent workphase' (the workphase, with the flag omitted);
  - detach:248 (the board gesture).
- **Cross-project cascade:** hier:381 (move), hier:675 and items:1155 'accepts reparenting under a parent in a different project and adopts its projectId (wiki §9)' (both PUT).
- **Inherit on create:** items:1167 and attachedAPI:10 (attached); items:1187 and items:43 (detached keeps its own).
- **Detach rendering:** attachedUI:366 (the panel) and detach:151 (drag, DRAG-5.1 and 5.10).
- **Overlap inside the catalog, for the Test Planner:**
  - ATT-1.5's reopen half and ATT-6.3 assert the same reopen, from two Givens.
  - ATT-1.4 and ATT-6.1/6.2 both pin "no `completedAt` under a terminal inheritance".
  - ATT-3.1 and ATT-7.5 are both an attached reparent.
  - ATT-3.5 shares TC-7.12's fixture, as the case says.
  - ATT-7.2 overlaps TC-2.19 and TC-7.13.

## Test Quality Concerns

1. **items:1202** 'creates a parentless item with isAttached true (the default) and respects its explicit workphaseId' asserts the opposite of wiki item-attachment §1: a 201 with the flag stored on a parentless item. It should verify ATT-1.8's refusal, extended to the create (candidate 1). Ruling A.
2. **attachedUI:328** 'the Parent dropdown excludes descendants, and reparenting nests the item under its new parent' asserts that a flagless reparent of a top-level item attaches it.
   - That contradicts wiki §4 and ATT-3.9. It passes only because of the stored default flag (Ruling A).
   - Its first half, that the picker excludes the item and its descendants, is sound §7 enforcement.
   - The picker also applies no depth cap, and lists only same-project items (candidate 7).
3. **hier:293** 'a Free item can be reparented and stay Free…' sets `isAttached: false` on create. It asserts §4 for a fixture the ordinary create never produces, so it can't catch the defect in Ruling A.
4. **hier:115 and hier:668** cite ATT-1.1, but assert ATT-1.8's rule (a parentless attach is refused). The stamps fix this.
5. **items:354** 'detaching reassigns a fresh position scoped to the workphase'. The scope is the workflow (wiki item-positioning §1), and the fixture has one workphase, so it can't tell the two apart. hier:236 asserts `positionScope = "workflow"`, which is why ATT-7.2 is still whole. The Coder can reword the title while stamping it.
6. **hier:658** 'POST enforces the depth cap: a child at depth CAP is fine…'. The "fine" half is asserted only by `createChain`'s `toBeDefined` on each link, not by a 201. It's implicit, but it holds.
7. **items:1155 and hier:675** are cross-project PUT reparents of a top-level item created with the default flag. Both silently attach it, and neither asserts the flag, so both pass whichever way Ruling A goes.
8. **hier:421.** `X2` holds the same workphase as `X`. Distinct workphases, as ATT-5.4 writes them (`w1b`), would pin "keeps its own" rather than "keeps `X`'s". It still passes the case, since both are asserted unchanged.
9. **dragRequest:69** asserts the client's identity check, not the write. That's fine for what it guards (see Internal Mappings 2), but it isn't evidence for ATT-7.6's *Then*.
10. **The API's `depth` field counts from 0** (items:25), while the cap counts roots at 1 (wiki §8). This is not a contradiction: the wiki doesn't define the field. But a route test for ATT-4.6 can't read the cap's depth off the API, which is why ATT-4.6 is internal.

## Uncatalogued Tests

**Guards and gate tests.** None corresponds to a standalone rule on this page, so no mapping is forced:
- hier:145 'rejects a non-boolean isAttached': request shape, the API contract epic's.
- items:58 'returns a bounded depth instead of hanging…'; itemTree:34, :40, :47 (`describe('cycle guards (Finding #11)', …)`); clientHierarchy:43 and :75. These guard against corrupted data, and several carry "Finding #11" in the title.
- items:1111 'a title-only PUT does not re-sync or relocate an attached child, even if its workphase diverged (finding #10)': a regression guard.
- items:1180 'an attached child of a parent with no workphase gets a null workphase': §2's inheritance applied to a null workphase. It's an edge of ATT-1.3; I left it unmapped.
- itemTree:114 'a brand-new item (movingId null) counts as height 0': internal support for ATT-4.10's create.
- items:25 'computes depth via the parent chain…': the API's display depth.
- items:925 'deleting a parent also deletes its detached descendants (finding #27 — …)': no wiki page covers deleting an item.
- attachedUI:128 'unchecking "Show attached children by default"…': a board setting. boards-columns-unsorted has no catalog (D11).
- attachedUI:59 'an attached child whose workphaseId goes invalid still renders only nested…': Unknown status is boards-columns-unsorted's. It also supports ATT-1.9's "no board position of its own", but isn't needed.
- attachedUI:213: supports ATT-1.3 through a board drag, and carries provenance in its title.

**Not this feature's:**
- hier:130 is candidate 3.
- hier:154, :179, :348 and the `describe('reindex disclosure …')` at hier:584 are item-positioning's (batch 5), as are items.test.ts's TC-2.x, 5.x, 6.x and X.x tests.

**Scenarios the catalog misses:** Candidate New Cases, below.

## Candidate New Cases

"TP gap" means the rule is already in the wiki. "PO gap" means the wiki doesn't state it.

1. **A top-level item is stored with the attachment flag clear, and a create that sets the flag with no parent is refused.**
   - Wiki §1 covers it ("has (or would have) no parent … the stored row"), with §7's "every write". **TP gap.**
   - ATT-1.8's *Given* starts from an existing item, so the create isn't covered.
   - The code and items:1202 do the opposite: Ruling A.
2. **Attaching a done Free item clears its `completedAt`, and takes the parent's workphase and a fresh sibling position.**
   - Wiki §2: "An Attached child never receives `completedAt`". The ATT cases cover only a child that goes under a terminal workphase while attached. **TP gap.**
   - Test: hier:357 'attaching a done Free item clears its completedAt (wiki §2)'.
3. **A `workphaseId` that contradicts the parent an attached item inherits from.**
   - `PATCH /move` refuses it: hier:130 'rejects a workphaseId that contradicts the parent an attached item inherits from; accepts a matching one'.
   - `POST` ignores it and uses the parent's: items:1167 'an attached child inherits the parent workphase even when a different one is passed'.
   - The wiki doesn't say whether the request is refused or ignored, and the two entry points disagree. **PO gap.**
4. **A child created under a parent takes the parent's project.**
   - When `projectId` is omitted, the child takes the parent's project: items:85 'inherits projectId from parentId when projectId is omitted' and itemsAPI:35 'POST /api/items inherits projectId from parent when omitted'. §9's "a hierarchy can't straddle two projects" implies it. **TP gap.**
   - An explicit, different `projectId` is refused: items:115 'rejects creating a child whose projectId differs from its parent (finding #11)'. §9 doesn't say whether a create naming a conflicting project is refused, or takes the parent's the way a reparent does. **PO gap.**
5. **`PATCH /move` refuses a workphase from another workflow, and a one-step reparent into another workflow's project that also names a workphase.**
   - Tests: hier:494 "rejects a workphaseId from a workflow the item's project does not use, and stores nothing" and hier:506 'rejects a one-step reparent into a different-workflow project that also names a workphaseId'. hier:520 is the allowed counterpart.
   - §9 says the API accepts cross-workflow reparenting, and names no limit on the move endpoint. **PO gap.**
6. **A hierarchy change that also changes the workphase logs a status entry too, at PUT as at move.**
   - Test: hier:569 'a PUT attach that snaps the workphase also logs the status change, like move does'.
   - §11a's parenthetical ("a workphase move logs its own entry already") implies it. **TP gap, low priority.**
7. **The Sheet's parent picker offers exactly the legal parents.**
   - attachedUI:328 asserts it never offers the item itself or a descendant.
   - But the picker applies no depth cap (it offers depth-capped targets), and it lists only same-project items, though §7 and §9 make cross-project parents legal.
   - §7's "the two enforcement points must agree" covers every UI, and ATT-4.9 is written for the board's classification only. **TP gap.** The cap and cross-project halves are code changes, likely for the Sheet epic.

No case here differs from another only in being made through an MCP tool.

---

## Totals

These are the figures after the Test Planner's response (56 cases), and they include the Addendum's mappings. For the 46 cases the proposing run first mapped, the figures were:
- 18 `Automated` by stamps;
- 1 internal mapping;
- 22 A3 route or API gaps;
- 3 A3 UI gaps;
- ATT-4.9, needing a routing ruling;
- 1 `Pending PO`.

### The catalog as it stands (this run changes nothing)

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Open` | 29 | 16 | 6 | 51 |
| `Pending PO` | 0 | 0 | 4 | 4 |
| Legacy ✅ (ATT-7.6) | 1 | 0 | 0 | 1 |
| **Total** | **30** | **16** | **10** | **56** |

### Proposed outcomes

| Outcome | P0 | P1 | P2 | Total | Cases |
|---|---|---|---|---|---|
| `Automated` by stamps alone | 16 | 3 | 0 | 19 | 1.1, 1.3, 2.2, 3.1, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 5.2, 5.4, 5.6, 7.1, 7.2, 7.3, 7.6, 7.7 |
| `Automated` by an internal mapping (approval) | 0 | 1 | 0 | 1 | 4.6 |
| A3 route or API: partly asserted, stamps now | 8 | 7 | 2 | 17 | 1.4, 1.5, 1.6, 1.8, 1.12, 3.9 ✗, 3.10, 4.10, 5.1, 5.5, 6.1, 6.2, 7.4, 7.5, 8.1, 8.2, 8.4 |
| A3 route or API: no test yet | 3 | 4 | 2 | 9 | 1.11 ✗, 2.1, 3.4, 4.5, 4.7, 4.11, 6.3, 7.8, 8.3 ✗ |
| A3 UI without a drag | 2 | 1 | 2 | 5 | 1.2, 1.7, 1.9, 1.10 ✗, 4.12 ✗ |
| ATT-4.9: Story 10 (a), or A3 with approval (b) | 1 | 0 | 0 | 1 | 4.9 |
| `Manual` proposed | 0 | 0 | 0 | 0 | — |
| Skipped (`Pending PO`) | 0 | 0 | 4 | 4 | 1.13, 4.13, 5.7, 5.8 |
| **Total** | **30** | **16** | **10** | **56** | |

**✗: its test fails today until code changes.** That's five cases:
- ATT-1.11 and ATT-3.9's top-level variant: Ruling A;
- ATT-1.10: Ruling B;
- ATT-4.12's cap half: the parent picker applies no cap;
- ATT-8.3: a create logs no hierarchy entry.

**At the confirming run, if only the stamps and approvals land:**
- **With ATT-4.6's approval:** 20 `Automated` (16 P0, 4 P1), 32 `Open` and 4 `Pending PO`.
- **Without it:** 19 `Automated` (16 P0, 3 P1), 33 `Open` and 4 `Pending PO`.

Every `Open` case then needs a destination, A3 or Story 10, named before the batch signs off.

---

## Addendum: after the Test Planner's response

**What changed:** A3's Amendments, "2026-09-28, batch 4 step 2". The catalog now has 56 cases: 51 `Open`, 4 `Pending PO` (ATT-1.13, 4.13, 5.7, 5.8) and ATT-7.6's ✅. For every case named here, this section supersedes the earlier ones. This is still a proposing run: nothing outside this report was edited.

### Newly `Open` cases

| Case | P | Tests | Asserted | Missing | Outcome | Today |
|---|---|---|---|---|---|---|
| ATT-1.10 | P2 | none. No test touches labels on the board | — | All of it: `P`'s Card shows its tags | A3 UI | **Fails** (Ruling B: the Card renders no labels) |
| ATT-1.11 | P0 | None passing. items:1202 asserts the opposite of its first clause | — | All of it | A3 route | **Fails** (Ruling A) |
| ATT-1.12 | P1 | hier:357 'attaching a done Free item clears its completedAt (wiki §2)' | A done `X` attached to `P` in Todo: `completedAt` null, `P`'s workphase, position 1.0 in `P`'s empty Stub list | `isAttached = 1` and `positionScope = "attached-siblings"`; the variant with `P` terminal too | Stamp + A3 route | Passes, by reading the code |
| ATT-4.12 | P1 | attachedUI:328 'the Parent dropdown excludes descendants, and reparenting nests the item under its new parent' | The picker lists neither `X` nor its descendant | A depth-capped `T` isn't listed, and every listed parent is one the API accepts | Stamp + A3 UI | **The cap half fails**: `ParentSection.tsx::buildParentOptions` excludes only `X` and its descendants |
| ATT-5.6 | P1 | items:85 'inherits projectId from parentId when projectId is omitted' | All of it: 201, `projectId` is the parent's | — | Stamp | Passes |
| ATT-8.3 | P2 | none | — | All of it | A3 route | **Fails**: a create logs only 'Created' |
| ATT-8.4 | P2 | hier:569 'a PUT attach that snaps the workphase also logs the status change, like move does' | By PUT: the `status_change` entry 'Moved from "Todo" to "In Progress"' | By PUT: the hierarchy entry beside it. By move: both entries | Stamp + A3 route | Passes, by reading the code: both entry points log both |

**What each gap test asserts:**
- **ATT-1.10** (UI, no drag). Give `P` a label (`POST /api/labels`, then `POST /api/labels/item/:itemId`), and open the board: `P`'s Card shows the label's name.
- **ATT-1.11** (route):
  - `POST /items` with `isAttached: true` and no `parentId` returns 400, and no item with that title exists afterward;
  - `POST /items` with no flag stores `isAttached = 0`, checked on the row;
  - a later move or PUT with `{parentId: B}` and no flag leaves it `isAttached = 0`, with `"workflow"`.

  Today step 1 returns 201, step 2 stores 1, and step 3 attaches it. **The Ruling A fix breaks three tests:**
  - items:1202, which asserts the opposite of step 1;
  - attachedUI:328's nesting half;
  - itemTree:63's `seedChain`, which creates parentless items with `isAttached: true`, so those creates would return 400. It seeds itemTree:94, :114 and :122.
- **ATT-1.12** (route). Extend hier:357 with `isAttached` and `positionScope`. Add a done `X` attached to a done `P`: `X` takes `P`'s terminal workphase, `completedAt` null, a position among `P`'s Stubs.
- **ATT-4.12** (UI, no drag). Extend attachedUI:328 or write a new test. `X` has a descendant, and a chain ends in `T` at a depth where `X`'s deepest leaf would pass `CAP`; read the cap from `GET /boards/:id`'s `itemDepthCap`, as classify:35 does. `X`'s picker lists none of `X`, its descendants and `T`, and every option it lists is within the cap. **The code fix:** the picker applies the cap. attachedUI:328's second half, reparenting nests the item, still contradicts ATT-1.11 and ATT-3.9 (Ruling A), so it's rewritten when Ruling A lands.
- **ATT-8.3** (route):
  - Create `X` under `P` with the flag omitted, and `X'` under `P` with `isAttached: false`.
  - Each new item's activity holds an entry that names `P` and says whether the item is attached.
  - The case leaves the reading open, so the test pins the facts, not the wording. The hierarchy entries already record `toParentId` and `toAttached` in their metadata.

  **The code fix:** the create path logs that entry. `POST /items` doesn't use the primitive's logging, and writes only a `status_change` 'Created' with `{workphaseId}`.
- **ATT-8.4** (route). hier:569 also asserts `X`'s hierarchy entry. Add the move variant: a Free item in Todo attached to a parent in In Progress, then both entries.

**Not stamped:** itemsAPI:35 'POST /api/items inherits projectId from parent when omitted' also asserts ATT-5.6 whole. items:85 alone makes the case `Automated`, so stamping itemsAPI:35 would only add a file to its pointer line (Stop 1). Nathan may want both.

### Revised cases, re-checked

| Case | What changed | Mapping now | Today |
|---|---|---|---|
| ATT-1.5 | It allows the modification timestamp. What's never written is anything recording whether the child is done | Unchanged: items:1034, Stamp + A3 route. The gap test compares the child's row before and after each change, allowing only `workphaseId` and `updatedAt` to differ, and adds the reopen half | Passes: the cascade sets only those two fields |
| ATT-6.3 | The same allowance | Unchanged: A3 route, with the same whole-row comparison | Passes |
| ATT-1.9 | Tags moved to ATT-1.10 | Unchanged stamps: attachedUI:12, :177. Missing now: `P`'s description snippet, and that `S1a` isn't an article anywhere | Passes. It no longer waits on Ruling B |
| ATT-4.7 | "Shown in the sidebar" is gone | Unchanged: A3 route, the same test minus the sidebar | Passes |
| ATT-8.1 | "Exactly one hierarchy entry" | Unchanged. hier:550 and :277 already count only `hierarchy_change` entries, so the wording now matches them. Same missing parts | Passes |

The three heads-ups near the top of this report are resolved: ATT-8.3 is `Open`, the timestamp is allowed, and the sidebar clause is gone.

### `Pending PO` cases (skipped): the tests that pin today's behavior

| Case | Question | Tests that pin today's behavior | What an answer would change |
|---|---|---|---|
| ATT-1.13 | A write that leaves an item attached, naming another workphase: refused, or ignored? | hier:130 'rejects a workphaseId that contradicts the parent an attached item inherits from; accepts a matching one' (move: 400). items:1167 'an attached child inherits the parent workphase even when a different one is passed' (POST: 201, the parent's workphase). PUT reads no `workphaseId` at all, and no test pins that | "Refused" inverts items:1167. "Ignored" inverts hier:130 |
| ATT-4.13 | Does the picker offer parents from other projects? | None. attachedUI:328's fixture is all one project. The scoping is `ParentSection.tsx::buildParentOptions`, which filters by `projectId` | "Must offer" needs a new UI test and a code change. "May scope" needs nothing inverted |
| ATT-5.7 | A create naming a project other than its parent's: refused, or does it take the parent's? | items:115 'rejects creating a child whose projectId differs from its parent (finding #11)' (400, "different project") | "Takes the parent's" inverts items:115 |
| ATT-5.8 | A write naming a workphase from a workflow the item's project doesn't use | hier:494 "rejects a workphaseId from a workflow the item's project does not use, and stores nothing" (no reparent: 400, row unchanged). hier:506 'rejects a one-step reparent into a different-workflow project that also names a workphaseId' (400, row unchanged). The allowed counterparts are hier:520 and hier:475 | "Allowed" inverts hier:494 and/or :506. Untested, and outside the case's *Given*: `POST /items` checks only that a workphase exists, so a create in `P1` naming `W2`'s workphase succeeds today. The PO may want to say whether a create counts |

### Updates to earlier sections

- **Proposed Stamps: four more,** all surface tests. That makes 44 (26 in hier, 12 in items, 6 in attachedUI), plus hier:254's drop of ATT-3.3. Eight still keep a TC ID.

  | Test | Proposed stamp | Note |
  |---|---|---|
  | items:85 'inherits projectId from parentId when projectId is omitted' | `ATT-5.6:` | Makes it `Automated` |
  | hier:357 'attaching a done Free item clears its completedAt (wiki §2)' | `ATT-1.12:` | Partial; "(wiki §2)" can go |
  | hier:569 'a PUT attach that snaps the workphase also logs the status change, like move does' | `ATT-8.4:` | Partial |
  | attachedUI:328 'the Parent dropdown excludes descendants, and reparenting nests the item under its new parent' | `ATT-4.12:` | Partial, for its first half only. Its second half contradicts ATT-1.11 and ATT-3.9 (Test Quality 2) |

- **Candidate New Cases:** all seven are now cases, and none is left.

  | Candidate | Now |
  |---|---|
  | 1 | ATT-1.11 |
  | 2 | ATT-1.12 |
  | 3 | ATT-1.13, `Pending PO` |
  | 4 | ATT-5.6, and ATT-5.7 (`Pending PO`) |
  | 5 | ATT-5.8, `Pending PO` |
  | 6 | ATT-8.4 |
  | 7 | ATT-4.12, and ATT-4.13 (`Pending PO`) |

- **Test Quality 1:** items:1202 now asserts the opposite of a live case, ATT-1.11's first clause, not just of the wiki.
- **Rulings.**
  - Ruling A now blocks ATT-1.11 and ATT-3.9's top-level variant.
  - Ruling B blocks only ATT-1.10.
  - ATT-1.9 no longer waits on either.
- **ATT-3.10, a fixture note.** Its gap test passes today only if its Free `X` is a detached child, or was created with `isAttached: false`, as hier:293's is. A top-level `X` created the ordinary way would attach on the reparent, under Ruling A. Its workflow-scoped anchor would then be refused as outside the resulting scope.
- **Unknown IDs:** `cross-cutting-regression.md` line 63 now reads "ATT-5.1 and ATT-5.2", so nothing in the catalog points at a deleted case.

### The gap classes, with today's failures marked

✗ marks a case whose test fails today until code changes.

| Class | Cases |
|---|---|
| **A3, route or API: partly asserted (17)** | ATT-1.4, 1.5, 1.6, 1.8, 1.12, 3.9 ✗ (Ruling A: the top-level variant), 3.10 (see the fixture note), 4.10, 5.1, 5.5, 6.1, 6.2, 7.4, 7.5, 8.1, 8.2, 8.4 |
| **A3, route or API: no test yet (9)** | ATT-1.11 ✗ (Ruling A), 2.1, 3.4, 4.5, 4.7, 4.11, 6.3, 7.8, 8.3 ✗ (a create logs no hierarchy entry) |
| **A3, UI without a drag (5)** | ATT-1.2, 1.7, 1.9, 1.10 ✗ (Ruling B), 4.12 ✗ (its cap half: the picker applies no cap) |
| **ATT-4.9 (1)** | Ruling C: Story 10 for option (a), or A3 with approval for option (b) |
| **Internal only (1)** | ATT-4.6 |
| **Manual (0)** | — |

All the other gap tests should pass against today's code, going by my reading of it. Nothing was run.

---

## Confirming run (2026-09-28)

**Inputs:**
- A3's Amendments from "2026-09-28, batch 4 Stop 1 (Nathan's rulings)" on: the rulings, the Coder's brief, and "batch 4 step 3 (Coder)";
- the catalog as Stop 1 left it: 56 cases, 47 `Open`, 8 `Pending PO` and ATT-7.6's ✅;
- the tests as the Coder left them.

**What this run wrote,** in `docs/test-plans/item-attachment/`: the status, in the suite table and on the status line, and the `**Automation test:**` line of 48 cases:
- 46 `Open` cases → `Automated`;
- ATT-7.6's ✅ → `Automated`, its line reduced to `server/tests/routes/items.hierarchy.test.ts`, since Nathan dropped `dragRequest.test.ts`;
- ATT-4.9 stays `Open` with `—`, routed to Story 10.

**Left alone:** the 8 `Pending PO` cases (ATT-1.8, 1.10, 1.13, 3.11, 4.12, 4.13, 5.7, 5.8) keep their status and `—`. No case text, title, priority, test or wiki page changed.

**Which tests count:** surface tests, plus the two approved internal ones:
- itemTree's "ATT-4.6: a root item is at depth 1 and a leaf has height 0";
- ATT-7.6's existing pointer, now route-only.

Each Automation test line lists every counting file whose tests carry the case's ID in the README form, as batch 3's confirming run did. Internal titles with an ATT ID mid-title count for nothing: itemTree:85 (ATT-4.5), itemTree:94 (ATT-4.4) and dragClassification:87 (ATT-4.5).

### Result: as expected

**47 `Automated`, ATT-4.9 `Open` and routed to Story 10, and 8 `Pending PO` routed to A5.** No case differs from the expected result.

Line numbers below are the files' current ones. Aliases are as at the top of the report.

| Case | Tests carrying its ID | Automation test |
|---|---|---|
| ATT-1.1 | items:638, attachedUI:12 | items, attachedUI |
| ATT-1.2 | hier:352, attachedUI:40 | hier, attachedUI |
| ATT-1.3 | items:1004, :1100 | items |
| ATT-1.4 | items:1034 | items |
| ATT-1.5 | items:1034, :1059 | items |
| ATT-1.6 | items:1077, :1100 | items |
| ATT-1.7 | hier:260, :352; attachedUI:385, :427 | hier, attachedUI |
| ATT-1.9 | attachedUI:12, :185 | attachedUI |
| ATT-1.12 | hier:597 | hier |
| ATT-2.1 | hier:239 | hier |
| ATT-2.2 | hier:100, :116, :636 | hier |
| ATT-3.1 | hier:280; items:376 | hier, items |
| ATT-3.4 | hier:302 | hier |
| ATT-3.5 | hier:280 | hier |
| ATT-3.6 | hier:260, :636 | hier |
| ATT-3.7 | hier:209, :820 | hier |
| ATT-3.9 | hier:280, :415, :428; attachedUI:460 | hier, attachedUI |
| ATT-3.10 | hier:415, :460 | hier |
| ATT-4.1 | hier:91 | hier |
| ATT-4.2 | hier:100 | hier |
| ATT-4.3 | hier:100 | hier |
| ATT-4.4 | hier:116, :820 | hier |
| ATT-4.5 | hier:131 | hier |
| ATT-4.6 | itemTree:75 (approved) | itemTree |
| ATT-4.7 | hier:836 | hier |
| ATT-4.10 | hier:91, :100, :116, :1066, :1075, :1085; items:106, :1169, :1184 | hier, items |
| ATT-4.11 | hier:864 | hier |
| ATT-5.1 | hier:636 | hier |
| ATT-5.2 | hier:636, :1120 | hier |
| ATT-5.4 | hier:677 | hier |
| ATT-5.5 | hier:709, :731 | hier |
| ATT-5.6 | items:85 | items |
| ATT-6.1 | hier:540 | hier |
| ATT-6.2 | hier:540 | hier |
| ATT-6.3 | hier:563 | hier |
| ATT-7.1 | hier:352 | hier |
| ATT-7.2 | hier:352; items:354 | hier, items |
| ATT-7.3 | hier:352; attachedUI:298 | hier, attachedUI |
| ATT-7.4 | hier:576; items:365 | hier, items |
| ATT-7.5 | hier:280, :327 | hier |
| ATT-7.6 | hier:380, :394 | hier |
| ATT-7.7 | hier:488, :503; items:1260 | hier, items |
| ATT-7.8 | hier:514 | hier |
| ATT-8.1 | hier:394, :666, :881, :921 | hier |
| ATT-8.2 | hier:380, :940 | hier |
| ATT-8.3 | hier:964 | hier |
| ATT-8.4 | hier:987 | hier |

### The checks asked for

- **ATT-8.3 against the code fix.**
  - `POST /items` now calls `itemHierarchy.ts::logCreatedUnderParent` inside the create's transaction when the item has a parent. It records a `hierarchy_change` entry on the new item, with `toParentId` and `toAttached` in its metadata. Nothing is logged on the parent.
  - hier:964 creates one attached and one detached child. Each has exactly one hierarchy entry, whose metadata names the parent and the attachment state. It asserts the facts, not the wording ('Created under "P" (attached)').
  - That's wiki §11a's rule, so the case is whole. Creating an item has only this one entry point; the MCP tool wraps it.
- **hier:380 and :394.** A Stub now carries its creation entry, so both count only the entries the write adds.
  - hier:380 still asserts that a redundant re-attach adds none.
  - hier:394 still asserts exactly 'Detached from "P"', then 'Attached to "P"'.

  ATT-7.6 is whole across the two, so its line lists only the route test.
- **ATT-1.5 and ATT-6.3.** items:1059 and hier:563 compare the child's whole stored row before and after, allowing only `workphaseId` and `updatedAt` to differ. That's the revised *Then*.
  - items:1059 does it for both changes, into Done and back out.
  - items:1034 adds the done half's `completedAt`, position and `positionScope`.
- **ATT-3.9 and the `Pending PO` cases.**
  - The Coder's route test, hier:428, uses only children of `A`: the free child is detached, and the attached one is a Stub. So neither its two flag-omitted reparents nor its four flagged combinations touch a top-level item (ATT-3.11) or a parentless flag (ATT-1.8).
  - attachedUI:460 reparents a detached child.
  - One other test carrying ATT-3.9, hier:415, is a top-level item; see below.

### Judgment calls, disclosed

- **ATT-1.1**, "Free isn't a state it can leave while it has no parent". This is asserted through items:638's item: a top-level item holding the create's default flag, which still reads `positionScope = "workflow"`. The test doesn't itself assert that the flag is set.
- **ATT-2.1**, "`A`'s … position change". This is asserted as its scope moving to `"attached-siblings"`. In the PUT iteration the number itself is 2.0 before and after, the same coincidence ATT-3.4 describes. The heart of the case, `B`'s whole row unchanged with `updatedAt` included, is asserted at both entry points.
- **ATT-4.6** (the approved internal mapping). It asserts the counting, and that the check accepts `1 + 1 + 0`. It performs no reparent, so "`L` sits at depth 2" follows from the counting rather than from a read.
- **ATT-7.3**, "though `X.parentId` is still `P`". This is asserted at the detach (hier:352), not after the parent's move in attachedUI:298.

### `Pending PO` cases: tests for A5

**Tests stamped with ATT-1.8, listed, not mapped:**
- hier:160 'ATT-1.8: rejects isAttached: true with no resulting parent';
- hier:488 'ATT-1.8, ATT-7.7: reparent to root (parentId: null) clears the flag and re-resolves a workflow position';
- hier:1113 'ATT-1.8: PUT rejects a parentless attach'.

If A5 writes Ruling A in (a parentless item may hold the flag), hier:160 and hier:1113 invert.

**Tests carrying a live case's ID that also pin behavior a `Pending PO` case questions:**
- **ATT-7.7's hier:488 and items:1260 'ATT-7.7: reparenting to null while attached clears isAttached and keeps the workphase'** assert `isAttached = 0` after the parent is cleared. That's ATT-1.8's question: does clearing `parentId` clear the flag? ATT-7.7's *Then* no longer asserts the flag, so if A5 rules the flag stays, those assertions and items:1260's title change, and ATT-7.7 stays `Automated` on the rest.
- **hier:415 'ATT-3.9, ATT-3.10: a Free item can be reparented and stay Free; without an anchor its position is untouched'.**
  - Its `X` is a top-level item created with the flag clear. That's ATT-3.11's scenario, not ATT-3.9's, whose *Given* is now a detached child.
  - It pins nothing: with the flag clear, both of ATT-3.11's answers keep `X` Free. But its ATT-3.9 stamp is on the wrong scenario.
  - ATT-3.9 is whole without it (hier:428, attachedUI:460), and ATT-3.10 is whole without it (hier:460).
  - **For A5:** re-stamp it `ATT-3.10, ATT-3.11:` once ATT-3.11 is settled, or drop ATT-3.9 from it now.
- **hier:1120 'ATT-5.2: PUT cascades projectId to detached descendants on a cross-project reparent'.** Its `X` is a top-level item created with the default flag, reparented by a PUT that omits the flag. Today that attaches `X`, which is ATT-3.11's question. The test asserts only `X2`'s project, so it pins nothing.
- **hier:836 'ATT-4.7: a tree already past the cap loads, and takes every write that reparents nothing'.**
  - Its chain helper, `seedChainPastCap`, creates each link as a top-level item with the create's default flag, then writes `parentId` directly. The links are attached only because a parentless create stores the flag: ATT-1.8's question.
  - If A5 rules that a create stores no flag without a parent, the links become detached children. The test still passes, but its reorder is then among Free items, not "among its attached siblings" as ATT-4.7 says.
  - **Re-check it after A5.**

**Tests with no live ID that pin today's behavior, for checking A5's answers against:**

| `Pending PO` case | Tests |
|---|---|
| ATT-1.8 | items:1244 'creates a parentless item with isAttached true (the default) and respects its explicit workphaseId' |
| ATT-1.10 | none |
| ATT-1.13 | hier:175 'rejects a workphaseId that contradicts the parent an attached item inherits from; accepts a matching one' (move refuses). items:1209 'an attached child inherits the parent workphase even when a different one is passed' (POST ignores). Nathan's ruling 13 lets the API be permissive, so hier:175 would invert |
| ATT-3.11 | attachedUI:347 'the Parent dropdown excludes descendants, and reparenting nests the item under its new parent': a top-level item attaches on a flagless reparent. items:1197 'accepts reparenting under a parent in a different project and adopts its projectId (wiki §9)' makes the same flagless reparent, and asserts nothing on the flag |
| ATT-4.12 | attachedUI:347: the picker excludes the item and its descendants, and applies no cap. The test doesn't check the cap |
| ATT-4.13 | none. The same-project scoping lives only in `ParentSection.tsx::buildParentOptions` |
| ATT-5.7 | items:115 'rejects creating a child whose projectId differs from its parent': refused, as Nathan's ruling 15 has it |
| ATT-5.8 | hier:780 "rejects a workphaseId from a workflow the item's project does not use, and stores nothing" and hier:792 'rejects a one-step reparent into a different-workflow project that also names a workphaseId'. Nathan's ruling 16 says the API needn't gate this, so both would invert. The counterparts are hier:806 and hier:761 |

### Destinations

- **Story 10:** `docs/planning/epic-3-5-stories/epic-3-5-roadmap.md`, item 1, names ATT-4.9 ("item-attachment, 1 case").
- **A5:** `a5-wiki-and-test-plan-heirarchy-updates.md`, D2, "Cases routed here by ID", names all eight: ATT-1.8, 3.11, 1.10, 4.12, 4.13, 1.13, 5.7 and 5.8.
- **No mismatch either way.** Every `Open` and `Pending PO` case is named in its destination, and neither destination names an `Automated` case. The roadmap's item 2 mentions ATT-3.6, 6.1 and 5.1 in a "Not deferred" note, but that describes coverage and isn't a routing.

### Catalog-wide checks

- **Lost coverage: none.**
  - board-drag-interaction's 42 `Automated` cases each still have a test that starts with their ID.
  - The Coder's comment edits left the titles alone: `dragClassification.test.ts` line 37 'DRAG-1.7, DRAG-1.8: …' and `boards.test.ts` line 95 'DRAG-2.10: …' are intact.
- **Unknown IDs: none.** Every ID at the front of a test title names a case that exists.
- **References to deleted cases: none.** Nothing in the code, the tests, the wiki or the test plans names a deleted ATT case (ATT-1.11, 3.2, 3.3, 3.8, 4.8, 5.3).
- **`Manual` cases carried by a test: none.**
- **item-positioning's legacy marks** are left for batch 5.

### Totals

| Status | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| `Automated` | 27 | 15 | 5 | 47 |
| `Open` (ATT-4.9, Story 10) | 1 | 0 | 0 | 1 |
| `Pending PO` (A5) | 1 | 2 | 5 | 8 |
| **Total** | **29** | **17** | **10** | **56** |
