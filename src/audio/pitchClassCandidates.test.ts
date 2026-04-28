import { describe, expect, it } from 'vitest'
import {
  PitchClassSmoother,
  pitchClassCandidates,
  type ScoredFundamental,
} from './pitchClassCandidates'

describe('pitchClassCandidates', () => {
  it('maps A4 (440 Hz) to pitch class 9 (A)', () => {
    const f0s: ScoredFundamental[] = [{ f0Hz: 440, score: 1 }]
    const out = pitchClassCandidates(f0s)
    expect(out[0]!.pc).toBe(9)
    expect(out[0]!.conf).toBeCloseTo(1, 6)
  })

  it('maps the reference A4 frequency to pitch class 9 (A) when A4 is not 440 Hz', () => {
    const f0s: ScoredFundamental[] = [{ f0Hz: 432, score: 1 }]
    const out = pitchClassCandidates(f0s, 0, 432)
    expect(out[0]!.pc).toBe(9)
  })

  it('maps a C major triad fundamentals to {C,E,G} pitch classes', () => {
    const f0s: ScoredFundamental[] = [
      { f0Hz: 261.63, score: 1.0 }, // C4
      { f0Hz: 329.63, score: 0.9 }, // E4
      { f0Hz: 392.0, score: 0.85 }, // G4
    ]
    const pcs = pitchClassCandidates(f0s).map((x) => x.pc).sort((a, b) => a - b)
    expect(pcs).toEqual([0, 4, 7])
  })
})

describe('PitchClassSmoother', () => {
  it('reduces flicker for held chords by smoothing confidence', () => {
    const s = new PitchClassSmoother({ alphaUp: 0.6, alphaDown: 0.15, minConf: 0.35 })

    const c = pitchClassCandidates([
      { f0Hz: 261.63, score: 1.0 },
      { f0Hz: 329.63, score: 0.9 },
    ])
    const d = pitchClassCandidates([
      { f0Hz: 261.63, score: 1.0 },
      // E drops out briefly (simulated)
    ])

    // Warm up with chord
    s.update(c)
    const afterDrop = s.update(d).map((x) => x.pc)

    // Even after a single-frame drop, E should usually remain present due to smoothing.
    expect(afterDrop).toContain(4)
    expect(afterDrop).toContain(0)
  })
})

