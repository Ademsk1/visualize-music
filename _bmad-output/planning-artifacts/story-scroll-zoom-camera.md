---
title: "Story: Scroll to zoom camera (in/out)"
status: "draft"
created: "2026-04-28"
updated: "2026-04-28"
owner: "Adam"
---

## Context / problem

While exploring the 3D visualization (journey mode and any graph mode), the user cannot currently adjust camera distance. This makes it hard to frame the wire/nodes and limits exploration.

## User story

**As a** player/viewer, **I want** to scroll to zoom the camera in/out **so that** I can frame the journey wire and spawned nodes at a comfortable distance.

## Acceptance criteria

- **AC1 — Scroll zoom works on stage**: Using mouse wheel / trackpad scroll over the visualization adjusts camera distance smoothly.
- **AC2 — Bounded zoom**: Zoom is clamped to reasonable min/max so the user can’t zoom through/behind the scene.
- **AC3 — Smooth**: Zoom is eased (no jerky jumps), and feels stable on continuous trackpad input.
- **AC4 — Doesn’t require React re-render loop**: Zoom is handled in the Three.js controller (imperative), not via per-frame React state updates.
- **AC5 — Reduced motion**: When `prefers-reduced-motion` is enabled, zoom remains usable and stable.

## Non-goals

- Touch pinch zoom (can be a follow-up story).
- Exposing a UI slider (optional later).

## Test plan

- Run `npm run dev`, hover the stage and scroll: camera moves in/out.
- Ensure page doesn’t “steal” scroll while over stage (wheel should dolly the camera).
- Run `npm test` and `npm run lint`.

