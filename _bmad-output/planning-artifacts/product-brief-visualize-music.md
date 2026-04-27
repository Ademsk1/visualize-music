---
title: "Product Brief: visualize-music"
status: "complete"
created: "2026-04-27"
updated: "2026-04-27"
inputs: []
---

# Product Brief: visualize-music

## Executive Summary

**visualize-music** is a browser-based portfolio piece: a **Vite** application that listens to live audio from the **microphone** and renders a **colourful, three-dimensional** scene with **Three.js**. The experience is tuned for **piano** playing, but the product promise is **aesthetic and emotional** first: **mood-led visuals** that feel alive with the music, not a notational or educational tool.

**Colour** encodes **tonal character** (e.g. pitch or register mapped to a vivid palette), while **loudness and presence** map to **scale and emphasis** in the scene—louder feels **bigger and more assertive**, quieter **smaller and more intimate**. The **primary win** is **beauty and atmosphere**; **note-level accuracy** is **supporting**, not the headline. The first release **assumes melody-first** playing: **single-line and simple phrases** should look great; **chords and dense polyphony** are **stretch**—they may be messy until a later iteration.

The audience is **people evaluating the work** (recruiters, clients, other developers) and **you as the author**, demonstrating **taste, real-time graphics, and audio integration** in a single memorable demo.

## The Problem

Strong developers still struggle to **signal craft** in a portfolio. **Static screenshots** underplay interactive and audio work; **generic “audio visualiser” demos** often look interchangeable—spectrum bars and particles with no **musical intention**. At the same time, building something that **feels musical** without claiming false precision is hard: overpromising “perfect pitch” invites disappointment; underdesigning the visuals reads as a tech test, not a piece.

**visualize-music** exists to show that you can **ship a cohesive, beautiful, technically credible experience** in the browser: **Web Audio + WebGL**, **low-friction first run** (mic permission, audio context), and a **clear point of view**—**mood and colour over clinical correctness**.

## The Solution

A **Vite** SPA that:

- Captures the **microphone** and runs analysis in the **Web Audio** graph.
- Renders a **Three.js** scene that updates in real time: **colour** driven by **tone** (timbre/position in the pitch space), **size and salience** driven by **dynamics** (envelope/level).
- Presents a **piano-first** mental model in the **look and feel** (copy, maybe layout metaphors), while optimising the **MVP** for **melodic** playing so the **visual story stays legible**.

The experience should feel **intentionally designed**—not a shader dump: readable motion, cohesive palette, and a **first few seconds** that make the hook obvious to a **portfolio visitor** who will not read a manual.

## What Makes This Different

- **Mood-first, not spectrum-default:** The goal is **expressive colour and presence** tied to **musical dimensions** (tone and level), not only **frequency bands** or **beat pulses**—a clearer **“why this exists”** than another reactive wallpaper.
- **Honest scope:** **Melody-first** is a **product choice**, not a failure mode—stated up front so **dense harmony** is **out of MVP** rather than silently broken.
- **Portfolio clarity:** The brief treats **first-run UX** (permission, **audio context resume** after user gesture) and **performance** as part of the **showcase**—reliability is a feature when someone opens the link **once** on a laptop.
- The **moat** is not a proprietary algorithm; it is **execution and taste**—a tight loop between **what you play** and **what you see**.

## Who This Serves

| Stakeholder | Need | Success for them |
|-------------|------|------------------|
| **Primary — portfolio evaluators** | Fast proof of **frontend + graphics + real-time** skill | A **one-minute** interaction that **looks and feels** finished; **works in the browser** without a convoluted setup. |
| **Author (you)** | A piece you are **proud to show** and **willing to maintain** | **Clear scope**, **credible** narrative in README/case study, and a demo that does not **overclaim** on pitch detection. |

**Secondary (optional):** other musicians or devs who discover the open project—valuable, but not required for v1 positioning.

## Success Criteria

| Signal | What “good” means |
|--------|---------------------|
| **Aesthetic** | The scene is **unmistakably colourful**; **tonal** mapping reads as **intentional**; **dynamics** read as **size or presence** without looking random. |
| **Portfolio** | A visitor **gets the idea in the first 10–20 seconds**; there is an **obvious** primary action to **start** listening. |
| **Reliability** | On a **current desktop Chrome** (reference environment), the demo **starts** after a **user gesture** and does not **stutter** in typical melodic use. |
| **Scope honesty** | **Single-note / melodic** material **looks best**; **chords** are not promised to **look clean** in v1. |
| **Technical** | **Vite** build, **Three.js** scene, **mic** path documented enough for a **code review** conversation. |

*No business metrics; “success” is **qualitative** plus a **tight, repeatable demo**.*

## Scope

**In (MVP / v1)**

- **Vite** app shell and deployment-friendly build.
- **Microphone** input, **Web Audio** pipeline, real-time feature extraction **sufficient** for **mood-led** visuals (not necessarily **score-level** note IDs).
- **Three.js** render: **colour** ↔ **tone**, **scale / emphasis** ↔ **dynamics**; **melody-first** tuning.
- **Piano-leaning** identity in **framing** (name, light UX copy, optional “virtual keyboard” feel—implementation open).
- **First-run** path: **clear CTA**, **sensible** handling of **mic permission** and **AudioContext** lifecycle.

**Explicitly out (v1)**

- **Guaranteed** polyphonic **note separation** or **notation output**.
- **Mobile-first** polish (unless time allows; treat as stretch).
- **Recording**, **MIDI file upload**, **social sharing**—**later** or separate projects.
- **Teaching / grading** or **tuner-grade** claims.

**Stretch (post-MVP if time)**

- **Better** behaviour for **chords and overlapping** notes; **separate** visual “voices” or blur **harmony** on purpose.
- **Presets** (e.g. “nocturne” vs “bright” palettes); **export** of a **still** or **short loop** for README hero media.

## Vision (2–3 years, lightweight)

This may remain an **evergreen portfolio anchor** with occasional **visual upgrades** and **refined pitch tracking**. It could also inspire a **family** of small audio-visual experiments (other instruments, recorded audio input), but **the core identity** stays: **generous visuals**, **honest scope**, **browser-native** craft.

## Assumptions & risks (on the table)

- **Pitch and piano** in the browser: **fast algorithms** can **error** (octave slips, harmonics). **Mood-first** positioning **mitigates**; **chasing perfect pitch** would **blow scope**—not the goal.
- **Polyphony:** **MVP** targets **melody**; **chords** may **visually clutter** or **bleed**—**accepted** for v1.
- **Trust:** **Mic** access must feel **earned** (brief copy, no **creepy** behaviour). **No server upload** in scope unless explicitly added—**local processing** by default is the **sensible story**.
