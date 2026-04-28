import { Color } from 'three'
import { LOW_KEY_MIDI_HI, LOW_KEY_MIDI_LO } from '../audio/bassTilt'
import type { FeatureFrame } from '../types/featureFrame'

/** Default clear / page fill: not pure black — slight cool bias. */
export const TONED_BLACK_CLEAR = 0x0a0a0c

/** Inclusive: below middle C (MIDI 60) counts as “bass” for the background tint. */
const BASS_MIDI_MAX = 59
/**
 * `bassTilt01` on the 21..64 key map at `BASS_MIDI_MAX` — tints for all lower keys, not
 * just the first ~20 semitones (the old `tilt < 0.48` check was wrong for C2–B3).
 */
const LOW_KEY_TILT_AT_BASS_CEIL =
  (BASS_MIDI_MAX - LOW_KEY_MIDI_LO) / (LOW_KEY_MIDI_HI - LOW_KEY_MIDI_LO)

const tmpTint = new Color()
const tmpOut = new Color()

/**
 * Resolves a pitch class 0–11 (C..B) for background tint, or null if nothing usable.
 */
function effectivePitchClass12(f: FeatureFrame): number | null {
  const c = f.pitchClassConf ?? 0
  if (f.pitchClassHint != null && c >= 0.25) {
    return ((Math.round(f.pitchClassHint) % 12) + 12) % 12
  }
  const poly = f.polyPitchClasses
  if (poly && poly.length > 0) {
    const sorted = [...poly].sort((a, b) => b.conf - a.conf)
    const best = sorted.at(0)
    if (best && best.conf >= 0.18) {
      return ((Math.round(best.pc) % 12) + 12) % 12
    }
  }
  return null
}

/**
 * Bass register: prefer monophonic MIDI; else low-keyboard `bassTilt01` (not the 0.5
 * “high note” escape), or a strict spectral tilt when only poly is available.
 */
function isBassFrame(f: FeatureFrame): boolean {
  if (f.level < 0.02) return false
  if (effectivePitchClass12(f) == null) return false

  if (f.midiNoteMonophonic != null) {
    return f.midiNoteMonophonic <= BASS_MIDI_MAX
  }

  const tilt = f.bassTilt01 ?? 0.5
  if (Math.abs(tilt - 0.5) < 0.02) return false
  if ((f.pitchClassConf ?? 0) >= 0.32) {
    return tilt < LOW_KEY_TILT_AT_BASS_CEIL
  }
  if (f.polyPitchClasses && f.polyPitchClasses.length > 0) {
    return tilt < 0.36
  }
  return false
}

/**
 * Clear color: toned black, with a very subtle C→B (pitch-class) hue nudge only when
 * a bass-leaning note is present.
 */
export function bassBackgroundClearTarget(f: FeatureFrame): number {
  if (!isBassFrame(f)) return TONED_BLACK_CLEAR

  const pc = effectivePitchClass12(f)
  if (pc == null) return TONED_BLACK_CLEAR

  // Hue walk C..B (12 steps) on the chroma circle; keep base dark, tint a touch stronger.
  tmpTint.setHSL((pc + 0.5) / 12, 0.52, 0.15)
  tmpOut.set(TONED_BLACK_CLEAR)
  let byMidi = 0.5 + 0.55 * (0.5 - (f.bassTilt01 ?? 0.5))
  if (f.midiNoteMonophonic != null) {
    byMidi = 1.25 * Math.max(0, 1 - f.midiNoteMonophonic / 72)
  }
  const w =
    0.26 *
    Math.min(1, f.level * 2.5) *
    Math.min(1, 0.3 + (f.pitchClassConf ?? 0.2)) *
    Math.min(1, Math.max(0.2, byMidi))
  const blend = Math.min(0.4, Math.max(0.1, w))
  tmpOut.lerp(tmpTint, blend)
  return tmpOut.getHex() & 0xff_ff_ff
}

export function lerpBassBackgroundClear(
  fromHex: number,
  toHex: number,
  dtSeconds: number,
  k = 10
): number {
  const t = 1 - Math.exp(-k * Math.min(0.12, Math.max(0, dtSeconds)))
  tmpOut.setHex(fromHex)
  tmpTint.setHex(toHex)
  tmpOut.lerp(tmpTint, t)
  return tmpOut.getHex() & 0xff_ff_ff
}
