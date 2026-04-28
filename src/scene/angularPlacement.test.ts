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
})

