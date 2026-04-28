/**
 * When HPS returns several peaks from one note, they are often f0, 2f0, 3f0…
 * Those map to different pitch classes. Keep the lowest-frequency partial that
 * is not an integer multiple of a lower kept partial (2..8×).
 */
export type ScoredF0 = { readonly f0Hz: number; readonly score: number }

const RATIO_TOL = 0.028
const MAX_HARMONIC = 8

function isIntegerMultipleOfLower(upper: number, lower: number): boolean {
  if (upper <= lower || lower <= 0) return false
  const r = upper / lower
  const n = Math.round(r)
  return n >= 2 && n <= MAX_HARMONIC && Math.abs(r - n) < RATIO_TOL
}

export function dropLikelyHarmonicOvertones(f0s: readonly ScoredF0[]): ScoredF0[] {
  if (f0s.length <= 1) return [...f0s]
  const byFreq = [...f0s].sort((a, b) => a.f0Hz - b.f0Hz)
  const kept: ScoredF0[] = []
  for (const c of byFreq) {
    const dup = kept.some((k) => isIntegerMultipleOfLower(c.f0Hz, k.f0Hz))
    if (!dup) kept.push(c)
  }
  return kept.sort((a, b) => b.score - a.score)
}
