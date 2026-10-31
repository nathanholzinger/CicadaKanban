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
