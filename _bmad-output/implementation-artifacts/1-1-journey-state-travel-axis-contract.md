---
story_key: 1-1-journey-state-travel-axis-contract
epic: "Epic 1: Journey Through Space (Trajectory + Note Nodes)"
story_id: "1.1"
title: "Journey state + travel axis contract"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
  supporting_epic_doc: _bmad-output/planning-artifacts/epic-journey-through-space.md
---

# Story 1.1: Journey state + travel axis contract

Status: review

## Story

As a player,
I want the world to move forward continuously,
so that I feel like I’m on a journey as I play.

## Acceptance Criteria

1. **Single source of truth**  
   **Given** the app is running  
   **When** the journey system initializes  
   **Then** there is a single journey state that owns travel axis and monotonic progress  
   **And** default axis direction and speed are deterministic

2. **Monotonic, note-independent progress**  
   **Given** the journey is running  
   **When** time advances  
   **Then** journey progress moves forward monotonically (never decreases)  
   **And** note changes do not reset or re-anchor progress

## Tasks / Subtasks

- [x] Define the journey state contract (AC: 1, 2)
  - [x] Identify whether this already exists in `SceneController` and/or graph state; do not duplicate
  - [x] If it exists implicitly, refactor into an explicit “journey state” shape (module-level constants + fields) that later stories can reference (wire, spawn, tuning)
  - [x] Ensure defaults are deterministic and do not depend on note events (e.g., axis = +Z, speed constant)

- [x] Make progress monotonic and decoupled from note changes (AC: 2)
  - [x] Confirm that progress increments from time deltas (not from note events)
  - [x] Confirm that note changes only spawn events and never reset progress

- [x] Ensure reduced-motion doesn’t break the contract (AC: 1, 2)
  - [x] When `prefers-reduced-motion: reduce`, progress may be slower, but remains monotonic and note-independent

## Dev Notes

### Current code reality (avoid reinventing)

This codebase already contains “journey” behavior. The goal of this story is to ensure it is **explicit, stable, and future-proof** for follow-up stories (static wire, node spawn, no snap-back, tuning), not to create a parallel system.

- The journey currently advances along **+Z** and is time-driven:
  - `JOURNEY_SPEED_UNITS_PER_S` constant
  - `journeyProgress` (monotonic)
  - `lastJourneyMs` for dt
  - `journeyRoot.position.set(0, 0, journeyProgress)` for forward travel frame  
  [Source: `src/scene/SceneController.ts`]

- Journey is invoked only when `applyViz(..., { live: true })` receives a non-null graph snapshot, otherwise it runs an idle frame:
  - rAF loop in `src/App.tsx` calls `scene.applyViz(frame, snap, { live: true })` when audio graph exists  
  [Source: `src/App.tsx`]

### Files likely to touch (read before editing)

- `src/scene/SceneController.ts`  
  - Owns `journeyProgress`, speed, dt, and the “moving frame” semantics.
  - Keep the imperative rAF update model; **do not** introduce React state at rAF rate.  
  [Source: `_bmad-output/project-context.md`]

- Potentially `src/graph/noteGraphState.ts` (only if journey needs a clean “note event” contract later)  
  - Avoid coupling audio/graph too tightly; preserve `audio → FeatureFrame → scene` seam.  
  [Source: `_bmad-output/project-context.md`]

### Constraints / guardrails

- **Keep the seam**: `src/audio/*` produces `FeatureFrame` consumed by `src/scene/*`.  
  [Source: `_bmad-output/project-context.md`]
- **Do not drive WebGL through React renders**: all scene changes must remain imperative within the rAF loop (`SceneController.applyViz` + `render`).  
  [Source: `_bmad-output/project-context.md`, `src/App.tsx`]
- **Reduced motion** must be respected end-to-end; journey may slow down but must remain stable.  
  [Source: `_bmad-output/project-context.md`, UX spec]

### Testing / verification

- Manual:
  - Leave the app running (live journey mode) and confirm forward progress continues even if the focused note changes.
  - Confirm there is no backwards “snap” when note changes occur (that’s enforced further in Story 1.4, but this story must not introduce resets).
- Automated:
  - If you refactor math/state into a pure helper module, add a small `*.test.ts` verifying monotonic progress update and deterministic defaults (Vitest).

### References

- Epic: `_bmad-output/planning-artifacts/epic-journey-through-space.md`
- Story source: `_bmad-output/planning-artifacts/epics.md` (Epic 1 / Story 1.1)
- Architecture constraints: `_bmad-output/planning-artifacts/architecture.md` (render loop + seam + reduced motion)
- UX intent: `_bmad-output/planning-artifacts/ux-design-specification.md` (pristine motion; avoid jitter/snap)
- Project rules: `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

2026-04-28
- Added `src/scene/journeyState.ts` to make journey axis/speed/dt/progress semantics explicit and testable.
- Updated `src/scene/SceneController.ts` to use `journeyState` helpers while preserving existing behavior.
- Added `src/scene/journeyState.test.ts` and ran `npm test` + `npm run lint` successfully.

### Completion Notes List

✅ Implemented an explicit journey state contract module (`JOURNEY_AXIS`, `JOURNEY_SPEED_UNITS_PER_S`, dt/progress helpers) to serve as the single source of truth for travel semantics.  
✅ Ensured journey progress remains monotonic and note-independent by driving it only from time deltas.  
✅ Verified reduced-motion still produces monotonic progress (speed scaling preserved).  
✅ Tests: `npm test` (Vitest) passing; Lint: `npm run lint` passing.

### File List

- src/scene/journeyState.ts
- src/scene/journeyState.test.ts
- src/scene/SceneController.ts
