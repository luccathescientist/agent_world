# Agent World Backend Adapter Layer

This directory exists to keep Agent World logic separate from the thin `server.py` route layer.

## Intended modules

- `registry.py` — source of truth for visible core named agents
- `state_mapper.py` — derive semantic room state from runtime/session activity
- `event_mapper.py` — produce recent semantic events for the UI
- `command_router.py` — send explicit operator commands to the target session
- `stream.py` — live update transport helpers (SSE / WebSocket)

## Design intent

Single-agent first, multi-agent ready.

The first real implementation may only render Lucca, but the API and state derivation should preserve an array-based model so adding agents like Robo later does not require a redesign.
