import {
  bassTilt01FromFloatDbSpectrum,
  bassTilt01WithLowKeyboard,
} from './bassTilt'
import { freqFromLogPitch01, midiFromHz } from './pitchLogRange'
import {
  accumulateChromaFromFloatSpectrum,
  floatFreqDbToLinear,
} from './chroma'
import type { FeatureFrame } from '../types/featureFrame'
import { estimateLogPitch01WithConfidence } from './pitchAutocorr'
import { dropLikelyHarmonicOvertones } from './harmonicPrune'
import { hpsDetectFundamentals } from './hps'
import {
  PitchClassSmoother,
  pitchClassCandidates,
} from './pitchClassCandidates'

let timeBuf: Float32Array<ArrayBuffer> | null = null
let freqBuf: Uint8Array<ArrayBuffer> | null = null
let floatFreq: Float32Array<ArrayBuffer> | null = null

/** Smoothed outputs + peak follower for level (adaptive dynamics). */
let smoothLevel = 0
let smoothTonal = 0.5
let levelPeak = 0.0001

let reducedMotionPref = false

/** Last monophonic pitch blend; cleared when quiet. */
let lastPitch01: number | null = null
let lastPitchConf = 0
let lastPitchClass: number | null = null

let polySmoother = new PitchClassSmoother({
  alphaUp: 0.5,
  alphaDown: 0.22,
  minConf: 0.3,
  topK: 4,
})
let linFreqScratch: Float32Array<ArrayBuffer> | null = null

/** Equal-temperament A4 in Hz for pitch-class labels (monophonic + poly). */
let referenceA4Hz = 440

export function setFeatureTuningA4Hz(hz: number) {
  if (!Number.isFinite(hz) || hz <= 0) {
    referenceA4Hz = 440
    return
  }
  referenceA4Hz = Math.min(480, Math.max(400, hz))
}

export function setFeatureReducedMotion(value: boolean) {
  reducedMotionPref = value
}

export function resetFeatureSmoothing() {
  smoothLevel = 0
  smoothTonal = 0.5
  levelPeak = 0.0001
  lastPitch01 = null
  lastPitchConf = 0
  lastPitchClass = null
  polySmoother = new PitchClassSmoother({
    alphaUp: 0.5,
    alphaDown: 0.22,
    minConf: 0.3,
    topK: 4,
  })
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0
  return Math.min(1, Math.max(0, x))
}

/** In-place; helps HPS peak floor work across different input gains. */
function normalizeLinearSpectrumMax(a: Float32Array): void {
  let m = 0
  for (let i = 0; i < a.length; i++) {
    const v = a[i] ?? 0
    if (v > m) m = v
  }
  if (m <= 1e-15) return
  const inv = 1 / m
  for (let i = 0; i < a.length; i++) a[i] = (a[i] ?? 0) * inv
}

function pitchClassFromPitch01(pitch01: number): number | null {
  if (!Number.isFinite(pitch01)) return null
  const f = freqFromLogPitch01(pitch01)
  if (!Number.isFinite(f) || f <= 0) return null
  const ref = referenceA4Hz > 0 && Number.isFinite(referenceA4Hz) ? referenceA4Hz : 440
  const midi = Math.round(69 + 12 * Math.log2(f / ref))
  const pc = ((midi % 12) + 12) % 12
  return pc
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
  if (floatFreq?.length !== a.frequencyBinCount) {
    const b = a.frequencyBinCount * Float32Array.BYTES_PER_ELEMENT
    floatFreq = new Float32Array(new ArrayBuffer(b))
  }
  return { time: timeBuf, freq: freqBuf, floatFreq: floatFreq }
}

/**
 * Maps analyser data to a frame. `tonalHint` blends monophonic pitch (when
 * clear) with spectral centroid — melody reads in colour; chords may smear.
 * Level uses a slow-decay peak tracker + EMA.
 */
export function readFeatureFrame(
  analyser: AnalyserNode,
  t: number,
  chromaOut: Float32Array | null = null
): { frame: FeatureFrame; rms: number } {
  const { time, freq, floatFreq: ff } = buffersFor(analyser)
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
    lastPitchConf = 0
    lastPitchClass = null
  } else if ((t & 1) === 0) {
    const r = estimateLogPitch01WithConfidence(time, analyser.context.sampleRate)
    if (r !== null) {
      lastPitch01 = r.pitch01
      // Normalize raw confidence into 0..1-ish for downstream.
      lastPitchConf = clamp01(r.conf / 0.35)
      lastPitchClass = pitchClassFromPitch01(r.pitch01)
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

  let polyPitch: Array<{ readonly pc: number; readonly conf: number }> | undefined
  let bassTilt01: number | undefined

  if (chromaOut) {
    analyser.getFloatFrequencyData(ff)
    const spectralTilt = bassTilt01FromFloatDbSpectrum(
      ff,
      analyser.context.sampleRate
    )
    bassTilt01 = bassTilt01WithLowKeyboard(
      spectralTilt,
      lastPitch01,
      lastPitchConf,
      referenceA4Hz
    )
    accumulateChromaFromFloatSpectrum(
      ff,
      analyser.context.sampleRate,
      chromaOut
    )

    if (rms < voiceGate) {
      polySmoother.update([])
    } else {
      const n = ff.length
      if (linFreqScratch?.length !== n) {
        const bytes = n * Float32Array.BYTES_PER_ELEMENT
        linFreqScratch = new Float32Array(new ArrayBuffer(bytes))
      }
      const lin = linFreqScratch
      for (let i = 0; i < n; i++) {
        lin[i] = floatFreqDbToLinear(ff[i] ?? 0)
      }
      normalizeLinearSpectrumMax(lin)
      const sr = analyser.context.sampleRate
      const fftSize = analyser.fftSize
      const raw = hpsDetectFundamentals(lin, sr, fftSize, {
        topK: 4,
        harmonicCount: 6,
        minHz: 70,
        maxHz: 1600,
        // Spectrum is max-normalized to ~1; floor rejects noise-only bins.
        peakFloor: 0.04,
        // Stronger suppression so a single note does not leave multiple fundamentals.
        suppression: 0.07,
      })
      const pruned = dropLikelyHarmonicOvertones(raw)
      const cands = pitchClassCandidates(
        pruned.map((x) => ({ f0Hz: x.f0Hz, score: x.score })),
        0,
        referenceA4Hz
      )
      const poly = polySmoother.update(cands)
      if (poly.length > 0) polyPitch = poly
    }
  }

  const frame: FeatureFrame = { level: smoothLevel, tonalHint: smoothTonal, t }
  if (bassTilt01 !== undefined) frame.bassTilt01 = bassTilt01
  if (lastPitchClass !== null && lastPitchConf >= 0.35) {
    frame.pitchClassHint = lastPitchClass
    frame.pitchClassConf = lastPitchConf
    if (lastPitch01 != null) {
      const hz = freqFromLogPitch01(lastPitch01)
      frame.midiNoteMonophonic = Math.round(midiFromHz(hz, referenceA4Hz))
    }
  }
  if (polyPitch) frame.polyPitchClasses = polyPitch
  return { frame, rms }
}

/** Idle stage motion when no mic / graph. */
export function stubFeatureFrame(t: number): { frame: FeatureFrame; rms: number } {
  const w = t * 0.035
  return {
    frame: {
      level: 0.1 + 0.06 * Math.sin(w),
      tonalHint: 0.45 + 0.06 * Math.sin(w * 0.65 + 0.3),
      bassTilt01: 0.5,
      t,
    },
    rms: 0.0004,
  }
}
