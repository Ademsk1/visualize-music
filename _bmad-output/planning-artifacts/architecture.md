---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-visualize-music.md
  - _bmad-output/planning-artifacts/product-brief-visualize-music-distillate.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: architecture
lastStep: 8
status: complete
completedAt: 2026-04-27
project_name: visualize-music
user_name: Adam
date: 2026-04-27
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project context analysis

### Requirements overview

**Functional requirements (architectural read):**

- **Onboarding & session (FR1–FR5):** One obvious primary action, mic permission, **AudioContext** unlock via user gesture, and **retry** when the platform allows—implies a **client-side** state model (e.g. idle → permission → running / error) with **no** server session.
- **Live audio & signal (FR6–FR8):** `getUserMedia` → an analysis path; **melody-first**; **no** clean polyphony guarantee—features can be **level + broad tonal** character, not score truth.
- **Visual expression (FR9–FR12):** Real-time **WebGL** (**Three.js**), **tone → colour**, **dynamics → scale/presence**, **piano** framing in copy/UX.
- **Trust & transparency (FR13–FR14):** **Local-by-default** messaging; **visible** states when permission or **AudioContext** blocks the demo.
- **Access & quality (FR16–FR18):** Keyboard on the primary path; **no** colour-only status; optional **`prefers-reduced-motion`**.
- **Distribution (FR19–FR21):** **Vite**-style dev/build, **static** deploy, **README** so **River** can trace **mic → analysis → render**.
- **Boundaries (FR22–FR23):** **No** account for core; **no** notation/grading as the MVP headline.

**Non-functional (architectural drivers):**

- **NFR-P1–P3:** Low perceived audio→visual lag; no chronic stutter in short tryouts; rAF-driven render with room to cut visual cost before dropping interactivity.
- **NFR-S1–S2:** HTTPS in production; no default remote upload of captured audio.
- **NFR-A1–A3:** Keyboard and focus on start; non–colour-only cues for critical state; reduced motion if implemented (FR18).

**Scale and complexity**

- **Primary domain:** Browser **client-only** SPA (PRD: **Vite**), **Web Audio** + **WebGL** (**Three.js**), static hosting.  
- **Product complexity:** **low** (one surface, no backend for core). **Engineering depth:** **medium** (real-time analysis, rAF, browser mic/context edge cases).

**Working architectural slices (not decisions yet):** audio feature extraction, mapping to visual parameters, render loop, chrome (HUD), bootstrap and error handling, build/deploy.

### Technical constraints and dependencies

- **Browser:** Mic and **AudioContext** need a **secure context** (HTTPS or localhost for dev). Reference: current **Chrome** on desktop; other browsers are stretch (PRD browser matrix). No MVP offline requirement for the core demo.  
- **Stack (PRD / briefs):** Vite app shell; Web Audio (optional **AudioWorklet**); **Three.js**; **WASM** only post-MVP if analysis outgrows the main thread.  
- **Regulation:** None stated (general / portfolio; not a regulated vertical).

### Cross-cutting concerns

- **Performance:** Shared main-thread (and optional worklet) budget for analysis and **rAF** for **Three.js**; keep frame work predictable on a reference laptop (NFR, UX).  
- **Accessibility (chrome):** HUD, errors, focus (WCAG-oriented per UX/FRs); the stage is expressive but not the only place for blocker state.  
- **Traceability (River):** Clear seams: **mic → feature vector → scene state**.  
- **First-run reliability:** Permission and suspended **AudioContext** are first-class product behaviour, not edge cases.  
- **Project context file:** None was present at workflow start; preferences are driven by the PRD, UX spec, and this document.

## Starter template evaluation

### Primary technology domain

**Web client-only SPA** — Vite, TypeScript, Web Audio, Three.js, static deploy (PRD, [Project context analysis](#project-context-analysis)).

### Starter options considered

| Option | Fit | Trade-off |
|--------|-----|------------|
| **Official `create-vite` + `react-ts`** | Matches UX: utility CSS (Tailwind) and a small componentized HUD; optional Radix later. | Adds React vs **vanilla**. |
| **Official `create-vite` + `vanilla-ts`** | Minimum dependencies. | More manual work for the same HUD/a11y patterns. |
| **Full-stack starters (e.g. T3)** | — | **Out** for MVP: no required app server in the PRD. |

### Selected starter: `create-vite` with **`react-ts`**

**Rationale:** PRD names **Vite**; UX names **bottom HUD**, **Tailwind**-class chrome, and **optional** **headless** primitives **if** using **React**. **TypeScript** end-to-end is appropriate for a traceable `mic → features → scene` seam ([Cross-cutting concerns](#cross-cutting-concerns)).

**Scaffold (from repo parent, or use `.` in an empty folder):**

```bash
npm create vite@latest visualize-music -- --template react-ts
cd visualize-music
npm install
npm install three
npm install -D @types/three
```

**Node:** `create-vite` currently documents **Node 20.19+** or **22.12+** ([create-vite on npm](https://www.npmjs.com/package/create-vite), checked 2026-04-27). **Re-run** the official **Tailwind + Vite** install steps from the current [Tailwind docs](https://tailwindcss.com/docs/installation) when you add the HUD (versions change often—do not pin here).

**Architectural decisions the starter bakes in**

- **Build:** Vite, ESM, `npm`/`pnpm`-compatible scripts.  
- **UI runtime:** **React** + **TypeScript** + **@vitejs/plugin-react**.  
- **Not included:** **Tailwind**, **ESLint/Prettier**, **Vitest**—add deliberately in implementation order.

**First implementation task:** run the scaffold (or `npm create vite@latest . -- --template react-ts` in an **empty** tree), verify `npm run dev` / `npm run build`, then land **Web Audio** + **Three** integration per this document.

## Core architectural decisions

### Decision priority analysis

**Critical (must be clear before implementation diverges)**

- **Client-only core:** No application server required for the live demo (PRD, NFR-S2).  
- **Audio path:** `getUserMedia` → `AudioContext` → feature extraction (AnalyserNode and/or a **single** optional **AudioWorklet**—avoid two competing graphs).  
- **Render path:** One animation driver (e.g. `requestAnimationFrame`) feeding the latest feature vector into the Three.js scene (NFR-P1).  
- **Trust:** Default build does not transmit mic audio to a remote server for core processing (NFR-S2).

**Important (shape the codebase)**

- **Chrome:** React + Tailwind for the bottom HUD (UX). **Stage:** Three.js in its own module; do **not** re-render React on every animation frame for the 3D view—update the scene from a stable loop.  
- **State:** Start with React state and custom hooks; add a small global store (e.g. Zustand) only if cross-cutting state becomes painful. **No** Redux for MVP.  
- **Hosting:** Static `dist/` behind **HTTPS** (NFR-S1).

**Deferred**

- Heavier **WASM** or worklet-based analysis if the main thread is saturated (PRD risk).  
- **Export / presets** (growth).  
- **Telemetry** or any server call would need new product requirements and consent.

### Data architecture

- **No** server-side database in MVP. Session and analysis state stay **in memory** in the browser. **No** user accounts (FR22).

### Authentication and security

- **No** in-app authentication for the core experience (FR22).  
- **Production:** HTTPS (NFR-S1). **No** secrets in the client bundle. **CSP** / host headers as optional hardening later.

### API and communication patterns

- **No** first-party HTTP API for core behaviour (PRD). **No** required third-party API for MVP.

### Frontend architecture

- **Suggested layout:** `src/audio/` (graph, feature extraction), `src/scene/` or `src/render/` (Three.js), `src/ui/` (HUD), `src/bootstrap/` (permission, **AudioContext** lifecycle).  
- **Contract:** A stable, documented boundary from **feature vector → visual parameters** (types or clear interfaces) for the [River](prd.md#4-river--developer-clone-the-repo) journey.  
- **State:** React hooks + context as needed; the render loop should not depend on high-frequency React state updates.  
- **Routing:** None for MVP (single view). Phase 2 help/legal: route or modal per UX.  
- **Styling:** Tailwind for chrome (UX).

### Infrastructure and deployment

- **Build:** `npm run build` → static `dist/`.  
- **Host:** Any static host with HTTPS (e.g. Vercel, Netlify, Cloudflare Pages, GitHub Pages)—ops preference, not a product lock.  
- **CI:** Recommended—lint + build on pull requests (tooling TBD when ESLint/Prettier are added).

### Decision impact analysis

**Suggested implementation order:** (1) scaffold + Tailwind, (2) **AudioContext** + mic + error states, (3) feature vector + rAF loop, (4) Three.js scene + mapping, (5) a11y + `prefers-reduced-motion` where cheap.

**Dependencies:** Rendering depends on a timely feature stream; the HUD depends on the same session state machine as the audio graph (FR1–FR5).

## Implementation patterns and consistency rules

### Pattern categories defined

**Conflict risks without rules:** folder layout, TypeScript/React naming, how React coexists with Three.js, where user-facing error copy lives, and test file placement once Vitest exists.

### Naming patterns

- **Database / HTTP API:** N/A for MVP (no persisted server model, no first-party API surface).
- **TypeScript / React:** **PascalCase** for React components (`App.tsx`, `HudBar.tsx`). **camelCase** for functions, variables, and hooks (`useAudioSession`, `getFeatureFrame`). **UPPER_SNAKE** only for module-level constants. **File names** match the primary export (e.g. `SceneHost.tsx`).
- **Directories:** Short **lowercase** top-level segments under `src/` (`audio`, `scene`, `ui`, `bootstrap`, `types`)—avoid mixing `kebab-case` and `camelCase` at the same level.

### Structure patterns

- **Source layout (target):** `src/audio/` (Web Audio graph, feature extraction), `src/scene/` (Three.js bootstrap, frame loop, materials), `src/ui/` (bottom HUD, copy modules), `src/bootstrap/` (mic permission, **AudioContext** lifecycle, session enum), `src/types/` (or `featureFrame.ts`) for shared feature/visual contracts. `public/` for static assets (favicons, OG image if any).
- **Tests:** When Vitest is added, colocate `*.test.ts` / `*.test.tsx` next to the unit under test.

### Format patterns

- **TypeScript:** **camelCase** for object properties in shared types.  
- **Feature handoff:** One documented **feature frame** type (fields for level, tonal or pitch-region hints, etc.) per tick—list fields in a single `types` module; do not ad-hoc new shapes at the scene layer.

### Communication patterns

- **React ↔ Three.js:** Hold a ref or small controller class for the WebGL layer; call imperative `applyFeatures(frame)` (or similar) from inside `requestAnimationFrame`. **Do not** pass high-frequency props from React into the canvas each frame.  
- **Session state** (idle / live / blocked): Drives the HUD; the audio module exposes subscribe or hooks—keep naming aligned with the PRD “state ladder” in the UX spec.
- **Custom DOM events:** Avoid; prefer hooks/context. If unavoidable, use a single module or a `visualize-music:`-style namespacing convention.

### Process patterns

- **User-facing copy:** Centralize strings for mic denied, **AudioContext** suspended, and retry in one place (e.g. `src/ui/copy.ts`) so portfolio tone stays consistent (UX).  
- **Errors:** In development, `console.error` with context is fine; **never** show stack traces in the UI.

### Enforcement guidelines

- Respect the **feature → scene** boundary in [Core architectural decisions](#core-architectural-decisions).  
- Keep Three.js scene updates on the rAF path, not in React’s commit phase at display refresh.  
- When ESLint/Prettier land, add them to CI and treat lint failures like build failures.

### Pattern examples and anti-patterns

**Good:** A `useAudioSession` hook returns `{ state, start, retry }`; a `SceneController` exposes `start(container: HTMLElement)` and `applyFrame(f: FeatureFrame)`.

**Anti-patterns:** Two separate **AudioContext** instances; driving materials from unthrottled `setState` every frame; introducing a server or database without a PRD change.

## Project structure and boundaries

### Complete project directory structure (target)

After `create-vite` and Tailwind, the app should resemble:

```text
visualize-music/
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── .env.example
├── public/
│   ├── favicon.ico
│   └── (optional) og image for link previews
├── .github/
│   └── workflows/
│       └── ci.yml
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── assets/
    ├── types/
    │   └── featureFrame.ts
    ├── bootstrap/
    │   ├── sessionState.ts
    │   └── useAudioSession.ts
    ├── audio/
    │   ├── graph.ts
    │   ├── features.ts
    │   └── (optional) worklets/
    ├── scene/
    │   ├── SceneController.ts
    │   ├── createRenderer.ts
    │   └── materials/
    └── ui/
        ├── HudBar.tsx
        ├── copy.ts
        └── (optional) modals/
```

*Filenames can evolve; keep the **audio / scene / ui / bootstrap** seams stable.*

### Architectural boundaries

- **API:** None in MVP. No required third-party APIs.  
- **Layers:** `ui/*` is React. `scene/*` is Three.js only. `audio/*` does not import from `scene/`. `bootstrap/` owns ordering: permission → **AudioContext** → wiring audio + scene.  
- **Data:** In-memory only; **FeatureFrame** (or equivalent) is the single structured handoff from `audio/` to `scene/`.

### Requirements to structure mapping

| PRD area | Location |
|----------|----------|
| Session & onboarding (FR1–FR5) | `src/bootstrap/`, `src/ui/HudBar.tsx`, `src/ui/copy.ts` |
| Live audio & features (FR6–FR8) | `src/audio/` |
| Visual expression (FR9–FR12) | `src/scene/` + `src/types/` |
| Trust & errors (FR13–FR14) | `src/ui/`, `src/bootstrap/` |
| Access & quality (FR16–FR18) | `src/ui/` |
| Maintainer (FR19–FR21) | `README.md`, `package.json` scripts |

### Integration points

- **Data flow:** Mic stream → `audio/graph` → feature object → `SceneController.applyFrame` in the rAF path. Session state → HUD at low frequency only.  
- **External:** Static host with HTTPS; optional meta in `index.html` (FR15).

### Development and deployment

- **Dev:** `npm run dev` (Vite HMR for UI).  
- **Build:** `npm run build` → `dist/` for static hosting.

## Architecture validation results

### Coherence validation

- **Stack fit:** Vite + React + TypeScript supports the Tailwind HUD and session state; Three.js stays in `scene/` behind an imperative `applyFrame`-style API, matching [Implementation patterns and consistency rules](#implementation-patterns-and-consistency-rules). Client-only deployment matches the PRD; no conflicting server or database assumptions. Optional global store (e.g. Zustand) remains optional.
- **Patterns vs structure:** Naming and folder layout match the [target tree](#complete-project-directory-structure-target). The main integration contract is **audio feature object → scene** (see [Architectural boundaries](#architectural-boundaries)).
- **UX/PRD alignment:** Bottom HUD, black stage, and error handling are assignable to `ui/` + `bootstrap/` without new platform components.

### Requirements coverage

- **Functional (FR1–FR23):** Session, audio, visuals, trust, access, link preview, and maintainer paths are mapped in [Requirements to structure mapping](#requirements-to-structure-mapping). FR8 (polyphony) is a product/analytics honesty concern, not a separate backend.
- **Non-functional:** Performance (rAF, cost reduction), HTTPS, local-by-default audio, keyboard path, non–colour-only status, and optional reduced motion are addressed in [Core architectural decisions](#core-architectural-decisions) and the UX spec inputs.

### Implementation readiness

- **Documented:** Critical paths, boundaries, patterns, and a concrete directory target. **Pin** dependency versions in `package.json` at scaffold time (not duplicated here).
- **Gaps (non-blocking):** ESLint/Prettier/Vitest to add in the first implementation slice; exact **FeatureFrame** fields once analysis code is chosen; CSP/security headers at the host when hardening.

### Gap analysis

- **Critical gaps for MVP:** None identified.
- **Minor / later:** Instrumentation/telemetry, server-side features, and DB would require PRD changes first.

### Readiness assessment

- **Status:** Ready for implementation with this document as the technical source of truth alongside the PRD and UX specification.  
- **Confidence:** High for a bounded client-only portfolio scope; remaining risk is tuning analysis and visuals, not undefined platform work.

### AI agent implementation guidelines

- Follow this document, the PRD, and the UX spec when they conflict with ad-hoc ideas.  
- Do not add a backend, database, or upload path without an explicit product change.  
- Preserve the **audio → feature → scene** seam and session state machine (FR1–FR5).  
- First build step: run the scaffold in [Selected starter: `create-vite` with **`react-ts`**](#selected-starter-create-vite-with-react-ts), add Tailwind, then implement in the order listed under [Decision impact analysis](#decision-impact-analysis).

---

_**Architecture workflow complete (step 8).**_
