/**
 * Handoff from Web Audio analysis → Three.js (see architecture.md).
 * Fields are refined when analysis is implemented.
 */
export type FeatureFrame = {
  /** Normalized level / envelope (0–1) */
  level: number
  /** Tonal / colour: blend of monophonic pitch (when present) and spectral shape */
  tonalHint: number
  /**
   * Optional pitch-class hint (0–11) when monophonic pitch detection is confident.
   * Used to stabilize pitch-class focus selection against harmonic/timbre spikes.
   */
  pitchClassHint?: number
  /** 0..1 confidence for `pitchClassHint` (higher = more reliable). */
  pitchClassConf?: number
  /**
   * Polyphonic pitch-class candidates (0–11) from HPS + smoothing, when present.
   */
  polyPitchClasses?: ReadonlyArray<{ readonly pc: number; readonly conf: number }>
  /**
   * 0–1: journey wire steering. With confident monophonic pitch, maps the lower
   * half of the keyboard (MIDI 21–64) to 0..1; high register → ~0.5; otherwise
   * spectral low-band tilt (legacy).
   */
  bassTilt01?: number
  /**
   * Rounded MIDI when monophonic pitch is confident (same gate as `pitchClassHint`).
   * Used for register (e.g. bass) without misreading `bassTilt01` scale.
   */
  midiNoteMonophonic?: number
  /** Monotonic frame id for debugging */
  t: number
}
