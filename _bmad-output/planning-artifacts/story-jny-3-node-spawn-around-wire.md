---
title: "Story JNY-3: Spawn nodes around the wire (orthogonal + fixed radius + random angle)"
status: "draft"
created: "2026-04-28"
updated: "2026-04-28"
owner: "Adam"
epic: "Journey Through Space (Trajectory + Note Nodes)"
---

## Context

Each played note should feel like it “leaves a marker” in the journey. Markers must be placed **around** the wire in a consistent geometric way so the result reads authored, not random teleportation.

## User story

**As a** player, **I want** each note to create a node around the wire **so that** notes become spatial markers along my journey.

## Scope

- On each note event, spawn a node positioned:
  - At the current journey progress point on the wire (or slightly ahead).
  - Offset **orthogonally** from the travel axis at a fixed radius \(r\).
  - With a randomized angle \(\theta\) around the wire.

## Acceptance criteria

- **AC1 — Fixed radius**: Nodes spawn at constant distance \(r\) from the wire (configurable constant).
- **AC2 — Orthogonal**: The offset direction is perpendicular to the travel axis (in the plane normal to the axis).
- **AC3 — Random angle**: Each node chooses a random \(\theta\) around the axis so placement varies.
- **AC4 — Forward coherence**: Nodes spawn at the current (or slightly forward) journey progress, never behind.
- **AC5 — Placement formula**: Implementation follows:
  - Let `axis` be the normalized travel axis.
  - Choose a stable orthonormal basis \((u, v)\) spanning the plane orthogonal to `axis`.
  - `offset = (u * cosθ + v * sinθ) * r`
  - `nodePos = wirePoint + offset`
- **AC6 — No noise spawning**: Ambient noise alone must not create rapid spurious node spam (note-event gating belongs to existing note detection; use its events only).

## Non-goals

- Deciding the visual style (color/size/shaders) beyond “node is visible.”
- Polyphonic correctness; if multiple events occur, they may spawn multiple nodes (best-effort).

## Test plan

- Play a single note repeatedly: nodes appear near the current journey location, around the wire, at consistent radius.
- Play a scale: nodes form a forward “trail” with varying around-wire angles; none appear behind the current travel position.

