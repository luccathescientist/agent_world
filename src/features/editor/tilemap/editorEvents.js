/*
 * Tilemap editor event wiring.
 * Isolates tilemap control/event bindings from the global DOM bootstrap.
 */

import { createTilemapEditorRuntime } from "./editorRuntime.js";

export function bindTilemapEditorEvents(state, deps = {}) {
  const {
    documentRef = globalThis.document,
  } = deps;
  const runtime = createTilemapEditorRuntime(state, deps);

  documentRef.getElementById("apply-tilemap").addEventListener("click", runtime.applyTilemap);
  documentRef.getElementById("save-game-state").addEventListener("click", runtime.saveTilemapGameState);
  documentRef.getElementById("resize-grid").addEventListener("click", runtime.resizeGridFromInputs);
  documentRef.getElementById("visual-token-empty").addEventListener("click", runtime.applyEmptyToken);

  documentRef.getElementById("floor-map-input").addEventListener("input", (event) => {
    runtime.updateDraftMap("floor", event.target.value);
  });
  documentRef.getElementById("wall-map-input").addEventListener("input", (event) => {
    runtime.updateDraftMap("wall", event.target.value);
  });
  documentRef.getElementById("furniture-map-input").addEventListener("input", (event) => {
    runtime.updateDraftMap("furniture", event.target.value);
  });
  documentRef.getElementById("prop-map-input").addEventListener("input", (event) => {
    runtime.updateDraftMap("prop", event.target.value);
  });
}
