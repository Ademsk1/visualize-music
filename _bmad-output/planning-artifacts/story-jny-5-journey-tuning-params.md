---
title: "Story JNY-5: Journey tuning parameters (radius, wire visibility, spawn control)"
status: "draft"
created: "2026-04-28"
updated: "2026-04-28"
owner: "Adam"
epic: "Journey Through Space (Trajectory + Note Nodes)"
---

## Context

To make the journey read as “travel through space,” we need a small set of parameters to tune spacing and legibility without rewriting logic. This keeps iteration fast and prevents accidental jitter/clutter.

## User story

**As a** maintainer, **I want** a small set of parameters to tune the journey look **so that** the visual read is crisp and consistent.

## Scope

- Centralize and expose configuration for:
  - Node spawn radius \(r\)
  - Wire visibility (brightness/opacity/thickness, as applicable)
  - Optional node persistence controls (max nodes, fade duration) to avoid clutter
- Defaults should produce a clear corridor + markers look on a black stage.

## Acceptance criteria

- **AC1 — Single config location**: Journey parameters live in one module/object (no scattered constants).
- **AC2 — Radius configurable**: \(r\) is adjustable without touching spawn math.
- **AC3 — Wire visibility configurable**: Wire visibility can be tuned without changing geometry logic.
- **AC4 — Clutter control**: There is a defined strategy to prevent unbounded accumulation (e.g. cap + remove oldest, or fade-out), with defaults that remain legible.
- **AC5 — Safe defaults**: Default values avoid visual chaos and preserve “pristine motion.”

## Non-goals

- Full preset system or UI settings panel (can come later).

## Test plan

- Adjust \(r\): nodes still spawn orthogonally and at the new constant distance.
- Increase/decrease wire visibility: wire remains stable, just more/less prominent.
- Stress test long play session: node count/persistence stays bounded and legible.

