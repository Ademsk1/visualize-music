# Story 1.1: Node migration drift

Status: ready-for-dev

## Story

As a portfolio visitor watching the visualization,
I want the note spheres (graph nodes) to slowly migrate in a stable direction over time,
so that the scene feels alive and evolving while preserving “each note has a place”.

## Acceptance Criteria

1. **Slow drift**: When the mic session is live and the note-graph is visible, the rendered node positions drift slowly in a single direction over time (seconds→minutes scale; no jitter).  
2. **Stable direction (v1)**: The drift direction is chosen randomly once per session (or per graph reset) and stays constant while listening is active.  
3. **Colour consistency**: Node colours remain consistent per pitch-class (existing mapping), regardless of drift.  
4. **Edges stay attached**: Strands/edges continue to connect the correct two nodes while nodes drift (no “detached” lines).  
5. **Camera follows**: The camera continues to frame the full set of nodes as they drift (no drifting out of view); revisit behaviour (pan/emphasis) still works.  
6. **Reduced motion**: If `prefers-reduced-motion` is enabled, drift is reduced substantially (or disabled) so the scene remains comfortable.  
7. **Performance**: Drift computation does not add per-frame allocations that cause sustained stutter on the reference environment (desktop Chrome).  

## Tasks / Subtasks

- [ ] Add “drift” to the graph state model (AC: 1, 2, 4, 7)
  - [ ] Store a drift direction vector and start time in `NoteGraphModel` (`src/graph/noteGraphState.ts`).
  - [ ] Apply drift as an **additive translation** to every node position returned in the snapshot (keeps relative localization + spacing; preserves node non-overlap invariants).
  - [ ] Ensure edge endpoints use the **drifted** positions (either by computing drifted node positions once and referencing them, or by drifting `from/to` in edge snapshots consistently).
  - [ ] Expose drift constants: `DRIFT_SPEED_UNITS_PER_S` (suggested starting point: `0.03`) and an optional `DRIFT_ENABLED` / `DRIFT_REDUCED_MOTION_MULT` to dampen.

- [ ] Integrate drift into rendering + camera fit (AC: 4, 5, 6)
  - [ ] Confirm `SceneController` uses the snapshot positions for both node meshes and edge lines (it currently rebuilds edges each frame; ensure that stays correct when positions change).
  - [ ] Confirm camera fitting is based on content radius + centroid (and thus follows drift). If current `contentRadius` is computed from drifted positions, framing will remain stable by construction.
  - [ ] Apply reduced-motion behavior: if `prefers-reduced-motion` is on, reduce drift speed (e.g. multiply by `0.15`) or disable entirely.

- [ ] Tests (AC: 1, 2, 4)
  - [ ] Unit test: after enabling drift, snapshots at `t0` and `t1` have translated node positions by approximately `dir * speed * Δt`.
  - [ ] Unit test: direction is stable across repeated `update` calls in the same session, and re-randomized on `reset()`.

- [ ] Lint/build smoke (AC: 7)
  - [ ] `npm test`, `npm run lint`, `npm run build`.

## Dev Notes

- **Do not change** the “note localization” model: one sphere per octave-agnostic pitch class and revisits return to the same sphere. Drift must be additive, not a re-placement algorithm.  
  - Source: `src/graph/noteGraphState.ts` (`NoteGraphModel` placement + node spacing; `MIN_NODE_SEP`, `NEW_NODE_SHELL_BASE`).  
- **Colour mapping is already stable** per pitch class (hash hue). Drift must not affect colour selection.  
  - Source: `src/scene/SceneController.ts` `hashHue(pc)` used in `nodeMaterial`.  
- **Keep the audio→feature→scene seam**: no high-frequency React state updates in rAF; rAF loop already pulls analyser data and drives the scene imperatively. Drift belongs in the graph model or scene controller, not in React state.  
  - Source: `_bmad-output/planning-artifacts/architecture.md` (React↔Three imperative rAF guidance), and `src/App.tsx` rAF loop.  
- **Reduced motion**: This app already reads `prefers-reduced-motion` for feature smoothing and scene behavior. Drift should respect the same preference (either by checking the same media query in the model or by passing a reduced-motion boolean down).  
  - Sources: `src/audio/features.ts` (`setFeatureReducedMotion`), `src/scene/SceneController.ts` (`reducedMotionMql`).  

### Proposed technical shape (implementation hint, not a mandate)

- Add to `NoteGraphModel`:
  - `private driftDir: {x,y,z} | null`
  - `private driftStartS: number`
  - `private driftSpeed = 0.03`
  - Initialize direction lazily when the first “real” node is assigned (or on first live update) so the direction exists only for the live graph.
  - Compute drift as: `offset = driftDir * driftSpeed * (nowS - driftStartS)`.
- Apply offset at snapshot build time:
  - `node.position = basePos + offset`
  - `edge.from/to = basePos + offset`
  - `centroid = baseCentroid + offset`
  - `contentRadius` unchanged by pure translation.

### References

- PRD constraints: `_bmad-output/planning-artifacts/prd.md` (FR7, FR9–FR11, NFR-P1–P3; melody-first, performance).  
- Architecture patterns: `_bmad-output/planning-artifacts/architecture.md` (React↔Three imperative render loop; file structure and seam).  
- UX motion principle: `_bmad-output/planning-artifacts/ux-design-specification.md` (“Pristine motion”; avoid jitter; reduced motion).  
- Current implementation anchors:
  - `src/graph/noteGraphState.ts` (node placement, debounce, brightness, spacing).
  - `src/scene/SceneController.ts` (node colour mapping and camera framing).
  - `src/App.tsx` (rAF loop and wiring).

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Debug Log References

- N/A (story creation only)

### Completion Notes List

- N/A (story creation only)

### File List

- (planned) `src/graph/noteGraphState.ts`
- (planned) `src/graph/noteGraphState.test.ts`

