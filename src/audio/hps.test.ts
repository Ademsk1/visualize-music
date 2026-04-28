import { describe, expect, it } from 'vitest'
import { hpsDetectFundamentals } from './hps'

function setPeak(spec: Float32Array, bin: number, amp: number) {
  if (bin >= 0 && bin < spec.length) spec[bin] = Math.max(spec[bin] ?? 0, amp)
}

function addHarmonicSeries(
  spec: Float32Array,
  f0Hz: number,
  amp: number,
  sampleRate: number,
  fftSize: number,
  harmonics: number
) {
  const hzPerBin = sampleRate / fftSize
  const baseBin = Math.round(f0Hz / hzPerBin)
  for (let h = 1; h <= harmonics; h++) {
    setPeak(spec, baseBin * h, amp / h)
  }
}

describe('hpsDetectFundamentals', () => {
  it('returns [] on invalid inputs', () => {
    const out = hpsDetectFundamentals(new Float32Array(0), 48_000, 2048)
    expect(out).toEqual([])
  })

  it('finds a single fundamental on synthetic harmonic spectrum', () => {
    const sr = 48_000
    const fftSize = 2048
    const half = fftSize / 2
    const spec = new Float32Array(half)
    addHarmonicSeries(spec, 261.63, 1.0, sr, fftSize, 7)

    const out = hpsDetectFundamentals(spec, sr, fftSize, {
      topK: 1,
      harmonicCount: 6,
      minHz: 60,
      maxHz: 1200,
      peakFloor: 0.05,
    })
    expect(out.length).toBe(1)
    expect(out[0]!.f0Hz).toBeGreaterThan(240)
    expect(out[0]!.f0Hz).toBeLessThan(290)
    expect(out[0]!.score).toBeGreaterThan(0)
  })

  it('finds two fundamentals for a two-note chord and does not pick a harmonic as the second', () => {
    const sr = 48_000
    const fftSize = 2048
    const half = fftSize / 2
    const spec = new Float32Array(half)
    addHarmonicSeries(spec, 261.63, 1.0, sr, fftSize, 7) // C4
    addHarmonicSeries(spec, 329.63, 0.9, sr, fftSize, 7) // E4

    const out = hpsDetectFundamentals(spec, sr, fftSize, {
      topK: 2,
      harmonicCount: 6,
      minHz: 60,
      maxHz: 1200,
      peakFloor: 0.05,
      suppression: 0.15,
    })
    expect(out.length).toBe(2)
    const f0s = out.map((x) => x.f0Hz)
    // Presence checks with generous tolerance (FFT binning).
    const hasC = f0s.some((f) => f > 240 && f < 290)
    const hasE = f0s.some((f) => f > 300 && f < 360)
    expect(hasC).toBe(true)
    expect(hasE).toBe(true)
  })
})

