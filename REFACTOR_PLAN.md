# Frontend Refactor Status

The frontend refactor is now mostly complete. The original goal was to break `app.js` into smaller, cohesive modules without changing behavior; that goal has been met for the major feature and renderer boundaries.

## Final module layout

```text
src/
  app/
    editorRuntime.js
    runtime.js
    startup.js
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
  render/
    assets.js
    pixiApp.js
    scene.js
    worldRenderer.js
  state/
    appState.js
  main.js
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

## What still remains in the entrypoint layer

`src/main.js` is now primarily an orchestration layer:

- imports and dependency wiring
- thin wrapper functions that adapt app-specific globals like `document`, `window`, `PIXI`, and `appState`
- a smaller set of shared domain helpers that are still cross-cutting enough to keep local for now

The remaining wrappers are intentional in most cases. They keep module APIs dependency-injected and testable while preserving the current DOM wiring.

Root `app.js` is now only a compatibility stub that imports `src/main.js`.

## Cleanup follow-up

The next cleanup pass, if needed, should focus on:

1. Converting more wrapper-only helpers in `src/main.js` into direct helper calls where that does not make DOM/bootstrap wiring harder to follow.
2. Moving any remaining cross-cutting utility clusters only if they form a clear module boundary.
3. Deciding whether the root `app.js` compatibility stub should remain once the new `src/main.js` entrypoint has settled.

## Longer-term roadmap

- Contractualize the editor output as a strict world-bundle interface rather than letting the editor and runtime share loose internal assumptions.
- Treat the editor as a producer of bundle artifacts and the main runtime as a consumer of that bundle contract.
- Define versioned bundle contents for assets, tilemaps, room regions, chat bubble themes, agent visuals, and runtime configuration.
- Support importing/exporting one or more bundles from a GitHub repository so users can swap entire worlds or modes by dropping in a compatible bundle set.
