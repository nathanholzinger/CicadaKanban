# React 19 Patterns — Audit Checklist

Reference for auditing `.tsx`/`.ts` client files in this project (React 19,
function components + hooks, no class components).

---

## Hooks Rules

- [ ] Hooks are only called at the top level — never inside conditionals, loops, or nested functions
- [ ] Hooks are only called from React function components or custom hooks — never from plain functions
- [ ] Custom hooks are named `useX` and only call other hooks from the top level
- [ ] `useEffect`/`useMemo`/`useCallback` dependency arrays list everything the callback closes over — no silently stale values from an incomplete array

---

## State Colocation

- [ ] State lives in the component that owns it, not lifted to a shared ancestor "just in case"
- [ ] Prop-drilling more than 2-3 levels for state that's only read by a deep descendant → consider context or colocating state closer to where it's used
- [ ] Derived state (computable from existing props/state) is computed inline or via `useMemo`, not duplicated into its own `useState`

---

## Memoization

- [ ] `useMemo`/`useCallback` used where there's a real, demonstrable cost — not applied blanket to every function/object
- [ ] Expensive computation inside the render body (traversals, filtering/sorting large lists, recursive lookups) that runs on every render, especially under frequent re-render triggers (polling, drag-and-drop), should be memoized
- [ ] Missing memoization is only a **Fix Now** if there's a demonstrated or clearly foreseeable perf cost (large data, frequent re-renders) — otherwise **Watch List**

**Worked example:** `client/src/App.tsx`'s `effectiveWorkflow` computation runs
as an IIFE inside the render function, recomputing an O(depth) ancestor
traversal on every render, including on the 15s notification poll. At current
scale (small project trees) this is imperceptible, so it was logged as
**Watch List**, not **Fix Now** — this is the calibration bar for this section.

---

## List Rendering

- [ ] `key` prop uses a stable, unique identifier (item id) — never array index for lists that can reorder, filter, or have items inserted/removed
- [ ] No `key` warnings suppressed or worked around instead of fixed

---

## Component Composition / Extraction

- [ ] A component mixing more than one concern (data fetching + presentation + local UI state for an unrelated sub-feature) is a split candidate
- [ ] Repeated JSX structure (same markup shape, different data) across sibling components → extract a shared sub-component
- [ ] Deeply nested conditional JSX (3+ levels of ternaries/`&&`) → extract named sub-components or early returns

---

## Hook Extraction

- [ ] The same combination of `useState`/`useEffect` (same shape, same purpose) appears in 2+ components → extract a custom hook
- [ ] A component's data-fetching + loading/error state management is duplicated elsewhere → extract a shared hook
