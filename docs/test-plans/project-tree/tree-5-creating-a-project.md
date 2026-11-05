# TREE-5 — Creating a project

**Next ID:** TREE-5.6

| ID | Case | Priority | Status |
|---|---|---|---|
| TREE-5.1 | A create makes a top-level project or a child, after its siblings' true last | P1 | Automated |
| TREE-5.2 | Both Add subproject controls allow a child that reaches exactly the cap | P1 | Automated |
| TREE-5.3 | Both Add subproject controls stay drawn but disabled at or past the cap | P1 | Automated |
| TREE-5.4 | Add subproject remains offered until the project cap is read | P2 | Automated |
| TREE-5.5 | New project remains offered regardless of existing projects' depths | P2 | Automated |

---

## TREE-5.1 — A create makes a top-level project or a child, after its siblings' true last

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §5, wiki positioning §3, wiki positioning §4

*Given* top-level projects `A` (`1.0`) and `P` (`2.0`), where `P` has no children, *when* a project is created naming no parent, *then* it's top-level, at `3`. *When* a project is created naming `P` as its parent, *then* it's `P`'s child, at `1`, and a second one created under `P` is at `2`. *And given* `A`'s children sit at `1.0` and `4.2`, *when* a project is created under `A`, *then* it's at `5`, whatever the top-level projects' positions. A create with no name is [TREE-8.1](tree-8-a-projects-name.md)'s, and which workflow the new project uses is [BCU-1.5](../boards-columns-unsorted/bcu-1-boards-and-what-they-show.md)'s.

**Automation test:** `server/tests/routes/projects.test.ts`

## TREE-5.2 — Both Add subproject controls allow a child that reaches exactly the cap

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §5, wiki project-tree §3, wiki hierarchy-placement §6

*Given* the project cap `PCAP` has been read and parent `P` is at absolute depth `PCAP - 1`, with top-level projects at depth 1, *when* the user reaches Add subproject on `P`'s sidebar row or on its Overview tab, *then* each control is enabled and opens the child-create dialog for `P`. Submitting a valid name creates a child of `P` at exactly `PCAP`; neither control blocks this legal boundary. The sidebar's hover actions still offer the enabled control. Both surfaces use the server's project cap, rather than an independent limit or the item cap.

**Automation test:** `tests/ui/project-tree-create-cap.spec.ts`

## TREE-5.3 — Both Add subproject controls stay drawn but disabled at or past the cap

**Priority:** P1 · **Status:** Automated · **Rule:** wiki project-tree §5, wiki hierarchy-placement §6

*Given* the project cap `PCAP` has been read and parent `P` is at absolute depth `PCAP`, *when* the user hovers its sidebar row's actions or views its Overview tab, *then* Add subproject is present on both surfaces but disabled. Hovering each gives exactly `At the depth cap (N levels)`, with `N = PCAP`. Each control is exposed as disabled to assistive technology, takes no keyboard focus and cannot open the create dialog or send a create request by pointer or keyboard activation. It is not replaced by a hidden control.

*Given* instead `P` is already at depth `PCAP + 1` in data the API did not create, *then* both controls behave the same way and name `PCAP` in the reason, not `P`'s depth. The existing project remains visible and readable. The disabled control's color, opacity and cursor are not assertions of this case.

**Automation test:** `tests/ui/project-tree-create-cap.spec.ts`

## TREE-5.4 — Add subproject remains offered until the project cap is read

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §5, wiki project-tree §3, wiki hierarchy-placement §6

*Given* the sidebar and Overview tab can show parent `P`, but the client's request for the project cap is still unanswered, *when* either Add subproject control is reached, *then* it is enabled and can open the child-create dialog. No guessed limit disables it. *When* the cap response arrives with `PCAP` equal to `P`'s absolute depth, *then* both controls become disabled with `At the depth cap (N levels)`, `N = PCAP`, as in [TREE-5.3](tree-5-creating-a-project.md). A parent at depth `PCAP - 1` instead keeps both controls enabled. An attempted over-cap create while the cap is unread remains subject to the API's refusal; unread client state does not relax that rule.

**Automation test:** `tests/ui/project-tree-create-cap.spec.ts`

## TREE-5.5 — New project remains offered regardless of existing projects' depths

**Priority:** P2 · **Status:** Automated · **Rule:** wiki project-tree §5

*Given* the sidebar includes projects at or past the project cap, *when* the user reaches New project at the sidebar's top, *then* the control is enabled and opens a top-level create, not a child create under the selected project. Submitting a valid name creates a project with `parentId = null`, at absolute depth 1. This remains offered whether the project cap has been read or is still unanswered; disabled Add subproject controls do not disable New project.

**Automation test:** `tests/ui/project-tree-create-cap.spec.ts`, `tests/ui/project-sidebar.spec.ts`
