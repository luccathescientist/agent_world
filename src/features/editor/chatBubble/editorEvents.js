/*
 * Chat-bubble editor event wiring.
 * Isolates chat-bubble controls from global DOM bootstrap logic.
 */

import { createChatBubbleEditorRuntime } from "./editorRuntime.js";

export function bindChatBubbleEditorEvents(state, deps = {}) {
  const {
    documentRef = globalThis.document,
  } = deps;
  const runtime = createChatBubbleEditorRuntime(state, deps);

  documentRef.getElementById("assign-chat-bubble-tile").addEventListener("click", runtime.assignTile);
  documentRef.getElementById("reset-chat-bubble-frame").addEventListener("click", runtime.resetFrame);
  for (const button of documentRef.querySelectorAll(".chat-bubble-role-btn")) {
    button.addEventListener("click", () => runtime.setRole(button.dataset.role));
  }
  documentRef.getElementById("chat-bubble-text-color").addEventListener("input", (event) => {
    runtime.setTextColor(event.target.value);
  });

  return runtime;
}
