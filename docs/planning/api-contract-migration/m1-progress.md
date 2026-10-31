# M1 Progress and Retained Evidence

**Status:** tooling-cleanup batch complete, uncommitted for review; other M1 work and completed-Epic-3.5 integration/baseline pending.

Nathan confirmed that Epic 3.5 remains in progress and authorized proceeding with cleanup on `api-contract-migration`. Local main is `c1aa1de`; it is not the final integration baseline. No merge or completed-main compatibility result is claimed.

## Evidence reference

`api-contract-framework-spike-completed` points to `5408bdb150cbb227298f53aba1cc57d3b7866d61`; it contains comparison `843f132`, integrated pilot `7410110` and recommendation `d703e6a`. Reproduce the pre-cleanup comparison by checking out that evidence branch and following its tooling README. Keep that branch fixed while migration proceeds.

## File disposition before cleanup

| Existing area | Disposition |
|---|---|
| `compatibilityCases.ts`, `compatibilityHarness.ts`, `apiCompatibility.test.ts`, frozen snapshots | Retain unchanged |
| `prototypes/pilotContracts.test.ts` | Move to `contracts/apiContracts.test.ts`; update paths/names and stale-command expectation, retain its nine checks and 77-case response loop |
| `prototypes/pilotArtifacts.ts`, `generatePilot.ts`, `documents.ts`, `typeChecks.ts`, `pilotFieldDrills.ts` | Move/adapt into `tools/api-contracts/` as normal developer tooling; preserve generation, independent validation, application-compiler probes and reversible field drills |
| `prototypes/conversionEdges.test.ts` | Replace with native conversion probes in `contracts/conversionEdges.test.ts`; preserve defaults, coercion/refinement/transform gaps, Ajv mutation boundaries, unknown input preservation and generated-type limits. Library/TypeBox-only parameter/encoding comparisons remain in the evidence revision |
| `prototypes/{zod-native,zod-library,typebox-ajv}/`, `zod-shapes.ts`, `candidates.ts`, `model.ts`, `preflightApp.ts`, `measure.ts` | Retire comparison implementations/staging/measurement support; integrated schemas remain authoritative |
| `prototypeCompatibility.test.ts`, `fieldChanges.test.ts`, `artifacts.test.ts`, `artifacts.ts`, `generate.ts`, seven `generated/` artifacts | Retire comparison-only repeated trials/freshness outputs after preserving evidence. Retain integrated checks, conversion probes and real-source field drills instead |
| Nested comparison manifest/lockfile/README | Replace with normal developer package, root commands/install wiring and current reproduction instructions |
| `server/contracts/pilot.openapi.json`, `client/src/api/pilotTypes.ts` | Rename to `server/contracts/openapi.json` and `client/src/api/transportTypes.ts`; keep wire shapes and UI policies unchanged |
| `client/src/api/generated.ts`, selected callers, schema exports and LF attributes | Retain declarations and update descriptive names/references mechanically |

No product assertion, corpus case or captured payload is retired. The disposition has now been implemented in the working tree; checks below distinguish completed work from pending verification. No story sign-off is claimed.

## Implemented tooling boundary

- Root `npm ci` installs `tools/api-contracts` as a developer workspace. A clean root install succeeded without installing anything under the retired comparison directory. Server/client packages keep their normal independent installs.
- Root commands are `contracts:generate`, `contracts:check` and `contracts:drill`; generation/validation/compiler/drill helpers are in the workspace. Root type-check, lint, formatting and documentation scope include the new tools.
- The application's root/server compilers remain **6.0.3**. The generator workspace pins **5.9.3**, satisfying `openapi-typescript` 7.13.0's peer without downgrading the app. `npm ls` reports valid peers. Ajv 8.20.0 remains developer-only; the workspace declares no Zod, TypeBox or OpenAPI integration-library dependency.
- The old ignored comparison dependency installation was removed after verifying its absolute workspace path. No retained tooling imports from that location.
- `openapi.json` remains explicitly partial. Its paths/components are JSON-equal to the preserved artifact; only its descriptive title changed. Generated TypeScript differs only in its source-symbol header. `transportTypes.ts` retains the same UI subsets/optionality.
- Only the no-emit server test `rootDir` expands to include imported tool helpers; the production server compiler's source/build boundary is unchanged. Normal server type checking now checks that original production configuration as well, so the wider test boundary cannot mask an accidental production import of development tooling.

## Coverage accounting and checks

- The 77 frozen HTTP cases, snapshots, corpus/harness and all pre-existing product test files are unchanged. No route, hierarchy/position helper or MCP implementation changed.
- Nine integrated checks moved into `apiContracts.test.ts`, retaining the complete response loop, MCP/Bruno checks and fault probes. Stale failures now also assert the normal regeneration command.
- Seven native conversion/typing probes replace the comparison suite's relevant native checks against the actual production schemas. The retained source-change drills still cover all three experiments and restore their files.
- The final full gate passed: **509 baseline/product-characterization tests + 9 integrated + 7 native probes = 525 server tests in 26 files**, plus **604 client tests in 34 files and 235 tooling tests**, type checks, lint, formatting and docs checks (406 files, zero hits). The decrease from 780 is **255 comparison-only checks**, not lost product behavior coverage. Logs: `logs/m1-check.log` and `logs/m1-check-final.log`.
- Focused compatibility/integration/conversion run passed **93 tests in three files**. Type checking and lint passed. The source-change drills passed: optional-field diagnostics 1→0 with real 200/400 parsing, required-response drift detected, and nullability change failed the unchanged ATT-9.11 capture with expected 200/received 400. All temporary changes were restored.
- A clean root install plus normal generation/freshness succeeded. Component/operation equality against the preserved JSON passed. `contracts:check` also passed with `DB_PATH` set to an existing directory, which would prevent accidental SQLite opening. Local focused logs are `logs/m1-focused.log`, `m1-typecheck.log`, `m1-lint.log`, `m1-drills.log`.
- Unchanged Playwright passed **219 tests, with 18 skipped**, in 3.9 minutes (`logs/m1-e2e.log`). No external test/helper/configuration changed. The gate → E2E → final-gate sequence passed without a cooldown or connection failure. The final gate includes an explicit application-compiler-version assertion and the permanent production-typecheck guard. Observed TIME_WAIT counts after gate work were about 6,500, below the prior comparison run's exhausted range; this is current-base evidence, not an exhaustive transport stress guarantee.
- No pre-existing root dependency version changed when adding the workspace. No route/domain/MCP implementation or frozen product capture changed. The evidence branch still resolves to the original checkpoint, and no merge or commit has been made by this batch.

## Still pending

Epic 3.5 completion, main integration and the operative baseline; the independent route/status inventory, shared vocabulary and association/import guards from the later technical batch; normal audit/Reconciler/catalog evidence and story closeout. The old spike's green suites are not substituted for those deliverables. Cleanup checks against the current base will be repeated as required after the completed-main merge.
