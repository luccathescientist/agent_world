import test from "node:test";
import assert from "node:assert/strict";

import { bindChatBubbleEditorEvents } from "../src/features/editor/chatBubble/editorEvents.js";

function makeElement() {
  const listeners = [];
  return {
    listeners,
    addEventListener(type, fn) {
      listeners.push({ type, fn });
    },
  };
}

test("bindChatBubbleEditorEvents wires role, assign/reset, and color controls", () => {
  const elements = new Map([
    ["assign-chat-bubble-tile", makeElement()],
    ["reset-chat-bubble-frame", makeElement()],
    ["chat-bubble-text-color", makeElement()],
  ]);
  const roleButton = {
    dataset: { role: "tool" },
    listeners: [],
    addEventListener(type, fn) {
      this.listeners.push({ type, fn });
    },
  };
  const calls = [];
  const state = {
    editor: {
      selectedChatBubbleRole: "assistant",
      selectedChatBubbleSlot: "mm",
      selectedLayer: "floor",
    },
  };
  bindChatBubbleEditorEvents(state, {
    assignChatBubbleTile: () => calls.push("assign"),
    documentRef: {
      getElementById(id) {
        return elements.get(id) || null;
      },
      querySelectorAll(selector) {
        if (selector === ".chat-bubble-role-btn") return [roleButton];
        return [];
      },
    },
    renderVisualEditor: () => calls.push("render"),
    resetChatBubbleFrame: () => calls.push("reset"),
    selectedChatBubbleTheme: () => ({
      frame: { mm: { layer: "wall", token: "2:3" } },
    }),
    setChatBubbleTextColor: (color) => calls.push(`color:${color}`),
    setTilemapStatus: () => {},
  });

  elements.get("assign-chat-bubble-tile").listeners[0].fn();
  elements.get("reset-chat-bubble-frame").listeners[0].fn();
  roleButton.listeners[0].fn();
  elements.get("chat-bubble-text-color").listeners[0].fn({ target: { value: "#abcdef" } });

  assert.equal(state.editor.selectedChatBubbleRole, "tool");
  assert.equal(state.editor.selectedLayer, "wall");
  assert.deepEqual(calls, ["assign", "reset", "render", "color:#abcdef"]);
});
