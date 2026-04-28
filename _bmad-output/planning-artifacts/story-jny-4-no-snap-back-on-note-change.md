---
title: "Story JNY-4: No snap-back on note change (trajectory continuity)"
status: "draft"
created: "2026-04-28"
updated: "2026-04-28"
owner: "Adam"
epic: "Journey Through Space (Trajectory + Note Nodes)"
---

## Context

The current experience can feel like it jumps back to a previous note anchor when notes change. The journey metaphor requires the opposite: forward progress is the anchor, and notes add events without re-centering the world.

## User story

**As a** player, **I want** note changes to add nodes without re-centering the journey around the last note **so that** I never feel snapped backward.

## Scope

- Ensure the “focus” of motion/camera/world remains the journey progression, not the last spawned note node.
- Any camera/scene adjustments must preserve forward direction and be smoothly eased.

## Acceptance criteria

- **AC1 — No re-centering**: A new note does not move the journey origin/focus back toward the previous note position.
- **AC2 — Continuous forward motion**: The scene continues advancing forward while notes occur.
- **AC3 — Smooth transitions**: Any framing adjustments use smoothing (no teleport, no flicker).
- **AC4 — Works with fast note changes**: Rapid note sequences do not cause oscillation or back-and-forth movement.

## Non-goals

- Camera choreography beyond preserving the journey illusion.
- Curved paths/turns.

## Test plan

- Play alternating notes quickly: confirm the journey continues forward with no back-and-forth snapping.
- Play a short phrase, pause, then play again: forward travel resumes naturally; prior nodes remain as past markers.

