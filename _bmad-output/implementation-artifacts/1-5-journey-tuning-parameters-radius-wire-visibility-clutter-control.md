---
story_key: 1-5-journey-tuning-parameters-radius-wire-visibility-clutter-control
epic: "Epic 1: Journey Through Space (Trajectory + Note Nodes)"
story_id: "1.5"
title: "Journey tuning parameters (radius, wire visibility, clutter control)"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
  supporting_epic_doc: _bmad-output/planning-artifacts/epic-journey-through-space.md
---

# Story 1.5: Journey tuning parameters (radius, wire visibility, clutter control)

Status: review

## Story

As a maintainer,
I want a small set of parameters to tune the journey look
So that the visual read is crisp and consistent.

## Acceptance Criteria

1. **Single tuning surface**
   **Given** the journey is implemented  
   **When** I adjust configuration values  
   **Then** node spawn radius and wire visibility can be tuned from a single config location  
   **And** node persistence is bounded (cap and/or fade strategy) to prevent clutter in long sessions

## Tasks / Subtasks

- [x] Centralize tuning parameters (AC: 1)
  - [x] Create a single config module for journey tuning values
  - [x] Wire `SceneController` to read node radius and wire visibility from that module
- [x] Ensure clutter remains bounded (AC: 1)
  - [x] Keep a hard cap on nodes (`nodeMax`) and a fade window (`nodeFadeUnits`)

## Dev Notes

- The config module is intended to be the single surface for future tuning (wire length/opacities, spawn distance, caps/fades).
- Clutter control remains bounded by `nodeMax` ring-buffer reuse and `nodeFadeUnits` opacity fade.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Added `src/scene/journeyConfig.ts` exposing a single `JOURNEY_CONFIG` object for journey tuning values.
- Updated `SceneController` to use `JOURNEY_CONFIG` for node radius, wire opacity, wire span, spawn distance, and clutter controls.

### Files changed

- `src/scene/journeyConfig.ts`
- `src/scene/SceneController.ts`

