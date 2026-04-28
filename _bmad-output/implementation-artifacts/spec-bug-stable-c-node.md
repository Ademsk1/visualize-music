---
title: 'Bugfix: stable pitch-class for repeated notes'
type: 'bugfix'
created: '2026-04-28'
status: 'in-review'
context:
  - '{project-root}/_bmad-output/project-context.md'
baseline_commit: 'feb113b8206bc8dfcf9e4e6a8861dede11baca03'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When playing the same piano key (e.g. repeated C strikes), the app sometimes (a) classifies the pitch-class differently (so the node mapping changes), and (b) does not spawn a new node on repeated strikes of the same note because nodes are currently spawned only on `focusPitchClass` changes.

**Approach:** (1) Stabilize pitch-class selection by making focus selection harmonic-/pitch-aware, not just “max chroma bin”. Use the existing autocorrelation pitch estimate (when confident) as an anchor to bias the pitch-class focus toward the fundamental, and add hysteresis/hold logic so brief harmonic/timbre spikes cannot flip focus. (2) Add an onset-style “note event” signal so repeated strikes of the same pitch-class can spawn new journey nodes even when focus remains unchanged. Keep deterministic mapping rules (colour/angle) unchanged; loudness-driven radius can still vary by velocity.

## Boundaries & Constraints

**Always:**

- Keep the architecture seam: `src/audio/*` produces features; `src/graph/*` derives `focusPitchClass`; `src/scene/*` uses `GraphViewSnapshot` without React re-renders at rAF frequency.
- Keep node angular placement deterministic per pitch-class (Story 2.2) and colour deterministic per bucket/pitch-class (Stories 2.1 / existing `hashHue`).
- Preserve reduced-motion behavior: no “nervous jitter” from rapid pitch flips.

**Ask First:**

- (None)

**Never:**

- Do not add WebGL rendering tests or couple scene updates to React state.
- Do not add backend/upload paths.

## I/O & Edge-Case Matrix

| Scenario                         | Input / State                                                                   | Expected Output / Behavior                                                                                                                                                          | Error Handling |
| -------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Stable repeated note             | Repeated strikes of the same piano key with small timbre variations             | `focusPitchClass` remains stable (no flip-flopping), so spawned nodes (when triggered) use the same pitch-class mapping                                                             | N/A            |
| Repeated same pitch-class onsets | Repeated strikes of the same key while focus stays the same                     | A new journey node is spawned per strike (bounded by a minimum interval / onset rules)                                                                                              | N/A            |
| Harmonic/timbre dominance        | Same note where a harmonic/overtones or timbre briefly dominate the chroma peak | Do not switch focus unless the new pitch-class is clearly stronger _and_ sustained beyond the hold/hysteresis rules; if pitch estimate is confident, prefer the pitch-derived class | N/A            |
| Near-gate input                  | RMS hovers around `minDbfs` causing intermittent “quiet” frames                 | Avoid rapid focus changes driven by gate chatter                                                                                                                                    | N/A            |

</frozen-after-approval>

## Code Map

- `src/graph/noteGraphState.ts` — chooses `focusPitchClass` from chroma; contains debounce logic (`FOCUS_DEBOUNCE_S`) and is the primary place to add hysteresis/hold rules.
- `src/audio/features.ts` — already computes an autocorrelation pitch estimate internally (used for `FeatureFrame.tonalHint`); we can expose a pitch-class hint (when confident) for the graph focus logic.
- `src/scene/SceneController.ts` — currently spawns journey nodes only on `focusPitchClass` change; will need to also spawn on a note-event/onset signal.

## Tasks & Acceptance

**Execution:**

- [x] `src/audio/features.ts` + `src/types/featureFrame.ts` — expose a pitch-class hint for the frame:
  - add an optional `pitchClassHint?: number` (0–11) and `pitchClassConf?: number` (0–1) when pitch is confident enough
  - keep fields optional so unpitched/noisy input continues to work
- [x] `src/graph/noteGraphState.ts` — implement harmonic-/pitch-aware focus selection + hysteresis:
  - when `pitchClassHint` is present and confident, bias selection toward that class (so the fundamental wins even if an overtone spikes)
  - still consider chroma energy (so it works without pitch)
  - prefer keeping current focus if it remains “competitive” vs the best candidate (e.g. within a ratio/epsilon)
  - only allow switching when the new candidate is stronger by a margin and persists for a minimum time window (can reuse/extend `FOCUS_DEBOUNCE_S`)
  - ensure behavior is deterministic and reduced-motion-friendly (no rapid flipping)
- [x] `src/graph/noteGraphState.test.ts` — add unit tests for stability:
  - repeated same-dominant chroma → focus stays constant
  - brief stronger “blip” for a different pitch-class → focus does not switch
  - sustained stronger different pitch-class → focus eventually switches
  - pitchClassHint present + brief chroma spike elsewhere → focus prefers the hinted class
- [x] `src/graph/noteGraphState.ts` + `src/scene/SceneController.ts` — support onset-based “note event” spawning for repeated strikes of the same pitch-class:
  - add a simple, bounded onset signal in the graph snapshot (e.g. `noteEvent: { pitchClass, id } | null`) driven by gated RMS rise and/or focus confirmation
  - ensure a minimum spacing between events to avoid machine-gun triggers from noise (`prefers-reduced-motion` may increase spacing)
  - in journey mode, spawn a node when `noteEvent` is emitted (not only when focus changes)

**Acceptance Criteria:**

- Given I repeatedly play the same piano key with small timbre/velocity variations, when nodes are spawned, then they consistently use the same pitch-class mapping (angle/colour), and the focus pitch-class does not rapidly oscillate.
- Given a harmonic briefly dominates the chroma peak, when it is short-lived, then focus does not switch; when it is sustained beyond the configured hold time, then focus can switch.
- Given I strike the same pitch-class repeatedly while focus remains stable, when each strike occurs, then the system emits a note event and a new journey node is spawned (bounded to avoid noise-trigger spamming).

## Verification

**Commands:**

- `npm test` -- expected: all tests pass (including new graph stability tests)
- `npm run lint` -- expected: no lint errors
