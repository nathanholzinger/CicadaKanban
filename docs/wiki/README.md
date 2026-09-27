# Product Wiki

What Cicada does, feature by feature: the rules a user sees, or that a caller of the API or the MCP tools can rely on, and the reasons behind them. The test plans are derived from these pages, and the code follows them.

The PO owns the wiki. Other roles hand changes off to the PO rather than editing a page. `.claude/guides/documentation-standards.md` covers what applies to every doc: ownership, which way references point, history, the Planned marker's contract, and handoffs. This README covers what's particular to the wiki.

## What a page holds

**The test for anything on a page:** would a user, or a caller of the API or the MCP tools, notice if it were different? If so, it belongs here. If not, it's mechanism, and it lives in the code's own comments and module headers.

| Belongs on a page | Doesn't |
|---|---|
| Behavior, and the reason for it | File paths |
| API routes, request and response fields, status codes | Function, component, hook and constant names |
| Tuning-panel value names | DOM and test attributes |
| Item types and representations (Epic, Card, Stub, Sheet) | Database column names: use the API field name, or plain words |
| | Code expressions: "position, then creation time", not the comparator |
| | How the client or the server is built |

A rule that holds on every surface is stated once. A drag, the Sheet, the API and an MCP tool call get the same answer unless the page says otherwise.

**What a page doesn't hold:**
- **Deliberation.** The options weighed, and how a question was settled, belong in planning docs, which are transient. A page keeps only the reason, in the present tense.
- **History.** Past versions live in git: no provenance, no build status, and no narration of how things used to be.
- **The future,** except as a Planned rule or an Open question (both below).

## Writing a rule

- **Present tense, current truth.** State the rule, then why it holds.
- **A rejected alternative is written as "why not X".** Keep one only when a reader would otherwise propose X again.
- **A state change isn't history.** "Once moved, its position no longer compares against anything" describes what happens to an item, and is fine.
- **A rule that meets another says how they combine.** When a rule interacts with one on this page or a Related page, the page states the interaction rather than leaving the reader to work it out.
- **What isn't allowed is a rule too.** State what happens when it's tried: the response, what's stored, and what the user sees.
- **A rule that computes an order or a position comes with a worked example.** An example can't be misread the way a description can.
- **Tunable values.** A value set on the tuning panel is named, given its current approximate value, and called tunable. That's a standing property, not a status. Test plans use the name and never pin the number.
- **Feel is part of the rules.** A page states how an interaction should feel as well as what it resolves to, and may say which is which. Which cases can be pinned to precise assertions, and which are judged by hand, is the test plans' call.

## Page layout

Each page is a folder named for its feature, holding a `README.md`, in this order:
1. **The title.**
2. **One paragraph on the question the page answers,** and, where it matters, what it leaves to another page.
3. **Test suite and Related links:** the matching test-plan folder, and the pages this one leans on.
4. **Numbered sections,** each holding one rule or a family of closely related rules.
5. **Open questions,** last.

Folder names match the test-plan folders exactly, so each page has one catalog. A folder is named for a lasting feature, never for the piece of work that introduced it.

This README isn't a page. Nothing points at it by section.

## Sections, anchors and references

A page's name and its section numbers are how code, test plans and other pages point at a rule, so neither changes.

- **Every section heading carries its number:** `## N. Title` for a section, `### N.M Title` for a subsection. The words can be reworded; the number can't.
- **A new section** goes in between two existing ones with a letter (5a follows 5), or takes the next free number. A new subsection takes the next free number within its section.
- **A removed section's number stays unused.** It's never given to another section.
- **Renaming or splitting a page, or renumbering its sections,** is a piece of work of its own. Its handoff carries a map from the old anchors to the new ones.
- **When a rule moves to another section, or a section is removed,** the story's handoff says so, so that code pointers and test cases follow. The checker confirms a section exists, not that it still holds the rule.

**How to write a reference:**

| From | Form |
|---|---|
| The same page | The section sign and number alone |
| Another wiki page | A relative link to the page, then the section sign and number |
| Code, test plans and guides | `wiki <page> §N`, as the standards guide describes |
| A page to its test plans | A relative link to the feature's test-plan folder |

```markdown
Dropping on a Stub pops out first (§8).
The item's new position resolves by anchor and side ([item-positioning](../item-positioning/) §2).
```

## Status: the Planned marker

Unmarked means built. A rule that's decided but not yet built carries the one status marker, `**Planned:**`. The standards guide holds its contract: who adds it, what's in force meanwhile, and who clears it. On a page:

- **The marker opens the paragraph or bullet** that states the unbuilt rule.
- **If the rule replaces a current passage,** it names that passage: "Replaces §N's '<short quote>'."
- **If the replaced passage is in another section,** that passage gets a one-line note, `*Replaced by §N once built.*`, with a link before the section sign if the replacement is on another page. The note is a pointer, not a marker. The passage it sits on stays the rule until the build lands.
- **A partial build** states the current rule for the part that's built, and marks the rest Planned.
- **When the marker comes off,** the passage it replaced, and any note pointing to it, are deleted in the same edit.
- **Nothing marks status at page level.**

```markdown
### 3.2 Zooming into a Card
A drag zooms into the Card the pointer rests on. *Replaced by §6 once built.*

## 6. Card → Card: attach
**Planned:** A drag zooms into the Card the side highlight names, once it has held
there for a dwell. Replaces §3.2's "the Card the pointer rests on".
```

## Open questions

Every page ends with an Open questions section, which opens with this line:

```markdown
Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.
```

- **An undecided behavior, or a placeholder look, goes here,** not into a hedged rule in the body. The body may say "not a rule yet; see Open questions".
- **It holds the question,** with enough context to see what's open. The deliberation happens in planning docs.
- **It names no story and no date.** When the work will answer a question is the roadmap's business.
- **A resolved question is deleted.** Its answer goes into the body as a rule, marked Planned if it isn't built yet.

## How the wiki stays current

- **Rules come from Nathan's rulings:** a ratified plan, a ruling made while a story is open, an answer to a question another role raised, or an audit ruling. The PO writes each one in when it's made, marked Planned if it isn't built yet.
- **At story close,** the PO applies the story's handoff: rulings on the behavior decisions it lists, markers off for what was built, and a record of the sections added, changed, moved or removed. `.claude/guides/story-done-checklist.md` sets the order.
- **Every change to a rule names the sections it touched,** so the test plans follow, including a change that rewords a rule where it stands.
  - While a story is open, the name goes in the plan: in the Amendments entry for a ruling made mid-story, or in the handoff at close.
  - Outside a story, it goes in the PO's report to Nathan.
- **The wiki isn't written from code.** When the code or a failing test disagrees with a page, neither side is assumed right. Which one is wrong is a ruling, made the same way as any other. If the page stands, the code changes back. The exception is a test case that misread a clear page: the Test Planner fixes the case, and no ruling is needed.
- **Pages refer to each other by relative link,** so the wiki can move as a unit.
