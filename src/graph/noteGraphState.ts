import { CHROMA_SIZE } from '../audio/chroma'
import { rmsToDbfs } from '../audio/chroma'

export const FOCUS_DEBOUNCE_S = 0
export const NOTE_EVENT_DEBOUNCE_S = 0
/** Include poly pitch classes in a chord note event when conf is at least this. */
export const POLY_EVENT_MIN_CONF = 0.22
/**
 * When monophonic pitch (autocorr) is this confident or above, emit a single
 * pitch class for the note event so harmonics from HPS do not spawn extra nodes.
 */
export const MONO_PITCH_CONF_SPAWN = 0.48
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
  /** Onset-style note event: one or more pitch classes (chords). */
  readonly noteEvent: {
    readonly pitchClasses: readonly number[]
    readonly id: number
  } | null
  readonly centroid: Vec3
  readonly contentRadius: number
  readonly didRevisit: boolean
  readonly nodes: readonly GraphNodeSnapshot[]
  readonly edges: readonly GraphEdgeSnapshot[]
}

type InternalEdge = { a: number; b: number; t: number }

/**
 * One pitch-class graph: hysteresis-stabilized focus, one sphere per (octave-agnostic) class, strands on first visit.
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

  // Focus stabilization + onset events.
  private pendingFocus: number | null = null
  private pendingSinceS = 0
  private lastOnsetAtS = 0
  private lastNoteEventAtS = 0
  private lastRms = 0
  private noteEventId = 0
  private driftSpeed: number | null = null
  /** Last `sustainKeyFromFrame` when sustain mode is on; cleared on quiet/reset. */
  private lastSustainKey: string | null = null

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
    this.pendingFocus = null
    this.pendingSinceS = 0
    this.lastOnsetAtS = 0
    this.lastNoteEventAtS = 0
    this.lastRms = 0
    this.noteEventId = 0
    this.driftSpeed = null
    this.lastSustainKey = null
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
    const s = (this.driftSpeed ?? DRIFT_SPEED_UNITS_PER_S) * mult * dt
    return { x: this.driftDir.x * s, y: this.driftDir.y * s, z: this.driftDir.z * s }
  }

  private pickFocus(
    chroma: Float32Array,
    hint: { readonly pc: number; readonly conf: number } | null,
    poly: readonly { readonly pc: number; readonly conf: number }[] | null
  ): number | null {
    let m = 0
    for (const v of chroma) {
      if (v > m) m = v
    }
    if (m < 1e-9) return null

    if (poly && poly.length > 0) {
      const sorted = [...poly].sort((a, b) => b.conf - a.conf || a.pc - b.pc)
      for (const p of sorted) {
        const pc = Math.max(0, Math.min(11, p.pc))
        const e = chroma[pc] ?? 0
        if (e >= m * 0.18) return pc
      }
      return Math.max(0, Math.min(11, sorted[0]!.pc))
    }

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
    if (hint && hint.conf >= 0.5) {
      const pc = Math.max(0, Math.min(11, hint.pc))
      const eh = chroma[pc] ?? 0
      // Prefer pitch-derived class if it's reasonably competitive with the chroma winner.
      if (eh >= bestE * 0.75) return pc
    }
    return best
  }

  private pitchClassesForEvent(
    cand: number,
    poly: readonly { readonly pc: number; readonly conf: number }[] | null,
    opts: { readonly pitchClassHint?: number; readonly pitchClassConf?: number }
  ): number[] {
    const polyStrong =
      poly?.filter((p) => p.conf >= POLY_EVENT_MIN_CONF).map((p) =>
        Math.max(0, Math.min(11, p.pc))
      ) ?? []
    if (polyStrong.length >= 2) {
      return [...new Set(polyStrong)].sort((a, b) => a - b)
    }
    if (
      opts.pitchClassHint != null &&
      opts.pitchClassConf != null &&
      opts.pitchClassConf >= MONO_PITCH_CONF_SPAWN
    ) {
      const pc = Math.max(0, Math.min(11, Math.round(opts.pitchClassHint)))
      return [pc]
    }
    if (poly && poly.length > 0) {
      const xs = poly
        .filter((p) => p.conf >= POLY_EVENT_MIN_CONF)
        .map((p) => Math.max(0, Math.min(11, p.pc)))
      if (xs.length > 0) return [...new Set(xs)].sort((a, b) => a - b)
    }
    return [cand]
  }

  private detectOnset(nowS: number, rms: number, sustain: boolean): boolean {
    // Simple onset: rising RMS; sustain mode uses a gentler ratio (no sharp attack).
    const minInterval = NOTE_EVENT_DEBOUNCE_S
    if (nowS - this.lastOnsetAtS < minInterval) return false
    const prev = this.lastRms || 0
    this.lastRms = rms
    const absGate = sustain ? 0.0075 : 0.012
    if (rms < absGate) return false
    if (prev <= 0) return true
    const ratio = sustain ? 1.1 : 1.45
    return rms >= prev * ratio
  }

  private canEmitNoteEvent(nowS: number, reducedMotion: boolean): boolean {
    const minInterval = reducedMotion ? NOTE_EVENT_DEBOUNCE_S * 1.2 : NOTE_EVENT_DEBOUNCE_S
    return nowS - this.lastNoteEventAtS >= minInterval
  }

  /** Hint + poly snapshot for legato / sustain (Slurred line without RMS spikes). */
  private sustainKeyFromFrame(
    cand: number,
    poly: readonly { readonly pc: number; readonly conf: number }[] | null,
    hint: { readonly pc: number; readonly conf: number } | null
  ): string {
    const pPart =
      poly && poly.length > 0
        ? [
            ...new Set(
              poly
                .filter((x) => x.conf >= POLY_EVENT_MIN_CONF)
                .map((x) => Math.max(0, Math.min(11, x.pc)))
            ),
          ]
            .sort((a, b) => a - b)
            .join('.')
        : ''
    if (hint && hint.conf >= 0.28) {
      return `h${Math.max(0, Math.min(11, hint.pc))}|${pPart}`
    }
    return `c${cand}|${pPart}`
  }

  /**
   * When sustain mode is on, emit a note when the pitch snapshot changes (new
   * slurred note) even if RMS does not jump.
   */
  private trySustainLegatoEvent(
    nowS: number,
    reducedMotion: boolean,
    cand: number,
    poly: readonly { readonly pc: number; readonly conf: number }[] | null,
    hint: { readonly pc: number; readonly conf: number } | null,
    opts: {
      readonly sustainMode?: boolean
      readonly pitchClassHint?: number
      readonly pitchClassConf?: number
    }
  ): { pitchClasses: number[]; id: number } | null {
    if (!opts.sustainMode) return null
    const key = this.sustainKeyFromFrame(cand, poly, hint)
    if (key === this.lastSustainKey) return null
    const prev = this.lastSustainKey
    this.lastSustainKey = key
    if (prev === null) return null
    if (!this.canEmitNoteEvent(nowS, reducedMotion)) {
      this.lastSustainKey = prev
      return null
    }
    this.lastNoteEventAtS = nowS
    this.lastOnsetAtS = nowS
    this.noteEventId++
    return {
      pitchClasses: this.pitchClassesForEvent(cand, poly, opts),
      id: this.noteEventId,
    }
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
    opts: {
      readonly reducedMotion?: boolean
      readonly pitchClassHint?: number
      readonly pitchClassConf?: number
      readonly polyPitchClasses?: ReadonlyArray<{
        readonly pc: number
        readonly conf: number
      }>
      readonly driftSpeedUnitsPerS?: number
      /** Legato: use pitch / softer RMS (piano with sustain). */
      readonly sustainMode?: boolean
    } = {}
  ): GraphViewSnapshot {
    this._didRevisit = false
    const reducedMotion = opts.reducedMotion ?? false
    const sustain = opts.sustainMode === true
    this.driftSpeed =
      opts.driftSpeedUnitsPerS != null && Number.isFinite(opts.driftSpeedUnitsPerS)
        ? Math.max(0, opts.driftSpeedUnitsPerS)
        : null
    if (rmsToDbfs(rms) < minDbfs) {
      this.lastRms = rms
      this.lastSustainKey = null
      return this.buildSnapshot(nowS, reducedMotion, null)
    }
    const hint =
      opts.pitchClassHint != null && opts.pitchClassConf != null
        ? { pc: opts.pitchClassHint, conf: opts.pitchClassConf }
        : null
    const poly = opts.polyPitchClasses ?? null
    const cand = this.pickFocus(chroma, hint, poly)
    if (cand === null) {
      this.lastRms = rms
      return this.buildSnapshot(nowS, reducedMotion, null)
    }

    // Emit onset events even when focus doesn't change (for repeated strikes).
    const sustainNote = this.trySustainLegatoEvent(
      nowS,
      reducedMotion,
      cand,
      poly,
      hint,
      opts
    )

    let noteEvent: { pitchClasses: number[]; id: number } | null = sustainNote
    if (this.focus !== null && this.focus === cand) {
      if (!noteEvent && this.detectOnset(nowS, rms, sustain)) {
        this.lastOnsetAtS = nowS
        if (this.canEmitNoteEvent(nowS, reducedMotion)) {
          this.lastNoteEventAtS = nowS
          this.noteEventId++
          noteEvent = {
            pitchClasses: this.pitchClassesForEvent(cand, poly, opts),
            id: this.noteEventId,
          }
        }
      }
      return this.buildSnapshot(nowS, reducedMotion, noteEvent)
    }

    // Hysteresis: prefer keeping current focus unless the new candidate is clearly stronger.
    if (this.focus !== null) {
      const eCur = chroma[this.focus] ?? 0
      const eCand = chroma[cand] ?? 0
      const switchRatio = sustain ? 1.1 : 1.25
      if (eCur > 0 && eCand < eCur * switchRatio) {
        // Require sustained advantage before switching.
        if (this.pendingFocus !== cand) {
          this.pendingFocus = cand
          this.pendingSinceS = nowS
        }
        const hold = sustain
          ? reducedMotion
            ? 0.08
            : 0.05
          : reducedMotion
            ? 0.18
            : 0.12
        if (nowS - this.pendingSinceS < hold) {
          if (!noteEvent && this.detectOnset(nowS, rms, sustain)) {
            this.lastOnsetAtS = nowS
            if (this.canEmitNoteEvent(nowS, reducedMotion)) {
              this.lastNoteEventAtS = nowS
              this.noteEventId++
              noteEvent = {
                pitchClasses: this.pitchClassesForEvent(this.focus, poly, opts),
                id: this.noteEventId,
              }
            }
          }
          return this.buildSnapshot(nowS, reducedMotion, noteEvent)
        }
      }
    }

    if (this.focus !== null && nowS - this.lastChangeAt < FOCUS_DEBOUNCE_S) {
      // Min time between focus switches (0 = off); onset can still fire.
      if (!noteEvent && this.detectOnset(nowS, rms, sustain)) {
        this.lastOnsetAtS = nowS
        if (this.canEmitNoteEvent(nowS, reducedMotion)) {
          this.lastNoteEventAtS = nowS
          this.noteEventId++
          noteEvent = {
            pitchClasses: this.pitchClassesForEvent(this.focus, poly, opts),
            id: this.noteEventId,
          }
        }
      }
      return this.buildSnapshot(nowS, reducedMotion, noteEvent)
    }
    this.applyFocusChange(cand, nowS)
    this.pendingFocus = null
    if (sustainNote) {
      noteEvent = sustainNote
    } else if (this.canEmitNoteEvent(nowS, reducedMotion)) {
      this.lastNoteEventAtS = nowS
      this.noteEventId++
      noteEvent = {
        pitchClasses: this.pitchClassesForEvent(cand, poly, opts),
        id: this.noteEventId,
      }
    }
    return this.buildSnapshot(nowS, reducedMotion, noteEvent)
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

  private buildSnapshot(
    nowS: number,
    reducedMotion: boolean,
    noteEvent: {
      readonly pitchClasses: readonly number[]
      readonly id: number
    } | null
  ): GraphViewSnapshot {
    if (!this.hasAssignedFirst) {
      return {
        focusPitchClass: null,
        noteEvent,
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
      noteEvent,
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
