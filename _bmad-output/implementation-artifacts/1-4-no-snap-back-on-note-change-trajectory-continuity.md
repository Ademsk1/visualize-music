---
story_key: 1-4-no-snap-back-on-note-change-trajectory-continuity
epic: "Epic 1: Journey Through Space (Trajectory + Note Nodes)"
story_id: "1.4"
title: "No snap-back on note change (trajectory continuity)"
status: done
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
  supporting_epic_doc: _bmad-output/planning-artifacts/epic-journey-through-space.md
---

# Story 1.4: No snap-back on note change (trajectory continuity)

Status: done

## Story

As a player,
I want note changes to add nodes without re-centering the journey around the last note
So that I never feel snapped backward.

## Acceptance Criteria

1. **No backwards snap on focus change**
   **Given** I play a sequence of notes  
   **When** the focused note changes rapidly  
   **Then** the journey continues advancing forward without oscillation or backward snaps  
   **And** any framing adjustments remain smooth and preserve forward direction

## Tasks / Subtasks

- [x] Ensure journey motion is note-independent (AC: 1)
  - [x] Journey progress advances only from time deltas and a fixed speed (not from note events)
  - [x] Note/focus changes only spawn nodes and do not re-anchor camera or journey frame
- [x] Ensure framing remains smooth (AC: 1)
  - [x] Orbit camera is carried forward with the journey frame (`dz` rebase), without abrupt resets on note changes

## Dev Notes

This story is satisfied by the existing journey implementation:

- Journey motion is owned by monotonic `journeyProgress` and `lastJourneyMs` time deltas.
- Note changes (`graph.focusPitchClass`) only trigger `spawnJourneyNode(...)`.
- The orbit target is always the wire front, updated from journey progress, not note focus.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Verified `applyJourney(...)` advances the journey frame independently of note focus changes.
- Verified focus changes only spawn nodes and do not re-center or reset journey progress/camera.

### Files changed

- None (confirmation-only story).

