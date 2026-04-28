export const JOURNEY_CONFIG = {
  // Wire is defined in the axis direction, spanning behind and ahead.
  // Total arclength shown (ahead + behind) is ~3× a compact default for a longer trail in world space.
  wireAhead: 84,
  wireBehind: 18,
  wireOpacity: 0.65,

  // Spawn nodes near the front of the visible wire segment (camera is near the front).
  spawnFromWireFront: 1.4,

  // Node field. Base mesh scale; also floor for radial spawn (see SceneController).
  nodeRadius: 0.675,
  nodeMax: 220,
  nodeFadeUnits: 18,

  // Loudness → radial distance (Story 2.3). Uses FeatureFrame.level (0–1) as a proxy for dB.
  // r(level) = min + (max - min) * ((exp(k*level) - 1) / (exp(k) - 1))
  loudnessRadiusMin: 0.675,
  // Wider max + steeper k so quiet vs loud separation reads clearly on the wire.
  loudnessRadiusMax: 7.2,
  loudnessExpK: 2.65,

  // Reduced motion should feel less "pumpy" when level fluctuates.
  loudnessReducedMotionLerp: 0.12,
} as const

