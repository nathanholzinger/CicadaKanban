# Documentation Standards

The rules every role follows for every kind of document in this repo: what's living and what's transient, who owns what, which way references point, and how changes reach a doc's owner.

A doc's own conventions (how a wiki page is laid out, how a test case is written) live with that doc, not here:

| Doc | Its own conventions |
|---|---|
| The wiki | `docs/wiki/README.md` |
| Test plans | `docs/test-plans/README.md` |
| Code comments and module headers | `.claude/guides/code-comments.md` |
| Story and epic plans | `.claude/guides/story-plan-template.md` |
| Closing a story | `.claude/guides/story-done-checklist.md` |
| Audits | `.claude/guides/audit-workflow.md` |

## Living and transient

- **A living doc states what is true now.** Its owner keeps it current. A change overwrites what's no longer true; it doesn't preserve it alongside.
- **A transient doc serves one piece of work.** It stops being maintained when that work closes, then moves to `docs/archive/` and is never edited again. A reader of a transient doc should assume it's out of date.
- **Frozen:** everything in `docs/archive/`.

## Who owns what

The owner edits the doc. Everyone else hands changes off (see Handoffs).

| Doc | Kind | Owner | Other roles |
|---|---|---|---|
| `docs/wiki/**` | living | PO | Hand changes off to the PO |
| `docs/test-plans/**` | living | Test Planner | The Test Reconciler writes each case's status and Automation test line. Everyone else hands changes off to the Test Planner |
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

**Agent memory points at rules; it doesn't restate them.** A memory about a convention that a guide or a living doc holds is a one-line pointer to it.

## Where implementation knowledge lives

The wiki describes behavior, not code. How the code works lives in the code's own tiers:

| Scope | Home | What it holds |
|---|---|---|
| One file | Its module header, where the file needs one (`.claude/guides/code-comments.md`) | What the file owns, and what it deliberately doesn't. Two to four lines is the norm, not a cap: a state machine's header also names its states and what moves it between them. |
| One directory | That directory's `CLAUDE.md` | The mental model, rules that span modules, "don't reinvent this" rules, and one line per file. Never a second copy of a module header. |
| The whole repo | Root `CLAUDE.md` | Repo-wide architecture and conventions |
| Process | `.claude/guides/` | How the work is done |

There is no separate consolidated implementation doc.

## Which way references point

A reference should run from the thing that changes more to the thing that changes less.

- **Transient → anything:** allowed. The reference is expected to go stale.
- **Living → transient:** not allowed. A living doc never cites a plan, an audit or a decisions doc as an authority, an example or a source.
  - **One exception:** a process doc may name a transient doc as *the place where open work is tracked*, such as the roadmap. Each such line carries the checker's ignore marker, so every exception is visible.
- **Living → living:** allowed, but only to stable anchors:
  - **a wiki section.** From outside the wiki, write `wiki <page> §N`, where the page is the wiki folder's name. N may name a subsection or an inserted section. Inside the wiki, the wiki README's own forms apply.
  - **a test-plan case,** by its qualified ID;
  - **code,** as `<file>::<symbol>`, never a line number. The file name alone when it's unique, otherwise the shortest path that makes it unique;
  - **a feature folder,** by relative link. The wiki and the test plans share folder names.
- **The wiki names no code.** No file paths, function names, constants, or DOM and test attributes. Behavior surfaces are fine: API routes and field names, status codes, and tuning-panel value names.
- **Code comments never name `.claude/` files or `CLAUDE.md` files.**
- **Test plan ↔ test file:** `docs/test-plans/README.md` defines how a case and its tests point at each other.

**Wiki page names and section numbers are a contract.** Code pointers and test plans cite them, and the test-plan folders mirror the page names.
- **Sections:** the PO never renumbers a section, and a removed section's number is never reused.
- **A moved rule:** when a rule moves to a different section, the story's handoff says so and the pointers follow. The checker can confirm a section exists, but not that it still holds the rule.
- **Pages:** renaming or splitting a page, or renumbering its sections, is a piece of work of its own, and its handoff carries an old → new map.

## History

- **A living doc states what is true now.** Past versions live in git.
- **No provenance:** not who decided, when, or which story, audit, finding or decision it came from.
- **No narration of how the doc or the code used to be** ("used to", "previously", "an earlier draft"). Describing what happens to an item when its state changes is fine: a moved item's position "no longer compares against anything" is a rule, not history.
- **A reason stays, in the present tense.** A rejected alternative is written as "why not X", so it stays true as long as the rule does and stops the next reader proposing X again.

```text
✗  Ruled by the PO during Story 6's hands-on: the drop lands where the ghost is.
✗  The drop used to follow the pointer's half of a card; it now lands where the ghost is.
✓  The drop lands where the ghost is. Choosing by which half of a card the pointer is
   over can land the item somewhere the ghost never showed.
```

## The Planned marker

The wiki can describe a rule before it's built, so the Test Planner and the Coder can work in parallel. The marker is how every role tells "decided but not built" apart from "built":

- **The token.** One fixed token, `**Planned:**`, marks a wiki passage that is decided but not yet built. Unmarked means built.
- **What it names.** The passage it will replace, if there is one. Never a story.
- **What's in force meanwhile.** Until the marker comes off, the passage it replaces is still the rule: code, tests and audits follow it. A note on that passage pointing to its replacement (in the wiki README's form) doesn't change that. The note is not a Planned marker.
- **Who adds it.** The PO writes a rule in as Planned when Nathan ratifies it, whether that's before a story starts or while one is open.
- **Who clears it.** A story's plan lists the Planned passages it builds. At close, the PO removes the markers of those the handoff lists as built, and deletes the passages they replace. A listed passage the story didn't build keeps its marker.
- **Who relies on it:**
  - the Test Planner writes cases for a Planned passage ahead of the build;
  - an audit doesn't flag code that lags behind a Planned passage.

How the marker is written on a page is the wiki README's.

## Handoffs

**Never edit a living doc you don't own.** When your work makes one wrong, or needs it to change, hand it off to the owner.

**A handoff is a request; the owner decides.** Code follows the wiki, not the other way round. A behavior the code already has becomes a rule only when it's ruled on. If the ruling goes the other way, the code changes back.

- **During a story:**
  - changes to the wiki, test plans or root `CLAUDE.md` go in the story plan's living-docs handoff;
  - questions for another role go in the plan's Open questions, addressed to that role;
  - a ruling Nathan makes while the story is open goes into the wiki when he makes it, marked Planned if it isn't built yet, so the Test Planner can write cases before close. The plan's Amendments records it.
- **At story close:** the owners apply the handoff, in the order `.claude/guides/story-done-checklist.md` sets.
- **Outside a story:** the handoff goes in your report to Nathan.

**Living docs you do own get fixed in the same change** that made them wrong: comments, module headers, and the `CLAUDE.md` of the directory you changed.

## The archive

- **What goes there:** closed transient docs, in `docs/archive/`, flat, under their original file names.
- **When:**
  - a story plan, its audit and its Reconciler report, at the story's sign-off;
  - any other audit, once every required finding has a disposition;
  - a round table, once its outcomes are written up;
  - any other transient doc, when the work it served closes.
- **Nothing in it is edited, and no living doc links to it.** Agents skip it unless asked to look there.

## What the checker checks

`npm run check:docs` enforces the mechanical parts of these rules in code, tests, `CLAUDE.md` files, `.claude/`, the wiki and the test plans. It flags:
- story, epic, phase, audit, ledger and decision IDs, and dates;
- section pointers in the wrong form, or pointing at a section that doesn't exist;
- `<file>::<symbol>` references that don't resolve;
- references to files in the transient folders;
- test-plan case IDs that don't match a case in the catalog, and a suite's Next ID that would reuse one.

`.claude/guides/code-comments.md` lists its rules and their IDs. `--rules <id>,…` limits a run to the named rules.

**A genuine exception carries an ignore marker** on the line above, with a reason:

```text
<!-- check-docs-ignore-next-line transient-link -- names where open work is tracked -->
// check-docs-ignore-next-line transient-id -- a date-parsing fixture, not provenance
```

Everything the checker can't judge, such as history narration, restated rules and wrong claims, is the reviewer's and the audit's job.
