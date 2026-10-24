# API Contract — Zod + OpenAPI

**Type:** tech-debt epic · **Written:** 2026-09-26 by the Architect · **Sequenced:** after Epic 3.5 closes, before Epic 4

This epic was split out of `docs/planning/epic-4-decisions.md`, whose §1–§8 it replaces. Those decisions were recorded against Epic 4 only because Epic 4 was the next epic at the time. They were never about Quick Items. The round table (`docs/planning/round-tables/documentation-purposes-and-standards`, NZ15, A0, PO F4, Auditor F10, Architect F5) then made OpenAPI the API's documentation. Two of the carried decisions change as a result; both are marked below.

This plan uses the tech-debt variant of the story template. Each story below is a placeholder, detailed when it's planned.

## Goal

Today a request or response shape is declared by hand in up to five places, and nothing keeps them in sync:
- the route's validation code;
- `client/src/types.ts`;
- an MCP tool's `inputSchema`;
- a `.bru` file;
- the tests.

This epic makes one Zod schema the source for each shape. From it come:
- validation;
- server types;
- a published OpenAPI document;
- the client's types;
- MCP validation.

When the epic closes, the API contract is generated, complete and current, and nothing hand-written can drift from it.

**The guiding principle is carried over unchanged:** consolidate a shape into one definition only where it serves several consumers without distorting any of them. Where their needs really differ, don't force a shared source. Bruno (C6) is the case where they differ.

**Out of scope:**
- **Business rules that need the database**, such as a workphase existing, a valid reparent, a parent in the same project, or the depth cap. These stay hand-written in the routes and in `server/src/lib/`. The rule that every hierarchy write goes through one primitive, `itemHierarchy.ts`, is untouched.
- **§3 of the old decisions (TSDoc on exported lib functions).** That's a comment convention, so it goes to A1's comment guide.
- **§8 of the old decisions (`server/` has no ESLint).** A tooling gap unrelated to the API, now covered by `tooling-gates.md`.

## Decisions

**C1. Zod validates every request, on every non-test route.** *(Was §1. Amended 2026-09-26.)*
- **What it covers:** the body, the path params and the query string.
- **Only checks that don't need the database** move into schemas (`typeof parentId !== 'string'`, "`side` must be `before` or `after`", "title is required"). Anything that needs the database or another entity stays as it is.
- **The amendment:** §1 originally adopted Zod one route at a time, with no requirement to finish. That changes because OpenAPI is now the documentation, and the old §5 only allowed publishing once coverage was complete.

**C2. A validation failure returns `{ error: string }`.** *(Was §2, unchanged.)*
- A `ZodError`'s issues are flattened into one message string.
- The client's `api/shared.ts` reads exactly this shape when building an error message, and the tests and Bruno assume it too.
- A raw `ZodError` would change the contract without saying so.

**C3. Tests that only check shape shrink; tests of business rules don't.** *(Was §4, unchanged.)*
- **Once a route adopts a schema,** a supertest round-trip that only checks shape ("400 when title is missing") becomes:
  - a schema unit test (`Schema.safeParse({}).success === false`);
  - plus one route-level test proving the schema is wired in.
- **Tests that need the database keep their current form and coverage.** Adopting Zod is never a reason to drop them.
- **Scale:** the server tests have 79 assertions on a 400 response. Each story sorts the ones in its scope into these two kinds.

**C4. The OpenAPI document gets published once it's complete.** *(Was §5. Amended 2026-09-26.)*
- **As routes adopt schemas,** they're registered in the OpenAPI registry.
- **Once every non-test route is registered:**
  - `npm run openapi` writes `server/openapi.json`, which is committed;
  - the server serves it read-only at `GET /api/openapi.json`;
  - a check in the gate fails if the committed file is stale.
- **No Swagger UI.** Any OpenAPI viewer can read the JSON.
- **`/api/test` routes are left out.**
- **The amendment:** §5 had deferred publishing indefinitely, because a partial document would misrepresent the API. C1's full coverage removes that objection.

**C5. MCP adoption happens in two tiers.** *(Was §6.)*
- **Tier 1, in Story 1:** `mcp.ts`'s existing switch statement validates with the same schemas.
  - A small generic `snakeToCamel` step bridges the MCP convention (`item_id`) to the REST one (`itemId`), replacing each tool's hand-written field mapping.
  - It adds a `move_project` tool.
- **Tier 2, in Story 6:** see OD3.
  - **What it does:** `McpServer.registerTool()` takes over tool registration, so each tool's listed schema comes from Zod.
  - **Why it's one pass:** the SDK (1.29) allows one handler per request method, so all nine tools must move together.
  - **What else it closes:** `move_item` currently exposes only `workphase_id`, not anchor and side. Tier 2 fixes that too.

**C6. Bruno stays hand-written.** *(Was §7, unchanged.)*
- **No codegen.** Importing OpenAPI would destroy the `{{var}}` templating, and Bruno's import is a one-time skeleton, not a sync.
- **Optional:** a route that has a schema can gain `assert{}` blocks and a companion `-invalid.bru` file.

**C7. The contract is generated and owned by the Architect; the rules live in the wiki.** *(New, PO F4.)*
- **Nothing in the contract is hand-written:** the fields, types and error payloads all come from Zod.
- **The wiki states the business rules and the outcomes a user can see,** once for every surface (UI, API, MCP). Status codes may stay in the wiki.
- **The wiki holds no per-endpoint reference.**

**C8. Responses get schemas, which tests check. The server doesn't validate them at runtime.** *(New.)*
- **Every route's success response** is registered in the document, along with the error shape.
- **The server tests parse real responses against those schemas,** so the document can't drift from what the server sends.
- **No runtime check:** it would cost time on every request and could turn a working request into a 500.
- **Deriving schemas from `schema.ts`:** responses that are plain table rows might come from `schema.ts` (drizzle-zod's `createSelectSchema`), and decorated responses would extend those. Story 3 checks that this works with `drizzle-orm` 0.45 before relying on it.

**C9. Schemas live in `server/src/schemas/`, one file per route file, and are parsed inside the handler.** *(New.)*
- **One file per route file**, the same layout `client/src/api/` already uses.
- **The parse helper** has the same shape as `getByIdOrNotFound`: it returns the parsed, typed value, or it sends the 400 and returns `undefined`.
- **Why not middleware that rewrites `req`:** Express 5 makes `req.query` a read-only getter. An in-handler call also keeps the parsed types exact.
- **Where registration goes:** each route's OpenAPI registration sits next to its schema.

## Open decisions

**OD1. Where the client's types come from.** *Nathan rules on this before Story 5 is planned. It doesn't block Stories 1–4.*

| | (a) A shared package | (b) Generated from the OpenAPI document |
|---|---|---|
| How it works | The client imports the server's Zod schemas (`z.infer`), through an npm workspace or a path alias | A tool such as `openapi-typescript` writes `client/src/api/generated.ts`. `types.ts` becomes short aliases over it (`type Item = components['schemas']['Item']`) |
| For | One definition, and no generation step | The two packages stay separate. The client compiles against the published document, so a wrong document breaks the client's build. It still works if the API moves or gains other clients |
| Against | The client build depends on server source. Either the client compiles server-side modules (Node types, Drizzle), or the schemas move into a new package. It couples two packages the repo keeps apart today | A generation step, a staleness check in the gate, and an alias file, because generated types are verbose |

**Recommendation: (b).** The published document becomes the one thing both sides agree on. The client is the strongest check that the document is right, and the document is what outlasts any change to the repo's layout. Either way, root `CLAUDE.md`'s convention that `types.ts` is manually synced with `schema.ts` gets replaced when Story 5 lands.

**OD2. Which OpenAPI library.** A short spike decides this at the start of Story 1.
- **It must:** support Zod 4, produce OpenAPI 3.1, and build a registry without being tied to Express.
- **Candidates:** `@asteasolutions/zod-to-openapi` (the one the old decisions named) and `zod-openapi`.

**OD3. Whether tier 2 of the MCP work happens.** Decided when Story 6 is planned.

**Recommendation: yes.** It closes the last hand-written copy of a request shape, and it closes `move_item`'s missing anchor and side at the same time.

## Stories

**Each story restructures server code,** so each gets the usual per-story audit. The epic gets an epic-wide pass when it closes.

1. **Foundation and pilot.**
   - The OD2 spike, then add `zod` and the chosen library.
   - The parse helper (C2, C9) and the registry plumbing.
   - Move `PATCH /items/:id/move` and `PATCH /projects/:id/move` onto schemas.
     - *Added by the Architect, from A5d's D5 (2026-10-06):* the two moves name a neighbor differently. An item's move sends `anchorId` and `side`, and a project's sends `prevId` or `nextId`. The wiki states one rule for both, a neighbor and a side (wiki positioning §2), so either shape meets it. Nathan wants project and item operations symmetrical, so whether they become one shape is this story's call.
     - A project move naming both `prevId` and `nextId` uses `prevId`, and doesn't check `nextId`. The schema decides whether that's refused.
   - MCP tier 1 (C5).
   - C3's test changes for those two routes.
2. **Request schemas for every remaining route.** That's 53 endpoints in 13 route files; many GETs take only path params. Done in batches by resource:
   - items and projects. Whether a create or an edit takes a position, and whether a field it doesn't take is ignored or refused, is open in `positioning-on-create-and-edit.md`, in this folder. So is an item's second stored position (among all its siblings, beside its place among Free items), which changes the item's response shape and how a move names its neighbor. Groom that story before this batch, so the schemas encode its answer;
     - *Added by the Architect, from A5d (2026-10-06):* A5d added `GET /api/projects/depth-cap`, which returns the project depth cap. The count above includes it. The item cap comes as `itemDepthCap` on `GET /api/boards/:id` instead. Both caps are the same kind of value, so whether they come the same way is this batch's call (for the response, Story 3's).
   - workflows, workphases, boards and columns;
   - everything else.
3. **Response schemas and contract tests** (C8), for every route's success response and the error shape.
4. **Publish the document** (C4).
   - Hand the wiki's API sections to the PO under C7's split.
   - Hand the Test Planner the API test-plan cases that only assert shape, per C3.
5. **Client types from the contract**, per OD1.
   - `types.ts` stops mirroring anything by hand.
   - `client/src/api/*` return the contract's types.
   - Root `CLAUDE.md`'s sync convention is replaced.
6. **MCP tier 2** (C5), if OD3 says yes.

## Code map

| Area | Stories | Change |
|---|---|---|
| `server/src/schemas/*.ts` (new) | 1–3 | One schema file per route file |
| The parse helper in `server/src/lib/` (new) | 1 | C2, C9 |
| `server/src/routes/*.ts` | 1–2 | Hand-written checks that don't need the database go; the ones that do stay |
| `server/src/mcp.ts` | 1, 6 | Tier 1, then tier 2 |
| `server/tests/*` | 1–3 | C3 test reshaping, plus C8 contract tests |
| `server/openapi.json`, the `openapi` script, `GET /api/openapi.json` | 4 | New |
| `client/src/types.ts`, `client/src/api/*`, and `client/src/api/generated.ts` under OD1 (b) | 5 | Types come from the contract |
| Root `CLAUDE.md` | 5 | The `types.ts` sync convention is replaced |

## Acceptance

- **Requests:** every non-test route parses its request through a schema, and no hand-written check that doesn't need the database is left in any route.
- **Responses:** every route's success response has a schema that a test asserts.
- **The document:** `server/openapi.json` covers every non-test route, is current (the gate checks), and is served at `GET /api/openapi.json`.
- **Errors:** a 400 still returns `{ error: string }`.
- **The client:** its API types come from the contract; `types.ts` mirrors nothing by hand.
- **MCP:** it validates with the shared schemas. If tier 2 lands, its listed schemas also come from Zod.

## Handoff

**Done as part of the split, 2026-09-26:**
- `epic-4-decisions.md`: §1–§8 replaced by a pointer to this plan. §9–§11 keep their numbers, so existing references still work.
- `epic-3-5-roadmap.md`: the "No Zod in this epic" ground rule now points here.
- `mvp-roadmap.md`: an entry for this epic, between Epic 3.5 and Epic 4.

**Still open:**
- **A1, batch 1 (Architect):** decide whether the comment guide adopts TSDoc contracts on exported lib functions (old §3).
- **The old §8 (`server/` has no ESLint)** is now covered by `tooling-gates.md` in this folder, along with the gap in `tests/` type-checking.
- **The PO (Story 4)** and **the Test Planner (Story 4)**, as listed under the stories.
