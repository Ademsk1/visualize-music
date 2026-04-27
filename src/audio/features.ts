import type { FeatureFrame } from '../types/featureFrame'
import { estimateLogPitch01 } from './pitchAutocorr'

let timeBuf: Float32Array<ArrayBuffer> | null = null
let freqBuf: Uint8Array<ArrayBuffer> | null = null

/** Smoothed outputs + peak follower for level (adaptive dynamics). */
let smoothLevel = 0
let smoothTonal = 0.5
let levelPeak = 0.0001

let reducedMotionPref = false

/** Last monophonic pitch blend; cleared when quiet. */
let lastPitch01: number | null = null

export function setFeatureReducedMotion(value: boolean) {
  reducedMotionPref = value
}

export function resetFeatureSmoothing() {
  smoothLevel = 0
  smoothTonal = 0.5
  levelPeak = 0.0001
  lastPitch01 = null
}

function buffersFor(a: AnalyserNode) {
  if (timeBuf?.length !== a.fftSize) {
    const bytes = a.fftSize * Float32Array.BYTES_PER_ELEMENT
    timeBuf = new Float32Array(new ArrayBuffer(bytes))
  }
  if (freqBuf?.length !== a.frequencyBinCount) {
    const b = a.frequencyBinCount * Uint8Array.BYTES_PER_ELEMENT
    freqBuf = new Uint8Array(new ArrayBuffer(b))
  }
  return { time: timeBuf, freq: freqBuf }
}

/**
 * Maps analyser data to a frame. `tonalHint` blends monophonic pitch (when
 * clear) with spectral centroid — melody reads in colour; chords may smear.
 * Level uses a slow-decay peak tracker + EMA.
 */
export function readFeatureFrame(analyser: AnalyserNode, t: number): FeatureFrame {
  const { time, freq } = buffersFor(analyser)
  analyser.getFloatTimeDomainData(time)
  let sum = 0
  for (const s of time) {
    sum += s * s
  }
  const rms = Math.sqrt(sum / time.length)

  const peakDecay = reducedMotionPref ? 0.996 : 0.992
  levelPeak = Math.max(rms, levelPeak * peakDecay)
  const rawLevel = Math.min(1, (rms / (levelPeak + 1e-5)) * 1.12)

  analyser.getByteFrequencyData(freq)
  let weight = 0
  let acc = 0
  for (const [i, v] of freq.entries()) {
    acc += v * i
    weight += v
  }
  const bins = Math.max(1, freq.length - 1)
  const centroid = weight > 0 ? acc / weight / bins : 0.5

  const voiceGate = 0.01
  if (rms < voiceGate) {
    lastPitch01 = null
  } else if ((t & 1) === 0) {
    const p = estimateLogPitch01(time, analyser.context.sampleRate)
    if (p !== null) {
      lastPitch01 = p
    }
  }

  const rawTonal =
    lastPitch01 === null
      ? centroid
      : 0.52 * lastPitch01 + 0.48 * centroid

  const aL = reducedMotionPref ? 0.12 : 0.24
  const aT = reducedMotionPref ? 0.06 : 0.16
  smoothLevel = aL * rawLevel + (1 - aL) * smoothLevel
  smoothTonal = aT * rawTonal + (1 - aT) * smoothTonal

  return { level: smoothLevel, tonalHint: smoothTonal, t }
}

/** Idle stage motion when no mic / graph. */
export function stubFeatureFrame(t: number): FeatureFrame {
  const w = t * 0.035
  return {
    level: 0.1 + 0.06 * Math.sin(w),
    tonalHint: 0.45 + 0.06 * Math.sin(w * 0.65 + 0.3),
    t,
  }
}
