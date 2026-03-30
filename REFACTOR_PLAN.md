# Frontend Refactor Status

The frontend refactor is now mostly complete. The original goal was to break `app.js` into smaller, cohesive modules without changing behavior; that goal has been met for the major feature and renderer boundaries.

## Final module layout

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
- top-level render/world lifecycle ownership
- a smaller set of shared domain helpers that are still cross-cutting enough to keep local for now

The remaining wrappers are intentional in most cases. They keep module APIs dependency-injected and testable while preserving the current DOM wiring. The main place we explicitly stopped extracting was the renderer/world live lifecycle after the larger runtime split introduced regressions and had to be reverted.

Root `app.js` is now only a compatibility stub that imports `src/main.js`.

`src/main.js` is now below the original target threshold and sits at a manageable size. Any further reductions should stay conservative and avoid large renderer/runtime ownership moves unless the live world contract is first made more explicit.

## Cleanup follow-up

The next cleanup pass, if needed, should focus on:

1. Keeping `src/main.js` focused on renderer/world lifecycle ownership rather than letting new app-local helpers accumulate there again.
2. Documenting and hardening the editor-to-runtime bundle contract before attempting another large render/world extraction.
3. Deciding whether the root `app.js` compatibility stub should remain once the new `src/main.js` entrypoint has settled.

## Product follow-up

The longer-term product roadmap now lives in `IMPLEMENTATION_PLAN.md`.

For frontend/refactor purposes, the main architectural takeaway is:

- keep `src/main.js` focused on renderer/world lifecycle ownership
- do not attempt another large renderer/runtime extraction until the editor-to-runtime world bundle contract is documented and enforced
