# Story 2.1: Orbit controls (drag to look around + larger scroll zoom distance)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a player/viewer,
I want to drag to look around the 3D scene and scroll to zoom further in/out,
so that I can explore the journey wire + note nodes from different angles and distances.

## Acceptance Criteria

1. **Drag orbit**: When the user drags on the visualization stage, the camera orbits smoothly (no React re-render loop required).
2. **Scroll zoom range increased**: Mouse wheel / trackpad scroll zoom works and has a noticeably larger usable range than today.
3. **Bounds / safety**: Zoom is clamped (no zooming “through” the scene or to infinity).
4. **Journey compatibility**: In journey mode, orbiting/zooming remains centered on the “travel frame” (near the wire front), not on stale world origin.
5. **Reduced motion**: With `prefers-reduced-motion: reduce`, controls still work but feel stable (no aggressive inertia).
6. **No regressions**: `npm test` and `npm run lint` pass.

## Tasks / Subtasks

- [ ] Add OrbitControls to the Three.js controller (AC: 1, 2, 3, 5)
  - [ ] Import `OrbitControls` from `three/examples/jsm/controls/OrbitControls.js` inside `src/scene/SceneController.ts`
  - [ ] Create controls bound to the WebGL canvas: `new OrbitControls(camera, canvas)`
  - [ ] Configure for this project’s vibe:
    - [ ] `enableDamping = true` (but reduce damping / inertia when reduced motion)
    - [ ] `enablePan = false` (start here; avoid disorientation)
    - [ ] `rotateSpeed` tuned for “pristine motion” (UX spec)
  - [ ] Increase zoom range:
    - [ ] Set `minDistance` / `maxDistance` to a wider range than the current zoom clamps
    - [ ] Tune `zoomSpeed` (trackpad-friendly)
- [ ] Integrate with journey camera semantics (AC: 4)
  - [ ] Ensure `controls.target` is updated each frame in journey mode to follow the journey wire “front” reference point (the same point the camera conceptually follows).
  - [ ] Avoid fighting the controls: do not override camera position directly every frame once controls are active; instead update target + allow OrbitControls to manage camera transform.
  - [ ] Decide how journey forward motion works with user orbit:
    - [ ] Default: journey progresses forward, but camera orientation/distance is user-controlled via OrbitControls.
    - [ ] If needed, add a “recenter” helper (e.g. double-click) but only if minimal.
- [ ] Remove / disable the manual wheel handler if OrbitControls is enabled (AC: 2)
  - [ ] Prevent double-zoom (wheel handler + OrbitControls zoom).
  - [ ] Keep the desirable “prevent page scroll when over canvas” behavior.
- [ ] Validate UX + accessibility behaviors (AC: 5)
  - [ ] Reduced motion should reduce damping and/or rotate speed.
  - [ ] Keep stage focusable/label intact (`App.tsx` stage landmark).
- [ ] Testing / verification (AC: 6)
  - [ ] `npm test`
  - [ ] `npm run lint`
  - [ ] Manual: `npm run dev` → drag to orbit, scroll to zoom, confirm target stays near wire front in journey mode.

## Dev Notes

### Current architecture & constraints

- Three.js lives behind an imperative controller. React must not re-render at rAF rate.
  - `src/App.tsx` owns the rAF loop and calls `SceneController.applyViz(...)` + `render()`.  
    [Source: `_bmad-output/project-context.md` “Framework-specific rules (React + Three.js)”]
- The repo is ESM + TS “bundler mode”. Explicit `.ts/.tsx` imports are allowed.  
  [Source: `_bmad-output/project-context.md` “Language-specific rules (TypeScript)”]
- Journey mode currently advances forward and spawns nodes around the wire; camera behavior was recently adjusted and may currently be a mix of “auto-follow” and user zoom. OrbitControls should become the canonical camera controller to avoid conflicting camera writes.

### Where to implement

- **Primary**: `src/scene/SceneController.ts`
  - Add OrbitControls lifecycle: create, update per frame (`controls.update()`), dispose on teardown.
  - Integrate `controls.target` with journey reference point (wire front).
- **Do not** push high-frequency camera state into React state.

### OrbitControls import

Use Three’s official example module (bundler-friendly ESM):

- `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'`

### Reduced motion

- When `prefers-reduced-motion` is enabled (`SceneController` already has `reducedMotionMql`):
  - Lower `rotateSpeed` and `zoomSpeed`
  - Lower `dampingFactor` (or disable damping if it feels floaty)

### Pitfalls to avoid (common regressions)

- **Two competing zoom systems**: current custom wheel zoom + OrbitControls zoom → must choose one (prefer OrbitControls).
- **Fighting the controls**: do not set `camera.position` each frame once OrbitControls is active; it will cause jitter and “rubber banding”.
- **Not disposing**: ensure OrbitControls and any added listeners are cleaned up in `SceneController.dispose()`.

### References

- Journey epic context: `_bmad-output/planning-artifacts/epic-journey-through-space.md`
- Scroll zoom story (already implemented baseline): `_bmad-output/planning-artifacts/story-scroll-zoom-camera.md`
- Project constraints: `_bmad-output/project-context.md`
- Entry points:
  - `src/App.tsx` (rAF loop + scene controller usage)
  - `src/scene/SceneController.ts` (camera + journey logic)

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

### Completion Notes List

### File List

