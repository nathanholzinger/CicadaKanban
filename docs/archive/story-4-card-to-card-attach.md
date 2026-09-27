# Story 4 — Card → Card = attach

✅ **Done (2026-09-16).** This file's "Open decisions" section below is kept
as the historical record of what was actually undecided going in — every
question in it now has an answer in "As built" at the bottom. The mechanics
turned out to need a real rule change (§1.1's layer stack), not just an
implementation of the wiki's existing §6 prose — the same kind of hands-on
reshaping Story 3's popping model went through twice after its first
rounds.

- Story entry: [`epic-3-5-roadmap.md`](epic-3-5-roadmap.md) § Story 4
- Rules: [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md)
  §6 (Card → Card: attach) — settled on *what* a drop commits to, silent on
  *how the gesture gets there*. §1's "a Card's region is the same kind of box
  as a column's, hit-tested first" is provisional, written for this story to
  land against (wiki–code reconciliation #20).
- Cases: [`drag-4-attach-and-stub-placement.md`](../../test-plans/board-drag-interaction/drag-4-attach-and-stub-placement.md)
  TC-1–TC-13 · [`drag-1-contexts-and-popping.md`](../../test-plans/board-drag-interaction/drag-1-contexts-and-popping.md)
  TC-15
- Depends on: Stories 1–3.

**Verified by:** automated reachability + resulting-write cases once the
mechanic is settled, same split as Story 3 (`epic-3-5-decisions.md` Q1).
Until then, verification *is* the Product Owner driving a build and saying
what's wrong with it — that loop is expected, not a sign of a bad plan.

---

## Goal

Two capabilities, one gesture layer:

1. **Reposition a Card within its column** — already works, built in Story
   3 (locked context, sortable shift, band resolution on pop-out). Story 4
   must not regress this; it's the baseline every attach idea below has to
   coexist with, not something this story builds fresh.
2. **New: drop a Card onto another Card to attach it as a Stub**, at the
   dropped slot, inheriting the parent's workphase (wiki §6). This is the
   headline gesture of the epic and the only new capability.

The hard part isn't either capability alone — it's that both have to live on
the *same* gesture (dragging a Card near another Card) without the user
having to aim differently for one versus the other. Wiki §6 already commits
to the answer for *what separates them*: "the pop threshold is what
separates them, not geometry." What isn't decided is how that plays out
frame-by-frame — whether cards visually move out of the way while you
decide, what the ghost looks like while you're deciding, and what a quick
release means at various points along the way.

---

## What's already settled (don't re-decide these)

- **Consequences of an attach** — inheritance, project cascade, done-parent
  legality, atomicity — are entirely [`../item-attachment/`](../item-attachment/)'s
  rules, built in Story 1. This story only has to produce the right
  `parentId` / `isAttached` / anchor request; it never re-implements what a
  valid attach *means*.
- **Insertion is the default; attaching costs a deliberate hold** (wiki §6,
  §2, §3.1). A quick release near a Card is a reposition; only a sustained
  signal reaches attach. This is not up for revision — it's the same bias
  that governs every other pop in the model.
- **Cycle-forming and depth-capped Cards are never poppable into** (§3.2,
  already enforced generically by the machine once a Card *is* a region —
  `classifyDragTargets` already computes this per drag).
- **The three-way hierarchy placement inside a popped Card's context**
  (§7.2, sibling before/after/child-of) is Story 6's job, not this one. This
  story's exit point is: dropped into a Card's Stub list, at *some* slot —
  first child, last child, or an anchor position among direct children.
  Full recursive hierarchy placement is out of scope here.

---

## Open decisions — to resolve by hands-on trial

Everything below is a real fork with no PO ruling yet. Each is written as a
question with the options actually available given the current
implementation (`useBoardDnd.ts`, `boardDndUtils.ts`, `popSession.ts`,
`dragRegions.ts`), not abstract possibilities — so a decision here is a
decision about which existing lever to pull.

### 1. Does a hovered Card visually move aside while its fate is undecided?

Today, `over` being a Card is what makes dnd-kit's sortable shift its
neighbors — that's the entire mechanism behind "cards move out of the way
for the ghost." If a Card becomes a poppable region the same way a column
is, we get to choose what `over` is while hovering it, and that choice *is*
the answer to this question:

- **(a) Always the Card** — neighbors always slide, exactly like today. The
  moment of "this is about to attach, not insert" has no visual counterpart
  until release. Simplest to build; likely reads wrong once tried.
- **(b) Always the Card's Stub-list container, never the Card itself** — the
  hovered Card never slides. Clean for attach, but breaks in-context
  reorder, which fundamentally *is* hovering a sibling Card and needs the
  shift to read as "insert here."
- **(c) Depends on machine state** — `over` is the Card while locked
  in-context (shift reads as insert, matching today), and switches to the
  Card's Stub-list container the moment the cursor pops out of the column
  context. The neighbor slides back under the floating ghost at exactly the
  pop-out moment, which is already a real event the machine fires (Story
  3's `outsideSince` threshold). This is the option that costs the least new
  code — it's a policy choice in `resolveBoardCollisions`, not new
  machinery — but whether the pop-out *moment* is a good time for that
  visual snap is untested.

**Trial approach:** build (c) first since it reuses Story 3's threshold with
no new state; see whether the snap-back reads as a distinct event or as a
jarring layout jump. Fall back to (a) if it doesn't work and lean entirely
on ghost/cue treatment instead.

### 2. How does the Card's own rect stay stable while it's hovered?

`measureDragRegions` reads `getBoundingClientRect`, which includes whatever
CSS transform dnd-kit's sortable is currently applying — so a Card's box
would visibly move under the cursor while it's being shifted by its own
neighbors' drags, or (worse) by its own transform if it's mid-slide. Column
regions don't have this problem; they're not sortable items themselves.

- **Read the Card's rect transform-free.** Either subtract the element's own
  computed transform before treating it as a region (extra bookkeeping per
  Card, every pointer move), or read the position from dnd-kit's own
  `droppableRects`/`active.rect` bookkeeping instead of the DOM directly —
  `rectCenterInside` in `boardDndUtils.ts` already reads `droppableRects`
  for exactly this reason on the column side.
- Layout-driven movement (a Stub-ghost growing the hovered Card, or a
  sibling Card sliding for an unrelated reason) is the case Story 3's frozen-
  entry-rect trick (`PopHover.rect`, `hoverFor`) already exists to absorb —
  reuse it rather than inventing a second freeze mechanism for Cards.

**Trial approach:** this one isn't really a feel question — it's "which of
the two techniques is less code and doesn't drift from dnd-kit's own
bookkeeping." Decide by trying the `droppableRects` read first; only fall
back to a transform-subtraction if a Card genuinely needs a raw DOM
measurement Story 3 doesn't already have.

### 3. What does the ghost show at each state, and does a "double ghost" help?

Right now a popped-out ghost is a single ordinal `Placement` drawn in one
list. Attaching needs the ghost to sometimes render as a Stub *inside*
another Card, which means `Placement` needs a `parentId` (or equivalent) so
the list selectors can draw it there instead of in a column's list.

- **Single ghost, migrates between lists.** X disappears from its column's
  list and reappears as a Stub-ghost inside the hovered Card. Matches how
  cross-column moves already work (the item just moves list). Risk: pulling
  X out of the column list changes that list's layout (closes the gap X
  left), which is one more thing sliding around at the same moment the
  target Card is also changing shape.
  - **(a) Existing member list re-closes normally** — the vacated position
    just isn't backfilled specially. Simplest but yet another simultaneous
    layout shift for the eye to parse.
  - Note this is not "always leave a hole" — that's option (b) below.
- **(b) Double ghost.** Leave a dimmed placeholder at X's slot in the origin
  column for the life of the hover, and *also* draw the Stub-ghost inside
  the target Card. Only one list changes shape (the target's) instead of
  two. More bookkeeping (two things to draw, two things to clear), but
  potentially calmer to look at.

**Trial approach:** build (a) first — it's what cross-column moves already
do, so no new drawing logic — and see if the two simultaneous shifts read as
confusing before spending the extra bookkeeping on (b).

### 4. What does a quick release near a Card mean, and where's the line?

Two specific ambiguities need a PO call once something is buildable enough
to try:

- **The lingering-reorder trap.** With Cards as regions, hovering *any*
  point near a sibling Card starts the same pop-out clock that (under
  option 1c) eventually offers attach. A user who lingers near a Card's edge
  while deciding exactly where to insert could pop out and have their
  release attach instead of insert — the opposite of what they meant.
  Candidate mitigations:
  - Only start the pop-out-toward-attach clock inside the Card's *middle*
    band (reuse `stubPopBandStart`/`stubPopBandEnd`, already in the tuning
    panel), so aiming at a Card's edge for insertion never risks it.
  - A separate, longer threshold just for popping into a Card
    (`popIntoCardDelayMs`) than the column-to-column pop-out threshold.
  - Accept the risk and rely entirely on the visual cue (ghost/dim
    treatment) to make the state legible — the option the wiki's current
    §6 prose seems to assume, untested.
- **Column edge-band reachability once Cards sit in front of them.** DRAG-1.15
  says a Card's region is hit-tested *before* the column containing it. If a
  Card fills the column's top 20% (its `TOP_BAND`), is "insert before
  everything in this column" (today's quick top-band release) still
  reachable without dragging into the literal gap above the first Card? Two
  readings:
  - Accept it — the gap above the first Card (or the sliver of column not
    covered by any Card) is the only way to reach the column's own edge
    bands once Cards are regions.
  - Column edge bands win regardless of what Card occupies them — a Card
    only "captures" the region in the column's *middle* 60%, so the column's
    top/bottom 20% keep meaning "before-first"/"after-last" no matter what's
    drawn there. This reads as more consistent with "aiming at a spot near
    the top of the list means top of the list," but is a real amendment to
    §1's "hit-tested first, no exception" wording.

**Trial approach:** these two can't really be pre-decided — they need a
build to react to. Start with the simplest rule (Card's middle band starts
the attach-pop-out clock; column edge bands are only reachable in the gaps)
and let actually dragging things around on a real board surface whether
either needs the escape hatch.

---

## Suggested build order

Not a commitment — just the order that lets each open decision get tried
with the least code thrown away if the answer is "no":

1. Wire `KanbanCard` as a `data-drag-region` (Card regions exist, but with
   no attach behavior yet — this alone should not change anything
   observable, since nothing pops into a Card yet).
2. Decision 2 (stable rect) has to land here regardless of which other
   answer wins — without it nothing else can be tested honestly.
3. Try Decision 1's option (c) end to end for one case (same-column,
   locked → hover a sibling → pop out → hover its Stub area) before
   building out every cross-column/cross-project/done-parent variant —
   the feel question is answerable from the simplest case.
4. Extend `Placement` with the parent-list field Decision 3 needs; build
   the single-ghost version first.
5. Wire the actual attach write (`buildMoveInput`/`sendItemMove` already
   handle arbitrary `MoveItemInput` shapes — Story 1's `parentId`/
   `isAttached` fields just need to reach them from a new resolution kind).
6. Only after the above feels right in the simple case: cross-project,
   done-parent, empty-Stub-list, and the Decision 4 edge cases.
7. Once the mechanic is picked, write it into wiki §1/§6 as "as built" (the
   provisional prose there now is a placeholder for this story, not a
   ruling), update `drag-1`/`drag-4` test plans from "pending triage" to
   real automated/manual cases, and record the actual decisions taken in
   this file's "As built" section.

---

## Risks / things to watch

- **Every decision above interacts with the others.** Trying them in
  isolation (as the build order suggests) risks a false negative — e.g.
  Decision 1's snap-back might only feel right once Decision 3's ghost
  treatment softens it. Budget for revisiting an earlier "no" after a later
  piece lands, the way Story 3 revisited its popping model twice.
- **Existing Story 3 E2E suites must stay green throughout.** Card regions
  are new territory, but nothing about in-context reorder or column-band
  drops should change meaning — if a Decision-1 build makes an existing
  cross-column suite flaky, that's a sign the collision policy leaked into
  a case it shouldn't have touched.
- **The tuning panel will need new values** (whatever Decision 4 settles
  on) — same convention as every other threshold in this epic: a panel
  value, not a literal, from the moment it's introduced.

---

## As built

**The framing of "should a hovered Card visually move aside" turned out to
be the wrong question — resolved by a rule change, not a pick among (a)/(b)/(c).**
Working the story surfaced that Story 3's model (any region's band decides
on release, regardless of whether the drag ever left its own context)
breaks down once a Card is *also* a region: every column's bands and every
card's attach-slot would be armed simultaneously, all the time. The fix
is wiki §1.1's strict three-layer stack (Board → Column/sub-row → Card,
never more than one away from the locked layer) plus its rule 1, **a
release always commits the locked layer's own within-action**. That rule
answers Decision 1 by dissolving it: there is no "undecided, might attach"
visual state to design for. Hovering a sibling Card while still merely
*locked in the column* is ordinary in-context reorder — dnd-kit's sortable
shift still reads as "insert here," exactly as it always has, because nothing
about the layer has changed yet. Only once the sustained
`cardPopInDelayMs` hold actually completes does the layer become the Card,
and from that instant the within-action is hardcoded to append-last — so
`over` no longer matters for it at all (`resolveBoardCollisions`'s comment:
"a Card context is never actually resolved this way ... restricting
candidates here is still what keeps dnd-kit from shifting a sibling against
a hover rule 1 ignores"). What makes the transition legible is entirely the
*ghost* (below), not any neighbor-shift or snap-back.

**Decision 2 (stable rect while hovered) — resolved: subtract dnd-kit's own
live sortable transform, applied uniformly to every region, not just
Cards.** `dragRegions.ts::layoutRect` reads `getComputedStyle(el).transform`
and backs it out before treating the element as a region rect. Columns and
sub-rows never carry this transform (only sortable list items do), so it's
a no-op for them — safe to apply everywhere rather than branching on region
kind. The frozen-entry-rect mechanism Story 3 already built for band
stability (`PopHover.rect`) needed no second freeze mechanism for Cards; it
generalized to `followRegionTop` for a different reason (a sibling's
carve-out reflow), covered in Story 3's own addendum above.

**Decision 3 (ghost migration) — resolved as (a), single ghost, migrates
between lists** — exactly like an existing cross-column workphase move,
extended to parent membership: `Placement` gained an optional `parentId`
(`itemListOps.ts`), and once a card's placement carries one,
`renderedIsStub`/`renderedParentId` pull it out of its origin column's
selector (`selectBoardItems` filters on `!renderedIsStub`) and into the
target's `getAttachedChildrenFrom` at its slot — the origin list's gap just
closes, the same as any other cross-column move already did. No double
ghost was needed. `computeChildCounts` and `freeItemOrder`/the inversion
tripwire are placement-aware for the same reason a done item already
excludes itself from ordinal comparison: a card previewing attachment is
about to stop being comparable to anything positionally, exactly like a
done item. The rendered stand-in inside the target Card
(`KanbanCard.tsx::AttachGhostRow`) is a plain visual placeholder with no
`useSortable`/`useDroppable` registration of its own — reusing the real
`AttachedChildRow` for this row risked the collision closure reading a
*real* Card as an `attached-child` mid-drag (decision recorded inline as
"decision 3" in that file's own comments).

**Decision 4, both sub-questions — resolved:**
- **The lingering-reorder trap** — resolved via a separate, longer,
  duration-only threshold (`cardPopInDelayMs`, default 800ms vs.
  `popInDelayMs`'s 500ms), not via band-gating. `popSession.ts::hoverForCard`
  has no band concept at all for a Card hover, just presence and duration —
  simpler than the `stubPopBandStart`/`stubPopBandEnd` gating the plan
  doc's option considered, and those tuning fields were removed as dead
  (wiki §3.1's footnote).
- **Column edge-band reachability** — resolved structurally, matching
  neither of the two readings the plan doc offered exactly: Card regions
  are **never Board-layer hit-test candidates at all**
  (`dragRegions.ts::nonCardRegionAt` explicitly excludes anything with
  `attachToCardId` set); a Card is reachable only by first being locked
  into the column/sub-row that contains it, then zooming in one layer
  further. So a column's own top/bottom bands are always reachable at
  Board layer regardless of what's drawn there — not because a Card
  "only captures the middle 60%," but because Board-layer band resolution
  never considers Card geometry in the first place.

**Scope actually shipped:** wiki §6, narrowed exactly as planned — a Card
is a full context (§1.1) once zoomed into, but its within-action is the
constant "append as the last Stub," never a band or anchor among the
target's existing children. §7.2's three-way placement and dragging an
already-attached Stub are still Story 5/6's, untouched.

**Not built:** nothing from this story's own scope. The drop-back-to-
full-height animation on the visual-collapse treatment (Story 3's addendum
above) is a shared open item, not specific to attach.
