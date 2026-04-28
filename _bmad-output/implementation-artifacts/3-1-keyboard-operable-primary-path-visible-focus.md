---
story_key: 3-1-keyboard-operable-primary-path-visible-focus
epic: "Epic 3: Accessible, WCAG-aligned Chrome (HUD, status, errors, keyboard)"
story_id: "3.1"
title: "Keyboard operable primary path + visible focus"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 3.1: Keyboard operable primary path + visible focus

Status: review

## Story

As a visitor,
I want to start/retry the experience using only the keyboard with clear focus visibility
So that I can operate the primary flow without a mouse.

## Acceptance Criteria

1. **Primary control reachable and first**
   **Given** I open the app  
   **When** I use Tab/Shift+Tab  
   **Then** the primary Start/Retry control is reachable and first in the logical focus order  
   **And** focus is always visibly indicated on interactive controls

2. **Keyboard activation**
   **Given** the Start/Retry control is focused  
   **When** I press Enter or Space  
   **Then** the same action occurs as clicking the control  
   **And** focus does not get trapped or lost during state transitions

## Implementation notes

- `HudBar` uses semantic `<button type="button">` controls (Enter/Space activation by default).
- Ensured logical focus order by rendering the `HudBar` before the focusable stage host in `src/App.tsx`.
- Preserved visual layout (stage above HUD) using flex `order` in `src/App.css`.
- Visible focus styles already exist for `.hud-cta:focus-visible` and `.skip-link:focus`.

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Updated DOM order so the primary CTA is reached before the stage when tabbing.
- Kept HUD visually anchored at the bottom via CSS ordering.

### Files changed

- `src/App.tsx`
- `src/App.css`

