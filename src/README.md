# Frontend Refactor Tree

Current low-risk extractions:

- `core/constants.js`
- `core/dom.js`
- `core/format.js`
- `core/http.js`
- `core/storage.js`

Target layout:

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

Refactor order:

1. Keep extracting pure helpers and shared state access first.
2. Move settings and voice next.
3. Extract tilemap parsing, regions, and pathfinding.
4. Split PIXI rendering and world UI.
5. Finish by shrinking `app.js` into `main.js` plus event bootstrap.
