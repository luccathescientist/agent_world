# Version Log

This file is the running historical index for Agent World releases.

Purpose:

- map product milestones to concrete git commits
- summarize what each commit approximately changed
- preserve context for future development sessions
- make it easier to resume work without reconstructing history from `git log`

Conventions:

- each release section tracks the commits that belong to that milestone
- each commit entry should use a single sentence only
- commit summaries should stay high-signal and approximate rather than exhaustive
- if work exists in the working tree but is not yet committed, record it under
  `In Progress` for the active release

---

## Release 0.1.0: Standalone extraction baseline

Status: `in progress`

Goal:

- extract Agent World into its own repository
- ship the standalone server
- preserve the current office layout as the default clean-install world
- lock the initial product direction and roadmap

### Committed

#### `8384242` - `Extract standalone Agent World app`

Approximate scope:

- copied Agent World out of the dashboard subtree into its own repository
- added the standalone FastAPI server in `server.py`
- preserved the current frontend/API contract for compatibility
- made the voice bridge more portable by removing hardcoded machine paths
- added initial standalone run instructions and requirements
- documented the product roadmap and locked product decisions
- published the first standalone `main` branch

### In Progress

Uncommitted working tree changes currently include:

- removed unused asset archives and preview/generated tile artifacts
- kept `assets/tiles/office_world/game_state.json` as the clean-install default world
- documented that `manifest.json` remains a live runtime dependency
- added versioned release milestones to the implementation plan
- added this version log so future commits can be grouped by release milestone

### Exit criteria for 0.1.0

- remove extraneous tracked assets from the repository
- commit the repository cleanup and default-world documentation updates
- leave the repo in a clean state with the standalone app still bootable

---

## Release 0.2.0: Settings and OpenClaw diagnostics

Status: `planned`

Expected focus:

- global settings page
- OpenClaw path/config selection
- diagnostics for required OpenClaw files and voice readiness
- clearer documentation of OpenClaw state dependencies

Commits:

- none yet

---

## Release 0.3.0: Generic room model

Status: `planned`

Expected focus:

- configurable room definitions
- seeded default room types
- prose-based room descriptions
- JSON-backed room/layout configuration

Commits:

- none yet

---

## Release 0.4.0: World builder generalization

Status: `planned`

Expected focus:

- custom tile atlases
- explicit tile-size configuration
- freeform layouts plus semantic zones
- reduced office-specific assumptions

Commits:

- none yet

---

## Release 0.5.0: Agent sprite configurator

Status: `planned`

Expected focus:

- raw character sheet import
- manual directional frame mapping
- sprite assignment for discovered OpenClaw agents
- animation preview tooling

Commits:

- none yet

---

## Release 0.6.0: Voice completion

Status: `planned`

Expected focus:

- per-agent voice/text interaction completion
- reply mode selection
- clearer OpenClaw-backed voice settings and diagnostics

Commits:

- none yet

---

## Release 0.7.0: Hardening and docs

Status: `planned`

Expected focus:

- backend/API regression coverage
- targeted tests for world-builder and sprite systems
- task-oriented setup/config documentation

Commits:

- none yet
