# Development Workflow

## Working Assumptions

Agent World is a standalone app in this repository. Most changes fall into one
of these categories:

- frontend UI changes
- backend state-mapping changes
- API shape changes
- tilemap/editor changes
- sprite or asset changes

## Where To Start For A Task

If the task is about:

- panel layout or controls
  start with `index.html`, `styles.css`, `app.js`
- live state, history, or inspector fields
  start with `backend/state_mapper.py`
- command delivery
  start with `backend/command_router.py`
- which agents appear
  start with `backend/registry.py`
- layout saving or movement
  start with `backend/world_layout.py`
- route behavior
  read `server.py`
- map graphics or world geometry
  read `assets/tiles/office_world/*` and editor code in `app.js`

## Practical Local Workflow

### For UI changes

1. Read `index.html` for structure
2. Read `styles.css` for the relevant layout selectors
3. Find the matching render/update functions in `app.js`
4. Refresh `/`
5. Verify selected-agent and no-selection states both work

### For backend changes

1. Read the route in `server.py`
2. Read the backing adapter module in `backend/`
3. Check the shape consumed by `app.js`
4. Keep response changes backward-compatible where possible

### For tilemap changes

1. Inspect `assets/tiles/office_world/manifest.json`
2. Inspect `game_state.json`
3. Inspect the relevant state keys inside that file
4. Check editor helpers in `app.js`
5. Verify walkability and anchor behavior

## Important Frontend Functions

These are good entry points for code reading:

- `load()`
- `initRenderer()`
- `renderWorld()`
- `renderInspector()`
- `renderHistory()`
- `connectStream()`
- `selectAgent()`
- `commitDraftTilemap()`
- `saveRoomLayout()`

## Important Backend Functions

- `derive_agent_world_state()`
- `derive_agent_detail()`
- `derive_agent_world_events()`
- `route_operator_command()`
- `set_agent_movement_override()`
- `iter_agent_world_stream()`

## Known Behavioral Patterns

- World selection state is mostly frontend-driven.
- Agent status is heuristic, not a guaranteed backend truth field.
- The selected-agent detail payload is richer than the world snapshot.
- SSE snapshots are full snapshots, not patch events.
- The editor uses local storage heavily.

## Common Footguns

### Changing layout without checking local storage

The browser may still render a locally cached draft map even after files changed.
If a change seems ignored, inspect the `TILEMAP_STORAGE_KEYS` behavior in `app.js`.

### Updating API docs without checking the server

`api-contract.md` is historical design context. The real route set is in
`server.py`.

### Forgetting the selected and unselected world states

The page layout changes when an agent is selected. Test both states when changing
the world tab.

### Breaking multi-agent assumptions

Even if only Lucca is usually present, many payloads and rendering paths are array-based.
Do not casually hardcode single-agent assumptions into backend or renderer logic.

## Recommended Documentation Maintenance

When you make a meaningful subsystem change:

- update `README.md` if the mental model changed
- update `API_REFERENCE.md` if route shapes changed
- update `FRONTEND.md` if layout or render flow changed
- update `BACKEND.md` if heuristics or module responsibilities changed
- update `ASSETS_AND_TILEMAPS.md` if map or asset schema changed

## Minimal Verification Checklist

- load `/`
- confirm the world renders
- confirm the default selected agent logic still works
- confirm the selected-agent inspector still populates
- confirm chat still receives history
- if layout/editor code changed, verify save and reload behavior
