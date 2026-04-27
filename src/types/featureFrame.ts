/**
 * Handoff from Web Audio analysis → Three.js (see architecture.md).
 * Fields are refined when analysis is implemented.
 */
export type FeatureFrame = {
  /** Normalized level / envelope (0–1) */
  level: number
  /** Tonal / colour: blend of monophonic pitch (when present) and spectral shape */
  tonalHint: number
  /** Monotonic frame id for debugging */
  t: number
}
