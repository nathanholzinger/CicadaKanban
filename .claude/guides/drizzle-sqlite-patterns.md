# Drizzle ORM / SQLite Patterns — Audit Checklist

Reference for auditing `server/src/**` files in this project (Drizzle ORM,
better-sqlite3, `PRAGMA foreign_keys = ON`).

---

## Transaction Boundaries

- [ ] Multi-step mutations (delete-with-cascade, move-with-reposition,
  create-with-related-rows) run inside a single `db.transaction()` — not as
  separate sequential `.run()` calls that can partially fail
- [ ] If a mid-sequence failure would leave the DB in an inconsistent state
  (some rows written, some not), that sequence needs a transaction
- [ ] Reads that inform a subsequent write in the same operation (read-modify-write,
  e.g. reposition logic) are also inside the transaction to avoid races —
  low risk in this single-user app, but still worth flagging as **Watch List**
  if absent

---

## N+1 Avoidance

- [ ] A loop that issues one query per iteration (e.g. fetching each child's
  data individually instead of a single `WHERE IN (...)`) is a candidate for
  a batched query
- [ ] Nested relations fetched via repeated round-trips instead of a join or
  Drizzle's relational query API

---

## Repeated Query Patterns

- [ ] The same `where`/`join` shape (e.g. "fetch item + verify project
  ownership") appears in 2+ route handlers → candidate for a shared query
  helper
- [ ] Validation logic (e.g. "does this id exist and belong to this parent")
  duplicated across routes instead of a shared function

---

## Self-Referential FK Caveat

Two columns reference their own table, and they behave differently:

```typescript
// server/src/db/schema.ts
projects.parentId  // a real FK to projects.id, declared through an AnySQLiteColumn callback, with no ON DELETE action
items.parentId     // a soft reference to items.id: no FK, by design
```

- **`projects.parentId` is enforced but doesn't cascade.** With
  `PRAGMA foreign_keys = ON`, SQLite refuses a parent that doesn't exist, and
  refuses to delete a project that still has children. So a project's delete
  removes its descendants first, deepest first.
- **`items.parentId` isn't enforced at all.** SQLite neither refuses an
  orphaning write nor cascades, so the app owns the item tree: a delete or a
  reparent walks the descendants in app code.

- [ ] Delete/cascade logic for `projects` or `items` walks all descendant
  levels, not just one level of children
- [ ] No code assumes SQLite will reject an orphaning write on `items.parentId`

---

## Migration Hygiene

- [ ] Schema changes in `server/src/db/schema.ts` have a corresponding
  migration file generated via `db:generate` and applied via `db:migrate` —
  not just a schema edit with no migration
- [ ] Migration files aren't hand-edited after being applied to the dev DB
- [ ] Nullable columns added for a migration period have a tracked plan to
  become `NOT NULL` once backfilled (or a documented reason they stay nullable)
