import test from "node:test";
import assert from "node:assert/strict";

import {
  applyChatBubbleFrameStyles,
  applyChatRoleTheme,
  buildChatBubbleTileDataUrl,
  chatBubbleAtlasPathForLayer,
  chatBubbleMarkup,
  chatBubbleSlotOverlayMarkup,
  chatBubbleTokenToBackgroundPosition,
  normalizeChatBubbleTheme,
  normalizeChatBubbleThemes,
  selectedChatBubbleTheme,
} from "../src/features/chat/chatBubbleThemes.js";

test("normalizeChatBubbleTheme falls back to role defaults and normalizes legacy tokens", () => {
  const theme = normalizeChatBubbleTheme({ tl: "2:3", mm: "9:4", textColor: "bad" }, "assistant");
  assert.equal(theme.textColor, "#fff4d7");
  assert.deepEqual(theme.frame.tl, { layer: "wall", token: "2:3" });
  assert.deepEqual(theme.frame.mm, { layer: "wall", token: "9:4" });
});

test("normalizeChatBubbleThemes supports per-role definitions", () => {
  const themes = normalizeChatBubbleThemes({
    assistant: { frame: { mm: { layer: "floor", token: "5:6" } }, textColor: "#abcdef" },
    tool: { textColor: "#123456" },
  });
  assert.equal(themes.assistant.textColor, "#abcdef");
  assert.deepEqual(themes.assistant.frame.mm, { layer: "floor", token: "5:6" });
  assert.equal(themes.tool.textColor, "#123456");
  assert.equal(themes.user.textColor, "#d8f3e8");
});

test("selectedChatBubbleTheme returns the active role theme", () => {
  const state = {
    chatBubbleThemes: {
      assistant: { id: "assistant" },
      tool: { id: "tool" },
    },
    editor: { selectedChatBubbleRole: "tool" },
  };
  assert.deepEqual(selectedChatBubbleTheme(state), { id: "tool" });
});

test("chat bubble helpers render positions and markup", () => {
  assert.equal(chatBubbleTokenToBackgroundPosition("3:4"), "-64px -96px");
  assert.equal(chatBubbleTokenToBackgroundPosition("bad"), "0px 0px");
  assert.match(chatBubbleMarkup("assistant", "AI Lucca", "state_changed", "12:00", "<p>Hi</p>"), /chat-bubble-content/);

  const overlay = chatBubbleSlotOverlayMarkup("assistant", {
    editor: {
      selectedChatBubbleRole: "assistant",
      selectedChatBubbleSlot: "mm",
    },
  }, {
    escapeHtml: (value) => String(value).replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
  });
  assert.match(overlay, /chat-bubble-slot-overlay/);
  assert.match(overlay, /mm active/);
});

test("chatBubbleAtlasPathForLayer prefers layout overrides", () => {
  const state = {
    renderer: {
      assets: {
        layout: {
          floorAtlasPath: "/tiles/floor.png",
          wallAtlasPath: "/tiles/wall.png",
        },
      },
    },
  };
  assert.equal(chatBubbleAtlasPathForLayer(state, "floor"), "/tiles/floor.png");
  assert.equal(chatBubbleAtlasPathForLayer(state, "wall"), "/tiles/wall.png");
});

test("buildChatBubbleTileDataUrl crops the expected atlas tile", () => {
  const drawCalls = [];
  const canvas = {
    width: 0,
    height: 0,
    getContext() {
      return {
        drawImage: (...args) => drawCalls.push(args),
        imageSmoothingEnabled: true,
      };
    },
    toDataURL() {
      return "data:image/png;base64,stub";
    },
  };
  const result = buildChatBubbleTileDataUrl({ id: "image" }, "2:3", {
    canvasFactory: () => canvas,
  });
  assert.equal(result, "data:image/png;base64,stub");
  assert.equal(canvas.width, 32);
  assert.equal(canvas.height, 32);
  assert.deepEqual(drawCalls[0].slice(1, 5), [32, 64, 32, 32]);
});

test("applyChatBubbleFrameStyles updates root variables and image theme links", async () => {
  const updates = [];
  const root = {
    style: {
      setProperty(name, value) {
        updates.push([name, value]);
      },
    },
  };
  const canvas = {
    getContext() {
      return {
        drawImage() {},
        imageSmoothingEnabled: true,
      };
    },
    toDataURL() {
      return "data:image/png;base64,theme";
    },
  };
  class FakeImage {
    set src(value) {
      this._src = value;
      queueMicrotask(() => {
        if (this.onload) this.onload();
      });
    }
  }
  const state = {
    chatBubbleThemes: normalizeChatBubbleThemes({
      assistant: { frame: { mm: { layer: "floor", token: "2:2" } }, textColor: "#111111" },
      tool: { frame: { mm: { layer: "wall", token: "3:3" } }, textColor: "#222222" },
      user: { frame: { mm: { layer: "wall", token: "4:4" } }, textColor: "#333333" },
    }),
    renderer: {
      assets: {
        layout: {
          floorAtlasPath: "/tiles/floor.png",
          wallAtlasPath: "/tiles/wall.png",
        },
      },
    },
  };
  const cacheState = { atlasImagePromise: null };
  applyChatBubbleFrameStyles(state, cacheState, {
    consoleRef: { warn() {} },
    documentRef: {
      createElement() {
        return canvas;
      },
      documentElement: root,
    },
    ImageCtor: FakeImage,
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.ok(updates.some(([name, value]) => name === "--chat-assistant-text-color" && value === "#111111"));
  assert.ok(updates.some(([name, value]) => name === "--chat-assistant-mm" && value === "-32px -32px"));
  assert.ok(updates.some(([name, value]) => name === "--chat-tool-mm-image" && value === 'url("data:image/png;base64,theme")'));
});

test("applyChatRoleTheme assigns CSS vars for the chosen role", () => {
  const updates = [];
  const element = {
    style: {
      setProperty(name, value) {
        updates.push([name, value]);
      },
    },
  };
  applyChatRoleTheme(element, "assistant");
  assert.ok(updates.some(([name, value]) => name === "--chat-role-mm-image" && value === "var(--chat-assistant-mm-image)"));
  assert.ok(updates.some(([name, value]) => name === "--chat-role-text-color" && value === "var(--chat-assistant-text-color)"));
});
