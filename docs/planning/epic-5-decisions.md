# Epic 5+ Deferred Decisions — Tags & Type System

Technical decisions and discussion captured so `mvp-roadmap.md` can stay
high-level. This is the reference doc for when Epic 5 (Tags & Type System) is
actually built — or when pieces slip into the **post-Epic-7 rework window**
(the pass for reworking things the alpha can technically do but not as
intuitively/elegantly as we'd like).

Decisions recorded 2026-07-17 while auditing Epic 3. Nothing here is built yet.

---

## Context: labels today vs. where they're going

Labels were a quick, flat implementation (`labels` + `item_labels` join). The
roadmap's Epic 5 line — *"Replace existing labels with the bucket system"* —
means labels get rebuilt around **And/Or buckets**, likely close to greenfield.
So don't over-invest migrating today's flat labels; capture the intent here and
rebuild in Epic 5.

The "label" vs "tag" name is itself TBD in Epic 5. This doc uses **label**
throughout; the term may be refactored to **tag**.

**Done now (not deferred — see the separate decouple work):** labels are being
decoupled from workflows so they become a single global set. The decisions
below assume that global baseline.

---

## Decisions

### 1. Labels/tags are GLOBAL — not owned by a workflow or a project
A single global set, reusable across every project and workflow. Rationale:
- Investment in a good taxonomy should be reusable everywhere.
- **The Inbox (Epic 6) requires it.** Inbox filters collate items across
  projects/workflows; a tag siloed per-workflow can't power a cross-cutting
  "show everything tagged X" filter. Global tags are a prerequisite for a
  feature already on the roadmap.
- **Single-user reframe:** there's one owner, so "scope" is never access
  control — it's purely an ergonomics/visibility concern (keeping the picker
  from becoming a junk drawer). This keeps any future scoping far lighter than
  the enterprise (Linear/Jira) equivalent.

### 2. Buckets — not individual labels — are the unit of any future scoping
Epic 5 introduces And Buckets (non-exclusive, e.g. "Teams") and Or Buckets
(mutually exclusive, e.g. "Work Item Type"). Scope, when it exists, attaches to
a **bucket**, not to individual labels — nobody wants "project X can see the
`Backend` tag but not `Frontend`"; they want "the *Team* bucket is relevant
here." Designing label-level scoping now would be rebuilt once buckets land.
Note: the item **type** system may itself become an Or-bucket in Epic 5, so
buckets are the convergence point for type + tags both.

### 3. Scoping is deferred; the lean is SOFT, not hard
MVP has **no scoping** — every label is available everywhere. When scoping is
eventually considered, lean **soft** (surface/order the relevant buckets first,
by default) rather than **hard** (only these are permitted here):
- Soft is cheaper, reversible, and never blocks you from slapping one tag on
  one item.
- Signal that tells you which you actually need: when crowding finally hurts,
  notice **whether it hurts because the wrong tags are *offered* (→ soft
  ordering fixes it) or because the wrong tags keep getting *applied* (→ only
  then consider a hard gate)**. Expectation for a single-user tool: it's always
  the former. Signal soft wherever the topic comes up.

### 4. If/when scoped: attach scope to the PROJECT SUBTREE, not the workflow
Post-MVP, and only if crowding warrants it. Prefer project over workflow:
- Workflows are already **shared across projects via inheritance**, so a
  "workflow-scoped" bucket is implicitly multi-project in a confusing, indirect
  way.
- Projects are how the user navigates and where "this is a different area of my
  work" actually lives. A project *subtree* gives inheritance for free (attach
  to a top-level project, children inherit).
- The Inbox crosses workflows, so scope must live above them anyway.

### 5. Inline label creation → replaced by "associate an existing label"
On an item, the flow becomes: **choose from already-created global labels**. If
a story needs something that doesn't exist, direct the user to **Global Label
Management** (not inline create) — that's where there's enough context to decide
whether a genuinely new standalone label/bucket is warranted or the label
belongs in an existing bucket. Any "create new" affordance on the item is just a
link into Global Label Management.
- **Caveat / escape hatch:** the story-specific **custom label** feature stays
  inline (see Decision 6) — it's the one place an item can mint its own pill.

### 6. Two relationship types: MANAGED (reference) vs CUSTOM (value)
This distinction is what lets us avoid the rework-vs-history tension in
Decision 7.
- **Managed label = reference.** Item → FK to a global label. Rename/recolor
  **propagate for free**; merge repoints references (items follow). This is the
  canonical, Inbox-filterable path.
- **Custom label = value.** A free-text pill stored *on the item*, never in the
  global pool. Per-item, can't be orphaned (never a reference), untouched by
  global rework. This is the escape hatch from Decision 5's caveat.
- **Deliberate asymmetry:** custom pills are **outside Inbox filtering** (they
  aren't canonical). That's a feature, not a gap — it's the gentle pressure that
  keeps steering users toward canonical, managed tags.

### 7. Label deletion strategy = DEMOTION (never silent drop)
Rename and merge already propagate cleanly under references (Decision 6). The
only hard operation is **deleting** a managed label that items still reference.
Resolution: **demote, don't drop.** Convert the dangling references into custom
value-pills carrying the last-known text + color.
- The item keeps its pill → the "why did reworking labels make my stories drop
  their tags?" trust-break **never happens**.
- The global set stays clean → the label is truly gone from management.
- No dangling FK to reason about.
- Semantically correct: a demoted pill leaves the managed/filterable space (a
  deleted concept *shouldn't* be Inbox-filterable) but survives as a
  human-readable annotation.
- **Principle if ever forced to a single model:** bias hard against silent
  loss. Stale-but-present (visible, non-destructive, self-correcting by
  re-tagging) is far more forgivable than annotations silently vanishing.

### 8. Global Label Management surface (Epic 5, or post-Epic-7 rework window)
A management view to **create, rename, recolor, merge, and delete** labels and
buckets. Required or global labels rot — nothing else cleans them up once
they outlive their origin project/workflow. **Merge is the load-bearing
operation:** the instant labels are global you'll get two `Blocked`s and want to
fuse them. This is also where the "blocked means different things in different
areas" case is resolved — the manager is where you creatively set up separate
labels/buckets when a term isn't used universally.

### 9. Standalone label vs single-item bucket — Epic 5 implementation detail
The user-facing promise ("I can make one standalone label") is honored either
way. Whether that's a real standalone label or a bucket-of-one under the hood is
an Epic 5 structural decision — don't pre-commit.

---

## Schema implications to remember for Epic 5

- The item needs a slot to hold **custom/value pills** that is *not* a FK to
  `labels`. The same slot serves both the inline custom-label create (Decision
  6) and the demotion target (Decision 7).
- Roadmap says Epic 5 replaces labels with the bucket system → treat as a
  greenfield rebuild; don't spend effort gracefully migrating today's flat
  `labels` rows.
- Once labels are global, the existing memory note *"delete itemLabels by
  labelId when cascading project deletion"* becomes **obsolete** — project
  deletion will no longer delete labels at all (they survive), so that
  cross-project cleanup block goes away. Update/remove that memory when the
  decouple lands.

---

## Position resolution: unify onto `positionResolver`, deferred by schema readiness (not a permanent split)

Captured 2026-09-06, reconstructing an earlier discussion whose original
session transcript is gone. Recorded here as best current recollection,
reconciled against what's actually on disk — flagged below where the two
didn't agree.

**Best current understanding of the decision:** `server/src/lib/positionResolver.ts`
is meant to become the one ordering system for every re-arrangable table —
`items`, `projects`, `workphases`, `columns`, `boards`, and eventually
labels/tags — not a system permanently split between "hierarchical" tables
(items/projects, which have it) and "flat" tables (workphases/columns/boards,
which use the older `nextPosition()` append-only helper instead). The
resolver being "overkill" for a table like `workphases` (which will rarely
have enough rows to hit the tight-gap or magnitude-threshold reindex paths)
isn't a reason to fork the implementation — it's already built and paid for;
running it against a table that never exercises its reindex paths costs
nothing extra. Maintaining two ordering systems long-term is the more
expensive outcome.

**Conflicting record found:** `docs/audits/code-quality-audit-epic-3-2.md:96-115`,
written when projects were unified onto `positionResolver`, states the
opposite conclusion — that "columns/workphases are a deliberately separate,
smaller-scope follow-up (bulk resequence stays appropriate there — see the
session's 'two standards' discussion for why)." That "two standards"
reasoning was never written into a decisions doc, only referenced as living
in that session's transcript — which is no longer recoverable. So there are
two genuine possibilities: (a) unification was always the plan and this note
just documents an intentionally deferred step, or (b) a real "these are
different enough to deserve different systems" argument was made and lost.
Not resolving that tension here — flagging it so it isn't silently
overwritten by whichever memory happens to be freshest when this is picked
back up.

**Why deferred, either way:** joining `positionResolver`'s `PositionedTable`
contract (`id`, `position: real`, `createdAt`, `updatedAt`) requires schema
changes some of these tables don't have yet. Verified against
`server/src/db/schema.ts` on 2026-09-06:

- **`boards`** — already fully compatible: `position` is `real`, and it has
  both `createdAt` and `updatedAt`. No migration needed.
- **`columns`** — `position` is already `real`, but there's **no `updatedAt`
  column** (only `createdAt`). Needs a migration to add it.
- **`workphases`** — same gap as `columns`: `position` is already `real`,
  but **no `updatedAt` column**. Needs a migration to add it.
- **`labels`** (the likely future home of "tags," per this doc's opening
  section) — has **no `position` column at all** today, and no `updatedAt`
  either (only `createdAt`). Ordering doesn't exist yet for labels in any
  form.

Until those migrations land, `boards.ts`/`columns.ts`/`workphases.ts` stay on
`nextPosition()` (`server/src/lib/positionResolver.ts` — the older,
non-reindexing `max(existing) + 1.0` append helper) — no anchor-based
drag-to-reorder and no magnitude-threshold self-heal for those three tables
today, unlike `items`/`projects`.

**Where tags fit:** tags/labels will need position handling of their own once
Epic 5's bucket rebuild lands (this doc's Decision 9 area). Whether that
ordering joins the same `positionResolver` unification pass, or gets decided
independently as part of the bucket system's own design, is an open question
— don't pre-commit either way before Epic 5's actual schema is drafted.

**When this is picked up:** `boards` needs no schema work and could unify
first as a low-risk proof; `columns`/`workphases` need one small migration
each (`updatedAt`); `labels`/tags needs a `position` column added as part of
whatever Epic 5 does with the table regardless of this decision.

---

## OPEN — pick one `positionResolver` entry-point shape before tags implement it

Captured 2026-09-06. **Must be decided before Epic 5 wires labels/tags into
`positionResolver`** — tags will be a third real consumer (after items and
projects), and picking the public API shape after two more callers exist is
strictly more expensive than picking it now with two.

`server/src/lib/positionResolver.ts` currently exposes two entry points for
"where should this row go":

1. **`resolvePositionByAnchorAndSide(table, anchorId, side, scopeWhere, tx)`**
   — anchor + before/after. **This is the only one any real caller uses
   today** (`items.ts:426`, `projects.ts:233`).
2. **`resolvePositionByTarget(table, TargetOptions, scopeWhere, tx)`** — a
   `{prevId} | {nextId} | {edge: 'first'|'last'}` discriminated union.
   Exported, but **called by no route today** — `resolveAppendPosition` and
   the internal prepend/append helpers bypass it entirely. The `edge` branch
   specifically has no caller and no test.

There's also a stale comment on the `Side` type (positionResolver.ts:12-13)
pointing the opposite direction from where this note leans: `// TODO:
depreciate anchorId + side in favor of TargetOptions`. Whatever gets decided
here, that comment needs to be updated or removed rather than left standing
as a contradicted TODO.

**The key finding: making `anchorId` optional on the anchor+side entry point
makes `TargetOptions` a strict, lossless subset of it** — every
`TargetOptions` case maps 1:1 onto an anchor+side call with nothing left
over:
- `{prevId: x}` ⟺ anchor `x`, side `'after'`
- `{nextId: x}` ⟺ anchor `x`, side `'before'`
- `{edge: 'first'}` ⟺ no anchor, side `'before'`
- `{edge: 'last'}` ⟺ no anchor, side `'after'`

That last pair is the real observation: `Edge = 'first' | 'last'` and
`Side = 'before' | 'after'` are the same two-value concept under different
names — `edge: 'first'` and `side: 'before'` with no anchor already resolve
to the identical internal call (the 0.0-floor prepend). `TargetOptions`'s
discriminated-union type safety (can't pass `prevId` + `edge` together)
also stops mattering once anchor+side is down to two params — there's no
combinatorial mistake left to prevent.

**Leaning:** consolidate onto anchor+side with `anchorId` made optional
(absent `anchorId` + `side: 'before'`/`'after'` means prepend-first /
append-last, reusing `resolvePrependAsFirst`/`resolveAppendAsLast`, which
already implement exactly that). Delete `TargetOptions`, `Edge`, and the
public `resolvePositionByTarget` export — fold its dispatch into
`resolvePositionByAnchorAndSide` or keep it as a private helper if still
useful internally. This matches 100% of current real usage, removes an
untested code path, and is provably lossless per the bijection above.

**Status: not yet decided** — leaning stated above, not committed. Whoever
picks this up should make the call and update this section (or delete it and
just make the change) rather than let it sit open past the point tags need
it.

---

## Closed: `client/src/api.ts` file-split watch (audit finding #18) — done, not by Epic 5 after all

This used to be a "watch for Epic 5" note (original text kept below for
history). The split happened on 2026-08-06, well before Epic 5 — and for a
reason unrelated to anything predicted here. It wasn't line-count or Epic 5's
Label Management surface that triggered it; it was Prettier's
`printWidth: 120` under real enforcement, which made several consumer files'
imports from the single `api.ts` explode to 8–12 lines regardless of the
file's own length. Split into `client/src/api/`, one module per domain, no
barrel (`server/src/routes/*.ts` — the thing being mirrored — doesn't use one
either, so a barrel would've been a new, unprecedented pattern for this
codebase). Full account in finding #18's Status in
`docs/audits/code-quality-audit-epic3.md`.

**Nothing left for Epic 5 to do here** — when Epic 5's Global Label Management
surface lands, it just adds to `api/labels.ts` like any other domain change,
no split decision pending.

<details>
<summary>Original note (superseded — kept for history)</summary>

Epic 3 audit finding #18 flagged `client/src/api.ts` (one `// ====` section per
API domain, ~500 lines as of 2026-08-05) as a natural split candidate — one
module per domain (`client/src/api/boards.ts` etc.) with a barrel
`api/index.ts` — once it "crosses ~700 lines or the next epic's endpoints
land."

Checked against the roadmap while closing out finding #18: **Epic 4 (Quick
Items) is unlikely to be that trigger** — it adds a `kind` field and
bucket-aggregation behavior on top of the existing Items domain, not a new API
surface of its own. **This epic is the more likely trigger**: Decision 8's
Global Label Management surface (create/rename/recolor/**merge**/delete for
both labels and buckets) replaces the current ~45-line `Labels` section with
something substantially larger. Epic 6 (Inbox) compounds it further with a
genuinely new domain (saved filter configs) landing right after.

**When Epic 5 is actually implemented:** re-check `api.ts`'s line count once
its endpoints are drafted, and do the `api/` split then rather than deferring
again — don't pre-build the split's shape now, before Epic 5's actual bucket
API is designed.

</details>
