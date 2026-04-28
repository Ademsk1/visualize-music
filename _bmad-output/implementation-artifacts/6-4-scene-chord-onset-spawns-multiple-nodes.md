# Story 6.4: Scene — chord onset spawns multiple nodes at once

Status: done

## Story

As a player,
I want chords to spawn multiple note nodes at once,
so that the visualization matches what I’m playing (multi-note strikes).

## Acceptance Criteria

1. **Multi-spawn**: When a chord note event arrives with multiple pitch classes, the scene spawns one node per pitch class in the same onset frame/window.
2. **Deterministic mapping**: Each spawned node uses deterministic angle/colour mapping rules (existing behavior).
3. **Triad demo**: A C major triad strike spawns 3 nodes immediately (distinct angles/colors).
4. **No regressions**: `npm test` and `npm run lint` pass.

## Tasks / Subtasks

- [x] Update `SceneController` to handle chord note events (AC: 1, 2)
- [x] Ensure per-pitch-class spawn uses existing `thetaForPitchClass` + colour mapping (AC: 2)
- [x] Manual verification in dev: play triad, observe 3 nodes (AC: 3)
- [x] Verification: `npm test`, `npm run lint` (AC: 4)

## Dev Notes

- Keep scene updates imperative; do not introduce React re-renders.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- `applyJourney` iterates `graph.noteEvent.pitchClasses` and calls `spawnJourneyNode` for each, sharing the same radius smooth step per event id.

### File List

- `src/scene/SceneController.ts`

### Change Log

- 2026-04-28: Multi-spawn on chord `noteEvent`.
