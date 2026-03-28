# Agent World API Contract

This contract is **single-agent first, multi-agent ready**.

The first real deployment may render only Lucca, but the API remains array-based so additional named core agents can be added later without redesign.

## `GET /api/agent-world/state`
Returns the current semantic room state and rendered agents.

### Response
```json
{
  "version": "0.2.0",
  "room": {
    "id": "lab-studio-a",
    "name": "Lucca Lab Studio",
    "width": 960,
    "height": 540,
    "anchors": []
  },
  "agents": [
    {
      "id": "lucca-main",
      "name": "Lucca",
      "model": "openai-codex/gpt-5.3-codex",
      "runtimeStatus": "active",
      "visualState": "writing",
      "currentAction": "Drafting the implementation scaffold",
      "currentAnchor": "desk",
      "targetAnchor": "desk",
      "slotIndex": 0,
      "sessionLabel": "main",
      "taskLabel": "Agent World scaffolding",
      "lastUpdatedAt": "2026-03-18T08:40:00Z",
      "lastTool": "write",
      "queueDepth": 0,
      "waitingReason": null
    }
  ],
  "selectedAgentId": "lucca-main",
  "serverTime": "2026-03-18T08:40:00Z"
}
```

### Notes
- `agents` may contain one item in v1.
- `currentAnchor` is the anchor currently occupied.
- `targetAnchor` is where the agent is moving toward; in v1 it may match `currentAnchor` until movement animation is added.
- coordinates are optional and may be computed client-side from anchor slots.

## `GET /api/agent-world/events`
Returns recent semantic events in reverse chronological order.

### Response
```json
{
  "events": [
    {
      "id": "evt-101",
      "agentId": "lucca-main",
      "ts": "2026-03-18T08:40:10Z",
      "type": "state_changed",
      "label": "Moved into desk/writing state",
      "detail": "Preparing Agent World implementation scaffolding."
    }
  ]
}
```

## `POST /api/agent-world/agents/{agent_id}/command`
Sends an explicit operator command directly to the target session.

This endpoint must be **read-only safe by default** in the UI: no command is sent unless the operator explicitly submits one.

### Request
```json
{
  "text": "Summarize the active issue queue.",
  "mode": "append",
  "source": "ui"
}
```

### Response
```json
{
  "ok": true,
  "acceptedAt": "2026-03-18T08:40:30Z",
  "agentId": "lucca-main",
  "echoedCommand": "Summarize the active issue queue.",
  "status": "accepted",
  "delivery": "direct_session"
}
```

### Delivery rules
- `append` — send directly to the target session as the next instruction
- `status` — ask the target session for its current status
- `interrupt` — reserved but supported by schema; behavior can remain conservative in v1

## Mapping rules for v1
- `read` / reference-heavy activity → `library`
- `write` / synthesis / planning / drafting → `desk`
- `edit`, `exec`, `browser` → `terminal`
- `message` / explicit replies → `comms`
- waiting or idle → `lounge`
- blocked or error → keep current anchor and set visual state `blocked`

## Stability rules for v1
- do not remap anchors on every micro-event
- use a short heuristic window to derive the dominant current activity
- prefer stable clarity over rapid motion

## Optional future route
- `GET /api/agent-world/stream` — SSE live updates for state and events
