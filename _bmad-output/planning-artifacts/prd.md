---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
releaseMode: phased
prdStatus: complete
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-visualize-music.md
  - _bmad-output/planning-artifacts/product-brief-visualize-music-distillate.md
documentCounts:
  briefCount: 2
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
workflowType: prd
---

# Product Requirements Document - visualize-music

**Author:** Adam  
**Date:** 2026-04-27

## Executive Summary

**visualize-music** is a greenfield single-page web app (Vite, browser-only) built for a **portfolio** context: a visitor opens a link, grants **microphone** access, and plays **piano**-forward material that is rendered as a **vivid, mood-led 3D** scene. It is **not** a notation app, **tuner**, or teaching product. The headline is **beauty and emotional read**: **colour** tracks **tonal character** (e.g. pitch or register in a designed palette); **dynamics** drive **size and salience** in the scene (louder reads larger and more assertive, quieter reads smaller and subtler).

**Who it is for:** people **evaluating the work** (hiring, clients, peers) in a **short session**—and you as **author**, who need a **credible, maintainable** scope. The problem being solved is the **portfolio noise floor**: most audio demos look generic. This product aims to show **taste**, **real-time** integration (Web Audio + WebGL), and a **clear point of view**, without overclaiming **ground-truth** pitch. **MVP is melody-first;** chords and dense polyphony are **out of the v1 promise** (they may look messy; that is an honest trade-off).

**Why it exists:** Ship a **cohesive, intentional** browser experience with a **low-friction first run** (mic permission, **AudioContext** lifecycle) and a demo that lands in **under a minute**, not a feature checklist.

### What makes this special

- **Mood- and art-first:** maps **musical** dimensions to **art direction** (tone → colour, level → presence), not only frequency bands or beat sync.
- **Scope honesty:** the win is **aesthetic** read; **strict note ID** and **clean polyphony** are not the v1 bar—**melody-first** is a deliberate product choice.
- **Local-first trust:** processing stays in the browser; no **uploaded audio** by default unless explicitly added later.

## Project classification

| Dimension | Value |
|------------|--------|
| Project type | Web app (SPA, Vite; real-time mic + 3D in browser) |
| Domain | General (creative / developer portfolio; not a regulated vertical) |
| Domain complexity | Low (no sector compliance; still needs solid UX, security hygiene, performance) |
| Project context | Greenfield (driven by the product brief; no separate product doc library in `docs/`) |

## Success criteria

### User success

- A new visitor grasps the hook in **10–20 seconds** and can **start** via a clear primary action.
- With **melodic** material, the scene reads as **mood-led**: colour tracks tonal character; loud/soft tracks visual scale or presence, not random noise.
- The product reads as a **designed audiovisual** piece, not a tuner, notation app, or lesson.

### Business success

- Credible in **portfolio** settings (interview, code review, link share): stack and scope are defensible without overclaiming pitch accuracy.
- README or short case copy can state what it is and is not in a few sentences.

### Technical success

- On a **reference desktop** environment (e.g. current Chrome), the app **starts** after a **user gesture**; **mic** and **AudioContext** behaviour are predictable; the **Three.js** path stays smooth under typical **melodic** use.
- Default: audio is processed **locally**; no server upload unless explicitly added later.

### Measurable outcomes

- **Demo script:** open → start → short **melodic** phrase → a viewer can **say in one sentence** how colour and size relate to playing.
- **Spot check:** no sustained stutter on a normal laptop during a 1–2 minute tryout on the reference browser.

## Product scope

### MVP - Minimum Viable Product

- Vite application shell with deployable build output.
- Microphone input; Web Audio graph with analysis sufficient for **mood-led** mapping (not score-level truth).
- Three.js scene: tone → colour (designed mapping), dynamics → scale / salience; tuned for **melody-first** use.
- Piano-leaning framing (name, copy, optional layout metaphor); first-run UX for permission and **AudioContext** resume.
- **Out of v1:** guaranteed polyphonic note separation, mobile-first polish, MIDI / recording / social as core, tutor or grading claims.

### Growth features (post-MVP)

- Improved chord / polyphony handling (or intentional blended harmony look); visual presets; export of still or short loop for README hero; broader browser support and performance tuning.

### Vision (future)

- Evergreen portfolio anchor; optional small related audio–visual experiments. Core identity: generous visuals, browser-native craft, honest scope.

## User journeys

### 1. Sam — peer / hiring (primary, happy path)

Sam has about one minute. They want taste and execution, not a long README. They open the page, see a clear CTA, start, grant the mic, and hear short melodic playing. Colour and scale feel intentional and musical, not random. They think: this has a point of view—not a generic visualiser. They may open the repo or discuss it in an interview. This journey requires an obvious first run, fast time-to-wonder, and positioning that is not “tuner” or “notation product.”

### 2. Sam — edge (mic blocked or audio not starting)

Same person, but mic is denied, input is wrong, or **AudioContext** stays suspended. They need plain copy (what failed, what to do) and a retry without a hard refresh hunt. They recover in roughly half a minute or leave without thinking the app is broken—**clarity** over blame. This journey requires blocked-mic and error states, a path to resume audio with user gesture, and browser-accurate copy.

### 3. You — author / maintainer (ship and tell the story)

You deploy (e.g. static host) and prepare a short live or recorded walkthrough. Build is straightforward; no secret backend is required for the core demo. You rehearse a melodic line that shows mood and dynamics without leaning on dense chords. The story matches the code: mood-first, melody-first, no overclaim on pitch or polyphony. README documents install/run, a short what-it-is / what-it-isn’t, and known limits (polyphony, browser).

### 4. River — developer (clone the repo)

River clones to learn or to compare your Web Audio / Three.js approach. README covers install and run; structure makes mic → analysis → render traceable. They run locally in minutes. This journey needs solid dev onboarding and a clear split between **audio** processing and **visual** expression in the codebase.

There is no separate admin or support product; failure recovery and documentation cover the usual “help” need.

### Journey requirements summary

| Area | Needs |
|------|--------|
| Onboarding | Single primary CTA; permission and AudioContext handling; blocked-mic / error and retry |
| Core experience | Real-time mic → features → 3D scene; mood mapping; melody-first behaviour |
| Trust | Local processing by default; no surprise server audio in v1 |
| Portfolio / dev | README: run, scope, limits; reproducible demo; legible boundaries in code |

## Innovation and novel patterns

**Interaction:** a browser experience where live **piano**-forward input (mic) drives a cohesive 3D look—colour for tonal character, scale/salience for dynamics—with **mood-first** legibility instead of spectrum- or beat-only demos.

**Positioning** is part of the innovation: honest **melody-first** MVP and no tuner/notation **headline**.

**Market context:** many visualisers default to frequency bands and particles; fewer combine piano-leaning framing, intentional musical mapping, and portfolio-grade first-run UX in one small story.

**Validation:** qualitative—portfolio and peer feedback, a one-minute demo script, README clarity. Technical: smooth render and usable mic path on the reference browser; no claim of ground-truth note identity as the bar for “success.”

**Risks:** pitch and polyphony limits are stated in copy; fall back to level and broad pitch region for aesthetics, not score accuracy. **WebAssembly** is optional later if analysis outgrows the main thread; MVP does not depend on it.

## Web app specific requirements

### Project-type overview

Single-page application (Vite). Core loop: **microphone** → Web Audio analysis → **requestAnimationFrame**-driven 3D render. No in-product native or CLI surface in v1 (dev scripts only).

### Technical architecture considerations

- **Client-only MVP:** static deploy; no required server for core behaviour.
- **Audio graph:** getUserMedia → AudioContext (unlocked with user gesture) → analysis (implementation may use an AudioWorklet; not mandated here).
- **Render path:** 3D scene state driven from analysis output each frame (e.g. uniforms, instancing).

### Browser matrix

| Tier | Target | Intent |
|------|--------|--------|
| Reference | Current desktop Chrome | Primary dev and demo (matches success criteria) |
| Stretch | Recent Firefox, Safari, Edge | Best-effort; not MVP-blocking |

### Responsive design

MVP is **desktop-oriented**; mobile-first polish is out of v1. Narrow viewports should still show a usable primary CTA and controls (no hidden-broken layout).

### Performance targets

- **Visual:** target smooth motion at display refresh on a typical laptop; reduce visual cost (particles, shaders) before abandoning interactivity.
- **Coupling:** audio-to-visual should feel **immediate** in review (not multi-second lag).

### SEO strategy

Sensible page title and meta description (and Open Graph if the host supports it) for link previews. Content SEO and ranking strategy are out of scope.

### Accessibility level

Visible controls for start/enable; keyboard access to the primary path where reasonable. Do not use colour alone for status (mic denied, context suspended). `prefers-reduced-motion` support is desirable if cheap; not a v1 hard gate.

### Implementation considerations

HTTPS in production (or localhost for dev) for microphone access. Explicit UX for permission denial and suspended AudioContext (see journeys). In-product native features and CLI are out of scope for the shipping experience per project-type skip list; developer CLI stays in the repo.

## Project scoping and phased development

**MVP strategy:** experience MVP with a portfolio signal—the smallest release that still reads as a **finished** mood-led live **audio → 3D** experience on the **reference** desktop browser, not a test harness. Typical team: small front-end focus; browser audio + real-time graphics; **no** required backend for the MVP core.

**Phase 1 (MVP)** — aligns with [MVP - Minimum Viable Product](#mvp---minimum-viable-product): deployable app shell, live mic + processing for mood-led visuals, real-time 3D with tone→colour and dynamics→scale/salience, piano-leaning framing, and first-run/error handling for permission and **AudioContext**. Explicitly out: guaranteed polyphonic separation, notation/grading as the product, mobile-first polish, MIDI/file upload/recording/social as **core**, tuner-grade claims.

**Post-MVP:** Phase 2 (growth) — better chord/polyphony or intentional harmony aesthetic, presets, export for README, wider browser/perf hardening. Phase 3 (vision) — evergreen showcase; optional related experiments; same identity.

**Risks:** technical uncertainty around pitch/polyphony—mitigate with positioning, melody-first tuning, and mood-led visual fallbacks. Portfolio validation via short demo rehearsal and peer feedback; keep README scope legible. If time shrinks, drop peripheral polish (link preview tuning, reduced-motion) before dropping the core mic→visual loop or first-run clarity.

## Functional requirements

*Testable capabilities; implementation-agnostic.*

### Session and onboarding

- **FR1:** A visitor can begin the experience from a single, obvious primary action.
- **FR2:** A visitor can see enough context to understand that microphone access may be requested before choosing to continue.
- **FR3:** A visitor can grant or deny microphone access through standard browser permission flows.
- **FR4:** A visitor can retry or recover after microphone access is blocked or unavailable, without a dead end where the platform allows recovery.
- **FR5:** A visitor can activate or resume audio processing when the environment requires a user gesture to start or unlock audio.

### Live audio and signal

- **FR6:** The application can ingest live audio from the permitted input path while the session is active.
- **FR7:** The application can derive time-varying features from live audio sufficient to drive mood-based visuals (including a measure of overall level and broad tonal character).
- **FR8:** The default optimised use case is single-voice or melodic material; the product does not guarantee clean multi-note separation in the default release.

### Visual expression

- **FR9:** A visitor can see a real-time visual scene that updates as they play or as sound is captured.
- **FR10:** A visitor can perceive that colour choices track tonal or register character of the performance (per the product’s mapping).
- **FR11:** A visitor can perceive that visual scale or prominence tracks loudness or dynamics of the performance.
- **FR12:** A visitor can recognise a piano-oriented framing of the experience (e.g. naming and light explanatory copy).

### Trust, safety, and transparency

- **FR13:** A visitor can understand, in the default configuration, that core audio processing for the demo does not depend on uploading recordings to a remote server.
- **FR14:** A visitor can see clear state when the experience cannot run because of permission or audio context constraints.

### Link and discovery (light)

- **FR15:** A shared URL can surface a sensible title and short summary in typical link-preview contexts where the hosting environment supports it.

### Access and interaction quality

- **FR16:** A visitor can complete the primary start path using keyboard-focusable controls where applicable to the platform.
- **FR17:** A visitor can distinguish error or blocked states without relying solely on colour coding.

### Optional enhancement

- **FR18:** A visitor who prefers reduced motion can receive a less aggressive motion treatment when the product implements that support.

### Maintainer and distribution

- **FR19:** A maintainer can run the application locally for development and demonstration.
- **FR20:** A maintainer can produce a build suitable for static or client-only hosting without a required application server for the core behavior.
- **FR21:** A reader can find documentation to install, run, and understand scope, goals, and documented non-goals.

### Stated product boundaries (MVP scope as capabilities)

- **FR22:** A visitor can use the core experience without creating an account.
- **FR23:** The default product does not present notation output or grading of performances as core capability in the MVP scope described in this PRD.

## Non-functional requirements

Only quality attributes that apply. **Scalability** (viral or multi-tenant load) and **backend integration** are not in scope for the default release.

### Performance

- **NFR-P1 (Responsiveness):** On the reference desktop environment (see *Web app specific requirements*), audio-driven visual updates must keep up with live input: qualitative review must not find multi-second lag between audible change and visible change.
- **NFR-P2 (Sustained use):** During a 1–2 minute tryout on a typical laptop, the experience must not fall into chronic stutter that makes the demo unusable (brief dips are acceptable).
- **NFR-P3 (Frame cadence):** Visual output should target smooth motion at display refresh on the reference hardware tier; the product may reduce visual cost before removing interactivity entirely.

### Security and privacy

- **NFR-S1 (Transport):** Production is served over HTTPS (or an equivalent secure context required for microphone access in browsers).
- **NFR-S2 (Default data handling):** The default configuration does not transmit captured audio to remote servers for core processing. Any future opt-in upload or telemetry is out of MVP unless covered by separate consent and requirements.

### Accessibility

- **NFR-A1 (Primary path):** The primary start / enable-audio path is operable with keyboard-focusable controls where the platform allows (aligns with FR16).
- **NFR-A2 (Sensory):** Critical status and error states do not rely on colour alone (aligns with FR17).
- **NFR-A3 (Reduced motion, optional):** If reduced motion is implemented (FR18), it should substantially reduce intense or strobing motion while preserving some feedback unless the user prefers a minimal treatment.
