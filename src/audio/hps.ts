export type HpsOptions = {
  /** Max fundamentals to return. */
  readonly topK?: number
  /** Number of harmonics to use for scoring (>= 1). */
  readonly harmonicCount?: number
  /** Minimum fundamental frequency to consider. */
  readonly minHz?: number
  /** Maximum fundamental frequency to consider. */
  readonly maxHz?: number
  /** Minimum peak amplitude to consider as a candidate. */
  readonly peakFloor?: number
  /**
   * Multiplicative suppression applied to bins near harmonics of selected f0s.
   * 0.15 means "reduce to 15%".
   */
  readonly suppression?: number
}

type Fundamental = { readonly f0Hz: number; readonly score: number; readonly bin: number }

function clampInt(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo
  return Math.max(lo, Math.min(hi, Math.trunc(v)))
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(1, v))
}

function isLocalPeak(a: Float32Array, i: number, floor: number): boolean {
  const v = a[i] ?? 0
  if (v < floor) return false
  const l = a[i - 1] ?? 0
  const r = a[i + 1] ?? 0
  return v >= l && v >= r
}

function harmonicScore(
  a: Float32Array,
  baseBin: number,
  harmonicCount: number
): number {
  // Harmonic sum with mild 1/h weighting. More stable than raw product.
  let s = 0
  for (let h = 1; h <= harmonicCount; h++) {
    const bi = baseBin * h
    if (bi <= 0 || bi >= a.length) break
    const v = a[bi] ?? 0
    s += v / h
  }
  return s
}

function suppressHarmonics(
  a: Float32Array,
  baseBin: number,
  harmonicCount: number,
  suppression: number
) {
  const sup = clamp01(suppression)
  // Suppress each harmonic bin and a 1-bin neighbourhood to reduce binning effects.
  for (let h = 1; h <= harmonicCount; h++) {
    const bi = baseBin * h
    if (bi <= 0 || bi >= a.length) break
    for (let d = -1; d <= 1; d++) {
      const j = bi + d
      if (j <= 0 || j >= a.length) continue
      a[j] = (a[j] ?? 0) * sup
    }
  }
}

export function hpsDetectFundamentals(
  spectrum: Float32Array,
  sampleRate: number,
  fftSize: number,
  opts: HpsOptions = {}
): Array<{ f0Hz: number; score: number }> {
  if (!(spectrum instanceof Float32Array)) return []
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) return []
  if (!Number.isFinite(fftSize) || fftSize <= 0) return []
  if (spectrum.length < 8) return []

  const topK = clampInt(opts.topK ?? 3, 1, 8)
  const harmonicCount = clampInt(opts.harmonicCount ?? 6, 1, 12)
  const peakFloor = Number.isFinite(opts.peakFloor) ? Math.max(0, opts.peakFloor!) : 0.02
  const suppression = Number.isFinite(opts.suppression) ? (opts.suppression as number) : 0.15

  const hzPerBin = sampleRate / fftSize
  const minHz = Number.isFinite(opts.minHz) ? Math.max(0, opts.minHz!) : 70
  const maxHz = Number.isFinite(opts.maxHz) ? Math.max(minHz, opts.maxHz!) : 1600
  const minBin = Math.max(2, Math.floor(minHz / hzPerBin))
  const maxBin = Math.min(spectrum.length - 2, Math.ceil(maxHz / hzPerBin))
  if (maxBin <= minBin) return []

  // Work on a copy so callers can reuse their buffer.
  const work = spectrum.slice()

  const chosen: Fundamental[] = []
  for (let pick = 0; pick < topK; pick++) {
    let best: Fundamental | null = null

    for (let i = minBin; i <= maxBin; i++) {
      if (!isLocalPeak(work, i, peakFloor)) continue
      const score = harmonicScore(work, i, harmonicCount)
      if (score <= 0) continue
      if (!best || score > best.score) {
        best = { f0Hz: i * hzPerBin, score, bin: i }
      }
    }

    if (!best) break
    chosen.push(best)
    suppressHarmonics(work, best.bin, harmonicCount, suppression)
  }

  // Sort by score for stability (even if equal picks happen across candidates).
  chosen.sort((a, b) => b.score - a.score || a.f0Hz - b.f0Hz)
  return chosen.map(({ f0Hz, score }) => ({ f0Hz, score }))
}

