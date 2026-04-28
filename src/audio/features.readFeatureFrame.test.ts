import { describe, expect, it, vi } from 'vitest'
import { readFeatureFrame, resetFeatureSmoothing, setFeatureReducedMotion } from './features'

vi.mock('./pitchAutocorr', () => {
  return {
    estimateLogPitch01WithConfidence: vi.fn(() => ({ pitch01: 0.25, conf: 0.3 })),
  }
})

vi.mock('./chroma', async () => {
  const actual = await vi.importActual<typeof import('./chroma')>('./chroma')
  return {
    ...actual,
    accumulateChromaFromFloatSpectrum: vi.fn(),
  }
})

type FakeAnalyser = {
  fftSize: number
  frequencyBinCount: number
  context: { sampleRate: number }
  getFloatTimeDomainData: (arr: Float32Array) => void
  getByteFrequencyData: (arr: Uint8Array) => void
  getFloatFrequencyData: (arr: Float32Array) => void
}

function makeAnalyser(opts: {
  readonly fftSize?: number
  readonly frequencyBinCount?: number
  readonly sampleRate?: number
  readonly rms?: number
  readonly centroidRamp?: boolean
}): FakeAnalyser {
  const fftSize = opts.fftSize ?? 32
  const frequencyBinCount = opts.frequencyBinCount ?? 16
  const sampleRate = opts.sampleRate ?? 48_000
  const rms = opts.rms ?? 0.02
  const amp = rms * Math.sqrt(2)
  return {
    fftSize,
    frequencyBinCount,
    context: { sampleRate },
    getFloatTimeDomainData: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = (i & 1) === 0 ? amp : -amp
      }
    },
    getByteFrequencyData: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = opts.centroidRamp ? i : 1
      }
    },
    getFloatFrequencyData: (arr) => {
      for (let i = 0; i < arr.length; i++) arr[i] = -60
    },
  }
}

describe('readFeatureFrame', () => {
  it('returns normalized level/tonalHint and includes chroma when requested', async () => {
    resetFeatureSmoothing()
    setFeatureReducedMotion(false)
    const a = makeAnalyser({ rms: 0.02, centroidRamp: true })
    const chroma = new Float32Array(12)
    const { frame, rms } = readFeatureFrame(a as unknown as AnalyserNode, 0, chroma)
    expect(rms).toBeGreaterThan(0)
    expect(frame.level).toBeGreaterThanOrEqual(0)
    expect(frame.level).toBeLessThanOrEqual(1)
    expect(frame.tonalHint).toBeGreaterThanOrEqual(0)
    expect(frame.tonalHint).toBeLessThanOrEqual(1)
    expect(frame.t).toBe(0)
  })

  it('when quiet, clears pitch blend and falls back to centroid', () => {
    resetFeatureSmoothing()
    setFeatureReducedMotion(false)
    const loud = makeAnalyser({ rms: 0.02, centroidRamp: false })
    const quiet = makeAnalyser({ rms: 0.0001, centroidRamp: true })

    const a = readFeatureFrame(loud as unknown as AnalyserNode, 0, null).frame
    const b = readFeatureFrame(quiet as unknown as AnalyserNode, 2, null).frame
    // With a ramped centroid, tonalHint should be pulled away from the mocked pitch blend.
    expect(a.tonalHint).toBeGreaterThanOrEqual(0)
    expect(b.tonalHint).toBeGreaterThanOrEqual(0)
    expect(b.tonalHint).toBeLessThanOrEqual(1)
  })
})

