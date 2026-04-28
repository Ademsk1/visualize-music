---
story_key: 3-2-non-colour-only-state-and-error-signaling
epic: "Epic 3: Accessible, WCAG-aligned Chrome (HUD, status, errors, keyboard)"
story_id: "3.2"
title: "Non-colour-only state and error signaling"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 3.2: Non-colour-only state and error signaling

Status: review

## Story

As a visitor,
I want blocked, idle, and live states to be distinguishable without relying on colour alone
So that I can understand the system state regardless of colour perception.

## Acceptance Criteria

1. **Non-colour state cues**
   **Given** the app transitions between idle, requesting/starting, live, and error states  
   **When** the state is displayed in the HUD  
   **Then** it includes a text label for the state  
   **And** state is reinforced by a non-colour cue (icon/shape), not colour alone

2. **Errors are plain and recoverable**
   **Given** a microphone or AudioContext issue occurs  
   **When** an error is shown  
   **Then** the message explains what failed and includes an explicit recovery action (e.g. Retry/Refresh)  
   **And** error presentation does not depend on colour alone to be recognized

## Implementation notes

- Added a redundant icon + text cue for HUD status:
  - `src/ui/HudBar.tsx` renders an icon (aria-hidden) plus status text (aria-live).
  - Examples: live `●`, paused `⏸`, blocked `⛔`, requesting `🔒`, idle `○`.
- Added small CSS to align the status icon:
  - `src/App.css` (`.hud-status-icon`)
- Error state already uses explicit error copy and a “Refresh page” CTA button.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Implemented non-colour-only status signaling with icons + text.
- Verified `npm test` + `npm run lint`.

### Files changed

- `src/ui/HudBar.tsx`
- `src/App.css`

