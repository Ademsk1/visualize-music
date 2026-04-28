import { describe, expect, it } from 'vitest'
import { thetaForPitchClass } from './angularPlacement'

describe('angularPlacement', () => {
  it('is deterministic and returns angles in [0, 2π)', () => {
    const a = thetaForPitchClass(0)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThan(Math.PI * 2)
    expect(thetaForPitchClass(0)).toBe(a)
  })

  it('clamps non-finite and out-of-range inputs', () => {
    expect(thetaForPitchClass(Number.NaN)).toBe(0)
    expect(thetaForPitchClass(-10)).toBe(thetaForPitchClass(0))
    expect(thetaForPitchClass(99)).toBe(thetaForPitchClass(11))
  })

  it('increments evenly per semitone', () => {
    const step = (Math.PI * 2) / 12
    expect(thetaForPitchClass(1, 'even')).toBeCloseTo(step, 10)
    expect(thetaForPitchClass(2, 'even')).toBeCloseTo(step * 2, 10)
    expect(thetaForPitchClass(11, 'even')).toBeCloseTo(step * 11, 10)
  })

  it('supports golden-ratio mode', () => {
    expect(thetaForPitchClass(0, 'golden')).toBeCloseTo(0, 10)
    // pc=1 should not equal the even step angle.
    const step = (Math.PI * 2) / 12
    expect(thetaForPitchClass(1, 'golden')).not.toBeCloseTo(step, 6)
  })
})

