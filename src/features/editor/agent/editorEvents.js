/*
 * Agent editor event wiring.
 * Keeps agent-preview control binding out of the global DOM bootstrap.
 */

import { createAgentEditorRuntime } from "./editorRuntime.js";

export function bindAgentEditorEvents(state, deps = {}) {
  const {
    documentRef = globalThis.document,
  } = deps;
  const runtime = createAgentEditorRuntime(state, deps);
  documentRef.getElementById("toggle-editor-agents").addEventListener("change", (event) => {
    runtime.setShowAgents(event.target.checked);
  });
}
