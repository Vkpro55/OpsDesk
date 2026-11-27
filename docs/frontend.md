# Frontend conventions

Read before any change in `client/`. Agreed 2026-11-27.

## Source of truth for design
- Designs: https://claude.ai/artifact/7AqWfrb27FowQU18bvuJqi (pages: Auth, Staff app, Customer portal, System states, Shared parts).
- Follow the design over ticket wording (e.g. primary is indigo `#4F46E5`, not black).
- Font: Inter 400/500/600 (Google Fonts link in `index.html`).

## Design system (`client/src/index.css`)
- Tailwind v4 `@theme`. Default palette is disabled (`--color-*: initial`): only semantic tokens exist, so `bg-indigo-600` won't compile. Need a new color → add a token.
- Colors are exact design hexes (Tailwind v4's own palette differs from the design).
- Tokens: `primary`, `primary-hover`, `primary-soft`, `on-primary`, `fg`, `fg-muted`, `fg-subtle`, `fg-disabled`, `border`, `border-strong`, `border-input`, `surface`, `canvas`, `danger`, `danger-fg`, badge tones `info|progress|neutral|ok|warn|bad` as `-bg`/`-fg`.
- Custom type: `text-label` (13/18), `text-overline` (11/16). Shadow: `shadow-card`.
- Spacing, radius, other text sizes: Tailwind defaults (they already match the design). Don't redefine.
- Focus ring is global in `@layer base`. Don't add per-component focus styles.

## Code rules
- Pure React. No UI/form/class libraries (no shadcn, react-hook-form, clsx). `react-router-dom` is allowed. Dev-only: `vitest`.
- Repeated class strings belong in a component, not in tokens.
- Layers:
  - `lib/` pure functions (`api.ts` fetch wrapper → `ApiError`; `formErrors.ts` error → form state; `cn.ts`).
  - `features/<name>/` logic: actions `(FormData) → Promise<state>`, hooks, context. No JSX styling.
  - `components/ui/` presentational primitives (Button, Input, Card, FormError). Props in, markup out, no fetching.
  - `components/` shared composites (AuthLayout).
  - `pages/` thin: wire a feature hook to UI.
- Forms: React 19 `useActionState` + `<form action>`, uncontrolled inputs read via `FormData`. Native validation attributes (`required`, `type="email"`, `minLength`). Echo submitted values (never passwords) back as `defaultValue`, because React resets forms after an action.
- Disable the submit button while `pending`.
- Errors: API `{ error: { code, message, details } }`. Field errors from zod `details[].path[0]`, plus code→field map in `formErrors.ts` (e.g. `EMAIL_TAKEN`→email). Anything else → `<FormError>`.
- Accessibility: every input has a label, `aria-invalid` + `aria-describedby` on error, `role="alert"` on form errors, inputs at 16px font (no iOS zoom), touch targets ≥40px.
- Add only components/variants the current screen uses. No Storybook, no generic Form abstraction.
- Not built yet → hide it (no dead buttons): Google sign-in, forgot password.
- Tests: vitest on pure logic (`lib/`, `features/*/actions`), stub `fetch`. No render tests unless asked.
- Dev API: Vite proxies `/api` → `http://localhost:4000` (same origin, so the refresh cookie works).
