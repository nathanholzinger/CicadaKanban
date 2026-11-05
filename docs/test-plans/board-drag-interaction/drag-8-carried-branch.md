# DRAG-8 — The carried branch

**Next ID:** DRAG-8.13

**Setup.** Unless a case says otherwise, item `X` has attached children `A` and `B`; `A` has attached child `A1`, `A1` has attached child `A1a`, and `B` has attached child `B1`. Every resulting placement named fits within `CAP`. `X` is either a Stub in Card `P`'s expanded section or a Free Card with its own expanded section. The branch has two children and five total descendants.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-8.1 | Every pickup removes the attached branch from every list for the whole drag | P1 | Open |
| DRAG-8.2 | A Free descendant and everything under it stay drawn and out of the count | P1 | Open |
| DRAG-8.3 | The branch includes pending writes at pickup and stays fixed until the drag ends | P1 | Open |
| DRAG-8.4 | A Stub's branch collapses its rows, and a Card's zoom adds only the ghost row | P1 | Open |
| DRAG-8.5 | A drop draws the branch at the previewed placement before the response | P1 | Open |
| DRAG-8.6 | A cancel draws the branch at its pickup placement without writing | P1 | Open |
| DRAG-8.7 | A forced stop draws the branch where the reloaded board has it | P1 | Open |
| DRAG-8.8 | The count line uses attached children and all attached descendants, including hidden levels | P1 | Open |
| DRAG-8.9 | The line stays on the carried copy through every form switch, and never appears on the ghost | P1 | Open |
| DRAG-8.10 | The line hangs outside the measured box and covers what is below it | P1 | Open |
| DRAG-8.11 | A release in the pickup gap and depth restores the branch without writing | P1 | Open |
| DRAG-8.12 | An over-cap release restores the branch without writing | P1 | Open |

---

## DRAG-8.1 — Every pickup removes the attached branch from every list for the whole drag

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §7.3, wiki board-drag-interaction §1.1, wiki hierarchy-placement §8

*Given* the setup, *when* Stub `X` is picked up in `P`'s section or its open hierarchy modal, *then* `A`, `A1`, `A1a`, `B` and `B1` are absent from every list that would draw them: the section, the modal and the static section rows under its backdrop. They are not merely dimmed. They stay absent while the drag changes gaps, pops out to the column and zooms into another Card's section or modal. Unrelated rows remain drawn.

*Given* instead Free Card `X` is picked up, *then* the same five descendants leave its section. *When* `X` zooms into another Card, *then* its branch is absent from that section and its modal too. No layer switch draws the branch again before the drag ends. The Card's own list returns collapsed or expanded as the user set it when the drag ends; the pickup does not change that preference.

**Automation test:** —

## DRAG-8.2 — A Free descendant and everything under it stay drawn and out of the count

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §5a, wiki board-drag-interaction §4.1, wiki hierarchy-placement §8

*Given* the setup, with Free child `F` of `X` and attached child `F1` of `F`, and Free child `D` of attached descendant `A` with attached child `D1` of `D`, *when* `X` is picked up as a Card or Stub, *then* `F` and `D` stay drawn as Cards in their columns at Mid, and `F1` and `D1` stay in those Cards' sections at Low. None joins the hidden branch or its count. The carried copy reads "+ 2 children, 5 total descendants", not a count including any of `F`, `F1`, `D` or `D1`. This holds through popping, zooming and opening the modal.

**Automation test:** —

## DRAG-8.3 — The branch includes pending writes at pickup and stays fixed until the drag ends

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §4, wiki board-drag-interaction §10, wiki item-attachment §11, wiki hierarchy-placement §8

*Given* a pending write previews leaf `C` attached under `X`, while another pending write previews `B` detached but keeps `B.parentId = X`, *when* `X` is picked up before either response arrives, *then* the branch is `A`, `A1`, `A1a` and `C`. Those four rows are absent, and the line reads "+ 2 children, 4 total descendants". Free Card `B` and its attached Stub `B1` stay drawn outside the branch. The saved attachment flags awaiting their responses do not determine the branch.

*When* those responses land during the drag without reloading the board, *then* the same four rows stay excluded and the line keeps those counts, through every layer switch. The branch's membership and counts remain the pickup snapshot until the drag ends, rather than being recomputed when a write lands. A reload instead stops the drag, as in [DRAG-8.7](drag-8-carried-branch.md).

**Automation test:** —

## DRAG-8.4 — A Stub's branch collapses its rows, and a Card's zoom adds only the ghost row

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §7.1, wiki board-drag-interaction §5a, wiki hierarchy-placement §8

*Given* Stub `X` has its five branch rows drawn between it and next sibling `Z`, *when* `X` is picked up, *then* those five rows leave and `Z` moves up by the height they occupied, including their row spacing. Any overflow row owned by `X` or its branch leaves too ([DRAG-7.27](drag-7-overflow-and-hierarchy-modal.md)). With the ghost in `X`'s own slot, `Z` is directly below it; no blank branch-sized space remains. The gap and depth choices still exclude the entire dragged subtree, and a named neighbor is the row directly beside the ghost ([DRAG-4.8](drag-4-attach-and-stub-placement.md)).

*Given* instead Free Card `X` is picked up, *then* its copies are shortCards and leave its Stubs out, with no additional branch-sized reservation. *When* `X` zooms into unrelated Card `Q`'s section, *then* it adds exactly one Stub-sized ghost row there, with none of its five descendant rows below it. This case asserts layout and placement, not how the collapse moves.

**Automation test:** —

## DRAG-8.5 — A drop draws the branch at the previewed placement before the response

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §10, wiki hierarchy-placement §8

*Given* `X` is being carried with its branch absent, and unrelated Card `Q`'s expanded section and modal can show the branch's levels, *when* `X` is released as `Q`'s last attached child, *then* at release, before the response arrives, `X` is previewed there and its branch is drawn beneath it: `A` then `B` under `X`, `A1` under `A`, `A1a` under `A1`, and `B1` under `B`. The old location has none of those rows. The carried copy and its line are gone; the branch does not wait for the response to return. After an accepted response, the same tree stays drawn at the saved placement. A section still limits its shown levels and uses overflow rows; an open modal shows every level.

**Automation test:** —

## DRAG-8.6 — A cancel draws the branch at its pickup placement without writing

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §10, wiki board-drag-interaction §1.1, wiki hierarchy-placement §8

*Given* `X` is picked up as a Card or Stub, with its branch absent and its copy previewed at a different gap or in another Card, *when* the drag is cancelled, *then* no drag write is sent, `X` returns to its pickup placement and the branch is drawn beneath it again at once, within each list's shown levels. The carried copy and its count line disappear. The Card's list keeps the user's collapsed or expanded preference. If the pickup was a re-drag of an earlier pending move, the restored placement is that earlier preview, with its pending marker retained while its write remains in flight.

**Automation test:** —

## DRAG-8.7 — A forced stop draws the branch where the reloaded board has it

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §10, wiki board-drag-interaction §9, wiki hierarchy-placement §8

*Given* `X` is being carried with its branch absent, *when* a resync lands mid-drag and reloads `X` under different parent `Q`, *then* the drag ends, its release writes nothing, and the carried copy and line disappear. `X` and its attached descendants are drawn where the reloaded board has them, under `Q`, not restored to the pickup parent or the drag's uncommitted preview. The branch's membership follows the reloaded tree, not the held pickup snapshot. Expanded sections draw their shown levels and overflow rows, and a modal that remains open draws every level; the stop does not expand a collapsed section or open a closed modal to reveal the branch.

**Automation test:** —

## DRAG-8.8 — The count line uses attached children and all attached descendants, including hidden levels

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §5a, wiki board-drag-interaction §7.2, wiki board-drag-interaction §9, wiki hierarchy-placement §8

*Given* each tree below, *when* its item is picked up as a Card or Stub, *then* the carried copy's line has exactly the following text:

| Attached tree below the item | Line |
|---|---|
| One leaf child | `+ 1 child` |
| Two leaf children | `+ 2 children` |
| One child with one attached child of its own | `+ 1 child, 2 total descendants` |
| The setup's two children and five descendants | `+ 2 children, 5 total descendants` |
| No children | No line |
| Only Free children, even with attached children of their own | No line |

*Given* instead the item has one attached chain with one descendant at each depth through `sectionLevels + 1`, *when* it is picked up from a section that cannot show the chain's last row, *then* the line reads "+ 1 child, Y total descendants", with `Y = sectionLevels + 1`. Opening the modal changes neither count. The line counts every attached descendant, not just the rows a section can show, and never includes the carried item itself.

**Automation test:** —

## DRAG-8.9 — The line stays on the carried copy through every form switch, and never appears on the ghost

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §5a, wiki board-drag-interaction §2, wiki board-drag-interaction §7.3, wiki hierarchy-placement §8

*Given* the setup, *when* Free Card `X` is picked up, *then* its shortCard carried copy shows "+ 2 children, 5 total descendants", and its shortCard ghost has no line. *When* `X` zooms into a section and enters its hierarchy modal, *then* the carried Stub copy keeps that text and the Stub ghost has none. *When* it pops back out to the column or expanded sub-row and out to Board, *then* the shortCard copy still has that text, its tilt turns the line with it, and the ghost still has none. Zooming back into a section keeps the same line.

*Given* instead Stub `X` is picked up in its section or modal, *then* its carried Stub copy has the line from pickup, while its ghost has none. Popping to the column and zooming back into a section preserves the line on the carried copy alone, with the same counts throughout.

**Automation test:** —

## DRAG-8.10 — The line hangs outside the measured box and covers what is below it

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §5a, wiki board-drag-interaction §5, wiki board-drag-interaction §2, wiki hierarchy-placement §8

*Given* two otherwise equal drag setups, one item with a branch and one without, *when* each is carried in Stub form, *then* its measured box and its ghost are one fixed Stub-row height. In shortCard form, each measured box and ghost is shortCard's fixed height. The branch line hangs below the carried box and adds no height to it or the ghost. With equal pointer positions and list geometry, the bands reserve the same space, the side highlight chooses the same ghost neighbor, and the carried box reaches the same bound in both setups.

*When* the copy has a line, *then* that line is one row tall. In a section it covers the row directly below the ghost; in a column or sub-row it covers the top of the Card below the ghost and the gap above that Card. It takes no pointer: rows and gaps beneath it remain reachable by the drag, and the line itself is no target. At a section's or sub-row's last row, bounding the copy's box at the bottom edge leaves its line able to hang past that edge. The bound does not move the box upward to fit the line. The line's typography, fill and animation are not assertions of this case.

**Automation test:** —

## DRAG-8.11 — A release in the pickup gap and depth restores the branch without writing

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki board-drag-interaction §7.1, wiki hierarchy-placement §5, wiki board-drag-interaction §10, wiki hierarchy-placement §8

*Given* Stub `X` is picked up in a section or modal, with original parent `P` and position `p`, *when* the ghost is returned to that pickup gap and depth and the user releases, *then* no request is sent, `X.parentId = P` and `X.position = p` remain unchanged, and the branch is drawn under `X` again at once. The carried copy and count line disappear. If an earlier move of `X` is still pending, this set-down restores that move's preview and pending marker; it does not revert to the older saved placement.

**Automation test:** —

## DRAG-8.12 — An over-cap release restores the branch without writing

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §7.2, wiki hierarchy-placement §6, wiki board-drag-interaction §10, wiki hierarchy-placement §8

*Given* `X` has an attached branch and is carried at a section's or modal's Descendants layer, *when* the user reaches a tab state that would put the deepest carried descendant past `CAP` and releases there, *then* no request is sent. `X` returns to its pickup placement with its original parent, attachment and position; its branch is drawn there again at once, within the section's shown levels or at every level in an open modal. The invalid preview receives none of the branch, and the carried copy and line disappear. If the pickup placement was an earlier pending preview, that preview and its pending marker are restored while its write remains in flight.

**Automation test:** —
