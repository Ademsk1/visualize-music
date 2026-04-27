import { describe, expect, it } from 'vitest'
import { stubFeatureFrame } from './features'

describe('stubFeatureFrame', () => {
  it('returns level, tonalHint, and monotonic t', () => {
    const a = stubFeatureFrame(0)
    const b = stubFeatureFrame(1)
    expect(a.level).toBeGreaterThanOrEqual(0)
    expect(a.level).toBeLessThanOrEqual(1)
    expect(a.tonalHint).toBeGreaterThanOrEqual(0)
    expect(a.tonalHint).toBeLessThanOrEqual(1)
    expect(a.t).toBe(0)
    expect(b.t).toBe(1)
  })
})
