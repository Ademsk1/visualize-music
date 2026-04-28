import { describe, expect, it } from 'vitest'
import { stubFeatureFrame } from './features'

describe('stubFeatureFrame', () => {
  it('returns level, tonalHint, and monotonic t', () => {
    const a = stubFeatureFrame(0)
    const b = stubFeatureFrame(1)
    expect(a.frame.level).toBeGreaterThanOrEqual(0)
    expect(a.frame.level).toBeLessThanOrEqual(1)
    expect(a.frame.tonalHint).toBeGreaterThanOrEqual(0)
    expect(a.frame.tonalHint).toBeLessThanOrEqual(1)
    expect(a.frame.t).toBe(0)
    expect(b.frame.t).toBe(1)
  })
})
