import { describe, expect, it } from 'vitest'
import { formatNoteReadout } from './pitchClassNames'

describe('formatNoteReadout', () => {
  it('formats poly classes above conf', () => {
    expect(
      formatNoteReadout({
        polyPitchClasses: [
          { pc: 0, conf: 0.9 },
          { pc: 4, conf: 0.8 },
        ],
      })
    ).toBe('C · E')
  })

  it('falls back to monophonic hint', () => {
    expect(
      formatNoteReadout({ pitchClassHint: 9, pitchClassConf: 0.5 })
    ).toBe('A')
  })

  it('returns em dash when empty', () => {
    expect(formatNoteReadout({})).toBe('—')
  })
})
