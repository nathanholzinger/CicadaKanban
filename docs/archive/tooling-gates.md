# Tooling Gates — Type-check, Lint and Format All Three Packages

**Type:** tech-debt story · **Written:** 2026-09-26 by the Architect · **Sequenced:** first among the tech-debt stories, before A1

## Goal

Only the client has all three code gates today. `server/` has type checking but no lint and no enforced formatting, and the Playwright specs in `tests/` have none of the three:

| | Type-check | ESLint | Prettier |
|---|---|---|---|
| `client/` | ✅ `npm run typecheck` | ✅ `npm run lint` | config only; no script, and 6 files have drifted |
| `server/src` | ✅ | ❌ no config | config only; Prettier isn't installed in `server/` |
| `server/tests` | ❌ excluded: `include` is `src/**/*` | ❌ | as above |
| `tests/` (E2E) | ❌ the root `tsconfig.json` includes `e2e/**/*`, which doesn't exist, so it checks only `playwright.config.ts` | ❌ | ❌ no config reaches it |

After this story, one command, `npm run check`, runs every gate over every package. The Coder runs it every phase, and an audit can take it as a given.

**Where the story came from:** `epic-4-decisions.md` §8 had noted that `server/` has no ESLint, left unscheduled. That section moved out when the API contract epic was split off. I found the `tests/` type-check gap while scoping A1's checker.

**Out of scope:**
- git hooks and CI (the project runs locally);
- type-aware lint rules and `eslint-plugin-playwright`. Both are candidates, but the goal here is to match what the client already has, not to raise the bar;
- A1's docs checker, which joins the same scripts once A1 and A4 land.

## Baseline

Measured 2026-09-26 with throwaway configs in a scratch directory; no repo files were changed.
- **Type errors:**
  - `server/tests` with `rootDir` widened to `server/`: 0;
  - `tests/` with `lib` set to `ES2022`, `DOM` and `DOM.Iterable`: 0. The specs' `page.evaluate` bodies, and the client modules that `tests/helpers/` imports, need the DOM libraries.
- **ESLint** (`@eslint/js` recommended plus `typescript-eslint` recommended, the client's own sets, over 84 files): 12 findings.
  - 9 are `no-unused-vars` and 3 are `no-explicit-any`.
  - 3 are in `server/src`, 4 in `server/tests` and 5 in `tests/`.
- **Prettier** (`singleQuote`, `arrowParens: avoid`, `printWidth: 120`, `endOfLine` ignored):
  - 51 of 84 files in `server/` and `tests/` would change;
  - 6 client files would change under the client's own config.
  - The drift is real formatting, not line endings: every flagged file is already LF.

## Decisions

**D1. Every package keeps its own tools, and the root script delegates.**
- This matches how `typecheck` and `test` already work: the root `package.json` runs each package with `npm --prefix`.
- `server/` gets its own `eslint.config.js`, its dev dependencies, and a `lint` script.
- The root package owns `tests/` and `playwright.config.ts`. So it gets a root `eslint.config.js` that ignores `client/` and `server/`, plus its own dev dependencies.

**D2. ESLint uses the rule sets the client uses, minus the React plugins.**
- The sets are `@eslint/js` recommended and `typescript-eslint` recommended.
- Globals: Node for `server/`; Node plus browser for `tests/`, because of the `page.evaluate` bodies.
- The 12 baseline findings get fixed, not suppressed. A suppression needs a comment giving the reason, as in the client.

**D3. Type-checking covers the tests.**
- **`server/`:**
  - the main `tsconfig.json` keeps `rootDir: ./src` for any future build;
  - a `tsconfig.test.json` extends it, widens `rootDir` to `.`, sets `noEmit`, and includes both `src` and `tests`;
  - `npm run typecheck` runs the wider config, which is a superset of the main one.
- **Root:**
  - `tsconfig.json` includes `tests/**/*` and `playwright.config.ts`, excludes `tests/output/`, and sets `lib` to `ES2022`, `DOM` and `DOM.Iterable`;
  - a new root `typecheck:e2e` script joins `typecheck`.

**D4. One shared Prettier config at the root; the client keeps its own.**
- **A root `.prettierrc`** holds the three shared settings.
- **`server/.prettierrc` is deleted,** since it's identical. Prettier uses the nearest config file, so the server and `tests/` both resolve to the root one.
- **`client/.prettierrc` stays,** because it adds `prettier-plugin-tailwindcss`, and that plugin is installed only in `client/`.
- **`prettier` becomes a root dev dependency.**
- **A root `.prettierignore`** covers `node_modules`, `dist`, `coverage`, `tests/output` and `server/drizzle`.
- **Scripts:**
  - client: `format:check`;
  - root: `format:check`, which checks `server/`, `tests/` and the root files, then delegates the client's own.

**D5. The formatting sweep is its own commit, which `git blame` skips.**
- **Scope:** the 57 reformatted files land in one commit that changes nothing but formatting.
- **Blame:** a second commit adds that commit's hash to `.git-blame-ignore-revs`, and documents the one-time setup: `git config blame.ignoreRevsFile .git-blame-ignore-revs`.
- **Timing:** the sweep runs when no other work is in progress in `server/`, `tests/` or those 6 client files. It must land before A4's comment sweep. Otherwise the two would collide, and A4's diffs would mix formatting with content.

**D6. `npm run check` is the gate, as one command.**
- **What it runs:** `typecheck`, `lint`, `format:check` and `test:unit`, in that order.
- **What stays separate:** E2E stays `npm run test:e2e`. It's slow and needs the test servers.
- **Sequencing: this story runs first, before A1.**
  - A1's batch 1 (the guides) may run alongside it, since the two touch different files.
  - A1's batch 2 waits for it, so the checker's scripts join the root type-check and lint from the start.
  - A3's test-title stamping and A4's comment sweep come later still, so they never collide with the formatting sweep.

## Work, in batches

Each batch ends with its own check and a stop for Nathan's review and commit.

1. **Type checking (Coder).**
   - **Work:** D3, plus fixing whatever errors a real run turns up. The probe found none.
   - **Check:** `npm run typecheck` passes and covers all three packages. Confirm with `--listFilesOnly`.
2. **ESLint (Coder).**
   - **Work:** D1 and D2, and fix the 12 findings. The root `lint` runs the client, the server and `tests/`.
   - **Check:** `npm run lint` exits 0, then `npm run test:unit` passes.
3. **Prettier (Coder).**
   - **Work:** D4, then D5's sweep commit, then its blame-ignore commit.
   - **Check:** `npm run format:check` exits 0. The sweep commit's diff changes only formatting; `git diff -w --stat` after `--write` is the sanity check.
4. **One command, and the docs (Coder, then Architect).**
   - **Work:**
     - D6's `check` script;
     - root `CLAUDE.md`'s "Running the App" names `npm run check`;
     - one full Playwright run confirms nothing changed behavior. The baseline is 140 passed, 8 skipped.
   - **Check:** `npm run check` exits 0, and E2E matches the baseline.

## Code map

| File | Batch | Change |
|---|---|---|
| Root `tsconfig.json`, `server/tsconfig.test.json` (new), `package.json` scripts (root and server) | 1 | Type-checking reaches the tests |
| `server/eslint.config.js` (new), root `eslint.config.js` (new), dev dependencies (root and server), the files behind the 12 findings | 2 | ESLint for the server and `tests/` |
| Root `.prettierrc` (new), `.prettierignore` (new), `server/.prettierrc` (deleted), `format:check` scripts (root and client) | 3 | One Prettier setup |
| The 57 reformatted files, `.git-blame-ignore-revs` (new) | 3 | The sweep, in its own commits |
| Root `package.json` `check` script, root `CLAUDE.md` | 4 | One gate command |

## Acceptance

- `npm run typecheck` covers `client/`, `server/src`, `server/tests`, `tests/` and `playwright.config.ts`, and passes.
- `npm run lint` covers the client, the server and `tests/`, and exits 0. Any suppression carries a reason.
- `npm run format:check` covers all three packages and passes.
- `npm run check` runs all of the above plus `test:unit`, and exits 0.
- The formatting sweep is its own commit, listed in `.git-blame-ignore-revs`.
- E2E is unchanged: 140 passed, 8 skipped.
- No four-pass audit: this story changes tooling and formatting, not the code's structure.

## Handoff

**Closed by this story:** `epic-4-decisions.md`'s old §8, which the API contract epic's plan listed as "needs a home".

**For A1:**
- **The checker (A1 D8):** "joins `npm run lint`" means the root `lint` this story builds, and `check` picks it up from there.
- **Batch 4 (the personas and guides):**
  - `coder.md`'s "run tests after each significant change" and `testing-strategy.md` point at `npm run check`;
  - `prettier-preemptive-practice.md` names the new `format:check` scripts and the root config.

**Architect:** the memory pass rewrites the two toolchain-gotcha entries this story makes stale: "`tests/` has no Prettier config" and "the root tsc doesn't cover `tests/`".

## Amendments

**2026-09-26, Nathan's answers to the Coder's questions:**
- **D4: `format:check` excludes Markdown.**
  - Both `format:check` scripts list their globs explicitly (`ts`, `tsx`, `js`, `mjs`, `json`) rather than checking `.`. That keeps `docs/`, `.claude/` and every `CLAUDE.md` out of the sweep.
  - `.prettierignore` also lists `package-lock.json`.
  - The sweep's file count is re-measured with these globs.
- **D4: both Prettier configs set `endOfLine: "auto"`.**
  - Git already converts line endings to LF on commit (`.gitattributes` has `* text=auto`), and the baseline was measured with line endings ignored.
  - The root `.prettierrc` therefore holds four settings. `client/.prettierrc` adds the same line, so the two configs still differ only by the Tailwind plugin.
- **D3: the server's type-check covers its config files.** `tsconfig.test.json` also includes `vitest.config.ts` and `drizzle.config.ts`.

**2026-09-26, the Coder's implementation notes:**
- **Batch 1 adds `typescript` as a root dev dependency.** The root type-check script needs it, and A1 D8 will find it already installed.
- **The root ESLint config is `eslint.config.mjs`,** because the root package is `"type": "commonjs"` and an ESM `eslint.config.js` wouldn't load there. The server's config stays `eslint.config.js`, since the server package is `"type": "module"`.
- **Batch 3's sanity check is `prettier --debug-check`** on the reformatted files. It confirms each file's syntax tree is unchanged after formatting. `git diff -w` couldn't show that, because quote, parenthesis and trailing-comma changes aren't whitespace.

**2026-09-26, what batches 2–4 shipped that differs from the plan:**
- **Dependency versions.**
  - ESLint and its rule sets installed at newer minors than the client's: `eslint` 10.11 against 10.2, and `typescript-eslint` 8.70 against 8.58. The majors match, so the recommended rule sets are the same.
  - `prettier` is pinned exactly to `3.9.4`, at the root and in the client, because Prettier's output can change between minor versions. With both pinned, an `npm update` in one package can't make the two halves format differently.
  - The client's ESLint minors get aligned at its next dependency bump, not in this story.
- **The one ESLint suppression** is Express's four-argument error middleware in `server/src/index.ts`. Express recognizes error middleware by the number of parameters, so the unused `_next` has to stay. The other 11 findings were fixed.
- **`client/.prettierignore` is new.** Prettier reads ignore files only from the directory it runs in, so the client's `format:check` needs its own copy to skip `dist`, `coverage` and `package-lock.json`.
- **Script names:** each gate has one script per package: `typecheck:*`, `lint:*` and `format:check:*`, each with `client`, `server` and `root` variants. D3's `typecheck:e2e` became `typecheck:root`, because the root package covers more than the specs: its own config files now, and A1's `scripts/` next.
- **The sweep:** Prettier reformatted 61 files, and 59 reached the commit. Two differed only in line endings, which Git normalizes to LF. `git blame` with the ignore file still attributes 2 of `runMigrations.ts`'s 92 swept lines to the sweep. Those are lines the reformat created, such as a `.run();` split onto its own line, which have no earlier version.
- **Batch 4's checks:** `npm run check` exits 0 in about 45 seconds. A full Playwright run against the test servers gave 140 passed and 8 skipped in 1.9 minutes, matching the baseline.
