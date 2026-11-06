# TREE-4 — A project's position compares among its siblings

**Next ID:** TREE-4.15

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-4.1 | A project write compares and renumbers positions only among the siblings the project ends with | P0 | Automated |
| TREE-4.2 | `GET /api/projects` lists projects by position, then creation time, a missing position first | P1 | Automated |
| TREE-4.3 | The sidebar shows each project's children by position, then creation time | P1 | Automated |
| TREE-4.4 | The sidebar sorts a project with no position as if its position were 0 | P2 | Automated |
| TREE-4.5 | A move that reindexes discloses every renumbered sibling, the moved project included | P1 | Automated |
| TREE-4.6 | A create, and an edit that changes the parent, disclose a reindex too | P1 | Automated |
| TREE-4.7 | The sidebar applies the renumbered pairs, so it shows the server's order without a reload | P1 | Open |
| TREE-4.8 | After a failed write, the sidebar shows the project where it was before the attempt | P2 | Automated |
| TREE-4.9 | A release draws the move and its branch at once, and success keeps that placement | P1 | Open |
| TREE-4.10 | Moves released one after another settle independently by their own answers | P1 | Automated |
| TREE-4.11 | The next pickup counts earlier drag moves before their answers arrive | P1 | Open |
| TREE-4.12 | A drawn move changes order by slot without computing any position | P1 | Automated |
| TREE-4.13 | A late response preserves positions already set by a newer saved write | P1 | Automated |
| TREE-4.14 | An older tree read preserves a write already applied in the sidebar | P1 | Planned |

---

## TREE-4.1 — A project write compares and renumbers positions only among the siblings the project ends with

**Priority:** P0 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §1, wiki positioning §6

*Given* top-level projects `A` (`1.0`), `B` (`2.0`) and `C` (`3.0`), and `A`'s children `A1` (`1.0`) and `A2` (`3.0`), *when* `C` is moved under `A`, after `A1`, *then* its position is `2`, between `A1` and `A2`: the top-level projects at `2.0` and `3.0` aren't its neighbors there. *And given* `A`'s children sit at `1500` and `1600` instead, *when* `C` is moved under `A` with no neighbor named, *then* `A`'s children are reindexed first, to `1` and `2`, in the same order, and `C` lands at `3`. `A` and `B` keep `1.0` and `2.0` exactly, as does every project outside `A`'s children.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-4.2 — `GET /api/projects` lists projects by position, then creation time, a missing position first

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §1

*Given* only top-level projects: `A` and `B`, both at `2.0`, with `B` created first; `C`, at `1.5`; and `N`, with no position, made by a direct database edit, *when* the projects are listed with `GET /api/projects`, *then* they read `N, C, B, A`.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-4.3 — The sidebar shows each project's children by position, then creation time

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §1

*Given* parent `P`, whose children are `A` and `B`, both at `2.0`, with `B` created first, and `C`, at `1.5`, *when* the sidebar shows `P` expanded, *then* its children read `C, B, A`. *And given* top-level projects tie the same way, *then* the sidebar's top level reads in the same order.

**Automation test:** `tests/ui/project-tree-sidebar.spec.ts`

## TREE-4.4 — The sidebar sorts a project with no position as if its position were 0

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §1

*Given* parent `P`, whose children are `A` (`0.5`) and `B` (`2.0`), and `N`, with no position, made by a direct database edit, *when* the sidebar shows `P` expanded, *then* its children read `N, A, B`, the order `GET /api/projects` gives ([TREE-4.2](tree-4-sibling-order.md)).

**Automation test:** `tests/ui/project-tree-sidebar.spec.ts`

## TREE-4.5 — A move that reindexes discloses every renumbered sibling, the moved project included

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §7

*Given* parent `P`, whose children are `A` (`1500`) and `B` (`1600`), and top-level project `X`, *when* `X` is moved under `P` with no neighbor named, *then* `P`'s children are reindexed ([TREE-4.1](tree-4-sibling-order.md)), and the response carries the renumbered pairs: `A → 1`, `B → 2` and `X → 3`. Each pair is `{id, position}` and nothing more, and `X`'s pair matches the `position` in the response body. *And given* `P`'s children sit at `1.0` and `2.0` instead, *when* the same move is made, *then* the response carries no pairs, or an empty collection, and `X`'s position is `3`.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-4.6 — A create, and an edit that changes the parent, disclose a reindex too

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §7

*Given* parent `P`, whose children are `A` (`1500`) and `B` (`1600`), and top-level project `X`, each of these from that starting state:

- *when* a project is created under `P`, *then* the response carries `A → 1`, `B → 2`, and the new project's pair at `3`;
- *when* `X`'s parent is edited to `P`, *then* the response carries `A → 1`, `B → 2` and `X → 3`.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-4.7 — The sidebar applies the renumbered pairs, so it shows the server's order without a reload

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §4, wiki positioning §8

*Given* the sidebar showing parent `P` expanded, with children `A` (`1500`) and `B` (`1600`), and top-level project `X`, each of these from that starting state:

- *when* `X` is dragged under `P`, after `B`, and released, *then* `P`'s children read `A, B, X` at release and after the answer, and still do after a reload. `X` isn't shown first, as a sort of `1500`, `1600` and `3` would put it;
- *when* a project is created under `P`, *then* it's shown last among `P`'s children, after `B`;
- *when* `X`'s parent is edited to `P`, *then* `X` is shown last among `P`'s children, after `B`.

**Automation test:** —

## TREE-4.8 — After a failed write, the sidebar shows the project where it was before the attempt

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §4

*Given* the sidebar showing top-level projects `A`, `B` and `X`, in that order, where the server refuses the write, each of these from that starting state:

- *when* `X` is dragged under `A` and released, *then* at release the sidebar draws `X` under `A`, before the refusal arrives. As soon as the move fails, it shows `A`, `B` and `X` as before, with `X` top-level and last, without waiting for the subsequent read of the tree. Holding that read unanswered, or making it fail too, leaves `X` restored rather than retaining the refused placement;
- *when* a project is created, *then* no new project is shown;
- *when* `X`'s parent is edited to `A`, *then* `X` is still shown top-level and last.

How the user learns that the write failed isn't asserted. That a collapsed project opened by the drop stays open is [TREE-2.3](tree-2-what-the-drag-shows.md)'s.

**Automation test:** `tests/ui/project-tree-sidebar.spec.ts`, `client/src/App.pendingMove.test.tsx`

## TREE-4.9 — A release draws the move and its branch at once, and success keeps that placement

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §4, wiki project-tree §6, wiki hierarchy-placement §8, wiki positioning §5

*Given* top-level projects `A, B, X`, expanded `A` with children `A1, A2`, and expanded `X` with child `X1`, *when* `X` is released in the gap between `A1` and `A2`, at their depth, *then* before the answer arrives the sidebar reads `A, A1, X, X1, A2, B`, with `X` drawn under `A` and `X1` still under `X`. The placement is after `A1` and before `A2`, the same relation the move sends; no `X` row remains top-level. The branch returns at release, not after the answer. *When* the move succeeds, *then* that same tree stays drawn without a frame restoring the pickup placement, and a reload shows the same hierarchy and order.

**Automation test:** —

## TREE-4.10 — Moves released one after another settle independently by their own answers

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4

*Given* expanded top-level `P` with child `A`, expanded top-level `Q` with child `B`, and top-level leaves `X` and `Y`, *when* `X` is released under `P`, after `A`, then `Y` is released under `Q`, after `B`, before either answer arrives, *then* `P`'s children read `A, X` and `Q`'s read `B, Y` immediately. *When* either move succeeds first, *then* the other move stays drawn at its released place while its own answer is outstanding. Once both succeed, the same two child lists remain, regardless of answer order.

*Given* the same two releases, *when* `X`'s move fails while `Y`'s is unanswered, *then* `X` returns top-level at its place before the attempt, while `Y` stays after `B` under `Q`. *When* `Y` then succeeds, *then* it stays there. If `Y` succeeds before `X` fails, its saved placement likewise survives `X`'s rollback and the following read. An answer settles its own move, without dropping another move still awaiting its answer or undoing one that succeeded.

**Automation test:** `client/src/App.pendingMove.test.tsx`

## TREE-4.11 — The next pickup counts earlier drag moves before their answers arrive

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §1, wiki project-tree §4, wiki project-tree §2, wiki hierarchy-placement §6, wiki hierarchy-placement §7, wiki hierarchy-placement §8

*Given* project cap `PCAP >= 4`, top-level leaf `P`, top-level `X` with child `X1`, and unrelated chain ending at `S` at absolute depth `PCAP - 3` with child `T` at `PCAP - 2`, *when* `X` is released as `P`'s child and `P` is picked up before that move's answer, *then* the pickup tree already has `X` and `X1` beneath `P`. Both are hidden in `P`'s carried branch and excluded from placement; its line reads "+ 1 child, 2 total descendants". `P`'s subtree height is 2, not its saved leaf height 0. `S` is Full, since putting `P` under it reaches exactly `PCAP`; `T` is Mid, since it would put the deepest descendant at `PCAP + 1` but its parent `S` is legal. Waiting for the first move's answer is unnecessary for the new drag to count that move's hierarchy, branch and tiers.

**Automation test:** —

## TREE-4.12 — A drawn move changes order by slot without computing any position

**Priority:** P1 · **Status:** Automated · **Rule:** wiki positioning §5, wiki project-tree §4, wiki project-tree §6

*Given* expanded parent `P` with children `A` at position `10` and `B` at `20`, and top-level `X` at `30` with child `X1` at `7`, *when* `X` is released under `P`, after `A`, while the answer is outstanding, *then* the sidebar draws `A, X, B` as `P`'s children, with `X1` still under `X`, by the chosen slot. The client's position values stay `A = 10`, `B = 20`, `X = 30` and `X1 = 7`; no tree used for display substitutes ranks or any other client-computed positions. The move sends the parent and named-neighbor relation, with no position. *When* the server answers with `X.position = 15` and no reindex, *then* `X` takes `15`, the other three values stay unchanged, and the drawn tree and order do not move.

**Automation test:** `client/src/App.pendingMove.test.tsx`, `client/src/lib/hierarchy.test.ts`, `client/src/components/sidebar/projectTreeUtils.test.ts`

## TREE-4.13 — A late response preserves positions already set by a newer saved write

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §4, wiki positioning §7, wiki positioning §8

*Given* expanded project `P` with children `X` at `1500` and `Y` at `1600`, expanded `Q` with child `B` at `4`, and top-level `R`, *when* the server first saves `R` as `P`'s last child, *then* that answer discloses `X = 1`, `Y = 2`, `R = 3`. *When* the server then saves `X` as `Q`'s last child, *then* `X.parentId = Q` and `X.position = 5`.

*When* the answer for `X` arrives before the earlier answer for `R`, *then* the sidebar shows `Q`'s children as `B, X`. *When* `R`'s late answer lands, *then* `X` keeps parent `Q` and position `5`, rather than taking the older disclosed `1`; `Q`'s children stay `B, X`, with no intervening render that puts `X` before `B`. The other applicable values from the earlier answer still take effect: `P`'s children read `Y, R`, at `2` and `3`. The final tree and positions agree with the server without a reload. Answering the two writes in their saved order ends with that same tree.

*Given* instead an earlier answer writes a project's own position as `5`, and a later saved write of a different project reindexes that row to `2`, *when* the later answer is applied first and the earlier answer then arrives, *then* the row keeps `2`. Neither an older reindex pair nor an older written-row position replaces a position already set by the newer saved write. This case fixes the saved outcomes, not how requests are queued or how responses are tracked.

**Automation test:** `client/src/components/sidebar/useProjectCollection.test.ts`

## TREE-4.14 — An older tree read preserves a write already applied in the sidebar

**Priority:** P1 · **Status:** Planned · **Rule:** wiki project-tree §4

*Given* top-level projects `P` named `Old` and `Q`, where a first read of the tree holds that snapshot and a later read has already returned it and made the sidebar usable, *when* an edit saves `P.name = Renamed` and its successful answer is applied, then the first read's older answer lands, *then* `P` remains named `Renamed`, with `Q` unchanged. No intervening sidebar render restores `Old`; a fresh read, if needed, agrees with the successful edit.

*Given* instead expanded `P` with children `A, B` and top-level `X`, and both reads holding that starting tree, *when* a move saves `X` under `P`, directly after `A`, and its answer is applied before the first read lands, *then* `P`'s children stay `A, X, B`, `X.parentId` stays `P`, and no top-level copy of `X` returns. The displayed order and parent continue to agree with the saved move. An older read cannot undo an applied write whether it is an initial read or a later refresh.

**Automation test:** —
