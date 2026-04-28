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
  /** Monotonic frame id for debugging */
  t: number
}
