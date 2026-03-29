# Agent World API Reference

This file documents the currently mounted Agent World routes as implemented by
`server.py` and `backend/*.py`.

## UI and Static Assets

### `GET /`

Returns the Agent World HTML entry page.

### `GET /agent-world`

Redirects to `/` for compatibility.

### `GET /agent-world-static/<path>`

Serves static files from this repository root.

Examples:

- `styles.css`
- `app.js`
- `vendor/pixi.min.js`
- `assets/sprites/*`
- `assets/tiles/office_world/*`

## World Snapshot Routes

### `GET /api/agent-world/settings`

Returns the current global Agent World install settings from `agent_world.json`.

### `POST /api/agent-world/settings`

Persists the global Agent World install settings to `agent_world.json`.

### `GET /api/agent-world/settings/diagnostics`

Returns diagnostics for the configured OpenClaw home, config, agents, media,
command routing, and Agent World voice checks for provider config, SDK
availability, and credentials.

### `GET /api/agent-world/state`

Returns the current world snapshot.

Primary fields:

- `version`
- `room`
- `agents`
- `selectedAgentId`
- `serverTime`

Important notes:

- `selectedAgentId` is backend-provided, but the frontend may override initial
  selection to prefer `lucca-main`
- `room.anchors` currently comes from `game_state.json` layout config when available

### `GET /api/agent-world/events`

Returns a cross-agent recent event feed.

Response shape:

```json
{
  "events": []
}
```

### `GET /api/agent-world/stream`

Server-sent event endpoint.

Query params:

- `agent_id` optional

Behavior:

- emits a `snapshot` payload when the full serialised payload changes
- includes `world`, `events`, and `detail` when `agent_id` is provided
- emits SSE keepalive comments during idle periods

## Game State Route

### `GET /api/agent-world/game-state`

Returns the persisted single-file Agent World state payload from
`assets/tiles/office_world/game_state.json`.

### `POST /api/agent-world/game-state`

Persists the full single-file Agent World state payload.

The payload is a localStorage-like JSON object keyed by `agent-world-*` entries.

## Agent Detail Routes

### `GET /api/agent-world/agents/{agent_id}`

Returns selected-agent detail.

Primary fields:

- `ok`
- `agent`
- `history`
- `schedule`
- `recentCronRuns`
- `stash`
- `session`
- `serverTime`

### `GET /api/agent-world/agents/{agent_id}/history`

Returns a richer history-only payload.

### `GET /api/agent-world/agents/{agent_id}/schedule`

Returns schedule plus recent cron runs.

### `GET /api/agent-world/agents/{agent_id}/stash`

Returns stash items discovered from transcript paths.

## Interaction Routes

### `POST /api/agent-world/agents/{agent_id}/command`

Sends an operator message into the live agent session.

Request body:

```json
{
  "text": "Summarize the active issue queue.",
  "mode": "append",
  "source": "ui"
}
```

Current implementation details:

- `mode` is accepted by the API model but not deeply branched in the router
- the router resolves the target agent and launches an `openclaw agent` subprocess
- success means "accepted for delivery", not "finished executing"

Typical response:

```json
{
  "ok": true,
  "acceptedAt": "2026-03-22T12:00:00Z",
  "agentId": "lucca-main",
  "echoedCommand": "Summarize the active issue queue.",
  "status": "accepted",
  "delivery": "direct_session"
}
```

### `POST /api/agent-world/agents/{agent_id}/move`

Writes a movement override for the given agent.

Request body:

```json
{
  "anchorId": "desk",
  "source": "ui"
}
```

Behavior:

- validates agent id
- validates anchor id against persisted layout anchors
- writes back into `game_state.json`
- returns accepted or rejected status

## File Proxy Route

### `GET /api/agent-world/file?path=...`

Returns a file if the target path is inside an allowed root.

Allowed roots:

- OpenClaw media directory
- Agent World directory
- repository root

Used for:

- image preview
- video preview
- opening PDF and text artifacts linked from transcript-derived stash items

## Compatibility Note

`api-contract.md` describes the original design intent, but this file reflects the
actual currently mounted routes. Prefer this file when changing frontend or backend code.
