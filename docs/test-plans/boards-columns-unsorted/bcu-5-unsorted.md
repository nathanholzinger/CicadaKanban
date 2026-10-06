# BCU-5 — Unsorted

**Next ID:** BCU-5.6

| ID | Case | Priority | Status |
|---|---|---|---|
| BCU-5.1 | `uncovered` lists each of the workflow's workphases that no column on the board covers | P1 | Open |
| BCU-5.2 | `invalidItems` lists each item the board shows whose workphase is missing or isn't the workflow's | P1 | Open |
| BCU-5.3 | `needsAttention` is true when `uncovered` or `invalidItems` holds anything | P1 | Open |
| BCU-5.4 | `invalidItems` lists an Attached item whose own workphase is missing or isn't the workflow's | P2 | Open |
| BCU-5.5 | An Attached item is in Unsorted only inside its Free ancestor's Card | P2 | Open |

---

## BCU-5.1 — `uncovered` lists each of the workflow's workphases that no column on the board covers

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §10

*Given* workflow `WF` with workphases `W1`, `W2` and `W3`, and a board of `WF` with one column, covering `W1` alone, *when* the board is read with `GET /api/boards/:id`, *then* its `unsorted.uncovered` lists `W2` and `W3`, and not `W1`. *When* the column is edited to cover `W2` alone, *then* `uncovered` lists `W1` and `W3`.

**Automation test:** —

## BCU-5.2 — `invalidItems` lists each item the board shows whose workphase is missing or isn't the workflow's

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §10, wiki boards-columns-unsorted §3

*Given* project `P` on workflow `WF`, holding Free items:
- `X`, with no workphase;
- `Y`, holding `V1`, a workphase of another workflow, `WF2`, after a project move ([TC-7.20](../item-positioning/part-7-board-placement-intents.md)) or a direct database edit;
- `Z`, in a workphase of `WF`;

and project `Q` on `WF2`, holding Free item `Q1` with no workphase, *when* a board of `WF` is read, *then* its `unsorted.invalidItems` lists `X` and `Y`, and not `Z` or `Q1`. `Q1` isn't on `WF`'s board at all ([BCU-1.5](bcu-1-boards-and-what-they-show.md)).

**Automation test:** —

## BCU-5.3 — `needsAttention` is true when `uncovered` or `invalidItems` holds anything

**Priority:** P1 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §10

*Given* a board whose columns cover every workphase of its workflow, and no item the board shows with a missing workphase or one that isn't the workflow's, *when* it's read, *then* `unsorted.needsAttention` is `false`. *When* a column is deleted, so a workphase is in `uncovered`, *then* it's `true`. *Starting again, when* instead an item is created with no workphase in a project that uses the workflow, *then* it's `true`, with `uncovered` empty.

**Automation test:** —

## BCU-5.4 — `invalidItems` lists an Attached item whose own workphase is missing or isn't the workflow's

**Priority:** P2 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §10, wiki item-attachment §2a

*Given* [ATT-9](../item-attachment/att-9-workphase-a-write-leaves.md)'s setup, with a board of `WF` whose columns cover every workphase, and `X`, attached to `A` in `D`'s Card, given workphase `V1` of another workflow by a direct database edit, *when* the board is read, *then* `unsorted.invalidItems` lists `X`, and `needsAttention` is `true`. *And given* `X`'s workphase is instead set to none, *then* the same holds. That the board shows `X` in `D`'s Card, not in Unsorted, is [ATT-9.3](../item-attachment/att-9-workphase-a-write-leaves.md)'s.

**Automation test:** —

## BCU-5.5 — An Attached item is in Unsorted only inside its Free ancestor's Card

**Priority:** P2 · **Status:** Open · **Rule:** wiki boards-columns-unsorted §10

*Given* project `P` on workflow `WF`, with top-level Free item `D`, which has no workphase, and item `A`, attached to `D`, *when* `P`'s board renders, *then* the Unsorted bucket shows `D`'s Card, with `A` as a Stub inside it, and doesn't show `A` by itself.

**Automation test:** —
