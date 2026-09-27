# Prettier-Preemptive Practice — Manual Line-Break Guidelines

Prettier formats every package: the root `.prettierrc` covers `server/` and `tests/`, and `client/.prettierrc` adds the Tailwind plugin for the client. `npm run format:check` checks all three, and runs as part of `npm run check`. Markdown is deliberately left out.

Prettier only wraps; it can't tell a line that's doing too much from one that's merely long. Before handing a file to `prettier --write`, walk its lines over 120 characters (the configured `printWidth`) and decide, line by line: does it need a **manual restructure** because it's doing too much, or is it just **long** and safe to hand straight to Prettier?

The examples quote code as it looked when each signal was spotted. They illustrate the signal; the named files may read differently now.

---

## Before You Start: Measure Correctly

A naive byte-length check overcounts any line with multi-byte UTF-8
characters — most commonly the box-drawing banner comments used throughout
this codebase (`// ─────────────────────────`). Each `─` is 3 bytes but 1
displayed character, so a byte-counting tool can flag a 40-character comment
as 120+ chars wide. `awk`'s `length()` counts bytes, so it produces exactly
these false positives on the specs' section banners. Use your editor's ruler, or count Unicode
codepoints (not bytes) if scripting it — never trust a `wc -c`-style byte
count against a line with box-drawing or other non-ASCII characters.

---

## When a Call Needs to Shrink: Chain-Break First

Confirmed against the real binary (see signal #6 below): prettier's own
preference, given a call that doesn't fit, is to break a **method chain**
one link per line (`request(app)` / `.post(...)` / `.send({...})`) before it
ever reformats what's *inside* one link. It only reaches for exploding a
link's own arguments/object fields if breaking the chain alone still isn't
enough to bring that link under `printWidth`. Match that priority order when
judging whether a line needs help:

1. Is this a method chain? If breaking it one link per line gets everything
   under budget, that's already what prettier will do — leave it alone.
2. Only past that — a plain (non-chained) multi-argument call, or a chain
   link that's still too long even on its own line — do the signals below
   apply.

Don't preempt step 1 by hand — e.g. don't manually break a chain *and* also
restructure the params inside one of its links "just in case." Restructure
params only once chain-breaking alone has been ruled out as sufficient.

---

## Signals: This Line Is Doing Too Much (break it up manually)

### 1. A query is embedded directly inside a branch condition instead of named

**The gap** — `server/src/routes/workflows.ts`:
```ts
if (sourceWorkflowId && !db.select({ id: workflows.id }).from(workflows).where(eq(workflows.id, sourceWorkflowId)).get()) {
```
The line buries a full Drizzle query inside an `if` — you have to parse the
whole query just to find the boolean it resolves to, and there's nothing to
log or set a breakpoint on if this branch misbehaves later.

**Done right (same file class)** — `server/src/routes/items.ts`:
```ts
const targetWorkphase = tx.select({ isTerminal: workphases.isTerminal }).from(workphases).where(eq(workphases.id, resolvedWorkphaseId)).get();
if (targetWorkphase?.isTerminal) {
```
Still one long line for the query, but it's *only* the query — the name
(`targetWorkphase`) is what makes the branch below it readable, and the
result is now inspectable on its own.

**Fix pattern:** pull the query out into a named `const somethingExists =
Boolean(...)` (or the fetched row itself, if you need more than a boolean)
above the branch, then condition on the name. This is a restructure, not a
reformat — prettier will never do this for you, and reformatting the
one-liner in place just produces a longer-but-still-buried line.

**Preserve short-circuit laziness when the original guarded the query with
`&&`.** `workflows.ts` in its original form was `if (sourceWorkflowId &&
!db.select(...).get())` — the query only ran when `sourceWorkflowId` was
truthy. A first-pass extraction that writes `const sourceWorkflowExists =
Boolean(db.select(...).get())` unconditionally, then `if (sourceWorkflowId &&
!sourceWorkflowExists)`, looks equivalent but isn't: the query now runs even
when `sourceWorkflowId` is `undefined`, and `eq(column, undefined)` reaching
better-sqlite3 as a bind parameter throws — breaking the common "not
provided" path. Caught by re-reading the diff before running anything, not
by a failing test — worth double-checking deliberately, since a route's own
test suite won't necessarily exercise the "id omitted entirely" path as
distinctly from its "id given but not found" case. Keep the guard in the
extracted expression itself: `!templateId || Boolean(db.select(...).get())`,
so `templateExists` is vacuously true and the query never runs when the id
wasn't given.

### 2. A `className` line's conditional logic is buried under a long static class list

**The gap** — `client/src/components/KanbanCard.tsx`:
```tsx
className={`hover:bg-zinc-750 relative cursor-grab rounded-lg border border-zinc-700/50 bg-zinc-800 p-3 transition-colors duration-150 hover:border-zinc-600 active:cursor-grabbing ${isDragging ? 'opacity-30' : ''} ${isOverlay ? 'rotate-2 shadow-2xl shadow-black/50' : ''} `}
```
Two independent conditionals (`isDragging`, `isOverlay`) are stitched onto
~180 characters of static Tailwind classes. The logic — the only part of
this line that can actually change behavior — is the hardest part to spot.

**Contrast — the already-correct end state** —
`client/src/components/item-detail/pillUtils.ts` extracts exactly this kind
of static-class pile into named constants (`BTN_MODAL_CANCEL`,
`INPUT_LG_RING`, etc.) precisely because it was independently re-typed
inline across several modal components. The same move applies here: hoist the static base string
to a local `const` (or a shared constant if it's reused), and leave only the
conditional pieces inline so the JSX reads as "base classes, plus X when
dragging, plus Y when overlay" instead of one undifferentiated wall of text.

**A `className` line never gets help from prettier, regardless of shape.**
Confirmed by actually running it: prettier leaves a `className` string or
template literal's contents completely untouched no matter how long — static,
one ternary, or several. So "just long, prettier will handle it" is never a
real option here; the only choice is leave-as-is or manually extract. That
also means a single ternary isn't automatically safe to skip: three lines in
`ItemDetailPanel.tsx` (the backdrop, the panel and the description
hover) each had exactly one ternary but were 144-294 characters, almost
entirely static classes. Extracted the static base into a named constant
(`BACKDROP_BASE`, `PANEL_BASE`, `DESCRIPTION_DISPLAY_BASE`) in all three for
consistency — same open/closed-style pattern each time, and fixing only the
most extreme one would've been an arbitrary line to draw. The resulting
constant-declaration lines are still long (207, 151 chars) — that's fine,
they're now the single-string-literal case (format-only signal #3), same as
`pillUtils.ts`'s own exported constants.

**When a purely static `className` (no interpolation at all) is long** — see
format-only signal #3 (single string literal); extracting doesn't add
anything when there's no logic to separate out, so just accept the length.

**The dynamic part doesn't have to be a conditional to trigger this** —
`client/src/components/AgentsModal.tsx` had a plain lookup
(`${surfaceBadgeColors[agent.surface] ?? ''}`), not a ternary, and the line
was still long enough that the static classes alone (~90 chars) plus deep
JSX indentation were already past budget before the dynamic part added
anything. The fix is the same either way: extract the static base
(`SURFACE_BADGE_BASE`), leave the dynamic expression exactly as it was. Don't
waste effort shortening or renaming the dynamic part itself if the static
prefix is what's actually driving the overage — check which one is the
actual cause before deciding what to touch.

### 3. An inline object type is long, and/or the same shape appears more than once

**The gap** — `server/src/routes/items.ts`:
```ts
let anchor: { isAttached: number; parentId: string | null; workphaseId: string | null; position: number | null } | undefined;
```
This 4-field shape is restated almost verbatim three lines later in the
`.select({...})` that populates it, and a near-identical shape constrains
`withPositionScope`'s generic parameter in
`server/src/lib/itemPositionScope.ts`:
```ts
export function withPositionScope<T extends { isAttached: number | boolean; parentId: string | null; workphaseId: string | null }>(
```
Neither line is long because of one-off complexity — they're long because a
recurring row shape keeps getting retyped inline instead of named once.

**Fix pattern:** name the shape (`type AnchorRow = {...}` or similar) where
it's first needed, and reuse it at the other call sites. This shortens the
line *and* removes a place the two copies could silently drift apart —
worth a second look regardless of line length if you spot it.

### 4. An inline object-literal argument is what's pushing a call over the limit

**The gap** — `server/src/routes/items.ts` (pre-fix):
```ts
scopeUpdates.position = resolveAppendPosition(
  items,
  positionScopeFor({ isAttached: true, parentId: resultingParentId, workphaseId: newParent.workphaseId }, req.params.id, tx),
  tx,
);
```
The object literal alone is most of the line. Left inline, prettier's fallback
for an over-width call is to explode *every* argument onto its own line —
here that means a 4-argument, one-per-line block for what's conceptually a
short call ("resolve an append position for this scope"). The exploded form
isn't wrong, but it buries a simple call under punctuation.

**Fix — name the object above the call:**
```ts
const scopeInput = { isAttached: true, parentId: resultingParentId, workphaseId: newParent.workphaseId };
scopeUpdates.position = resolveAppendPosition(items, positionScopeFor(scopeInput, req.params.id, tx), tx);
```
This collapses the call back to one line *and* gives the object a name that
documents what it represents — applied throughout `items.ts`'s
`PATCH /:id/move` and `PUT /:id` handlers (the `scopeInput`/`anchorProjection`/
`doneUpdate`/`positionUpdate` locals), each pulled out of a `positionScopeFor(...)`,
`.select({...})`, or `.set({...})` call that was otherwise long only because
of its inline object.

**When this doesn't apply:** a single-field object (`{ isTerminal:
workphases.isTerminal }`) rarely needs this — the object isn't what's making
the line long, the query chain around it is (see format-only signal #1
below), and extracting a one-field object into its own `const` just adds a
line without shortening anything that matters. The test is concrete, not a
vibe: would naming the object actually let the call fit back on one line? If
yes, extract it. If the line is still going to wrap regardless, leave it.

**The same principle applies beyond object-literal arguments** — any inline
computed expression embedded in a template literal, once verified that
prettier won't touch it (it never reflows a template literal's `${...}`
content, in JSX or plain TS alike — confirmed both ways). `server/src/mcp.ts`:
```ts
if (!match) throw new Error(`Unknown item type: "${args!.type}". Available: ${itemTypes.map(t => t.name).join(', ')}`);
```
Naming the computed part fixes it the same way:
```ts
if (!match) {
  const availableNames = itemTypes.map(t => t.name).join(', ');
  throw new Error(`Unknown item type: "${args!.type}". Available: ${availableNames}`);
}
```

### 5. A function signature is accumulating positional parameters, especially same-typed ones

**Borderline example (not yet worth changing)** —
`server/src/lib/itemTree.ts`:
```ts
export function assertValidReparent(table: SelfRefTable, id: string, parentId: string, selfLabel: string, tx?: Tx): string | null {
```
4 required params, 3 of them `string`. Once prettier wraps this one param
per line it's perfectly readable — this is *not* a restructure signal by
itself. The threshold to actually intervene (extract an options object) is
when a signature like this picks up a 6th or 7th param, or when two
adjacent same-typed params become plausible to swap by accident at a call
site. Flag it as a Watch List item if you see it heading that direction;
don't preemptively refactor a 4-5 param function just because prettier
wraps it across several lines.

---

## Signals: This Line Is Just Long (let prettier handle it)

### 1. A single Drizzle query chain assigned to one named variable

`select().from().where().get()/.all()/.run()` is one logical operation — the
length comes from the query builder's fluent API, not from the line doing
several things. Examples: `items.ts` (`targetWorkphase`), `items.ts`
(`newParent`), `itemPositionScope.ts` (`workflowIdForWorkphase`'s body).
Let prettier break the `.select({...})` object or method chain across lines;
don't hand-restructure the query itself. (If the *identical* chain shows up
in more than one file, that's a Duplication & Abstraction finding for the
audit passes — not a line-length concern to solve here.)

### 2. An object literal or `.select({...})` projection lists several fields that are all genuinely part of one row

Example: `items.ts`'s 4-field anchor select. The field count reflects
the row's real shape (what the code actually needs back), not scope creep —
letting prettier break the `{ ... }` onto one field per line is the correct
outcome, no manual trimming needed.

### 3. The entire line is one string literal that can't be shortened without changing what it says

Examples: `server/tests/routes/workphases.test.ts`'s `it('backfills
items on a non-terminal -> terminal flip, preserving their position order as
completedAt order, and clears position', ...)` test description;
`server/src/mcp.ts`'s 251-character MCP tool-parameter `description`
field; `pillUtils.ts`'s `INPUT_LG_RING` Tailwind constant (itself the
*correctly extracted* end state of signal #2 above — all static classes, no
embedded logic). None of these have a "too much in one line" problem to fix;
the content itself is the length. Leave them for prettier, which mostly
leaves a single-string-literal line untouched anyway.

### 4. An import statement enumerates every symbol the file genuinely uses

Example: `server/src/routes/workflows.ts` imports 8 named exports from
`schema.ts`. Prettier already wraps import lists one-per-line past
`printWidth` — no manual intervention needed. (If a single file needs 10+
imports from *one* module, that's more likely a File Responsibility signal
about the file itself than anything about this one line — a different
audit lens, not this one.)

### 5. A single declarative statement with one attached option

Example: `server/src/db/schema.ts`:
```ts
itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
```
One column, one FK, one cascade option — inherently a bit long because of
Drizzle's column-builder API, not because the line is overloaded.

### 6. A test's request body or fixture-call argument is a multi-field object literal

**Verify this one, don't eyeball it.** A hand-formatted object already sitting
multi-line in a test file (fields grouped a few per continuation line) can
look like "this is what prettier already did here" — it usually isn't.
Running the real binary against `server/tests/routes/items.test.ts` (`cd
client && npx prettier --config .prettierrc <file>`, since that's the only
package with it configured) showed:
- A **chained** call — `request(app).post('/api/items').send({...})` —
  breaks the chain first (`request(app)` / `.post(...)` / `.send({...})`,
  one per line), and if the trailing object then fits, prettier leaves it
  alone. This reads fine; no manual change needed.
- A **plain single-argument call** — `createItem({...5 fields...})`,
  `db.insert(x).values({...})` — explodes the object to one field per line
  regardless of where it's declared (inline as the argument, or lifted to a
  preceding `const` first) — extracting it here buys nothing, since the
  object's own width is what's driving the wrap, not the surrounding call.
  Unlike signal #4 above, there's no second short argument at risk of being
  dragged into a one-per-line explosion alongside it.

Net: leave both shapes for prettier. The general test here is signal #4's
same question — would extracting the object let something else collapse
back to one line? — but for a single-argument call or an already-short
chain, the answer is usually no, so don't extract preemptively.

### 7. Prose inside a `//` or `/** */` comment

Example: `server/src/lib/positionResolver.ts`, trailing rationale
comments up to 168 characters. **Prettier does not rewrap comment text at
all** — running the formatter leaves these exactly as long as they already
are. If a long comment is genuinely hard to read, soft-wrapping it onto
multiple `//` lines is a manual edit you make independently, on its own
merits — it isn't something the "restructure vs. let prettier format"
choice applies to, since prettier isn't going to touch it either way.

---

## Quick Reference

| Signal | Category | Typical fix |
|---|---|---|
| Query embedded inside an `if`/ternary condition | Too much | Name the query result above the branch |
| `className` where static classes bury the conditional logic (any ternary count — prettier never touches this line either way) | Too much | Hoist static base to a constant/local; keep logic inline |
| Inline object type, especially one that recurs elsewhere | Too much | Extract a named `type` |
| Inline object-literal argument, extracting it would let the call fit on one line | Too much | Name it in a `const` above the call |
| Function signature approaching 6-7 positional params | Watch List | Options object, once it actually gets there |
| One Drizzle query chain, one named variable | Just long | Let prettier wrap it |
| Multi-field `.select({...})`/object literal, one row's shape | Just long | Let prettier wrap it |
| Whole line is one string literal (message, test name, description) | Just long | Leave as-is |
| Test request body / fixture-call object, chained or single-argument call | Just long — verify with real prettier, don't eyeball | Let it wrap/explode; extract only if it collapses another argument |
| Import list naming everything the file uses | Just long | Let prettier wrap it |
| One declarative statement, one attached option | Just long | Let prettier wrap it |
| Long `//` or `/** */` comment | Not prettier's concern | Manually soft-wrap if it's genuinely hard to read |

---

## Process

1. In the files you changed, find lines over 120 **displayed characters**, not bytes (see the measurement note above).
2. Classify each flagged line against the signals above.
   - When it's genuinely ambiguous, default to "just long". This is triage, not a rewrite: don't restructure a line whose only sin is length.
   - Don't reason about what Prettier "would do" from how the code already looks. Hand-formatted code is no proof of Prettier's output. Check with the real binary instead: `npx prettier <path-to-file>` prints the formatted result without writing it, using the nearest config.
3. Apply the manual restructures first.
4. Run `npx prettier --write` on the files: from `client/` for client files, and from the repo root for `server/` and `tests/`. `npm run format:check` then confirms the result.
