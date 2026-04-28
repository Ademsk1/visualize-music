# Story 6.3: Poly `FeatureFrame` and chord note events

Status: done

## Story

As a player,
I want polyphonic pitch-class candidates to flow through the app as a first-class signal,
so that chord onsets can emit multi-note events and drive multiple node spawns.

## Acceptance Criteria

1. **FeatureFrame**: Add `polyPitchClasses?: Array<{ pc: number; conf: number }>` to `src/types/featureFrame.ts`.
2. **Graph snapshot**: Extend graph snapshot note events to support chords: `noteEvent: { pitchClasses: number[]; id: number } | null`.
3. **Debounced chord events**: Repeated chord strikes generate new events (debounced), sustained chords don’t.
4. **No regressions**: `npm test` and `npm run lint` pass.

## Tasks / Subtasks

- [x] Extend `FeatureFrame` type and populate it from audio features (AC: 1)
- [x] Extend `GraphViewSnapshot` + note event emission for chords (AC: 2, 3)
- [x] Unit tests for chord note event shape (AC: 3, 4)
- [x] Verification: `npm test`, `npm run lint` (AC: 4)

## Dev Notes

- Keep the seam: audio computes candidates; graph decides events; scene consumes snapshot.
- Avoid React re-renders at rAF frequency.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- `readFeatureFrame` builds linear spectrum from analyser dB, runs HPS → `pitchClassCandidates` → `PitchClassSmoother`, sets `frame.polyPitchClasses` when non-empty.
- `NoteGraphModel` takes `polyPitchClasses` in `update` opts; `noteEvent` is now `{ pitchClasses, id }`; `pickFocus` prefers HPS poly when present.
- `resetFeatureSmoothing` recreates the poly smoother.

### File List

- `src/types/featureFrame.ts`
- `src/audio/features.ts`
- `src/graph/noteGraphState.ts`
- `src/graph/noteGraphState.test.ts`
- `src/App.tsx`

### Change Log

- 2026-04-28: Poly pitch classes on `FeatureFrame`; chord-shaped `noteEvent`; integration + tests.
