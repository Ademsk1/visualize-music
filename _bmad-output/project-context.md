---
project_name: "visualize-music"
user_name: "Adam"
date: "2026-04-28"
sections_completed: ["discovery_initialized", "technology_stack_versions", "language_rules", "framework_rules", "testing_rules", "code_quality_style"]
existing_patterns_found: 0
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Runtime**: Node **>=20** (`package.json` engines)
- **Build**: Vite **^8.0.10** (`npm run dev|build|preview`)
- **Language**: TypeScript **~6.0.2**
- **UI**: React **^19.2.5**
- **3D**: Three.js **^0.184.0**
- **Lint**: ESLint **^10.2.1** (flat config) + `typescript-eslint` **^8.58.2** + `eslint-plugin-react-hooks` **^7.1.1** + `eslint-plugin-react-refresh` **^0.5.2**
- **Tests**: Vitest **^3.2.4** (Node environment, `src/**/*.test.ts`)
- **CI**: GitHub Actions runs `npm ci`, `lint`, `test`, `build` (Node 22)
- **Deploy**: GitHub Pages workflow builds `dist/` and copies `index.html` → `404.html` for SPA fallback; Vite base path controlled by `BASE_PATH`

Compatibility notes:
- Microphone input requires a secure context: **localhost** or **HTTPS** (LAN `host: true` still needs HTTPS when not localhost).

## Critical Implementation Rules

### Architecture boundaries (do not violate)

- **Keep the seam**: `src/audio/*` produces a typed frame (`src/types/featureFrame.ts`) consumed by `src/scene/*`.
- **Do not drive WebGL through React renders**: Three.js updates happen in the render loop via an imperative controller (`SceneController.applyViz(...)` pattern). Avoid React state updates at rAF frequency.
- **No backend / no uploads by default**: The core demo is client-only. Do not add servers, auth, or audio upload paths without an explicit product change.

### Language-specific rules (TypeScript)

- Repo is **ESM** (`"type": "module"`). Keep imports/exports ESM-compatible.
- TypeScript is configured for **bundler mode**:
  - `moduleResolution: "bundler"`
  - `verbatimModuleSyntax: true` (don’t rely on TS rewriting import syntax)
  - `allowImportingTsExtensions: true` (explicit `.ts` / `.tsx` imports are allowed and used)
- Prefer `import type { ... }` for type-only imports (keeps runtime imports clean under verbatim module syntax).
- Keep code warning-free: `noUnusedLocals` and `noUnusedParameters` are enabled (avoid unused vars/args).
- Target is `es2023` (avoid adding polyfill assumptions).

### Framework-specific rules (React + Three.js)

- Keep Three.js isolated:
  - `SceneController` is loaded via dynamic import (`import('./scene/SceneController')`) to keep Three in its own async chunk.
  - Don’t change this to a static import unless there’s a deliberate reason.
- Render loop rule:
  - React must **not** re-render at animation rate.
  - Use the rAF loop to call `SceneController.applyViz(frame, graphSnap, { live })` and `SceneController.render()`.
- Lifecycle:
  - Always `dispose()` the scene on unmount and handle WebGL context loss via `onContextLost`.
  - Always cancel rAF on teardown.
- Reduced motion:
  - Respect `prefers-reduced-motion` end-to-end (features + scene).
- Accessibility baseline:
  - Keep the “stage” focusable and labeled; preserve the skip-link + `aria-label` pattern.

### Testing rules (Vitest)

- Test runner: Vitest (`npm run test`).
- Test discovery is currently only: `src/**/*.test.ts` (Node environment).
  - If you add React component tests (`*.test.tsx`), update `vitest.config.ts` include pattern accordingly.
- Preferred test style (match repo):
  - `import { describe, it, expect } from 'vitest'`
  - Keep tests small and deterministic; focus on pure logic modules (audio/features, graph state, ui copy mapping).

### Code quality & style rules

- ESLint uses **flat config** in `eslint.config.js` (don’t add `.eslintrc`-style config unless intentionally migrating).
- Keep repo structure consistent:
  - `src/audio/*` (Web Audio + feature extraction)
  - `src/types/*` (shared contracts like `FeatureFrame`)
  - `src/scene/*` (Three.js)
  - `src/ui/*` (React UI + copy)
  - `src/bootstrap/*` (session state)
  - `src/graph/*` (note graph model/state)
- Enforce clear boundaries:
  - `audio/*` should not import from `scene/*`.
  - High-frequency updates happen in the rAF loop / scene controller, not via React state.
- Prefer centralized user-facing strings in `src/ui/copy.ts` (keep tone consistent; avoid scattered literals for UX-critical errors).

### Three.js / rendering constraints

- **Performance guardrails are intentional**:
  - DPR is capped (`MAX_DEVICE_PIXEL_RATIO` in `SceneController`).
  - Renderer uses `antialias: false` and `alpha: false`.
  - Vite build chunk warning limit is raised because Three is large; don’t “fix” by bundling everything into one file.
- **Reduced motion matters**:
  - The scene checks `prefers-reduced-motion` and should keep motion damped when enabled.
  - Avoid high-frequency jittery effects that read like noise.

### Background + motion intent (UX)

- The product look is **black / near-black stage** with **punchy colour** for meaningful signals.
- Prefer **pristine, bounded motion**. If a parameter is reacting to audio noise, gate or smooth it, or make it static if it’s background/chrome.

### Audio feature extraction conventions

- Use `FeatureFrame` as the stable handoff shape (`{ level, tonalHint, t }`).
- `readFeatureFrame(...)` already applies smoothing and reduced-motion behavior; avoid layering additional unrelated smoothing in the scene unless necessary.
- When implementing new visual behaviors from audio, prefer **meaningful event triggers** (e.g. note events) over raw noise-responsive continuous modulation for background/chrome.

### Tooling / repo rules

- **Tests**: Add unit tests as `*.test.ts` under `src/` (Vitest include pattern is `src/**/*.test.ts`).
- **Lint**: ESLint is configured via `eslint.config.js` (flat config). Keep changes compatible with that setup.
- **Build / deploy**: Respect `BASE_PATH` handling in `vite.config.ts` for non-root hosting.

