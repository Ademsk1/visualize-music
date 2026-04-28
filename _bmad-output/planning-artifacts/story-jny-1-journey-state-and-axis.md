---
title: "Story JNY-1: Journey state + travel axis contract"
status: "draft"
created: "2026-04-28"
updated: "2026-04-28"
owner: "Adam"
epic: "Journey Through Space (Trajectory + Note Nodes)"
---

## Context

We want the user to feel continuous forward travel (“journey”) rather than the scene snapping focus back to the last note. This story establishes the **data contract** and **state** needed for all later journey behaviors (wire + node spawning).

## User story

**As a** player, **I want** the world to move forward continuously **so that** I feel like I’m on a journey as I play.

## Scope

- Define a single “journey” model that owns:
  - **Travel axis** (normalized 3D direction vector).
  - **Progress** along that axis (monotonic, time-driven).
  - A stable **wire reference** (the axis-aligned anchor line).
- Journey progress updates **independently** of note changes.

## Acceptance criteria

- **AC1 — Single source of truth**: There is one journey state object/module that other systems read from (wire render, node spawn).
- **AC2 — Straight travel axis**: The axis is straight and stable (no curves/turning yet).
- **AC3 — Monotonic progress**: Journey progress only moves forward with time (never decreases).
- **AC4 — Note-independent**: Note changes do not reset/re-anchor the journey progress.
- **AC5 — Deterministic defaults**: Defaults exist for axis direction and speed so the journey can run even before note events are perfect.

## Non-goals

- Curved trajectories, turns, or branches.
- Visual styling of the wire/nodes (handled in later stories).

## Test plan

- Start the app and leave it idle: verify journey progress advances smoothly.
- Play multiple notes: verify journey progress does not jump backwards or reset on note change.

