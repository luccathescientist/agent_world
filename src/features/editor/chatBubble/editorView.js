/*
 * Chat-bubble editor view helpers.
 * Keeps chat-bubble preview card rendering and hotspot wiring separate from the
 * mixed visual editor renderer.
 */

import { CHAT_BUBBLE_PREVIEW_SAMPLES } from "../../../core/constants.js";

export function renderChatBubbleEditorPanel(state, helpers = {}) {
  const {
    applyChatRoleTheme = () => {},
    chatBubbleMarkup = () => "",
    chatBubbleSlotOverlayMarkup = () => "",
    documentRef = globalThis.document,
    formatRichTextHtml = (value) => value,
    onSelectChatBubbleSlot = () => {},
  } = helpers;
  const chatBubblePreviewList = documentRef.getElementById("editor-chat-bubble-preview-list");
  if (!chatBubblePreviewList) return;

  chatBubblePreviewList.innerHTML = CHAT_BUBBLE_PREVIEW_SAMPLES.map((sample) => `
    <article class="chat-bubble-preview-card ${sample.role}">
      <div class="chat-bubble-preview-label">${sample.label}</div>
      <div class="chat-item ${sample.role} preview">
        <div class="chat-bubble-preview-shell">
          ${chatBubbleMarkup(sample.role, sample.metaLabel, sample.eventType, sample.time, formatRichTextHtml(sample.body))}
          ${chatBubbleSlotOverlayMarkup(sample.role)}
        </div>
      </div>
    </article>
  `).join("");

  for (const item of chatBubblePreviewList.querySelectorAll(".chat-item.preview")) {
    const role = item.classList.contains("user") ? "user" : item.classList.contains("tool") ? "tool" : "assistant";
    applyChatRoleTheme(item, role);
  }
  for (const button of chatBubblePreviewList.querySelectorAll(".chat-bubble-slot-hotspot")) {
    button.addEventListener("click", () => {
      onSelectChatBubbleSlot(button.dataset.role, button.dataset.slot || "mm");
    });
  }
  for (const button of documentRef.querySelectorAll(".chat-bubble-role-btn")) {
    button.classList.toggle("active", button.dataset.role === state.editor.selectedChatBubbleRole);
  }
}
