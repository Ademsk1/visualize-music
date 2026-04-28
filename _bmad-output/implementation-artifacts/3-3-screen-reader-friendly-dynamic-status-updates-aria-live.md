---
story_key: 3-3-screen-reader-friendly-dynamic-status-updates-aria-live
epic: "Epic 3: Accessible, WCAG-aligned Chrome (HUD, status, errors, keyboard)"
story_id: "3.3"
title: "Screen-reader-friendly dynamic status updates (aria-live)"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 3.3: Screen-reader-friendly dynamic status updates (aria-live)

Status: review

## Story

As a screen reader user,
I want the system to announce key state changes
So that I can understand when the experience is loading, blocked, live, or needs action.

## Acceptance Criteria

- **Given** the app state changes (idle → requesting → live → paused → blocked/error)  
  **When** the HUD updates  
  **Then** status is announced via `aria-live` in a screen-reader-friendly way  
  **And** announcements include actionable context for blocked/error states

## Implementation notes

- Added a reusable visually-hidden utility class:
  - `src/index.css` (`.sr-only`)
- Ensured the visible HUD status is atomic:
  - `src/ui/HudBar.tsx` uses `aria-live="polite"` + `aria-atomic="true"` on the status line
- Added a dedicated screen-reader announcement line (polite + atomic) that includes:
  - Normal state text for idle/loading/live/paused/requesting
  - Blocked state with the specific blocked message
  - Error state with the engine error message/copy

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Added `aria-live` + `aria-atomic` for status updates and a dedicated SR-only announcer line.
- Verified `npm test` + `npm run lint`.

### Files changed

- `src/ui/HudBar.tsx`
- `src/index.css`

