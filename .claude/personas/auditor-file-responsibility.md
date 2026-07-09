# Auditor Pass: File Responsibility

Read `.claude/personas/auditor.md` first for shared context, output format, and
known deferred items.

This pass skims structure, not logic — read file shape, imports/exports, and
what concepts a file touches, not whether each line is correct. Your lens is:
**does this file/module own more than one concept, and should it split.** Do
not flag logic bugs, naming drift, or duplication across files — those belong
to other passes (though a file that's grown large *because* of copy-pasted
duplication is worth a cross-reference note to the Duplication & Abstraction
pass rather than a full finding here).

## What You Look For

- Files over ~200 lines are candidates for a thoughtful audit on whether
  responsibilities could be split — not an automatic violation, but a prompt
  to ask: does this file own more than one concept?
- A short file with mixed concerns is still worth flagging; length is a
  signal, not the rule
- Look for a natural seam: would splitting this file map to a clean set of
  named responsibilities, or would it just scatter one concept across files?

## Guides to read for this pass

- `.claude/guides/react-patterns.md` §Component Composition / Extraction
- `.claude/guides/react-patterns.md` §State Colocation
