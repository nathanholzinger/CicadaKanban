# TREE-8 — A project always has a name

**Next ID:** TREE-8.5

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-8.1 | A create with no name, or an empty one, is refused, and nothing is stored | P1 | Open |
| TREE-8.2 | An edit that leaves the name out keeps it | P2 | Open |
| TREE-8.3 | An edit naming an empty name, or `null`, is refused | P2 | Planned |
| TREE-8.4 | A name of only spaces counts as no name, for a create and an edit | P2 | Planned |

---

## TREE-8.1 — A create with no name, or an empty one, is refused, and nothing is stored

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §8

*Given* any projects, *when* a project is created naming no name, or with an empty name, *then* each is refused with a 400, and no project is stored: `GET /api/projects` lists the same projects as before.

**Automation test:** —

## TREE-8.2 — An edit that leaves the name out keeps it

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §8

*Given* project `X`, named `Alpha`, *when* an edit changes `X`'s description, naming no name, *then* `X` is still named `Alpha`.

**Automation test:** —

## TREE-8.3 — An edit naming an empty name, or `null`, is refused

**Priority:** P2 · **Status:** Planned · **Rule:** wiki project-tree §8

*Given* project `X`, named `Alpha`, *when* an edit names an empty name, or `null`, *then* each is refused with a 400, and `X` is still named `Alpha`.

**Automation test:** —

## TREE-8.4 — A name of only spaces counts as no name, for a create and an edit

**Priority:** P2 · **Status:** Planned · **Rule:** wiki project-tree §8

*Given* project `X`, named `Alpha`, *when* a project is created named `"   "`, *then* it's refused with a 400, and no project is stored. *When* `X` is renamed `"   "`, *then* it's refused with a 400, and `X` is still named `Alpha`.

**Automation test:** —
