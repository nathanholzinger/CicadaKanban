# TREE-11 — Which projects the sidebar shows open

**Next ID:** TREE-11.9

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-11.1 | Existing and newly created projects start open | P1 | Open |
| TREE-11.2 | A chevron collapse hides the subtree until opening or reload | P1 | Open |
| TREE-11.3 | A successful create opens its collapsed parent from either create entry point | P1 | Open |
| TREE-11.4 | A failed create leaves its parent collapsed | P1 | Open |
| TREE-11.5 | A successful parent change opens the collapsed new parent | P1 | Open |
| TREE-11.6 | A failed parent change leaves the new parent collapsed | P1 | Open |
| TREE-11.7 | A rename or an edit keeping the same parent leaves that parent collapsed | P2 | Open |
| TREE-11.8 | A top-level create or parent change opens no unrelated project | P2 | Open |

---

## TREE-11.1 — Existing and newly created projects start open

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §11

*Given* project `P` has child `C`, and `C` has child `G`, *when* the app loads, *then* all three rows are shown, with `P` and `C` expanded. *When* a new top-level project `N` is created after that load and its first subproject `N1` is created without reloading, *then* `N1` shows under `N` without opening `N` by hand. *When* `N1`'s first subproject `N1a` is created, *then* it likewise shows without opening `N1` by hand. New projects start open just as the loaded projects do.

**Automation test:** —

## TREE-11.2 — A chevron collapse hides the subtree until opening or reload

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §11, wiki project-tree §1

*Given* expanded `P` with child `C` and grandchild `G`, and unrelated expanded `Q` with child `Q1`, *when* the user collapses `P` by its chevron, *then* `P` remains shown, `C` and `G` are hidden, and `Q1` remains shown. The hierarchy's parent links and positions are unchanged. *When* `P` is opened again, *then* `C` and `G` are shown at their same places. *When* the user collapses both `P` and `Q` and reloads the app, *then* both are expanded and `C`, `G` and `Q1` are shown. Neither hand-set collapse survives the reload. Collapse hides rows, not the real tree used for placement ([TREE-1.5](tree-1-gap-and-depth.md)).

**Automation test:** —

## TREE-11.3 — A successful create opens its collapsed parent from either create entry point

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §11, wiki project-tree §5

*Given* parent `P` has child `C` and is collapsed by hand, *when* the user submits a new child `N` through the sidebar's Add subproject dialog, *then* `P` stays collapsed while the create is unanswered. *When* the create succeeds, *then* `P` opens and shows `C` followed by `N`, with `N.parentId = P`. The opening overrides the hand-set collapse. The same holds when the create dialog is opened from `P`'s subprojects list on the project page. An unrelated collapsed project stays collapsed.

**Automation test:** —

## TREE-11.4 — A failed create leaves its parent collapsed

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §11, wiki project-tree §5

*Given* parent `P` has child `C` and is collapsed by hand, *when* a create of child `N` is submitted through the sidebar's Add subproject dialog or the project page's subprojects list and the create fails, *then* `P` remains collapsed throughout the request and after its failure. `C` remains hidden and no new child row appears. A failed create does not clear the user's collapse.

**Automation test:** —

## TREE-11.5 — A successful parent change opens the collapsed new parent

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §11, wiki project-tree §7

*Given* top-level project `X` and parent `P` with child `C`, where `P` is collapsed by hand and is a legal parent for `X`, *when* the user changes `X`'s parent to `P` through the project page's parent dropdown, *then* `P` stays collapsed while the edit is unanswered. *When* the edit succeeds, *then* `P` opens and shows `C` followed by `X`, with `X.parentId = P`. The opening overrides the hand-set collapse. An unrelated collapsed project stays collapsed.

**Automation test:** —

## TREE-11.6 — A failed parent change leaves the new parent collapsed

**Priority:** P1 · **Status:** Open · **Rule:** wiki project-tree §11, wiki project-tree §7

*Given* top-level `X` and collapsed parent `P` with child `C`, *when* the user changes `X`'s parent to `P` through the project page's parent dropdown and the edit fails, *then* `P` stays collapsed throughout the request and after its failure. `C` stays hidden, `X` stays top-level with its original position, and no child row for `X` appears under `P`.

**Automation test:** —

## TREE-11.7 — A rename or an edit keeping the same parent leaves that parent collapsed

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §11, wiki project-tree §7

*Given* collapsed parent `P` with child `X`, *when* the app successfully renames `X` without changing its parent, *then* `P` stays collapsed and `X` stays hidden. *When* an edit explicitly names `P`, the parent `X` already has, and succeeds, *then* `P` likewise stays collapsed. Neither successful edit gives `X` a new parent, so neither opens one. Renaming `P` itself also leaves it collapsed.

**Automation test:** —

## TREE-11.8 — A top-level create or parent change opens no unrelated project

**Priority:** P2 · **Status:** Open · **Rule:** wiki project-tree §11, wiki project-tree §5, wiki project-tree §7

*Given* collapsed projects `P` and `Q`, *when* a new top-level project `N` is successfully created, *then* `N` starts open, while `P` and `Q` stay collapsed: `N` has no parent to open. *Given* instead `X` is a child of collapsed `P`, *when* a successful edit makes `X` top-level, *then* `X.parentId = null` and `P` and `Q` both remain collapsed. Removing a parent opens neither the old parent nor an unrelated project.

**Automation test:** —
