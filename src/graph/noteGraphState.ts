import { CHROMA_SIZE } from '../audio/chroma'
import { rmsToDbfs } from '../audio/chroma'

export const FOCUS_DEBOUNCE_S = 0.2
/** Exponential falloff: brightness halves every N focus-change (note) events. */
export const BRIGHTNESS_HALF_LIFE_NOTES = 5
const MIN_NODE_SEP = 0.96
const NEW_NODE_SHELL_BASE = 1.9
const NEW_NODE_TRY = 48
/** World units / second: slow migration of nodes over time. */
export const DRIFT_SPEED_UNITS_PER_S = 0.12
/** Reduced-motion multiplier for drift. */
export const DRIFT_REDUCED_MOTION_MULT = 0.15

const LAMBDA = Math.LN2 / BRIGHTNESS_HALF_LIFE_NOTES
const BRIGHTNESS_FLOOR = 0.04

type Vec3 = { x: number; y: number; z: number }

function vecLen(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z)
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function dist(a: Vec3, b: Vec3): number {
  return vecLen(sub(b, a))
}

function tryPlaceNode(existing: readonly Vec3[], n: number): Vec3 {
  if (n === 0) return { x: 0, y: 0, z: 0 }
  const r = NEW_NODE_SHELL_BASE * Math.cbrt(1 + n * 0.12)
  for (let t = 0; t < NEW_NODE_TRY; t++) {
    const u = (Math.random() * 0.4 + 0.8) * 2 * Math.random() * Math.PI
    const v = Math.random() * Math.PI
    const x = r * Math.sin(v) * Math.cos(u)
    const y = r * Math.cos(v) * 0.9
    const z = r * Math.sin(v) * Math.sin(u)
    const p = { x, y, z }
    const ok = existing.every((e) => dist(p, e) >= MIN_NODE_SEP)
    if (ok) return p
  }
  const i = n
  const phi = (i * 2.39996) % (2 * Math.PI)
  const yy = 1 - (2 * (i + 0.5)) / Math.max(10, 12)
  const rad = r * 0.92
  return {
    x: rad * Math.sqrt(1 - yy * yy) * Math.cos(phi),
    y: r * 0.35 * yy,
    z: rad * Math.sqrt(1 - yy * yy) * Math.sin(phi),
  }
}

export type GraphNodeSnapshot = {
  readonly pitchClass: number
  readonly position: Vec3
  /** 0..1, focus node always 1. */
  readonly brightness: number
  readonly isFocus: boolean
  readonly isInitialSphere: boolean
}

export type GraphEdgeSnapshot = {
  readonly a: number
  readonly b: number
  readonly from: Vec3
  readonly to: Vec3
  readonly tCreate: number
}

export type GraphViewSnapshot = {
  readonly focusPitchClass: number | null
  readonly centroid: Vec3
  readonly contentRadius: number
  readonly didRevisit: boolean
  readonly nodes: readonly GraphNodeSnapshot[]
  readonly edges: readonly GraphEdgeSnapshot[]
}

type InternalEdge = { a: number; b: number; t: number }

/**
 * One pitch-class graph: debounced focus, one sphere per (octave-agnostic) class, strands on first visit.
 */
export class NoteGraphModel {
  private focus: number | null = null
  private lastChangeAt = 0
  private globalEventIndex = 0
  private lastFocusEvent = new Map<number, number>()
  private positions = new Map<number, Vec3>()
  private hasAssignedFirst = false
  private edges: InternalEdge[] = []
  private _didRevisit = false
  private initialSpherePc: number | null = null
  private edgeSerial = 0
  private driftDir: Vec3 | null = null
  private driftStartS = 0

  reset(): void {
    this.focus = null
    this.lastChangeAt = 0
    this.globalEventIndex = 0
    this.lastFocusEvent.clear()
    this.positions.clear()
    this.hasAssignedFirst = false
    this.edges = []
    this._didRevisit = false
    this.initialSpherePc = null
    this.edgeSerial = 0
    this.driftDir = null
    this.driftStartS = 0
  }

  private ensureDrift(nowS: number): void {
    if (this.driftDir) return
    // Random unit-ish vector, with a mild bias to “forward” so it reads cinematic.
    let x = Math.random() * 2 - 1
    let y = (Math.random() * 2 - 1) * 0.35
    let z = 0.6 + Math.random() * 0.9
    const l = Math.hypot(x, y, z) || 1
    x /= l
    y /= l
    z /= l
    this.driftDir = { x, y, z }
    this.driftStartS = nowS
  }

  private driftOffset(nowS: number, reducedMotion: boolean): Vec3 {
    if (!this.driftDir) return { x: 0, y: 0, z: 0 }
    const dt = Math.max(0, nowS - this.driftStartS)
    const mult = reducedMotion ? DRIFT_REDUCED_MOTION_MULT : 1
    const s = DRIFT_SPEED_UNITS_PER_S * mult * dt
    return { x: this.driftDir.x * s, y: this.driftDir.y * s, z: this.driftDir.z * s }
  }

  private pickFocus(chroma: Float32Array): number | null {
    let m = 0
    for (const v of chroma) {
      if (v > m) m = v
    }
    if (m < 1e-9) return null
    const rel = 0.32
    let best = -1
    let bestE = 0
    for (let i = 0; i < CHROMA_SIZE; i++) {
      const e = chroma[i] ?? 0
      if (e < m * rel) continue
      if (e > bestE) {
        bestE = e
        best = i
      }
    }
    if (best < 0) return null
    return best
  }

  /**
   * @param rms - time-domain RMS
   * @param minDbfs - user gate (dBFS, negative)
   * @param nowS - `performance.now() * 0.001`
   */
  update(
    nowS: number,
    chroma: Float32Array,
    rms: number,
    minDbfs: number,
    opts: { readonly reducedMotion?: boolean } = {}
  ): GraphViewSnapshot {
    this._didRevisit = false
    if (rmsToDbfs(rms) < minDbfs) {
      return this.buildSnapshot(nowS, opts.reducedMotion ?? false)
    }
    const cand = this.pickFocus(chroma)
    if (cand === null) {
      return this.buildSnapshot(nowS, opts.reducedMotion ?? false)
    }
    if (this.focus !== null && this.focus === cand) {
      return this.buildSnapshot(nowS, opts.reducedMotion ?? false)
    }
    if (this.focus !== null && nowS - this.lastChangeAt < FOCUS_DEBOUNCE_S) {
      return this.buildSnapshot(nowS, opts.reducedMotion ?? false)
    }
    this.applyFocusChange(cand, nowS)
    return this.buildSnapshot(nowS, opts.reducedMotion ?? false)
  }

  private applyFocusChange(next: number, nowS: number): void {
    const from = this.focus
    this.lastChangeAt = nowS
    this.globalEventIndex++
    this.focus = next
    this.lastFocusEvent.set(next, this.globalEventIndex)

    if (!this.hasAssignedFirst) {
      this.hasAssignedFirst = true
      this.ensureDrift(nowS)
      this.positions.set(next, { x: 0, y: 0, z: 0 })
      this.initialSpherePc = next
      this._didRevisit = false
      return
    }
    if (this.positions.has(next)) {
      this._didRevisit = true
      return
    }
    const list = Array.from(this.positions.values())
    const n = this.positions.size
    const p = tryPlaceNode(list, n)
    this.positions.set(next, p)
    this._didRevisit = false
    if (from !== null && this.positions.has(from)) {
      this.edges.push({
        a: from,
        b: next,
        t: this.edgeSerial++,
      })
    }
  }

  private brightnessFor(pc: number, isFocus: boolean): number {
    if (isFocus) return 1
    const lastE = this.lastFocusEvent.get(pc) ?? 0
    const n = this.globalEventIndex - lastE
    return Math.min(
      1,
      BRIGHTNESS_FLOOR +
        (1 - BRIGHTNESS_FLOOR) * Math.exp(-LAMBDA * Math.max(0, n))
    )
  }

  private buildSnapshot(nowS: number, reducedMotion: boolean): GraphViewSnapshot {
    if (!this.hasAssignedFirst) {
      return {
        focusPitchClass: null,
        centroid: { x: 0, y: 0, z: 0 },
        contentRadius: 0.3,
        didRevisit: this._didRevisit,
        nodes: [
          {
            pitchClass: -1,
            position: { x: 0, y: 0, z: 0 },
            brightness: 0.5,
            isFocus: false,
            isInitialSphere: true,
          },
        ],
        edges: [],
      }
    }

    const off = this.driftOffset(nowS, reducedMotion)

    const centroid: Vec3 = { x: 0, y: 0, z: 0 }
    for (const p of this.positions.values()) {
      centroid.x += p.x
      centroid.y += p.y
      centroid.z += p.z
    }
    const k = this.positions.size
    if (k > 0) {
      centroid.x /= k
      centroid.y /= k
      centroid.z /= k
    }
    let maxD = 0.25
    for (const p of this.positions.values()) {
      maxD = Math.max(maxD, dist(p, centroid))
    }
    const nodes: GraphNodeSnapshot[] = []
    for (const [pc, p] of this.positions) {
      const f = this.focus === pc
      nodes.push({
        pitchClass: pc,
        position: { x: p.x + off.x, y: p.y + off.y, z: p.z + off.z },
        brightness: this.brightnessFor(pc, f),
        isFocus: f,
        isInitialSphere: this.initialSpherePc === pc,
      })
    }
    nodes.sort((a, b) => a.pitchClass - b.pitchClass)
    return {
      focusPitchClass: this.focus,
      centroid: { x: centroid.x + off.x, y: centroid.y + off.y, z: centroid.z + off.z },
      contentRadius: maxD,
      didRevisit: this._didRevisit,
      nodes,
      edges: this.edges
        .map((e) => {
          const a = this.positions.get(e.a)
          const b = this.positions.get(e.b)
          if (!a || !b) return null
          return {
            a: e.a,
            b: e.b,
            from: { x: a.x + off.x, y: a.y + off.y, z: a.z + off.z },
            to: { x: b.x + off.x, y: b.y + off.y, z: b.z + off.z },
            tCreate: e.t,
          }
        })
        .filter((x): x is GraphEdgeSnapshot => x !== null),
    }
  }
}
