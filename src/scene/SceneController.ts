import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  SphereGeometry,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  advanceJourneyProgress,
  computeJourneyDtSeconds,
  JOURNEY_SPEED_UNITS_PER_S,
} from './journeyState'
import { JOURNEY_CONFIG } from './journeyConfig'
import {
  bassBackgroundClearTarget,
  lerpBassBackgroundClear,
  TONED_BLACK_CLEAR,
} from './bassBackgroundClear'
import { hueForTonalBucket, tonalBucketFromHint } from './tonalColor'
import { type AngularPlacementMode, thetaForPitchClass } from './angularPlacement'
import { radiusFromLevel } from './loudnessRadius'
import type { GraphViewSnapshot } from '../graph/noteGraphState'
import type { FeatureFrame } from '../types/featureFrame'

/** Capped DPR. */
const MAX_DEVICE_PIXEL_RATIO = 1.5
const BRIGHTNESS_L_BOOST = 0.22
const NODE_SCALE_BASE = 0.34
/** Lat/long segments for smooth round spheres (graph + idle). */
const SPHERE_W = 48
const SPHERE_H = 32
const TRAIL_MAX_POINTS = 5000
const BREADCRUMB_MAX = 140

// --- Journey (forward travel) ---
// Spawn nodes near the *front* of the wire segment (camera is near the front).
const JOURNEY_SPAWN_FROM_WIRE_FRONT: number = JOURNEY_CONFIG.spawnFromWireFront
const JOURNEY_WIRE_AHEAD: number = JOURNEY_CONFIG.wireAhead
const JOURNEY_WIRE_BEHIND: number = JOURNEY_CONFIG.wireBehind
/** How many 3D samples we keep to draw the path as a polyline (scale with wire arclength in journeyConfig). */
const JOURNEY_PATH_RING = 1536
/** 0–1, scales travel speed above the HUD “base” when the mix is hot (see `updateJourneyMusicEnergy`). */
const JOURNEY_ALIVE_MAX_SPEED_BONUS = 0.55
/** Multiplier on path arclength (wire) at full energy vs silence. */
const JOURNEY_ALIVE_MAX_LENGTH_BONUS = 0.5
const JOURNEY_NODE_RADIUS: number = JOURNEY_CONFIG.nodeRadius
const JOURNEY_NODE_MAX: number = JOURNEY_CONFIG.nodeMax
const JOURNEY_NODE_FADE_UNITS: number = JOURNEY_CONFIG.nodeFadeUnits
/** `FeatureFrame.level` below this counts as "no sound" for silence-based hide. */
const JOURNEY_QUIET_LEVEL = 0.022
const JOURNEY_SILENCE_SEC_BEFORE_FADE = 1
const JOURNEY_SILENCE_FADE_OUT_SEC = 0.22

const ORBIT_MIN_DISTANCE = 0.4
const ORBIT_MAX_DISTANCE = 18
const ORBIT_ZOOM_SPEED = 1.15
const ORBIT_ROTATE_SPEED = 0.8

/**
 * Additive shell local scale: outer radius of the glow in parent space
 * (matches prior MeshBasic halo).
 */
const JOURNEY_HALO_LOCAL_SCALE = 1.68

const HALO_GLOW_VERTEX = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vViewToFrag;
void main() {
  vNormalV = normalize(normalMatrix * normal);
  vec4 mvP = modelViewMatrix * vec4(position, 1.0);
  vViewToFrag = -mvP.xyz;
  gl_Position = projectionMatrix * mvP;
}
`
const HALO_GLOW_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uBaseOpacity;
varying vec3 vNormalV;
varying vec3 vViewToFrag;
void main() {
  vec3 n = normalize(vNormalV);
  vec3 v = normalize(vViewToFrag);
  float ndv = max(0.0, abs(dot(n, v)));
  // Brightest in the center of the visible disc, fall off toward the limb
  // so the glow feathers out instead of a hard silhoutte on the shell.
  float t = pow(clamp(ndv, 0.0, 1.0), 0.42);
  float a = uBaseOpacity * t;
  gl_FragColor = vec4(uColor, a);
}
`

function hashHue(pc: number): number {
  if (pc < 0) return 0.08
  // Golden step on circle so neighbours differ
  return ((pc * 0.618_033_988_749_895) % 1) as number
}

/** Soft horizontal falloff for faint background light rays. */
function createBackgroundRayMapTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 256, 0)
  g.addColorStop(0, 'rgba(255, 255, 255, 0)')
  g.addColorStop(0.4, 'rgba(248, 245, 255, 0.07)')
  g.addColorStop(0.5, 'rgba(250, 248, 255, 0.22)')
  g.addColorStop(0.6, 'rgba(248, 245, 255, 0.07)')
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 128)
  return new CanvasTexture(canvas)
}

/**
 * Owns the WebGL canvas. Call applyViz from rAF.
 */
export class SceneController {
  private readonly renderer: WebGLRenderer
  private readonly canvas: HTMLCanvasElement
  private readonly scene: Scene
  private readonly camera: PerspectiveCamera
  private readonly controls: OrbitControls
  private readonly onWheelPreventScroll: (e: WheelEvent) => void
  private readonly ambient: AmbientLight
  private readonly form: Mesh<SphereGeometry, MeshStandardMaterial>
  private readonly point: PointLight
  private readonly graphRoot: Group
  private readonly nodeGroup: Group
  private readonly edgeGroup: Group
  private readonly nodeMeshes = new Map<number, Mesh<SphereGeometry, MeshStandardMaterial>>()
  private readonly trailLine: Line<BufferGeometry, LineBasicMaterial>
  private readonly trailGeo: BufferGeometry
  private readonly trailMat: LineBasicMaterial
  private readonly trailPositions: Float32Array
  private readonly breadcrumbGroup: Group
  private readonly breadcrumbGeom: SphereGeometry
  private readonly breadcrumbMeshes: Mesh<SphereGeometry, MeshStandardMaterial>[] = []
  private lastFrameMs = 0
  private readonly reducedMotionMql: MediaQueryList
  private readonly tmpVec = new Vector3()
  private readonly tmpVec2 = new Vector3()
  /** World-space front of the path; integrated each frame along `journeyAxis` (arclength `dz`). */
  private readonly journeyTip = new Vector3(0, 0, JOURNEY_WIRE_AHEAD)
  private readonly journeyAxisTarget = new Vector3(0, 0, 1)
  private readonly axisSteerWork = new Vector3()
  private readonly basisHelper = new Vector3()
  private readonly formGeom = new SphereGeometry(0.5, SPHERE_W, SPHERE_H)
  private readonly nodeGeom = new SphereGeometry(NODE_SCALE_BASE, SPHERE_W, SPHERE_H)
  private readonly journeyNodeGeom = new SphereGeometry(NODE_SCALE_BASE, SPHERE_W, SPHERE_H)
  /** Shared low-poly shell for per-note halos (additive, larger than the core). */
  private readonly journeyHaloGeom = new SphereGeometry(NODE_SCALE_BASE, 20, 14)
  private readonly backgroundRaysGroup: Group
  private readonly backgroundRayMap: CanvasTexture
  private readonly lineMat = new LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  })

  // Journey (curved path wire: thin Line; note nodes are separate spheres)
  private readonly journeyPathWireGeo: BufferGeometry
  private readonly journeyPathMat: LineBasicMaterial
  private readonly journeyPathWire: Line<BufferGeometry, LineBasicMaterial>
  private readonly journeyPathColorWork = new Color()
  private readonly journeyPathColorCore = new Color(0.5, 0.52, 0.6)
  private readonly journeyPathColorHi = new Color(0.92, 0.95, 1.0)
  private journeyMusicEnergy = 0
  private journeyLastNoteForEnergyId = 0
  private readonly journeyPathPositions: Float32Array
  private pathWrite = 0
  private pathVertCount = 2
  private readonly pathRingPos: Float32Array
  private readonly journeyEvents: Group
  private journeyProgress = 0
  private lastJourneyMs = 0
  private lastNoteEventId = 0
  private journeyWrite = 0
  private readonly journeyNodeMeshes: Mesh<SphereGeometry, MeshStandardMaterial>[] = []
  /** Orbit: lock view along the wire tangent (no drag rotation; zoom only). */
  private journeyCameraAlignToWire = false

  private journeyCamZ = 0
  private readonly journeyAxis = new Vector3(0, 0, 1)
  private readonly journeyBasisU = new Vector3()
  private readonly journeyBasisV = new Vector3()
  private journeyRadiusSmooth: number = JOURNEY_CONFIG.loudnessRadiusMin
  private angularPlacementMode: AngularPlacementMode = 'even'
  private lastVizMode: 'idle' | 'journey' = 'idle'
  private journeySpeedUnitsPerS: number = JOURNEY_SPEED_UNITS_PER_S
  private journeySilenceAccumS = 0
  private journeySilenceHiding = false
  private journeySilenceGlobalFade = 1
  private bgClearSmoothedHex: number = TONED_BLACK_CLEAR

  constructor(
    container: HTMLElement,
    options: { readonly onContextLost?: () => void } = {}
  ) {
    this.reducedMotionMql = globalThis.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )
    this.renderer = new WebGLRenderer({ antialias: false, alpha: false })
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO)
    )
    this.renderer.setSize(container.clientWidth, container.clientHeight, false)
    this.renderer.setClearColor(TONED_BLACK_CLEAR, 1)
    this.canvas = this.renderer.domElement
    // Required for reliable pointer-drag controls (prevents browser gesture handling).
    this.canvas.style.touchAction = 'none'
    // Keep the page from scrolling when zooming the scene over the canvas.
    this.onWheelPreventScroll = (e: WheelEvent) => {
      e.preventDefault()
    }
    this.canvas.addEventListener('wheel', this.onWheelPreventScroll, {
      passive: false,
    })
    this.canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault()
        options.onContextLost?.()
      },
      false
    )
    container.appendChild(this.canvas)

    if (this.journeyAxis.lengthSq() === 0) {
      this.journeyAxis.set(0, 0, 1)
    } else {
      this.journeyAxis.normalize()
    }
    this.rebuildJourneyBasis()
    this.scene = new Scene()
    this.backgroundRayMap = createBackgroundRayMapTexture()
    this.backgroundRaysGroup = this.buildBackgroundRays(
      this.backgroundRayMap
    )
    this.scene.add(this.backgroundRaysGroup)
    this.camera = new PerspectiveCamera(45, 1, 0.1, 200)
    this.camera.position.set(0, 0, 2.5)
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.enablePan = false
    this.controls.rotateSpeed = ORBIT_ROTATE_SPEED
    this.controls.zoomSpeed = ORBIT_ZOOM_SPEED
    this.controls.minDistance = ORBIT_MIN_DISTANCE
    this.controls.maxDistance = ORBIT_MAX_DISTANCE

    this.ambient = new AmbientLight(0x7c5cff, 0.4)
    this.scene.add(this.ambient)

    const m = new MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.35,
      roughness: 0.45,
    })
    this.form = new Mesh(this.formGeom, m)
    this.scene.add(this.form)

    const pl = new PointLight(0xffffff, 1, 0, 2)
    pl.position.set(0.6, 0.8, 1.2)
    this.scene.add(pl)
    this.point = pl

    this.graphRoot = new Group()
    this.nodeGroup = new Group()
    this.edgeGroup = new Group()
    this.graphRoot.add(this.edgeGroup, this.nodeGroup)
    this.graphRoot.visible = false
    this.scene.add(this.graphRoot)

    this.breadcrumbGroup = new Group()
    this.breadcrumbGroup.visible = false
    this.breadcrumbGeom = new SphereGeometry(0.08, 18, 12)
    for (let i = 0; i < BREADCRUMB_MAX; i++) {
      const mat = new MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x000000,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 0,
      })
      const m = new Mesh(this.breadcrumbGeom, mat)
      m.visible = false
      this.breadcrumbGroup.add(m)
      this.breadcrumbMeshes.push(m)
    }
    this.scene.add(this.breadcrumbGroup)

    this.trailPositions = new Float32Array(TRAIL_MAX_POINTS * 3)
    this.trailGeo = new BufferGeometry()
    this.trailGeo.setAttribute('position', new BufferAttribute(this.trailPositions, 3))
    this.trailMat = new LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.62,
    })
    // Start with a 2-point degenerate line; drawRange grows as points are pushed.
    this.trailGeo.setDrawRange(0, 2)
    this.trailLine = new Line(this.trailGeo, this.trailMat)
    this.trailLine.visible = false
    this.scene.add(this.trailLine)

    // Journey: path as a world-space polyline; nodes + wire are not parented to a tilted group.
    this.journeyEvents = new Group()
    this.pathRingPos = new Float32Array(JOURNEY_PATH_RING * 3)
    this.journeyPathPositions = new Float32Array(JOURNEY_PATH_RING * 3)
    const start = new Vector3(0, 0, -JOURNEY_WIRE_BEHIND * 0.1)
    const end = new Vector3(0, 0, JOURNEY_WIRE_AHEAD)
    this.journeyPathPositions[0] = start.x
    this.journeyPathPositions[1] = start.y
    this.journeyPathPositions[2] = start.z
    this.journeyPathPositions[3] = end.x
    this.journeyPathPositions[4] = end.y
    this.journeyPathPositions[5] = end.z
    this.journeyPathWireGeo = new BufferGeometry()
    this.journeyPathWireGeo.setAttribute(
      'position',
      new BufferAttribute(this.journeyPathPositions, 3)
    )
    this.journeyPathWireGeo.setDrawRange(0, 2)
    this.journeyPathMat = new LineBasicMaterial({
      color: 0x9aa2b5,
      transparent: true,
      opacity: JOURNEY_CONFIG.wireOpacity,
    })
    this.journeyPathWire = new Line(this.journeyPathWireGeo, this.journeyPathMat)
    this.journeyPathWire.frustumCulled = false
    this.journeyPathWire.visible = false
    this.scene.add(this.journeyPathWire)
    this.scene.add(this.journeyEvents)

    this.applyViz(
      { level: 0.15, tonalHint: 0.5, t: 0 },
      null,
      { live: false }
    )
    this.render()
  }

  setSize(w: number, h: number) {
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  private updateBackgroundClear(f: FeatureFrame, dtSeconds: number) {
    const target = bassBackgroundClearTarget(f)
    const dt = Number.isFinite(dtSeconds) ? Math.max(0, dtSeconds) : 0.016
    this.bgClearSmoothedHex = lerpBassBackgroundClear(
      this.bgClearSmoothedHex,
      target,
      dt
    )
    this.renderer.setClearColor(this.bgClearSmoothedHex, 1)
  }

  private applyFrameOnly(f: FeatureFrame) {
    const now = performance.now()
    const dt =
      this.lastFrameMs > 0
        ? Math.min(0.05, (now - this.lastFrameMs) * 0.001)
        : 0.016
    this.lastFrameMs = now
    if (this.lastVizMode !== 'idle') {
      this.lastVizMode = 'idle'
      // Reset orbit center on entry to idle.
      this.controls.target.set(0, 0, 0)
      this.controls.enableRotate = true
      this.controls.update()
    }
    this.form.visible = true
    this.graphRoot.visible = false
    this.trailLine.visible = false
    this.journeyPathWire.visible = false
    this.breadcrumbGroup.visible = false
    for (const m of this.breadcrumbMeshes) {
      m.visible = false
      m.material.opacity = 0
    }

    const red = this.reducedMotionMql.matches
    const spin = (red ? 0.04 : 0.11) + f.level * (red ? 0.22 : 0.6)
    this.form.rotation.y += spin * dt
    this.form.rotation.x =
      0.15 * Math.sin(now * 0.0003) * (0.2 + 0.8 * f.level)

    const ph = now * 0.00024
    const s = red ? 0.18 : 0.45
    this.point.position.set(
      s * Math.cos(ph) + 0.4,
      s * Math.sin(ph * 0.86) + 0.6,
      0.95 + 0.12 * Math.sin(ph * 0.38)
    )

    const hue = hueForTonalBucket(tonalBucketFromHint(f.tonalHint))
    this.updateBackgroundClear(f, dt)
    this.ambient.color.setHSL(hue, 0.3, 0.52)
    this.ambient.intensity = 0.2 + f.level * 0.5
    this.point.color.setHSL((hue + 0.12) % 1, 0.55, 0.55)
    this.form.scale.setScalar(0.9 + f.level * 0.5)
    const sat = 0.5 + 0.28 * f.level
    const colL = 0.36 + 0.2 * f.level
    this.form.material.color.setHSL(hue, sat, colL)
    this.form.material.emissive.setHSL(
      (hue + 0.04) % 1,
      0.6,
      0.09 + 0.38 * f.level
    )
    this.applyControlsMotionTuning()
    this.controls.update()
    this.setBackgroundRaysForIdle()
  }

  applyViz(
    f: FeatureFrame,
    graph: GraphViewSnapshot | null,
    opts: { live: boolean }
  ) {
    if (!opts.live || graph == null) {
      this.applyFrameOnly(f)
      return
    }
    this.applyJourney(f, graph)
  }

  applyJourney(f: FeatureFrame, graph: GraphViewSnapshot) {
    // Hide graph-mode objects.
    this.form.visible = false
    this.graphRoot.visible = false
    this.trailLine.visible = false
    this.breadcrumbGroup.visible = false
    this.journeyPathWire.visible = true

    const now = performance.now()
    const dt = computeJourneyDtSeconds(this.lastJourneyMs, now)
    this.lastJourneyMs = now
    if (this.lastVizMode !== 'journey') {
      this.lastVizMode = 'journey'
      // Rebase the "moving frame" when entering journey to avoid sudden dz jumps.
      this.journeyCamZ = this.journeyProgress
      this.lastJourneyMs = 0
      this.journeyRadiusSmooth = radiusFromLevel(f.level)
      this.journeyMusicEnergy = 0
      this.journeyLastNoteForEnergyId = 0
      this.journeySilenceAccumS = 0
      this.journeySilenceHiding = false
      this.journeySilenceGlobalFade = 1
      this.syncJourneyTipAndPathOnEnterJourney()
      this.updateJourneyControlsTarget()
      this.controls.update()
    }

    this.updateJourneyAxisFromBass(f, dt)
    this.updateJourneyMusicEnergy(f, graph, dt)

    const base = this.journeySpeedUnitsPerS
    const eSpeed = this.journeySpeedEnergyFactor()
    const speed =
      base *
      eSpeed *
      (this.reducedMotionMql.matches ? 0.25 : 1)
    this.journeyProgress = advanceJourneyProgress(this.journeyProgress, speed, dt)

    // Integrate world-space path; wire is a polyline of recent samples (curved when axis steers).
    const dz = this.journeyProgress - this.journeyCamZ
    this.journeyCamZ = this.journeyProgress
    if (Math.abs(dz) > 1e-7) {
      this.journeyTip.addScaledVector(this.journeyAxis, dz)
      this.journeyPathPushSample()
    }
    this.rebuildJourneyPathWire()

    this.camera.position.addScaledVector(this.journeyAxis, dz)

    // Spawn a node on note events (supports repeated strikes of the same pitch-class).
    if (graph.noteEvent && graph.noteEvent.id !== this.lastNoteEventId) {
      this.lastNoteEventId = graph.noteEvent.id
      const targetR = radiusFromLevel(f.level)
      const a = this.reducedMotionMql.matches
        ? JOURNEY_CONFIG.loudnessReducedMotionLerp
        : 1
      this.journeyRadiusSmooth += (targetR - this.journeyRadiusSmooth) * a
      for (const pc of graph.noteEvent.pitchClasses) {
        if (pc >= 0) {
          this.spawnJourneyNode(pc, f.level, this.journeyRadiusSmooth)
        }
      }
    }
    this.updateJourneySilenceState(f, dt)
    // Fade/cleanup nodes as they fall behind, and after sustained silence.
    this.updateJourneyNodeFades()
    this.updateJourneyControlsTarget()
    this.applyControlsMotionTuning()
    this.controls.enableRotate = !this.journeyCameraAlignToWire
    this.controls.update()
    this.applyJourneyCameraAlignToWire()

    this.setBackgroundRaysForJourney()
    this.updateJourneyPathWireAppearance()
    this.updateBackgroundClear(f, dt)
  }

  setAngularPlacementMode(mode: AngularPlacementMode) {
    this.angularPlacementMode = mode
  }

  setJourneySpeedUnitsPerS(speed: number) {
    if (!Number.isFinite(speed)) return
    this.journeySpeedUnitsPerS = Math.max(0, speed)
  }

  /** When true, journey view keeps the camera look direction parallel to the wire (free orbit off). */
  setJourneyCameraAlignToWire(enabled: boolean) {
    this.journeyCameraAlignToWire = enabled
  }

  private rebuildJourneyBasis() {
    this.basisHelper.set(0, 0, 1)
    if (Math.abs(this.journeyAxis.dot(this.basisHelper)) > 0.9) {
      this.basisHelper.set(0, 1, 0)
    }
    this.journeyBasisU.copy(this.basisHelper).cross(this.journeyAxis).normalize()
    this.journeyBasisV.copy(this.journeyAxis).cross(this.journeyBasisU).normalize()
  }

  /**
   * `bassTilt01` (from features): lower-keyboard note → 0..1, else neutral/spectral;
   * steers the path in world Y / a bit in X, smoothed in time.
   */
  private updateJourneyAxisFromBass(f: FeatureFrame, dt: number) {
    const d = Number.isFinite(dt) && dt > 0 ? Math.min(0.05, dt) : 0.016
    const tilt = f.bassTilt01 ?? 0.5
    const maxY = 0.48
    const maxX = 0.28
    const steerY = (tilt - 0.5) * 2 * maxY
    const steerX = (tilt - 0.5) * 1.2 * maxX
    this.axisSteerWork.set(0, 0, 1)
    this.axisSteerWork.applyAxisAngle(this.basisHelper.set(1, 0, 0), steerX)
    this.axisSteerWork.applyAxisAngle(this.basisHelper.set(0, 1, 0), steerY)
    this.journeyAxisTarget.copy(this.axisSteerWork).normalize()
    const k = 1.75
    const α = 1 - Math.exp(-k * d)
    this.journeyAxis.lerp(this.journeyAxisTarget, α).normalize()
    this.rebuildJourneyBasis()
  }

  /**
   * Smoothed 0–1 “how much music is in the mix” from level + new note onsets.
   * Drives wire width, glow, path length, and speed on top of the HUD base speed.
   */
  private updateJourneyMusicEnergy(
    f: FeatureFrame,
    graph: GraphViewSnapshot,
    dt: number
  ) {
    const d = Number.isFinite(dt) && dt > 0 ? Math.min(0.05, dt) : 0.016
    const gate = 0.03
    let target =
      f.level > gate
        ? Math.max(0, Math.min(1, (f.level - gate) / (1 - gate + 1e-6) * 1.08))
        : 0
    if (graph.noteEvent && graph.noteEvent.id !== this.journeyLastNoteForEnergyId) {
      this.journeyLastNoteForEnergyId = graph.noteEvent.id
      target = Math.max(target, 0.48)
    }
    const rm = this.reducedMotionMql.matches
    const kRise = rm ? 1.9 : 2.6
    const kFall = rm ? 0.5 : 0.72
    const k = target > this.journeyMusicEnergy ? kRise : kFall
    const α = 1 - Math.exp(-k * d)
    this.journeyMusicEnergy += (target - this.journeyMusicEnergy) * α
  }

  /** Multiplier 1..(1+JOURNEY_ALIVE_MAX_SPEED_BONUS) for travel when energy is up. */
  private journeySpeedEnergyFactor(): number {
    const e = this.journeyMusicEnergy
    const s = 1 + JOURNEY_ALIVE_MAX_SPEED_BONUS * e
    return s
  }

  private getJourneyPathArclengthTarget(): number {
    const base = JOURNEY_WIRE_BEHIND + JOURNEY_WIRE_AHEAD
    const e = this.journeyMusicEnergy
    const m = 1 + JOURNEY_ALIVE_MAX_LENGTH_BONUS * e
    return base * m
  }

  private updateJourneyPathWireAppearance() {
    const e = this.journeyMusicEnergy
    this.journeyPathColorWork.copy(this.journeyPathColorCore).lerp(
      this.journeyPathColorHi,
      e
    )
    this.journeyPathMat.color.copy(this.journeyPathColorWork)
    const o0 = JOURNEY_CONFIG.wireOpacity
    this.journeyPathMat.opacity = o0 * (0.62 + 0.85 * e)
  }

  /**
   * Planes are placed in the group’s local space; the group is moved so rays sit
   * in front of the camera in idle, and down-path past the wire in journey.
   */
  private buildBackgroundRays(map: CanvasTexture): Group {
    const g = new Group()
    type R = {
      w: number
      h: number
      opacity: number
      color: number
      x: number
      y: number
      z: number
      rx: number
      ry: number
      rz: number
    }
    const mk = (o: R) => {
      const mat = new MeshBasicMaterial({
        map,
        transparent: true,
        opacity: o.opacity,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        color: o.color,
      })
      const pm = new Mesh(new PlaneGeometry(o.w, o.h, 1, 1), mat)
      pm.position.set(o.x, o.y, o.z)
      pm.rotation.set(o.rx, o.ry, o.rz)
      pm.renderOrder = -2
      return pm
    }
    g.add(
      mk({
        w: 96,
        h: 26,
        opacity: 0.056,
        color: 0x8a7aff,
        x: -1.2,
        y: 2.4,
        z: 0.5,
        rx: 0.4,
        ry: 0.52,
        rz: 0.06,
      }),
      mk({
        w: 72,
        h: 32,
        opacity: 0.045,
        color: 0x8e8eff,
        x: 4.5,
        y: -1.1,
        z: 0.2,
        rx: -0.14,
        ry: -0.5,
        rz: -0.05,
      })
    )
    return g
  }

  private setBackgroundRaysForIdle() {
    this.backgroundRaysGroup.position.set(0, 0, -7.5)
  }

  private setBackgroundRaysForJourney() {
    this.backgroundRaysGroup.position.copy(
      this.tmpVec.copy(this.journeyTip).addScaledVector(this.journeyAxis, 4)
    )
  }

  /** Rejoins world tip + path ring to the 1D model (straight line from origin) for a stable frame. */
  private syncJourneyTipAndPathOnEnterJourney() {
    this.journeyTip.copy(this.journeyAxis).multiplyScalar(
      this.journeyProgress + JOURNEY_WIRE_AHEAD
    )
    this.pathWrite = 0
    this.tmpVec.copy(this.journeyTip).addScaledVector(this.journeyAxis, -0.12)
    let o = (this.pathWrite % JOURNEY_PATH_RING) * 3
    this.pathRingPos[o] = this.tmpVec.x
    this.pathRingPos[o + 1] = this.tmpVec.y
    this.pathRingPos[o + 2] = this.tmpVec.z
    this.pathWrite++
    o = (this.pathWrite % JOURNEY_PATH_RING) * 3
    this.pathRingPos[o] = this.journeyTip.x
    this.pathRingPos[o + 1] = this.journeyTip.y
    this.pathRingPos[o + 2] = this.journeyTip.z
    this.pathWrite++
    this.rebuildJourneyPathWire()
  }

  private journeyPathPushSample() {
    const o = (this.pathWrite % JOURNEY_PATH_RING) * 3
    this.pathRingPos[o] = this.journeyTip.x
    this.pathRingPos[o + 1] = this.journeyTip.y
    this.pathRingPos[o + 2] = this.journeyTip.z
    this.pathWrite++
  }

  /**
   * Picks vertices along the recent arclength so the line bends with the path (not a single straight segment).
   */
  private rebuildJourneyPathWire() {
    const R = JOURNEY_PATH_RING
    const maxLen = this.getJourneyPathArclengthTarget()
    if (this.pathWrite < 2) {
      const t = this.journeyTip
      this.journeyPathPositions[0] = t.x
      this.journeyPathPositions[1] = t.y
      this.journeyPathPositions[2] = t.z
      this.journeyPathPositions[3] = t.x
      this.journeyPathPositions[4] = t.y
      this.journeyPathPositions[5] = t.z
      this.pathVertCount = 2
      this.journeyPathWireGeo.setDrawRange(0, 2)
      const a2 = this.journeyPathWireGeo.getAttribute('position') as BufferAttribute
      a2.needsUpdate = true
      return
    }
    const cap = Math.min(this.pathWrite, R)
    // Newest → older along the path; then reverse to oldest → tip for the line.
    const rev: [number, number, number][] = []
    let acc = 0
    for (let k = 0; k < cap; k++) {
      const sol = (this.pathWrite - 1 - k + R) % R
      const o = sol * 3
      const p: [number, number, number] = [
        this.pathRingPos[o]!,
        this.pathRingPos[o + 1]!,
        this.pathRingPos[o + 2]!,
      ]
      if (k === 0) {
        rev.push(p)
        continue
      }
      const n = rev[rev.length - 1]!
      const dx = p[0] - n[0]
      const dy = p[1] - n[1]
      const dz3 = p[2] - n[2]
      const d = Math.hypot(dx, dy, dz3)
      acc += d
      rev.push(p)
      if (acc >= maxLen) break
    }
    rev.reverse()
    this.pathVertCount = rev.length
    for (let i = 0; i < this.pathVertCount; i++) {
      const t = rev[i]!
      const b = i * 3
      this.journeyPathPositions[b] = t[0]
      this.journeyPathPositions[b + 1] = t[1]
      this.journeyPathPositions[b + 2] = t[2]
    }
    this.journeyPathWireGeo.setDrawRange(0, this.pathVertCount)
    const pAttr = this.journeyPathWireGeo.getAttribute('position') as BufferAttribute
    pAttr.needsUpdate = true
  }

  private spawnJourneyNode(pitchClass: number, brightness: number, radius: number) {
    // Fixed radius around the wire axis, deterministic angle per pitch class.
    const theta = thetaForPitchClass(pitchClass, this.angularPlacementMode)
    // Spawn nodes in *world space* near the front of the wire segment.
    // This ensures the camera+wire can travel forward while nodes are left behind (visible motion).
    const i = this.journeyWrite % JOURNEY_NODE_MAX
    this.journeyWrite++

    let m = this.journeyNodeMeshes[i]
    if (!m) {
      const mat = new MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x000000,
        metalness: 0.35,
        roughness: 0.45,
        transparent: true,
        opacity: 1,
      })
      m = new Mesh(this.journeyNodeGeom, mat)
      this.journeyEvents.add(m)
      this.journeyNodeMeshes[i] = m
    }

    const { col, emi, matParams } = this.nodeMaterial(
      pitchClass,
      brightness,
      'journey'
    )
    m.material.color.copy(col)
    m.material.emissive.copy(emi)
    m.material.metalness = matParams.metalness
    m.material.roughness = matParams.roughness
    m.material.opacity = 1
    m.visible = true
    const r = Math.max(JOURNEY_NODE_RADIUS, radius)
    const cosT = Math.cos(theta)
    const sinT = Math.sin(theta)
    m.position
      .copy(this.journeyTip)
      .addScaledVector(this.journeyAxis, -JOURNEY_SPAWN_FROM_WIRE_FRONT)
      .addScaledVector(this.journeyBasisU, cosT * r)
      .addScaledVector(this.journeyBasisV, sinT * r)
    m.scale.setScalar(1.1 + 0.35 * brightness)

    let halo = m.userData.halo as Mesh<SphereGeometry, ShaderMaterial> | undefined
    if (!halo) {
      const hMat = new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color(1, 1, 1) },
          uBaseOpacity: { value: 0.2 },
        },
        vertexShader: HALO_GLOW_VERTEX,
        fragmentShader: HALO_GLOW_FRAGMENT,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      })
      halo = new Mesh(this.journeyHaloGeom, hMat)
      halo.renderOrder = 0
      halo.scale.setScalar(JOURNEY_HALO_LOCAL_SCALE)
      m.add(halo)
      m.userData.halo = halo
    }
    const b = Math.max(0, Math.min(1, brightness))
    const hb = 0.06 + 0.2 * b
    m.userData.haloBaseOpacity = hb
    const hmat = halo.material
    hmat.uniforms.uColor.value.copy(col).lerp(emi, 0.32).multiplyScalar(1.02)
    hmat.uniforms.uBaseOpacity.value = hb
  }

  private updateJourneySilenceState(f: FeatureFrame, dt: number) {
    const d = Number.isFinite(dt) && dt > 0 ? Math.min(0.1, dt) : 0.016
    if (f.level >= JOURNEY_QUIET_LEVEL) {
      this.journeySilenceAccumS = 0
      this.journeySilenceHiding = false
      this.journeySilenceGlobalFade = 1
      return
    }
    this.journeySilenceAccumS += d
    if (this.journeySilenceAccumS < JOURNEY_SILENCE_SEC_BEFORE_FADE) {
      return
    }
    if (!this.journeySilenceHiding) {
      this.journeySilenceHiding = true
      this.journeySilenceGlobalFade = 1
    }
    this.journeySilenceGlobalFade = Math.max(
      0,
      this.journeySilenceGlobalFade - d / JOURNEY_SILENCE_FADE_OUT_SEC
    )
  }

  private updateJourneyNodeFades() {
    const sil = this.journeySilenceHiding ? this.journeySilenceGlobalFade : 1
    // Nodes are in world space; fade by distance behind the moving wire/camera frame.
    for (let i = 0; i < this.journeyNodeMeshes.length; i++) {
      const m = this.journeyNodeMeshes[i]
      if (!m) continue
      if (!m.visible) continue
      const behind = this.journeyAxis.dot(
        this.tmpVec2.copy(this.journeyTip).sub(m.position)
      )
      let op = 1
      if (behind > 0) {
        if (behind >= JOURNEY_NODE_FADE_UNITS) {
          m.visible = false
          continue
        }
        op = 1 - behind / JOURNEY_NODE_FADE_UNITS
      }
      const f = Math.max(0, Math.min(1, op * sil))
      m.material.opacity = f
      this.applyJourneyHaloFade(m, f)
      if (f < 0.01) m.visible = false
    }
  }

  private applyJourneyHaloFade(
    m: Mesh<SphereGeometry, MeshStandardMaterial>,
    fade01: number
  ) {
    const halo = m.userData.halo as
      | Mesh<SphereGeometry, ShaderMaterial>
      | undefined
    if (!halo) return
    const base =
      typeof m.userData.haloBaseOpacity === 'number'
        ? m.userData.haloBaseOpacity
        : 0.2
    halo.material.uniforms.uBaseOpacity.value =
      Math.max(0, Math.min(1, fade01)) * base
  }

  private updateJourneyControlsTarget() {
    // Integrate tip only — not `axis * s` — so bass steering does not jerk the orbit center.
    this.controls.target.copy(this.journeyTip)
  }

  /** After OrbitControls.update: snap camera onto the path tangent, preserving zoom distance. */
  private applyJourneyCameraAlignToWire() {
    if (!this.journeyCameraAlignToWire) return
    const t = this.journeyTip
    const raw = this.camera.position.distanceTo(this.controls.target)
    const dist = Math.max(ORBIT_MIN_DISTANCE, Math.min(ORBIT_MAX_DISTANCE, raw))
    this.camera.position.copy(t).addScaledVector(this.journeyAxis, -dist)
    this.camera.up.set(0, 1, 0)
    this.camera.lookAt(t)
  }

  private applyControlsMotionTuning() {
    // Reduced motion should feel less floaty.
    this.controls.dampingFactor = this.reducedMotionMql.matches ? 0.04 : 0.08
    this.controls.rotateSpeed = this.reducedMotionMql.matches ? 0.5 : ORBIT_ROTATE_SPEED
    this.controls.zoomSpeed = this.reducedMotionMql.matches ? 0.85 : ORBIT_ZOOM_SPEED
  }

  private nodeMaterial(
    pc: number,
    b: number,
    kind: 'journey' | 'focus' | 'normal'
  ) {
    const h = hashHue(pc)
    const x = Math.max(0, Math.min(1, b))
    const col = new Color()
    const emi = new Color()
    if (kind === 'journey') {
      // No “focus” boost: level was stacking with focus styling → blown-out white.
      const s = 0.7
      const L = 0.26 + 0.4 * x
      col.setHSL(h, s, Math.min(0.64, L))
      emi.setHSL((h + 0.04) % 1, 0.5, 0.05 + 0.3 * x)
    } else {
      const s = 0.72
      const isFocus = kind === 'focus'
      const L = 0.22 + 0.48 * x + (isFocus ? BRIGHTNESS_L_BOOST : 0)
      col.setHSL(h, s, L)
      emi.setHSL(
        (h + 0.04) % 1,
        0.58,
        0.1 + 0.62 * x * (isFocus ? 1.12 : 1)
      )
    }
    return { col, emi, matParams: { metalness: 0.38, roughness: 0.42 } }
  }

  private clearEdges() {
    while (this.edgeGroup.children.length) {
      const c = this.edgeGroup.children[0]!
      this.edgeGroup.remove(c)
      if (c instanceof Line) {
        c.geometry.dispose()
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    for (const [, m] of this.nodeMeshes) {
      m.material.dispose()
    }
    this.nodeMeshes.clear()
    this.formGeom.dispose()
    this.nodeGeom.dispose()
    this.journeyNodeGeom.dispose()
    this.form.material.dispose()
    this.clearEdges()
    this.lineMat.dispose()
    this.trailGeo.dispose()
    this.trailMat.dispose()
    this.breadcrumbGeom.dispose()
    for (const m of this.breadcrumbMeshes) m.material.dispose()
    this.journeyPathWireGeo.dispose()
    this.journeyPathMat.dispose()
    for (const m of this.journeyNodeMeshes) {
      if (m) {
        m.material.dispose()
        const halo = m.userData.halo as Mesh | undefined
        if (halo) {
          const hmat = halo.material
          if (Array.isArray(hmat)) {
            for (const x of hmat) x.dispose()
          } else {
            hmat.dispose()
          }
        }
      }
    }
    this.journeyHaloGeom.dispose()
    this.backgroundRayMap.dispose()
    this.backgroundRaysGroup.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose()
        const mat = o.material
        if (Array.isArray(mat)) {
          for (const m of mat) m.dispose()
        } else {
          mat.dispose()
        }
      }
    })
    this.canvas.removeEventListener('wheel', this.onWheelPreventScroll)
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
