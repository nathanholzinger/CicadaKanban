# M1 — Independent API and Consumer Inventory

**Reviewed source:** `575b33ba14b545c7fbdf9dca69dcca99d1337bf3` on `api-contract-migration` · **Main ancestry:** `c1aa1de964235388ea3752a346b071c7b3433821` · **Prepared:** 2026-10-30 by the Architect

## Scope and independence

This inventory comes from `server/src/index.ts`'s actual mounts and health handler, the route modules, their response/validation helpers, client API modules, MCP dispatch and Bruno request files. It was not derived from the OpenAPI registry, generated declarations or the four-operation compatibility corpus. A TypeScript syntax-tree scan enumerated declarations; the Architect traced the shared response/status helpers and variants below. This is source-reviewed planning evidence, not a separate Auditor sign-off or an assertion that all inputs/variants have been exercised.

There are **54 declared non-test operations**: **17 GET, 12 POST, 8 PUT, 6 PATCH and 11 DELETE**. All 12 creates/comment/assignment POSTs return 201 on success; a literal-only `res.status` scan misses item creation's `respondWithItem(..., 201)` call. All 11 DELETEs can return bodyless 204, with workphase deletion additionally returning a 200 report. Four operations are already on schemas; **50 remain** (M2: 10, M3: 17, M4: 23).

Inventory IDs `I01`–`I54` are bookkeeping identifiers, not test-plan case IDs or generated operation IDs. `Retained` means preserve/recheck the integrated contract, not that the entire resource is migrated.

## Reading the tables

- Paths include the actual `/api` prefix and Express parameter names. Express IDs remain arbitrary strings; no new UUID constraint is inferred.
- Success cells name the source representation, not a claim that an existing Zod component covers it. Arrays include empty arrays. Stored rows include their existing nullability/numeric flags/timestamps; dynamic detail/write variants are called out below.
- Error cells list handler/shared-helper refusal branches. All rows additionally share the global JSON **500 `{ error: string }`** backstop; JSON parsing occurs before route target lookup. This is not approval to turn parser/binding errors into 400. Listed guards still need their reachable wire forms and precedence characterized before replacement.
- Most entity GET/PUT/DELETE 404s come from `getByIdOrNotFound`, not literal route calls. Empty list/association reads and idempotent deletes must not gain a 404 merely for consistency.
- `E400`, `E404`, `E409`: `{ error: string }`. `C400`: ordinary 400 or 400 with `conflictingColumnId`. `R400/404`: reorder validation; malformed input is 400, missing IDs are **404 `{ error, missingIds }`**. `F500`: route-specific 500 envelope, distinguished from the shared backstop. See the variants/watchpoints below.

## Items and projects — M2

Sources: `routes/items.ts`, `routes/projects.ts`, `getOrNotFound.ts`, `itemHierarchy.ts`, `positionResolver.ts`, `projectCascade.ts`. Each source path is under `server/src/`. Client helpers are in the corresponding `client/src/api/` module.

| ID | Method and path | Success representation | Route refusals | Work | Client helper |
|---|---|---|---|---|---|
| I01 | `GET /api/items/:id` | 200 item detail: scope, derived workflow, depth, direct children, activity | E404 | Retained / M2 | `items.ts::fetchItem` |
| I02 | `POST /api/items` | 201 item write: scope and optional reindex disclosure | E400 | M2 | `items.ts::createItem` |
| I03 | `PUT /api/items/:id` | 200 item write | E400, E404 | M2 | `items.ts::updateItem` |
| I04 | `PATCH /api/items/:id/move` | 200 item write | E400, E404 | Retained / M2 | `items.ts::moveItem` |
| I05 | `POST /api/items/:id/comments` | 201 `{ success: true }`, not an activity row | E400, E404 | M2 | No dedicated client helper; MCP caller |
| I06 | `DELETE /api/items/:id` | 204, no body; item subtree/dependents removed | E404 | M2 | `items.ts::deleteItem` |
| I07 | `GET /api/projects` | 200 flat project rows ordered by position then creation time | — | M2 | `projects.ts::fetchProjects` |
| I08 | `GET /api/projects/depth-cap` | 200 `{ projectDepthCap }` | — | M2 | `projects.ts::fetchProjectDepthCap` |
| I09 | `GET /api/projects/:id` | 200 project row plus owned `workflows` | E404 | M2 | No dedicated client helper; Bruno caller |
| I10 | `POST /api/projects` | 201 project write with optional reindex disclosure | E400 | M2 | `projects.ts::createProject` |
| I11 | `PUT /api/projects/:id` | 200 project write | E400, E404 | M2 | `projects.ts::updateProject` |
| I12 | `PATCH /api/projects/:id/move` | 200 project write | E400, E404 | Retained / M2 | `projects.ts::moveProject` |
| I13 | `DELETE /api/projects/:id` | 204, no body; existing subtree/workflow/board cascade | E404, F500 `Failed to delete project` | M2 | `projects.ts::deleteProject` |

**Variants/characterization handoff:** `respondWithItem` decorates writes with `positionScope`; detail additionally supplies zero-based depth, `workflowId`, direct children with depth/scope, and activity. These are different responses. Reindex arrays are optional and appear only when triggered, on item/project create/edit/move. Activity, notifications, attachment propagation, cross-project effects and refusal atomicity need independent assertions. Preserve current create/edit ignored placement fields, item anchor/side versus project prev/next conventions, scope-array intent, unused-neighbor validation and all missing-body/parser/binding outcomes. M2 owns remaining pre-change request/error precedence captures; it must not infer them from client input types.

## Workflows, workphases, boards and columns — M3

Sources: corresponding route modules, `workphaseOrder.ts`, `workflowItems.ts`, `columnRanges.ts`, `reorder.ts`, `defaultBoard.ts` and cascade helpers.

| ID | Method and path | Success representation | Route refusals | Work | Client helper |
|---|---|---|---|---|---|
| I14 | `GET /api/workflows` | 200 workflow rows; optional raw `projectId` filter | 400 query-schema guard | Retained / M3 | `workflows.ts::fetchWorkflows` |
| I15 | `GET /api/workflows/:id` | 200 workflow plus ordered workphases and scoped/depth-decorated items | E404 | M3 | `workflows.ts::fetchWorkflow` |
| I16 | `POST /api/workflows` | 201 workflow plus `workphases`; bootstraps default board separately | E400, E409 for already-owned workflow | M3 | `workflows.ts::createWorkflow` |
| I17 | `PUT /api/workflows/:id` | 200 workflow row, not full detail | E404 | M3 | No dedicated client helper or saved Bruno request |
| I18 | `DELETE /api/workflows/:id` | 204, no body; workflow deletion chain | E404 | M3 | `workflows.ts::deleteWorkflow` |
| I19 | `POST /api/workphases` | 201 stored workphase row | E400, including missing workflow reference | M3 | `workphases.ts::createWorkphase` |
| I20 | `PUT /api/workphases/:id` | 200 workphase row; terminal flip can backfill items | C400, E404 | M3 | `workphases.ts::updateWorkphase` |
| I21 | `PATCH /api/workphases/reorder` | 200 `{ success: true }` | R400/404 | M3 | `workphases.ts::reorderWorkphases` |
| I22 | `DELETE /api/workphases/:id` | **200 `{ shrunkColumns, deletedColumns }` or 204 no body** | E404 | M3 | `workphases.ts::deleteWorkphase` |
| I23 | `GET /api/boards` | 200 board rows; optional raw `workflowId` filter | — | M3 | `boards.ts::fetchBoards` |
| I24 | `GET /api/boards/:id` | 200 board detail with resolved columns, Unsorted and `itemDepthCap` | E404 | M3 | `boards.ts::fetchBoard` |
| I25 | `POST /api/boards` | 201 stored board; creates default columns separately | E400, E404 for workflow lookup | M3 | `boards.ts::createBoard` |
| I26 | `PUT /api/boards/:id` | 200 board row; display flag normalized | E404 | M3 | `boards.ts::updateBoard` |
| I27 | `DELETE /api/boards/:id` | 204, no body | E404, **E409 for last remaining board** | M3 | `boards.ts::deleteBoard` |
| I28 | `POST /api/columns` | 201 stored column row | C400, E404 for board lookup | M3 | `columns.ts::createColumn` |
| I29 | `PUT /api/columns/:id` | 200 stored column row | C400, E404 | M3 | `columns.ts::updateColumn` |
| I30 | `PATCH /api/columns/reorder` | 200 `{ success: true }` | R400/404 | M3 | `columns.ts::reorderColumns` |
| I31 | `DELETE /api/columns/:id` | 204, no body | E404 | M3 | `columns.ts::deleteColumn` |

**Variants/characterization handoff:** workflow create has custom/template/copy branches and conflict status 409; create/detail/plain update are not interchangeable DTOs. Board detail contains `columns` with displayName/broken/entryWorkphaseId/subRows, `unsorted.uncovered`, `invalidItems`, `needsAttention` and an item depth cap. Cover empty, broken, inherited, foreign/misaligned workphase, done and Unsorted variants with original ordering. Column and workphase range errors can include `conflictingColumnId`; do not strip it via a generic strict error schema. Both reorder endpoints accept final finite numeric positions in their respective `...Orders` arrays—item/project anchor-only policy must not be generalized to them. Their missing-ID errors include `missingIds`. Workphase delete returns raw changed/deleted column rows only when changes occurred; the client intentionally branches on status. Existing truthiness/flag/display-mode normalization and terminal backfill/disclosure behavior need pre-change characterization, not schema-driven tightening.

## Remaining resources — M4

Sources: corresponding route modules and the health handler in `server/src/index.ts`.

| ID | Method and path | Success representation | Route refusals | Work | Client helper |
|---|---|---|---|---|---|
| I32 | `GET /api/agents` | 200 agent rows, creation-time order | — | M4 | `agents.ts::fetchAgents` |
| I33 | `POST /api/agents` | 201 agent row | E400 | M4 | `agents.ts::createAgent` |
| I34 | `PUT /api/agents/:id` | 200 agent row | E400, E404 | M4 | `agents.ts::updateAgent` |
| I35 | `DELETE /api/agents/:id` | 204; references null through existing FKs | E404 | M4 | `agents.ts::deleteAgent` |
| I36 | `GET /api/attachments/item/:itemId` | 200 attachment rows; absent item can yield empty array | — | M4 | `attachments.ts::fetchAttachments` |
| I37 | `POST /api/attachments/item/:itemId` | 201 attachment row; metadata stored as JSON text or null | E400; unguarded FK/binding failures use global 500 | M4 | `attachments.ts::createAttachment` |
| I38 | `DELETE /api/attachments/:id` | 204 even when no row matched | — | M4 | `attachments.ts::deleteAttachment` |
| I39 | `GET /api/labels` | 200 label rows | — | M4 | `labels.ts::fetchLabels` |
| I40 | `POST /api/labels` | 201 label row | E400 | M4 | `labels.ts::createLabel` |
| I41 | `DELETE /api/labels/:id` | 204 even when absent; association FK cascade | — | M4 | `labels.ts::deleteLabel` |
| I42 | `GET /api/labels/item/:itemId` | 200 joined label rows, not join-table records | — | M4 | `labels.ts::fetchItemLabels` |
| I43 | `POST /api/labels/item/:itemId` | 201 `{ success: true }`, including already-assigned success | E400, E404, F500 `Failed to assign label` | M4 | `labels.ts::addLabelToItem` discards JSON |
| I44 | `DELETE /api/labels/item/:itemId/:labelId` | 204, including absent association | — | M4 | `labels.ts::removeLabelFromItem` |
| I45 | `GET /api/item-types` | 200 item-type rows | — | M4 | `itemTypes.ts::fetchItemTypes` |
| I46 | `POST /api/item-types` | 201 item-type row; trimmed name | E400; malformed name types can reach global 500 | M4 | `itemTypes.ts::createItemType` |
| I47 | `PUT /api/item-types/:id` | 200 existing row for no-op or updated row; trimmed name | E400, E404 | M4 | `itemTypes.ts::updateItemType` |
| I48 | `DELETE /api/item-types/:id` | 204; items' type FK becomes null | E404 | M4 | `itemTypes.ts::deleteItemType` |
| I49 | `GET /api/notifications` | 200 unread notification rows, newest first | — | M4 | `notifications.ts::fetchNotifications` |
| I50 | `PATCH /api/notifications/read-all` | 200 `{ success: true }`, no required body | — | M4 | `notifications.ts::markAllNotificationsRead` discards JSON |
| I51 | `PATCH /api/notifications/:id/read` | 200 `{ success: true }`, no required body | E404 | M4 | `notifications.ts::markNotificationRead` discards JSON |
| I52 | `GET /api/workflow-templates` | 200 templates, each with ordered `workphases` | — | M4 | `workflowTemplates.ts::fetchWorkflowTemplates` |
| I53 | `GET /api/workflow-templates/:id` | 200 template plus ordered `workphases` | E404 | M4 | No dedicated client helper; Bruno caller |
| I54 | `GET /api/health` | 200 `{ status: 'ok', timestamp: Date.now() }` | — | M4 | No browser API-module helper; operational/test probe surface |

**Variants/characterization handoff:** preserve agent create/update guard differences and optional-field fallback, attachment JSON-text metadata and unguarded references, idempotent association/delete behavior, POST-versus-PUT item-type name handling, no-op writes, unread-only notification filtering and read-only templates. Missing-reference statuses differ by resource; preserving them is a migration requirement, not a ruling that they satisfy every wiki rule. See [post-migration CF7](../tech-debt-stories/api-contract-compatibility-follow-ups.md). Do not invent missing client functions, new APIs for schema-only chat tables or capabilities to make consumer coverage uniform.

## Curated MCP consumers — eight existing advertisements

Source: `server/src/mcp.ts` and `lib/mcpItemTools.ts`. All calls use the existing low-level dispatcher; reading this source does not establish stdio coverage.

| Tool | HTTP operations used | Adaptation/result responsibility | Receiving work |
|---|---|---|---|
| `list_projects` | I07 | No advertised arguments; project JSON returned as text | M2 shape; M4 shared-field/transport check |
| `list_workflows` | I14 | Optional snake_case project ID mapped into query only when truthy | Retained/M3; M4 transport |
| `get_workflow` | I15 | Required advertised `workflow_id`; escaped path; JSON as text | M3; M4 transport |
| `get_item` | I01 | Required advertised `item_id`; escaped path; JSON as text | Retained/M2; M4 transport |
| `create_item` | I45 lookup then I02 | Type name/ID lookup plus explicit field mapping; prefixed JSON text | M2/M4; no generic casing replacement |
| `update_item` | I03 | Explicit supplied-field mapping and prefixed JSON text | M2/M4 |
| `move_item` | I04 | Only workphase forwarding, response discarded, confirmation text | Retained/M2; M4 transport |
| `add_item_comment` | I05 | Content forwarding; response discarded; confirmation text | M2/M4 |

Advertisements and actual raw forwarding are distinct. Preserve existing descriptions, exposed fields, requiredness, URL encoding, errors/result text and the outer catch. No advertised `move_project` or new anchor inputs exist. The baseline checks two advertisements/helpers through HTTP; M4 owns bounded stdio listing/call/error assurance and broader value-kind agreement. Product-policy/SDK-validation changes remain deferred.

## Authored Bruno consumers — 26 HTTP requests

There are **26 HTTP request files**, **13 with `body:json`**, plus one environment `.bru` file. Counts of 27 `.bru` files include that environment, which is not another operation. Method/URL associations were read directly from the files, independently of schemas. This is not a claim that all scenarios or bodies were validated/executed; only the retained item-move contract check currently supplies that automated demonstration.

| Folder | Operation IDs and file names | Receiving work |
|---|---|---|
| `bruno/items/` | I01 `get-item`, I02 `create-item`, I03 `update-item`, I04 `move-item` | M2 schemas; M4 authored-body checks |
| `bruno/projects/` | I07 `list-projects`, I09 `get-project`, I10 `create-project`, I11 `update-project`, I12 `move-project`, I13 `delete-project` | M2; M4 |
| `bruno/workflows/` | I14 `list-workflows`, I15 `get-workflow`, I16 `create-workflow` | M3; M4 |
| `bruno/workphases/` | I19 `create-workphase`, I22 `delete-workphase` | M3; M4 |
| `bruno/boards/` | I23 `list-boards`, I24 `get-board`, I25 `create-board`, I26 `update-board`, I27 `delete-board` | M3; M4 |
| `bruno/columns/` | I28 `create-column`, I29 `update-column`, I30 `reorder-columns`, I31 `delete-column` | M3; M4 |
| `bruno/workflow-templates/` | I52 `list-templates`, I53 `get-template` | M4 |

Each name above has the `.bru` suffix. Other inventory operations have no saved request in this collection. Keep variables and scenario intent authored; do not generate missing requests merely to fill this table. CF1's project-neighbor prose disagreement stays deferred.

## Explicit exclusions and Batch 3 handoff

- `ENABLE_TEST_ROUTES=true` conditionally mounts five `/api/test` operations: POST reset and PATCH item position, project position, project created-at and project parent. They are excluded from the 54-operation contract inventory, but retained unchanged for testing. A discovery check must handle enabled and disabled test mounts deliberately.
- GET's implicit HEAD handling and CORS middleware's OPTIONS behavior are framework behavior, not additional explicitly declared business operations in this count. Preserve them; do not let introspection manufacture duplicate registry obligations without an explicit documentation policy.
- Unmatched URLs/methods use framework fallback behavior and are not additional declared operations. No auth, chat/attachment UI, database-only table or proposed future API is added to scope by this inventory.
- Batch 3 should independently discover actual mounts/methods and compare this reviewed scope with operation metadata. Registration tests must not derive both sides from `contractOperations` or from the compatibility corpus. Wrong method/path/status/schema associations, enriched errors and 200/204 alternatives need useful failure tests.
- M2–M4 own new per-resource pre-replacement characterization, including currently untested forms, exact errors and failure precedence. Source review is not a substitute for those captures. M5 revisits the matrix and manual dispositions; final main integration refreshes it for incoming changes.
