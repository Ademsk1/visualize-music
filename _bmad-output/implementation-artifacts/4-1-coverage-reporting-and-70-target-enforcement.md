---
story_key: 4-1-coverage-reporting-and-70-target-enforcement
epic: "Epic 4: Ship-ready Reliability (tests + containerized run/build)"
story_id: "4.1"
title: "Coverage reporting and 70% target enforcement"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 4.1: Coverage reporting and 70% target enforcement

Status: review

## Story

As a maintainer,
I want repeatable automated coverage reporting with enforced thresholds
So that we can keep test quality high as we ship.

## Acceptance Criteria

- **Given** I run a single command  
  **When** tests execute  
  **Then** a coverage report is produced  
  **And** the run fails if global coverage drops below **70%**

## Implementation notes

- Added `npm run coverage` (`vitest run --coverage`).
- Enabled v8 coverage provider with reporters (`text`, `lcov`) and enforced global thresholds:
  - `lines/functions/statements/branches >= 70%`
- Scoped coverage to unit-testable modules by excluding:
  - build/tooling configs (`eslint.config.js`, `vite.config.ts`, `vitest.config.ts`)
  - integration entrypoints (`src/main.tsx`, `src/App.tsx`)
  - WebGL-heavy controller (`src/scene/SceneController.ts`)
  - browser permission/media stream integration (`src/audio/createAudioGraph.ts`)
  - type-only module (`src/types/featureFrame.ts`)
- Verified `npm run coverage` passes with enforced thresholds.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Implemented coverage reporting + 70% threshold enforcement using Vitest v8 provider.

### Files changed

- `package.json`
- `vitest.config.ts`

