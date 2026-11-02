# UI Message Banners

**Type:** tech-debt story · **Written:** 2026-11-02 by the Coder, from Nathan's ask · **Ready for:** grooming · **Sequenced:** after Epic 3.5 Story 8.4, whose cue is its first case

## Goal

Make one pattern of presenting UI messages as a banner, so an error, a warning or a piece of information reaches the user the same way wherever it comes from. It will probably grow into a set of kinds (Errors, Warnings, Informational, and so on). This is a stub: nothing is planned or decided yet.

What the app has today, as grooming input:
- Inline text lines inside the panel that caused them: `ColumnEditorModal.tsx` (red), `WorkphaseManagerPanel.tsx`'s notice (amber).
- A permanent strip in the page flow: the "Inherited from" line in `ProjectPage.tsx`.
- Failures that only reach `console.error`, with nothing shown.
- No global notice or toast. Story 8.4's cue for a drag the board stops is the first transient banner (`ForcedStopCue.tsx`), a fixed strip along the window's top edge.

## Inbound deferrals

- **From Story 8.4** (Nathan, 2026-11-02): the banner look was picked for the forced-stop cue, its styling "fine for now". Its look and placement are the first input to this pattern.

## Decisions

## Work, in batches

## Code map

## Acceptance

## Open questions

- **For Nathan, at grooming:** which messages move onto it (every inline error, or new ones only), and whether a kind carries a severity look, a lifetime, or both.

## Handoff

## Amendments
