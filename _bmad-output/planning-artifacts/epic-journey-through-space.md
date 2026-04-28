---
title: "Epic: Journey Through Space (Trajectory + Note Nodes)"
status: "draft"
created: "2026-04-28"
updated: "2026-04-28"
owner: "Adam"
---

## Epic summary

Make note playback feel like **forward travel through space**: the experience should not “snap back” to the last note position when a new note arrives. Instead, a **forward-moving trajectory** continues straight, like we are moving through a corridor. Along that path there is a **static wire** (a persistent line) that represents the travel direction through time. When a note is played, a **node appears near the wire**, offset orthogonally from the travel direction at a **fixed distance**, with a **random angle** around the wire.

This epic is primarily about **motion legibility** and **spatial continuity** so the user feels a coherent “journey” as they play.

## Problem / why

- Current node transitions do not communicate a clear journey: when the node changes, the path can feel like it “teleports” or returns to a previous anchor.
- The intended vibe (UX spec) is **pristine, intentional motion** on a **black stage**—so trajectory changes need to feel authored, not jittery or arbitrary.

## Outcome (what “done” feels like)

- Playing successive notes creates the feeling of **continuous forward travel**.
- The **wire** is stable and communicates direction/time.
- Note nodes appear as “events” around the wire, with consistent spacing rules that read as intentional.

## Users / value

- **Portfolio visitor (Sam)**: immediately understands the visual metaphor (“we’re traveling forward; notes leave markers in space”).
- **Author (Adam)**: gains a controllable visual system where notes do not cause disorienting jumps.

## Assumptions & constraints

- **Travel direction** is straight for now (no curves).
- **Melody-first** remains the MVP bias; polyphonic behavior can be best-effort but must not destroy the journey feeling.
- Must avoid **nervous jitter**; changes should be smooth and bounded.

## Definitions

- **Travel axis**: the forward direction we move over time (a normalized 3D vector).
- **Wire**: a persistent line aligned with the travel axis, visually stable.
- **Node event**: a spawned visual object representing a note event.
- **Orthogonal offset**: node position offset perpendicular to travel axis (in the plane normal to the axis).

## Acceptance criteria

- **AC1 — No snap-back**: When a new note is played, the system does **not** reposition the journey origin back toward a previous note’s position; forward motion remains continuous.
- **AC2 — Forward continuity**: Across a sequence of notes, the camera/world continues to advance along the travel axis in a way that reads as forward travel.
- **AC3 — Static wire**: A visible wire/line remains stable, aligned to the travel axis. It persists across note events.
- **AC4 — Fixed-distance spawn**: Each note event spawns a node at a constant radial distance \(r\) from the wire (configurable constant).
- **AC5 — Orthogonal plane**: Node placement is orthogonal to the travel axis (i.e. offset vector is perpendicular to travel axis).
- **AC6 — Random angle**: Node placement chooses a random angle \(\theta\) around the wire so nodes appear at varying positions around the corridor.
- **AC7 — Directional coherence**: The node appears “near” the current travel position (ahead/at the current progress), not behind; it should look like we are moving forward and leaving markers, not revisiting.
- **AC8 — Smooth motion**: Node creation and any trajectory-related transitions are smooth (no flicker, no high-frequency jitter that reads as noise).

## Out of scope (for this epic)

- Curved/turning travel paths, spirals, or branching trajectories.
- Perfect polyphonic separation visuals (still a stretch item from PRD).
- Audio feature overhaul; this epic assumes note events already exist or can be derived from existing features.

## Stories (proposed)

### Implementation stories

- **JNY-1 — Journey state + travel axis contract**: `story-jny-1-journey-state-and-axis.md`
- **JNY-2 — Render the static wire through time**: `story-jny-2-static-wire.md`
- **JNY-3 — Spawn nodes around wire**: `story-jny-3-node-spawn-around-wire.md`
- **JNY-4 — No snap-back on note change**: `story-jny-4-no-snap-back-on-note-change.md`
- **JNY-5 — Journey tuning parameters**: `story-jny-5-journey-tuning-params.md`

### JNY-1 — Define journey state + travel axis contract

**As a** player, **I want** the world to move forward continuously **so that** I feel like I’m on a journey as I play.

- **Acceptance**:
  - A single “journey” state holds travel axis, current progress, and a stable reference for the wire.
  - The journey progresses forward with time independent of note changes.

### JNY-2 — Render the static wire through time

**As a** viewer, **I want** a stable wire aligned with travel direction **so that** motion has an anchor and reads as intentional.

- **Acceptance**:
  - Wire persists across notes and doesn’t jitter.
  - Wire is always aligned with the travel axis.

### JNY-3 — Spawn nodes around wire (orthogonal + fixed radius + random angle)

**As a** player, **I want** each note to create a node around the wire **so that** notes become spatial markers along my journey.

- **Acceptance**:
  - Node positions are computed as: `wirePoint + (orthonormalBasisU * cosθ + orthonormalBasisV * sinθ) * r`.
  - \(r\) is constant (configurable).
  - \(\theta\) varies per note event (randomized).
  - Nodes spawn at the current journey progress (or slightly ahead), never behind.

### JNY-4 — Trajectory change behavior: never return to last note position

**As a** player, **I want** note changes to add nodes without re-centering the journey around the last note **so that** I never feel snapped backward.

- **Acceptance**:
  - The “current focus” remains the journey progress, not the last note node.
  - If camera framing adjusts, it does so smoothly and preserves forward direction.

### JNY-5 — Tuning + parameters for legibility (radius, wire brightness, spawn cadence)

**As a** maintainer, **I want** a small set of parameters to tune the journey look **so that** the visual read is crisp and consistent.

- **Acceptance**:
  - Config values exist for: wire visibility, node radius \(r\), and optional spacing/culling behavior to avoid clutter.
  - Defaults produce a clear “travel corridor” look on a black stage.

## Open questions (to decide during implementation)

- What is the “note event” trigger in the current system (detected pitch change, stable note-on, chroma peak)? We can adapt to existing note graph state.
- How long do nodes persist (fade, accumulate, cull after N)?
- Is the wire centered in view or offset? (UX still allows either as long as motion stays pristine.)

