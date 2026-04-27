import {
  AmbientLight,
  Color,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  WebGLRenderer,
} from 'three'
import type { FeatureFrame } from '../types/featureFrame'

/** Capped DPR: full retina (×2) roughly quadruples framebuffer size vs 1.0. */
const MAX_DEVICE_PIXEL_RATIO = 1.5

export type SceneControllerOptions = {
  readonly onContextLost?: () => void
}

/**
 * Owns the WebGL canvas. Call applyFrame from rAF — not from React render.
 */
export class SceneController {
  private readonly renderer: WebGLRenderer
  private readonly scene: Scene
  private readonly camera: PerspectiveCamera
  private readonly bgColor = new Color()
  private readonly ambient: AmbientLight
  private readonly form: Mesh<IcosahedronGeometry, MeshStandardMaterial>
  private readonly point: PointLight
  private lastFrameMs = 0
  private readonly reducedMotionMql: MediaQueryList

  constructor(
    container: HTMLElement,
    options: SceneControllerOptions = {}
  ) {
    this.reducedMotionMql = globalThis.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )
    // no MSAA: smaller GPU color/depth cost than antialias: true
    this.renderer = new WebGLRenderer({ antialias: false, alpha: false })
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO)
    )
    // updateStyle: false — inline width/height px on the canvas can inflate the
    // document past the viewport; overflow:hidden then clips the top and only
    // the bottom band of the frame stays visible.
    this.renderer.setSize(container.clientWidth, container.clientHeight, false)
    // Slightly lifted from near-black so a working scene never reads as “dead” display
    this.renderer.setClearColor(0x12091a, 1)
    const canvas = this.renderer.domElement
    canvas.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault()
        options.onContextLost?.()
      },
      false
    )
    container.appendChild(canvas)

    this.scene = new Scene()
    this.camera = new PerspectiveCamera(45, 1, 0.1, 100)
    this.camera.position.z = 2.5

    this.ambient = new AmbientLight(0x7c5cff, 0.4)
    this.scene.add(this.ambient)

    const g = new IcosahedronGeometry(0.5, 1)
    const m = new MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.35,
      roughness: 0.45,
    })
    this.form = new Mesh(g, m)
    this.scene.add(this.form)

    const pl = new PointLight(0xffffff, 1, 0, 2)
    pl.position.set(0.6, 0.8, 1.2)
    this.scene.add(pl)
    this.point = pl

    this.applyFrame({ level: 0.15, tonalHint: 0.5, t: 0 })
    this.render()
  }

  setSize(w: number, h: number) {
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  applyFrame(f: FeatureFrame) {
    const now = performance.now()
    const dt =
      this.lastFrameMs > 0
        ? Math.min(0.05, (now - this.lastFrameMs) * 0.001)
        : 0.016
    this.lastFrameMs = now

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

    // tonalHint = 0…1 (pitch + spectrum): drives hue around the full colour wheel
    const t = Math.min(1, Math.max(0, f.tonalHint))
    const hue = t
    const lightness = 0.05 + f.level * 0.1
    this.bgColor.setHSL(hue, 0.42, lightness)
    this.renderer.setClearColor(this.bgColor, 1)

    this.ambient.color.setHSL(hue, 0.3, 0.52)
    this.ambient.intensity = 0.2 + f.level * 0.5
    this.point.color.setHSL((hue + 0.12) % 1, 0.55, 0.55)

    this.form.scale.setScalar(0.9 + f.level * 0.5)
    const sat = 0.5 + 0.28 * f.level
    const colL = 0.36 + 0.2 * f.level
    this.form.material.color.setHSL(hue, sat, colL)
    this.form.material.emissive.setHSL((hue + 0.04) % 1, 0.6, 0.09 + 0.38 * f.level)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.form.geometry.dispose()
    this.form.material.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
