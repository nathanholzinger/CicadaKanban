# Tailwind CSS Best Practices — Audit Checklist

Reference for auditing `.tsx`/`.css` files in this project (Tailwind v4, CSS-first config).

---

## 1. Centralize Design Tokens

**v4 pattern:** `@theme {}` block in `index.css`, not `tailwind.config.js`.

- [ ] Arbitrary font sizes (`text-[10px]`, `text-[9px]`) → named `@theme` token (`text-micro`, `text-2xs`)
- [ ] Arbitrary colors/spacing that recur more than once → `@theme` token
- [ ] One-off arbitrary values (`w-[420px]`, `min-h-[72px]`) are fine to leave if they don't repeat
- [ ] Hex codes or raw values hardcoded in class strings → move to token

**This project's tokens** (`client/src/index.css`):
```css
@theme {
  --text-2xs: 0.5625rem;  /* 9px  */
  --text-micro: 0.625rem; /* 10px */
}
```

---

## 2. Extract Patterns into Components / Constants

**v4 pattern:** Exported string constants (like `pillUtils.ts`), not `@apply`.

- [ ] Same class string used in 2+ places → extract to a named constant
- [ ] Constants live in a co-located `*Utils.ts` file alongside the components that use them
- [ ] Component-level JSX repetition → extract a sub-component

**This project's constants** (`components/item-detail/pillUtils.ts`):
`SECTION_LABEL`, `INPUT_BASE`, `SELECT_BASE`, `BTN_PRIMARY`, `BTN_CANCEL`, `BTN_ADD_TRIGGER`, `EMPTY_STATE`, `PILL`, `MINI`, and variants.

---

## 3. Use `@apply` Sparingly

- [ ] No `@apply` for patterns that should be a React component or JS constant
- [ ] `@apply` only acceptable for truly global base styles (e.g. resetting `<a>` tags)
- [ ] If `@apply` exists, ask: could this be a component or constant instead?

---

## 4. Consistent Class Ordering

**Order:** Layout → Positioning → Box Model → Typography → Visual → Interactivity

- [ ] `prettier-plugin-tailwindcss` installed and `.prettierrc` configured
- [ ] Run `npx prettier --write` on changed files after editing
- [ ] Spot-check: display/flex/grid before padding/margin before text- before bg- before hover:/focus:

**This project:** `client/.prettierrc` + `prettier-plugin-tailwindcss` already installed.

---

## 5. Accessibility

- [ ] Icon-only `<button>` has `aria-label`
- [ ] Non-interactive elements made interactive (`<div onClick>`, `<span onClick>`) get `role="button"` + `tabIndex={0}` + `onKeyDown` handler for Enter/Space
- [ ] `<h1>`–`<h6>` are not used as buttons — wrap clickable headings in a `<button>` or add the above
- [ ] `focus:outline-none` is paired with a `focus-visible:` replacement (ring or underline), never used alone
- [ ] `<input>` and `<select>` in forms have an associated `<label>` or `aria-label`
- [ ] `<select>` with only icon content: add `aria-label`

---

## 6. Container Queries (where relevant)

- [ ] Components that should respond to their container (not the viewport) use `@container` + `@sm:` / `@lg:` prefixes
- [ ] Viewport breakpoints (`sm:`, `lg:`) reserved for layout-level changes

---

## 7. Theme / Dark Mode

- [ ] Design tokens defined as CSS custom properties on `:root`
- [ ] Both light and dark themes covered (`@media (prefers-color-scheme: dark)` + `[data-theme="dark"]` override)
- [ ] Semantic color (error red, success green) separate from the accent hue

---

## 8. PurgeCSS / Content Paths

**v4 note:** Handled automatically by `@tailwindcss/vite` — no `content` array needed.

- [ ] No dynamic class string construction (`'bg-' + color`) — Tailwind can't detect these; use a lookup map instead
- [ ] Safelist any classes that are truly dynamic

---

## Quick Smell Test

| Smell | Fix |
|---|---|
| Same 5+ classes in 3+ places | Named constant or component |
| `text-[Npx]` anywhere | `@theme` token if it recurs |
| `<div onClick>` with no `role` | Add `role="button"` + keyboard handler |
| `focus:outline-none` alone | Add `focus-visible:` ring/underline |
| Icon button with no label | Add `aria-label` |
| Classes in random order | Run prettier |
