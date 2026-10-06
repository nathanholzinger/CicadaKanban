# TREE-9 — Deleting a project deletes its subtree

**Next ID:** TREE-9.4

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-9.1 | Deleting a project deletes its whole subtree, and is never refused | P0 | Automated |
| TREE-9.2 | An item of another project in a deleted workphase survives, with no workphase | P1 | Automated |
| TREE-9.3 | A delete leaves labels, and the workflow a project outside the subtree uses, alone | P2 | Automated |

---

## TREE-9.1 — Deleting a project deletes its whole subtree, and is never refused

**Priority:** P0 · **Status:** Automated · **Rule:** wiki project-tree §9

*Given* top-level project `P`, owning workflow `W`, with a board, columns and workphases; `P`'s child `C`, with no workflow of its own; `C`'s child `D`, owning workflow `W2`, with a board, columns and workphases; items in each of `P`, `C` and `D`, some with children of their own; and top-level project `Q`, on workflow `WQ`, with items, *when* `P` is deleted, *then* it's accepted, and none of these exists any more:

- `P`, `C` and `D`;
- `W` and `W2`, with their boards, columns and workphases;
- every item of `P`, `C` and `D`, with each one's children.

`Q`, `WQ` and `Q`'s items are unchanged.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-9.2 — An item of another project in a deleted workphase survives, with no workphase

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §9, wiki boards-columns-unsorted §10

*Given* top-level project `P`, owning workflow `W`, with workphase `w1`; `P`'s child `Q`, with no workflow of its own, holding item `q` in `w1`; and top-level project `R`, on workflow `WR`, *when* `Q` is moved under `R`, so `q` still holds `w1` ([BCU-1.6](../boards-columns-unsorted/bcu-1-boards-and-what-they-show.md)), and `P` is then deleted, *then* `q` still exists, with no `workphaseId`, and a board of `WR` lists it in `unsorted.invalidItems` ([BCU-5.2](../boards-columns-unsorted/bcu-5-unsorted.md)). `Q` and `R` are unchanged.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-9.3 — A delete leaves labels, and the workflow a project outside the subtree uses, alone

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §9

*Given* top-level project `T`, on workflow `WT`, with children `P` and `S`, where `P` owns workflow `W` and `S` has no workflow of its own; and label `L`, on an item of `P` and on an item of `S`, *when* `P` is deleted, *then* `L` still exists, and `S`'s item still carries it. A board of `WT` still lists `S`'s item: `S` still uses `WT`.

**Automation test:** `server/tests/routes/projects.test.ts`
