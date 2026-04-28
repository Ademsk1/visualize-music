---
title: "Story: Accessibility — Static black background (reduce noise responsiveness)"
status: "draft"
created: "2026-04-28"
updated: "2026-04-28"
owner: "Adam"
---

## Context / problem

The background currently reacts to slight audio noise, creating constant motion/flicker. This is fatiguing and undermines accessibility and the UX goal of **pristine motion** on a **black stage**.

## User story

**As a** player/viewer, **I want** the background to remain a static black colour **so that** small noise does not constantly move the scene and the visuals feel calm and intentional.

## Acceptance criteria

- **AC1 — Static background**: The clear/background colour is constant black (or a single near-black constant if required) and does not vary with audio features.
- **AC2 — No noise flicker**: With no intentional playing (ambient room noise), background colour remains unchanged.
- **AC3 — Preserves core visuals**: Note nodes and other foreground visuals still render normally against the black background.
- **AC4 — Configurable (optional)**: Background colour is defined in one place (constant/token) so it can be tuned without hunting.

## Non-goals

- Removing all motion from the scene (foreground can remain reactive).
- Changing the overall art direction beyond background stability.

## Notes

- This is explicitly about the **background** only; reactive elements should remain tied to meaningful musical events, not constant noise.

