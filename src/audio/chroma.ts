/**
 * 12-bin chroma (octave-agnostic pitch class) from a linear-magnitude spectrum.
 * `getFloatFrequencyData` yields dB; we convert to linear before summing.
 */

export const CHROMA_SIZE = 12

/** Convert analyser dB to linear gain (0…~1, peak ~1). */
export function floatFreqDbToLinear(gainDb: number): number {
  if (!Number.isFinite(gainDb)) return 0
  return 10 ** (0.05 * Math.min(0, gainDb))
}

/**
 * Accumulate energy from float frequency data (dB) into 12 pitch classes.
 * Bins in range ~80–8000 Hz; outside range skipped.
 */
export function accumulateChromaFromFloatSpectrum(
  floatDb: Float32Array,
  sampleRate: number,
  out: Float32Array
): void {
  const n = floatDb.length
  if (n < 2) {
    for (let i = 0; i < CHROMA_SIZE; i++) out[i] = 0
    return
  }
  for (let i = 0; i < CHROMA_SIZE; i++) out[i] = 0
  const nyquist = sampleRate * 0.5
  for (let i = 0; i < n; i++) {
    const f = ((i + 0.5) / n) * nyquist
    if (f < 50 || f > 10000) continue
    const db = floatDb[i] ?? 0
    const lin = floatFreqDbToLinear(db)
    const midi = 69 + 12 * Math.log2(f / 440)
    const pc = ((Math.floor(midi) % 12) + 12) % 12
    out[pc]! += lin * lin
  }
}

/**
 * dBFS from RMS. Approximate, suitable for a threshold UI (negative values).
 */
export function rmsToDbfs(rms: number): number {
  if (!Number.isFinite(rms) || rms <= 0) return -120
  return 20 * Math.log10(rms)
}
