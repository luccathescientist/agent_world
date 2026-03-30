/*
 * Chat-bubble theme and frame helpers.
 * This module owns normalization, theme selection, CSS variable updates, and
 * atlas-frame handling for the chat bubble presentation layer.
 */
import {
  DEFAULT_CHAT_BUBBLE_FRAME,
  DEFAULT_CHAT_TEXT_COLORS,
  DEFAULT_FLOOR_ATLAS_PATH,
  DEFAULT_WALL_ATLAS_PATH,
  TILE_SIZE,
} from "../../core/constants.js";

export function normalizeChatBubbleFrame(rawFrame) {
  const frame = Object.fromEntries(
    Object.entries(DEFAULT_CHAT_BUBBLE_FRAME).map(([key, value]) => [key, { ...value }]),
  );
  for (const key of Object.keys(frame)) {
    const rawValue = rawFrame?.[key];
    if (rawValue && typeof rawValue === "object") {
      const token = String(rawValue.token || "").trim();
      const layer = rawValue.layer === "floor" ? "floor" : "wall";
      if (/^\d+:\d+$/.test(token)) frame[key] = { layer, token };
      continue;
    }
    const legacyToken = String(rawValue || "").trim();
    if (/^\d+:\d+$/.test(legacyToken)) frame[key] = { layer: "wall", token: legacyToken };
  }
  return frame;
}

export function normalizeChatBubbleTheme(rawTheme, role) {
  return {
    frame: normalizeChatBubbleFrame(rawTheme?.frame || rawTheme),
    textColor: /^#[0-9a-f]{6}$/i.test(String(rawTheme?.textColor || "").trim())
      ? String(rawTheme.textColor).trim()
      : DEFAULT_CHAT_TEXT_COLORS[role] || "#fff4d7",
  };
}

export function normalizeChatBubbleThemes(rawValue) {
  if (rawValue?.assistant || rawValue?.tool || rawValue?.user) {
    return {
      assistant: normalizeChatBubbleTheme(rawValue.assistant, "assistant"),
      tool: normalizeChatBubbleTheme(rawValue.tool, "tool"),
      user: normalizeChatBubbleTheme(rawValue.user, "user"),
    };
  }
  const sharedFrame = normalizeChatBubbleFrame(rawValue);
  return {
    assistant: { frame: sharedFrame, textColor: DEFAULT_CHAT_TEXT_COLORS.assistant },
    tool: { frame: sharedFrame, textColor: DEFAULT_CHAT_TEXT_COLORS.tool },
    user: { frame: sharedFrame, textColor: DEFAULT_CHAT_TEXT_COLORS.user },
  };
}

export function selectedChatBubbleTheme(state) {
  return state.chatBubbleThemes[state.editor.selectedChatBubbleRole] || state.chatBubbleThemes.assistant;
}

export function chatBubbleTokenToBackgroundPosition(token) {
  const match = String(token || "").match(/^(\d+):(\d+)$/);
  if (!match) return "0px 0px";
  const x = Number(match[1]);
  const y = Number(match[2]);
  return `${-(x - 1) * TILE_SIZE}px ${-(y - 1) * TILE_SIZE}px`;
}

export function chatBubbleAtlasPathForLayer(state, layer) {
  return layer === "floor"
    ? (state.renderer?.assets?.layout?.floorAtlasPath || DEFAULT_FLOOR_ATLAS_PATH)
    : (state.renderer?.assets?.layout?.wallAtlasPath || DEFAULT_WALL_ATLAS_PATH);
}

export function loadChatBubbleAtlasImage(cacheState, atlasPath, deps = {}) {
  const { ImageCtor } = deps;
  const key = atlasPath || DEFAULT_WALL_ATLAS_PATH;
  if (!cacheState.atlasImagePromise) cacheState.atlasImagePromise = new Map();
  if (cacheState.atlasImagePromise.has(key)) return cacheState.atlasImagePromise.get(key);
  const promise = new Promise((resolve, reject) => {
    const image = new ImageCtor();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load wall atlas for chat bubbles."));
    image.src = key;
  });
  cacheState.atlasImagePromise.set(key, promise);
  return promise;
}

export function buildChatBubbleTileDataUrl(image, token, deps = {}) {
  const { canvasFactory } = deps;
  const match = String(token || "").match(/^(\d+):(\d+)$/);
  if (!match) return "";
  const x = Number(match[1]);
  const y = Number(match[2]);
  const canvas = canvasFactory();
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) return "";
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    (x - 1) * TILE_SIZE,
    (y - 1) * TILE_SIZE,
    TILE_SIZE,
    TILE_SIZE,
    0,
    0,
    TILE_SIZE,
    TILE_SIZE,
  );
  return canvas.toDataURL("image/png");
}

export async function applyChatBubbleFrameImages(state, cacheState, deps = {}) {
  const {
    consoleRef = console,
    documentRef,
    ImageCtor,
  } = deps;
  const root = documentRef?.documentElement;
  if (!root) return;
  try {
    for (const role of ["assistant", "tool", "user"]) {
      const theme = state.chatBubbleThemes[role];
      for (const slot of Object.keys(DEFAULT_CHAT_BUBBLE_FRAME)) {
        const slotDef = theme?.frame?.[slot];
        const atlasPath = chatBubbleAtlasPathForLayer(state, slotDef?.layer);
        const atlasImage = await loadChatBubbleAtlasImage(cacheState, atlasPath, { ImageCtor });
        const dataUrl = buildChatBubbleTileDataUrl(atlasImage, slotDef?.token, {
          canvasFactory: () => documentRef.createElement("canvas"),
        });
        root.style.setProperty(`--chat-${role}-${slot}-image`, dataUrl ? `url("${dataUrl}")` : "none");
      }
    }
  } catch (error) {
    consoleRef.warn(error);
  }
}

export function applyChatBubbleFrameStyles(state, cacheState, deps = {}) {
  const { documentRef } = deps;
  const root = documentRef?.documentElement;
  if (!root) return;
  for (const role of ["assistant", "tool", "user"]) {
    const theme = state.chatBubbleThemes[role];
    root.style.setProperty(`--chat-${role}-text-color`, theme?.textColor || DEFAULT_CHAT_TEXT_COLORS[role]);
    for (const slot of Object.keys(DEFAULT_CHAT_BUBBLE_FRAME)) {
      root.style.setProperty(`--chat-${role}-${slot}`, chatBubbleTokenToBackgroundPosition(theme?.frame?.[slot]?.token));
    }
  }
  void applyChatBubbleFrameImages(state, cacheState, deps);
}

export function chatBubbleMarkup(role, metaLabel, eventType, time, bodyHtml) {
  return `
    <div class="chat-bubble-frame">
      <span class="chat-bubble-tile tl" aria-hidden="true"></span>
      <span class="chat-bubble-tile tm" aria-hidden="true"></span>
      <span class="chat-bubble-tile tr" aria-hidden="true"></span>
      <span class="chat-bubble-tile ml" aria-hidden="true"></span>
      <div class="chat-bubble-content">
        <div class="chat-meta">
          <span class="chat-role-badge">${metaLabel}</span>
          <span class="chat-event-type">${eventType}</span>
          <span class="chat-time">${time}</span>
        </div>
        <div class="chat-body">${bodyHtml}</div>
      </div>
      <span class="chat-bubble-tile mr" aria-hidden="true"></span>
      <span class="chat-bubble-tile bl" aria-hidden="true"></span>
      <span class="chat-bubble-tile bm" aria-hidden="true"></span>
      <span class="chat-bubble-tile br" aria-hidden="true"></span>
    </div>
  `;
}

export function chatBubbleSlotOverlayMarkup(role, state, deps = {}) {
  const { escapeHtml = (value) => String(value) } = deps;
  return `
    <div class="chat-bubble-slot-overlay" data-role="${escapeHtml(role)}">
      ${["tl", "tm", "tr", "ml", "mm", "mr", "bl", "bm", "br"].map((slot) => `
        <button
          class="chat-bubble-slot-hotspot ${slot}${state.editor.selectedChatBubbleRole === role && state.editor.selectedChatBubbleSlot === slot ? " active" : ""}"
          type="button"
          data-role="${escapeHtml(role)}"
          data-slot="${escapeHtml(slot)}"
          aria-label="${escapeHtml(role)} ${escapeHtml(slot)}"
          title="${escapeHtml(role)} ${escapeHtml(slot)}"
        ></button>
      `).join("")}
    </div>
  `;
}

export function applyChatRoleTheme(element, role) {
  if (!element) return;
  for (const slot of Object.keys(DEFAULT_CHAT_BUBBLE_FRAME)) {
    element.style.setProperty(`--chat-role-${slot}-image`, `var(--chat-${role}-${slot}-image)`);
  }
  element.style.setProperty("--chat-role-text-color", `var(--chat-${role}-text-color)`);
}
