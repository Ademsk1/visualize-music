import { describe, expect, it } from 'vitest'
import { NoteGraphModel, BRIGHTNESS_HALF_LIFE_NOTES } from './noteGraphState'
import { CHROMA_SIZE } from '../audio/chroma'

function chromaWith(pc: number, level = 1) {
  const c = new Float32Array(CHROMA_SIZE)
  c[pc] = level
  for (let i = 0; i < CHROMA_SIZE; i++) {
    if (i !== pc) c[i] = 0.01
  }
  return c
}

describe('NoteGraphModel', () => {
  it('assigns first pitch to center and does not add an edge', () => {
    const m = new NoteGraphModel()
    const g = m.update(0, chromaWith(3, 1), 0.05, -60)
    expect(g.nodes.length).toBe(1)
    expect(g.nodes[0]!.pitchClass).toBe(3)
    expect(g.edges.length).toBe(0)
  })

  it('adds a second node and an edge when focus changes', () => {
    const m = new NoteGraphModel()
    m.update(0, chromaWith(0, 1), 0.05, -60)
    const g2 = m.update(0.3, chromaWith(4, 1), 0.05, -60)
    expect(g2.nodes.length).toBe(2)
    expect(g2.edges.length).toBe(1)
    expect(g2.edges[0]!.a).toBe(0)
    expect(g2.edges[0]!.b).toBe(4)
  })

  it('sets didRevisit when returning to an existing class', () => {
    const m = new NoteGraphModel()
    m.update(0, chromaWith(0, 1), 0.05, -60)
    m.update(0.3, chromaWith(4, 1), 0.05, -60)
    const g3 = m.update(0.6, chromaWith(0, 1), 0.05, -60)
    expect(g3.didRevisit).toBe(true)
  })

  it('drifts positions over time (translation only)', () => {
    const m = new NoteGraphModel()
    const g0 = m.update(0, chromaWith(0, 1), 0.05, -60)
    const g1 = m.update(10, chromaWith(0, 1), 0.05, -60)
    expect(g0.nodes[0]!.position.x).not.toBe(g1.nodes[0]!.position.x)
  })

  it('honours BRIGHTNESS_HALF_LIFE_NOTES as decay constant (smoke)', () => {
    expect(BRIGHTNESS_HALF_LIFE_NOTES).toBe(5)
  })

  it('prefers all strong poly classes over monophonic hint (chord display)', () => {
    const m = new NoteGraphModel()
    const c = new Float32Array(CHROMA_SIZE)
    c[0] = 1
    c[4] = 1
    for (let i = 0; i < CHROMA_SIZE; i++) {
      if (i !== 0 && i !== 4) c[i] = 0.01
    }
    const g = m.update(0.3, c, 0.05, -60, {
      pitchClassHint: 0,
      pitchClassConf: 0.95,
      polyPitchClasses: [
        { pc: 0, conf: 0.9 },
        { pc: 4, conf: 0.85 },
      ],
    })
    expect(g.noteEvent).not.toBeNull()
    expect(g.noteEvent!.pitchClasses).toEqual([0, 4])
  })

  it('sustain mode emits a note when monophonic pitch class changes (legato)', () => {
    const m = new NoteGraphModel()
    m.update(0, chromaWith(0, 1), 0.05, -60, {
      pitchClassHint: 0,
      pitchClassConf: 0.5,
      sustainMode: true,
    })
    const g = m.update(0.05, chromaWith(2, 1), 0.051, -60, {
      pitchClassHint: 2,
      pitchClassConf: 0.5,
      sustainMode: true,
    })
    expect(g.noteEvent).not.toBeNull()
    expect(g.noteEvent!.pitchClasses).toContain(2)
  })

  it('emits a chord noteEvent with multiple pitch classes on first focus', () => {
    const m = new NoteGraphModel()
    const c = new Float32Array(CHROMA_SIZE)
    c[0] = 1
    c[4] = 1
    for (let i = 0; i < CHROMA_SIZE; i++) {
      if (i !== 0 && i !== 4) c[i] = 0.01
    }
    const g = m.update(0.3, c, 0.05, -60, {
      polyPitchClasses: [
        { pc: 0, conf: 0.9 },
        { pc: 4, conf: 0.85 },
      ],
    })
    expect(g.noteEvent).not.toBeNull()
    expect(g.noteEvent!.pitchClasses).toEqual([0, 4])
  })
})
