import { JOURNEY_CONFIG } from './journeyConfig'

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0
  return Math.min(1, Math.max(0, x))
}

export function radiusFromLevel(level01: number): number {
  const level = clamp01(level01)
  const minR = JOURNEY_CONFIG.loudnessRadiusMin
  const maxR = JOURNEY_CONFIG.loudnessRadiusMax
  const k = JOURNEY_CONFIG.loudnessExpK

  if (!Number.isFinite(minR) || !Number.isFinite(maxR) || maxR <= minR) {
    return Math.max(0, minR)
  }
  if (!Number.isFinite(k) || k <= 0) {
    return minR + (maxR - minR) * level
  }

  const denom = Math.expm1(k)
  if (!Number.isFinite(denom) || denom === 0) {
    return minR + (maxR - minR) * level
  }
  const y = Math.expm1(k * level) / denom
  const r = minR + (maxR - minR) * y
  if (!Number.isFinite(r)) return minR
  return Math.min(maxR, Math.max(minR, r))
}

