// The projects the user has collapsed in the sidebar's tree. Every other project is open, one created
// after the sidebar loaded included, and a reload opens every project: nothing is stored. A collapsed
// project opens by `expand` alone, whichever write puts a project under it: a drop
// (`useProjectDragReorder.ts`), a create or a parent change (`App.tsx`). The state lives in `App.tsx`, since
// two of those writes are its own.

import { useState } from 'react';

const NONE: ReadonlySet<string> = new Set();

export function useCollapsedProjects() {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(NONE);

  // The chevron: a collapsed project opens, an open one collapses.
  function toggle(id: string) {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  // Opens a project that a write put a project under. Opening wins over a collapse set by hand, and an
  // open project is left as it is.
  function expand(id: string) {
    setCollapsedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return { collapsedIds, toggle, expand };
}
