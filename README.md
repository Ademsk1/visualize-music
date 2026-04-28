

https://github.com/user-attachments/assets/36d3cf53-18b7-40f7-8919-d466fadab094


# visualize-music

Browser **microphone** → **Web Audio** analysis → **Three.js** stage — portfolio piece (see `_bmad-output/planning-artifacts/prd.md`).

## Quickstart

### Local dev

```bash
npm install
npm run dev
```

Open the printed URL.

### Local build + preview

```bash
npm run build
npm run preview
```

### Docker (dev)

```bash
docker compose up --build
```

Then open `http://localhost:5173`.

### Docker (production preview)

```bash
docker build --target preview -t visualize-music:preview .
docker run --rm -p 4173:4173 visualize-music:preview
```

Then open `http://localhost:4173`.

## Microphone + secure context note

Most browsers require a **secure context** for microphone access:

- `https://...` (recommended for real deployments)
- `http://localhost` (allowed for local dev)

If mic permission is denied or unavailable, the HUD shows a recoverable blocked state and you can retry.

## Scripts

- `npm run dev` — Vite dev server (needs **HTTPS** or **localhost** for mic in later milestones)
- `npm run build` — production bundle to `dist/`
- `npm run preview` — serve `dist/` locally
- `npm run lint` — ESLint
- `npm run test` — Vitest (unit tests)
- `npm run coverage` — Vitest coverage report with enforced thresholds

## Deploying (e.g. GitHub Pages)

The app is a static SPA. Set a **Vite [base](https://vite.dev/config/shared-options.html#base)** when the site is not served at the domain root, for example:

```bash
BASE_PATH=/visualize-music/ npm run build
```

Upload the `dist/` output to your host, or use **Settings → Pages → GitHub Actions** and the workflow in `.github/workflows/pages.yml` (it sets `BASE_PATH` automatically: **`/`** for a `username.github.io` repository, otherwise **`/repo-name/`** for project pages). A **`404.html`** copy of `index.html` is added for static hosts that support it. Remove that workflow if you do not use GitHub Pages. Paths for `favicon`, manifest, and static assets in HTML are **relative** so they work under a subpath.

## Stack

Vite, React, TypeScript, Three.js. Layout follows `_bmad-output/planning-artifacts/architecture.md` (`src/audio`, `src/scene`, `src/ui`, `src/bootstrap`, `src/types`).

A minimal **web app manifest** is in `public/manifest.webmanifest` (install / home-screen metadata; not a full offline PWA). **`vercel.json`** and **`public/_headers`** add basic security response headers for **Vercel** and **Netlify**; GitHub Pages ignores them.

## Scope and non-goals (MVP)

- **Melody-first**: optimized for single-voice / monophonic input; does not promise robust polyphonic note separation.
- **Local-first audio**: core processing runs in-browser; no default audio upload.
- **Not notation**: does not output sheet music / grading / “accuracy” scoring as an MVP feature.

## Memory (why the tab can look “huge”)

Chrome’s **Task Manager** / Activity Monitor often shows **tens to low hundreds of MB** for a single tab that runs **WebGL (Three.js)** + **React** + **JIT’d JS**. A large share is the **GPU process** and **graphics buffers** (worse on **retina** with a high **devicePixelRatio**). This project **caps DPR** (see `src/scene/SceneController.ts`), **disables MSAA** on the renderer, and uses **tree-shakeable** Three imports. **Dev** (`npm run dev`, especially with **React StrictMode**) can use more than a **production** build (`npm run build` + `npm run preview`).

## Planning artifacts

PRD, UX spec, and architecture live under `_bmad-output/planning-artifacts/`.
