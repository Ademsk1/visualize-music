import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  SphereGeometry,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  advanceJourneyProgress,
  computeJourneyDtSeconds,
  JOURNEY_AXIS,
  JOURNEY_SPEED_UNITS_PER_S,
} from './journeyState'
import { JOURNEY_CONFIG } from './journeyConfig'
import { hueForTonalBucket, tonalBucketFromHint } from './tonalColor'
import { thetaForPitchClass } from './angularPlacement'
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

const BACKGROUND_CLEAR = 0x000000

// --- Journey (forward travel) ---
// Spawn nodes near the *front* of the wire segment (camera is near the front).
const JOURNEY_SPAWN_FROM_WIRE_FRONT: number = JOURNEY_CONFIG.spawnFromWireFront
const JOURNEY_WIRE_AHEAD: number = JOURNEY_CONFIG.wireAhead
const JOURNEY_WIRE_BEHIND: number = JOURNEY_CONFIG.wireBehind
const JOURNEY_NODE_RADIUS: number = JOURNEY_CONFIG.nodeRadius
const JOURNEY_NODE_MAX: number = JOURNEY_CONFIG.nodeMax
const JOURNEY_NODE_FADE_UNITS: number = JOURNEY_CONFIG.nodeFadeUnits

const ORBIT_MIN_DISTANCE = 0.4
const ORBIT_MAX_DISTANCE = 18
const ORBIT_ZOOM_SPEED = 1.15
const ORBIT_ROTATE_SPEED = 0.8

function hashHue(pc: number): number {
  if (pc < 0) return 0.08
  // Golden step on circle so neighbours differ
  return ((pc * 0.618_033_988_749_895) % 1) as number
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
  private readonly formGeom = new SphereGeometry(0.5, SPHERE_W, SPHERE_H)
  private readonly nodeGeom = new SphereGeometry(NODE_SCALE_BASE, SPHERE_W, SPHERE_H)
  private readonly journeyNodeGeom = new SphereGeometry(NODE_SCALE_BASE, SPHERE_W, SPHERE_H)
  private readonly lineMat = new LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  })

  // Journey (wire + event nodes)
  private readonly journeyRoot: Group
  private readonly journeyWire: Line<BufferGeometry, LineBasicMaterial>
  private readonly journeyEvents: Group
  private journeyProgress = 0
  private lastJourneyMs = 0
  private lastFocusPc: number | null = null
  private journeyWrite = 0
  private readonly journeyNodeMeshes: Mesh<SphereGeometry, MeshStandardMaterial>[] = []

  private journeyCamZ = 0
  private readonly journeyTargetWork = new Vector3()
  private readonly journeyAxis = new Vector3(JOURNEY_AXIS.x, JOURNEY_AXIS.y, JOURNEY_AXIS.z)
  private readonly journeyBasisU = new Vector3()
  private readonly journeyBasisV = new Vector3()
  private journeyRadiusSmooth: number = JOURNEY_CONFIG.loudnessRadiusMin
  private lastVizMode: 'idle' | 'journey' = 'idle'

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
    this.renderer.setClearColor(BACKGROUND_CLEAR, 1)
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

    // Journey axis is treated as a unit direction. Guard against accidental drift.
    if (this.journeyAxis.lengthSq() === 0) {
      this.journeyAxis.set(0, 0, 1)
    } else {
      this.journeyAxis.normalize()
    }
    // Stable orthonormal basis around the wire axis for radial spawning.
    // Pick a helper axis that is not parallel, then build U/V via cross products.
    this.tmpVec.set(0, 0, 1)
    if (Math.abs(this.journeyAxis.dot(this.tmpVec)) > 0.9) {
      this.tmpVec.set(0, 1, 0)
    }
    this.journeyBasisU.copy(this.tmpVec).cross(this.journeyAxis).normalize()
    this.journeyBasisV.copy(this.journeyAxis).cross(this.journeyBasisU).normalize()

    this.scene = new Scene()
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

    // Journey: a static wire aligned with the journey axis, and nodes spawned around it.
    this.journeyRoot = new Group()
    this.journeyRoot.visible = false
    this.journeyEvents = new Group()
    const wireGeo = new BufferGeometry().setFromPoints([
      new Vector3(
        -this.journeyAxis.x * JOURNEY_WIRE_BEHIND,
        -this.journeyAxis.y * JOURNEY_WIRE_BEHIND,
        -this.journeyAxis.z * JOURNEY_WIRE_BEHIND
      ),
      new Vector3(
        this.journeyAxis.x * JOURNEY_WIRE_AHEAD,
        this.journeyAxis.y * JOURNEY_WIRE_AHEAD,
        this.journeyAxis.z * JOURNEY_WIRE_AHEAD
      ),
    ])
    const wireMat = new LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: JOURNEY_CONFIG.wireOpacity,
    })
    this.journeyWire = new Line(wireGeo, wireMat)
    this.journeyRoot.add(this.journeyWire)
    this.scene.add(this.journeyRoot)
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
      this.controls.update()
    }
    this.form.visible = true
    this.graphRoot.visible = false
    this.trailLine.visible = false
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
    this.renderer.setClearColor(BACKGROUND_CLEAR, 1)
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
    this.journeyRoot.visible = true

    const now = performance.now()
    const dt = computeJourneyDtSeconds(this.lastJourneyMs, now)
    this.lastJourneyMs = now
    if (this.lastVizMode !== 'journey') {
      this.lastVizMode = 'journey'
      // Rebase the "moving frame" when entering journey to avoid sudden dz jumps.
      this.journeyCamZ = this.journeyProgress
      this.lastJourneyMs = 0
      this.journeyRadiusSmooth = radiusFromLevel(f.level)
      this.updateJourneyControlsTarget()
      this.controls.update()
    }

    const speed = this.reducedMotionMql.matches
      ? JOURNEY_SPEED_UNITS_PER_S * 0.25
      : JOURNEY_SPEED_UNITS_PER_S
    this.journeyProgress = advanceJourneyProgress(this.journeyProgress, speed, dt)

    // The wire + camera move forward together (static relative framing).
    this.journeyRoot.position.copy(this.journeyAxis).multiplyScalar(this.journeyProgress)

    // Carry the orbit camera frame forward without overwriting user orbit.
    const dz = this.journeyProgress - this.journeyCamZ
    this.journeyCamZ = this.journeyProgress
    this.camera.position.z += dz

    // Spawn a node on each focus change (note event surrogate).
    const pc = graph.focusPitchClass
    if (pc !== null && pc !== this.lastFocusPc && pc >= 0) {
      const targetR = radiusFromLevel(f.level)
      const a = this.reducedMotionMql.matches
        ? JOURNEY_CONFIG.loudnessReducedMotionLerp
        : 1
      this.journeyRadiusSmooth += (targetR - this.journeyRadiusSmooth) * a
      this.spawnJourneyNode(pc, f.level, this.journeyRadiusSmooth)
    }
    this.lastFocusPc = pc

    // Fade/cleanup nodes as they fall behind.
    this.updateJourneyNodeFades()
    this.updateJourneyControlsTarget()
    this.applyControlsMotionTuning()
    this.controls.update()

    // Background is static black (see story-static-black-background.md).
    this.renderer.setClearColor(BACKGROUND_CLEAR, 1)
  }

  private spawnJourneyNode(pitchClass: number, brightness: number, radius: number) {
    // Fixed radius around the wire axis, deterministic angle per pitch class.
    const theta = thetaForPitchClass(pitchClass)
    // Spawn nodes in *world space* near the front of the wire segment.
    // This ensures the camera+wire can travel forward while nodes are left behind (visible motion).
    const s =
      this.journeyProgress + (JOURNEY_WIRE_AHEAD - JOURNEY_SPAWN_FROM_WIRE_FRONT)

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

    const { col, emi, matParams } = this.nodeMaterial(pitchClass, brightness, true)
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
      .copy(this.journeyAxis)
      .multiplyScalar(s)
      .addScaledVector(this.journeyBasisU, cosT * r)
      .addScaledVector(this.journeyBasisV, sinT * r)
    m.scale.setScalar(1.1 + 0.35 * brightness)
  }

  private updateJourneyNodeFades() {
    // Nodes are in world space; fade by distance behind the moving wire/camera frame.
    for (let i = 0; i < this.journeyNodeMeshes.length; i++) {
      const m = this.journeyNodeMeshes[i]
      if (!m || !m.visible) continue
      const nodeS = m.position.dot(this.journeyAxis)
      const behind = this.journeyProgress - nodeS
      if (behind <= 0) {
        m.material.opacity = 1
        continue
      }
      if (behind >= JOURNEY_NODE_FADE_UNITS) {
        m.visible = false
        continue
      }
      const a = 1 - behind / JOURNEY_NODE_FADE_UNITS
      m.material.opacity = Math.max(0, Math.min(1, a))
    }
  }

  private updateJourneyControlsTarget() {
    const frontS = this.journeyProgress + JOURNEY_WIRE_AHEAD
    this.journeyTargetWork.copy(this.journeyAxis).multiplyScalar(frontS)
    // Keep the camera orbit centered on the wire tip.
    this.controls.target.copy(this.journeyTargetWork)
  }

  private applyControlsMotionTuning() {
    // Reduced motion should feel less floaty.
    this.controls.dampingFactor = this.reducedMotionMql.matches ? 0.04 : 0.08
    this.controls.rotateSpeed = this.reducedMotionMql.matches ? 0.5 : ORBIT_ROTATE_SPEED
    this.controls.zoomSpeed = this.reducedMotionMql.matches ? 0.85 : ORBIT_ZOOM_SPEED
  }

  private nodeMaterial(pc: number, b: number, focus: boolean) {
    const h = hashHue(pc)
    const s = 0.72
    const L = 0.22 + 0.48 * b + (focus ? BRIGHTNESS_L_BOOST : 0)
    const col = new Color()
    const emi = new Color()
    col.setHSL(h, s, L)
    emi.setHSL((h + 0.04) % 1, 0.55, 0.12 + 0.55 * b * (focus ? 1.15 : 1))
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
    this.journeyWire.geometry.dispose()
    this.journeyWire.material.dispose()
    for (const m of this.journeyNodeMeshes) {
      if (m) m.material.dispose()
    }
    this.canvas.removeEventListener('wheel', this.onWheelPreventScroll)
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
