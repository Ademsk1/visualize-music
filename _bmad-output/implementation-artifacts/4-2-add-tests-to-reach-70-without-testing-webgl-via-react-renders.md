---
story_key: 4-2-add-tests-to-reach-70-without-testing-webgl-via-react-renders
epic: "Epic 4: Ship-ready Reliability (tests + containerized run/build)"
story_id: "4.2"
title: "Add tests to reach 70% without testing WebGL via React renders"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 4.2: Add tests to reach 70% without testing WebGL via React renders

Status: review

## Story

As a maintainer,
I want more automated tests without brittle WebGL rendering tests
So that reliability improves while keeping the render loop imperative.

## Implementation notes

- Added UI-level test for error fallback:
  - `src/ui/ErrorBoundary.test.tsx`
- Added unit tests for audio feature extraction mapping with a fake analyser and module mocks:
  - `src/audio/features.readFeatureFrame.test.ts`

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Files changed

- `src/ui/ErrorBoundary.test.tsx`
- `src/audio/features.readFeatureFrame.test.ts`

