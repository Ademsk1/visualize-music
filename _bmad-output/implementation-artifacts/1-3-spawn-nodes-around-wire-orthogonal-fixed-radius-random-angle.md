---
story_key: 1-3-spawn-nodes-around-wire-orthogonal-fixed-radius-random-angle
epic: "Epic 1: Journey Through Space (Trajectory + Note Nodes)"
story_id: "1.3"
title: "Spawn nodes around the wire (orthogonal + fixed radius + random angle)"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
  supporting_epic_doc: _bmad-output/planning-artifacts/epic-journey-through-space.md
---

# Story 1.3: Spawn nodes around the wire (orthogonal + fixed radius + random angle)

Status: review

## Story

As a player,
I want each note to create a node around the wire
So that notes become spatial markers along my journey.

## Acceptance Criteria

1. **Orthogonal offset at fixed radius**
   **Given** a note event occurs  
   **When** a node is spawned  
   **Then** it appears at a fixed radial distance \(r\) from the wire  
   **And** its offset is orthogonal to the travel axis in the plane normal to the axis

2. **Random angle + never behind**
   **Given** multiple note events occur  
   **When** nodes spawn  
   **Then** each node uses a randomized angle \(\theta\) around the wire  
   **And** nodes spawn at the current (or slightly forward) journey progress, never behind

## Tasks / Subtasks

- [x] Spawn nodes in the plane normal to the journey axis (AC: 1)
  - [x] Build a stable orthonormal basis (U/V) around the axis for radial placement
  - [x] Place nodes at fixed radius `JOURNEY_NODE_RADIUS` with angle \(\theta\)
- [x] Spawn nodes at or ahead of current journey progress (AC: 2)
  - [x] Spawn at `journeyProgress + (wireAhead - spawnFromWireFront)`
- [x] Keep per-frame allocations out of the journey loop (supporting NFR-P2)
  - [x] Reuse vectors and compute basis once

## Dev Notes

- Nodes are spawned in **world space** so the moving journey frame (wire + camera) can advance while nodes are left behind to show motion.
- Fade/cleanup should be computed along the journey axis (not hardcoded world-Z), using projection \(s = p \cdot \hat{a}\).

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Implemented axis-aware node spawn using an orthonormal basis around `journeyAxis`.
- Updated fade and orbit-target logic to compute distances along the journey axis.
- Updated wire geometry to align with the journey axis.

### Files changed

- `src/scene/SceneController.ts`

