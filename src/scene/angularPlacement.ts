const TAU = Math.PI * 2

export type AngularPlacementMode = 'even' | 'golden'

/**
 * Deterministic around-wire angle for a given pitch class.
 * `even`: evenly spaces pitch classes around the circle (chromatic order).
 * `golden`: spreads adjacent pitch classes via golden-ratio step.
 */
export function thetaForPitchClass(
  pitchClass: number,
  mode: AngularPlacementMode = 'even'
): number {
  if (!Number.isFinite(pitchClass)) return 0
  const pc = Math.max(0, Math.min(11, Math.floor(pitchClass)))
  if (mode === 'golden') {
    const u = (pc * 0.618_033_988_749_895) % 1
    return u * TAU
  }
  return (pc / 12) * TAU
}

