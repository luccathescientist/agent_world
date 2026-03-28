# Agent World Architecture

## Purpose

Agent World turns agent session state into a spatial UI. Instead of reading raw
session transcripts, the operator sees agents moving through a semantic office:

- `library` for reading and reference work
- `terminal` for coding, editing, tool use, and browser work
- `desk` for planning and writing
- `comms` for messages and direct interaction
- `lounge` for idle and waiting states

The key design goal is to separate runtime truth from visual metaphor. The world
is a projection of agent behavior, not the source of truth itself.

## Runtime Layers

### 1. Standalone Server

`server.py` is the integration point for the standalone app.
It does four important things for Agent World:

- serves `/` with the UI HTML
- mounts `/agent-world-static` to this directory
- exposes `/api/agent-world/*` routes
- delegates almost all Agent World logic into `backend/*`

### 2. Backend Adapter Layer

The backend adapter layer lives in `backend/` and translates OpenClaw data into
Agent World payloads.

- `registry.py`
  Discovers which named agents should appear in the world
- `state_mapper.py`
  Builds summaries, history, schedule, stash, and world snapshots
- `command_router.py`
  Sends operator commands into live sessions
- `world_layout.py`
  Reads and writes room layout and movement override files
- `stream.py`
  Produces server-sent event snapshots for live UI updates
- `event_mapper.py`
  Thin wrapper around event derivation

### 3. Frontend UI Layer

The frontend is a plain browser app:

- `index.html`
  Page structure
- `styles.css`
  Visual styling and layout
- `app.js`
  State container, PixiJS renderer, API integration, tilemap editor, and interactions

PixiJS is bundled locally in `vendor/pixi.min.js`.

## Data Flow

### Initial page load

1. Browser requests `/`
2. HTML loads `styles.css`, `vendor/pixi.min.js`, and `app.js`
3. `load()` in `app.js` initializes the Pixi renderer and fetches `/api/agent-world/state`
4. `renderWorld()` draws the room and agents
5. The default selected agent is set to `lucca-main` if present
6. `selectAgent()` fetches `/api/agent-world/agents/{agent_id}`
7. The embedded inspector, chat log, schedule, and stash are populated
8. `connectStream()` subscribes to `/api/agent-world/stream?agent_id=...`

### Live updates

1. `backend/stream.py` polls current world state every ~1.5 seconds
2. The SSE payload includes:
   - `world`
   - `events`
   - `detail` for the selected agent when provided
3. `handleStreamSnapshot()` in `app.js` updates the rendered world and side panels

### Operator command path

1. User types in the chat composer
2. `sendCommandText()` posts to `/api/agent-world/agents/{agent_id}/command`
3. `backend/command_router.py` launches `openclaw agent --agent ... --message ...`
4. UI reloads and stream updates eventually reflect the changed session state

### Manual move path

1. User picks an anchor from `Move Selected Agent`
2. `moveSelectedAgentToAnchor()` posts to `/api/agent-world/agents/{agent_id}/move`
3. `backend/world_layout.py` writes the movement override back into `game_state.json`
4. World state starts reporting the chosen `targetAnchor`
5. Frontend pathing animates the agent toward that goal tile

## State Sources

Agent World is not backed by a dedicated database. It derives state from a mix of:

- OpenClaw agent config in `~/.openclaw/openclaw.json`
- OpenClaw session index files in `~/.openclaw/agents/.../sessions/sessions.json`
- Session transcript files referenced by that index
- Cron metadata in `~/.openclaw/cron/jobs.json`
- Cron run session indexes in `~/.openclaw/cron/runs` and agent session indexes
- Local world layout files in `assets/tiles/office_world/`
- Browser local storage for editor drafts and per-browser UI customizations

## Core Architectural Decisions

### Semantic mapping instead of literal execution traces

The UI maps tools and assistant text into room anchors and visual states. It is
deliberately lossy. This makes the world readable and stable even though raw
transcripts are noisy.

### Array-based data model

Most payloads are already multi-agent friendly even when only Lucca is active.
Adding more named agents should not require redesigning the API shapes.

### Static assets plus runtime overlays

The room is composed from tile manifests, map files, and sprites. Dynamic state
like selection, pathing, status labels, and bubbles is overlaid at runtime.

### Browser-side editing with server persistence

The tilemap editor mutates browser-local draft state first, then persists layout
through the API when explicitly saved.

## Common Extension Points

- Add a new visible agent by extending OpenClaw config handling in `backend/registry.py`
- Adjust anchor heuristics in `backend/state_mapper.py`
- Add new panels or controls in `index.html` and `app.js`
- Expand the world editor via the `editor` state inside `app.js`
- Add richer server fields in `derive_agent_detail()` and render them in the frontend
