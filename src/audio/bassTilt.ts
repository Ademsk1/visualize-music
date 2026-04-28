import { floatFreqDbToLinear } from './chroma'
import { freqFromLogPitch01, midiFromHz } from './pitchLogRange'

/**
 * Inclusive MIDI range: lower 44 keys of 88 (A0 = 21 through E4 = 64). Wire
 * angle maps linearly in pitch across this range when pitch confidence is good.
 */
export const LOW_KEY_MIDI_LO = 21
export const LOW_KEY_MIDI_HI = 64
/** Monophonic pitch conf (0..1) must meet this to steer by note. */
export const LOW_KEY_PITCH_CONF_MIN = 0.35

/**
 * 0–1: relative “bass / low-end” weight for steering, from the float dB spectrum.
 * Combines (1) a ~20–280 Hz band ratio (classic bass register) and (2) a coarse
 * low-quartile bin share so level spectral tilt has a clear control even at modest FFTs.
 * ~0.5 = neutral; higher when the low end dominates.
 */
export function bassTilt01FromFloatDbSpectrum(
  ff: Float32Array,
  sampleRate: number
): number {
  if (!ff?.length || !Number.isFinite(sampleRate) || sampleRate <= 0) return 0.5
  const n = ff.length
  const nyq = sampleRate * 0.5
  let wHzBass = 0
  let wHzRest = 0
  const nQ = Math.max(1, Math.floor(n * 0.25))
  let wLowQ = 0
  let wAll = 0
  for (let i = 0; i < n; i++) {
    const lin = floatFreqDbToLinear(ff[i] ?? 0)
    wAll += lin
    if (i < nQ) wLowQ += lin
    const hz = ((i + 0.5) / n) * nyq
    if (hz >= 20 && hz <= 280) wHzBass += lin
    if (hz > 280) wHzRest += lin
  }
  wAll = Math.max(wAll, 1e-15)
  const tHz = wHzBass + wHzRest + 1e-15
  const shareHz = wHzBass / tHz
  const shareQ = wLowQ / wAll
  // Blend: Hz band (physical bass) + low-quartile (robust for coarse bins).
  const share = 0.62 * shareHz + 0.38 * shareQ
  // Calibrated so a typical flat / balanced spectrum sits near 0.5; loud bass pushes up.
  return Math.max(0, Math.min(1, 0.5 + 1.4 * (share - 0.2)))
}

/**
 * Drives the journey wire by **which note** is in the lower half of the keyboard
 * (spectral “bass tilt” is similar for adjacent low notes; this uses pitch).
 * - Confident monophonic pitch in [LOW_KEY_MIDI_LO, LOW_KEY_MIDI_HI]: 0..1 by key.
 * - Pitch above that range: neutral 0.5 (high notes don’t swing the wire on spectrum).
 * - No/low confidence: keeps spectral `baseline01`.
 */
export function bassTilt01WithLowKeyboard(
  baseline01: number,
  pitch01: number | null,
  pitchConf: number,
  referenceA4Hz: number
): number {
  if (pitch01 == null || !Number.isFinite(pitchConf) || pitchConf < LOW_KEY_PITCH_CONF_MIN) {
    return baseline01
  }
  const f = freqFromLogPitch01(pitch01)
  const m = Math.round(midiFromHz(f, referenceA4Hz))
  if (m < LOW_KEY_MIDI_LO) {
    return baseline01
  }
  if (m > LOW_KEY_MIDI_HI) {
    return 0.5
  }
  const w = LOW_KEY_MIDI_HI - LOW_KEY_MIDI_LO
  return (m - LOW_KEY_MIDI_LO) / w
}
