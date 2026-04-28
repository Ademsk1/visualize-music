import { describe, expect, it } from 'vitest'
import {
  accumulateChromaFromFloatSpectrum,
  CHROMA_SIZE,
  rmsToDbfs,
} from './chroma'

describe('accumulateChromaFromFloatSpectrum', () => {
  it('maps A4 energy into a single pitch-class bin (with energy)', () => {
    const n = 1024
    const out = new Float32Array(CHROMA_SIZE)
    const sr = 48_000
    const floatDb = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const f = ((i + 0.5) / n) * (sr / 2)
      if (f > 420 && f < 460) {
        floatDb[i] = -20
      } else {
        floatDb[i] = -80
      }
    }
    accumulateChromaFromFloatSpectrum(floatDb, sr, out)
    const maxI = out.indexOf(Math.max(...out))
    expect(out[maxI]!).toBeGreaterThan(0)
  })
})

describe('rmsToDbfs', () => {
  it('is negative for small RMS', () => {
    expect(rmsToDbfs(0.01)).toBeCloseTo(-40, 0)
  })
})
