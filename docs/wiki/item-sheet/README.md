# Item Sheet

**Test suite:** [`../../test-plans/item-sheet/`](../../test-plans/item-sheet/)

**Related:** [`../item-attachment/`](../item-attachment/) and
[`../item-positioning/`](../item-positioning/) (the rules a write from the
Sheet follows, like a write from anywhere else)

This page answers "what does an item's Sheet do." The Sheet is an item's
full detail view ([`../item-attachment/`](../item-attachment/) §12). It
isn't designed yet. What it does today is a working placeholder,
described under Open questions, so this page states no rules of its own,
and no test case is derived from it. A write made from the Sheet follows
the same rules as a write from anywhere else.

---

## Open questions

Not settled. Don't derive test cases from anything in this section. Everything outside it is settled.

- **The Sheet's layout and behavior as a whole.** Everything below is
  today's working placeholder, kept minimally functioning until the Sheet
  is designed.
- **The parent picker.** It lists items from the item's own project,
  leaving out the item itself and its descendants. It applies no depth
  cap, so it can offer a parent the API refuses
  ([`../item-attachment/`](../item-attachment/) §8), and picking one shows
  the API's error. Whether it should offer legal parents from other
  projects, which the API accepts
  ([`../item-attachment/`](../item-attachment/) §9), is undecided.
- **The Attached checkbox.** It's shown only when the item has a parent,
  and attaches or detaches the item.
- **The children list.** It lists the item's children, each with an
  Attached/Detached toggle.
- **Adding a child.** It creates an Attached child, which takes the item's
  workphase ([`../item-attachment/`](../item-attachment/) §2a, §14).
