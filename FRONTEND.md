# Agent World Frontend

## Stack

- Plain HTML in `index.html`
- Plain CSS in `styles.css`
- Plain JavaScript in `app.js`
- PixiJS for room and character rendering

There is no frontend framework, build step, or component system. `app.js` is the
application.

## Page Structure

The UI is split into two top-level tabs:

- `World`
  Operator-facing world view
- `Editor`
  Tilemap and chat-bubble editing tools

The world tab has two columns when an agent is selected:

- Main column
  World panel with canvas, footer hints, and embedded inspector
- Sidebar
  Chat log plus a collapsed debug drawer for secondary panels

## Main Frontend State

The main state object is `appState` in `app.js`.

Important sections:

- `world`
  Latest `/api/agent-world/state` snapshot
- `detail`
  Selected agent detail payload from `/api/agent-world/agents/{agent_id}`
- `selectedAgentId`
  Current agent selection
- `stream`
  Active `EventSource`
- `renderer`
  Pixi app, textures, display layers, and sprite lookup tables
- `tilemap`
  Parsed map state used for rendering and editing
- `editor`
  Editor tab state for maps, selections, regions, stash placement, and chat bubbles
- `messageSelection`
  State for the hidden message-view panel
- `voice`
  Browser speech-recognition, speech-synthesis, and microphone debug state

## Startup Flow

The frontend boot sequence is:

1. `setActiveTab("world")`
2. `load()`
3. `initRenderer()`
4. `getJson("/api/agent-world/state")`
5. `renderWorld(worldState)`
6. Default-select `lucca-main` if no agent is selected yet
7. `selectAgent(agentId)`
8. `connectStream()`

## Rendering Model

### Pixi scene

`initRenderer()` sets up the Pixi app and display layers. The room is composed from:

- floor tiles
- walls
- furniture
- props
- room labels
- stash box
- agent sprites
- agent labels
- speech bubbles
- editor overlays when relevant

### Agent sprites

Two sprite families exist:

- `lucca-default`
  Main named-agent atlas
- `robo-default`
  Benchmark worker atlas

Important runtime helpers:

- `createAgentSprite()`
- `createBenchmarkSprite()`
- `tickAgents()`
- `applyPathing()`
- `goalTileForAgent()`
- `findPath()`
- `updateBubble()`
- `updateAgentLabel()`

### Inactive-agent filtering

The main agent is always shown. Other agents can be hidden when they are idle or
offline and stale beyond the inactivity threshold.

## Selection and Detail

Agent selection can happen from:

- the header dropdown
- clicking a sprite in the world

When selected:

- `selectedAgentId` is set
- `syncWorldDetailVisibility()` adds the `world-detail-open` body class
- embedded inspector appears inside the world panel
- sidebar chat becomes visible
- selected-agent detail is fetched
- the SSE stream reconnects with `agent_id=...`

When closed:

- `selectedAgentId` is cleared
- inspector hides
- detail panels clear
- SSE reconnects without a selected-agent detail payload

## Sidebar Panels

Visible by default:

- chat log
- composer
- voice controls and voice diagnostics

Collapsed by default:

- debug drawer containing stash, schedule, and activity feed

Hidden but still wired:

- message view panel, used for inspecting richer text/file payloads

## Voice Features

Voice controls live entirely in the browser.

Supported features:

- speech recognition start and stop
- optional auto-send transcript
- optional text-to-speech for current selected message
- optional auto-speaking of agent replies
- microphone device selection
- visible voice diagnostics

Main functions:

- `initVoiceControls()`
- `startVoiceCapture()`
- `stopVoiceCapture()`
- `speakText()`
- `renderVoiceDebugUi()`

## Tilemap Editor

The editor tab is a full in-browser world editor. It supports:

- editing floor, wall, furniture, and prop maps
- changing grid size
- painting visually from atlas cells
- assigning room regions
- placing the stash box
- editing chat-bubble tile frames and text colors

Draft edits are stored in local storage through `TILEMAP_STORAGE_KEYS`.

Important editor functions:

- `buildTilemapState()`
- `commitDraftTilemap()`
- `renderVisualEditor()`
- `assignRegionSelection()`
- `assignStashSelection()`
- `saveRoomLayout()`
- `assignChatBubbleTile()`

## Persistence Model

The frontend uses two persistence layers:

### Browser local storage

Used for:

- map draft layers
- room regions
- stash point
- chat-bubble frame configuration
- preferred voice input device

### Backend persistence

Used for:

- saved game state via `/api/agent-world/game-state`
- agent move overrides via `/api/agent-world/agents/{id}/move`

## Frontend Files Worth Reading First

- `app.js`
  Everything important lives here.
- `index.html`
  Useful when moving panels or adding controls.
- `styles.css`
  Controls the world/detail layout and editor look.

## Common Frontend Change Patterns

### Add a new detail field

1. Add field to backend payload
2. Add DOM node in `index.html`
3. Populate it in `renderInspector()`

### Add a new agent interaction

1. Add UI control in `index.html`
2. Add event listener in `app.js`
3. Call or create backend API route
4. Reflect result in `load()` or stream updates

### Change world rendering

1. Update layout or manifest assets
2. Adjust tile or sprite logic in `app.js`
3. Verify editor compatibility if the map format changed
