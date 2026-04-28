# Story 6.1: HPS poly detector core (FFT → top‑K fundamentals)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player,
I want the system to detect multiple simultaneous fundamentals from microphone audio (polyphony),
so that playing chords produces stable multi-note events and chord visuals can spawn multiple nodes at once.

## Acceptance Criteria

1. **API exists**: Implement `hpsDetectFundamentals(spectrum, sampleRate, fftSize, opts)` returning `Array<{ f0Hz: number; score: number }>` sorted by descending score.
2. **Peak picking**: Candidate fundamentals are derived from spectral peaks (local maxima) above a configurable floor.
3. **Harmonic scoring**: Fundamentals are scored using harmonic evidence over \(h = 1..H\) (harmonic product or harmonic sum).
4. **Iterative suppression**: After each selected fundamental, suppress its harmonic series so subsequent picks can recover additional fundamentals in a chord.
5. **Deterministic + stable**: On deterministic synthetic spectra, the top‑K fundamentals are stable across runs.
6. **No regressions**: `npm test` and `npm run lint` pass.

## Tasks / Subtasks

- [x] Implement HPS detector core (AC: 1, 2, 3, 4)
  - [x] Create `src/audio/hps.ts` exporting:
    - [x] `type HpsOptions = { topK?: number; harmonicCount?: number; minHz?: number; maxHz?: number; peakFloor?: number; suppression?: number }`
    - [x] `function hpsDetectFundamentals(spectrum: Float32Array, sampleRate: number, fftSize: number, opts?: HpsOptions): Array<{ f0Hz: number; score: number }>`
  - [x] Use local-maxima peak picking on the half-spectrum.
  - [x] Score candidates using harmonic sum or log-product to avoid numeric underflow.
  - [x] After selecting a candidate, suppress bins near its harmonics (configurable factor) before selecting the next.
  - [x] Clamp/guard inputs (non-finite sampleRate/fftSize, empty arrays) and return `[]` safely.
- [x] Add unit tests for synthetic spectra (AC: 5, 6)
  - [x] Add `src/audio/hps.test.ts`
  - [x] Test: single-note synthetic spectrum returns f0 near expected within tolerance
  - [x] Test: two-note “chord” spectrum returns both fundamentals in top‑K (order doesn’t matter)
  - [x] Test: suppression prevents selecting a harmonic as the “second fundamental”
- [x] Verification (AC: 6)
  - [x] `npm test`
  - [x] `npm run lint`

## Dev Notes

### Constraints

- Keep the architecture seam: `src/audio/*` produces features; `src/graph/*` interprets into events; `src/scene/*` renders without React re-renders at rAF frequency.  
  [Source: `_bmad-output/project-context.md`]
- Avoid heavy dependencies (no ML for this story).

### Implementation hints

- Hz/bin mapping: `binHz = binIndex * sampleRate / fftSize`
- Search range defaults:
  - `minHz` ~ 60–80 Hz (avoid DC/rumble)
  - `maxHz` ~ 1200–2000 Hz for fundamentals (keeps search tractable; harmonics cover higher content)
- Use `harmonicCount` ~ 5–8.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

- Implemented `hpsDetectFundamentals` using local-max peak picking, harmonic-sum scoring, and iterative harmonic suppression.
- Added deterministic synthetic-spectrum unit tests for single-note and two-note “chord” cases.
- Verified `npm test` + `npm run lint` pass.

### File List

- `src/audio/hps.ts`
- `src/audio/hps.test.ts`

### Change Log

- 2026-04-28: Added HPS top‑K fundamentals detector + tests.

