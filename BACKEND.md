# Agent World Backend

## Purpose

The backend adapter layer converts OpenClaw session data into UI-friendly world
state. It avoids putting Agent World logic directly into the main dashboard
server file.

## Modules

### `backend/registry.py`

Responsible for deciding which agents appear in Agent World.

Current behavior:

- reads `~/.openclaw/openclaw.json`
- maps `id == "main"` to `lucca-main`
- maps `bench-*` entries to benchmark workers
- falls back to a default Lucca entry if config is missing

Primary types and functions:

- `CoreAgent`
- `get_visible_agents()`
- `get_agent(agent_id)`

### `backend/state_mapper.py`

This is the main backend module.

It is responsible for:

- building world snapshots
- deriving per-agent summaries
- deriving selected-agent detail
- extracting recent history
- extracting schedule and recent cron runs
- extracting stash files from transcript paths
- inferring runtime status, anchor, and visual state

Important exported functions:

- `derive_agent_world_state()`
- `derive_agent_world_events()`
- `derive_agent_detail(agent_id)`
- `derive_agent_history(agent_id)`
- `derive_agent_schedule(agent_id)`
- `derive_agent_stash(agent_id)`

Important internal responsibilities:

- read session indexes
- read transcript JSONL files
- extract assistant text fragments
- extract tool calls
- map tool names to semantic anchors
- derive queue depth from unresolved tool calls
- mark runtime as `active`, `idle`, `waiting_user`, `blocked`, or `offline`

### `backend/command_router.py`

Routes explicit operator text into a live agent session.

Current behavior:

- resolves agent metadata via `get_agent()`
- runs `openclaw agent --agent <label> --message <text> --timeout 600`
- returns immediately after starting the subprocess

This module intentionally does not wait for command completion.

### `backend/world_layout.py`

Owns the persistent single-file game state and move-override persistence.

Files:

- `assets/tiles/office_world/game_state.json`

Exports:

- `load_world_game_state()`
- `save_world_game_state(payload)`
- `load_world_layout()`
- `save_world_layout(payload)`
- `load_movement_overrides()`
- `get_agent_movement_override(agent_id)`
- `set_agent_movement_override(agent_id, anchor_id, source="ui")`

### `backend/stream.py`

Implements the server-sent-event loop.

Current behavior:

- polls every 1.5 seconds
- emits a full snapshot whenever payload changes
- emits keepalive comments when idle

Snapshot payload includes:

- `type: "snapshot"`
- `world`
- `events`
- `detail` when `agent_id` is requested

### `backend/event_mapper.py`

Thin compatibility wrapper around `derive_agent_world_events()`.

## Heuristic Mapping

The core semantic mapping table is `TOOL_TO_ANCHOR` in `state_mapper.py`.

Examples:

- `read`, `memory_search`, `memory_get`, `pdf` -> `library`
- `write` -> `desk`
- `edit`, `exec`, `process`, `browser`, `canvas` -> `terminal`
- `sessions_send`, `message`, `tts` -> `comms`

If there is no strong recent tool signal, assistant text content is used as a fallback.

Examples:

- planning or drafting words bias toward `desk`
- coding or server words bias toward `terminal`
- read or docs words bias toward `library`

## Runtime Status Derivation

Status is not read directly from a dedicated field. It is inferred from session
metadata and recent transcript state.

Rules:

- `abortedLastRun` -> `blocked`
- latest transcript role is user -> `waiting_user`
- recent update age < 90s -> `active`
- recent update age < 15m -> `idle`
- stale with timestamp -> `offline`

Visual state is then normalized from runtime status plus anchor.

## History and Detail Payloads

Selected-agent detail is richer than the world summary.

It includes:

- `agent`
- `history`
- `schedule`
- `recentCronRuns`
- `stash`
- `session`
- `serverTime`

History is derived from transcript roles:

- assistant tool call -> `tool_started`
- tool result -> `tool_finished`
- assistant text -> `state_changed`
- user message -> `operator_command`

## Stash Extraction

The stash panel is derived, not manually curated.

`state_mapper.py` scans recent transcript content for filesystem paths, validates
them, classifies them by kind, and exposes them as stash items. This is why
stash contents can change as soon as tool output references new files.

## Backend Design Constraints

- Backend functions are synchronous and are typically run through `asyncio.to_thread()`
  in `server.py`.
- Agent World now ships with its own standalone FastAPI service.
- The backend is intentionally tolerant of missing or malformed OpenClaw files.
- Most mapping logic is heuristic by design. Readability is favored over perfect fidelity.

## When To Edit Which File

Edit `registry.py` when:

- adding new named-agent mapping rules
- changing sprite defaults per agent

Edit `state_mapper.py` when:

- changing anchor semantics
- changing status heuristics
- adding new detail fields
- changing how history or stash is derived

Edit `command_router.py` when:

- changing how commands are delivered into sessions

Edit `world_layout.py` when:

- changing persisted layout schema
- changing move override behavior

Edit `stream.py` when:

- changing SSE cadence or payload structure
