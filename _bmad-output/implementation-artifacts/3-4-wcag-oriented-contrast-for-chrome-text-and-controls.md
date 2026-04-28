---
story_key: 3-4-wcag-oriented-contrast-for-chrome-text-and-controls
epic: "Epic 3: Accessible, WCAG-aligned Chrome (HUD, status, errors, keyboard)"
story_id: "3.4"
title: "WCAG-oriented contrast for chrome text and controls"
status: review
created: 2026-04-28
updated: 2026-04-28
source:
  epics_file: _bmad-output/planning-artifacts/epics.md
---

# Story 3.4: WCAG-oriented contrast for chrome text and controls

Status: review

## Story

As a visitor,
I want the UI chrome to have readable contrast and clear controls
So that the interface is usable across a range of vision conditions.

## Acceptance Criteria

- **Given** the HUD and error chrome is displayed  
  **When** I read the status, tagline, helper text, and interact with controls  
  **Then** text and key UI affordances have WCAG-oriented contrast (AA expectations)  
  **And** focus states remain visible and distinct

## Implementation notes

- Increased contrast on HUD chrome text and borders in `src/App.css`:
  - status, tagline, helper hint text, error hint text
  - stop button border/text and hover state
  - level slider label/value text
- Increased contrast on error fallback text in `src/ui/ErrorBoundary.css`.
- Preserved existing `:focus-visible` outlines (already high-contrast).

## Dev Agent Record

### Agent Model Used

GPT-5.2

### Completion Notes List

- Tuned chrome palette to improve readability on dark HUD backgrounds without changing layout/semantics.
- Verified `npm test` + `npm run lint`.

### Files changed

- `src/App.css`
- `src/ui/ErrorBoundary.css`

