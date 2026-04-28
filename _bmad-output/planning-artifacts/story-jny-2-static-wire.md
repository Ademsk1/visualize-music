---
title: "Story JNY-2: Render the static wire through time"
status: "draft"
created: "2026-04-28"
updated: "2026-04-28"
owner: "Adam"
epic: "Journey Through Space (Trajectory + Note Nodes)"
---

## Context

The journey needs a stable anchor that communicates direction and time. The **wire** is that anchor: it must remain steady and aligned with the travel axis, even when notes change.

## User story

**As a** viewer, **I want** a stable wire aligned with travel direction **so that** the motion reads as intentional and I understand the forward journey.

## Scope

- Render a persistent wire/line aligned with the journey travel axis.
- Wire remains visible across note events.

## Acceptance criteria

- **AC1 — Persistent**: The wire exists continuously (not spawned per note).
- **AC2 — Axis-aligned**: Wire direction is aligned with the travel axis from JNY-1.
- **AC3 — Visually stable**: Wire does not jitter with audio noise or note changes.
- **AC4 — Legible on black**: Wire is visible against the black/near-black stage without dominating the scene.

## Non-goals

- Fancy effects (glow, pulses) unless they remain stable and do not react to noise.
- Any turning/curving path.

## Test plan

- Idle with ambient noise: wire should remain stable and not flicker.
- Play a sequence of notes: wire stays aligned and continuous; no reinitialization.

