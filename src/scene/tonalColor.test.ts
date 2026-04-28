import { describe, expect, it } from 'vitest'
import {
  hueForTonalBucket,
  tonalBucketFromHint,
  TONAL_BUCKET_COUNT,
} from './tonalColor'

describe('tonalColor', () => {
  it('buckets tonal hints deterministically', () => {
    expect(tonalBucketFromHint(0)).toBe(0)
    expect(tonalBucketFromHint(1)).toBe(TONAL_BUCKET_COUNT - 1)
    expect(tonalBucketFromHint(-1)).toBe(0)
    expect(tonalBucketFromHint(2)).toBe(TONAL_BUCKET_COUNT - 1)
    expect(tonalBucketFromHint(Number.NaN)).toBe(0)
  })

  it('produces stable hues in [0, 1)', () => {
    for (let b = 0; b < TONAL_BUCKET_COUNT; b++) {
      const h = hueForTonalBucket(b)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThan(1)
      expect(hueForTonalBucket(b)).toBe(h)
    }
  })
})

