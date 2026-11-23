# Bot Setup Prototype

A standalone Next.js 16 (App Router, React 19, TypeScript) prototype of a guided, 6-step bot setup that
replaces the accordion form in the inFlow Management Portal. It uses the portal's look: Roboto, coral
`#f05742`, 8px fields, 12px cards, uppercase 11px labels, light and dark mode.

Nothing here talks to a backend. Agents, storage and the language and timezone lists are sample data.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build && npm start   # production build
npm run typecheck            # tsc --noEmit
npm test                     # vitest + React Testing Library (5 flow tests)
```

## What to try

Use the "Prototype controls" bar at the top of the page.

- **Add new bot:** linear flow. Next validates the current step. Leave fields empty to see inline errors.
- **Edit existing bot:** every step is open, Bot ID and client are locked, and an "Unsaved changes" marker appears.
- **Structure plan:** maps each current accordion to its new step.

## Layout

```
app/                 layout, page, globals.css (design tokens and all styles)
components/
  BotWizard.tsx      state, navigation, validation visibility, header/footer
  Rail.tsx           Skills-style sidebar: step navigation, bot summary, progress
  PlanView.tsx       structure plan tab
  steps/Step*.tsx    one file per step (Basics, Chat, AI, Live, Plan, Review)
  ui.tsx, ctx.tsx    small form primitives and the wizard context
lib/
  validate.ts        validation rules, ported 1:1 from bot-configuration-form.ts
  constants.ts       steps, sample options, checklist rules
  types.ts, helpers.ts, sample.ts
__tests__/           component tests for the add and edit flows
```

## Porting to the portal

- `lib/validate.ts` mirrors `getBotValidationSchema` rule for rule. In the portal, keep the yup schema and
  `react-hook-form`, and map each step to its field paths for `trigger([...paths])` on Next.
- The step panels in `components/steps` hold the layout and wording. Swap the plain inputs for your MUI
  `TextField` / `Select` using `FIELD_SX` and `FIELD_LABEL_SX`.
- `app/globals.css` holds the tokens (`--coral`, `--line`, and so on) that match `app/theme.ts`.
