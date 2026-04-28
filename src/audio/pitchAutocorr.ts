import { LOG_PITCH_MAX_HZ, LOG_PITCH_MIN_HZ } from './pitchLogRange'

const P_MIN = LOG_PITCH_MIN_HZ
const P_MAX = LOG_PITCH_MAX_HZ

/**
 * Autocorrelation peak → log-scaled 0..1. Returns null if unpitched / noisy.
 * O(n·Δlag); n capped for real-time rAF. Not polyphonic; chords may confuse it.
 */
export function estimateLogPitch01(
  time: Float32Array,
  sampleRate: number
): number | null {
  const r = estimateLogPitch01WithConfidence(time, sampleRate)
  return r ? r.pitch01 : null
}

export function estimateLogPitch01WithConfidence(
  time: Float32Array,
  sampleRate: number
): { readonly pitch01: number; readonly conf: number } | null {
  // Need enough samples for a full period at ~55 Hz (e.g. 1024@48kHz ≈ 21 ms).
  const n = Math.min(1024, time.length)
  if (n < 512) return null

  const minLag = Math.max(2, Math.floor(sampleRate / P_MAX))
  const maxLag = Math.min(n - 2, Math.floor(sampleRate / P_MIN))
  if (minLag >= maxLag) return null

  let ac0 = 0
  for (let i = 0; i < n; i++) {
    const x = time[i] ?? 0
    ac0 += x * x
  }
  if (ac0 < 1e-8) return null

  const lagStride = 2
  let best = -1
  let bestLag = minLag
  for (let lag = minLag; lag <= maxLag; lag += lagStride) {
    let s = 0
    const lim = n - lag
    for (let i = 0; i < lim; i++) {
      const a = time[i] ?? 0
      const b = time[i + lag] ?? 0
      s += a * b
    }
    if (s > best) {
      best = s
      bestLag = lag
    }
  }

  const conf = best / ac0
  if (conf < 0.12) return null

  const f = sampleRate / bestLag
  if (f < P_MIN || f > P_MAX) return null

  return {
    pitch01:
      (Math.log2(f) - Math.log2(P_MIN)) /
      (Math.log2(P_MAX) - Math.log2(P_MIN)),
    conf,
  }
}
