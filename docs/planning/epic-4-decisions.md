# Epic 4+ Deferred Decisions — API Schema, Validation & Documentation Conventions

Technical decisions captured so `mvp-roadmap.md` can stay high-level. Not
actually about Quick Items — recorded against Epic 4 only because it's the
next epic marker, and the goal was to nail down the convention *before* much
more API surface gets built, rather than let it calcify ad hoc. Recorded
2026-09-06 from a design discussion; nothing here is built yet except where
noted. Section 9 (added 2026-09-21) is a deferred data-model question, not
a schema convention — parked here for the same "next epic marker" reason.

---

## Context: the guiding principle

The same request/response shape currently gets hand-declared in up to five
places with no shared source of truth: the Express route body, the
hand-duplicated type in `client/src/types.ts` (confirmed drift risk — it
mirrors the Drizzle schema independently, nothing keeps them in sync), the
MCP tool's `inputSchema` in [mcp.ts](../../server/src/mcp.ts), the request
body hand-typed into a `.bru` file, and whatever a test asserts against.

The instinct to consolidate all of it into one schema is real but not
unconditionally right — some of these are genuinely independent concerns that
only *look* like the same problem. The rule adopted here: **consolidate where
one definition can serve multiple consumers without contorting any of
them; don't force a shared source where the consumers' needs actually
diverge.** The decisions below are the result of applying that test
consumer-by-consumer, not a decision to adopt any single tool everywhere.

## Decisions - Patterns to Nail Down before implementing more API

### 1. Zod is the shared source of truth for request shapes — adopted incrementally, per-route
Not TSDoc, not a hand-written type: a Zod schema does runtime validation, TS
typing (`z.infer`), and documentation generation from one definition, so it
can't drift the way a comment or a bare type can. Scope for now: **only the
two move endpoints already in flight**, `PATCH /items/:id/move` and
`PATCH /projects/:id/move`. Every other `items`/`projects` endpoint keeps its
existing manual `if` checks — there is no requirement to migrate a whole
resource at once. Different validation strategies coexist fine side by side;
Express validation is per-route, not global, so this is a real incremental
adoption path, not a stepping stone that has to finish.

Zod only replaces **pure-shape** checks (`typeof parentId !== 'string'`,
`side must be 'before' or 'after'`, "title is required"). Checks that require
a DB lookup or cross-entity knowledge — `workphaseExists`,
`assertValidReparent`, the parent's-project-must-match rule in
[items.ts](../../server/src/routes/items.ts) — are unrelated business logic
and stay exactly as they are, regardless of how much of the app eventually
adopts Zod.

### 2. Zod error responses get normalized, not passed through raw
`safeParse().error` is a `ZodError` with an `issues` array, not a string.
Existing routes return `{ error: 'message' }` and both the test suite and the
Bruno collection can reasonably assume that shape. Any route that adopts Zod
must flatten the failure into that same `{ error: string }` contract (e.g.
join `issues[].message`) rather than leak the ZodError shape as an
undocumented breaking change.

### 3. TSDoc is a separate, complementary convention — for exported lib functions, not endpoint shapes
TSDoc comments only attach to named declarations and are read by humans/IDE
hover, not by anything at runtime — they can't produce a schema and don't
belong on anonymous `router.patch('/:id/move', (req, res) => {...})`
handlers. Their job is documenting the *contract* of exported functions in
`client/src/lib`, `server/src/lib`, and `client/src/api` (e.g.
`resolveAnchorPosition`, `classifyPositionScope`) — what a function promises,
given what inputs, with `@param`/`@returns`/`@throws`.

This does not replace this codebase's existing rationale comments (why
position is workflow-scoped, why a parent/child must share a project) — those
explain *design decisions*, a different category TSDoc doesn't touch. Where a
comment already sits directly above an exported function and reads like a
contract description (e.g. the `positionScopeFor` header in
[items.ts](../../server/src/routes/items.ts)), converting it into a `/** */`
block is mostly free — same content, gains IDE hover for callers. Comments
inside a function body stay regular comments.

### 4. Test-suite impact: shape tests shrink, business-rule tests don't
Existing tests like `items.test.ts`'s "returns 400 when title is missing" are
pure-shape assertions that Zod's own test suite already covers by
construction — once a route adopts Zod, that class of test can shrink from a
full supertest HTTP round trip into a cheap schema-level unit test
(`MoveItemBody.safeParse({}).success === false`), plus one route-level smoke
test confirming the validation is actually wired in. Tests like "returns 400
for a non-existent parentId" or "neither projectId nor a resolvable parentId"
are DB-dependent business rules Zod cannot express — they keep their current
form and coverage, unchanged. Adopting Zod anywhere is not license to drop
coverage on the cross-entity checks.

### 5. `zod-to-openapi` / a published OpenAPI spec: plumbing optional, publishing deferred indefinitely
Different in kind from decision 1's incremental scoping: an OpenAPI document
is a *published artifact* that implies completeness. A registry covering only
the two move endpoints, if mounted as `/api/docs`, would misrepresent the API
surface rather than just be incomplete — nobody's misled by an un-migrated
route still using manual checks (invisible internal detail), but everybody
reading a 2-of-30-endpoint Swagger UI would reasonably assume that's the
whole API.

Decision: it's fine to write the `OpenAPIRegistry`/`registerPath` plumbing as
routes adopt Zod (cheap — one call per route, ratchets forward for free), but
do not mount a docs route or hand the generated document to anyone as
documentation until coverage is broad enough not to mislead. Given this API
has no external consumers today, this may never be worth publishing at all —
treat it as optional infrastructure, not a committed next step.

### 6. MCP: two explicit tiers, only one of them in scope now
**Tier 1 (in scope, bundled with decision 1's move-endpoint work):** reuse
the same `MoveItemBody`/`MoveProjectBody` Zod schemas *for validation inside
[mcp.ts](../../server/src/mcp.ts)'s existing hand-rolled switch statement* —
no change to the file's structure. MCP tool args are conventionally
snake_case (`item_id`, `parent_id`) while the REST body is camelCase
(`itemId`, `parentId`); that convention is kept as-is (not flattened to match
REST just to ease schema sharing), bridged instead by one small generic
`snakeToCamel` transform applied before `.parse()`, replacing the per-tool
manual field mapping the file does today. This tier also adds a `move_project`
MCP tool, which doesn't exist yet — genuinely new capability, made cheap by
the schema already existing, not a refactor of something present.

Known gap, not fixed as part of this: the existing `move_item` tool only
exposes `workphase_id`, not the anchor/position/side options the REST
endpoint supports. Left as-is for now.

**Tier 2 (explicitly deferred, separate decision):** migrating `mcp.ts` from
the low-level `Server` + hand-written `inputSchema` JSON to the SDK's
higher-level `McpServer.registerTool()`, so a tool's *listed* schema is
itself Zod-derived and the SDK validates args automatically. This is blocked
from partial adoption by a real SDK constraint, not just a judgment call:
`@modelcontextprotocol/sdk` (confirmed at the installed `1.29.0`) allows one
handler per request method, and `McpServer.registerTool()` installs one
combined `ListTools`/`CallTool` handler covering *every* tool registered
through it — it can't run alongside the current manual switch for the other
tools. Adopting it at all means migrating the whole file's registration
style in one pass, not two tools at a time. Not scheduled.

### 7. Bruno: not a codegen target; `assert{}` blocks are the complementary practice
Regenerating the `.bru` collection from a generated OpenAPI spec would
destroy the `{{baseUrl}}`/`{{itemId}}`-style environment-variable templating
already in every request — Bruno's OpenAPI import is a one-time skeleton
tool, not a sync mechanism, so the collection stays hand-authored. What *is*
worth adding once a route has a canonical schema: native Bruno `assert{}`
blocks checking the response shape (`res.status: eq 200`, field presence),
plus a negative-path companion file (e.g. `move-item-invalid.bru`) exercising
the 400 case — same contract, asserted from the client side. (Not `tests{}` +
an ajv `require()` — unverified whether the installed Bruno version's script
sandbox supports that.)

### 8. Open gap, not a decision yet: `server/` has no ESLint at all
Any enforcement mechanism for the conventions above that runs through
ESLint — `eslint-plugin-tsdoc` for decision 3, `no-warning-comments` for
TODO/FIXME accountability — only reaches server code once `server/` has
ESLint bootstrapped. Today only `client/eslint.config.js` exists; the root
`lint` script only runs the client. Noted so it isn't assumed covered; not
scheduled.

## Decisions - Questions to ask before implementing Quick Items

### 9. Open question, to re-approach in Epic 4: an attached item's workphase — stored cascade, or null and inherit-at-read?
Not a decision. Recorded 2026-09-21 from the Story 4 code-quality audit
discussion (`docs/audits/code-quality-audit-epic-3-5-story-4.md` #1 and the
"no cascade" assertion it prompted), parked here rather than in Epic 3.5
because its natural neighbor is Epic 4's done-column rework, which also
revisits what a status means for a nested item. A data-model question, not
a schema-convention one — kept in this file for the same reason the rest of
it is here: Epic 4 is the next marker.

**The model today: a denormalized copy, maintained by a cascade.** An
attached item's `workphaseId` is a stored copy of its nearest Free
ancestor's. [attachedCascade.ts](../../server/src/lib/attachedCascade.ts)
keeps it in sync — a plain `UPDATE` over the attached subtree on every
parent workphase write (move, PUT, MCP), inside the same transaction — and
[itemHierarchy.ts](../../server/src/lib/itemHierarchy.ts) rejects a request
that names a different workphase for an attached item ("an attached item
inherits its parent's workphase; omit workphaseId or match the parent's").
Nothing else happens to the children: no notification (the
`triggersNotification` check fires for the moved item only) and no activity
entry. Observably, children already behave as if they inherit; the cascade
is cache maintenance. Note the split this leaves: a Stub's *done-ness* is
already derived at read ("reads as done by inheriting the terminal
workphase, storing nothing new" — Epic 3.5 ground rules), while its
workphase is copied.

**The alternative:** attached rows store `workphaseId = null`; the
effective workphase is resolved at read by walking `parentId` to the
nearest item with `isAttached = false` (bounded by `ITEM_DEPTH_CAP`).
Nothing to cascade; drift impossible by construction.

| Concern | Stored copy (today) | Null + inherit |
|---|---|---|
| Source of truth | the ancestor's row, copied down; invariant held by one function | the ancestor's row, resolved by a walk |
| Drift | possible in principle (child ≠ parent); guarded by the 400 above and the cascade | impossible |
| Queries by workphase | a column — `WHERE workphase_id = ?` everywhere | every consumer resolves: the board response's sub-row grouping, `GET /workflows/:id`, MCP `get_workflow`, the Unsorted computation, any future Inbox/Headline or notification filter |
| Meaning of `null` | "Unknown status" (a tolerated soft ref — `SET NULL` on workphase delete, surfaces in Unsorted) | two meanings on one column — attached + null = inherits, Free + null = unknown — disambiguated by the flag |
| Detach | leaves `workphaseId` where it is | must *materialize* the effective value into the row |
| Cross-workflow reparent | the subtree keeps its now-foreign workphases → Unknown until re-filed | attached descendants follow the new root automatically; detached ones still go Unknown |
| Client | reads `item.workphaseId` | needs an `effectiveWorkphaseId` — server-decorated next to `positionScope`, or a client walk; the covered-set rule for a Stub drag (Epic 3.5 Story 5) reads it |
| Consistency with done-ness | split (done derived, workphase copied) | uniform (both derived) |

**The strongest argument each way.** For the stored copy: workphase is the
primary query axis of a Kanban app, and denormalizing it keeps every
consumer — including ones not written yet — a column read; the cascade is
the price of that and it is already single-sourced. For inherit: it is the
honest model — the Story 4 audit's caveat ("re-attaching a child rewrites
its attached descendants' workphases") exists only because the copy has to
be re-synced — and the cap is already derived per read, so the walk is
cheap and bounded.

**Leaning, not ruled: keep the stored value, but define what it *is*.**
State the truth as inheritance and the column as a cache of it — "an
attached item's `workphaseId` always equals its nearest Free ancestor's;
the cascade maintains the cache" — write that invariant into
`docs/wiki/item-attachment/`, and add a cheap integrity check (a test that
walks every attached item on a seeded board and asserts equality, or a
repair-on-read that logs a mismatch). That buys the conceptual purity
without touching every read path. If the cascade ever bites — a real drift
in the wild, or a consumer that wants the walk anyway — the migration is
well-defined: null the attached rows, decorate reads with
`effectiveWorkphaseId`, exclude attached items from Unsorted, materialize
on detach.

**Verify before ruling:** whether anything relies on an attached child's
stored workphase *differing* from its parent's. The E2E "an attached child
whose workphaseId goes invalid still renders only nested, never duplicated
in Unknown status" (`tests/ui/attached-children.spec.ts`) suggests the
client already tolerates a stale copy — evidence the cache framing is safe,
and a case the inherit model would make unreachable.

**What a switch would touch**, so its size is known when the question comes
back: the board response shape (`GET /boards/:id` groups items by
workphase into sub-rows; attached items would need their resolved
workphase, or a separate list), `getWorkflowItems`/`getBoardScopeItems`,
the Unsorted computation, MCP `get_workflow`/`move_item`, the client's
`itemListOps.ts` selectors and the Stub-drag covered-set rule, the
`positionScope` decoration (the natural home for `effectiveWorkphaseId`),
`attachedCascade.ts` (deleted), and a data migration nulling attached rows.
Not an Epic 3.5 change under any outcome.

### 10. Start datetime feature
There will be a start datetime feature that, when set, will automatically move 
an item from Backlog to Active if the current time is after the start time. We
should decide if start-time should be implemented now as part of this story. Or
as a part of epic-5's tag/label work since start-time is likely to get a label
pill and might get classified  as tag/label work.

### 11. Column merging-expanding rework
Right now a column can only merge-expand on one category - workphases. When 
start time is implemented we will also like the ability to expand by start date
so a column can have date buckets. Column expanding eventually will have a 
more generalized group-by-tag feature. This is probably not an effort to 
implement for this epic, but we should figure out where the work will live.

**Where the drag-side work will live** (recorded 2026-09-21, from the
Story 4 code-quality audit discussion of #7/#8 — the `CardList`
consolidation and the `isCardList` predicate). The framing that keeps
those two fixes stable: a bucket is a **facet on a sub-row, not a new
region kind**. The layer stack (Board → Column/sub-row → Card →
Descendants) is untouched by group-by; a date bucket is still `kind:
'subrow'`. What varies per facet is the sub-row's *within-action write*
— workphase today, a date range or label later. So the region-kind
predicates, `placementRegion`, `DragCarveFrame` and the facet-agnostic
`CardList` never change for this; the four places that do:

1. **Region identity** — `subrowRegionKey` / `subrowContainerId`'s
   `<columnId>:<workphaseId>` format and `parseRegionKey`'s parse of it
   (`client/src/components/workflow/dragRegions.ts`, the format's one
   owner). Becomes `<columnId>:<bucketKey>` with the facet resolved from the
   column definition.
2. **Item selection** — `useBoardDnd.ts`'s `regionItems`: today a
   `kind === 'column' ? merged : byWorkphase` switch. A bucket sub-row is
   "the column's items filtered by bucket," so the selector becomes a
   fact the region carries (or a facet switch here), not a kind switch.
   This is the one *positive* kind test the audit's #8 didn't list; it is
   the site group-by touches.
   *Deferred here by Epic 3.5 Story 6.1 (ledger C-6b, 2026-09-24):* the
   same card-list facts (covered workphases, `isTerminal`) are derived in
   three places:
   - `BoardColumn.tsx`, for the render;
   - `dragRegions.ts::cardListStructure`, for the region;
   - `regionItems`, for the release's `others` list.

   All three call the same two selectors, so they agree only by
   convention. Make them read one derivation when this point reshapes
   item selection, or when the done-column rework settles `isTerminal`,
   whichever comes first.
3. **List identity** — `Placement` (`itemListOps.ts`) carries
   `workphaseId` / `parentId`, and `isIdentity`'s `sameList` reads "same
   workphase = same list." Two date buckets in one column share a
   workphase, so a bucket-to-bucket move would read as identity and
   no-op. `Placement` gains the bucket; `isIdentity`, `toRequest` and
   `placementFor`'s card-list branch compare and emit it. The ghost /
   pending marker follows for free (§10: placement is all three), but
   `itemListOps.ts`'s per-list selectors filter by bucket too.
4. **Server** — the board response's `subRows[].workphase` shape becomes a
   bucket, and `PATCH /items/:id/move` has to accept whatever a date/tag
   bucket writes (a `startAt`? a label?) — which is also the open product
   question: what a drop *into* a date bucket means for the item's date.

Not to be pre-built in Epic 3.5. The point of recording it is that Stories
4.1's `kind` discriminant plus the audit's #7/#8 leave the facet work
confined to these four, rather than a branch in twelve places.

## Scope actually shipping alongside the move-endpoint work
Decisions 1, 2, and 6's Tier 1 are the only ones with near-term implementation
attached (the `PATCH /items/:id/move` / `PATCH /projects/:id/move` Zod
schemas, their normalized error responses, and the matching MCP validation +
new `move_project` tool). Decisions 3–5, 7, and 8 are conventions/principles
to apply opportunistically or defer, not committed work items. Section 9 is
an open data-model question with a recorded leaning, to be ruled alongside
the done-column rework.

