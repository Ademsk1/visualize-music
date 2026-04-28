import { describe, expect, it } from 'vitest'
import { logPitch01FromHz } from './pitchLogRange'
import {
  bassTilt01FromFloatDbSpectrum,
  bassTilt01WithLowKeyboard,
  LOW_KEY_MIDI_HI,
  LOW_KEY_MIDI_LO,
} from './bassTilt'

describe('bassTilt01FromFloatDbSpectrum', () => {
  it('returns ~0.5 for a flat spectrum (neutral steering)', () => {
    const n = 64
    const ff = new Float32Array(n)
    ff.fill(-50)
    const t = bassTilt01FromFloatDbSpectrum(ff, 48_000)
    expect(t).toBeGreaterThan(0.35)
    expect(t).toBeLessThan(0.65)
  })

  it('is higher when the lowest bins are much louder than the rest', () => {
    const n = 64
    const ff = new Float32Array(n)
    ff.fill(-90)
    for (let i = 0; i < 10; i++) ff[i] = -30
    const tHot = bassTilt01FromFloatDbSpectrum(ff, 48_000)
    const flat = new Float32Array(n)
    flat.fill(-50)
    const tFlat = bassTilt01FromFloatDbSpectrum(flat, 48_000)
    expect(tHot).toBeGreaterThan(tFlat)
  })
})

describe('bassTilt01WithLowKeyboard', () => {
  const a4 = 440
  const baseline = 0.62

  it('uses spectral baseline when confidence is low', () => {
    const p = logPitch01FromHz(261.63) // C4
    expect(bassTilt01WithLowKeyboard(baseline, p, 0.2, a4)).toBe(baseline)
  })

  it('maps lower-half keys to a spread 0..1 (C2 vs C3 differ)', () => {
    const pC2 = logPitch01FromHz(65.41) // C2
    const pC3 = logPitch01FromHz(130.81) // C3
    const t2 = bassTilt01WithLowKeyboard(baseline, pC2, 0.9, a4)
    const t3 = bassTilt01WithLowKeyboard(baseline, pC3, 0.9, a4)
    expect(Math.abs(t2 - t3)).toBeGreaterThan(0.2)
  })

  it('returns 0.5 for notes above the lower range (e.g. C6)', () => {
    const pC6 = logPitch01FromHz(1046.5)
    expect(bassTilt01WithLowKeyboard(baseline, pC6, 0.9, a4)).toBe(0.5)
  })

  it('is neutral at the top of the low keyboard (E4, MIDI 64)', () => {
    const f = 329.63 // E4
    const p = logPitch01FromHz(f)
    const t = bassTilt01WithLowKeyboard(baseline, p, 0.9, a4)
    expect(t).toBeCloseTo(1, 2)
  })

  it('documents the inclusive MIDI window', () => {
    expect(LOW_KEY_MIDI_LO).toBe(21)
    expect(LOW_KEY_MIDI_HI).toBe(64)
  })
})
