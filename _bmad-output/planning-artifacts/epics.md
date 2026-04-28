---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/product-brief-visualize-music.md
  - _bmad-output/project-context.md
---

# visualize-music - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for visualize-music, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

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

FR24: The visualization maps the same frequency/tonal bucket to a consistent, stable colour over time (no hue “random walk” for the same bucket).  
FR25: In journey mode, note nodes preserve a consistent geometric angle relationship relative to the journey wire direction (consistent angular placement rule).  
FR26: In journey mode, note node radial distance from the wire increases as measured loudness (dB) increases, using an exponential response curve.  
FR27: In journey mode, node radial distance respects a minimum safe distance such that nodes never intersect the wire.  

### NonFunctional Requirements

NFR-P1 (Responsiveness): On the reference desktop environment, audio-driven visual updates must keep up with live input; qualitative review must not find multi-second lag between audible change and visible change.  
NFR-P2 (Sustained use): During a 1–2 minute tryout on a typical laptop, the experience must not fall into chronic stutter that makes the demo unusable.  
NFR-P3 (Frame cadence): Visual output should target smooth motion at display refresh on the reference hardware tier; reduce visual cost before removing interactivity.  

NFR-S1 (Transport): Production is served over HTTPS (or an equivalent secure context required for microphone access in browsers).  
NFR-S2 (Default data handling): Default configuration does not transmit captured audio to remote servers for core processing.  

NFR-A1 (Primary path): Primary start / enable-audio path is operable with keyboard-focusable controls where the platform allows.  
NFR-A2 (Sensory): Critical status and error states do not rely on colour alone.  
NFR-A3 (Reduced motion, optional): If reduced motion is implemented, it substantially reduces intense or strobing motion while preserving some feedback.  

NFR-Q1 (Coverage): Automated test coverage is at least 70% overall (measured via a repeatable CI command).  
NFR-A4 (WCAG): UI chrome meets WCAG 2.1 AA expectations for contrast, focus visibility, keyboard operation, and accessible status messaging (to the extent applicable to a WebGL-heavy experience).  

NFR-O1 (Container): The application can be built and run in a Docker container for consistent local dev/demo and CI portability.  

### Additional Requirements

- Keep the architecture seam: `src/audio/*` produces a typed feature frame consumed by `src/scene/*`; do not drive WebGL via React re-renders at rAF frequency.
- Repo is ESM + TypeScript bundler mode: keep imports ESM-compatible; prefer `import type` for type-only imports.
- Three.js should remain isolated behind dynamic import boundaries where applicable; avoid turning Three into a static top-level import unless intentional.
- Client-only by default: do not introduce backend/upload paths as part of these epics unless explicitly added to product scope.
- Respect secure-context mic constraints (HTTPS/localhost) in docs and deployment guidance.

### UX Design Requirements

UX-DR1: Implement a full-bleed black stage with a restrained “chrome” layer so the 3D experience reads as the hero surface.  
UX-DR2: Implement a bottom HUD bar as the MVP baseline layout: primary CTA (Start/Retry) + clear state (idle/live/error) without crowding the stage.  
UX-DR3: Ensure blocked/failed states are plain and recoverable: present “what failed” + “what to do” + Retry, aligned with PRD journeys.  
UX-DR4: Ensure status/error signaling is not colour-only: pair colour with text and/or icon for blocked/suspended/live states.  
UX-DR5: Ensure keyboard focus order supports the primary path (Start/Retry first); focus is visible on all interactive chrome controls.  
UX-DR6: Provide accessible dynamic status updates for screen readers (e.g. `aria-live` on changing error/status text in the HUD) where appropriate.  
UX-DR7: Respect `prefers-reduced-motion` end-to-end (chrome + scene): reduce floaty damping/animation intensity while preserving legible feedback.  
UX-DR8: Responsive best-effort: on narrow widths the HUD can wrap, but Start/Retry and critical copy remain visible and usable.  
UX-DR9: Keep the stage and chrome separation: no essential system state lives only on the canvas label; blockers/status live in the HUD.  

### FR Coverage Map

FR1: Epic 1 - Start the experience via one primary CTA  
FR2: Epic 3 - Understand mic need + clear chrome copy before granting access  
FR3: Epic 1 - Standard browser mic permission flow supported  
FR4: Epic 3 - Retry/recover from denied mic and blocked states (UX + a11y)  
FR5: Epic 1 - AudioContext unlock/resume via user gesture (core loop reliability)  
FR6: Epic 1 - Ingest live audio while session is active  
FR7: Epic 1 - Derive time-varying features (level + tonal hint) to drive visuals  
FR8: Epic 1 - Melody-first behavior and honest scope (no polyphony guarantee)  
FR9: Epic 1 - Real-time visual scene updates with live input  
FR10: Epic 2 - Tone/register → colour mapping that reads musically  
FR11: Epic 2 - Dynamics → presence/scale/readable emphasis (refine mapping rules)  
FR12: Epic 2 - Piano-oriented framing in the experience (visual language and copy alignment)  
FR13: Epic 1 - Local-first trust messaging/behavior (no default upload)  
FR14: Epic 3 - Clear, accessible state when blocked by permission/context constraints  
FR15: Epic 4 - Link-preview/metadata polish + ship-readiness  
FR16: Epic 3 - Keyboard operability for the primary path in chrome  
FR17: Epic 3 - Non-colour-only status/error cues (text/icon + colour)  
FR18: Epic 1 - Reduced-motion support baseline end-to-end  
FR19: Epic 4 - Maintainer can run locally reliably  
FR20: Epic 4 - Build suitable for static/client-only hosting  
FR21: Epic 4 - Documentation for install/run/scope/non-goals  
FR22: Epic 1 - No account required for core experience  
FR23: Epic 1 - No notation/grading surfaced as MVP capability  
FR24: Epic 2 - Consistent stable colours for frequency/tonal buckets  
FR25: Epic 2 - Consistent angular placement rule for wire↔node geometry  
FR26: Epic 2 - Exponential loudness (dB) → radial distance mapping  
FR27: Epic 2 - Minimum safe node distance prevents wire intersection

## Epic List

### Epic 1: Journey Through Space (Trajectory + Note Nodes)
A visitor can perceive continuous forward travel through space as they play: a stable wire anchored to a travel axis, with note nodes spawning around it without snap-back or jitter.
**FRs covered:** FR9, FR11, FR18, FR24, FR25, FR27

### Epic 2: Stronger Musical Mapping (stable colour + exponential dynamics distance)
A visitor can read a stable, intentional mapping: consistent colours for tonal buckets and an expressive, exponential loudness-to-distance response that stays bounded and prevents wire intersection.
**FRs covered:** FR10, FR11, FR24, FR26, FR27

### Epic 3: Accessible, WCAG-aligned Chrome (HUD, status, errors, keyboard)
A visitor can understand system state and complete the primary start/retry path with accessible chrome: keyboard operable controls, non-colour-only status/error signaling, and recoverable, plain error handling.
**FRs covered:** FR2, FR4, FR14, FR16, FR17

### Epic 4: Ship-ready Reliability (tests + containerized run/build)
A maintainer and repo reader can run, build, and demo the project consistently, backed by strong automated tests/coverage and a Dockerized run/build path.
**FRs covered:** FR15, FR19, FR20, FR21

### Epic 5: Onboarding & Audio Session Core Loop (Start → permission → live)
A visitor can reliably start listening, grant/deny permission, recover from common browser audio blocks, and see the stage respond immediately; the product messaging remains local-first and melody-first with clear framing.
**FRs covered:** FR1, FR3, FR5, FR6, FR7, FR8, FR12, FR13, FR22, FR23

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic 1: Journey Through Space (Trajectory + Note Nodes)

Make note playback feel like forward travel through space: the world advances along a travel axis, a stable wire persists, and note events spawn nodes around the wire with consistent geometry and no snap-back.

### Story 1.1: Journey state + travel axis contract

As a player,
I want the world to move forward continuously
So that I feel like I’m on a journey as I play.

**Implements:** FR9, FR18

**Acceptance Criteria:**

**Given** the app is running  
**When** the journey system initializes  
**Then** there is a single journey state that owns travel axis and monotonic progress  
**And** default axis direction and speed are deterministic

**Given** the journey is running  
**When** time advances  
**Then** journey progress moves forward monotonically (never decreases)  
**And** note changes do not reset or re-anchor progress

### Story 1.2: Render the static wire through time

As a viewer,
I want a stable wire aligned with travel direction
So that the motion reads as intentional and I understand the forward journey.

**Implements:** FR9

**Acceptance Criteria:**

**Given** the journey is running  
**When** the scene renders  
**Then** a persistent wire is visible and aligned to the journey travel axis  
**And** it remains visually stable across note events and ambient noise

### Story 1.3: Spawn nodes around the wire (orthogonal + fixed radius + random angle)

As a player,
I want each note to create a node around the wire
So that notes become spatial markers along my journey.

**Implements:** FR9, FR11, FR25, FR27

**Acceptance Criteria:**

**Given** a note event occurs  
**When** a node is spawned  
**Then** it appears at a fixed radial distance \(r\) from the wire  
**And** its offset is orthogonal to the travel axis in the plane normal to the axis

**Given** multiple note events occur  
**When** nodes spawn  
**Then** each node uses a randomized angle \(\theta\) around the wire  
**And** nodes spawn at the current (or slightly forward) journey progress, never behind

### Story 1.4: No snap-back on note change (trajectory continuity)

As a player,
I want note changes to add nodes without re-centering the journey around the last note
So that I never feel snapped backward.

**Implements:** FR9

**Acceptance Criteria:**

**Given** I play a sequence of notes  
**When** the focused note changes rapidly  
**Then** the journey continues advancing forward without oscillation or backward snaps  
**And** any framing adjustments remain smooth and preserve forward direction

### Story 1.5: Journey tuning parameters (radius, wire visibility, clutter control)

As a maintainer,
I want a small set of parameters to tune the journey look
So that the visual read is crisp and consistent.

**Implements:** FR9, FR11

**Acceptance Criteria:**

**Given** the journey is implemented  
**When** I adjust configuration values  
**Then** node spawn radius and wire visibility can be tuned from a single config location  
**And** node persistence is bounded (cap and/or fade strategy) to prevent clutter in long sessions

## Epic 2: Stronger Musical Mapping (stable colour + exponential dynamics distance)

Make the journey read as authored and musically consistent: the same tonal bucket always yields the same colour, node placement follows a consistent angular rule (not arbitrary jitter), and loudness increases node distance from the wire with an exponential curve while preventing intersection.

### Story 2.1: Stable colour mapping per tonal/frequency bucket

As a viewer,
I want the same tonal or frequency bucket to always map to the same colour
So that the scene reads as intentional and consistent over time.

**Implements:** FR10, FR24

**Acceptance Criteria:**

**Given** the system maps audio into discrete tonal/frequency buckets  
**When** the same bucket is active across multiple moments in a session  
**Then** the hue/colour selection for that bucket is stable (no drift or random walk)  
**And** switching away and back to the bucket restores the same colour

**Given** adjacent buckets are active in sequence  
**When** the bucket changes  
**Then** the colour change is clearly attributable to the bucket change (not noise)  
**And** the mapping is deterministic (reloading the app yields the same bucket→colour mapping)

### Story 2.2: Consistent angular placement rule between wire and note nodes

As a viewer,
I want note nodes to maintain a consistent angular placement rule around the wire
So that spatial relationships feel coherent instead of randomly rotating over time.

**Implements:** FR25

**Acceptance Criteria:**

**Given** a note node is spawned around the wire  
**When** its around-wire angle \(\theta\) is chosen  
**Then** \(\theta\) follows a consistent rule (e.g. deterministic per bucket/pitch-class, optionally with a small bounded variation)  
**And** the rule produces stable “angles” that do not jitter frame-to-frame

**Given** the same bucket/pitch-class occurs multiple times  
**When** nodes are spawned for that bucket/pitch-class  
**Then** their angular placement is consistent enough to be recognizable as the same bucket/pitch-class  
**And** the placement remains orthogonal to the travel axis (i.e. in the plane normal to the axis)

### Story 2.3: Exponential loudness (dB) → node radial distance with safe minimum

As a player/viewer,
I want louder sounds to push note nodes farther from the wire using an exponential response
So that dynamics read as presence/space while staying visually safe and bounded.

**Implements:** FR11, FR26, FR27, NFR-A3

**Acceptance Criteria:**

**Given** a node is spawned for a note event  
**When** its radial distance from the wire is computed from measured loudness in decibels (or a derived dB value)  
**Then** the distance increases with loudness using an exponential curve (monotonic, noticeably more separation at higher loudness)  
**And** the distance is clamped to a reasonable maximum to prevent “to infinity” spacing

**Given** the wire has a nonzero visible thickness and nodes have a nonzero radius  
**When** the minimum distance rule is applied  
**Then** the node’s radial distance never results in intersection with the wire (a safe minimum is enforced)  
**And** at very low loudness, nodes still spawn at or above the minimum safe distance (no wire overlap)

**Given** `prefers-reduced-motion: reduce` is enabled  
**When** loudness varies rapidly  
**Then** distance changes feel stable (bounded and smoothed enough to avoid aggressive “pumping”)  
**And** the mapping remains responsive without nervous jitter

## Epic 3: Accessible, WCAG-aligned Chrome (HUD, status, errors, keyboard)

Ensure the experience’s chrome is accessible and standards-aligned: keyboard operable primary actions, visible focus, non-colour-only status/error signaling, readable contrast for UI text, and screen-reader-friendly status updates. The WebGL stage remains expressive, but essential state is communicated in the HUD.

### Story 3.1: Keyboard operable primary path + visible focus

As a visitor,
I want to start/retry the experience using only the keyboard with clear focus visibility
So that I can operate the primary flow without a mouse.

**Implements:** FR16, NFR-A1

**Acceptance Criteria:**

**Given** I open the app  
**When** I use Tab/Shift+Tab  
**Then** the primary Start/Retry control is reachable and first in the logical focus order  
**And** focus is always visibly indicated on interactive controls

**Given** the Start/Retry control is focused  
**When** I press Enter or Space  
**Then** the same action occurs as clicking the control  
**And** focus does not get trapped or lost during state transitions

### Story 3.2: Non-colour-only state and error signaling

As a visitor,
I want blocked, idle, and live states to be distinguishable without relying on colour alone
So that I can understand the system state regardless of colour perception.

**Implements:** FR2, FR4, FR14, FR17, NFR-A2

**Acceptance Criteria:**

**Given** the app transitions between idle, requesting/starting, live, and error states  
**When** the state is displayed in the HUD  
**Then** it includes a text label for the state  
**And** state is reinforced by a non-colour cue (e.g. icon, shape, or copy), not colour alone

**Given** a microphone or AudioContext issue occurs  
**When** an error is shown  
**Then** the message explains what failed and includes an explicit recovery action (e.g. Retry)  
**And** the error presentation does not depend on colour alone to be recognized

### Story 3.3: Screen-reader-friendly dynamic status updates (aria-live)

As a screen reader user,
I want status and error changes to be announced appropriately
So that I can understand when the experience becomes live or when recovery steps are needed.

**Implements:** FR14

**Acceptance Criteria:**

**Given** the HUD contains a dynamic status/error region  
**When** the status changes (idle → requesting → live) or an error is raised/cleared  
**Then** the change is announced via an appropriate `aria-live` strategy (polite for status, assertive for blocking errors)  
**And** announcements are concise and do not spam on every frame

### Story 3.4: WCAG-oriented contrast for chrome text and controls

As a visitor,
I want HUD text and controls to remain legible on the dark stage
So that system state and actions are readable in typical viewing conditions.

**Implements:** NFR-A4

**Acceptance Criteria:**

**Given** the HUD uses a dark/black stage background  
**When** I view the Start/Retry control and status/error text  
**Then** contrast is sufficient for WCAG 2.1 AA expectations for UI text and interactive controls  
**And** focus indicators are visible and not low-contrast against the background

## Epic 4: Ship-ready Reliability (tests + containerized run/build)

Make the project easier to maintain and demo consistently: raise automated test coverage to the target level and provide a Dockerized build/run path suitable for local use and CI.

### Story 4.1: Coverage reporting and 70% target enforcement

As a maintainer,
I want an automated, repeatable way to measure and enforce at least 70% test coverage
So that regressions are caught and code quality stays consistent.

**Implements:** NFR-Q1

**Acceptance Criteria:**

**Given** I run the test suite locally  
**When** I run the coverage command  
**Then** I get a clear coverage report (summary and per-file detail)  
**And** the configured thresholds fail the run if overall coverage drops below 70%

**Given** CI runs on pull requests  
**When** tests execute  
**Then** coverage is measured in CI using the same command and thresholds  
**And** failures are actionable (clear output that explains what fell below threshold)

### Story 4.2: Add tests to reach 70% without testing WebGL via React renders

As a maintainer,
I want test coverage to increase to 70% by focusing on deterministic logic modules
So that we improve reliability without brittle UI/WebGL snapshot tests.

**Implements:** NFR-Q1

**Acceptance Criteria:**

**Given** the codebase contains pure logic modules (e.g. audio feature shaping, graph state, mapping functions)  
**When** tests are added  
**Then** they are small, deterministic, and run in the existing Vitest environment  
**And** they avoid driving Three.js rendering through React at rAF frequency

### Story 4.3: Dockerize dev + build

As a maintainer,
I want the application to be buildable and runnable via Docker
So that setup is consistent across machines and suitable for CI portability.

**Implements:** NFR-O1

**Acceptance Criteria:**

**Given** a fresh machine with Docker installed  
**When** I build the Docker image  
**Then** the build completes successfully and produces a runnable container

**Given** the container is running  
**When** I access the exposed port  
**Then** the app serves correctly (dev or preview mode as defined)  
**And** documentation explains limitations (e.g. mic requires secure context; localhost is acceptable for mic, remote access may require HTTPS)

### Story 4.4: README quickstart + scope/non-goals + deploy notes

As a repo reader,
I want clear documentation to install, run, and understand what this project is (and is not)
So that I can evaluate and run the demo quickly without misunderstandings.

**Implements:** FR19, FR20, FR21, FR22, FR23

**Acceptance Criteria:**

**Given** I open the repository README  
**When** I follow the quickstart steps  
**Then** I can run the app locally in minutes on the reference environment  
**And** the README clearly documents prerequisites (Node version, HTTPS/localhost for mic)

**Given** I skim the README  
**When** I read the “What it is / what it isn’t” section  
**Then** it states melody-first scope and non-goals (no tuner/notation/grading, no accounts)  
**And** it explicitly states local-first processing (no upload by default)

**Given** I want to deploy it  
**When** I read deploy notes  
**Then** I understand the static build output and the secure-context mic requirement in production

### Story 4.5: Link preview metadata (title/summary + OG basics)

As a portfolio visitor,
I want shared links to show a sensible title and summary
So that the demo looks intentional when shared.

**Implements:** FR15

**Acceptance Criteria:**

**Given** the app is deployed on a static host  
**When** the URL is shared in a typical link preview surface  
**Then** it shows a sensible title and description  
**And** it does not misrepresent the product scope (no “tuner/notation” claims)

## Epic 5: Onboarding & Audio Session Core Loop (Start → permission → live)

Deliver the “must not fail” first-run experience: Start/Retry, permission ladder, AudioContext resume, mic ingestion, and a stable feature-frame contract feeding the stage without React re-render loops.

### Story 5.1: Start/Retry control + session state ladder (idle → requesting → live → error)

As a visitor,
I want a single obvious Start/Retry control with clear session states
So that I can begin the demo quickly and understand whether it’s listening.

**Implements:** FR1, FR2, FR4, FR14

**Acceptance Criteria:**

**Given** I load the app  
**When** the UI renders  
**Then** there is one primary Start (or Start listening) action visible  
**And** the current session state is clearly labeled (idle/not listening)

**Given** I activate Start  
**When** permission is requested or audio is starting  
**Then** the UI transitions to a requesting/starting state  
**And** if start fails, the UI transitions to an error state with a Retry action

### Story 5.2: Microphone permission request + denied/unavailable recovery

As a visitor,
I want clear handling of mic permission being granted or denied
So that I can recover without guessing or hard-refreshing.

**Implements:** FR3, FR4, FR14

**Acceptance Criteria:**

**Given** I click Start  
**When** the browser permission prompt appears  
**Then** the app handles both allow and deny outcomes without crashing

**Given** permission is denied or no input is available  
**When** the app reports the failure  
**Then** it shows plain “what happened” copy and a next step (e.g. settings + Retry)  
**And** Retry re-attempts the permission/start flow when the platform allows

### Story 5.3: AudioContext unlock/resume (suspended state recovery)

As a visitor,
I want the app to recover when AudioContext is suspended until a gesture
So that “it looks broken” doesn’t happen on first run.

**Implements:** FR5, FR14

**Acceptance Criteria:**

**Given** the browser starts with AudioContext suspended  
**When** I click Start or Retry  
**Then** the app attempts to resume/unlock AudioContext via a user gesture  
**And** if it remains suspended, the UI explains the gesture requirement and offers Retry

### Story 5.4: Mic ingestion lifecycle (start/stop/cleanup) with local-first constraint

As a visitor,
I want the app to ingest live microphone audio while live
So that the stage can respond to what I play.

**Implements:** FR6, FR13, FR22

**Acceptance Criteria:**

**Given** permission is granted and session is live  
**When** the audio session starts  
**Then** the mic stream is captured and processed locally in the browser  
**And** no audio is uploaded by default

**Given** the session stops or the component unmounts  
**When** cleanup runs  
**Then** audio nodes and tracks are stopped/disposed so the browser no longer indicates mic capture

### Story 5.5: FeatureFrame contract (level + tonal) feeding the scene without React rAF renders

As a maintainer,
I want a stable feature-frame contract from audio → scene
So that the render loop stays smooth and the mapping is traceable.

**Implements:** FR7

**Acceptance Criteria:**

**Given** the audio pipeline is running  
**When** features are computed  
**Then** a typed frame (including at least level and a tonal hint/bucket) is produced at a stable cadence

**Given** the scene is rendering  
**When** new feature frames arrive  
**Then** the scene updates via an imperative controller in the rAF loop  
**And** React does not re-render at animation rate to drive WebGL

### Story 5.6: Product framing copy (piano/melody-first + non-goals)

As a visitor,
I want the experience to clearly frame what it is and isn’t
So that expectations match the demo’s strengths.

**Implements:** FR8, FR12, FR23

**Acceptance Criteria:**

**Given** I’m on the landing experience  
**When** I read the minimal chrome copy/help text  
**Then** it frames the experience as a piano-forward, melody-first audiovisual demo  
**And** it does not claim tuner-grade pitch accuracy or notation/grading features

