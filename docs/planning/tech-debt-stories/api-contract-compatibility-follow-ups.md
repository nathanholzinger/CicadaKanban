# API Contract — Post-migration Decisions and Corrections

**Type:** tech-debt planning story · **Written:** 2026-10-30 by the Architect · **Status:** deferred until migration acceptance; decisions and implementation not started · **Sequenced:** after M5's regression-free acceptance and the migration merge; no Q3–Q6 ruling is a prerequisite without a concrete unavoidable implementation blocker

## Goal

After the [migration](../api-contract-migration/README.md) is proven regression-free, resolve the observations carried from the [framework spike results](api-contract-framework-spike-results.md) and Nathan's round-table answers, then scope approved corrections separately. This plan records destinations, not permission to change behavior. An unusual input outcome is not automatically a product defect. Preserving it for the migration does not declare it permanently intentional.

The wiki remains the business-rule authority. The current implementation and frozen compatibility corpus establish what the refactor must preserve until a separate ruling changes it. Any implementation story changing behavior follows the normal PO/Test Planner/Coder/audit workflow; the spike's workflow exception does not carry forward.

## Inbound deferrals and evidence

| ID / decision owner | Expected or intended behavior needing resolution | Observed behavior / evidence | Disposition and completion evidence |
|---|---|---|---|
| CF1 — PO; Bruno/code owner after ruling | Wiki row-references §1 refuses a named missing row with 400; project-tree §6 and positioning §2 describe a selected neighbor. Decide whether an unused `nextId` is still a reference the write must honor. Bruno's project-move docs say `nextId` is not checked and that empty reference strings are 400 | With valid `prevId`, `nextId: 'missing'` or `''` succeeds; `nextId: 42` returns 400 before parent/entity checks. See `compatibilityCases.ts` project both-neighbor and unused-next cases, frozen snapshots, `routes/projects.ts`, and `bruno/projects/move-project.bru` | Preserve now. PO rules on selected versus unused neighbor semantics and any wiki clarification; request owner then clarifies type checks versus existence/scope checks, or a separate behavior story changes them. Completion includes both-neighbor multi-fault tests and agreement among wiki, code and Bruno |
| CF2 — PO/Nathan; implementation owner after ruling | Decide the intended status/message/precedence for malformed JSON, missing bodies, and non-string anchors; a proposed 400 is a change to approve, not an established universal rule | The corpus's object item anchor, missing item/project body, malformed JSON and JSON-null examples reach generic 500 responses through binding/parser/global middleware paths | Preserve frozen outcomes during migration. A separately scoped validation/error-handling correction must define target statuses and messages, lookup versus parser precedence, CORS/JSON headers, and no-write behavior. Update behavioral expectations deliberately only in that story |
| CF3 — PO/Nathan | Decide whether legacy scope arrays, unknown fields, and repeated/unknown workflow filters should stay permissive; generation must describe current transport forms | Nonempty `scopeWorkphaseIds: [null]` supplies intent; other malformed scope values can be ignored with explicit intent. Repeated `projectId` is stringified as a comma-joined value; bracket keys/unknown query keys are ignored. See the named corpus cases | Preserve, do not tighten schemas as cleanup. If a change is desired, specify each accepted/refused form and precedence, add changed-behavior cases, and update authored scenarios. Otherwise close as intentional compatibility with no code change |
| CF4 — Architect; PO for product-facing optionality decisions | Full wire declarations should reflect delivered fields; UI loading/view-model needs may legitimately differ | Item detail includes `workflowId`, child/root depth and `positionScope`; manual `ItemDetail` lacks `workflowId`, and manual item fields are optional. `pilotTypes.ts` derives full wire fields but preserves the UI optionality boundary. The domain `Side` union remains separate; adding the wire `PositionScope` enum leaves three authored enum definitions | Continue technical transport migration in the proposed API epic; use shared neutral vocabulary or explicit agreement checks where useful. Requiring UI `positionScope` remains owned by `positioning-on-create-and-edit.md`, whose existing deferral records Nathan's optionality decision. Do not tighten it in a contract refactor. Completion distinguishes derived transport aliases from view models and documents/checks any surviving duplicate vocabulary |
| CF5 — Nathan/Architect; PO if runtime behavior changes | Decide whether MCP should enforce its advertisements; advertisement reuse alone should preserve current tool behavior | `get_item`/`move_item` advertise required string IDs; the low-level dispatcher forwards raw arguments and the REST endpoint can accept values outside that advertisement. For example, null workphase forwarding is retained by `pilotContracts.test.ts`. SDK stdio registration is not part of that test | Preserve current mapping, errors and capabilities. Any runtime argument validation or SDK registration migration needs its own compatibility/ruling scope and stdio error/result tests. Additional `move_project` or anchor/side inputs are a separate capability proposal, not a fix silently included here |
| CF6 — Architect; Nathan approves guide changes | The error-handling guide should describe the current global backstop accurately | `.claude/guides/error-handling-patterns.md`'s worked example says no global middleware exists; `server/src/index.ts` registers logging plus JSON `500 { error: 'Internal server error' }` last, and frozen cases exercise it | A separate guide-correction task should replace the stale example after Nathan approves the guide edit. Check the current registration and representative exception paths; no middleware behavior change is needed to correct the factual example |
| CF7 — PO/Nathan; M3/M4 capture before replacement | Wiki row-references §1 specifies 400 for a write field naming no row. Clarify how that rule applies across resources and to collection-owner IDs in URLs versus request-body references | M1's [source inventory](../api-contract-migration/m1-api-inventory.md) identifies board creation's missing workflow and column creation's missing board using 404 lookup helpers; label assignment's missing item/label uses 404; attachment creation has no item-existence guard and an absent item can reach the FK/global 500 path. This is source evidence, not a new HTTP reproduction or a confirmed policy ruling | Preserve each current status/message and precedence. M3/M4 capture the reachable HTTP outcomes and no-write effects before migrating those operations. After migration, PO determines rule applicability and any correction scope; approved changes receive separate tests and consumer/document handoffs. Do not normalize these outcomes to 400 during schema adoption |

The expected/observed distinctions above are requests for decisions, not new wiki rules. The spike did not perform an exhaustive wiki audit or certify every endpoint. CF7 was added by the current-base inventory; its source observations require receiving-batch HTTP characterization.

## Decisions

- Nathan's Q2/Q3–Q6 answer is the migration disposition: preserve the observed outcomes first. The PO's CF1 interpretation and CF2/CF3/CF5 recommendations are received input, not presumed new approvals, deprecation or closure. Record known wiki/implementation disagreements without changing either side just to make the refactor appear correct.
- Keep these items outside behavior-preserving library adoption. A framework choice does not resolve a product contract question.
- Do not update golden captures merely to make a new validator pass. A later authorized behavior story records the changed rule and its deliberately revised tests.
- Do not edit wiki/test-plan ownership surfaces here. The PO and Test Planner apply any approved changes through their own handoffs.
- Documentation-only CF6 is queued here by default. Nathan can prioritize it separately; the actual guide edit still follows the normal approval requirement. It is not a migration prerequisite.

## Additional decisions received for the post-migration batch

| Source | Decision to make after acceptance | Boundary |
|---|---|---|
| Q2 / Architect #5 | Policy for errors on genuinely new product fields, including schema-local authored messages versus library defaults | Existing messages/precedence stay preserved through migration; no new product field is required to adopt Zod |
| Q5 / PO CF3 | Whether to deprecate `scopeWorkphaseIds`, then whether/when to retire it | No deprecation or removal is presumed now. Acceptance, ignored values and intent behavior remain unchanged until separately approved |
| Q6 / CF5 | Whether raw forwarding closes as intentional, and whether any validation/SDK/capability work is wanted | Existing curated advertisements and raw runtime behavior stay unchanged; a new capability requires its own scope |
| Q8 / Architect #8 | Whether broad test-only response interception during Playwright offers enough value | M1–M5 retain explicit response contract checks and unchanged external test configuration; this extension is optional |
| Publication delivery | Whether complete repository artifacts need a public endpoint/viewer and which path/delivery | M5 completes the maintained repository reference. New external delivery is not necessary to prove migration complete |

## Work, in batches

1. **After M5/merge, triage with Nathan and the relevant owners.** Review CF1's interpretation and CF7's characterized resource differences, decide whether CF2/CF3/CF5 warrant changes, and resolve or explicitly retain the additional policy/delivery questions above. CF4's technical consolidation is received from M1–M4; its product optionality remains with positioning. Close intentional compatibility items or split approved changes into implementation stories carrying their IDs and evidence. No correction story is inserted before migration merely because it might reduce adapter code.
2. **Apply authorized documentation corrections.** The request owner addresses CF1 after the PO's ruling; the Architect drafts CF6 for Nathan. Run documentation checks. Do not treat these queued corrections as already applied.
3. **Implement only separately approved behavior work.** Each resulting story states target behavior, wiki/test-plan handoffs, affected consumers, and its compatibility exception. Use the normal workflow, full gate and Playwright; no implementation begins from this queue alone.

## Code map

This planning story changes no implementation. Evidence lives in `server/tests/contracts/compatibilityCases.ts`, frozen snapshots, `prototypes/pilotContracts.test.ts`, selected routes/schemas, `mcpItemTools.ts`, client type modules, the project Bruno request, and the named guide. The [spike results](api-contract-framework-spike-results.md) distinguish measured behavior from intended rules.

## Acceptance

- Every CF item has an owner and either a documented no-change decision or a receiving implementation/documentation task that names it.
- A behavior change has explicit expected statuses/payloads, precedence, database effects and consumer impact; baseline capture changes are intentional and justified by an approved rule.
- No finding is treated as permission to weaken or remove existing coverage during framework adoption.

## Open questions

- **Nathan, after migration:** which CF/policy/delivery proposals should close unchanged, receive a ruling or proceed to a separate correction? No priority or implementation authorization is assumed.
- **PO/Nathan, after migration:** receive the PO's reading that CF1's unused neighbor is still a reference under wiki row-references §1, and decide the final correction/clarification scope along with CF2's intended malformed-request behavior. These are not open blockers of M1–M5.

## Handoff

- **API migration:** preserve these observed outcomes through regression-free acceptance. CF4's technical vocabulary/transport work is explicitly assigned to M1–M4; do not report its product optionality decision as settled by technical consolidation.
- **Positioning:** retains move-shape symmetry, dual positions, create/edit placement and its existing `positionScope` optionality decision. The spike is not a prerequisite to redesigning them and does not choose their answers.
- **Optional consistency/capability work:** depth-cap delivery symmetry and new MCP tools/inputs are separate proposed scopes if Nathan wants them. They were inherited proposals, not defects established by this evaluation.
- **PO/Test Planner/document owners:** receive approved rulings/corrections only; no living wiki, test plan or guide is edited by this queue.

## Amendments

- **2026-10-30:** Nathan directed preserving current behavior through migration and deferring Q3–Q6 decisions/corrections until regression-free acceptance. Sequenced this receiving story after M5/merge, received optional Q8/publication/future-field decisions, and routed CF4's technical work to the migration. No finding is closed as intentional and no behavior/guide change is performed.
- **2026-10-30:** M1 Batch 1 source review added CF7 for resource-specific missing-reference statuses. M3/M4 own HTTP characterization before replacement; product rulings/corrections remain after migration. No runtime change or newly reproduced HTTP result is claimed.
