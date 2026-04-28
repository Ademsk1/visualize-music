export type ScoredFundamental = { readonly f0Hz: number; readonly score: number }

export function pitchClassCandidates(
  f0s: readonly ScoredFundamental[],
  tuningCents = 0,
  /** Equal-temperament reference for MIDI note 69 (A4). Default 440 Hz. */
  referenceA4Hz = 440
): Array<{ pc: number; conf: number }> {
  if (!Array.isArray(f0s) || f0s.length === 0) return []
  if (!Number.isFinite(tuningCents)) tuningCents = 0
  if (!Number.isFinite(referenceA4Hz) || referenceA4Hz <= 0) referenceA4Hz = 440

  let maxScore = 0
  for (const x of f0s) {
    if (!x) continue
    const s = Number.isFinite(x.score) ? x.score : 0
    if (s > maxScore) maxScore = s
  }
  if (!(maxScore > 0)) maxScore = 1

  const centsMult = Math.pow(2, -tuningCents / 1200)
  const bestByPc = new Map<number, number>()

  for (const x of f0s) {
    if (!x) continue
    const f = Number.isFinite(x.f0Hz) ? x.f0Hz : 0
    if (!(f > 0)) continue
    const score = Number.isFinite(x.score) ? x.score : 0
    const confRaw = score / maxScore
    const conf = Math.max(0, Math.min(1, confRaw))

    const tunedHz = f * centsMult
    const midi = 69 + 12 * Math.log2(tunedHz / referenceA4Hz)
    if (!Number.isFinite(midi)) continue
    let pc = Math.round(midi) % 12
    if (pc < 0) pc += 12

    const prev = bestByPc.get(pc) ?? 0
    if (conf > prev) bestByPc.set(pc, conf)
  }

  const out: Array<{ pc: number; conf: number }> = []
  for (const [pc, conf] of bestByPc) out.push({ pc, conf })
  out.sort((a, b) => b.conf - a.conf || a.pc - b.pc)
  return out
}

export type PitchClassSmootherOptions = {
  /** Faster response when a pitch-class appears. */
  readonly alphaUp?: number
  /** Slower decay when a pitch-class disappears briefly. */
  readonly alphaDown?: number
  /** Minimum smoothed confidence to keep a pitch class present. */
  readonly minConf?: number
  /** Max pitch classes to return after smoothing. */
  readonly topK?: number
}

export class PitchClassSmoother {
  private readonly alphaUp: number
  private readonly alphaDown: number
  private readonly minConf: number
  private readonly topK: number
  private readonly state = new Float32Array(12)

  constructor(opts: PitchClassSmootherOptions = {}) {
    this.alphaUp = clamp01(opts.alphaUp ?? 0.55)
    this.alphaDown = clamp01(opts.alphaDown ?? 0.18)
    this.minConf = clamp01(opts.minConf ?? 0.32)
    this.topK = clampInt(opts.topK ?? 4, 1, 12)
  }

  reset(): void {
    this.state.fill(0)
  }

  update(
    cands: readonly { pc: number; conf: number }[]
  ): Array<{ pc: number; conf: number }> {
    const next = new Float32Array(12)
    for (const c of cands) {
      if (!c) continue
      const pc = clampInt(c.pc, 0, 11)
      const conf = clamp01(c.conf)
      if (conf > next[pc]!) next[pc] = conf
    }

    for (let pc = 0; pc < 12; pc++) {
      const cur = this.state[pc] ?? 0
      const target = next[pc] ?? 0
      const a = target >= cur ? this.alphaUp : this.alphaDown
      this.state[pc] = cur + (target - cur) * a
    }

    const out: Array<{ pc: number; conf: number }> = []
    for (let pc = 0; pc < 12; pc++) {
      const conf = this.state[pc] ?? 0
      if (conf >= this.minConf) out.push({ pc, conf })
    }
    out.sort((a, b) => b.conf - a.conf || a.pc - b.pc)
    return out.slice(0, this.topK)
  }
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(1, v))
}

function clampInt(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo
  return Math.max(lo, Math.min(hi, Math.trunc(v)))
}

