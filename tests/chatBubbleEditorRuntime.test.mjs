import test from "node:test";
import assert from "node:assert/strict";

import { createChatBubbleEditorRuntime } from "../src/features/editor/chatBubble/editorRuntime.js";

test("chat-bubble runtime runs assign/reset with guarded error handling", () => {
  const calls = [];
  const runtime = createChatBubbleEditorRuntime({
    editor: { selectedChatBubbleSlot: "mm", selectedLayer: "floor" },
  }, {
    assignChatBubbleTile: () => calls.push("assign"),
    resetChatBubbleFrame: () => calls.push("reset"),
    setTilemapStatus: () => {},
  });
  runtime.assignTile();
  runtime.resetFrame();
  assert.deepEqual(calls, ["assign", "reset"]);
});

test("chat-bubble runtime updates role/slot and rerenders", () => {
  let rerenders = 0;
  const state = {
    editor: {
      selectedChatBubbleRole: "assistant",
      selectedChatBubbleSlot: "mm",
      selectedLayer: "floor",
    },
  };
  const runtime = createChatBubbleEditorRuntime(state, {
    renderVisualEditor: () => {
      rerenders += 1;
    },
    selectedChatBubbleTheme: () => ({
      frame: {
        tr: { layer: "wall", token: "2:3" },
      },
    }),
    setTilemapStatus: () => {},
  });
  runtime.setRole("tool");
  runtime.setRoleAndSlot("user", "tr");
  assert.equal(state.editor.selectedChatBubbleRole, "user");
  assert.equal(state.editor.selectedChatBubbleSlot, "tr");
  assert.equal(state.editor.selectedLayer, "wall");
  assert.equal(rerenders, 2);
});

test("chat-bubble runtime forwards text color updates", () => {
  const colors = [];
  const runtime = createChatBubbleEditorRuntime({ editor: {} }, {
    setChatBubbleTextColor: (color) => colors.push(color),
    setTilemapStatus: () => {},
  });
  runtime.setTextColor("#aabbcc");
  assert.deepEqual(colors, ["#aabbcc"]);
});
