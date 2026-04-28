export const TONAL_BUCKET_COUNT = 12 as const

export function tonalBucketFromHint(tonalHint: number): number {
  if (!Number.isFinite(tonalHint)) return 0
  const t = Math.min(1, Math.max(0, tonalHint))
  const b = Math.floor(t * TONAL_BUCKET_COUNT)
  return Math.max(0, Math.min(TONAL_BUCKET_COUNT - 1, b))
}

/**
 * Stable, deterministic hue for a tonal bucket.
 * Returns a value in [0, 1).
 */
export function hueForTonalBucket(bucket: number): number {
  if (!Number.isFinite(bucket)) return 0
  const b = Math.max(0, Math.min(TONAL_BUCKET_COUNT - 1, Math.floor(bucket)))
  // Offset keeps bucket 0 away from pure red.
  return ((b / TONAL_BUCKET_COUNT + 0.08) % 1) as number
}

