export const JOURNEY_AXIS = { x: 0, y: 0, z: 1 } as const

export const JOURNEY_SPEED_UNITS_PER_S = 0.55

export function computeJourneyDtSeconds(lastMs: number, nowMs: number): number {
  if (!Number.isFinite(lastMs) || !Number.isFinite(nowMs)) return 0.016
  if (lastMs <= 0 || nowMs <= 0) return 0.016
  const raw = (nowMs - lastMs) * 0.001
  const nonNegative = Math.max(0, raw)
  const clamped = Math.min(0.05, nonNegative)
  return Number.isFinite(clamped) ? clamped : 0.016
}

export function advanceJourneyProgress(
  progress: number,
  speedUnitsPerS: number,
  dtSeconds: number
): number {
  if (!Number.isFinite(progress) || progress < 0) return 0
  if (!Number.isFinite(speedUnitsPerS) || speedUnitsPerS < 0) return progress
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return progress
  const next = progress + speedUnitsPerS * dtSeconds
  if (!Number.isFinite(next)) return progress
  return Math.max(progress, next)
}

