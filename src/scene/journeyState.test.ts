import { describe, expect, it } from 'vitest'
import {
  advanceJourneyProgress,
  computeJourneyDtSeconds,
  JOURNEY_AXIS,
  JOURNEY_SPEED_UNITS_PER_S,
} from './journeyState'

describe('journeyState', () => {
  it('uses deterministic defaults', () => {
    expect(JOURNEY_AXIS).toEqual({ x: 0, y: 0, z: 1 })
    expect(JOURNEY_SPEED_UNITS_PER_S).toBeGreaterThan(0)
  })

  it('computes dt with clamp and non-negative floor', () => {
    expect(computeJourneyDtSeconds(0, 1000)).toBeCloseTo(0.016, 5)
    expect(computeJourneyDtSeconds(1000, 1000)).toBe(0)
    expect(computeJourneyDtSeconds(2000, 1000)).toBe(0)
    expect(computeJourneyDtSeconds(0, 0)).toBeCloseTo(0.016, 5)
    expect(computeJourneyDtSeconds(1000, 1060)).toBeCloseTo(0.05, 5) // clamped (0.06 -> 0.05)
    expect(computeJourneyDtSeconds(Number.NaN, 1000)).toBeCloseTo(0.016, 5)
    expect(computeJourneyDtSeconds(1000, Number.NaN)).toBeCloseTo(0.016, 5)
    expect(computeJourneyDtSeconds(1000, Number.POSITIVE_INFINITY)).toBeCloseTo(
      0.016,
      5
    )
  })

  it('advances monotonically given non-negative dt', () => {
    expect(advanceJourneyProgress(0, 1, 0)).toBe(0)
    expect(advanceJourneyProgress(1, 2, 0.5)).toBe(2)
    expect(advanceJourneyProgress(1, 2, -0.5)).toBe(1)
    expect(advanceJourneyProgress(1, -1, 0.5)).toBe(1)
    expect(advanceJourneyProgress(1, Number.NaN, 0.5)).toBe(1)
    expect(advanceJourneyProgress(Number.NaN, 1, 0.5)).toBe(0)
  })
})

