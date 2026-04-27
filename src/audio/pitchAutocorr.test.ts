import { describe, expect, it } from 'vitest'
import { estimateLogPitch01 } from './pitchAutocorr'

function sineBuffer(
  length: number,
  sampleRate: number,
  frequencyHz: number
): Float32Array {
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    out[i] = 0.4 * Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate)
  }
  return out
}

describe('estimateLogPitch01', () => {
  it('returns a mid-range 0..1 for A4 (roughly) at 48 kHz', () => {
    const sr = 48_000
    const p = estimateLogPitch01(sineBuffer(512, sr, 440), sr)
    expect(p).not.toBeNull()
    expect(p!).toBeGreaterThan(0.35)
    expect(p!).toBeLessThan(0.7)
  })

  it('returns a value in 0..1 for another test tone (bounded & stable)', () => {
    const p = estimateLogPitch01(sineBuffer(512, 48_000, 330), 48_000)
    expect(p).not.toBeNull()
    expect(p!).toBeGreaterThanOrEqual(0)
    expect(p!).toBeLessThanOrEqual(1)
  })

  it('returns null for near-silence', () => {
    const buf = new Float32Array(512)
    expect(estimateLogPitch01(buf, 48_000)).toBeNull()
  })
})
