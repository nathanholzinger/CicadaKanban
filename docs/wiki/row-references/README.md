# Row References — Naming a Row, or None

**Test suite:** none of its own. Each feature whose writes name rows
tests these rules in its own catalog:
[`../../test-plans/item-attachment/`](../../test-plans/item-attachment/),
[`../../test-plans/item-positioning/`](../../test-plans/item-positioning/),
[`../../test-plans/project-tree/`](../../test-plans/project-tree/) and
[`../../test-plans/boards-columns-unsorted/`](../../test-plans/boards-columns-unsorted/).

**Related:** [`../item-attachment/`](../item-attachment/) §2a, §7, §14
(an item's workphase, and what leaving it out or naming `null` means; an
item's parent; a create's project) ·
[`../project-tree/`](../project-tree/) §3 (a project's parent) ·
[`../positioning/`](../positioning/) §2 (a neighbor) ·
[`../boards-columns-unsorted/`](../boards-columns-unsorted/) §5 (a
column's start and end)

This page answers "what does a write do with a field that names another
row, and how does a write say it names none." Its rules are shared:
every write that takes such a field applies them. A *reference* is a
request field that names a row by its id, such as an item's parent, its
workphase, its project or its agent, or a move's neighbor. Each
feature's page says which of its fields are references, what else makes
a named row unusable, and what leaving a reference out or naming `null`
means there.

---

## 1. A reference that names no row is refused

**A write whose reference names no row is refused with a 400, and
nothing changes,** whether the field is required or optional. An id that
no row has names no row, and so does an empty string. A feature's page
may refuse a row that exists, too, such as a workphase of another
workflow ([`../item-attachment/`](../item-attachment/) §2a), or a
neighbor with no position ([`../positioning/`](../positioning/) §2).

**No fallback reads a reference that names no row as none.** A write
that names a row means that row. Why not ignore a bad reference in an
optional field: the write would succeed without doing what it asked,
and the caller would have no sign of it. A caller that assigns an item
to an agent by a mistyped id would get a success, and believe the item
assigned. A 400 costs one retry.

Example: a create whose `parentId` is `""`, or an id no item has, is
refused, and nothing is stored. A create that names its project and
leaves the parent out makes a top-level item in that project
([`../item-attachment/`](../item-attachment/) §14).

## 2. How a write names none

**A write says it names none by leaving the reference out, or by naming
`null` where the field can be cleared.** An empty string is never none:
it names no row, so it's refused (§1). What leaving a reference out and
naming `null` each mean is the field's page's. For an item's workphase,
`null` leaves the item with no workphase, and leaving it out keeps the
item where it's shown ([`../item-attachment/`](../item-attachment/)
§2a).

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

None open.
