# Contract comparison tools

Three isolated candidates share transport cases and endpoint metadata. Their preflight adapter
checks compatibility separately from the integrated four-endpoint implementation, whose authoritative
shapes live in `server/src/schemas/`. The saved HTTP snapshots remain independent of both.

From the repository root, after installing the normal root/server/client dependencies:

```powershell
npm.cmd ci --prefix server/tests/contracts/prototypes --ignore-scripts
npm.cmd --prefix server/tests/contracts/prototypes run generate
npm.cmd --prefix server/tests/contracts/prototypes run check:generated
npm.cmd --prefix server/tests/contracts/prototypes run generate:pilot
npm.cmd --prefix server/tests/contracts/prototypes run check:pilot
npm.cmd --prefix server run test -- tests/contracts/prototypes tests/contracts/apiCompatibility.test.ts
npm.cmd run check
```

The isolated package pins its dependencies and lockfile. A root or server install does not install
this nested package automatically; it is required while these comparison tests are present.
Only Zod is a direct production dependency; the alternative libraries, Ajv, and the type generator
are isolated development dependencies. On a Windows sandbox that blocks
the existing `tsx` launcher's user-information lookup, the generation CLI needs an authorized
outside-sandbox run; the Vitest checks run normally in the sandbox.

The generator's TypeScript 5 peer stays in this package. Virtual consumer probes explicitly load
the server's TypeScript compiler so their diagnostics reflect the application's compiler version.

`generated/` contains partial two-endpoint OpenAPI documents, client declarations, and reproducible
field-change measurements. The server gate checks their freshness. Generation never imports the
application or opens its database. Tests use the existing Vitest setup and its separate test DB.

The comparison field-change tests build variants in memory. The separate `drill:pilot` command
temporarily edits the actual server schema and regenerates both pilot artifacts, then restores
all touched files in `finally`. It launches real HTTP checks in fresh test processes. Run it alone,
with a clean working tree, without updating the saved HTTP snapshots. Do not overlap server test
invocations: they share a SQLite fixture database. Run the full gate and Playwright sequentially
so their HTTP traffic does not exhaust Windows' temporary TCP port range.
