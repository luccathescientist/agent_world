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
- version-log-only maintenance commits may be folded into the next substantive entry
- if work exists in the working tree but is not yet committed, record it under
  `In Progress` for the active release

---

## Release 0.1.0: Standalone extraction baseline

Status: `complete`

Goal:

- extract Agent World into its own repository
- ship the standalone server
- preserve the current office layout as the default clean-install world
- lock the initial product direction and roadmap

### Committed

#### `8384242` - `Extract standalone Agent World app`

Extracted Agent World into its own repo, added the standalone server, and documented the initial product direction.

#### `8b53dd0` - `Remove unused bundled assets and document the 0.1.0 baseline`

Removed unused bundled tile/archive assets, made the checked-in office world the explicit clean-install default, and added milestone/version tracking docs.

#### `ebe3659` - `Add a fresh-install smoke test for the 0.1.0 baseline`

Added a clean-clone smoke-test checklist to the docs as the final `0.1.0` hardening pass.

### In Progress

Uncommitted working tree changes currently include:

- none

### Shipped state for 0.1.0

- standalone repository extracted and published
- standalone FastAPI server shipped
- current office layout preserved as the default clean-install world
- unused bundled asset clutter removed
- roadmap, release milestones, and version log established
- fresh-install smoke test documented for baseline verification

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
