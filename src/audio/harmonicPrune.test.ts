import { describe, expect, it } from 'vitest'
import { dropLikelyHarmonicOvertones } from './harmonicPrune'

describe('dropLikelyHarmonicOvertones', () => {
  it('keeps a single f0 from a harmonic stack', () => {
    const f0 = 261.63
    const out = dropLikelyHarmonicOvertones([
      { f0Hz: f0, score: 0.6 },
      { f0Hz: f0 * 2, score: 0.9 },
      { f0Hz: f0 * 3, score: 0.4 },
    ])
    expect(out.length).toBe(1)
    expect(out[0]!.f0Hz).toBeCloseTo(f0, 1)
  })

  it('keeps two notes for a two-note interval (not integer ratio)', () => {
    const out = dropLikelyHarmonicOvertones([
      { f0Hz: 261.63, score: 0.5 },
      { f0Hz: 329.63, score: 0.5 },
    ])
    expect(out.length).toBe(2)
  })
})
