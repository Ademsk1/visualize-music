import { describe, expect, it } from 'vitest'
import { radiusFromLevel } from './loudnessRadius'
import { JOURNEY_CONFIG } from './journeyConfig'

describe('loudnessRadius', () => {
  it('respects min/max and is monotonic over [0,1]', () => {
    const r0 = radiusFromLevel(0)
    const r1 = radiusFromLevel(1)
    expect(r0).toBeGreaterThanOrEqual(JOURNEY_CONFIG.loudnessRadiusMin)
    expect(r1).toBeLessThanOrEqual(JOURNEY_CONFIG.loudnessRadiusMax)
    expect(r1).toBeGreaterThanOrEqual(r0)

    const a = radiusFromLevel(0.2)
    const b = radiusFromLevel(0.4)
    const c = radiusFromLevel(0.8)
    expect(a).toBeLessThanOrEqual(b)
    expect(b).toBeLessThanOrEqual(c)
  })

  it('clamps non-finite inputs safely', () => {
    expect(radiusFromLevel(Number.NaN)).toBe(JOURNEY_CONFIG.loudnessRadiusMin)
    expect(radiusFromLevel(Number.POSITIVE_INFINITY)).toBe(
      JOURNEY_CONFIG.loudnessRadiusMin
    )
    expect(radiusFromLevel(-1)).toBe(JOURNEY_CONFIG.loudnessRadiusMin)
  })
})

