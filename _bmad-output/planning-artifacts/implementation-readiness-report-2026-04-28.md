---
stepsCompleted:
  - step-01-document-discovery
selectedDocuments:
  prd:
    - _bmad-output/planning-artifacts/prd.md
  architecture:
    - _bmad-output/planning-artifacts/architecture.md
  ux:
    - _bmad-output/planning-artifacts/ux-design-specification.md
  epics:
    - _bmad-output/planning-artifacts/epics.md
    - _bmad-output/planning-artifacts/epic-journey-through-space.md
  supporting:
    - _bmad-output/planning-artifacts/product-brief-visualize-music.md
    - _bmad-output/planning-artifacts/product-brief-visualize-music-distillate.md
    - _bmad-output/project-context.md
  stories:
    - _bmad-output/planning-artifacts/story-jny-1-journey-state-and-axis.md
    - _bmad-output/planning-artifacts/story-jny-2-static-wire.md
    - _bmad-output/planning-artifacts/story-jny-3-node-spawn-around-wire.md
    - _bmad-output/planning-artifacts/story-jny-4-no-snap-back-on-note-change.md
    - _bmad-output/planning-artifacts/story-jny-5-journey-tuning-params.md
    - _bmad-output/planning-artifacts/story-scroll-zoom-camera.md
    - _bmad-output/planning-artifacts/story-static-black-background.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-28
**Project:** visualize-music

## Document Discovery Complete

## PRD Files Found

**Whole Documents:**
- `_bmad-output/planning-artifacts/prd.md`

**Sharded Documents:**
- None found

## Architecture Files Found

**Whole Documents:**
- `_bmad-output/planning-artifacts/architecture.md`

**Sharded Documents:**
- None found

## Epics & Stories Files Found

**Whole Documents:**
- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/epic-journey-through-space.md`
- `_bmad-output/planning-artifacts/story-jny-1-journey-state-and-axis.md`
- `_bmad-output/planning-artifacts/story-jny-2-static-wire.md`
- `_bmad-output/planning-artifacts/story-jny-3-node-spawn-around-wire.md`
- `_bmad-output/planning-artifacts/story-jny-4-no-snap-back-on-note-change.md`
- `_bmad-output/planning-artifacts/story-jny-5-journey-tuning-params.md`
- `_bmad-output/planning-artifacts/story-scroll-zoom-camera.md`
- `_bmad-output/planning-artifacts/story-static-black-background.md`

**Sharded Documents:**
- None found

## UX Design Files Found

**Whole Documents:**
- `_bmad-output/planning-artifacts/ux-design-specification.md`

**Sharded Documents:**
- None found

## Supporting Context (used for assessment)

- `_bmad-output/planning-artifacts/product-brief-visualize-music.md`
- `_bmad-output/planning-artifacts/product-brief-visualize-music-distillate.md`
- `_bmad-output/project-context.md`

## Issues Found

- No duplicate whole vs sharded docs detected.
- Note: there are **two epic-level artifacts** in play (`epics.md` and `epic-journey-through-space.md`). This is not a conflict, but it does mean story sources-of-truth should remain consistent (see later validation).

## PRD Analysis

### Functional Requirements

FR1: A visitor can begin the experience from a single, obvious primary action.  
FR2: A visitor can see enough context to understand that microphone access may be requested before choosing to continue.  
FR3: A visitor can grant or deny microphone access through standard browser permission flows.  
FR4: A visitor can retry or recover after microphone access is blocked or unavailable, without a dead end where the platform allows recovery.  
FR5: A visitor can activate or resume audio processing when the environment requires a user gesture to start or unlock audio.  
FR6: The application can ingest live audio from the permitted input path while the session is active.  
FR7: The application can derive time-varying features from live audio sufficient to drive mood-based visuals (including a measure of overall level and broad tonal character).  
FR8: The default optimised use case is single-voice or melodic material; the product does not guarantee clean multi-note separation in the default release.  
FR9: A visitor can see a real-time visual scene that updates as they play or as sound is captured.  
FR10: A visitor can perceive that colour choices track tonal or register character of the performance (per the product’s mapping).  
FR11: A visitor can perceive that visual scale or prominence tracks loudness or dynamics of the performance.  
FR12: A visitor can recognise a piano-oriented framing of the experience (e.g. naming and light explanatory copy).  
FR13: A visitor can understand, in the default configuration, that core audio processing for the demo does not depend on uploading recordings to a remote server.  
FR14: A visitor can see clear state when the experience cannot run because of permission or audio context constraints.  
FR15: A shared URL can surface a sensible title and short summary in typical link-preview contexts where the hosting environment supports it.  
FR16: A visitor can complete the primary start path using keyboard-focusable controls where applicable to the platform.  
FR17: A visitor can distinguish error or blocked states without relying solely on colour coding.  
FR18: A visitor who prefers reduced motion can receive a less aggressive motion treatment when the product implements that support.  
FR19: A maintainer can run the application locally for development and demonstration.  
FR20: A maintainer can produce a build suitable for static or client-only hosting without a required application server for the core behavior.  
FR21: A reader can find documentation to install, run, and understand scope, goals, and documented non-goals.  
FR22: A visitor can use the core experience without creating an account.  
FR23: The default product does not present notation output or grading of performances as core capability in the MVP scope described in this PRD.  

Total FRs: 23

### Non-Functional Requirements

NFR-P1 (Responsiveness): On the reference desktop environment, audio-driven visual updates must keep up with live input; qualitative review must not find multi-second lag between audible change and visible change.  
NFR-P2 (Sustained use): During a 1–2 minute tryout on a typical laptop, the experience must not fall into chronic stutter that makes the demo unusable (brief dips are acceptable).  
NFR-P3 (Frame cadence): Visual output should target smooth motion at display refresh on the reference hardware tier; reduce visual cost before removing interactivity.  
NFR-S1 (Transport): Production is served over HTTPS (or an equivalent secure context required for microphone access in browsers).  
NFR-S2 (Default data handling): Default configuration does not transmit captured audio to remote servers for core processing.  
NFR-A1 (Primary path): Primary start / enable-audio path is operable with keyboard-focusable controls where the platform allows.  
NFR-A2 (Sensory): Critical status and error states do not rely on colour alone.  
NFR-A3 (Reduced motion, optional): If reduced motion is implemented, it should substantially reduce intense or strobing motion while preserving some feedback unless the user prefers a minimal treatment.  

Total NFRs: 8

### Additional Requirements

- MVP is desktop-first; mobile polish is out of v1, but narrow viewports must remain usable for primary CTA.
- Processing is local-first by default; no upload/telemetry implied.
- Mic requires secure context (HTTPS or localhost).
- Render loop should feel immediate (no multi-second lag) and not stutter under typical melodic use.

### PRD Completeness Assessment

- PRD is **complete and internally coherent** for the stated scope (client-only, melody-first, portfolio demo).
- Requirements are **mostly qualitative**, which is appropriate for a portfolio piece, but can lead to ambiguity in performance acceptance unless we add concrete “definition of done” checks in stories (e.g. smoke checklist + manual perf spot-checks).

## Epic Coverage Validation

### Epic FR Coverage Extracted

From `_bmad-output/planning-artifacts/epics.md`:

FR1: Epic 1  
FR2: Epic 3  
FR3: Epic 1  
FR4: Epic 3  
FR5: Epic 1  
FR6: Epic 1  
FR7: Epic 1  
FR8: Epic 1  
FR9: Epic 1  
FR10: Epic 2  
FR11: Epic 2  
FR12: Epic 2  
FR13: Epic 1  
FR14: Epic 3  
FR15: Epic 4  
FR16: Epic 3  
FR17: Epic 3  
FR18: Epic 1  
FR19: Epic 4  
FR20: Epic 4  
FR21: Epic 4  
FR22: Epic 1  
FR23: Epic 1  

Total PRD FRs in PRD: 23  
Total PRD FRs mapped in `epics.md` coverage map: 23

### Coverage Matrix (PRD → Epics/Stories)

| FR Number | PRD Requirement (summary) | Epic/Story Coverage | Status |
| --- | --- | --- | --- |
| FR1 | Single obvious primary action | **No story explicitly implements FR1** | ❌ MISSING |
| FR2 | Pre-permission context | Epic 3 Story 3.2 | ✓ Covered |
| FR3 | Permission flow supported | **No story explicitly implements FR3** | ❌ MISSING |
| FR4 | Retry/recover after blocked mic | Epic 3 Story 3.2 | ✓ Covered |
| FR5 | AudioContext unlock/resume | **No story explicitly implements FR5** | ❌ MISSING |
| FR6 | Ingest live audio | **No story explicitly implements FR6** | ❌ MISSING |
| FR7 | Derive features (level + tonal) | **No story explicitly implements FR7** | ❌ MISSING |
| FR8 | Melody-first behavior / no polyphony guarantee | **No story explicitly implements FR8** | ❌ MISSING |
| FR9 | Real-time scene updates | Epic 1 Stories 1.1–1.5 | ✓ Covered |
| FR10 | Colour tracks tonal/register | Epic 2 Story 2.1 | ✓ Covered |
| FR11 | Scale/prominence tracks loudness | Epic 1 Story 1.3 + Epic 1 Story 1.5 + Epic 2 Story 2.3 | ✓ Covered |
| FR12 | Piano-oriented framing | **No story explicitly implements FR12** | ❌ MISSING |
| FR13 | Local-first trust (no upload) | **No story explicitly implements FR13** | ❌ MISSING |
| FR14 | Clear blocked state | Epic 3 Stories 3.2–3.3 | ✓ Covered |
| FR15 | Link preview (title/summary) | **No story explicitly implements FR15** | ❌ MISSING |
| FR16 | Keyboard primary path | Epic 3 Story 3.1 | ✓ Covered |
| FR17 | Non-colour-only error/state | Epic 3 Story 3.2 | ✓ Covered |
| FR18 | Reduced motion support | Epic 1 Story 1.1 + Epic 2 Story 2.3 | ✓ Covered |
| FR19 | Maintainer can run locally | **No story explicitly implements FR19** | ❌ MISSING |
| FR20 | Static hosting build | **No story explicitly implements FR20** | ❌ MISSING |
| FR21 | Docs: install/run/scope | **No story explicitly implements FR21** | ❌ MISSING |
| FR22 | No account required | **No story explicitly implements FR22** | ❌ MISSING |
| FR23 | No notation/grading capability | **No story explicitly implements FR23** | ❌ MISSING |

### Missing FR Coverage (Critical)

FR1: A visitor can begin the experience from a single, obvious primary action.  
- Impact: Core onboarding is not guaranteed by the story plan; risk of a “working visuals but unclear start” experience.  
- Recommendation: Add a small story (likely in Epic 3 or a dedicated “Onboarding & Session” epic) for the primary Start/Retry action and state ladder.

FR3: A visitor can grant or deny microphone access through standard browser permission flows.  
- Impact: Mic permission is core to the demo; without explicit story coverage, implementation details may drift.  
- Recommendation: Add an onboarding/audio session story that explicitly covers permission request + denied handling.

FR5: A visitor can activate or resume audio processing when the environment requires a user gesture to start or unlock audio.  
- Impact: Common browser failure mode; demo may appear broken.  
- Recommendation: Add a story covering AudioContext suspend/resume semantics and retry loop.

FR6: The application can ingest live audio from the permitted input path while the session is active.  
- Impact: Fundamental capability for the product; not explicitly planned.  
- Recommendation: Add a story for mic input acquisition and lifecycle.

FR7: The application can derive time-varying features from live audio sufficient to drive mood-based visuals.  
- Impact: The mapping epics assume inputs exist; risk of unclear contract between audio and scene.  
- Recommendation: Add a story that defines/validates the feature-frame contract used by the scene.

FR8: Melody-first behavior and scope honesty.  
- Impact: Product positioning risk (accidentally implying polyphony correctness).  
- Recommendation: Add a story ensuring copy/README and any UX framing reflect melody-first scope.

FR12: Piano-oriented framing (naming/copy).  
- Impact: Portfolio story loses coherence.  
- Recommendation: Add a story that covers the minimal copy/labels that convey the framing.

FR13: Local-first trust messaging/behavior.  
- Impact: User trust (mic) and product narrative.  
- Recommendation: Add a story to ensure copy explicitly states local processing and no upload (and that no upload code exists).

FR15: Link preview basics.  
- Impact: Portfolio shareability.  
- Recommendation: Add a story for title/meta/OG basics consistent with GitHub Pages deploy.

FR19–FR21: Maintainer run/build/docs.  
- Impact: “River” journey and long-term maintainability.  
- Recommendation: Add explicit README/DX stories; Docker stories help, but don’t replace install/run documentation and static build requirements.

FR22–FR23: Scope boundaries (no account; no notation/grading).  
- Impact: Scope creep and narrative mismatch.  
- Recommendation: Add a story that codifies these as explicit non-goals in README and UI copy.

### Coverage Statistics

- Total PRD FRs: 23
- FRs explicitly implemented by current story set: 9
- Coverage percentage (explicit story coverage): 39%

## UX Alignment Assessment

### UX Document Status

- Found: `_bmad-output/planning-artifacts/ux-design-specification.md` (complete)

### Alignment Issues

- **PRD/UX expect a full end-to-end “Start listening → permission → AudioContext running → live” ladder** with a bottom HUD and recoverable errors. The current `epics.md` includes accessibility-focused chrome stories (Epic 3) but does **not** currently include explicit stories for:
  - the **single obvious Start/Retry primary action** (FR1),
  - **permission request** flows (FR3),
  - **AudioContext unlock/resume** behavior (FR5),
  - the **mic ingestion + feature extraction contract** that drives the stage (FR6–FR7),
  - nor the minimal **piano-framing copy** (FR12) and **local-first trust copy** (FR13).

### Warnings

- Architecture explicitly calls out **first-run reliability** (permission + suspended AudioContext) as first-class behavior; without stories for FR1/FR3/FR5/FR6/FR7, implementation order may drift and the UX “must not fail” moment (“sound → visible response”) is not guaranteed by the plan.

## Epic Quality Review

### 🔴 Critical Violations

- **Epic coverage map claims coverage that the story set does not implement.**  
  - Evidence: `epics.md` maps FR1/FR3/FR5/FR6/FR7/FR8/FR12/FR13/FR15/FR19–FR23 to epics, but there are no corresponding stories with `Implements:` lines for those FRs.  
  - Impact: Sprint planning will select stories that cannot deliver the end-to-end UX the PRD/UX require (Start → permission → live).
  - Remediation: Add explicit stories for the missing FRs (or reintroduce an “Onboarding & Audio Session” epic) before implementation begins.

- **Epic 4 is a technical milestone epic (not user-value-first) under the create-epics-and-stories standards.**  
  - Epic 4 (“Ship-ready Reliability”) primarily covers internal quality (coverage enforcement + Docker).  
  - Impact: Fails the strict “user value first” definition; acceptable as a parallel workstream, but should be reframed as maintainer value with explicit PRD journey linkage (River/You), or moved to a “Maintainability & Distribution” epic tied to FR19–FR21 with concrete outcomes (README, build pipeline, reproducible demo).

### 🟠 Major Issues

- **Journey epic sources-of-truth duplicated** (`epic-journey-through-space.md` vs `epics.md`).  
  - Impact: Divergence risk (acceptance criteria drift).  
  - Remediation: Treat `epics.md` as the canonical sprint planning artifact and ensure story text stays aligned with the standalone epic file (or deprecate one).

- **Several stories lack explicit error-state acceptance criteria** for the core session ladder (because the ladder stories are currently missing).  
  - Impact: Browser-specific mic/AudioContext edge cases can regress silently.

### 🟡 Minor Concerns

- **Story “Implements” lines exist**, which is good for traceability, but they currently cover only a subset of PRD FRs. Once missing FR stories are added, re-run this check to ensure explicit coverage rises to ~100%.

## Summary and Recommendations

### Overall Readiness Status

NEEDS WORK

### Critical Issues Requiring Immediate Action

1. **Core PRD journey coverage is incomplete in the story set** (explicit story coverage ~39%). Missing coverage includes FR1, FR3, FR5, FR6, FR7, FR8, FR12, FR13, FR15, FR19–FR23.  
2. **First-run reliability path is not explicitly planned** (permission + suspended AudioContext + retry), despite being called out as essential in both UX and Architecture.  
3. **Traceability inconsistency risk** due to dual epic artifacts (`epics.md` and `epic-journey-through-space.md`) if they drift.

### Recommended Next Steps

1. **Add an “Onboarding & Audio Session” story set** (either a new epic or prepend stories to Epic 3) that explicitly implements: FR1, FR3, FR5, FR6, FR7, FR8, FR12, FR13, FR22, FR23.  
   - Keep these stories small: Start/Retry UI + state ladder, permission denied recovery, AudioContext resume, mic ingestion, FeatureFrame contract, and minimal “local-first + melody-first” copy.
2. **Add a “Link preview + documentation” story** to cover FR15 and FR19–FR21 (README quickstart + scope/non-goals + deploy notes).  
3. Decide and document **one canonical source of truth** for the Journey epic text (either keep `epic-journey-through-space.md` as reference-only or fold it into `epics.md` and stop updating it separately).
4. After updating stories, **re-run Implementation Readiness** and then proceed to **Sprint Planning**.

### Final Note

This assessment identified **material planning gaps** in requirement-to-story coverage for the PRD’s end-to-end core loop. Address the critical issues before sprint planning to avoid implementing impressive visuals without the “must not fail” first-run UX.

---

## IR Re-run Addendum (after planning gap fixes)

This section reflects the updated `_bmad-output/planning-artifacts/epics.md` after adding Epic 5 (Onboarding & Audio Session Core Loop) and adding Epic 4 documentation + link-preview stories.

### Updated Coverage Matrix (PRD → Epics/Stories)

| FR Number | PRD Requirement (summary) | Epic/Story Coverage | Status |
| --- | --- | --- | --- |
| FR1 | Single obvious primary action | Epic 5 Story 5.1 | ✓ Covered |
| FR2 | Pre-permission context | Epic 5 Story 5.1 + Epic 3 Story 3.2 | ✓ Covered |
| FR3 | Permission flow supported | Epic 5 Story 5.2 | ✓ Covered |
| FR4 | Retry/recover after blocked mic | Epic 5 Story 5.1 + Epic 5 Story 5.2 + Epic 3 Story 3.2 | ✓ Covered |
| FR5 | AudioContext unlock/resume | Epic 5 Story 5.3 | ✓ Covered |
| FR6 | Ingest live audio | Epic 5 Story 5.4 | ✓ Covered |
| FR7 | Derive features (level + tonal) | Epic 5 Story 5.5 | ✓ Covered |
| FR8 | Melody-first behavior / no polyphony guarantee | Epic 5 Story 5.6 + Epic 4 Story 4.4 | ✓ Covered |
| FR9 | Real-time scene updates | Epic 1 Stories 1.1–1.5 | ✓ Covered |
| FR10 | Colour tracks tonal/register | Epic 2 Story 2.1 | ✓ Covered |
| FR11 | Scale/prominence tracks loudness | Epic 1 Story 1.3 + Epic 1 Story 1.5 + Epic 2 Story 2.3 | ✓ Covered |
| FR12 | Piano-oriented framing | Epic 5 Story 5.6 | ✓ Covered |
| FR13 | Local-first trust (no upload) | Epic 5 Story 5.4 + Epic 4 Story 4.4 | ✓ Covered |
| FR14 | Clear blocked state | Epic 5 Stories 5.1–5.3 + Epic 3 Stories 3.2–3.3 | ✓ Covered |
| FR15 | Link preview (title/summary) | Epic 4 Story 4.5 | ✓ Covered |
| FR16 | Keyboard primary path | Epic 3 Story 3.1 | ✓ Covered |
| FR17 | Non-colour-only error/state | Epic 3 Story 3.2 | ✓ Covered |
| FR18 | Reduced motion support | Epic 1 Story 1.1 + Epic 2 Story 2.3 | ✓ Covered |
| FR19 | Maintainer can run locally | Epic 4 Story 4.4 | ✓ Covered |
| FR20 | Static hosting build | Epic 4 Story 4.4 | ✓ Covered |
| FR21 | Docs: install/run/scope | Epic 4 Story 4.4 | ✓ Covered |
| FR22 | No account required | Epic 4 Story 4.4 + Epic 5 Story 5.4 | ✓ Covered |
| FR23 | No notation/grading capability | Epic 4 Story 4.4 + Epic 5 Story 5.6 | ✓ Covered |

### Updated Coverage Statistics

- Total PRD FRs: 23
- FRs explicitly implemented by current story set: 23
- Coverage percentage (explicit story coverage): 100%

### Updated UX Alignment Note

- The UX “must not fail” ladder (Start → permission → AudioContext running → live) is now explicitly planned in **Epic 5 Stories 5.1–5.5**.

### Updated Readiness Status

READY

### Residual recommendations (non-blocking)

- Consider reframing Epic 4 title/goal to be more explicitly “maintainer value” (it already is, but the epic still mixes internal quality work with distribution; this is acceptable for a solo project).
- Pick one canonical “journey epic” source-of-truth (`epics.md` recommended for sprint planning) and treat `epic-journey-through-space.md` as reference-only to prevent drift.

