---
story_key: 1-2-render-static-wire-through-time
epic: "Epic 1: Journey Through Space (Trajectory + Note Nodes)"
story_id: "1.2"
title: "Render the static wire through time"
status: done
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
  supporting_epic_doc: _bmad-output/planning-artifacts/epic-journey-through-space.md
---

# Story 1.2: Render the static wire through time

Status: done

## Story

As a viewer,
I want a stable wire aligned with travel direction
So that the motion reads as intentional and I understand the forward journey.

## Acceptance Criteria

1. **Persistent, axis-aligned wire**
   **Given** the journey is running  
   **When** the scene renders  
   **Then** a persistent wire is visible and aligned to the journey travel axis  
   **And** it remains visually stable across note events and ambient noise

## Tasks / Subtasks

- [x] Render a persistent journey wire (AC: 1)
  - [x] Ensure the wire’s direction is aligned to the journey axis (same axis contract as Story 1.1)
  - [x] Ensure the wire does not “jitter” or re-anchor based on note changes (wire motion should be driven only by journey progress)
- [x] Confirm stability across inputs (AC: 1)
  - [x] With no note events / near-silence, wire remains visible and stable
  - [x] With rapidly changing notes, wire remains stable (only nodes/events respond; the wire itself does not)
- [x] Keep performance bounded (supporting NFR-P2)
  - [x] Avoid per-frame geometry allocations in the render loop

## Dev Notes

### Current code reality

`SceneController` already contains journey scaffolding (root group, wire line, events group). This story is about ensuring the wire is a **persistent**, **axis-aligned** visual reference that reads clearly and does not depend on note events.

### Files likely to touch

- `src/scene/SceneController.ts`
  - Confirm/adjust journey wire geometry + placement in the journey frame
  - Ensure wire stays aligned to the journey axis and remains stable

### Constraints / guardrails

- Keep the seam: `src/audio/*` produces `FeatureFrame` consumed by `src/scene/*`.
- Do not drive WebGL through React renders; keep updates imperative inside the rAF loop.
- Respect reduced motion end-to-end; this story shouldn’t introduce intense motion.

### Manual verification

- Start live mode and observe the journey wire:
  - With silence: wire remains visible and stable
  - With single notes and changing notes: wire remains stable (no snapping/jitter tied to notes)

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Wire geometry is created once and added to `journeyRoot` (no per-frame allocations for the wire).
- In journey mode, `journeyRoot` is advanced only by monotonic `journeyProgress`, independent of note events.
- Notes only affect spawned nodes/events; the wire remains stable and axis-aligned.

### Files changed

- None (story confirmed already satisfied by current implementation in `src/scene/SceneController.ts`).

