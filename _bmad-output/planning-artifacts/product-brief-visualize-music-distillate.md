---
title: "Product Brief Distillate: visualize-music"
type: llm-distillate
source: "product-brief-visualize-music.md"
created: "2026-04-27"
purpose: "Token-efficient context for downstream PRD creation"
---

## Stated intent (user)

- **Stack:** Vite SPA; **Three.js** for 3D; **microphone** input in the browser.
- **Visual language:** **Colourful**; **colours reflect tone** (tonal / pitch / register—exact mapping TBD in design).
- **Dynamics:** **Loud → visually big / assertive**; **quiet → small / subtle** so level feels **musically appropriate**, not decorrelated from performance.
- **Piano** is the **framing** (piano notes / piano-first UX); not positioned as a tutor or score product.
- **Primary goal:** **Portfolio piece**—demonstrate **taste + real-time graphics + audio** in one link.
- **Product win (explicit):** **Mood-led, beautiful visuals** over **strict note accuracy** or **notation fidelity**.
- **MVP scope signal:** **Melody-first**; user accepted **chords / dense polyphony** as **stretch** or **best-effort**, not a v1 guarantee.

## Rejected or deferred (do not re-propose without user)

- **Strict “correct note” / tuner app** positioning as the headline—**deferred** in favour of **aesthetic** promise.
- **Score output, education, grading** as core—**out** for v1.
- **Guaranteed** polyphonic **separation**—**out** for v1; may improve later.

## Requirements hints (captured in conversation)

- **First-run / trust:** **Mic permission** and **AudioContext** must be handled with **clear CTA** and **user gesture** to resume context (browser reality).
- **Local-first story:** **No server audio upload** assumed unless product changes—**privacy** is a **sensible default** message for portfolio trust.
- **Reference environment for “it works”:** **Desktop Chrome** used as **explicit test target** in success criteria (cross-browser can be stretch).
- **README / case study:** Success for author includes **credible narrative** for code review and hiring—PRD can include **light deliverable** (README section, one hero asset) if desired.

## Technical context (research + stack)

- **Web Audio API:** `getUserMedia` → `MediaStream` → `AudioContext` graph; **AnalyserNode** for time/frequency data; **AudioWorklet** is common for **low-latency** or custom analysis in modern examples.
- **Pitch / note identity:** Real-time **pitch** in JS often uses **autocorrelation, YIN, or FFT-based** methods; **octave errors** and **harmonic confusion** are **known** issues—aligns with **mood-first** not **tuner-grade** brief.
- **Amplitude / envelope:** Feeds **dynamics** → **scale, opacity, or presence** in Three.js (uniforms, instancing, or geometry params).
- **Three.js patterns:** **ShaderMaterial** / **GLSL** for high particle counts; **instanced meshes**; optional **GSAP** for **non-audio** camera/UI motion (common in tutorials, not a requirement in brief).
- **Competitive texture:** Many demos are **spectrum/beat**-driven; **differentiation** is **tone + level** mapped to a **cohesive art direction**, not only **band energy**.

## User & audience (condensed)

- **Primary “users” of the product experience:** **Portfolio evaluators** (recruiters, hiring managers, dev peers)—**one short session** must **read** as **finished** and **intentional**.
- **Builder:** Wants **clear scope** and **pride in shipping** without **overclaiming** pitch tech.

## Open questions (not resolved in brief)

- **Exact** mapping: **HSV** vs **palette table** vs **per-register** bands for “tone → colour.”
- **Polyphony (stretch):** **Blur**, **sum into one blob**, or **limited voice count** when time allows.
- **Mobile Safari / iOS:** **Explicitly** out of v1 polish unless user prioritises—**audio** constraints differ.
- **Optional one-liner in UI:** “Audio stays on your device” — user was offered as **optional** positioning line; **not** locked in brief body.

## Scope summary

| In v1 | Out v1 | Stretch |
|------|--------|---------|
| Vite, mic, Web Audio, Three.js, mood-first visuals, melody-optimised | Perfect polyphony, mobile-first, MIDI/recording/social, teaching claims | Chord handling, style presets, export still/loop for README, broader browsers |

## Downstream handoff (PRD)

- Use this distillate to **decompose** into: **audio analysis** requirements (threshold: **good enough** for **colour/motion**, not **musicxml**), **3D/art direction** requirements, **first-run UX**, **non-goals**, and **success checks** (qualitative + **demo script** for portfolio).
