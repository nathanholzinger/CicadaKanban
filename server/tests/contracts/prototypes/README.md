# Contract comparison tools

Three isolated candidates share transport cases and endpoint metadata. Production routes and the
saved compatibility snapshots are unchanged. The Express adapter adds structural preflight checks;
the existing handlers still perform domain validation and writes. Passing preflight comparisons
does not establish that a handler migration is complete.

From the repository root, after installing the normal root/server/client dependencies:

```powershell
npm.cmd ci --prefix server/tests/contracts/prototypes --ignore-scripts
npm.cmd --prefix server/tests/contracts/prototypes run generate
npm.cmd --prefix server/tests/contracts/prototypes run check:generated
npm.cmd --prefix server run test -- tests/contracts/prototypes tests/contracts/apiCompatibility.test.ts
npm.cmd run check
```

The isolated package pins its dependencies and lockfile. A root or server install does not install
this nested package automatically; it is required while these comparison tests are present.
No candidate dependency is added to the production manifests. On a Windows sandbox that blocks
the existing `tsx` launcher's user-information lookup, the generation CLI needs an authorized
outside-sandbox run; the Vitest checks run normally in the sandbox.

The generator's TypeScript 5 peer stays in this package. Virtual consumer probes explicitly load
the server's TypeScript compiler so their diagnostics reflect the application's compiler version.

`generated/` contains partial two-endpoint OpenAPI documents, client declarations, and reproducible
field-change measurements. The server gate checks their freshness. Generation never imports the
application or opens its database. Tests use the existing Vitest setup and its separate test DB.

The field-change exercises build local schema variants in memory and compile virtual consumers.
They do not patch production fields or leave a modified contract on disk. Run comparisons without
updating the saved HTTP snapshots.
