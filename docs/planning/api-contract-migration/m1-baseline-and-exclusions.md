# M1 — Current Development Baseline and Exclusions

**Recorded:** 2026-10-30 by the Architect · **Scope:** current migration development, not final Epic 3.5 integration acceptance

## Revision and evidence chain

| Reference | Meaning |
|---|---|
| `575b33ba14b545c7fbdf9dca69dcca99d1337bf3` | Current development baseline: committed M1 tooling cleanup |
| `c1aa1de964235388ea3752a346b071c7b3433821` | Current local-main ancestry, “close story 8.3”; Epic 3.5 remains in progress |
| `api-contract-framework-spike-completed` at `5408bdb150cbb227298f53aba1cc57d3b7866d61` | Preserved evidence/planning branch; contains the complete comparison and pilot |
| `0565cde`, `843f132`, `7410110`, `d703e6a` | Frozen corpus baseline, three-candidate comparison, integrated pilot, final spike recommendation respectively |

At preparation, working changes after `575b33b` are planning documents only. The application, tests, schemas/tooling, manifests/lockfile and test configuration match that committed cleanup. The green results below were recorded for that retained code; Batch 1 does not claim a new full-suite execution solely because these documents were added. Source scans/checks in this batch import no app/database and change no fixtures or expectations.

The independent [54-operation source inventory](m1-api-inventory.md) records current methods, paths, response/status variants, receiving stories and consumers. It does not derive completeness from the four registered operations or from the compatibility corpus.

## Retained-code verification

| Check | Recorded result / evidence |
|---|---|
| Full root gate, `npm.cmd run check` | Passed: **525 server tests in 26 files, 604 client tests in 34 files, 235 tooling tests**, production/test/tool TypeScript checks, lint, format and docs checks. Local log: `logs/m1-check-final.log` |
| Unchanged `npm.cmd run test:e2e` | Passed: **219 passed, 18 skipped, 237 discovered**, 3.9 minutes. Local log: `logs/m1-e2e.log`; `tests/output/artifacts/.last-run.json` reports passed with no failed tests |
| Focused HTTP compatibility/integration/native conversion checks | 93 passed: frozen 77 cases, nine integrated checks, seven native probes. Log: `logs/m1-focused.log` |
| Preserved response/database captures | All 77 frozen snapshot cases replayed unchanged; IDs/time are normalized by the retained harness, while status, messages, ordering, meaningful fields and database deltas remain asserted |
| Install/compiler boundary | Clean root workspace install and normal generation/freshness passed. App root/server compiler 6.0.3; generator peer 5.9.3. Node v24.11.1 / npm 11.6.2 confirmed locally |
| Reversible source drills | Optional request field propagated; missing required response and nullability regression detected. Source/artifacts restored; no scratch test remains. Log: `logs/m1-drills.log` |
| Generation isolation | Freshness passed with DB_PATH pointing at a directory; paths/components equal the preserved contract JSON, with descriptive title/header changes only |

Logs/report files are ignored local output, not the sole durable evidence: the results/account and exact code/evidence revisions are recorded here and in [M1 progress](m1-progress.md). Reproduce using normal root/server/client installs, `npm run contracts:check`, the full gate and unchanged E2E, run sequentially. No source changed here requiring those unchanged suites to be repeated.

The 525 server tests retain **509 baseline/product-characterization + 9 integrated + 7 native probes**. The drop from 780 retires 255 comparison-only checks under the approved cleanup account. It is not an exclusion of 255 product cases. No skipped server/client cases were reported in those runs; passing test totals do not certify that every product catalog case has coverage.

## E2E skip ownership — exactly 18 current exclusions

Every row below is an inherited `test.skip`, not a pass or newly approved waiver. Reasons are read from the current spec/comment and receiving roadmap; they are not a fresh determination that the product is correct. Repair/redesign ownership remains with **Epic 3.5 Story 10**, with **Story 8 closeout/Test Planner/Reconciler** responsible for rule and full-case mapping as the gesture settles. See [the receiving Epic 3.5 roadmap](../epic-3-5-stories/epic-3-5-roadmap.md), “How Story 8 runs,” its closeout deferrals and “Story 10 — DnD automation catch-up.” No migration story gains gesture repair scope by recording this baseline.

Source keys, all under `tests/ui/`:

- **CC:** [item-repositioning-cross-column-dnd.spec.ts](../../../tests/ui/item-repositioning-cross-column-dnd.spec.ts)
- **CP:** [item-repositioning-cross-project-dnd.spec.ts](../../../tests/ui/item-repositioning-cross-project-dnd.spec.ts)
- **Z:** [drag-card-zoom-in.spec.ts](../../../tests/ui/drag-card-zoom-in.spec.ts)
- **S:** [drag-5-stub-detach.spec.ts](../../../tests/ui/drag-5-stub-detach.spec.ts)
- **HM:** [drag-7-hierarchy-modal.spec.ts](../../../tests/ui/drag-7-hierarchy-modal.spec.ts)
- **H:** [drag-7-modal-hold.spec.ts](../../../tests/ui/drag-7-modal-hold.spec.ts)
- **O:** [drag-7-overflow-row.spec.ts](../../../tests/ui/drag-7-overflow-row.spec.ts)

| # | Source / distinguishing title | Current reason and receiving scope |
|---|---|---|
| 1 | CC — `1.a — drag C onto card A` | Old swap-preview/target-anchor precision recipe; Story 10 item 3 reevaluates the premise, which may have changed since the skip |
| 2 | CC — `2.a — drag C onto card B` | Same inherited precision recipe; Story 10 item 3 |
| 3 | CP — `1.a — drag C onto card A` | Same cross-project gesture precision limitation; Story 10 item 3 |
| 4 | CP — `2.a — from the root board, drag C onto card B` | Same root-board target precision limitation; Story 10 item 3 |
| 5 | CP — `2.b — ... drag C onto card E (same gap as after D)` | Longer-distance precision/anchor recipe; Story 10 item 3 |
| 6 | CP — `4.b — ... drag D onto card A (before A)` | Same inherited precision recipe; Story 10 item 3 |
| 7 | Z — `a Card in a different column ... zoom into it and attach` | Header documents target movement after attach-preview insertion, short pop-out clock and frozen pointer undoing the hold; Story 10 zoom/attach automation and Story 8 geometry review |
| 8 | Z — `a Card in the drag's own column ... zoom into it and attach` | Same documented geometry/timing limitation; same receiving scope |
| 9 | S — `DRAG-5.13: a grandchild Stub popped out to its containing Card's layer ...` | Removed Card-layer premise: section now pops to column; Story 10 rewrites against settled layers |
| 10 | HM — `DRAG-7.6, DRAG-7.10, DRAG-7.11: resting outside the modal's box ...` | Removed Card-layer/set-back-down premise; current pop reaches column/Free placement; Story 10 |
| 11 | HM — `DRAG-7.2, DRAG-7.6: ... own slot ... behind an overflow row ... last child` | Re-entry now zooms from column, not Card layer; Story 10 |
| 12 | HM — `DRAG-7.2: ... only attached child dragged ... no overflow row` | Same changed re-entry/layer recipe; Story 10 |
| 13 | HM — `DRAG-7.6: ... own slot ... shows ... nothing written` | Same changed re-entry/layer recipe; Story 10 |
| 14 | H — `DRAG-7.14: ... cursor inside the section ...` | Layer now covers the Card box/padding; old outside-section hold premise differs; Story 10 with Story 8 rule review |
| 15 | H — `DRAG-7.15: held from above ... release right after ...` | Top-quarter aim now names the gap after T; old move-event targeting recipe is stale; Story 8.3 closeout and Story 10 |
| 16 | H — `DRAG-7.15: ... item with a child ... subtree travels ...` | Same from-above targeting recipe; Story 8.3 closeout and Story 10 |
| 17 | H — `DRAG-7.10, DRAG-7.18: after leaving a modal ... opens ... again` | Re-entry now zooms from column, not Card layer; Story 10 |
| 18 | O — `DRAG-7.27: a dragged R carries its overflow row ...` | From-above top-quarter target recipe changed; Story 8.3 closeout and Story 10 |

Rows 1–8 have no qualified case ID in their skipped titles; do not infer a catalog mapping from nearby API twins or header examples. Other IDs above are the titles' claims, not newly approved mappings. In particular, Story 8.3's receiving note explicitly retains DRAG-7.15/7.27 for full-suite gesture rework even though related behavior improved. Story 10 owns the zero-skips goal and decides reevaluation/rewrite/removal with justified coverage; this migration neither unskips nor deletes them.

## Other limits and receiving work

| Limit | Disposition / owner |
|---|---|
| Corpus case-ID claims | Source recount: **30 of 77 titles**, **37 ID mentions / 34 distinct IDs**. M1 Batch 3's Reconciler handoff verifies each full Then; no automatic catalog credit is claimed by this baseline |
| Only four operations currently registered | Expected migration scope gap, not a waiver. M2/M3/M4 own 10/17/23 remaining operations; Batch 3 adds independent discovery/association checks; M5 proves complete coverage |
| Unexercised variants on remaining operations | Source inventory identifies representations and helper statuses. Each receiving resource batch captures actual accepted/refused forms, precedence and database effects before replacing checks |
| MCP stdio not certified by helper tests | M4 owns bounded listing/call/error transport evidence. Eight advertisements/HTTP mappings are inventoried independently; no new runtime validation or capability is authorized |
| Bruno collection not certified by one scenario | M4 owns useful authored-body checks/manual dispositions. There are 26 request files and 13 JSON bodies; current integrated automated demonstration is the item-move scenario |
| Known CF1–CF7 discrepancies and proposed policy changes | [Post-migration queue](../tech-debt-stories/api-contract-compatibility-follow-ups.md) owns rulings/corrections. Preserve current behavior; do not relabel it as intended or change business expectations to match the refactor |
| Unmatched routes, test-only mounts, implicit HEAD/CORS OPTIONS | Explicitly accounted for in the inventory boundary; no invented business operations. Preserve behavior and deliberate exclusions in Batch 3 discovery |
| Completed Epic 3.5 not yet integrated | Final merge gate only: record incoming revision/results, refresh affected inventories/captures/consumers, rerun combined suites, then merge back. M1–M5 can proceed now |

No external test, assertion, helper, skip, catalog status, product rule or runtime behavior changes in this Batch 1 record. Any new migration regression is fixed in its own batch; inherited exclusions do not license new skips or weakened tests.
