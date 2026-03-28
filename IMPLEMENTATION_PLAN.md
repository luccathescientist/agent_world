# Agent World v1 Implementation Plan

## Product decisions (locked for v1)

Reference:

- use `VERSION_LOG.md` to track which commits landed in each release milestone

- **Agent scope:** core named agents only
- **Initial rendering target:** 1 agent is acceptable; architecture stays multi-agent ready
- **Environment scope:** OpenClaw-first single-user desktop-local tool
- **Command routing:** direct send to the target session
- **Visual direction:** standalone app, not tied to old dashboard styling
- **World model:** global app config with user-defined layouts and semantic zones
- **Safety:** read-only by default; operator actions require explicit interaction

## Locked product decisions

These decisions are now part of the product direction and should be treated as
constraints for future work unless explicitly revised.

### Product shape

- **Single-user first:** Agent World is a single-user, desktop-local tool first.
- **One install, one config:** each Agent World checkout keeps one global config for that install.
- **Disposable overlay:** Agent World must remain a separate layer on top of an OpenClaw install and must not modify OpenClaw state.
- **Easy reset:** a user should be able to delete an Agent World checkout and start over cleanly.

### OpenClaw integration

- **OpenClaw-first:** Agent World should stay tightly coupled to OpenClaw for now.
- **No runtime abstraction yet:** no need to design a generic agent-runtime interface at this stage.
- **Inspectable state:** the OpenClaw files and metadata Agent World depends on should remain finite, tangible, and easy to inspect for debugging.
- **Documentation requirement:** the exact files, paths, and state flow between OpenClaw and Agent World must be documented clearly.

### Config format and settings

- **Config format:** sprite, room, world, and settings data should use JSON.
- **Settings UX:** one global settings page per Agent World install.
- **Multi-instance via cloning:** if users want multiple Agent World instances, they should clone the repo into separate folders and run them on different ports.
- **OpenClaw path transparency:** Agent World should expose the OpenClaw home/config path in settings rather than relying on hidden defaults.

### World and room model

- **Seeded defaults:** ship with default room types like `comms`, `library`, `terminal`, `work room/office`, and `lounge`.
- **User-defined layouts:** users should be able to define full freeform layouts.
- **Semantic zones inside layouts:** within those layouts, users define semantic zones/rooms.
- **Room schema:** keep room authoring simple with `room name` and `description`.
- **Prompt style:** room descriptions are plain freeform prose only.
- **Scale up later:** the long-term model should allow growth from one room to multiple rooms, then buildings, blocks, or larger worlds.

### Room mapping behavior

- **Heuristic-first mapping:** do not make LLM-based room selection the default critical path right away.
- **LLM as rule generator:** prefer having an LLM derive or improve heuristic rules from action patterns rather than classifying every transition live.
- **Cost-aware design:** movement mapping should avoid expensive per-event LLM calls.
- **Small-model enhancement later:** a smaller model can be introduced later if fast semantic classification becomes necessary.

### Sprites and agent configuration

- **Custom world atlases:** users should be able to load raw sprite/tile sheets with explicit tile sizes such as `16x16`, `32x32`, or `48x48`.
- **Manual frame mapping:** users import raw sheets and manually mark animation frames.
- **Character mapping:** agent-to-sprite mapping should come from discovered OpenClaw agents.
- **No manual visual-only agents yet:** discovery should come from current OpenClaw agents for now.
- **Preview requirement:** the agent configurator should support animation preview for directions like up, down, left, and right.

### Voice mode

- **OpenClaw-backed voice config:** voice should rely on OpenClaw configuration for now.
- **No direct provider credentials yet:** Agent World does not need its own separate voice provider credential model yet.
- **Settings diagnostics:** Agent World should inspect whether OpenClaw voice configuration is ready and explain what is missing when it is not.

### Testing and docs

- **Testing priority:** prioritize backend and API safety first.
- **Next testing focus:** after backend confidence, prioritize sprite/world-building dynamics.
- **Docs priority:** prioritize task-oriented setup and configuration documentation first.
- **Docs audience:** documentation can be optimized for AI agents as primary readers.

---

## Product roadmap

### Track 1: Foundation and configuration

Goal: make Agent World a stable standalone product with explicit, inspectable configuration.

- add a first-class global settings model
- define a canonical JSON config file for the install
- expose OpenClaw home/config paths in the UI
- add connection diagnostics for required OpenClaw files and voice readiness
- document exactly which OpenClaw files Agent World reads and why

### Track 2: Generic world and room authoring

Goal: move from a hardcoded room to a configurable world with semantic zones.

- preserve seeded default room types for first-run usability
- allow full freeform world layouts
- allow semantic room/zone assignment inside those layouts
- keep room authoring simple with name + prose description
- design the data model so one room can later become multiple rooms or larger spaces

### Track 3: Room mapping intelligence

Goal: make agent movement feel semantically correct without creating a fragile or expensive runtime dependency.

- keep deterministic heuristics as the main execution path
- derive heuristic rules from observed actions and seeded room semantics
- evaluate LLM-assisted rule generation as an offline or infrequent enhancement
- reserve live small-model classification as a later optimization if needed

### Track 4: World builder and sprite configurator

Goal: generalize the editor into a reusable world builder rather than a project-specific office editor.

- support arbitrary raw tile atlases with user-specified tile size
- support arbitrary raw character sprite sheets
- let users mark directional animation frames manually
- map OpenClaw-discovered agents to configured sprites
- add preview tooling for directional motion and idle behavior

### Track 5: Voice interaction

Goal: let users talk directly to agents in-world through the existing OpenClaw voice stack.

- complete per-agent voice/text interaction flow
- let users choose text response, voice response, or both
- expose OpenClaw-backed model and voice options clearly
- inspect OpenClaw voice readiness in settings and provide corrective guidance

### Track 6: Testing and hardening

Goal: reduce regressions while the product becomes more configurable.

- add backend tests for config loading, agent discovery, state mapping, and routing
- add API tests for the standalone server
- defer heavy UI regression investment until the UI stabilizes more
- add focused tests for world-building and sprite-mapping behavior once those models settle

### Track 7: Documentation

Goal: make setup, configuration, and internal behavior easy to follow for both humans and AI agents.

- maintain task-oriented setup and config guides
- document installation, configuration, and common troubleshooting
- document the OpenClaw state files Agent World consumes
- add subsystem walkthroughs only after the setup/config cookbook is in place

---

## Near-term milestone plan

## Versioned release milestones

### Release 0.1.0: Standalone extraction baseline

- extract Agent World into its own repository
- ship the standalone FastAPI server
- keep the current office layout as the default clean-install world
- document the OpenClaw-first product direction

### Release 0.2.0: Settings and OpenClaw diagnostics

- add a global settings page
- expose OpenClaw path/config selection
- add readable diagnostics for required OpenClaw files and voice readiness
- document the exact OpenClaw files consumed by Agent World

### Release 0.3.0: Generic room model

- move from hardcoded anchors toward configurable room definitions
- preserve seeded default room types
- support room `name` plus prose `description`
- store room and layout configuration in JSON

### Release 0.4.0: World builder generalization

- support custom tile atlases with configurable tile sizes
- support full freeform layouts with semantic zones
- reduce office-specific assumptions in the current editor

### Release 0.5.0: Agent sprite configurator

- support raw character sheet import
- support manual directional frame mapping
- bind discovered OpenClaw agents to sprite definitions
- add animation preview tooling

### Release 0.6.0: Voice completion

- complete per-agent voice/text interaction
- expose reply mode selection: text, voice, or both
- surface OpenClaw-backed voice options clearly in settings

### Release 0.7.0: Hardening and docs

- add backend/API regression coverage for the standalone app
- add focused world-builder and sprite-mapping tests
- finish task-oriented setup and configuration documentation

---

### Milestone 1: Standalone product baseline

- finalize standalone server and app-config conventions
- add settings page for OpenClaw path/config inspection
- document install and config flow
- add backend/API tests for config and discovery paths

### Milestone 2: Generic room system

- define JSON schema for layouts and semantic rooms
- preserve seeded default room types
- support room name + prose description editing
- make room definitions load from config instead of hardcoded anchors

### Milestone 3: World builder generalization

- support custom tile atlases with explicit tile sizes
- support semantic zone assignment in custom layouts
- make the current editor operate on generic world config rather than office-specific assumptions

### Milestone 4: Agent sprite configurator

- support raw character sheet import
- add manual directional frame mapping
- bind discovered OpenClaw agents to configured sprite definitions
- add motion preview tooling

### Milestone 5: Voice completion

- finish text/voice interaction per agent
- expose OpenClaw voice readiness and options in settings
- support reply mode selection: text, voice, or both

### Milestone 6: Hardening pass

- expand backend/API test coverage
- add focused tests around sprite and world builder behavior
- close documentation gaps created by configurability work

---

## v1 goal

Ship a truthful Agent World prototype that renders the main agent in a semantic room and supports direct operator commands from the UI.

The UI should clearly show:
- who the agent is
- what they are doing now
- where that activity maps in the room
- what just happened
- how to issue a command

---

## Semantic room model

The room is a visualization layer over agent runtime behavior.

### Anchors
- **lounge** — idle, waiting, low activity
- **library** — reading docs, retrieval, references, memory/context lookup
- **desk** — writing, planning, synthesis, response drafting
- **terminal** — coding, file ops, browser work, tool execution
- **comms** — sending messages, operator interaction, outbound communication

### Mapping principle
Do not map every micro-tool transition literally. Instead, derive a stable semantic activity from recent behavior and move the agent only when the high-level activity changes.

---

## Architecture

Agent World should be treated as a separate standalone app rooted in this repository.

### Frontend
Files:
- `index.html`
- `styles.css`
- `app.js`

Responsibilities:
- render the room and anchors
- render one or more agents
- maintain selection state
- show inspector and event log
- submit explicit operator commands

### Shared schema
Files:
- `schema.ts`
- `api-contract.md`

Responsibilities:
- define canonical state and event shapes
- keep backend and frontend aligned
- preserve multi-agent expansion path

### Backend adapter layer
Suggested files:
- `backend/registry.py`
- `backend/state_mapper.py`
- `backend/event_mapper.py`
- `backend/command_router.py`
- `backend/stream.py`

Responsibilities:
- discover visible core agents
- derive world state from runtime/session activity
- expose recent semantic events
- route operator commands directly to the target session
- support live updates later

---

## v1 API surface

### `GET /api/agent-world/state`
Returns the room plus current rendered agents.

### `GET /api/agent-world/events`
Returns recent events in reverse chronological order.

### `POST /api/agent-world/agents/{agent_id}/command`
Sends a direct command to the target session.

### Optional later
- `GET /api/agent-world/stream` for SSE live updates

---

## v1 milestones

### Milestone A — Canonical scaffold
- lock schema and API contract
- define backend module boundaries
- keep single-agent-first, multi-agent-ready design

### Milestone B — Real backend state
- replace mock state with real session-derived state
- expose visible core named agents
- derive semantic room location and current action

### Milestone C — Real command routing
- wire operator command box to direct session send
- return explicit accepted/rejected state
- keep page read-only safe unless operator clicks/send

### Milestone D — Frontend truthfulness
- render agents from API response, not hardcoded DOM assumptions
- support selection even when there is only one agent
- preserve multi-agent rendering path

### Milestone E — Live updates and motion
- add SSE or WebSocket updates
- animate anchor transitions
- add richer visual states without changing the state model

---

## v1 non-goals

- pixel-art production sprites
- pathfinding or game-style navigation
- rendering temporary subagents/background workers
- multi-room environments
- deep compatibility with legacy dashboard aesthetics

---

## Recommended implementation order

1. finalize schema and contract
2. split backend logic out of `server.py`
3. define core-agent registry and target-session mapping
4. implement real state derivation for the main agent
5. implement direct command routing
6. refactor frontend to render from API arrays cleanly
7. add live updates
8. add motion/polish

---

## Open questions for the next build step

These are intentionally deferred, not blockers for the scaffold:
- where core named agent configuration should live
- whether each agent maps 1:1 to a session label or session key
- how much historical event retention should be exposed in the UI
- whether command interrupts need confirmation before v2
