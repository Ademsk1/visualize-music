---
story_key: 4-3-dockerize-dev-build
epic: "Epic 4: Ship-ready Reliability (tests + containerized run/build)"
story_id: "4.3"
title: "Dockerize dev/build"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 4.3: Dockerize dev/build

Status: review

## Story

As a maintainer,
I want to build and run the app in Docker
So that local dev/demo and CI environments are consistent.

## Acceptance Criteria

- **Given** I have Docker installed  
  **When** I run a documented container command  
  **Then** I can run the dev server in a container  
  **And** I can build and serve the production bundle in a container

## Implementation notes

- Added multi-stage `Dockerfile`:
  - `dev` target: runs Vite with `--host 0.0.0.0 --port 5173`
  - `build` target: produces `dist/`
  - `preview` target: serves `dist/` on port `4173`
- Added `docker-compose.yml` for containerized dev with bind mount + node_modules volume.
- Added `.dockerignore` to keep builds small and deterministic.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Implemented Docker targets for dev and preview.

### Files changed

- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml`

