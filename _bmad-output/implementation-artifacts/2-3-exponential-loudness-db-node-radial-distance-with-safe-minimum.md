---
story_key: 2-3-exponential-loudness-db-node-radial-distance-with-safe-minimum
epic: "Epic 2: Stronger Musical Mapping (stable colour + exponential dynamics distance)"
story_id: "2.3"
title: "Exponential loudness (dB) → node radial distance with safe minimum"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 2.3: Exponential loudness (dB) → node radial distance with safe minimum

Status: review

## Story

As a player/viewer,
I want louder sounds to push note nodes farther from the wire using an exponential response
So that dynamics read as presence/space while staying visually safe and bounded.

## Acceptance Criteria

1. **Exponential, bounded mapping**
   **Given** a node is spawned for a note event  
   **When** its radial distance from the wire is computed from measured loudness in decibels (or a derived dB value)  
   **Then** the distance increases with loudness using an exponential curve  
   **And** the distance is clamped to a reasonable maximum

2. **Safe minimum**
   **Given** the wire has nonzero visible thickness and nodes have a nonzero radius  
   **When** the minimum distance rule is applied  
   **Then** the node’s radial distance never results in intersection with the wire  
   **And** at very low loudness, nodes still spawn at or above the minimum safe distance

3. **Reduced-motion stability**
   **Given** `prefers-reduced-motion: reduce` is enabled  
   **When** loudness varies rapidly  
   **Then** distance changes feel stable (bounded and smoothed enough to avoid aggressive pumping)

## Implementation notes

- Added an exponential loudness→radius helper using `FeatureFrame.level` (0–1) as a proxy:
  - `src/scene/loudnessRadius.ts` (`radiusFromLevel`)
- Centralized tuning knobs in `src/scene/journeyConfig.ts`:
  - `loudnessRadiusMin`, `loudnessRadiusMax`, `loudnessExpK`
  - `loudnessReducedMotionLerp` (simple smoothing on spawn when reduced motion is on)
- Updated journey node spawn to use the computed radius, with a minimum clamp:
  - `r = max(JOURNEY_NODE_RADIUS, radiusFromLevel(level))`
- Added tests:
  - `src/scene/loudnessRadius.test.ts`

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Implemented exponential loudness→radius mapping with min/max bounds.
- Ensured a minimum safe radius to avoid wire intersection.
- Added reduced-motion smoothing for radius changes at spawn.
- Verified `npm test` + `npm run lint`.

### Files changed

- `src/scene/journeyConfig.ts`
- `src/scene/loudnessRadius.ts`
- `src/scene/loudnessRadius.test.ts`
- `src/scene/SceneController.ts`

