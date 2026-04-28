# Story 6.2: Fundamentals → pitch classes + confidence smoothing

Status: done

## Story

As a player,
I want detected fundamentals to be mapped into pitch classes with stable confidence over time,
so that held chords don’t flicker and chord visuals remain consistent.

## Acceptance Criteria

1. **Mapping API exists**: Implement `pitchClassCandidates(f0s, tuningCents?) -> Array<{ pc: number; conf: number }>` with deterministic results.
2. **Confidence smoothing**: Add short smoothing/hysteresis so held chords don’t flicker rapidly frame-to-frame.
3. **Chord correctness**: Playing common intervals/triads (C+E, C+G, C+E+G) yields correct pitch class sets most of the time.
4. **No regressions**: `npm test` and `npm run lint` pass.

## Tasks / Subtasks

- [x] Implement mapping and confidence calculation (AC: 1)
- [x] Add temporal smoothing/hysteresis policy (AC: 2)
- [x] Add unit tests around mapping + smoothing (AC: 3, 4)
- [x] Verification: `npm test`, `npm run lint` (AC: 4)

## Dev Notes

- Prefer pitch-class output first (0–11); octave separation can be a later story.
- Consider storing a small rolling window of candidate energies for stability.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- Implemented deterministic `pitchClassCandidates(...)` mapping from scored fundamentals to pitch classes with normalized confidence.
- Added `PitchClassSmoother` (EMA up/down) to reduce one-frame flicker for held chords.
- Added unit tests for A4 mapping, C major triad mapping, and smoothing behavior.
- Verified `npm test`, `npm run lint`, and `npm run build` pass.

### File List

- `src/audio/pitchClassCandidates.ts`
- `src/audio/pitchClassCandidates.test.ts`

### Change Log

- 2026-04-28: Added pitch-class mapping + smoothing utilities and tests.

