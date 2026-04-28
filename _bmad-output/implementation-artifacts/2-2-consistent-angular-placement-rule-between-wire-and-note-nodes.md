---
story_key: 2-2-consistent-angular-placement-rule-between-wire-and-note-nodes
epic: "Epic 2: Stronger Musical Mapping (stable colour + exponential dynamics distance)"
story_id: "2.2"
title: "Consistent angular placement rule between wire and note nodes"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 2.2: Consistent angular placement rule between wire and note nodes

Status: review

## Story

As a viewer,
I want note nodes to maintain a consistent angular placement rule around the wire
So that spatial relationships feel coherent instead of randomly rotating over time.

## Acceptance Criteria

1. **Deterministic angular rule**
   **Given** a note node is spawned around the wire  
   **When** its around-wire angle \(\theta\) is chosen  
   **Then** \(\theta\) follows a consistent rule (deterministic per pitch-class)  
   **And** the rule produces stable “angles” that do not jitter frame-to-frame

2. **Repeatable for same pitch-class**
   **Given** the same pitch-class occurs multiple times  
   **When** nodes are spawned for that pitch-class  
   **Then** their angular placement is consistent enough to be recognizable  
   **And** placement remains orthogonal to the travel axis (plane normal to the axis)

## Implementation notes

- Replaced random angle selection with deterministic `pitchClass → θ` mapping:
  - `src/scene/angularPlacement.ts`
  - `thetaForPitchClass(pitchClass)` uses golden-ratio step mapping to spread 12 pitch classes around the circle.
- Updated journey node spawn to use `thetaForPitchClass(...)` instead of `Math.random()`.
- Added unit tests:
  - `src/scene/angularPlacement.test.ts`

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Implemented deterministic around-wire angular placement for nodes per pitch-class.
- Verified `npm test` + `npm run lint`.

### Files changed

- `src/scene/angularPlacement.ts`
- `src/scene/angularPlacement.test.ts`
- `src/scene/SceneController.ts`

