# Epic 4+ Deferred Decisions — API Schema, Validation & Documentation Conventions

Technical decisions captured so `mvp-roadmap.md` can stay high-level. Not
actually about Quick Items — recorded against Epic 4 only because it's the
next epic marker, and the goal was to nail down the convention *before* much
more API surface gets built, rather than let it calcify ad hoc. Recorded
2026-09-06 from a design discussion; nothing here is built yet except where
noted.

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

## Decisions

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

## Scope actually shipping alongside the move-endpoint work
Decisions 1, 2, and 6's Tier 1 are the only ones with near-term implementation
attached (the `PATCH /items/:id/move` / `PATCH /projects/:id/move` Zod
schemas, their normalized error responses, and the matching MCP validation +
new `move_project` tool). Decisions 3–5, 7, and 8 are conventions/principles
to apply opportunistically or defer, not committed work items.
