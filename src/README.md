# Frontend Modules

This directory now holds the extracted frontend modules and the main frontend entrypoint that were previously embedded in `app.js`.

## Current structure

```text
src/
  app/
    runtime.js
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
  render/
    assets.js
    pixiApp.js
    scene.js
    worldRenderer.js
  state/
    appState.js
  main.js
```

## Notes

- `src/main.js` is now the page entrypoint and orchestration layer.
- Root `app.js` is only a compatibility stub that imports `src/main.js`.
- Most modules use dependency injection for DOM, window, PIXI, and state-adjacent helpers so they can be tested in isolation.
- Renderer code is split by responsibility:
  - `assets.js`: asset and texture bootstrap
  - `scene.js`: static room composition
  - `worldRenderer.js`: live world render loop and viewport helpers
  - `pixiApp.js`: PIXI app initialization and view event wiring
