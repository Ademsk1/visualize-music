const TAU = Math.PI * 2

/**
 * Deterministic around-wire angle for a given pitch class.
 * Uses the golden ratio step so adjacent pitch classes differ.
 */
export function thetaForPitchClass(pitchClass: number): number {
  if (!Number.isFinite(pitchClass)) return 0
  const pc = Math.max(0, Math.min(11, Math.floor(pitchClass)))
  const u = (pc * 0.618_033_988_749_895) % 1
  return u * TAU
}

