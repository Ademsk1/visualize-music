import { describe, expect, it } from 'vitest'
import {
  bassBackgroundClearTarget,
  lerpBassBackgroundClear,
  TONED_BLACK_CLEAR,
} from './bassBackgroundClear'
import type { FeatureFrame } from '../types/featureFrame'

const frameDefaults: Pick<FeatureFrame, 'level' | 't' | 'tonalHint'> = {
  level: 0.1,
  tonalHint: 0.5,
  t: 0,
}

function frame(
  overrides: Partial<FeatureFrame> & Pick<FeatureFrame, 'level' | 't' | 'tonalHint'>
): FeatureFrame {
  return { ...frameDefaults, ...overrides }
}

describe('bassBackgroundClearTarget', () => {
  it('uses toned black for high register (MIDI & middle C+)', () => {
    const f = frame({
      level: 0.2,
      tonalHint: 0.5,
      t: 1,
      pitchClassHint: 0,
      pitchClassConf: 0.5,
      bassTilt01: 0.5,
      midiNoteMonophonic: 65,
    })
    expect(bassBackgroundClearTarget(f)).toBe(TONED_BLACK_CLEAR)
  })

  it('uses toned black when level is too low', () => {
    const f = frame({
      level: 0.01,
      tonalHint: 0.5,
      t: 1,
      pitchClassHint: 0,
      pitchClassConf: 0.5,
      bassTilt01: 0.2,
    })
    expect(bassBackgroundClearTarget(f)).toBe(TONED_BLACK_CLEAR)
  })

  it('tints in bass register (MIDI) even when bassTilt01 is mid (not only bottom octaves)', () => {
    const f = frame({
      level: 0.2,
      tonalHint: 0.5,
      t: 1,
      pitchClassHint: 2,
      pitchClassConf: 0.5,
      // ~MIDI 50 on the 21..64 key map: old bug required tilt < 0.48 and failed here.
      bassTilt01: 0.67,
      midiNoteMonophonic: 50,
    })
    const a = bassBackgroundClearTarget(f)
    expect(a).not.toBe(TONED_BLACK_CLEAR)
  })

  it('tints from bassTilt01 alone when monophonic conf maps into low keys (no MIDI in frame)', () => {
    const f = frame({
      level: 0.25,
      tonalHint: 0.5,
      t: 1,
      pitchClassHint: 4,
      pitchClassConf: 0.4,
      bassTilt01: 0.55,
    })
    expect(bassBackgroundClearTarget(f)).not.toBe(TONED_BLACK_CLEAR)
  })

  it('C (pc 0) and B (pc 11) produce different clears', () => {
    const base = {
      level: 0.3,
      tonalHint: 0.5,
      t: 1,
      pitchClassConf: 0.5,
      bassTilt01: 0.15,
      midiNoteMonophonic: 40,
    }
    const c = bassBackgroundClearTarget(
      frame({ ...base, pitchClassHint: 0 })
    )
    const b = bassBackgroundClearTarget(
      frame({ ...base, pitchClassHint: 11 })
    )
    expect(c).not.toBe(b)
  })
})

describe('lerpBassBackgroundClear', () => {
  it('moves toward target', () => {
    const a = lerpBassBackgroundClear(0x0a0a0c, 0xff0000, 0.05, 8)
    expect(a).not.toBe(0x0a0a0c)
  })
})
