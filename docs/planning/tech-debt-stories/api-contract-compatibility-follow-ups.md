# API Contract Compatibility — Follow-up Decisions

**Type:** tech-debt planning story · **Written:** 2026-10-30 by the Architect · **Status:** awaiting grooming and Nathan's prioritization · **Sequenced:** after the behavior-preserving contract spike; independent of adopting a framework

## Goal

Resolve the observations carried from the [framework spike results](api-contract-framework-spike-results.md), then authorize narrowly scoped corrections separately from contract migration. This plan records destinations, not permission to change behavior. An unusual input outcome is not automatically a product defect.

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

The expected/observed distinctions above are requests for decisions, not new wiki rules. The spike did not perform an exhaustive wiki audit or certify every endpoint.

## Decisions

- Keep these items outside behavior-preserving library adoption. A framework choice does not resolve a product contract question.
- Do not update golden captures merely to make a new validator pass. A later authorized behavior story records the changed rule and its deliberately revised tests.
- Do not edit wiki/test-plan ownership surfaces here. The PO and Test Planner apply any approved changes through their own handoffs.
- Documentation-only CF6 can be prioritized independently; it still follows the guide's Nathan-approval requirement.

## Work, in batches

1. **Triage with Nathan and the relevant owners.** Confirm CF1's semantic interpretation, decide whether CF2/CF3/CF5 warrant changes, and keep CF4's technical versus product decisions distinct. Close intentional compatibility items or split approved changes into implementation stories carrying their IDs and evidence.
2. **Apply authorized documentation corrections.** The request owner addresses CF1 after the PO's ruling; the Architect drafts CF6 for Nathan. Run documentation checks. Do not treat these queued corrections as already applied.
3. **Implement only separately approved behavior work.** Each resulting story states target behavior, wiki/test-plan handoffs, affected consumers, and its compatibility exception. Use the normal workflow, full gate and Playwright; no implementation begins from this queue alone.

## Code map

This planning story changes no implementation. Evidence lives in `server/tests/contracts/compatibilityCases.ts`, frozen snapshots, `prototypes/pilotContracts.test.ts`, selected routes/schemas, `mcpItemTools.ts`, client type modules, the project Bruno request, and the named guide. The [spike results](api-contract-framework-spike-results.md) distinguish measured behavior from intended rules.

## Acceptance

- Every CF item has an owner and either a documented no-change decision or a receiving implementation/documentation task that names it.
- A behavior change has explicit expected statuses/payloads, precedence, database effects and consumer impact; baseline capture changes are intentional and justified by an approved rule.
- No finding is treated as permission to weaken or remove existing coverage during framework adoption.

## Open questions

- **Nathan:** which of CF1–CF6 should be groomed or corrected next? No priority or implementation authorization is assumed.
- **PO:** does CF1's unused neighbor count as a reference under wiki row-references §1, and what should malformed transport/error precedence mean under CF2?

## Handoff

- **API migration:** preserve these observed outcomes until a separately authorized correction lands. CF4's technical type consolidation belongs in that migration.
- **Positioning:** retains move-shape symmetry, dual positions, create/edit placement and its existing `positionScope` optionality decision. The spike is not a prerequisite to redesigning them and does not choose their answers.
- **Optional consistency/capability work:** depth-cap delivery symmetry and new MCP tools/inputs are separate proposed scopes if Nathan wants them. They were inherited proposals, not defects established by this evaluation.
- **PO/Test Planner/document owners:** receive approved rulings/corrections only; no living wiki, test plan or guide is edited by this queue.
