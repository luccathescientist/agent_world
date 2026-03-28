# Agent World

Agent World is a browser UI that renders named agents as characters in a
semantic office. This repo is the extracted project that previously lived under
`dashboard/agent_world`. It is "single-agent first, multi-agent ready": Lucca
is the default main character, but the data model, backend adapters, and render
loop are built to support additional agents and benchmark workers.

## Running

Install the server dependencies:

```bash
pip install -r requirements.txt
```

Run the standalone app:

```bash
python server.py --port 8890
```

Then open `http://localhost:8890/`.

The system has three major pieces:

1. `server.py` serves the UI, static assets, and `/api/agent-world/*` routes.
2. `backend/*.py` derives world state from OpenClaw session data, routes operator
   commands, persists layout changes, and streams live snapshots.
3. `index.html`, `styles.css`, and `app.js` render the world, chat, inspector,
   voice controls, and tilemap editor in the browser.

## Start Here

- [ARCHITECTURE.md](./ARCHITECTURE.md) for the high-level system map
- [API_REFERENCE.md](./API_REFERENCE.md) for the real routes and payload shapes
- [FRONTEND.md](./FRONTEND.md) for UI state, rendering, and editor behavior
- [BACKEND.md](./BACKEND.md) for state derivation, registry, command routing, and SSE
- [ASSETS_AND_TILEMAPS.md](./ASSETS_AND_TILEMAPS.md) for sprites, maps, manifests, and layout data
- [DEVELOPMENT.md](./DEVELOPMENT.md) for practical change workflow and common tasks

## Directory Map

- `index.html` / `styles.css` / `app.js`
  Main Agent World frontend.
- `server.py`
  Standalone FastAPI server for local development and deployment.
- `backend/`
  Backend adapter layer intended to be imported by a host server.
- `assets/sprites/`
  Sprite atlases and metadata for Lucca and Robo.
- `assets/tiles/office_world/`
  Manifest, layout, map layers, movement overrides, and preview assets for the office world.
- `tools/`
  Asset generation and helper scripts.
- `schema.ts`
  Canonical TypeScript-flavored schema for core world payloads.
- `api-contract.md`
  Early design contract. Useful historical context, but not the complete current API.

## Current Behavior

- Loads at `/agent-world`
- Defaults to selecting `lucca-main` when present
- Shows the world canvas and an embedded inspector inside the world panel when an agent is selected
- Shows chat in the sidebar by default
- Hides secondary panels behind a collapsed debug drawer
- Uses SSE to keep the selected agent detail and world state live
- Includes a tilemap editor and chat-bubble theme editor under the `Editor` tab

## Important Integration Points

- Server mount: `/agent-world-static` serves this entire directory
- App entrypoint: `/` serves `index.html`
- World snapshot: `backend/state_mapper.py`
- Command delivery: `backend/command_router.py`
- Live stream: `backend/stream.py`
- Layout persistence: `backend/world_layout.py`
- Voice bridge: set `OPENCLAW_WORKSPACE` or place an OpenClaw checkout at
  `../openclaw` or `vendor/openclaw`

## Notes For Future Agents

- Do not treat `api-contract.md` as the only source of truth. Check the current
  host server and `backend/*.py` for the actual mounted routes and response fields.
- The frontend is plain HTML/CSS/JS with PixiJS. There is no framework layer.
- Layout and editor changes often involve both persisted JSON in `assets/tiles/office_world/`
  and local browser storage keys in `app.js`.
