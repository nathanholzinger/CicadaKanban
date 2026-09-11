# ATT-2 — Reparenting is one-way

**Wiki:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/README.md) §3

**Suite ID:** `ATT-2`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `ATT-2.n`.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | A hierarchy change is a write to the moving item; the target's row is untouched | P0 | ⏳ pending triage |
| TC-2 | Legality is evaluated from the moving item's point of view | P0 | ⏳ pending triage |

---

## TC-1 — A hierarchy change is a write to the moving item; the target's row is untouched

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Cards `A` and `B`, *when* `A` is dropped onto `B` (any entry
point — drag, Sheet, badge), *then* the change is expressed as "`A`
acquires parent `B`": `A`'s `parentId`, attachment flag, workphase and
position change; `B`'s own row is not the subject of the change and every
field on `B` — including its `parentId`, attachment flag, workphase,
position, and any modification timestamp — is exactly as it was. An item
may choose a new parent; an item may never choose a new child.

**Automation test:** —

## TC-2 — Legality is evaluated from the moving item's point of view

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* moving item `A` (with its subtree, depth, and project) and target
`B`, *when* the move's legality is decided ([ATT-4](att-4-legal-parent-depth-cap.md)),
*then* every rule is evaluated against `A`'s facts — is `B` in *`A`'s*
subtree (cycle), does *`A`'s* subtree height plus `B`'s depth exceed the
cap, what is *`A`'s* project that will cascade — never against `B`'s
subtree or `B`'s relationship to `A` as if `B` were the one moving.
Concretely: `B` being a descendant of `A` makes the move illegal; `A`
being a descendant of `B` does not (that's an ordinary move up the tree).

**Automation test:** —
