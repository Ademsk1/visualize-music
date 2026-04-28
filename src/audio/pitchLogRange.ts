/**
 * Shared log pitch band for autocorr pitch01 ↔ Hz (monophonic path in features).
 * Min ~55 Hz (A1) so C2 (~65 Hz) is in band; max matches piano-friendly ceiling.
 */
export const LOG_PITCH_MIN_HZ = 55
export const LOG_PITCH_MAX_HZ = 2000

const LOG_SPAN = Math.log2(LOG_PITCH_MAX_HZ) - Math.log2(LOG_PITCH_MIN_HZ)

/** Inverse of the pitch01 mapping used with autocorrelation (0..1 → Hz). */
export function freqFromLogPitch01(pitch01: number): number {
  const t = Math.max(0, Math.min(1, pitch01))
  return 2 ** (Math.log2(LOG_PITCH_MIN_HZ) + t * LOG_SPAN)
}

/** Hz → continuous MIDI (equal temperament vs reference A4). */
export function midiFromHz(f: number, referenceA4Hz: number): number {
  if (!Number.isFinite(f) || f <= 0) return 69
  const ref = Number.isFinite(referenceA4Hz) && referenceA4Hz > 0 ? referenceA4Hz : 440
  return 69 + 12 * Math.log2(f / ref)
}

/** For tests and debugging: inverse of `freqFromLogPitch01` for a given Hz. */
export function logPitch01FromHz(hz: number): number {
  if (!Number.isFinite(hz) || hz <= 0) return 0.5
  return (
    (Math.log2(hz) - Math.log2(LOG_PITCH_MIN_HZ)) /
    (Math.log2(LOG_PITCH_MAX_HZ) - Math.log2(LOG_PITCH_MIN_HZ))
  )
}
