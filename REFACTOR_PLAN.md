# Frontend Refactor Status

The frontend refactor is now mostly complete. The original goal was to break `app.js` into smaller, cohesive modules without changing behavior; that goal has been met for the major feature and renderer boundaries.

## Final module layout

```text
src/
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
```

## What was extracted

- Shared state and storage/http/format/DOM helpers
- Tilemap parsing and game-state persistence helpers
- Settings and voice UI/controller logic
- Chat rendering and world detail/stream handling
- Editor state, room mapping, agent editor, and visual editor logic
- World pathing and agent sprite helpers
- Renderer asset loading, scene drawing, world render loop, and PIXI bootstrap
- DOM event bootstrap

## What still remains in `app.js`

`app.js` is now primarily an orchestration layer:

- imports and dependency wiring
- thin wrapper functions that adapt app-specific globals like `document`, `window`, `PIXI`, and `appState`
- a smaller set of shared domain helpers that are still cross-cutting enough to keep local for now

The remaining wrappers are intentional in most cases. They keep module APIs dependency-injected and testable while preserving the current page entrypoint and existing DOM wiring.

## Cleanup follow-up

The next cleanup pass, if needed, should focus on:

1. Converting more wrapper-only helpers in `app.js` into direct helper calls where that does not make DOM/bootstrap wiring harder to follow.
2. Moving any remaining cross-cutting utility clusters only if they form a clear module boundary.
3. Renaming `app.js` to a dedicated entrypoint such as `src/main.js` only when the HTML/bootstrap swap is worth the churn.
