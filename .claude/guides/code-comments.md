# Code Comments

When to write a code comment, what it may say, and what the checker enforces. Read by anyone writing or reviewing code, and by the audit passes. Comments are living docs, so `.claude/guides/documentation-standards.md` applies to them too. This guide is how those rules land in code.

## The default: comment where a test can't guard the code

- **No comment is the default.** Every comment can go stale, and a stale comment misleads more than a missing one, because a reader trusts it more than the code beside it.
- **Write one where breaking the code wouldn't fail any test, and a test can't reasonably be written.** That's where a comment is the only guard that moves with the code:
  - behavior tested by hand, such as drag timing and feel;
  - coupling to other files ("also read by …", naming each reader as in rule (e));
  - code that looks wrong, or safe to delete, but isn't.
- **If a test could guard it, write the test instead.** Density follows: comments are dense in the drag layer and sparse in the CRUD routes, whose rules the API tests pin.
- **Write for the code around the reader's task, not the task.** Whoever opens the file already knows why they're there. They don't know what the neighboring code depends on.
- **The umbrella test:** would this comment still be true and useful if every plan and audit were deleted? If not, rewrite it as the fact it stands for, or delete it.
- **Change a comment in the same change as the code it describes.** A comment that's false is corrected, never left for later.

## What a comment may say

These rules are lettered so that reviews and audits can cite them. Test titles aren't comments, but they follow these rules too.

**(a) No provenance.** None of these:
- story, epic, phase, audit-finding, ledger or plan-decision IDs;
- dates;
- pointers to plans, decisions docs, audits or reports, by path or by file name. Write the reason instead;
- "ruled by", "decided in" or "found in hands-on".

Often the tag is the only thing wrong. When the tag stands in for a reason, write the reason.

```text
✗  // Story 4: a Card is also a region.
✓  // A Card is also a region.
✗  // Kept separate from the sidebar's version (audit #8).
✓  // Kept separate from the sidebar's version: <the reason the tag stood for, in the
   // present tense>.
```

*The one exception:* a test title or test comment may carry the qualified ID of the test-plan case it covers. That's the sanctioned pointer from code to a test plan; `docs/test-plans/README.md` defines the format. A bare, unqualified case number is flagged.

**(b) No history; constraints stay.** State the constraint and what breaks without it, never the episode that taught it. A rejected alternative is fine as a present-tense "because".

```text
✗  // We used to exclude the dragged row here, which shifted every gap by one.
✓  // The dragged row stays a collision candidate: excluding it shifts every gap by one.
```

**(c) Wiki pointers do one of two jobs, or they don't exist.**
- **Guard:** at code that would otherwise look wrong or safe to delete, so a refactor doesn't "simplify" away a business rule.
- **Index:** at a rule's main enforcement site, one pointer per rule. When a rule changes, a search for its section finds the code. Which site that is:
  - **a rule the API refuses:** the server check;
  - **a rule only the UI enforces:** the client module that decides it;
  - **a rule enforced on both sides:** the server check. The client site may add a guard pointer where it would otherwise look like duplication.
- **Format:** `wiki <page> §N`, where the page is the wiki folder's name, for example `wiki item-attachment §8`. N may name a subsection or an inserted section, as in `wiki board-drag-interaction §7.1` or `wiki board-drag-interaction §5a`. Never a bare `§N`, since plans number their sections too.
- **Name the rule in one line; never restate it.** The wiki keeps the reasoning.

**(d) No forward references.** Say what's provisional in present terms ("placeholder look, not yet tuned"). Which story fixes it belongs to the roadmap.

**(e) Cross-file references name symbols, not internals.**
- `<file>::<symbol>` is fine, for example `itemTree.ts::assertWithinDepthCap`. A search confirms the symbol still exists, and a rename breaks the reference loudly.
- **Use the file name alone when it's unique in the repo.** Otherwise use the shortest path that makes it unique, such as `api/items.ts::<symbol>` or `routes/items.ts::<symbol>`, since each client `api/` file shares its name with a server route file. The checker reports an ambiguous name.
- No line numbers.
- No prose describing what another file does inside ("the caller already clamps this"). State this code's own assumption instead ("expects a clamped index"). That stays true or false with the code beside it.
- Name coupling as "also read by `<file>::<symbol>`", not "the only other reader is …". A list that claims to be complete goes false the moment a reader is added elsewhere, and nothing near that change prompts anyone to fix it.
- **A coupling comment tells you where to look, not that you've seen everything.** Confirm with a search before acting on it.
- Where a type or a test can carry the coupling, prefer it to a comment. A list that really must be complete belongs there.

**(f) Rulings live at their site.** "Deliberately separate from `<file>::<symbol>`, because …" and "looks wrong but isn't, because …" are legitimate reasons, and they belong where the question would come up. Without the comment, every cold review works the same question out again. When an audit rules on such a question, the fix is a one-line present-tense comment at the site.

**The reason is the point: a ruling without its reason doesn't count.** "Deliberately separate" on its own invites the next reviewer to merge the two anyway.

**(g) Never name `.claude/` files or `CLAUDE.md` files.** Those describe how agents work, not what the code does.

## Module headers

A header says what the file owns, and what it deliberately doesn't where that's non-obvious. Which files get one:
- **A module whose name doesn't already say what it owns.** `api/labels.ts` needs no header; a file named for a mechanism does.
- **Every shared-logic module, whatever its name:** `server/src/lib/`, `client/src/lib/`, and the drag layer's modules in `client/src/components/workflow/`. Those are where a reader looks before writing a new helper.
- **A test file only where its name doesn't say what it covers.**
- **Two to four lines is the norm, not a cap.** A state machine's header also names its states and what moves it between them.
- **A header is not a changelog.** Rationale for one function goes beside that function; rules that span modules go in the directory's `CLAUDE.md`.

## Contract comments on exported functions

An exported function whose contract isn't obvious from its name and types may carry a `/** … */` block, so the contract shows on hover. It covers what the function promises, what it expects, and what it throws or returns on failure. Skip `@param` tags that only restate the types. Comments inside a function body stay `//`.

## Directive comments

`eslint-disable…`, `@ts-expect-error`, `prettier-ignore` and `check-docs-ignore-next-line` are load-bearing:
- **They sit on the exact line the tool expects.** For `eslint-disable-next-line`, that's the line directly above the one ESLint reports.
- **Each carries a reason:**
  - `eslint-disable…`, `@ts-expect-error` and `check-docs-ignore-next-line` take it on the same line, after ` -- `.
  - `prettier-ignore` takes it on a separate comment line directly above the directive. Prettier honors the directive only when the comment is exactly `prettier-ignore`, so text after it silently disables the ignore.
- **Only the reason text may be reworded.** Never move or rewrite the directive itself.

```text
// eslint-disable-next-line react-hooks/set-state-in-effect -- reset on fetch start
// Aligned columns read as a table.
// prettier-ignore
```

## What the checker enforces

`npm run check:docs` checks the mechanical rules. The drift pass of an audit judges the rest, and the second list below is its whole checklist.

| Rule | Checker rule ID |
|---|---|
| (a) IDs and dates | `transient-id` |
| (a) pointers to plans, decisions docs, audits or reports | `transient-link` |
| (a) unqualified case numbers in tests | `bare-case-id` |
| (a) a case ID that isn't in the test-plan catalog | `case-id` |
| (c) bare section numbers | `bare-section` |
| (c) a pointer to a page or section that doesn't exist | `wiki-pointer` |
| (e) a `<file>::<symbol>` that doesn't resolve, or names an ambiguous file | `symbol-ref` |
| (g) naming `.claude/` or `CLAUDE.md` | `claude-ref` |

**Not checkable, so left to review:**
- (a)'s phrasing ("ruled by");
- (b) history narration;
- (c) whether a pointer has a job, and whether it restates the rule;
- (d) forward references in plain words;
- (e) prose about another file's internals, and coupling lists that claim to be complete;
- (f) a ruling written without its reason;
- a module header that doesn't match what its file owns;
- a directive whose stated reason no longer holds;
- whether a comment is simply wrong.

**A genuine exception carries an ignore marker** on the line above, with a reason:

```text
// check-docs-ignore-next-line transient-id -- a date-parsing fixture, not provenance
```
