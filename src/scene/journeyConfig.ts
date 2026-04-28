export const JOURNEY_CONFIG = {
  // Wire is defined in the axis direction, spanning behind and ahead.
  wireAhead: 28,
  wireBehind: 6,
  wireOpacity: 0.65,

  // Spawn nodes near the front of the visible wire segment (camera is near the front).
  spawnFromWireFront: 1.4,

  // Node field.
  nodeRadius: 1.35,
  nodeMax: 220,
  nodeFadeUnits: 18,

  // Loudness → radial distance (Story 2.3). Uses FeatureFrame.level (0–1) as a proxy for dB.
  // r(level) = min + (max - min) * ((exp(k*level) - 1) / (exp(k) - 1))
  loudnessRadiusMin: 1.35,
  loudnessRadiusMax: 4.5,
  loudnessExpK: 2.2,

  // Reduced motion should feel less "pumpy" when level fluctuates.
  loudnessReducedMotionLerp: 0.12,
} as const

