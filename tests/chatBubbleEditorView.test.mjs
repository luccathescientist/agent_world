import test from "node:test";
import assert from "node:assert/strict";

import { renderChatBubbleEditorPanel } from "../src/features/editor/chatBubble/editorView.js";

function makeRoleButton(role) {
  const classes = new Set();
  return {
    dataset: { role },
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
  };
}

test("renderChatBubbleEditorPanel renders preview items and wires hotspot clicks", () => {
  const hotspotListeners = [];
  const roleButton = makeRoleButton("assistant");
  const previewList = {
    innerHTML: "",
    querySelectorAll(selector) {
      if (selector === ".chat-item.preview") {
        return [{
          classList: {
            contains(name) {
              return name === "assistant";
            },
          },
        }];
      }
      if (selector === ".chat-bubble-slot-hotspot") {
        return [{
          dataset: { role: "tool", slot: "tr" },
          addEventListener(type, fn) {
            hotspotListeners.push({ type, fn });
          },
        }];
      }
      return [];
    },
  };
  const selected = [];
  renderChatBubbleEditorPanel({
    editor: {
      selectedChatBubbleRole: "assistant",
    },
  }, {
    applyChatRoleTheme: () => {},
    chatBubbleMarkup: () => "<div></div>",
    chatBubbleSlotOverlayMarkup: () => "<button class=\"chat-bubble-slot-hotspot\" data-role=\"tool\" data-slot=\"tr\"></button>",
    documentRef: {
      getElementById(id) {
        if (id === "editor-chat-bubble-preview-list") return previewList;
        return null;
      },
      querySelectorAll(selector) {
        if (selector === ".chat-bubble-role-btn") return [roleButton];
        return [];
      },
    },
    formatRichTextHtml: (value) => value,
    onSelectChatBubbleSlot: (role, slot) => {
      selected.push({ role, slot });
    },
  });

  assert.match(previewList.innerHTML, /chat-bubble-preview-card/);
  assert.match(previewList.innerHTML, /chat-bubble-preview-shell/);
  assert.equal(roleButton.classList.contains("active"), true);
  assert.equal(hotspotListeners.length, 1);
  hotspotListeners[0].fn();
  assert.deepEqual(selected, [{ role: "tool", slot: "tr" }]);
});
