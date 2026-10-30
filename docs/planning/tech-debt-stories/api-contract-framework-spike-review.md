# API Contract Framework — Decision Review Packet

**Prepared:** 2026-10-30 by the Architect · **Status:** ready for Nathan to request role input; no requests sent · **Implementation:** `7410110be18f59263a3682e6843186e29c136ee3` on `api-contract-framework-pilot`

## Decision requested

The Architect recommends **Zod 4 native conversion plus small OpenAPI 3.1 assembly and generated client declarations** for the next behavior-preserving migration. Nathan can adopt and authorize a replanned migration, extend evaluation for a specific unresolved need, or stop. Review input informs that decision; this packet is not approval or a request to start implementation.

The integrated pilot passed all 77 frozen compatibility cases, the full gate (780 server / 604 client / 235 tooling tests), and unchanged Playwright (219 passed / 18 skipped). Native and library-backed Zod generated identical prototype documents/types. TypeBox/Ajv also passed the prototype checks. Only native Zod has real-handler integration evidence; D4's trigger for a second integrated trial was not reached.

## Read and inspect

- [Results, Batch 4](api-contract-framework-spike-results.md#batch-4--final-recommendation): criterion-by-criterion comparison, actual declaration counts, costs, limitations and retained-file inventory. Earlier batches hold versions, primary references and raw measurements.
- [Proposed migration replan](api-contract-zod-openapi.md#proposed-replan-after-the-spike): reuse the pilot; preserve behavior/tests; migrate remaining resource slices; publish only after coverage is complete.
- [Compatibility follow-up queue](api-contract-compatibility-follow-ups.md): CF1–CF6 expected versus observed behavior, evidence, owner and disposition. No correctness change has been bundled into the refactor.

From the repository root:

```powershell
# Comparison code and measurements added after the frozen baseline
git diff 0565cde 843f132 -- server/tests/contracts/prototypes
# Retained real integration, consumers, generated artifacts and tooling
git diff 843f132 7410110
# Confirm original production behavior/tests against the pre-pilot comparison
git diff 843f132 7410110 -- tests client/src/test server/tests/contracts/apiCompatibility.test.ts server/tests/contracts/__snapshots__
```

The last command should be empty. Inspect existing server/client tests too: Batch 3 added its integration test file without changing or removing prior tests. Batch 4's working diff is planning/tooling documentation only.

Focus the implementation review on `server/src/schemas/`, `lib/parseRequest.ts`, the item hierarchy primitive and three route files, `mcpItemTools.ts`/the dispatcher, and `client/src/api/pilotTypes.ts`/the selected generated consumers. The document is a four-operation development artifact, not the complete published API.

## Reproduce

After normal root/server/client installs, install the isolated tools and run sequentially:

```powershell
npm.cmd ci --prefix server/tests/contracts/prototypes --ignore-scripts
npm.cmd --prefix server/tests/contracts/prototypes run check:generated
npm.cmd --prefix server/tests/contracts/prototypes run check:pilot
npm.cmd run test:e2e
npm.cmd run check
```

Freshness checks do not regenerate files. The normal gate checks all nine generated artifacts. Optional `drill:pilot` temporarily edits real source, regenerates, tests and restores in `finally`; run it alone with a clean working tree and inspect `git diff` afterward. Its three trials demonstrate optional-field propagation, required-response drift and a nullability regression. No source experiment or fault remains committed.

Do not overlap server test commands: they share one SQLite fixture database. The order above matches the successful retained-code run. Run suites sequentially; if Windows retains connections near its local port limit, let them clear between HTTP-heavy commands and before retrying a port-exhausted run. On this machine the `tsx` CLI/Playwright startup requires an authorized outside-sandbox launch because sandboxed Windows user lookup fails. This is execution setup, not a test change.

## Questions for later role input

| Role | Review request |
|---|---|
| Coder | Is the preserved lookup/parse/error order correct? Are the raw-anchor boundary assertions and UI subset aliases narrowly justified? Is the remaining native assembly small enough to own, and what concrete next-route requirement would trigger a library trial? |
| PO | Confirm the wiki/business-rule versus generated technical-reference boundary. Triage CF1–CF3 and CF5; distinguish retained observations from intended behavior. Keep positioning decisions separate. No wiki edits are requested before a ruling |
| Test Planner | Assess gaps beyond the 77 captures and the 18 unchanged skips, registration coverage limited to four operations, and MCP stdio coverage. Preserve existing tests; propose additional cases without trading away the baseline |
| Auditor | Trace shape authorship through handlers, emitted schemas and consumers; inspect declaration duplication and development/runtime isolation. Review compatibility findings and the absence of claimed API-wide coverage. Do not treat the pilot's passing tests as an exhaustive semantic audit |

## Limits that matter to the decision

- Generated TypeScript misses some conditional/refusal constraints in every candidate. Runtime schemas and independent behavior tests remain necessary.
- Custom refinements/coercion can disagree with emitted schemas. The selected forms avoid those gaps; future contracts need explicit probes.
- Domain/UI enum duplication and optionality remain. `positionScope` currently has three authored enums, not a completed single-source migration.
- Legacy 500s, permissive inputs, both-neighbor precedence and raw MCP forwarding are deliberately retained. Their corrections are separately queued.
- The generator has an isolated TypeScript 5 peer; consumers are checked with application TypeScript 6. The nested install and comparison-test overhead remain until normal tooling is separated after approval.
- Only existing `get_item`/`move_item` advertisements/adapters and one Bruno scenario were connected; no new tools, SDK registration migration, runtime tool validation, or complete scenario catalog is claimed. MCP reuse is primitive-level: future field-specific REST constraints still require adapter review and HTTP-backed checks.
- D4 still applies: if actual needs require general-purpose assembly or repeated workarounds, preserve native and add a comparable `zod-openapi` trial. Do not automatically switch libraries or discard either implementation.

No roles have been invoked, no final stack decision recorded, and no broader migration, merge, publication or archival sign-off is authorized by this packet.
