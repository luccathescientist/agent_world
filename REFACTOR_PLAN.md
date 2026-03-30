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

## Longer-term roadmap

### 1. World bundle contract

The editor should eventually stop being "part of the runtime" in an implicit way and instead act as a producer of a strict world-bundle contract that the runtime consumes.

That contract should be the only boundary between editor and world rendering/runtime behavior. The world should not need to know about editor-internal state, and the editor should not need to know about runtime implementation details beyond the bundle schema it produces.

The current likely bundle surface is:

- bundle manifest and schema version
- bundle id, label, description, author, and mode metadata
- one or more map layouts
- floor/wall/furniture/prop tilemaps
- tile manifests and atlas metadata
- texture and asset paths, including PNG files and any atlas JSON metadata
- room regions and room labels
- anchor mappings and room-to-anchor relationships
- stash location and stash presentation metadata
- chat bubble theme/frame configuration
- agent visual mappings, sprite sheets, frame names, and preview defaults
- runtime-facing layout configuration such as world size, render padding, and layer defaults

That bundle contract should be versioned and expandable, because future editor features will keep adding data to it.

The end state should support:

- choosing a world bundle from a dropdown in Agent World
- importing/exporting bundles cleanly
- loading one or more bundles from a GitHub repository
- treating bundles as plugin-like drop-ins for different worlds or modes

### 2. In-world agent creation flow

The runtime should eventually let a user create an agent directly from the UI instead of requiring manual config edits first.

The intended flow is:

- click `New Agent`
- choose or upload the sprite/visual identity
- fill in core agent metadata such as name, model, and basic function
- configure tasking/default behavior such as a daily recipe-delivery chef
- save the agent and have it appear in-world as a live entity

This feature will need a clearer contract between the frontend editor/runtime and backend config management. At minimum it likely needs:

- a frontend form schema for agent definition
- validation for model choice, visual mapping, and role/task configuration
- a backend write path into `openclaw.json`
- a controlled gateway restart/reboot flow after config mutation
- UI feedback for pending restart, successful activation, and failure cases

This should probably be phased:

1. create/edit agent definitions in the UI
2. write definitions into backend config
3. reboot/reload the gateway in a controlled way
4. rehydrate the world so the new agent appears and becomes active

### 3. Multi-floor and multi-building worlds

The world model should eventually expand beyond a single floor into multiple floors or multiple buildings, effectively becoming a neighborhood-scale world.

That will likely require extending both the runtime and the future world-bundle contract with:

- multiple maps per bundle
- floor/building ids and transitions between them
- explicit portals, stairs, doors, elevators, or travel edges
- per-map asset/layout configuration
- a higher-level neighborhood or campus graph
- agent pathing across map boundaries
- UI affordances for viewing, selecting, and editing multiple floors/buildings

This should not be treated as "just a bigger map". It is a different world model and should probably sit on top of the bundle contract rather than being hacked into the current single-layout assumptions.

### Suggested sequencing

1. define and document the world-bundle contract
2. make the editor produce that contract explicitly
3. make the runtime load bundles through that contract only
4. add agent creation/editing on top of the same contract/config boundary
5. extend the contract to support multi-floor and multi-building worlds
