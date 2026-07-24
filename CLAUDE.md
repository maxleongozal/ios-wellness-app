# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server (Next.js)
npm run build    # production build
npm run lint     # ESLint (eslint-config-next)
npm test         # vitest (unit tests for the engine layer: gamification, safety)
```

Verify changes with `npm test`, `npm run build` (type-checks), and by exercising the prototype in the browser.

## What this is

**SaneFit** — a French-language iOS wellness-app prototype (nutrition + workout coaching) rendered inside a simulated iPhone frame on a desktop page. Next.js 16 App Router + React 19 + Tailwind CSS 4, but effectively a single-route, fully client-side app: there is no backend, no API routes, no database. All state lives in React state and `localStorage`.

All UI copy and most code comments are in **French** — keep new copy and comments in French.

## Architecture

Single route: `src/app/page.tsx` (client component) orchestrates everything. Screen switching is plain React state (`ScreenId` in `src/types/index.ts`) driven by `BottomNav` — no router navigation. Screens live in `src/components/screens/`.

### Data flow (the core invariant)

Everything derives from `UserConfig`, built once at onboarding:

```
OnboardingFlow (src/components/onboarding/onboarding-flow.tsx)
  → OnboardingAnswers
  → buildUserConfig()            (src/lib/user-config.ts)
  → UserConfig persisted to localStorage ("sanefit.userConfig")
  → page.tsx loads it on mount (hydration-guarded via `hydrated` state)
  → deriveProfile() + computeMetabolics()
  → screens render from the derived UserProfile — never from raw data
```

The UI reads the derived profile, not arbitrary numbers. Calories, macros, and hydration targets all come out of the metabolic engine; don't hardcode targets in components.

### Engine layer (`src/lib/`)

- **`safety/`** — guardrails module. **All safety thresholds live in `safety/config.ts` and only there**, each annotated `[SOURCÉ]` (CDC, ISSN, NIH, OMS, ACSM…) or `[HEURISTIQUE]` — never hardcode a threshold elsewhere, and never present a heuristic as sourced. `goal-guard.ts` validates weight goals (pace as % of body weight, hard BMI-18.5 floor, no deficit under 18) and returns Dr. Sane interventions with a one-tap proposal; `behavior-watch.ts` detects risky patterns (no rest days, intake drop, repeated goal tightening) — interventions explain physiology, never block, never guilt-trip.
- **`gamification/`** — XP/badges/levels module. Core invariant (see the charter atop `gamification/rules.ts`): **behaviors are rewarded, never body outcomes** — no points for weight lost, deficits, fasting, or workout duration; a rest day earns as much as a workout; nothing accumulated is ever lost. Rules are declarative in `rules.ts`; `DailyActivity` (its only input) deliberately has no body-metric fields.
- **`metabolic-engine.ts`** — Mifflin-St Jeor BMR, activity factors, objective-based deficit/surplus, protein/fat per kg. Enforces the floors from `safety/config.ts`: target calories never below max(BMR, absolute floor); restrictive-diet history softens the deficit; no deficit for minors.
- **`health-guardian.ts`** — daily Dashboard warnings (creatine, undereating, fiber, hydration). Re-exports its thresholds from `safety/config.ts`.
- **`doctor-engine.ts`** — Dr. Sane's dialogue engine: picks one message (severity `info | warning | danger`) from `UserConfig` + the day's `DailyIntake`. It deliberately **reuses health-guardian thresholds so the doctor and the warning banners never contradict each other** — never duplicate a threshold as a literal.
- **`user-config.ts`** — personalization engine: builds/validates/persists `UserConfig`, physiological bounds (clamps), per-objective workout plans and accent colors, `deriveProfile()`. `loadUserConfig()` returns `null` for configs from older schema versions, forcing re-onboarding — extend that check when adding required `UserConfig` fields.
- **`supplements.ts`** — supplement catalog. Supplements are opt-in per item: only `config.acceptedSupplements` may appear anywhere in the UI, and no engine may mention a supplement the user didn't accept.
- **`data.ts`** — mock data for the prototype (meals, `dailyTracking`, seed exercises).

### Dr. Sane

`src/components/doctor-avatar.tsx` is the single reusable component for the doctor (SVG avatar, speech bubble tinted by severity, optional text-to-speech, one-time disclaimer via localStorage key `sanefit_doctor_disclaimer_seen`). His tone: caring, direct, factual — no empty compliments, never guilt-tripping a missed day; setbacks are reframed at the week scale.

### Product principles baked into the code

- Safety overrides preference: dangerous goals are corrected in `buildUserConfig` even if the onboarding flow let them through (defense in depth).
- The onboarding answers shape the UI itself (`uiTheme.accentColor`, `visibleModules`) — e.g. the supplement-tracking module only exists if at least one supplement was accepted.
