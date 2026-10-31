# API contract tooling

Install the usual root, server and client dependencies. Root `npm ci` also installs this
workspace; no separate comparison-package install is required.

From the repository root:

```powershell
npm run contracts:generate
npm run contracts:check
```

Generation reads server-owned schemas without importing the app or opening a database. It
writes `server/contracts/openapi.json` and `client/src/api/generated.ts`. The document remains
explicitly partial until every non-test operation and response variant has been accounted for.
Freshness is also checked by the server contract tests in the normal gate.

The generator's TypeScript 5 peer stays in this developer workspace. Application compilation
uses TypeScript 6; virtual consumer probes explicitly load the server's compiler. Zod remains
owned by the server; this package declares no additional Zod or alternative framework dependency.

`npm run contracts:drill` temporarily edits the actual item schema, regenerates artifacts,
tests real handlers and restores the source/output in `finally`. Run it alone with a clean
working tree and inspect the diff afterward. Server tests share a SQLite fixture database;
never overlap server test invocations. Keep the full gate and Playwright sequential.

The retained native conversion probes cover defaults, unsupported transforms, refinement and
coercion representation gaps, input mutation and conditional typing limits. They complement
independent behavior expectations; generated types are not runtime enforcement.

Operation metadata owns each method/path, parameter binding and per-status response schema.
Bodyless responses omit content; query descriptors are checked against their query schema's
keys, references and requiredness. `responses.ts` validates an exercised response using its
actual method, URL and status. Callers still assert expected status and business effects.

Contract tests capture real router mounts at app bootstrap and inspect declared route layers.
Test-helper mounts are checked explicitly in both configurations; implicit HEAD/CORS OPTIONS
do not create extra declared operations. Unsupported mount/path layouts fail for review.
`server/tests/contracts/pendingOperations.json` names the remaining migration scope: remove
each entry as its operation is registered. A missing registration, stale entry or newly
discovered route fails the same completeness check; pending entries are not migrated coverage.

Neutral domain vocabulary has no external/database/schema imports. Schemas import only Zod
and neutral/schema modules; tests check this boundary recursively. A subprocess also runs
freshness with DB_PATH pointing at a directory, so accidental SQLite initialization fails.
