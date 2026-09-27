# Error Handling Patterns — Audit Checklist

Reference for auditing `server/src/routes/**` and `server/src/index.ts`
(Express 5). Not prescriptive about which status code is "correct" — focused
on whether a failure's actual cause reaches somewhere useful instead of
disappearing into a generic 500.

---

## Surfacing the Cause

- [ ] A caught error's message/stack is never discarded — at minimum it's
  logged server-side (`console.error` or equivalent), even when the
  client-facing response stays generic
- [ ] No empty `catch {}` or catch block that swallows the error without
  logging or returning anything

**Worked example — done right:** `server/src/routes/projects.ts`
logs the real error and returns a specific message:
```typescript
} catch (err) {
  console.error('Failed to delete project:', err);
  res.status(500).json({ error: 'Failed to delete project' });
}
```

**Worked example — the gap:** `server/src/index.ts` has no global
error-handling middleware. Express 5 auto-forwards rejected promises from
async route handlers to the error pipeline, but with no handler registered,
failures fall through to Express's default — no consistent logging, no
consistent client payload. `projects.ts`'s delete route is the only place
that manually covers this today; every other route relies on the framework
default.

---

## Global Error Handling

- [ ] A single Express error-handling middleware (`(err, req, res, next) =>
  {...}`, registered last in `index.ts`) exists as the backstop — not every
  route re-implementing its own try/catch
- [ ] If no global handler exists yet, flag it once as a **Fix Now** at the
  `index.ts` level rather than repeating the same finding on every route that
  lacks its own try/catch

---

## Route Error Responses

- [ ] Error responses use a consistent payload shape across routes (e.g.
  `{ error: string }`, matching the shape `projects.ts` already uses) —
  consistency of shape, not a specific status code, is the concern
- [ ] A route-level try/catch is worth keeping when it adds a message more
  specific than the global handler could produce (e.g. "Failed to delete
  project" vs. a generic "Something went wrong")

---

## Negative-Path Coverage

For each route or mutation reviewed, ask: is there an identifiable answer to
"what happens when this fails" — not "were tests written for it first," just
whether the failure mode was considered at all.

- [ ] Missing record (id doesn't exist) — does the route respond meaningfully,
  or does it 500 on a null dereference?
- [ ] Invalid input (wrong type, missing required field) — handled before it
  reaches a DB call that would fail more confusingly?
- [ ] Constraint violation (unique/FK) — does the failure surface as
  something a caller could act on, or as an opaque 500?
- [ ] If none of the above were considered for a given route, that's a
  **Watch List** finding, not automatically **Fix Now** — this app is
  single-user and low-stakes; prioritize routes that are actually reachable
  with bad input (user-facing forms), not internal/trusted call paths
