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
const TRAIL_MIN_STEP = 0.02
const BREADCRUMB_MAX = 140
const BREADCRUMB_EVERY_POINTS = 18

const BACKGROUND_CLEAR = 0x000000

// --- Journey (forward travel) ---
const JOURNEY_SPEED_UNITS_PER_S = 0.55
// Spawn nodes near the *front* of the wire segment (camera is near the front).
const JOURNEY_SPAWN_FROM_WIRE_FRONT = 1.4
const JOURNEY_WIRE_AHEAD = 28
const JOURNEY_WIRE_BEHIND = 6
const JOURNEY_NODE_RADIUS = 1.35
const JOURNEY_NODE_MAX = 220
const JOURNEY_NODE_FADE_UNITS = 18
const ZOOM_MIN = 0.6
const ZOOM_MAX = 2.6
const ZOOM_WHEEL_SENSITIVITY = 0.0012

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
  private readonly bgColor = new Color()
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
  private trailCount = 0
  private readonly trailLast = new Vector3(0, 0, 0)
  private readonly breadcrumbGroup: Group
  private readonly breadcrumbGeom: SphereGeometry
  private readonly breadcrumbMeshes: Mesh<SphereGeometry, MeshStandardMaterial>[] = []
  private breadcrumbWrite = 0
  private lastFrameMs = 0
  private readonly reducedMotionMql: MediaQueryList
  private lookWork = new Vector3()
  private lookSmooth = new Vector3(0, 0, 2.5)
  private distSmooth = 2.8
  private revisitDolly = 0
  private offAxis = new Vector3()
  private tPhase = 0
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

  // Zoom (scroll wheel / trackpad)
  private zoomTarget = 1
  private zoomSmooth = 1
  private readonly onWheel: (e: WheelEvent) => void

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
    this.canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault()
        options.onContextLost?.()
      },
      false
    )
    container.appendChild(this.canvas)

    this.onWheel = (e: WheelEvent) => {
      // Only zoom the scene when scrolling over the canvas.
      // Prevent page scroll for a "camera dolly" feel.
      e.preventDefault()
      const d = e.deltaY
      const next = this.zoomTarget * (1 + d * ZOOM_WHEEL_SENSITIVITY)
      this.zoomTarget = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next))
    }
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false })

    this.scene = new Scene()
    this.camera = new PerspectiveCamera(45, 1, 0.1, 200)
    this.camera.position.set(0, 0, 2.5)

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

    // Journey: a static wire aligned with +Z (time), and nodes spawned around it.
    this.journeyRoot = new Group()
    this.journeyRoot.visible = false
    this.journeyEvents = new Group()
    const wireGeo = new BufferGeometry().setFromPoints([
      new Vector3(0, 0, -JOURNEY_WIRE_BEHIND),
      new Vector3(0, 0, JOURNEY_WIRE_AHEAD),
    ])
    const wireMat = new LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
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
    this.form.visible = true
    this.graphRoot.visible = false
    this.trailLine.visible = false
    this.breadcrumbGroup.visible = false
    this.trailCount = 0
    this.breadcrumbWrite = 0
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

    const t = Math.min(1, Math.max(0, f.tonalHint))
    const hue = t
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
    const dt =
      this.lastJourneyMs > 0
        ? Math.min(0.05, (now - this.lastJourneyMs) * 0.001)
        : 0.016
    this.lastJourneyMs = now

    const speed = this.reducedMotionMql.matches
      ? JOURNEY_SPEED_UNITS_PER_S * 0.25
      : JOURNEY_SPEED_UNITS_PER_S
    this.journeyProgress += speed * dt

    // The wire + camera move forward together (static relative framing).
    this.journeyRoot.position.set(0, 0, this.journeyProgress)

    // Spawn a node on each focus change (note event surrogate).
    const pc = graph.focusPitchClass
    if (pc !== null && pc !== this.lastFocusPc && pc >= 0) {
      this.spawnJourneyNode(pc, f.level)
    }
    this.lastFocusPc = pc

    // Fade/cleanup nodes as they fall behind.
    this.updateJourneyNodeFades()
    this.updateJourneyCamera()

    // Background is static black (see story-static-black-background.md).
    this.renderer.setClearColor(BACKGROUND_CLEAR, 1)
  }

  private spawnJourneyNode(pitchClass: number, brightness: number) {
    // Fixed radius around wire axis (+Z), random angle.
    const theta = Math.random() * Math.PI * 2
    const x = Math.cos(theta) * JOURNEY_NODE_RADIUS
    const y = Math.sin(theta) * JOURNEY_NODE_RADIUS
    // Spawn nodes in *world space* near the front of the wire segment.
    // This ensures the camera+wire can travel forward while nodes are left behind (visible motion).
    const z =
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
    m.position.set(x, y, z)
    m.scale.setScalar(1.1 + 0.35 * brightness)
  }

  private updateJourneyNodeFades() {
    // Nodes are in world space; fade by distance behind the moving wire/camera frame.
    for (let i = 0; i < this.journeyNodeMeshes.length; i++) {
      const m = this.journeyNodeMeshes[i]
      if (!m || !m.visible) continue
      const behind = this.journeyProgress - m.position.z
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

  private updateJourneyCamera() {
    // Camera follows the *front* of the wire (the traveling endpoint).
    const cam = this.camera
    const frontZ = this.journeyProgress + JOURNEY_WIRE_AHEAD
    const a = this.reducedMotionMql.matches ? 0.12 : 0.18
    this.zoomSmooth += (this.zoomTarget - this.zoomSmooth) * a
    const back = 3.2 * this.zoomSmooth
    // Important: keep a small off-axis offset so the wire isn't viewed perfectly head-on.
    cam.position.set(1.1, 0.55, frontZ - back)
    cam.lookAt(0, 0, frontZ + 5.2)
  }

  private updateTrail(g: GraphViewSnapshot) {
    // “Journey”: leave a persistent path of the drifting graph.
    const p = g.centroid
    const next = this.tmpVec.set(p.x, p.y, p.z)
    if (this.trailCount === 0) {
      this.trailLast.copy(next)
      this.pushTrailPoint(next)
      return
    }
    if (next.distanceTo(this.trailLast) < TRAIL_MIN_STEP) return
    this.trailLast.copy(next)
    this.pushTrailPoint(next)
  }

  private pushTrailPoint(v: Vector3) {
    if (this.trailCount < TRAIL_MAX_POINTS) {
      const i = this.trailCount * 3
      this.trailPositions[i] = v.x
      this.trailPositions[i + 1] = v.y
      this.trailPositions[i + 2] = v.z
      this.trailCount++
    } else {
      // Shift left by one point (cheap enough at this scale).
      this.trailPositions.copyWithin(0, 3)
      const i = (TRAIL_MAX_POINTS - 1) * 3
      this.trailPositions[i] = v.x
      this.trailPositions[i + 1] = v.y
      this.trailPositions[i + 2] = v.z
    }
    const posAttr = this.trailGeo.getAttribute('position')
    posAttr.needsUpdate = true
    this.trailGeo.setDrawRange(0, Math.max(2, this.trailCount))

    // Every N points, drop a breadcrumb sphere. Older breadcrumbs fade out.
    if (this.reducedMotionMql.matches) return
    if (this.trailCount % BREADCRUMB_EVERY_POINTS !== 0) return
    const idx = this.breadcrumbWrite % BREADCRUMB_MAX
    this.breadcrumbWrite++
    const m = this.breadcrumbMeshes[idx]!
    m.position.copy(v)
    m.visible = true
    m.material.color.setHex(0xffffff)
    m.material.emissive.setHex(0x111114)
    m.material.opacity = 0.36
    // Recompute fades (cheap: BREADCRUMB_MAX is small).
    const filled = Math.min(this.breadcrumbWrite, BREADCRUMB_MAX)
    for (let k = 0; k < filled; k++) {
      const j = (idx - k + BREADCRUMB_MAX) % BREADCRUMB_MAX
      const mm = this.breadcrumbMeshes[j]!
      const a = 0.36 * Math.exp(-k * 0.035)
      mm.material.opacity = Math.max(0, a)
    }
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

  private syncGraphNodes(g: GraphViewSnapshot, f: FeatureFrame) {
    const seen = new Set<number>()
    for (const n of g.nodes) {
      seen.add(n.pitchClass)
      let mesh = this.nodeMeshes.get(n.pitchClass)
      if (!mesh) {
        const mat = new MeshStandardMaterial({
          color: 0x666666,
          emissive: 0x0,
          metalness: 0.38,
          roughness: 0.42,
        })
        mesh = new Mesh(this.nodeGeom, mat)
        this.nodeGroup.add(mesh)
        this.nodeMeshes.set(n.pitchClass, mesh)
      }
      const p = n.position
      mesh.position.set(p.x, p.y, p.z)
      const b = n.brightness
      if (n.pitchClass < 0) {
        mesh.material.color.setHex(0x5a5a6a)
        mesh.material.metalness = 0.25
        mesh.material.roughness = 0.55
        mesh.material.emissive.setHex(0x101018)
        mesh.scale.setScalar(0.9 + 0.1 * f.level)
      } else {
        const { col, emi, matParams } = this.nodeMaterial(
          n.pitchClass,
          b,
          n.isFocus
        )
        mesh.material.color.copy(col)
        mesh.material.metalness = matParams.metalness
        mesh.material.roughness = matParams.roughness
        mesh.material.emissive.copy(emi)
        const s =
          0.85 + 0.35 * b * (1 + 0.35 * (n.isFocus ? 1.2 * n.brightness : 0))
        mesh.scale.setScalar(s * (n.isInitialSphere ? 1.05 : 1))
      }
    }
    for (const k of this.nodeMeshes.keys()) {
      if (!seen.has(k)) {
        const m = this.nodeMeshes.get(k)!
        this.nodeGroup.remove(m)
        m.material.dispose()
        this.nodeMeshes.delete(k)
      }
    }
    this.renderer.setClearColor(BACKGROUND_CLEAR, 1)
    this.ambient.intensity = 0.12 + 0.35 * f.level
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

  private syncEdges(g: GraphViewSnapshot) {
    this.clearEdges()
    for (const e of g.edges) {
      const geo = new BufferGeometry().setFromPoints([
        new Vector3(e.from.x, e.from.y, e.from.z),
        new Vector3(e.to.x, e.to.y, e.to.z),
      ])
      const line = new Line(geo, this.lineMat)
      this.edgeGroup.add(line)
    }
  }

  private updateGraphCamera(_f: FeatureFrame, g: GraphViewSnapshot) {
    if (g.didRevisit) {
      this.revisitDolly = 1
    } else {
      this.revisitDolly *= 0.92
    }
    this.lastFrameMs = performance.now()
    const focusP = g.nodes.find(
      (n) => n.pitchClass === g.focusPitchClass && n.pitchClass >= 0
    )
    const c = g.centroid
    this.lookWork.set(c.x, c.y, c.z)
    if (focusP) {
      this.tmpVec.set(
        focusP.position.x,
        focusP.position.y,
        focusP.position.z
      )
      this.lookWork.lerp(this.tmpVec, 0.55)
    }
    const a = this.reducedMotionMql.matches ? 0.06 : 0.1
    this.lookSmooth.lerp(this.lookWork, a)
    const wobble = 0.08
    this.offAxis.set(
      wobble * Math.sin(this.tPhase * 0.4),
      wobble * 0.45 * Math.cos(this.tPhase * 0.31),
      0
    )
    const r = g.contentRadius
    let dTarget = Math.max(2, r * 2.55 + 1.35) * (1 - 0.14 * this.revisitDolly)
    dTarget = Math.min(42, dTarget)
    this.distSmooth += (dTarget - this.distSmooth) * (a * 0.7)
    const zoomA = this.reducedMotionMql.matches ? 0.08 : 0.14
    this.zoomSmooth += (this.zoomTarget - this.zoomSmooth) * zoomA
    const dist = this.distSmooth * this.zoomSmooth
    const cam = this.camera
    const dir = new Vector3(0.38, 0.22, 1.05).normalize()
    this.point.position.set(
      this.lookSmooth.x + 0.4,
      this.lookSmooth.y + 0.9,
      this.lookSmooth.z + 0.5
    )
    cam.position.set(
      this.lookSmooth.x + (dir.x + this.offAxis.x) * dist,
      this.lookSmooth.y + (dir.y + this.offAxis.y) * dist,
      this.lookSmooth.z + (dir.z + this.offAxis.z) * dist
    )
    cam.lookAt(
      this.lookSmooth.x,
      this.lookSmooth.y,
      this.lookSmooth.z
    )
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
    this.canvas.removeEventListener('wheel', this.onWheel)
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
