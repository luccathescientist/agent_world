# Frontend Refactor Plan

This refactor breaks the current frontend out of `app.js` in low-risk stages. The rule for each stage is to move cohesive code without changing behavior or reshaping state unless that is the explicit goal of the step.

## Current extracted core

- `src/core/constants.js`
- `src/core/dom.js`
- `src/core/format.js`
- `src/core/http.js`
- `src/core/storage.js`

## Target tree

```text
src/
  main.js
  state/
    appState.js
  core/
    constants.js
    dom.js
    format.js
    http.js
    storage.js
  features/
    settings/
      settingsPanel.js
    voice/
      voiceController.js
    chat/
      chatBubbles.js
      messageView.js
    world/
      worldPanel.js
      worldStream.js
      agentDetails.js
    tilemap/
      mapText.js
      tilemapState.js
      regions.js
      pathfinding.js
    editor/
      editorState.js
      visualEditor.js
      roomMappingEditor.js
      chatBubbleEditor.js
      agentEditor.js
  render/
    pixiApp.js
    assets.js
    scene.js
    agents.js
    labels.js
  bootstrap/
    domEvents.js
```

## Low-risk sequence

### 1. Extract shared app state

Move the full `appState` object into `src/state/appState.js` with no schema changes.

Why first:
- It is the main shared dependency for all later extractions.
- Exporting the existing object preserves behavior.

Do not:
- Rename fields.
- Introduce setters or a store abstraction.
- Split nested state yet.

### 2. Extract pure tilemap text helpers

Move map parsing and token helpers into `src/features/tilemap/mapText.js`.

Expected contents:
- `normalizeMapText`
- `parseMapText`
- `parseObjectRow`
- `parseFloorRow`
- `parseObjectToken`
- `parseFloorToken`
- `serializeFloorLines`
- `serializeObjectLines`
- `tokenLabel`
- `floorTokenLabel`
- `validateGrid`
- `validateObjectGrid`
- `getGridShape`
- `resolveGridShape`

Why next:
- These functions are mostly pure.
- They already cluster together.
- They support both tilemap state and editor behavior.

### 3. Extract tilemap persistence and game-state helpers

Move persistence and snapshot helpers into `src/features/tilemap/tilemapState.js`.

Expected contents:
- `normalizePersistenceSnapshot`
- `defaultLayoutConfig`
- `structuredSnapshotFromGameState`
- `peekParsedValue`
- `parseImportedAgentWorldStorageState`
- `applyImportedAgentWorldStorageState`
- `currentLayoutConfigPayload`
- `buildCurrentGameStatePayload`
- `syncGameStateTextarea`
- `writeGameStateToLocalStorage`

Notes:
- Keep function signatures stable.
- It is acceptable for this module to import `appState` during the first pass.

### 4. Extract settings UI

Move settings code into `src/features/settings/settingsPanel.js`.

Expected contents:
- settings form sync
- diagnostics rendering
- payload collection
- fetch/save/reload handlers

Why before voice:
- It is more deterministic.
- It has fewer browser API edge cases.

### 5. Extract voice controls

Move voice code into `src/features/voice/voiceController.js`.

Expected contents:
- voice UI rendering
- input device refresh
- mic meter lifecycle
- recording/transcription/playback
- `initVoiceControls`

Guardrails:
- Keep the existing `appState.voice` shape.
- Keep the current DOM IDs.
- Avoid changing event behavior in the same pass.

### 6. Extract DOM event bootstrap

Move the bottom event-wiring block into `src/bootstrap/domEvents.js`.

Expected contents:
- all `addEventListener(...)` setup
- editor subtab loops
- layer toggle loops
- startup calls such as `setActiveTab("world")`, `load()`, and `initVoiceControls()`

Why here:
- By this point, settings and voice handlers will already be importable.
- It reduces `app.js` to orchestration rather than wiring.

## Defer until later

These areas are not part of the low-risk pass:

- PIXI scene setup
- room drawing
- agent sprite animation
- world rendering
- event stream handling

Those surfaces are more coupled and should be split only after helpers, state, settings, voice, and bootstrap are already separated.
