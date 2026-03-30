# Frontend Modules

This directory now holds the extracted frontend modules and the main frontend entrypoint that were previously embedded in `app.js`.

## Current structure

```text
src/
  app/
    editorActions.js
    editorRuntime.js
    editorShell.js
    renderShell.js
    runtime.js
    settingsVoiceRuntime.js
    settingsVoiceShell.js
    shell.js
    startup.js
    worldShell.js
    worldUiRuntime.js
  bootstrap/
    domEvents.js
  core/
    constants.js
    dom.js
    format.js
    http.js
    storage.js
  features/
    chat/
      messageView.js
    editor/
      agentEditor.js
      editorState.js
      roomMappingEditor.js
      visualEditor.js
    settings/
      settingsPanel.js
    tilemap/
      mapText.js
      tilemapState.js
    voice/
      voiceController.js
    world/
      agentDetails.js
      agentSprites.js
      pathing.js
      presentation.js
      worldState.js
  render/
    assets.js
    pixiApp.js
    scene.js
    worldRenderer.js
  state/
    appState.js
  main.js
```

## Module Boundaries

- `src/main.js`: frontend entrypoint and top-level composition. It wires app state, browser globals, renderer ownership, and the extracted runtimes together.
- `src/state/appState.js`: shared mutable frontend state.
- `src/core/*`: shared low-level utilities for constants, DOM writes, formatting, HTTP, and storage.
- `src/features/*`: domain modules that own application behavior.
- `src/render/*`: PIXI-specific renderer modules split by asset bootstrap, scene drawing, renderer loop, and app initialization.
- `src/app/*`: composition modules that bind domain modules to browser/runtime dependencies without pushing that glue back into the feature modules.
- `src/bootstrap/domEvents.js`: DOM event registration and startup hooks that connect the page to the composed app APIs.

## `src/app/*`

- `runtime.js`: save/load game-state flows and command submission orchestration.
- `startup.js`: final startup assembly for resize binding, DOM events, and initial app boot.
- `shell.js`: small app-shell UI helpers for tabs, selectors, and detail visibility.
- `renderShell.js`: app-facing adapters around renderer modules.
- `worldShell.js`: app-facing adapters around world/chat/detail feature modules.
- `worldUiRuntime.js`: composed world/chat/detail runtime for selection, stream, inspector, chat, schedule, and stash flows.
- `settingsVoiceShell.js`: shell adapters for settings and voice UI/controller modules.
- `settingsVoiceRuntime.js`: composed runtime for settings, diagnostics, voice capture, and speech playback.
- `editorShell.js`: app-facing adapters around visual/editor feature modules.
- `editorActions.js`: editor mutation and draft-tilemap action helpers.
- `editorRuntime.js`: composed editor runtime for editor rendering, atlas selection, region/stash assignment, chat-bubble editing, and editor apply/reset flows.

## `src/features/*`

- `features/tilemap/mapText.js`: tilemap text parsing, token parsing, validation, and serialization helpers.
- `features/tilemap/tilemapState.js`: game-state persistence and local-storage synchronization helpers.
- `features/chat/chatBubbleThemes.js`: chat-bubble theme normalization, CSS variable application, and frame/atlas helpers.
- `features/chat/messageView.js`: message selection, rich-text rendering, chat rendering, history rendering, schedule rendering, and stash rendering.
- `features/editor/editorState.js`: editor-state mutations, grid resize helpers, and atlas/canvas coordinate helpers.
- `features/editor/visualEditor.js`: visual editor and preview rendering.
- `features/editor/roomMappingEditor.js`: room-region assignment and label placement logic.
- `features/editor/agentEditor.js`: agent preview panel and sprite preview helpers.
- `features/settings/settingsPanel.js`: settings form, diagnostics, and JSON editor UI logic.
- `features/voice/voiceController.js`: voice capture, transcript/debug UI, and speech playback helpers.
- `features/world/worldState.js`: normalized world/tilemap selectors and layout derivation.
- `features/world/pathing.js`: tile/pathfinding and ambient movement helpers.
- `features/world/presentation.js`: world/agent presentation helpers such as activity cues, visibility, and display labels.
- `features/world/agentSprites.js`: sprite/frame selection and label/bubble placement helpers.
- `features/world/agentDetails.js`: selected-agent detail, inspector, and stream-oriented state syncing.

## `src/render/*`

- `assets.js`: texture and atlas bootstrap.
- `scene.js`: static room scene drawing.
- `worldRenderer.js`: live world render loop and viewport helpers.
- `pixiApp.js`: PIXI app initialization and pointer wiring.

## Notes

- `src/main.js` is now the page entrypoint and orchestration layer.
- Root `app.js` is only a compatibility stub that imports `src/main.js`.
- Most modules use dependency injection for DOM, window, PIXI, and state-adjacent helpers so they can be tested in isolation.
- The editor/runtime boundary is still an important future cleanup area. The editor should eventually produce a strict world-bundle contract that the runtime consumes, rather than sharing implicit internal assumptions.
