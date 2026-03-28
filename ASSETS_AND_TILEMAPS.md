# Assets And Tilemaps

## Asset Families

Agent World uses two major asset families:

- character sprites in `assets/sprites/`
- room/tile assets in `assets/tiles/`

## Sprite Assets

### Character atlases

- `assets/sprites/lucca_atlas.png`
- `assets/sprites/lucca_atlas.json`
- `assets/sprites/robo_atlas.png`
- `assets/sprites/robo_atlas.json`

The JSON files define frame metadata. The frontend loads them at startup and
builds frame sequences for idle and walking animations.

### Source sprite images

- `lucca.png`
- `robo.png`

These are useful source artifacts for rebuilding atlases or understanding sprite
sheet layout.

### Sprite selection logic

`backend/registry.py` chooses `sprite_seed`, and `app.js` maps that to the
correct atlas frame set.

Current defaults:

- `lucca-main` -> `lucca-default`
- benchmark agents -> `robo-default`

## Tilemap Assets

The active world data lives in `assets/tiles/office_world/`.

Key files:

- `manifest.json`
  Tile code to meaning and rendering metadata
- `game_state.json`
  Single-file localStorage-like payload for map layers, room regions, stash,
  chat-bubble config, layout config, and movement overrides

## Manifest Format

`manifest.json` maps a one-character token to rendering behavior.

The frontend currently loads this file directly at startup. It is still an
active runtime dependency, not just a build artifact.

Fields commonly used:

- `kind`
- `name`
- `passable`
- `door`
- `primitive`
- `atlasPath`
- `atlasTileSize`
- `grid`

Examples:

- floor token with atlas coordinates
- primitive wall or door token
- object token such as terminal, desk, bookshelf, or plant

## Game State Format

`game_state.json` is the canonical persisted world-state file.

It is also the shipped default world for a fresh installation from the
repository. The current checked-in layout should be treated as the clean-install
baseline unless explicitly replaced by a future settings/bootstrap flow.

It stores a localStorage-like object keyed by `agent-world-*` entries. The
important keys currently include:

- `agent-world-floor-map`
- `agent-world-wall-map`
- `agent-world-furniture-map`
- `agent-world-prop-map`
- `agent-world-room-regions`
- `agent-world-stash-point`
- `agent-world-chat-bubble-frame`
- `agent-world-layout-config`
- `agent-world-movement-overrides`

## Room Regions

Room regions are editor-defined cell groups that give the world more semantic
spatial structure than just anchor points.

Each region includes:

- `id`
- `label`
- `kind`
- `cells`

The frontend uses these regions for:

- room labels
- region editing
- pathing goals
- anchor derivation in some editor flows

## Movement Overrides

Movement overrides now live inside `game_state.json` under
`agent-world-movement-overrides`.

## Asset Generation Tooling

### `tools/build_office_tilemap_assets.py`

Bootstraps:

- `manifest.json`
- `game_state.json`

This is useful when regenerating a clean office-world baseline.

### Historical note

The repo still contains older experimentation notes such as
`ROOM_BLUEPRINTS.md` and `SPRITES.md`, but no longer keeps unused preview tiles,
legacy indoor-pack assets, or source tileset zip archives in the tracked tree.

## Browser Persistence Versus File Persistence

The editor stores some state in browser local storage, which can temporarily
diverge from files on disk.

Local storage examples:

- draft maps
- room regions
- stash point
- chat-bubble frame config

Disk persistence examples:

- `game_state.json`

If the UI looks different than the checked-in files suggest, inspect local
storage behavior in `app.js` before assuming the assets are wrong.
