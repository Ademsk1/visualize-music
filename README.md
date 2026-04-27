# visualize-music

Browser **microphone** → **Web Audio** analysis → **Three.js** stage — portfolio piece (see `_bmad-output/planning-artifacts/prd.md`).

## Scripts

- `npm run dev` — Vite dev server (needs **HTTPS** or **localhost** for mic in later milestones)
- `npm run build` — production bundle to `dist/`
- `npm run preview` — serve `dist/` locally
- `npm run lint` — ESLint
- `npm run test` — Vitest (unit tests)

## Deploying (e.g. GitHub Pages)

The app is a static SPA. Set a **Vite [base](https://vite.dev/config/shared-options.html#base)** when the site is not served at the domain root, for example:

```bash
BASE_PATH=/visualize-music/ npm run build
```

Upload the `dist/` output to your host, or use **Settings → Pages → GitHub Actions** and the workflow in `.github/workflows/pages.yml` (it sets `BASE_PATH` automatically: **`/`** for a `username.github.io` repository, otherwise **`/repo-name/`** for project pages). A **`404.html`** copy of `index.html` is added for static hosts that support it. Remove that workflow if you do not use GitHub Pages. Paths for `favicon`, manifest, and static assets in HTML are **relative** so they work under a subpath.

## Stack

Vite, React, TypeScript, Three.js. Layout follows `_bmad-output/planning-artifacts/architecture.md` (`src/audio`, `src/scene`, `src/ui`, `src/bootstrap`, `src/types`).

A minimal **web app manifest** is in `public/manifest.webmanifest` (install / home-screen metadata; not a full offline PWA). **`vercel.json`** and **`public/_headers`** add basic security response headers for **Vercel** and **Netlify**; GitHub Pages ignores them.

## Memory (why the tab can look “huge”)

Chrome’s **Task Manager** / Activity Monitor often shows **tens to low hundreds of MB** for a single tab that runs **WebGL (Three.js)** + **React** + **JIT’d JS**. A large share is the **GPU process** and **graphics buffers** (worse on **retina** with a high **devicePixelRatio**). This project **caps DPR** (see `src/scene/SceneController.ts`), **disables MSAA** on the renderer, and uses **tree-shakeable** Three imports. **Dev** (`npm run dev`, especially with **React StrictMode**) can use more than a **production** build (`npm run build` + `npm run preview`).

## Planning artifacts

PRD, UX spec, and architecture live under `_bmad-output/planning-artifacts/`.
