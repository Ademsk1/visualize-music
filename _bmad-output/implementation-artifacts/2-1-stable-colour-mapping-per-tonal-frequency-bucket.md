---
story_key: 2-1-stable-colour-mapping-per-tonal-frequency-bucket
epic: "Epic 2: Stronger Musical Mapping (stable colour + exponential dynamics distance)"
story_id: "2.1"
title: "Stable colour mapping per tonal/frequency bucket"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 2.1: Stable colour mapping per tonal/frequency bucket

Status: review

## Story

As a viewer,
I want the same tonal or frequency bucket to always map to the same colour
So that the scene reads as intentional and consistent over time.

## Acceptance Criteria

1. **Stable mapping**
   **Given** the system maps audio into discrete tonal/frequency buckets  
   **When** the same bucket is active across multiple moments in a session  
   **Then** the hue/colour selection for that bucket is stable (no drift or random walk)  
   **And** switching away and back to the bucket restores the same colour

2. **Deterministic across reload**
   **Given** adjacent buckets are active in sequence  
   **When** the bucket changes  
   **Then** the colour change is clearly attributable to the bucket change (not noise)  
   **And** the mapping is deterministic (reloading the app yields the same bucket→colour mapping)

## Implementation notes

- Introduced discrete bucketization for `FeatureFrame.tonalHint` and a deterministic bucket→hue mapping:
  - `src/scene/tonalColor.ts`
- Updated idle/background lighting hue selection to use the bucketed hue (prevents frame-to-frame drift from noisy `tonalHint`).
- Added unit tests for bucketing and hue range/stability:
  - `src/scene/tonalColor.test.ts`

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Implemented deterministic bucket mapping for tonal colour selection, removing continuous hue drift in idle mode.
- Added automated tests and verified `npm test` + `npm run lint`.

### Files changed

- `src/scene/tonalColor.ts`
- `src/scene/tonalColor.test.ts`
- `src/scene/SceneController.ts`

