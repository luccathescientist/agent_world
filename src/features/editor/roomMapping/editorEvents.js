/*
 * Room-mapping editor event wiring.
 * Isolates room-mapping controls from the global DOM event bootstrap.
 */

import { createRoomMappingEditorRuntime } from "./editorRuntime.js";

export function bindRoomMappingEditorEvents(state, deps = {}) {
  const {
    documentRef = globalThis.document,
  } = deps;
  const runtime = createRoomMappingEditorRuntime(state, deps);

  documentRef.getElementById("region-kind-input").addEventListener("change", (event) => {
    runtime.updateRegionKind(event.target.value);
  });
  documentRef.getElementById("region-id-input").addEventListener("change", (event) => {
    runtime.updateRegionId(event.target.value);
  });
  documentRef.getElementById("region-label-input").addEventListener("input", (event) => {
    runtime.updateRegionLabel(event.target.value);
  });
  documentRef.getElementById("assign-region").addEventListener("click", runtime.assignRegion);
  documentRef.getElementById("clear-region").addEventListener("click", runtime.clearRegion);
  documentRef.getElementById("set-region-label-position").addEventListener("click", runtime.placeRegionLabel);
  documentRef.getElementById("assign-stash").addEventListener("click", runtime.assignStash);
  documentRef.getElementById("clear-stash").addEventListener("click", runtime.clearStash);
}
