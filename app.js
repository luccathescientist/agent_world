import {
  AGENT_BUBBLE_PALETTES,
  AGENT_INACTIVE_HIDE_MS,
  CANONICAL_ANCHOR_ALIASES,
  CHAT_BUBBLE_PREVIEW_SAMPLES,
  CHAT_BUBBLE_SLOT_LAYOUT,
  DEFAULT_ANCHOR_TILES,
  DEFAULT_CHAT_BUBBLE_FRAME,
  DEFAULT_CHAT_TEXT_COLORS,
  DEFAULT_FLOOR_ATLAS_PATH,
  DEFAULT_OFFICE_ATLAS_PATH,
  DEFAULT_SELECTED_AGENT_ID,
  DEFAULT_WALL_ATLAS_PATH,
  DEFAULT_WORLD_COLS,
  DEFAULT_WORLD_ROWS,
  EMPTY_OBJECT,
  GAME_STATE_STORAGE_KEYS,
  PATH_RE,
  ROOM_LANDMARK_TOKENS,
  SEAT_FURNITURE_TILES,
  TILE_SIZE,
  TILEMAP_STORAGE_KEYS,
  VISUAL_LAYER_CONFIG,
  WORLD_TOP_PADDING,
} from "./src/core/constants.js";
import { setText } from "./src/core/dom.js";
import { escapeHtml, formatDate, formatTime } from "./src/core/format.js";
import { getJson, getText, postJson } from "./src/core/http.js";
import {
  getStoredJson,
  getStoredMap,
  peekStoredJson,
  peekStoredMap,
  setStoredJson,
  setStoredMap,
} from "./src/core/storage.js";
import {
  floorTokenLabel,
  normalizeMapText,
  parseFloorRow,
  parseFloorToken,
  parseMapText,
  parseObjectRow,
  parseObjectToken,
  resolveGridShape,
  serializeFloorLines,
  serializeObjectLines,
  tokenLabel,
  validateObjectGrid,
} from "./src/features/tilemap/mapText.js";
import {
  applyImportedAgentWorldStorageState as applyImportedAgentWorldStorageStateHelper,
  buildCurrentGameStatePayload as buildCurrentGameStatePayloadHelper,
  currentLayoutConfigPayload as currentLayoutConfigPayloadHelper,
  defaultLayoutConfig as defaultLayoutConfigHelper,
  normalizePersistenceSnapshot as normalizePersistenceSnapshotHelper,
  parseImportedAgentWorldStorageState as parseImportedAgentWorldStorageStateHelper,
  peekParsedValue as peekParsedValueHelper,
  structuredSnapshotFromGameState as structuredSnapshotFromGameStateHelper,
  syncGameStateTextarea as syncGameStateTextareaHelper,
  writeGameStateToLocalStorage as writeGameStateToLocalStorageHelper,
} from "./src/features/tilemap/tilemapState.js";
import {
  collectSettingsPayload as collectSettingsPayloadHelper,
  fetchSettingsData as fetchSettingsDataHelper,
  renderCodeWithLineNumbers as renderCodeWithLineNumbersHelper,
  renderSettingsChecks as renderSettingsChecksHelper,
  renderSettingsSummary as renderSettingsSummaryHelper,
  saveSettings as saveSettingsHelper,
  saveSettingsFromJsonEditor as saveSettingsFromJsonEditorHelper,
  syncSettingsForm as syncSettingsFormHelper,
  syncSettingsJsonEditor as syncSettingsJsonEditorHelper,
} from "./src/features/settings/settingsPanel.js";
import {
  classifyPath as classifyPathHelper,
  cleanPath as cleanPathHelper,
  displayActionText as displayActionTextHelper,
  extractPaths as extractPathsHelper,
  fileUrl as fileUrlHelper,
  formatInlineRichText as formatInlineRichTextHelper,
  formatRichTextHtml as formatRichTextHtmlHelper,
  historyRoleClass as historyRoleClassHelper,
  historyRoleMeta as historyRoleMetaHelper,
  renderChat as renderChatHelper,
  renderHistory as renderHistoryHelper,
  renderRichText as renderRichTextHelper,
  renderSchedule as renderScheduleHelper,
  renderStash as renderStashHelper,
  setMessageSelection as setMessageSelectionHelper,
  showRichMessage as showRichMessageHelper,
  showStashItem as showStashItemHelper,
  stripControlTags as stripControlTagsHelper,
} from "./src/features/chat/messageView.js";
import {
  closeWorldDetails as closeWorldDetailsHelper,
  connectStream as connectStreamHelper,
  handleStreamSnapshot as handleStreamSnapshotHelper,
  renderInspector as renderInspectorHelper,
  selectAgent as selectAgentHelper,
  syncSelectedAgentDetailFromWorld as syncSelectedAgentDetailFromWorldHelper,
} from "./src/features/world/agentDetails.js";
import {
  chooseDisplayFrames as chooseDisplayFramesHelper,
  collectFrameSequence as collectFrameSequenceHelper,
  createAgentSprite as createAgentSpriteHelper,
  createBenchmarkSprite as createBenchmarkSpriteHelper,
  directionalIdleFrames as directionalIdleFramesHelper,
  directionalWalkFrames as directionalWalkFramesHelper,
  getAnimationFrames as getAnimationFramesHelper,
  positionAgentLabel as positionAgentLabelHelper,
  positionBubble as positionBubbleHelper,
  shouldMirrorSpriteForFacing as shouldMirrorSpriteForFacingHelper,
  spriteFramesForAgent as spriteFramesForAgentHelper,
  updateActivityCue as updateActivityCueHelper,
  updateAgentLabel as updateAgentLabelHelper,
  updateBubble as updateBubbleHelper,
} from "./src/features/world/agentSprites.js";
import {
  anchorPoint as anchorPointHelper,
  applyPathing as applyPathingHelper,
  currentTileForAgent as currentTileForAgentHelper,
  effectiveGoalTileForAgent as effectiveGoalTileForAgentHelper,
  findPath as findPathHelper,
  goalTileForAgent as goalTileForAgentHelper,
  inBounds as inBoundsHelper,
  isWalkable as isWalkableHelper,
  nearestWalkableTile as nearestWalkableTileHelper,
  roomGoalTile as roomGoalTileHelper,
  roomIdForAgent as roomIdForAgentHelper,
  roomWaypointTiles as roomWaypointTilesHelper,
  tileFromWorldPoint as tileFromWorldPointHelper,
  tilePoint as tilePointHelper,
} from "./src/features/world/pathing.js";
import {
  buildPrimitiveTexture as buildPrimitiveTextureHelper,
  buildTileTextures as buildTileTexturesHelper,
  getLayerTexture as getLayerTextureHelper,
  loadArtAssets as loadArtAssetsHelper,
} from "./src/render/assets.js";
import {
  applyEditorState as applyEditorStateHelper,
  applyVisualAtlasCell as applyVisualAtlasCellHelper,
  applyVisualToken as applyVisualTokenHelper,
  assignChatBubbleTile as assignChatBubbleTileHelper,
  assignStashSelection as assignStashSelectionHelper,
  clearStashSelection as clearStashSelectionHelper,
  commitDraftTilemap as commitDraftTilemapHelper,
  getAtlasPointerCell as getAtlasPointerCellHelper,
  getCanvasCellFromEvent as getCanvasCellFromEventHelper,
  resetChatBubbleFrame as resetChatBubbleFrameHelper,
  resetEditorState as resetEditorStateHelper,
  resizeGridText as resizeGridTextHelper,
  resizeTilemapGrid as resizeTilemapGridHelper,
  setChatBubbleTextColor as setChatBubbleTextColorHelper,
  setHoveredMapCell as setHoveredMapCellHelper,
  setSelectedMapCell as setSelectedMapCellHelper,
  setVisualLayer as setVisualLayerHelper,
} from "./src/features/editor/editorState.js";
import {
  previewSpriteFrame as previewSpriteFrameHelper,
  previewSpriteFrameName as previewSpriteFrameNameHelper,
  renderAgentEditorPanel as renderAgentEditorPanelHelper,
  shouldMirrorPreviewSprite as shouldMirrorPreviewSpriteHelper,
} from "./src/features/editor/agentEditor.js";
import {
  assignRegionSelection as assignRegionSelectionHelper,
  clearRegionSelection as clearRegionSelectionHelper,
  deleteRoomRegion as deleteRoomRegionHelper,
  resolveRoomRegion as resolveRoomRegionHelper,
  setRegionLabelPosition as setRegionLabelPositionHelper,
} from "./src/features/editor/roomMappingEditor.js";
import {
  renderVisualEditor as renderVisualEditorHelper,
  renderVisualSelectionPreview as renderVisualSelectionPreviewHelper,
  renderEditorSubviews as renderEditorSubviewsHelper,
  setActiveEditorSubview as setActiveEditorSubviewHelper,
  syncEditorInputs as syncEditorInputsHelper,
} from "./src/features/editor/visualEditor.js";
import {
  appendVoiceTranscript as appendVoiceTranscriptHelper,
  ensureMicMeter as ensureMicMeterHelper,
  fetchVoiceConfig as fetchVoiceConfigHelper,
  initVoiceControls as initVoiceControlsHelper,
  maybeSpeakReply as maybeSpeakReplyHelper,
  normalizeSpeechText as normalizeSpeechTextHelper,
  pushVoiceEvent as pushVoiceEventHelper,
  refreshVoiceInputDevices as refreshVoiceInputDevicesHelper,
  renderVoiceDebugUi as renderVoiceDebugUiHelper,
  renderVoiceTranscriptDebug as renderVoiceTranscriptDebugHelper,
  speakText as speakTextHelper,
  startMicMeterLoop as startMicMeterLoopHelper,
  startVoiceCapture as startVoiceCaptureHelper,
  stopMicMeter as stopMicMeterHelper,
  stopSpeechPlayback as stopSpeechPlaybackHelper,
  stopVoiceCapture as stopVoiceCaptureHelper,
  transcribeRecordedAudio as transcribeRecordedAudioHelper,
  updateVoiceUi as updateVoiceUiHelper,
} from "./src/features/voice/voiceController.js";
import { initDomEvents, startApp } from "./src/bootstrap/domEvents.js";
import { appState } from "./src/state/appState.js";
let chatBubbleAtlasImagePromise = null;

function setVoiceStatus(text, isError = false) {
  const el = document.getElementById("voice-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "var(--warning)" : "var(--muted)";
}

function setVoiceDebugText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setSettingsResult(text, isError = false) {
  const el = document.getElementById("settings-result");
  if (!el) return;
  el.textContent = text || "";
  el.style.color = isError ? "var(--warning)" : "var(--muted)";
}

function applyRuntimeStatusTone(id, state) {
  const el = document.getElementById(id);
  if (!el) return;
  if (state === "online") el.style.color = "var(--accent)";
  else if (state === "partial") el.style.color = "#f6d673";
  else if (state === "offline") el.style.color = "var(--warning)";
  else el.style.color = "";
}

function renderCodeWithLineNumbers(text) {
  return renderCodeWithLineNumbersHelper(text, { escapeHtml });
}

function renderSettingsChecks() {
  return renderSettingsChecksHelper(appState, {
    documentRef: document,
    escapeHtml,
    renderCodeWithLineNumbers,
    setText,
  });
}

function syncSettingsJsonEditor() {
  return syncSettingsJsonEditorHelper(appState, { documentRef: document });
}

function syncSettingsForm() {
  return syncSettingsFormHelper(appState, { documentRef: document });
}

function renderSettingsSummary() {
  return renderSettingsSummaryHelper(appState, {
    applyRuntimeStatusTone,
    renderSettingsChecks,
    setText,
  });
}

function collectSettingsPayload() {
  return collectSettingsPayloadHelper({ documentRef: document });
}

async function fetchSettingsData() {
  return fetchSettingsDataHelper(appState, {
    fetchDiagnostics: () => getJson("/api/agent-world/settings/diagnostics"),
    fetchSettings: () => getJson("/api/agent-world/settings"),
    renderSettingsSummary,
    setSettingsResult,
    syncSettingsForm,
    syncSettingsJsonEditor,
  });
}

async function saveSettings() {
  return saveSettingsHelper(appState, {
    collectSettingsPayload,
    fetchSettingsData,
    fetchVoiceConfig,
    postSettings: (payload) => postJson("/api/agent-world/settings", payload),
    renderSettingsSummary,
    setSettingsResult,
  });
}

async function saveSettingsFromJsonEditor() {
  return saveSettingsFromJsonEditorHelper(appState, {
    documentRef: document,
    fetchSettingsData,
    fetchVoiceConfig,
    postSettings: (payload) => postJson("/api/agent-world/settings", payload),
    renderSettingsSummary,
    setSettingsResult,
    syncSettingsForm,
    syncSettingsJsonEditor,
  });
}

async function fetchVoiceConfig() {
  return fetchVoiceConfigHelper(appState, {
    getJson,
    pushVoiceEvent,
    updateVoiceUi,
  });
}

function pushVoiceEvent(message) {
  return pushVoiceEventHelper(appState, message, { setVoiceDebugText });
}

function renderVoiceTranscriptDebug() {
  return renderVoiceTranscriptDebugHelper(appState, {
    normalizeSpeechText,
    setVoiceDebugText,
  });
}

function renderVoiceDebugUi() {
  return renderVoiceDebugUiHelper(appState, {
    documentRef: document,
    renderVoiceTranscriptDebug,
    setVoiceDebugText,
  });
}

function updateVoiceUi() {
  return updateVoiceUiHelper(appState, {
    documentRef: document,
    renderVoiceDebugUi,
  });
}

function appendVoiceTranscript(text) {
  return appendVoiceTranscriptHelper(text, { documentRef: document });
}

function normalizeSpeechText(text) {
  return normalizeSpeechTextHelper(text);
}

function stopSpeechPlayback() {
  return stopSpeechPlaybackHelper(appState, {
    URLRef: URL,
    windowRef: window,
  });
}

async function speakText(text, source = "manual") {
  return speakTextHelper(appState, text, source, {
    AudioCtor: Audio,
    fetchRef: fetch,
    normalizeSpeechText,
    pushVoiceEvent,
    renderVoiceDebugUi,
    setVoiceStatus,
    stopSpeechPlayback,
    updateVoiceUi,
    URLRef: URL,
    windowRef: window,
  });
}

async function sendCommandText(text) {
  const result = document.getElementById("command-result");
  const commandText = String(text || "").trim();
  if (!commandText) return false;
  if (!appState.selectedAgentId) {
    result.textContent = "No agent selected.";
    return false;
  }
  const response = await getJson(`/api/agent-world/agents/${encodeURIComponent(appState.selectedAgentId)}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: commandText, mode: "append", source: "ui" }),
  });
  result.textContent = `${response.status === "accepted" ? "Sent" : "Rejected"} at ${formatTime(response.acceptedAt)}: ${response.echoedCommand}${response.reason ? ` (${response.reason})` : ""}`;
  await load();
  return response.status === "accepted";
}

function maybeSpeakReply(history) {
  return maybeSpeakReplyHelper(appState, history, {
    historyRoleClass,
    normalizeSpeechText,
    speakText,
  });
}

function stopMicMeter() {
  return stopMicMeterHelper(appState, {
    cancelAnimationFrameRef: cancelAnimationFrame,
    renderVoiceDebugUi,
  });
}

async function transcribeRecordedAudio(blob) {
  return transcribeRecordedAudioHelper(appState, blob, {
    FormDataCtor: FormData,
    documentRef: document,
    fetchRef: fetch,
    normalizeSpeechText,
    pushVoiceEvent,
    renderVoiceDebugUi,
    sendCommandText,
    setVoiceStatus,
    stopMicMeter,
    updateVoiceUi,
  });
}

async function refreshVoiceInputDevices() {
  return refreshVoiceInputDevicesHelper(appState, {
    navigatorRef: navigator,
    pushVoiceEvent,
    setStoredMap,
    updateVoiceUi,
  });
}

function startMicMeterLoop() {
  return startMicMeterLoopHelper(appState, {
    renderVoiceDebugUi,
    requestAnimationFrameRef: requestAnimationFrame,
    startMicMeterLoop,
  });
}

async function ensureMicMeter() {
  return ensureMicMeterHelper(appState, {
    navigatorRef: navigator,
    pushVoiceEvent,
    refreshVoiceInputDevices,
    setStoredMap,
    setVoiceStatus,
    startMicMeterLoop,
    updateVoiceUi,
    windowRef: window,
  });
}

function stopVoiceCapture() {
  return stopVoiceCaptureHelper(appState, {
    pushVoiceEvent,
    setVoiceStatus,
    stopMicMeter,
    stopSpeechPlayback,
    updateVoiceUi,
  });
}

async function startVoiceCapture() {
  return startVoiceCaptureHelper(appState, {
    MediaRecorderCtor: MediaRecorder,
    ensureMicMeter,
    pushVoiceEvent,
    renderVoiceDebugUi,
    setVoiceStatus,
    stopMicMeter,
    transcribeRecordedAudio,
    updateVoiceUi,
    windowRef: window,
  });
}

function initVoiceControls() {
  return initVoiceControlsHelper(appState, {
    documentRef: document,
    fetchVoiceConfig,
    getStoredMap,
    navigatorRef: navigator,
    pushVoiceEvent,
    refreshVoiceInputDevices,
    renderVoiceDebugUi,
    sendCommandText,
    setVoiceStatus,
    stopMicMeter,
    updateVoiceUi,
    windowRef: window,
  });
}

function populateAgentSelect(agents) {
  const select = document.getElementById("agent-select");
  if (!select) return;
  const options = [`<option value="">Select agent</option>`];
  for (const agent of agents || []) {
    const selected = agent.id === appState.selectedAgentId ? " selected" : "";
    options.push(`<option value="${agent.id}"${selected}>${agent.name || agent.id}</option>`);
  }
  select.innerHTML = options.join("");
}

function populateRegionIdSelect(select) {
  if (!select) return;
  const ids = [
    ...Object.keys(DEFAULT_ANCHOR_TILES),
    ...appState.roomRegions.map((region) => region.id),
  ].filter((value, index, list) => value && list.indexOf(value) === index);
  select.innerHTML = [`<option value="">Select room</option>`, ...ids.map((id) => `<option value="${id}">${id}</option>`)].join("");
  select.value = appState.editor.regionId || "";
}

function normalizeChatBubbleFrame(rawFrame) {
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

function normalizeChatBubbleTheme(rawTheme, role) {
  return {
    frame: normalizeChatBubbleFrame(rawTheme?.frame || rawTheme),
    textColor: /^#[0-9a-f]{6}$/i.test(String(rawTheme?.textColor || "").trim())
      ? String(rawTheme.textColor).trim()
      : DEFAULT_CHAT_TEXT_COLORS[role] || "#fff4d7",
  };
}

function normalizeChatBubbleThemes(rawValue) {
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

function selectedChatBubbleTheme() {
  return appState.chatBubbleThemes[appState.editor.selectedChatBubbleRole] || appState.chatBubbleThemes.assistant;
}

function chatBubbleTokenToBackgroundPosition(token) {
  const match = String(token || "").match(/^(\d+):(\d+)$/);
  if (!match) return "0px 0px";
  const x = Number(match[1]);
  const y = Number(match[2]);
  return `${-(x - 1) * TILE_SIZE}px ${-(y - 1) * TILE_SIZE}px`;
}

function chatBubbleAtlasPathForLayer(layer) {
  return layer === "floor"
    ? (appState.renderer?.assets?.layout?.floorAtlasPath || DEFAULT_FLOOR_ATLAS_PATH)
    : (appState.renderer?.assets?.layout?.wallAtlasPath || DEFAULT_WALL_ATLAS_PATH);
}

function applyChatBubbleFrameStyles() {
  const root = document.documentElement;
  if (!root) return;
  for (const role of ["assistant", "tool", "user"]) {
    const theme = appState.chatBubbleThemes[role];
    root.style.setProperty(`--chat-${role}-text-color`, theme?.textColor || DEFAULT_CHAT_TEXT_COLORS[role]);
    for (const slot of Object.keys(DEFAULT_CHAT_BUBBLE_FRAME)) {
      root.style.setProperty(`--chat-${role}-${slot}`, chatBubbleTokenToBackgroundPosition(theme?.frame?.[slot]?.token));
    }
  }
  void applyChatBubbleFrameImages();
}

function loadChatBubbleAtlasImage(atlasPath) {
  const key = atlasPath || DEFAULT_WALL_ATLAS_PATH;
  if (!chatBubbleAtlasImagePromise) chatBubbleAtlasImagePromise = new Map();
  if (chatBubbleAtlasImagePromise.has(key)) return chatBubbleAtlasImagePromise.get(key);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load wall atlas for chat bubbles."));
    image.src = key;
  });
  chatBubbleAtlasImagePromise.set(key, promise);
  return promise;
}

function buildChatBubbleTileDataUrl(image, token) {
  const match = String(token || "").match(/^(\d+):(\d+)$/);
  if (!match) return "";
  const x = Number(match[1]);
  const y = Number(match[2]);
  const canvas = document.createElement("canvas");
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

async function applyChatBubbleFrameImages() {
  const root = document.documentElement;
  if (!root) return;
  try {
    for (const role of ["assistant", "tool", "user"]) {
      const theme = appState.chatBubbleThemes[role];
      for (const slot of Object.keys(DEFAULT_CHAT_BUBBLE_FRAME)) {
        const slotDef = theme?.frame?.[slot];
        const atlasPath = chatBubbleAtlasPathForLayer(slotDef?.layer);
        const atlasImage = await loadChatBubbleAtlasImage(atlasPath);
        const dataUrl = buildChatBubbleTileDataUrl(atlasImage, slotDef?.token);
        root.style.setProperty(`--chat-${role}-${slot}-image`, dataUrl ? `url("${dataUrl}")` : "none");
      }
    }
  } catch (error) {
    console.warn(error);
  }
}

function chatBubbleMarkup(role, metaLabel, eventType, time, bodyHtml) {
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

function chatBubbleSlotOverlayMarkup(role) {
  return `
    <div class="chat-bubble-slot-overlay" data-role="${escapeHtml(role)}">
      ${["tl", "tm", "tr", "ml", "mm", "mr", "bl", "bm", "br"].map((slot) => `
        <button
          class="chat-bubble-slot-hotspot ${slot}${appState.editor.selectedChatBubbleRole === role && appState.editor.selectedChatBubbleSlot === slot ? " active" : ""}"
          type="button"
          data-role="${escapeHtml(role)}"
          data-slot="${slot}"
          aria-label="${escapeHtml(role)} ${escapeHtml(slot)}"
          title="${escapeHtml(role)} ${escapeHtml(slot)}"
        ></button>
      `).join("")}
    </div>
  `;
}

function applyChatRoleTheme(element, role) {
  if (!element) return;
  for (const slot of Object.keys(DEFAULT_CHAT_BUBBLE_FRAME)) {
    element.style.setProperty(`--chat-role-${slot}-image`, `var(--chat-${role}-${slot}-image)`);
  }
  element.style.setProperty("--chat-role-text-color", `var(--chat-${role}-text-color)`);
}

function statusClass(runtimeStatus) {
  if (runtimeStatus === "blocked") return "blocked";
  if (runtimeStatus === "waiting_user") return "waiting";
  if (runtimeStatus === "offline") return "offline";
  return "active";
}

function hashString(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function bubblePaletteForAgent(agent) {
  if (agent?.id === "lucca-main") return { fill: 0x111111, stroke: 0xf6e8bf, text: 0xf6ebc7 };
  const seed = `${agent?.id || "agent"}:${agent?.name || ""}`;
  return AGENT_BUBBLE_PALETTES[hashString(seed) % AGENT_BUBBLE_PALETTES.length];
}

function isMainAgent(agent) {
  return agent?.id === "lucca-main";
}

function parseTimestampMs(value) {
  if (!value || typeof value !== "string") return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function isInactiveAgent(agent, nowMs = Date.now()) {
  if (!agent || isMainAgent(agent)) return false;
  if (agent.runtimeStatus === "active" || agent.runtimeStatus === "blocked" || agent.runtimeStatus === "waiting_user") {
    return false;
  }
  const updatedMs = parseTimestampMs(agent.lastUpdatedAt);
  return updatedMs > 0 && (nowMs - updatedMs) >= AGENT_INACTIVE_HIDE_MS;
}

function shouldShowAgentSprite(agent) {
  if (!agent) return true;
  return !isInactiveAgent(agent);
}

function nextAmbientRandom(state) {
  const current = Number.isFinite(state?.ambientSeed) ? state.ambientSeed >>> 0 : 1;
  const next = ((current * 1664525) + 1013904223) >>> 0;
  if (state) state.ambientSeed = next;
  return next / 0x100000000;
}

function setMessageSelection(kind, title, body, path = null, locked = true) {
  return setMessageSelectionHelper(appState, kind, title, body, path, locked);
}

function fileUrl(path) {
  return fileUrlHelper(path);
}

function cleanPath(text) {
  return cleanPathHelper(text);
}

function extractPaths(...parts) {
  return extractPathsHelper(...parts);
}

function classifyPath(path) {
  return classifyPathHelper(path);
}

function createText(text, style) {
  return new PIXI.Text(text, style);
}

function stripControlTags(text) {
  return stripControlTagsHelper(text);
}

function displayActionText(text) {
  return displayActionTextHelper(text, { stripControlTags });
}

function formatInlineRichText(text) {
  return formatInlineRichTextHelper(text, { escapeHtml });
}

function formatRichTextHtml(text) {
  return formatRichTextHtmlHelper(text, {
    escapeHtml,
    formatInlineRichText,
    stripControlTags,
  });
}

function renderRichText(target, text) {
  return renderRichTextHelper(target, text, { formatRichTextHtml });
}

function roomLabelForAnchor(anchorId) {
  const region = regionForAnchor(anchorId);
  if (region?.label) return region.label;
  const anchor = getAnchorTile(anchorId);
  return anchor?.label || String(anchorId || "room");
}

function activityCue(agent, sprite, moving) {
  if (moving) return "🚶";
  if (agent.visualState === "messaging") return "✉️";
  if (agent.visualState === "reading") return "📚";
  if (agent.visualState === "working" || agent.visualState === "writing") return "🛠️";
  if (agent.visualState === "blocked") return "⚠️";
  if (isIdleLikeAgent(agent)) return "😴";
  return "💭";
}

function displayedLocationLabel(agent) {
  const renderedRoomId = roomIdForAgent(agent);
  const renderedRoom = roomLabelForAnchor(renderedRoomId);
  const backendRoomId = agent.currentAnchor || agent.targetAnchor || renderedRoomId;
  const backendRoom = roomLabelForAnchor(backendRoomId);
  if (renderedRoomId !== backendRoomId) {
    return `${renderedRoom} (rendered)`;
  }
  return backendRoom;
}

function normalizePersistenceSnapshot(rawValue = {}, layout = {}) {
  return normalizePersistenceSnapshotHelper(rawValue, layout, {
    normalizeRoomRegions,
    normalizeStashPoint,
    normalizeChatBubbleThemes,
  });
}

function defaultLayoutConfig(layout = {}) {
  return defaultLayoutConfigHelper(layout);
}

function structuredSnapshotFromGameState(rawGameState = {}, fallbackLayout = {}) {
  return structuredSnapshotFromGameStateHelper(rawGameState, fallbackLayout, {
    normalizeRoomRegions,
    normalizeStashPoint,
    normalizeChatBubbleThemes,
  });
}

function peekParsedValue(rawValue, fallback) {
  return peekParsedValueHelper(rawValue, fallback);
}

function parseImportedAgentWorldStorageState(rawValue) {
  return parseImportedAgentWorldStorageStateHelper(rawValue);
}

function applyImportedAgentWorldStorageState(payload) {
  return applyImportedAgentWorldStorageStateHelper(payload);
}

function currentLayoutConfigPayload() {
  return currentLayoutConfigPayloadHelper(appState, {
    getWorldCols,
    getWorldRows,
  });
}

function buildCurrentGameStatePayload() {
  return buildCurrentGameStatePayloadHelper(appState, {
    currentLayoutConfigPayload,
    normalizeStashPoint,
    peekStoredMap,
  });
}

function syncGameStateTextarea() {
  return syncGameStateTextareaHelper(appState, { buildCurrentGameStatePayload });
}

function writeGameStateToLocalStorage(payload, syncTextarea = true) {
  if (!syncTextarea) {
    for (const key of GAME_STATE_STORAGE_KEYS) {
      if (!(key in payload)) continue;
      localStorage.setItem(key, String(payload[key]));
    }
    appState.gameStateRaw = { ...payload };
    return;
  }
  return writeGameStateToLocalStorageHelper(appState, payload, { syncGameStateTextarea });
}

function getAnchorTile(anchorId) {
  return appState.tilemap?.layout?.anchors?.[anchorId] || DEFAULT_ANCHOR_TILES[anchorId] || DEFAULT_ANCHOR_TILES.lounge;
}

function canonicalizeAnchorId(rawId) {
  const cleaned = String(rawId || "").trim();
  if (!cleaned) return "";
  const compact = cleaned.toLowerCase().replace(/[^a-z]/g, "");
  return CANONICAL_ANCHOR_ALIASES[compact] || cleaned;
}

function normalizeRegionCells(cells) {
  const maxRows = appState.renderer?.assets?.layout?.rows || appState.tilemap?.layout?.rows || DEFAULT_WORLD_ROWS;
  const maxCols = appState.renderer?.assets?.layout?.cols || appState.tilemap?.layout?.cols || DEFAULT_WORLD_COLS;
  const rawCells = cells
    .filter((cell) => Number.isInteger(cell?.row) && Number.isInteger(cell?.col))
    .map((cell) => ({ row: cell.row, col: cell.col }));
  const needsOneBasedShift = rawCells.some((cell) => cell.row >= maxRows || cell.col >= maxCols)
    && rawCells.every((cell) => cell.row > 0 && cell.col > 0);
  const adjusted = needsOneBasedShift
    ? rawCells.map((cell) => ({ row: cell.row - 1, col: cell.col - 1 }))
    : rawCells;
  return adjusted.filter((cell) => cell.row >= 0 && cell.col >= 0 && cell.row < maxRows && cell.col < maxCols);
}

function normalizeRoomRegions(rawRegions) {
  if (!Array.isArray(rawRegions)) return [];
  return rawRegions
    .filter((region) => region && Array.isArray(region.cells) && region.id)
    .map((region) => ({
      id: canonicalizeAnchorId(region.id),
      label: String(region.label || region.id).trim() || String(region.id),
      kind: region.kind === "door" ? "door" : "room",
      cells: normalizeRegionCells(region.cells),
      labelCell: normalizeRegionCells(region.labelCell ? [region.labelCell] : [])[0] || null,
    }))
    .filter((region) => region.cells.length);
}

function normalizeStashPoint(rawStash) {
  const maxRows = appState.renderer?.assets?.layout?.rows || appState.tilemap?.layout?.rows || DEFAULT_WORLD_ROWS;
  const maxCols = appState.renderer?.assets?.layout?.cols || appState.tilemap?.layout?.cols || DEFAULT_WORLD_COLS;
  const row = Number.isInteger(rawStash?.row) ? rawStash.row : 14;
  const col = Number.isInteger(rawStash?.col) ? rawStash.col : 15;
  return {
    row: Math.max(0, Math.min(maxRows - 1, row)),
    col: Math.max(0, Math.min(maxCols - 1, col)),
  };
}

function cellsKeySet(cells) {
  return new Set(cells.map((cell) => `${cell.row}:${cell.col}`));
}

function regionForCell(row, col) {
  const key = `${row}:${col}`;
  return appState.roomRegions.find((region) => region.cells.some((cell) => `${cell.row}:${cell.col}` === key)) || null;
}

function regionForAnchor(anchorId) {
  const canonical = canonicalizeAnchorId(anchorId);
  return appState.roomRegions.find((region) => canonicalizeAnchorId(region.id) === canonical) || null;
}

function furnitureTokenAt(row, col) {
  return appState.tilemap?.furnitureGrid?.[row]?.[col] || ".";
}

function propTokenAt(row, col) {
  return appState.tilemap?.propGrid?.[row]?.[col] || ".";
}

function regionCenter(region) {
  if (!region?.cells?.length) return null;
  return {
    row: region.cells.reduce((sum, cell) => sum + cell.row, 0) / region.cells.length,
    col: region.cells.reduce((sum, cell) => sum + cell.col, 0) / region.cells.length,
  };
}

function isIdleLikeAgent(agent) {
  return agent?.visualState === "idle" || agent?.visualState === "waiting";
}

function roomIdForAgent(agent) {
  return roomIdForAgentHelper(agent, {
    isIdleLikeAgent,
  });
}

function roomGoalTile(anchorId, startTile = null) {
  return roomGoalTileHelper(anchorId, startTile, {
    findPath,
    furnitureTokenAt,
    getAnchorTile,
    isWalkable,
    nearestWalkableTile,
    regionCenter,
    regionForAnchor,
  });
}

function roomWaypointTiles(anchorId, startTile = null) {
  return roomWaypointTilesHelper(anchorId, startTile, {
    findPath,
    furnitureTokenAt,
    inBounds,
    isWalkable,
    propTokenAt,
    regionCenter,
    regionForAnchor,
  });
}

function deriveAnchorsFromRegions(layout, roomRegions) {
  const anchors = {};
  for (const [anchorId, fallback] of Object.entries(DEFAULT_ANCHOR_TILES)) {
    const existing = layout.anchors?.[anchorId];
    anchors[anchorId] = {
      col: existing?.col ?? fallback.col,
      row: existing?.row ?? fallback.row,
      label: existing?.label ?? fallback.label,
    };
  }
  for (const region of roomRegions) {
    if (region.kind !== "room" || !region.cells.length) continue;
    const avgRow = region.cells.reduce((sum, cell) => sum + cell.row, 0) / region.cells.length;
    const avgCol = region.cells.reduce((sum, cell) => sum + cell.col, 0) / region.cells.length;
    const nearest = region.cells.reduce((best, cell) => {
      const score = Math.abs(cell.row - avgRow) + Math.abs(cell.col - avgCol);
      return !best || score < best.score ? { ...cell, score } : best;
    }, null);
    anchors[region.id] = {
      col: nearest?.col ?? anchors[region.id]?.col ?? 0,
      row: nearest?.row ?? anchors[region.id]?.row ?? 0,
      label: region.label || anchors[region.id]?.label || region.id.toUpperCase(),
    };
  }
  return anchors;
}

function getWorldCols() {
  return appState.tilemap?.layout?.cols || appState.renderer?.assets?.layout?.cols || DEFAULT_WORLD_COLS;
}

function getWorldRows() {
  return appState.tilemap?.layout?.rows || appState.renderer?.assets?.layout?.rows || DEFAULT_WORLD_ROWS;
}

function getWorldWidth() {
  return getWorldCols() * TILE_SIZE;
}

function getWorldHeight() {
  return getWorldRows() * TILE_SIZE;
}

function getSceneTopPadding() {
  return appState.activeTab === "world" ? WORLD_TOP_PADDING : 0;
}

function getRenderHeight() {
  return getWorldHeight() + getSceneTopPadding();
}

function anchorPoint(agent) {
  return anchorPointHelper(agent, {
    getAnchorTile,
  });
}

function isBenchmarkAgent(agent) {
  const id = String(agent?.id || "").toLowerCase();
  const name = String(agent?.name || "").toLowerCase();
  return id.startsWith("bench-") || name.startsWith("bench-");
}

function benchmarkPoint(agent, benchIndex = 0) {
  const anchor = agent.targetAnchor || agent.currentAnchor || "terminal";
  const base = getAnchorTile(anchor);
  const cols = [-1.4, 0, 1.4, -1.4, 0, 1.4];
  const rows = [0.5, 0.5, 0.5, 1.7, 1.7, 1.7];
  const offsetIndex = benchIndex % cols.length;
  return tilePoint(
    Math.max(0, Math.min(getWorldRows() - 1, Math.round(base.row + rows[offsetIndex]))),
    Math.max(0, Math.min(getWorldCols() - 1, Math.round(base.col + cols[offsetIndex]))),
  );
}

function tilePoint(row, col) {
  return tilePointHelper(row, col);
}

function tileFromWorldPoint(x, y) {
  return tileFromWorldPointHelper(x, y, {
    getWorldCols,
    getWorldRows,
    nearestWalkableTile,
  });
}

function inBounds(row, col) {
  return inBoundsHelper(appState, row, col, {
    getWorldCols: () => getWorldCols(),
    getWorldRows: () => getWorldRows(),
  });
}

function isWalkable(row, col) {
  return isWalkableHelper(appState, row, col);
}

function nearestWalkableTile(row, col) {
  return nearestWalkableTileHelper(appState, row, col, {
    inBounds,
    isWalkable,
  });
}

function goalTileForAgent(agent, startTile = null) {
  return goalTileForAgentHelper(agent, startTile, {
    roomGoalTile,
  });
}

function currentTileForAgent(agent) {
  return currentTileForAgentHelper(agent, {
    getAnchorTile,
    nearestWalkableTile,
  });
}

function findPath(startTile, goalTile) {
  return findPathHelper(startTile, goalTile, {
    inBounds,
    isWalkable,
  });
}

function getDraftFloorLines() {
  return parseMapText(appState.editor.draftFloorText).map(parseFloorRow);
}

function getDraftObjectLines(layerName) {
  const key = layerName === "wall"
    ? "draftWallText"
    : layerName === "furniture"
      ? "draftFurnitureText"
      : "draftPropText";
  return parseMapText(appState.editor[key]).map(parseObjectRow);
}

function updateDraftCell(layerName, row, col, value) {
  if (layerName === "floor") {
    const lines = getDraftFloorLines();
    lines[row][col] = value;
    appState.editor.draftFloorText = serializeFloorLines(lines);
    return;
  }
  const rows = getDraftObjectLines(layerName);
  rows[row][col] = value;
  const nextText = serializeObjectLines(rows);
  if (layerName === "wall") appState.editor.draftWallText = nextText;
  else if (layerName === "furniture") appState.editor.draftFurnitureText = nextText;
  else appState.editor.draftPropText = nextText;
}

function getDraftCellValue(layerName, row, col) {
  if (row == null || col == null) return "--";
  if (layerName === "floor") {
    const lines = getDraftFloorLines();
    return lines[row]?.[col] ?? "--";
  }
  const rows = getDraftObjectLines(layerName);
  return rows[row]?.[col] ?? "--";
}

function getSelectionBounds() {
  const anchor = appState.editor.selectionAnchor || appState.editor.selectedCell;
  const focus = appState.editor.selectionFocus || appState.editor.selectedCell;
  if (!anchor || !focus) return null;
  return {
    rowStart: Math.min(anchor.row, focus.row),
    rowEnd: Math.max(anchor.row, focus.row),
    colStart: Math.min(anchor.col, focus.col),
    colEnd: Math.max(anchor.col, focus.col),
  };
}

function getSelectedCells() {
  const bounds = getSelectionBounds();
  if (!bounds) return [];
  const cells = [];
  for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
    for (let col = bounds.colStart; col <= bounds.colEnd; col += 1) {
      cells.push({ row, col });
    }
  }
  return cells;
}

function getVisualLayerConfig() {
  return VISUAL_LAYER_CONFIG[appState.editor.selectedLayer] || VISUAL_LAYER_CONFIG.floor;
}

function getAtlasPathForLayer(layerName) {
  const layout = appState.renderer?.assets?.layout || {};
  if (VISUAL_LAYER_CONFIG[layerName]?.atlasKind === "floor") {
    return layout.floorAtlasPath || DEFAULT_FLOOR_ATLAS_PATH;
  }
  return VISUAL_LAYER_CONFIG[layerName]?.atlasKind === "wall"
    ? (layout.wallAtlasPath || DEFAULT_WALL_ATLAS_PATH)
    : (layout.officeAtlasPath || DEFAULT_OFFICE_ATLAS_PATH);
}

function getAssignedAtlasCell(layerName, rawValue) {
  if (!rawValue || rawValue === "--" || rawValue === ".") return null;
  if (layerName === "floor") {
    const floorToken = parseFloorToken(rawValue);
    if (floorToken.kind === "atlas") return { x: floorToken.x, y: floorToken.y };
    if (floorToken.kind === "code") {
      const entry = appState.tilemap?.manifest?.[floorToken.code];
      if (entry?.grid) return { x: entry.grid[0] + 1, y: entry.grid[1] + 1 };
    }
    return null;
  }
  const token = parseObjectToken(rawValue);
  if (token.kind === "atlas") return { x: token.x, y: token.y };
  return null;
}

function getAssignedPreviewToken(layerName, rawValue) {
  if (!rawValue || rawValue === "--") return null;
  if (layerName === "floor") return parseFloorToken(rawValue);
  return parseObjectToken(rawValue);
}

function getFloorTexture(renderer, floorToken) {
  if (floorToken.kind === "empty") return null;
  if (floorToken.kind === "code") return renderer.assets.tileTextures[floorToken.code] || null;
  const cache = renderer.assets.floorAtlasTextures;
  const key = `${floorToken.x}:${floorToken.y}`;
  if (!cache[key]) {
    const tileSize = renderer.assets.layout.atlasTileSize || TILE_SIZE;
    cache[key] = new PIXI.Texture(
      renderer.assets.floorAtlasBaseTexture,
      new PIXI.Rectangle((floorToken.x - 1) * tileSize, (floorToken.y - 1) * tileSize, tileSize, tileSize),
    );
  }
  return cache[key];
}

function buildTilemapState(floorText, wallText, furnitureText, propText, manifest, layout, roomRegions = []) {
  const floorLines = parseMapText(floorText).map(parseFloorRow);
  const wallLines = parseMapText(wallText).map(parseObjectRow);
  const furnitureLines = parseMapText(furnitureText).map(parseObjectRow);
  const propLines = parseMapText(propText).map(parseObjectRow);
  const resolvedShape = resolveGridShape(layout, floorLines, wallLines, furnitureLines, propLines);
  const cols = resolvedShape.cols;
  const rows = resolvedShape.rows;
  validateObjectGrid(floorLines, cols, rows);
  validateObjectGrid(wallLines, cols, rows);
  validateObjectGrid(furnitureLines, cols, rows);
  validateObjectGrid(propLines, cols, rows);

  const walkableGrid = [];
  let walkableTiles = 0;
  let solidTiles = 0;
  let doorTiles = 0;
  for (let row = 0; row < rows; row += 1) {
    const walkRow = [];
    for (let col = 0; col < cols; col += 1) {
      const floorToken = parseFloorToken(floorLines[row][col]);
      const wallToken = parseObjectToken(wallLines[row][col]);
      const furnitureToken = parseObjectToken(furnitureLines[row][col]);
      const propToken = parseObjectToken(propLines[row][col]);
      if (floorToken.kind === "code" && (!manifest[floorToken.code] || manifest[floorToken.code].kind !== "floor")) {
        throw new Error(`Unknown floor code "${floorToken.code}" at ${row + 1}:${col + 1}`);
      }
      const passable = floorToken.passable && wallToken.passable;
      walkRow.push(passable);
      if (passable) walkableTiles += 1;
      else solidTiles += 1;
      if (wallToken.door) doorTiles += 1;
    }
    walkableGrid.push(walkRow);
  }

  const normalizedRegions = normalizeRoomRegions(roomRegions);
  const nextLayout = {
    ...layout,
    cols,
    rows,
    stash: normalizeStashPoint(layout.stash),
    roomRegions: normalizedRegions,
  };
  nextLayout.anchors = deriveAnchorsFromRegions(nextLayout, normalizedRegions);

  return {
    manifest,
    layout: nextLayout,
    floorText: normalizeMapText(floorText),
    wallText: normalizeMapText(wallText),
    furnitureText: normalizeMapText(furnitureText),
    propText: normalizeMapText(propText),
    floorGrid: floorLines,
    wallGrid: wallLines,
    furnitureGrid: furnitureLines,
    propGrid: propLines,
    walkableGrid,
    walkableTiles,
    solidTiles,
    doorTiles,
  };
}

function createAnchorLabel(text, x, y) {
  const label = new PIXI.Container();
  const bg = new PIXI.Graphics();
  const txt = createText(text, {
    fontFamily: "Courier New",
    fontSize: 12,
    fontWeight: "bold",
    fill: 0xf7ecc5,
    letterSpacing: 1,
  });
  bg.beginFill(0x1b2438, 0.9);
  bg.lineStyle(2, 0xe9d59b, 1);
  bg.drawRoundedRect(0, 0, txt.width + 14, txt.height + 8, 4);
  bg.endFill();
  txt.x = 7;
  txt.y = 3;
  label.addChild(bg, txt);
  label.x = x;
  label.y = y;
  return label;
}

function createRegionLabel(region) {
  const anchorCell = region.labelCell || regionCenter(region);
  if (!anchorCell) return null;
  const text = String(region.label || region.id || "").trim();
  if (!text) return null;
  const x = Math.round(anchorCell.col * TILE_SIZE + TILE_SIZE / 2);
  const y = Math.max(4, Math.round(anchorCell.row * TILE_SIZE) - 18);
  const label = createAnchorLabel(text, x, y);
  label.pivot.x = label.width / 2;
  return label;
}

function spriteFramesForAgent(renderer, agent) {
  return spriteFramesForAgentHelper(renderer, agent);
}

function getAnimationFrames(renderer, agent, visualState) {
  return getAnimationFramesHelper(renderer, agent, visualState, {
    spriteFramesForAgent,
  });
}

function collectFrameSequence(frames, prefix) {
  return collectFrameSequenceHelper(frames, prefix);
}

function directionalIdleFrames(renderer, agent, facing) {
  return directionalIdleFramesHelper(renderer, agent, facing, {
    getAnimationFrames,
    spriteFramesForAgent,
  });
}

function directionalWalkFrames(renderer, agent, facing) {
  return directionalWalkFramesHelper(renderer, agent, facing, {
    collectFrameSequence,
    spriteFramesForAgent,
  });
}

function shouldMirrorSpriteForFacing(renderer, agent, facing) {
  return shouldMirrorSpriteForFacingHelper(renderer, agent, facing, {
    spriteFramesForAgent,
  });
}

async function loadArtAssets() {
  return loadArtAssetsHelper({
    PIXIRef: PIXI,
    applyChatBubbleFrameStyles,
    defaultLayoutConfig,
    getJson,
    setChatBubbleThemes: (themes) => {
      appState.chatBubbleThemes = themes;
    },
    structuredSnapshotFromGameState,
    writeGameStateToLocalStorage,
  });
}

function setTilemapStatus(text, isError = false) {
  const el = document.getElementById("tilemap-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "var(--warning)" : "";
}

function syncWorldDetailVisibility() {
  const open = appState.activeTab === "world" && Boolean(appState.selectedAgentId);
  document.body.classList.toggle("world-detail-open", open);
}

function mountRendererView() {
  if (!appState.renderer?.pixiApp?.view) return;
  const targetId = appState.activeTab === "editor"
    ? (appState.editor.activeSubview === "room-mapping" ? "editor-room-world-canvas" : "editor-world-canvas")
    : "world-canvas";
  const host = document.getElementById(targetId);
  if (!host) return;
  if (appState.renderer.pixiApp.view.parentElement !== host) {
    host.appendChild(appState.renderer.pixiApp.view);
  }
  syncRendererCanvasSize();
}

function syncSceneOffset() {
  if (!appState.renderer) return;
  const offsetY = getSceneTopPadding();
  for (const layerName of ["floorLayer", "wallLayer", "depthLayer", "overlayLayer", "interactionLayer", "labelLayer", "agentLabelLayer", "bubbleLayer"]) {
    if (appState.renderer[layerName]) appState.renderer[layerName].y = offsetY;
  }
  if (appState.renderer.backgroundLayer) appState.renderer.backgroundLayer.y = 0;
}

function resizeRendererViewport() {
  if (!appState.renderer?.pixiApp?.renderer) return;
  appState.renderer.pixiApp.renderer.resize(getWorldWidth(), getRenderHeight());
  syncSceneOffset();
  syncRendererCanvasSize();
}

function syncRendererCanvasSize() {
  const view = appState.renderer?.pixiApp?.view;
  if (!view) return;
  if (appState.activeTab === "editor" && !["tilemap", "room-mapping"].includes(appState.editor.activeSubview || "tilemap")) {
    view.style.width = `${Math.round(getWorldWidth() * appState.editor.zoom)}px`;
    view.style.height = `${Math.round(getRenderHeight() * appState.editor.zoom)}px`;
    return;
  }
  view.style.width = "100%";
  view.style.height = "auto";
}

function buildPrimitiveTexture(pixiApp, primitiveName) {
  return buildPrimitiveTextureHelper(pixiApp, primitiveName, {
    PIXIRef: PIXI,
  });
}

async function buildTileTextures(pixiApp, manifest) {
  return buildTileTexturesHelper(pixiApp, manifest, {
    PIXIRef: PIXI,
    buildPrimitiveTexture,
  });
}

function getLayerTexture(renderer, objectToken, layerName) {
  return getLayerTextureHelper(renderer, objectToken, layerName, {
    PIXIRef: PIXI,
  });
}

function setActiveTab(tabName) {
  if (tabName === "editor") appState.activeTab = "editor";
  else if (tabName === "settings") appState.activeTab = "settings";
  else appState.activeTab = "world";
  for (const button of document.querySelectorAll(".tab-btn")) {
    button.classList.toggle("active", button.dataset.tab === appState.activeTab);
  }
  for (const panel of document.querySelectorAll(".tab-panel")) {
    panel.classList.toggle("active", panel.dataset.panel === appState.activeTab);
  }
  if (appState.activeTab !== "settings") {
    mountRendererView();
    resizeRendererViewport();
  }
  syncWorldDetailVisibility();
  if (appState.activeTab !== "settings") {
    if (appState.renderer) drawRoom(appState.renderer);
    if (appState.world) renderWorld(appState.world);
    renderEditorSubviews();
    renderVisualEditor();
  } else {
    renderSettingsSummary();
  }
}

function setActiveEditorSubview(viewName) {
  return setActiveEditorSubviewHelper(appState, viewName, {
    drawRoom,
    mountRendererView,
    renderEditorSubviews,
    renderVisualEditor,
    resizeRendererViewport,
  });
}

function renderEditorSubviews() {
  return renderEditorSubviewsHelper(appState, {
    documentRef: document,
    setText,
  });
}

function syncEditorInputs() {
  return syncEditorInputsHelper(appState, {
    documentRef: document,
    getWorldCols,
    getWorldRows,
    renderVisualEditor,
    setText,
    syncGameStateTextarea,
  });
}

function applyStructuredGameState(snapshot, successMessage = "Loaded game state.") {
  if (!snapshot || !appState.renderer?.assets?.tileManifest) return;
  const normalized = normalizePersistenceSnapshot(snapshot, snapshot.layout || appState.renderer.assets.layout || {});
  const nextLayout = {
    ...defaultLayoutConfig(appState.renderer.assets.layout || {}),
    ...(snapshot.layout || {}),
    stash: normalized.stash,
    roomRegions: normalized.roomRegions,
  };
  const nextTilemap = buildTilemapState(
    normalized.floorText,
    normalized.wallText,
    normalized.furnitureText,
    normalized.propText,
    appState.renderer.assets.tileManifest,
    nextLayout,
    normalized.roomRegions,
  );
  appState.tilemap = nextTilemap;
  appState.roomRegions = nextTilemap.layout.roomRegions || [];
  appState.chatBubbleThemes = normalized.chatBubbleThemes;
  appState.renderer.assets.layout = nextTilemap.layout;
  appState.editor.baseFloorText = nextTilemap.floorText;
  appState.editor.baseWallText = nextTilemap.wallText;
  appState.editor.baseFurnitureText = nextTilemap.furnitureText;
  appState.editor.basePropText = nextTilemap.propText;
  appState.editor.baseCols = nextTilemap.layout.cols || DEFAULT_WORLD_COLS;
  appState.editor.baseRows = nextTilemap.layout.rows || DEFAULT_WORLD_ROWS;
  appState.editor.draftFloorText = nextTilemap.floorText;
  appState.editor.draftWallText = nextTilemap.wallText;
  appState.editor.draftFurnitureText = nextTilemap.furnitureText;
  appState.editor.draftPropText = nextTilemap.propText;
  appState.gameStateRaw = snapshot.raw || buildCurrentGameStatePayload();
  applyChatBubbleFrameStyles();
  resizeRendererViewport();
  drawRoom(appState.renderer);
  if (appState.world) renderWorld(appState.world);
  syncEditorInputs();
  setTilemapStatus(successMessage);
}

function renderVisualSelectionPreview() {
  return renderVisualSelectionPreviewHelper(appState, {
    documentRef: document,
    getAssignedAtlasCell,
    getAssignedPreviewToken,
    getDraftCellValue,
    getVisualLayerConfig,
    selectedChatBubbleTheme,
  });
}

function renderVisualEditor() {
  return renderVisualEditorHelper(appState, {
    applyChatRoleTheme,
    chatBubbleMarkup,
    chatBubbleSlotOverlayMarkup,
    deleteRoomRegion,
    documentRef: document,
    drawRoom,
    formatRichTextHtml,
    getAtlasPathForLayer,
    getDraftCellValue,
    getSelectedCells,
    getVisualLayerConfig,
    getWorldCols,
    getWorldRows,
    normalizeStashPoint,
    populateRegionIdSelect,
    renderAgentEditorPanel,
    renderVisualSelectionPreview,
    selectedChatBubbleTheme,
    syncRendererCanvasSize,
  });
}

function renderAgentEditorPanel() {
  return renderAgentEditorPanelHelper(appState, {
    documentRef: document,
    escapeHtml,
    previewSpriteFrame,
    setText,
    shouldShowAgentSprite,
  });
}

function previewSpriteFrame(agent) {
  return previewSpriteFrameHelper(appState, agent, {
    previewSpriteFrameName,
    shouldMirrorPreviewSprite,
  });
}

function previewSpriteFrameName(agent, frames) {
  return previewSpriteFrameNameHelper(agent, frames);
}

function shouldMirrorPreviewSprite(agent, frames) {
  return shouldMirrorPreviewSpriteHelper(agent, frames);
}

function renderEditorSelectionOverlay(renderer) {
  const { interactionLayer } = renderer;
  interactionLayer.removeChildren();
  if (appState.activeTab !== "editor") return;

  const roomColors = {
    room: 0x5fb3ff,
    door: 0xffc76b,
  };
  for (const region of appState.roomRegions) {
    const isHoveredRegion = appState.editor.hoveredRegionId && region.id === appState.editor.hoveredRegionId;
    for (const cell of region.cells) {
      const box = new PIXI.Graphics();
      const color = isHoveredRegion ? 0xfff18b : (roomColors[region.kind] || 0x5fb3ff);
      const alpha = isHoveredRegion ? 0.22 : 0.08;
      box.lineStyle(isHoveredRegion ? 2 : 1, color, isHoveredRegion ? 0.95 : 0.55);
      box.beginFill(color, alpha);
      box.drawRect(cell.col * TILE_SIZE, cell.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      box.endFill();
      interactionLayer.addChild(box);
    }
  }

  const drawBox = (cell, color, alpha) => {
    if (!cell) return;
    const box = new PIXI.Graphics();
    box.lineStyle(2, color, 0.95);
    box.beginFill(color, alpha);
    box.drawRect(cell.col * TILE_SIZE, cell.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    box.endFill();
    interactionLayer.addChild(box);
  };

  drawBox(appState.editor.hoveredCell, 0xe4c97a, 0.12);
  for (const cell of getSelectedCells()) {
    drawBox(cell, 0x83d7bf, 0.18);
  }
}

function assignRegionSelection() {
  return assignRegionSelectionHelper(appState, {
    canonicalizeAnchorId,
    cellsKeySet,
    commitDraftTilemap,
    getSelectedCells,
    normalizeRoomRegions,
    setStoredJson,
    setTilemapStatus,
  });
}

function resolveRoomRegion(rawId, selectedCell = null) {
  return resolveRoomRegionHelper(appState, rawId, selectedCell, {
    canonicalizeAnchorId,
    regionForCell,
  });
}

function deleteRoomRegion(regionId) {
  return deleteRoomRegionHelper(appState, regionId, {
    canonicalizeAnchorId,
    commitDraftTilemap,
    normalizeRoomRegions,
    setStoredJson,
    setTilemapStatus,
  });
}

function setRegionLabelPosition() {
  return setRegionLabelPositionHelper(appState, {
    drawRoom,
    normalizeRoomRegions,
    renderVisualEditor,
    resolveRoomRegion,
    setStoredJson,
    setTilemapStatus,
  });
}

function clearRegionSelection() {
  return clearRegionSelectionHelper(appState, {
    cellsKeySet,
    commitDraftTilemap,
    getSelectedCells,
    normalizeRoomRegions,
    setStoredJson,
    setTilemapStatus,
  });
}

function commitDraftTilemap(successMessage = "Applied draft tilemap.") {
  return commitDraftTilemapHelper(appState, successMessage, {
    buildTilemapState,
    drawRoom,
    renderWorld,
    resizeRendererViewport,
    setStoredJson,
    setStoredMap,
    setTilemapStatus,
    syncEditorInputs,
  });
}

function resizeGridText(text, cols, rows, fillToken, parser, serializer) {
  return resizeGridTextHelper(text, cols, rows, fillToken, parser, serializer, {
    parseMapText,
  });
}

function resizeTilemapGrid(cols, rows) {
  return resizeTilemapGridHelper(appState, cols, rows, {
    buildTilemapState,
    drawRoom,
    getWorldCols,
    getWorldRows,
    parseFloorRow,
    parseObjectRow,
    renderWorld,
    resizeGridText,
    resizeRendererViewport,
    serializeFloorLines,
    serializeObjectLines,
    setStoredJson,
    setStoredMap,
    setTilemapStatus,
    syncEditorInputs,
  });
}

function applyVisualToken(rawValue) {
  return applyVisualTokenHelper(appState, rawValue, {
    commitDraftTilemap,
    getSelectedCells,
    setTilemapStatus,
    updateDraftCell,
  });
}

function applyVisualAtlasCell(atlasCell) {
  return applyVisualAtlasCellHelper(appState, atlasCell, {
    applyVisualToken,
  });
}

function assignChatBubbleTile() {
  return assignChatBubbleTileHelper(appState, {
    applyChatBubbleFrameStyles,
    renderChat,
    renderVisualEditor,
    selectedChatBubbleTheme,
    setStoredJson,
    setTilemapStatus,
  });
}

function resetChatBubbleFrame() {
  return resetChatBubbleFrameHelper(appState, {
    applyChatBubbleFrameStyles,
    normalizeChatBubbleTheme,
    renderChat,
    renderVisualEditor,
    setStoredJson,
    setTilemapStatus,
  });
}

function setChatBubbleTextColor(color) {
  return setChatBubbleTextColorHelper(appState, color, {
    applyChatBubbleFrameStyles,
    renderChat,
    renderVisualEditor,
    selectedChatBubbleTheme,
    setStoredJson,
  });
}

function setVisualLayer(layerName) {
  return setVisualLayerHelper(appState, layerName, {
    renderVisualEditor,
  });
}

function setSelectedMapCell(row, col) {
  return setSelectedMapCellHelper(appState, row, col, {
    drawRoom,
    regionForCell,
    renderVisualEditor,
  });
}

function setHoveredMapCell(row, col) {
  return setHoveredMapCellHelper(appState, row, col, {
    drawRoom,
  });
}

function createStashBox() {
  const stash = normalizeStashPoint(appState.tilemap?.layout?.stash || { col: 15, row: 14 });
  const container = new PIXI.Container();
  const interactive = appState.activeTab !== "editor";
  container.interactive = interactive;
  container.buttonMode = interactive;
  container.cursor = interactive ? "pointer" : "default";
  container.x = stash.col * TILE_SIZE + TILE_SIZE / 2;
  container.y = stash.row * TILE_SIZE + TILE_SIZE / 2;
  container.zIndex = container.y;
  container._sceneSprite = true;

  const shadow = new PIXI.Graphics();
  shadow.beginFill(0x000000, 0.25);
  shadow.drawEllipse(0, 0, 18, 6);
  shadow.endFill();
  shadow.y = 18;

  const chest = new PIXI.Graphics();
  chest.beginFill(0x8f633b);
  chest.drawRect(-18, -6, 36, 20);
  chest.endFill();
  chest.beginFill(0xc99a54);
  chest.drawRect(-18, -16, 36, 10);
  chest.endFill();
  chest.lineStyle(3, 0x5d3f20, 1);
  chest.drawRect(-18, -6, 36, 20);
  chest.drawRect(-18, -16, 36, 10);

  const label = createText("STASH", {
    fontFamily: "Courier New",
    fontSize: 9,
    fontWeight: "bold",
    fill: 0xf7ecc5,
  });
  label.anchor.set(0.5, 0);
  label.y = 18;

  container.addChild(shadow, chest, label);
  container.on("pointertap", () => {
    document.querySelector(".stash-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const first = appState.stash[0];
    if (first) showStashItem(first);
  });
  return container;
}

function assignStashSelection() {
  return assignStashSelectionHelper(appState, {
    drawRoom,
    normalizeStashPoint,
    renderVisualEditor,
    setStoredJson,
    setTilemapStatus,
  });
}

function clearStashSelection() {
  return clearStashSelectionHelper(appState, {
    drawRoom,
    normalizeStashPoint,
    renderVisualEditor,
    setStoredJson,
    setTilemapStatus,
  });
}

function drawRoom(renderer) {
  const { backgroundLayer, floorLayer, wallLayer, depthLayer, overlayLayer, labelLayer } = renderer;
  backgroundLayer.removeChildren();
  floorLayer.removeChildren();
  wallLayer.removeChildren();
  overlayLayer.removeChildren();
  labelLayer.removeChildren();
  for (const child of [...depthLayer.children]) {
    if (!child.agentId) depthLayer.removeChild(child);
  }

  const worldWidth = getWorldWidth();
  const worldHeight = getWorldHeight();
  const sceneTop = getSceneTopPadding();
  const renderHeight = getRenderHeight();
  const worldCols = getWorldCols();
  const worldRows = getWorldRows();
  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000);
  bg.drawRect(0, 0, worldWidth, renderHeight);
  bg.endFill();
  bg.lineStyle(4, 0x1e2536, 1);
  bg.drawRect(2, sceneTop + 2, worldWidth - 4, worldHeight - 4);
  backgroundLayer.addChild(bg);

  if (!appState.tilemap) return;
  const { floorGrid, wallGrid, furnitureGrid, propGrid } = appState.tilemap;

  for (let row = 0; row < floorGrid.length; row += 1) {
    for (let col = 0; col < floorGrid[row].length; col += 1) {
      const floorToken = parseFloorToken(floorGrid[row][col]);
      const floorTexture = getFloorTexture(renderer, floorToken);
      if (floorTexture) {
        const sprite = new PIXI.Sprite(floorTexture);
        sprite.x = col * TILE_SIZE;
        sprite.y = row * TILE_SIZE;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        floorLayer.addChild(sprite);
      }

      const wallToken = parseObjectToken(wallGrid[row][col]);
      const wallTexture = getLayerTexture(renderer, wallToken, "wall");
      if (wallTexture) {
        const sprite = new PIXI.Sprite(wallTexture);
        sprite.x = col * TILE_SIZE;
        sprite.y = row * TILE_SIZE;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        wallLayer.addChild(sprite);
      }

      const furnitureToken = parseObjectToken(furnitureGrid[row][col]);
      const furnitureTexture = getLayerTexture(renderer, furnitureToken, "furniture");
      if (furnitureTexture) {
        const sprite = new PIXI.Sprite(furnitureTexture);
        sprite.x = col * TILE_SIZE;
        sprite.y = row * TILE_SIZE;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        sprite.zIndex = sprite.y + TILE_SIZE;
        sprite._sceneSprite = true;
        depthLayer.addChild(sprite);
      }

      const propToken = parseObjectToken(propGrid[row][col]);
      const propTexture = getLayerTexture(renderer, propToken, "prop");
      if (propTexture) {
        const sprite = new PIXI.Sprite(propTexture);
        sprite.x = col * TILE_SIZE;
        sprite.y = row * TILE_SIZE;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        sprite.zIndex = sprite.y + TILE_SIZE;
        sprite._sceneSprite = true;
        depthLayer.addChild(sprite);
      }
    }
  }

  depthLayer.addChild(createStashBox());
  depthLayer.sortDirty = true;

  const roomLabels = appState.roomRegions
    .filter((region) => region.kind === "room")
    .map((region) => createRegionLabel(region))
    .filter(Boolean);
  if (roomLabels.length) {
    for (const label of roomLabels) labelLayer.addChild(label);
  } else if (appState.activeTab !== "editor") {
    for (const anchor of Object.values(appState.tilemap.layout.anchors || {})) {
      labelLayer.addChild(createAnchorLabel(anchor.label, anchor.col * TILE_SIZE + 4, Math.max(4, anchor.row * TILE_SIZE - 18)));
    }
  }

  if (appState.editor.enabled) {
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0xffffff, 0.14);
    for (let col = 0; col <= worldCols; col += 1) {
      grid.moveTo(col * TILE_SIZE, 0);
      grid.lineTo(col * TILE_SIZE, worldHeight);
    }
    for (let row = 0; row <= worldRows; row += 1) {
      grid.moveTo(0, row * TILE_SIZE);
      grid.lineTo(worldWidth, row * TILE_SIZE);
    }
    overlayLayer.addChild(grid);

    for (let row = 0; row < floorGrid.length; row += 1) {
      for (let col = 0; col < floorGrid[row].length; col += 1) {
        const floorCode = floorTokenLabel(parseFloorToken(floorGrid[row][col]));
        const wallToken = parseObjectToken(wallGrid[row][col]);
        const furnitureToken = parseObjectToken(furnitureGrid[row][col]);
        const propToken = parseObjectToken(propGrid[row][col]);
        const badge = new PIXI.Graphics();
        badge.beginFill(0x08101d, 0.72);
        badge.drawRoundedRect(0, 0, TILE_SIZE - 4, 20, 3);
        badge.endFill();
        badge.x = col * TILE_SIZE + 2;
        badge.y = row * TILE_SIZE + 2;

        const text = createText(`${floorCode}\nW:${tokenLabel(wallToken)} F:${tokenLabel(furnitureToken)} P:${tokenLabel(propToken)}`, {
          fontFamily: "Courier New",
          fontSize: 5,
          fontWeight: "bold",
          fill: wallToken.door ? 0x9ff5be : !wallToken.passable ? 0xffb9a5 : 0xd7e5ff,
        });
        text.x = col * TILE_SIZE + 5;
        text.y = row * TILE_SIZE + 3;
        overlayLayer.addChild(badge, text);
      }
    }
  }
  renderEditorSelectionOverlay(renderer);
}

function createAgentSprite(agent) {
  return createAgentSpriteHelper(appState, agent, {
    bubblePaletteForAgent,
    createText,
    currentTileForAgent,
    displayActionText,
    getAnimationFrames,
    hashString,
    onSelectAgent: async (agentId) => {
      await selectAgent(agentId);
      document.querySelector(".inspector")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    PIXIRef: PIXI,
    positionAgentLabel,
    positionBubble,
    tilePoint,
  });
}

function createBenchmarkSprite(agent) {
  return createBenchmarkSpriteHelper(appState, agent, {
    bubblePaletteForAgent,
    createText,
    currentTileForAgent,
    displayActionText,
    hashString,
    onSelectAgent: async (agentId) => {
      await selectAgent(agentId);
      document.querySelector(".inspector")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    PIXIRef: PIXI,
    positionAgentLabel,
    positionBubble,
  });
}

function updateBubble(container, text) {
  return updateBubbleHelper(container, text, {
    displayActionText,
    positionBubble,
  });
}

function updateAgentLabel(container, selected = false) {
  return updateAgentLabelHelper(container, selected);
}

function positionBubble(container) {
  return positionBubbleHelper(container);
}

function positionAgentLabel(container) {
  return positionAgentLabelHelper(container);
}

function updateActivityCue(container, agent, moving) {
  return updateActivityCueHelper(container, agent, moving, {
    activityCue,
  });
}

function chooseDisplayFrames(renderer, agent, moving) {
  return chooseDisplayFramesHelper(renderer, agent, moving, {
    directionalIdleFrames,
    directionalWalkFrames,
    getAnimationFrames,
  });
}

function effectiveGoalTileForAgent(sprite, agent, currentTile) {
  return effectiveGoalTileForAgentHelper(appState, sprite, agent, currentTile, {
    nextAmbientRandom,
    regionForAnchor,
    regionForCell,
    roomGoalTile,
    roomIdForAgent,
    roomWaypointTiles,
  });
}

function applyPathing(sprite, agent) {
  return applyPathingHelper(appState, sprite, agent, {
    effectiveGoalTileForAgent,
    findPath,
    goalTileForAgent,
    isWalkable,
    nearestWalkableTile,
    tileFromWorldPoint,
    tilePoint,
  });
}

function tickAgents(delta) {
  if (!appState.renderer) return;
  for (const sprite of appState.renderer.agents.values()) {
    const agent = sprite._agent;
    if (!agent) continue;
    let remaining = 2.9 * delta;
    let moving = false;
    while (remaining > 0.001) {
      const pathing = applyPathing(sprite, agent);
      const dx = pathing.target.x - sprite.x;
      const dy = pathing.target.y - sprite.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 0.001) {
        sprite._state.currentTile = pathing.nextTile;
        if (sprite._state.path?.length > 1) {
          sprite._state.path = sprite._state.path.slice(1);
          continue;
        }
        break;
      }
      moving = true;
      if (Math.abs(dx) > Math.abs(dy)) sprite._state.facing = dx >= 0 ? "right" : "left";
      else sprite._state.facing = dy >= 0 ? "down" : "up";
      if (distance <= remaining) {
        sprite.x = pathing.target.x;
        sprite.y = pathing.target.y;
        remaining -= distance;
        sprite._state.currentTile = pathing.nextTile;
        if (sprite._state.path?.length > 1) {
          sprite._state.path = sprite._state.path.slice(1);
          continue;
        }
        break;
      }
      sprite.x += (dx / distance) * remaining;
      sprite.y += (dy / distance) * remaining;
      remaining = 0;
    }
    positionBubble(sprite);
    positionAgentLabel(sprite);
    sprite.zIndex = sprite.y;
    appState.renderer.depthLayer.sortDirty = true;
    const frames = chooseDisplayFrames(appState.renderer, agent, moving);
    const current = sprite._anim.textures || [];
    const changed = current.length !== frames.length || current.some((t, i) => t !== frames[i]);
    if (changed) {
      sprite._anim.textures = frames;
      sprite._anim.gotoAndPlay(0);
    }
    updateActivityCue(sprite, agent, moving);
    sprite._anim.scale.set(shouldMirrorSpriteForFacing(appState.renderer, agent, sprite._state.facing) ? -1.72 : 1.72, 1.72);
    sprite._anim.tint = agent.runtimeStatus === "offline" ? 0xc3bfd1 : agent.runtimeStatus === "blocked" ? 0xffc0ba : 0xffffff;
    updateAgentLabel(sprite, sprite.agentId === appState.selectedAgentId);
  }
}

async function initRenderer() {
  if (appState.renderer || !window.PIXI) return;
  const host = document.getElementById("world-canvas");
  const pixiApp = new PIXI.Application({
    width: getWorldWidth(),
    height: getRenderHeight(),
    antialias: false,
    autoDensity: true,
    resolution: 1,
    backgroundAlpha: 0,
  });
  host.appendChild(pixiApp.view);

  const backgroundLayer = new PIXI.Container();
  const floorLayer = new PIXI.Container();
  const wallLayer = new PIXI.Container();
  const depthLayer = new PIXI.Container();
  depthLayer.sortableChildren = true;
  const overlayLayer = new PIXI.Container();
  const interactionLayer = new PIXI.Container();
  const labelLayer = new PIXI.Container();
  const agentLabelLayer = new PIXI.Container();
  const bubbleLayer = new PIXI.Container();
  pixiApp.stage.addChild(backgroundLayer, floorLayer, wallLayer, depthLayer, overlayLayer, interactionLayer, labelLayer, agentLabelLayer, bubbleLayer);

  const assets = await loadArtAssets();
  assets.tileTextures = await buildTileTextures(pixiApp, assets.tileManifest);
  const officeAtlas = await PIXI.Assets.load(assets.layout.officeAtlasPath || DEFAULT_OFFICE_ATLAS_PATH);
  const floorAtlas = await PIXI.Assets.load(assets.layout.floorAtlasPath || DEFAULT_FLOOR_ATLAS_PATH);
  const wallAtlas = await PIXI.Assets.load(assets.layout.wallAtlasPath || DEFAULT_WALL_ATLAS_PATH);
  assets.floorAtlasBaseTexture = floorAtlas.baseTexture || floorAtlas;
  assets.floorAtlasBaseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  assets.officeAtlasBaseTexture = officeAtlas.baseTexture || officeAtlas;
  assets.officeAtlasBaseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  assets.wallAtlasBaseTexture = wallAtlas.baseTexture || wallAtlas;
  assets.wallAtlasBaseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  assets.officeAtlasTextures = {};
  assets.wallAtlasTextures = {};
  assets.floorAtlasTextures = {};
  assets.primitiveTextures = {
    wall: buildPrimitiveTexture(pixiApp, "wall"),
    door: buildPrimitiveTexture(pixiApp, "door"),
  };
  assets.layout.stash = normalizeStashPoint(assets.stash || assets.layout.stash || { col: 15, row: 14 });
  appState.tilemap = buildTilemapState(assets.floorText, assets.wallText, assets.furnitureText, assets.propText, assets.tileManifest, assets.layout, assets.roomRegions);
  appState.roomRegions = appState.tilemap.layout.roomRegions || [];
  assets.layout.cols = appState.tilemap.layout.cols;
  assets.layout.rows = appState.tilemap.layout.rows;
  assets.layout.anchors = appState.tilemap.layout.anchors;
  appState.gameStateRaw = assets.gameStateRaw || {};
  appState.editor.baseFloorText = normalizeMapText(assets.floorText);
  appState.editor.baseWallText = normalizeMapText(assets.wallText);
  appState.editor.baseFurnitureText = normalizeMapText(assets.furnitureText);
  appState.editor.basePropText = normalizeMapText(assets.propText);
  appState.editor.baseCols = assets.layout.cols || DEFAULT_WORLD_COLS;
  appState.editor.baseRows = assets.layout.rows || DEFAULT_WORLD_ROWS;
  appState.editor.draftFloorText = appState.tilemap.floorText;
  appState.editor.draftWallText = appState.tilemap.wallText;
  appState.editor.draftFurnitureText = appState.tilemap.furnitureText;
  appState.editor.draftPropText = appState.tilemap.propText;

  appState.renderer = {
    host,
    pixiApp,
    backgroundLayer,
    floorLayer,
    wallLayer,
    depthLayer,
    overlayLayer,
    interactionLayer,
    labelLayer,
    agentLabelLayer,
    bubbleLayer,
    agents: new Map(),
    assets,
  };
  drawRoom(appState.renderer);
  syncEditorInputs();
  setTilemapStatus("Tilemap loaded.");
  pixiApp.ticker.add((delta) => tickAgents(delta));
  syncSceneOffset();
  pixiApp.renderer.resize(getWorldWidth(), getRenderHeight());
  mountRendererView();
  syncRendererCanvasSize();

  pixiApp.view.addEventListener("mousemove", (event) => {
    if (appState.activeTab !== "editor") return;
    const cell = getCanvasCellFromEvent(event, pixiApp.view);
    if (!cell) {
      setHoveredMapCell(null, null);
      return;
    }
    setHoveredMapCell(cell.row, cell.col);
    if (appState.editor.isSelecting) {
      appState.editor.selectionFocus = { row: cell.row, col: cell.col };
      appState.editor.selectedCell = { row: cell.row, col: cell.col };
      drawRoom(appState.renderer);
      renderVisualEditor();
    }
  });
  pixiApp.view.addEventListener("mouseleave", () => setHoveredMapCell(null, null));
  pixiApp.view.addEventListener("mousedown", (event) => {
    if (appState.activeTab !== "editor") return;
    const cell = getCanvasCellFromEvent(event, pixiApp.view);
    if (!cell) return;
    appState.editor.isSelecting = true;
    appState.editor.selectionAnchor = { row: cell.row, col: cell.col };
    appState.editor.selectionFocus = { row: cell.row, col: cell.col };
    appState.editor.selectedCell = { row: cell.row, col: cell.col };
    appState.editor.selectedAtlasCell = null;
    drawRoom(appState.renderer);
    renderVisualEditor();
  });
  window.addEventListener("mouseup", (event) => {
    if (!appState.editor.isSelecting) return;
    appState.editor.isSelecting = false;
    const cell = getCanvasCellFromEvent(event, pixiApp.view);
    if (cell) {
      appState.editor.selectionFocus = { row: cell.row, col: cell.col };
      appState.editor.selectedCell = { row: cell.row, col: cell.col };
    }
    drawRoom(appState.renderer);
    renderVisualEditor();
  });
}

window.addEventListener("resize", () => {
  resizeRendererViewport();
});

function renderWorld(worldState) {
  appState.world = worldState;
  setText("room-name", worldState.room?.name || "Agent World");
  setText("server-time", formatDate(worldState.serverTime));
  const totalAgents = worldState.agents?.length || 0;
  const visibleAgents = (worldState.agents || []).filter((agent) => shouldShowAgentSprite(agent)).length;
  const hiddenAgents = Math.max(0, totalAgents - visibleAgents);
  setText("agent-count", hiddenAgents
    ? `${visibleAgents}/${totalAgents} visible · ${hiddenAgents} inactive`
    : `${totalAgents} agent${totalAgents === 1 ? "" : "s"}`);
  populateAgentSelect(worldState.agents || []);
  if (!appState.renderer || !worldState.agents) return;
  const { depthLayer, agents } = appState.renderer;
  const liveIds = new Set();
  for (const agent of worldState.agents) {
    liveIds.add(agent.id);
    let sprite = agents.get(agent.id);
    if (!sprite) {
      sprite = createAgentSprite(agent);
      agents.set(agent.id, sprite);
      depthLayer.addChild(sprite);
    }
    sprite._agent = agent;
    sprite._bubblePalette = bubblePaletteForAgent(agent);
    const visibleInWorld = shouldShowAgentSprite(agent);
    const visible = visibleInWorld && !(appState.activeTab === "editor" && !appState.editor.showAgents);
    sprite.visible = visible;
    if (sprite._bubbleWrap) sprite._bubbleWrap.visible = visible;
    if (sprite._labelWrap) sprite._labelWrap.visible = visible;
    sprite.interactive = visible && appState.activeTab !== "editor";
    sprite.buttonMode = visible && appState.activeTab !== "editor";
    sprite.cursor = visible && appState.activeTab !== "editor" ? "pointer" : "default";
    updateBubble(sprite, agent.currentAction);
    positionBubble(sprite);
    updateAgentLabel(sprite, agent.id === appState.selectedAgentId);
    positionAgentLabel(sprite);
    updateActivityCue(sprite, agent, false);
    sprite._selection.clear();
    if (agent.id === appState.selectedAgentId) {
      sprite._selection.lineStyle(4, 0x76d0a8, 1);
      sprite._selection.drawCircle(0, -38, 28);
    }
    sprite.scale.set(agent.runtimeStatus === "active" ? 1 : 0.94);
    sprite.alpha = agent.runtimeStatus === "offline" ? 0.76 : 1;
    sprite.zIndex = sprite.y;
  }
  for (const [id, sprite] of agents.entries()) {
    if (liveIds.has(id)) continue;
    if (sprite._bubbleWrap?.parent) sprite._bubbleWrap.parent.removeChild(sprite._bubbleWrap);
    if (sprite._labelWrap?.parent) sprite._labelWrap.parent.removeChild(sprite._labelWrap);
    depthLayer.removeChild(sprite);
    agents.delete(id);
  }
  depthLayer.sortDirty = true;
  syncSelectedAgentDetailFromWorld(worldState);
}

function syncSelectedAgentDetailFromWorld(worldState) {
  return syncSelectedAgentDetailFromWorldHelper(appState, worldState, {
    renderInspector,
  });
}

function renderInspector(detailPayload) {
  return renderInspectorHelper(appState, detailPayload, {
    displayedLocationLabel,
    documentRef: document,
    formatDate,
    setText,
    showRichMessage,
    statusClass,
  });
}

async function showRichMessage(kind, title, text, path = null) {
  return showRichMessageHelper(appState, kind, title, text, path, {
    classifyPath,
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    extractPaths,
    fetchText: async (url) => {
      const res = await fetch(url);
      return res.text();
    },
    fileUrl,
    renderRichText,
    setMessageSelection,
    setText,
    windowRef: window,
  });
}

function historyRoleClass(type) {
  return historyRoleClassHelper(type);
}

function historyRoleMeta(type) {
  return historyRoleMetaHelper(type, { historyRoleClass });
}

function renderChat(history) {
  return renderChatHelper(appState, history, {
    applyChatRoleTheme,
    chatBubbleMarkup,
    classifyPath,
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    extractPaths,
    fileUrl,
    formatRichTextHtml,
    formatTime,
    historyRoleClass,
    historyRoleMeta,
    maybeSpeakReply,
    setText,
    showRichMessage,
    windowRef: window,
  });
}

function renderHistory(events) {
  return renderHistoryHelper(events, {
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    extractPaths,
    formatTime,
    renderChat,
    showRichMessage,
  });
}

function renderSchedule(detailPayload) {
  return renderScheduleHelper(detailPayload, {
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    formatDate,
    setText,
    showRichMessage,
  });
}

function showStashItem(item) {
  return showStashItemHelper(item, {
    formatDate,
    showRichMessage,
  });
}

function renderStash(stash) {
  return renderStashHelper(appState, stash, {
    createElement: (tag) => document.createElement(tag),
    documentRef: document,
    formatDate,
    setText,
    showStashItem,
  });
}

function handleStreamSnapshot(payload) {
  return handleStreamSnapshotHelper(payload, {
    renderHistory,
    renderInspector,
    renderSchedule,
    renderStash,
    renderWorld,
  });
}

function connectStream() {
  return connectStreamHelper(appState, {
    EventSourceCtor: EventSource,
    URLSearchParamsCtor: URLSearchParams,
    consoleRef: console,
    handleStreamSnapshot,
    setText,
  });
}

async function selectAgent(agentId) {
  return selectAgentHelper(appState, agentId, {
    connectStream,
    getJson,
    renderHistory,
    renderInspector,
    renderSchedule,
    renderStash,
    renderWorld,
    setMessageSelection,
    syncWorldDetailVisibility,
  });
}

function closeWorldDetails() {
  return closeWorldDetailsHelper(appState, {
    connectStream,
    documentRef: document,
    renderHistory,
    renderSchedule,
    renderStash,
    renderWorld,
    setText,
    syncWorldDetailVisibility,
  });
}

async function saveGameState() {
  const payload = buildCurrentGameStatePayload();
  writeGameStateToLocalStorage(payload);
  const response = await postJson("/api/agent-world/game-state", payload);
  const snapshot = structuredSnapshotFromGameState(response, appState.renderer?.assets?.layout || {});
  writeGameStateToLocalStorage(snapshot.raw);
  applyStructuredGameState(snapshot, "Saved game state to game_state.json.");
}

async function moveSelectedAgentToAnchor() {
  const result = document.getElementById("command-result");
  if (!appState.selectedAgentId) {
    result.textContent = "No agent selected.";
    return;
  }
  const select = document.getElementById("move-anchor-select");
  const anchorId = select?.value;
  if (!anchorId) {
    result.textContent = "No destination selected.";
    return;
  }
  const response = await postJson(`/api/agent-world/agents/${encodeURIComponent(appState.selectedAgentId)}/move`, {
    anchorId,
    source: "world-ui",
  });
  let debugSuffix = "";
  if (response.status === "accepted") {
    if (appState.world?.agents?.length) {
      appState.world = {
        ...appState.world,
        agents: appState.world.agents.map((agent) => agent.id === appState.selectedAgentId ? {
          ...agent,
          targetAnchor: anchorId,
        } : agent),
      };
      renderWorld(appState.world);
    }
    if (appState.detail?.agent?.id === appState.selectedAgentId) {
      appState.detail = {
        ...appState.detail,
        agent: {
          ...appState.detail.agent,
          targetAnchor: anchorId,
        },
      };
      renderInspector(appState.detail);
    }
    const sprite = appState.renderer?.agents?.get(appState.selectedAgentId);
    const agent = appState.world?.agents?.find((item) => item.id === appState.selectedAgentId);
    if (sprite && agent) {
      const currentTile = sprite._state?.currentTile && isWalkable(sprite._state.currentTile.row, sprite._state.currentTile.col)
        ? sprite._state.currentTile
        : currentTileForAgent(agent);
      const goalTile = goalTileForAgent(agent, currentTile);
      const path = findPath(currentTile, goalTile);
      sprite._state.currentAnchorKey = agent.currentAnchor || "";
      sprite._state.targetAnchorKey = agent.targetAnchor || "";
      sprite._state.currentTile = currentTile;
      sprite._state.goalKey = `${goalTile.row}:${goalTile.col}`;
      sprite._state.path = path.length ? path : [currentTile];
      debugSuffix = ` · path ${sprite._state.path.length} step${sprite._state.path.length === 1 ? "" : "s"} from ${currentTile.col + 1}:${currentTile.row + 1} to ${goalTile.col + 1}:${goalTile.row + 1}`;
    }
  }
  result.textContent = `${response.status === "accepted" ? "Move set" : "Move rejected"} at ${formatTime(response.acceptedAt)}: ${anchorId}${response.reason ? ` (${response.reason})` : ""}${debugSuffix}`;
  await load();
}

function applyEditorState() {
  return applyEditorStateHelper(appState, {
    commitDraftTilemap,
    documentRef: document,
  });
}

function resetEditorState() {
  return resetEditorStateHelper(appState, {
    applyEditorState,
    documentRef: document,
    setStoredMap,
  });
}

function toggleEditMode() {
  appState.editor.enabled = !appState.editor.enabled;
  syncEditorInputs();
  drawRoom(appState.renderer);
  if (appState.world) renderWorld(appState.world);
}

function getAtlasPointerCell(event) {
  return getAtlasPointerCellHelper(event, {
    documentRef: document,
    getVisualLayerConfig,
  });
}

function getCanvasCellFromEvent(event, view) {
  return getCanvasCellFromEventHelper(event, view, {
    getWorldCols,
    getWorldHeight,
    getWorldRows,
    getWorldWidth,
  });
}

async function load() {
  await initRenderer();
  await fetchSettingsData();
  const worldState = await getJson("/api/agent-world/state");
  renderWorld(worldState);
  if (!appState.selectedAgentId) {
    const defaultAgent = worldState?.agents?.find((agent) => agent.id === DEFAULT_SELECTED_AGENT_ID) || worldState?.agents?.[0];
    if (defaultAgent?.id) appState.selectedAgentId = defaultAgent.id;
  }
  if (appState.selectedAgentId) {
    await selectAgent(appState.selectedAgentId);
  } else {
    renderHistory([]);
    renderSchedule(null);
    renderStash([]);
    connectStream();
    syncWorldDetailVisibility();
  }
}

async function submitCommand(event) {
  event.preventDefault();
  const input = document.getElementById("command-input");
  const text = input.value.trim();
  if (!text) return;
  await sendCommandText(text);
  input.value = "";
}

initDomEvents(appState, {
  applyEditorState,
  applyImportedAgentWorldStorageState,
  applyStructuredGameState,
  applyVisualAtlasCell,
  applyVisualToken,
  assignChatBubbleTile,
  assignRegionSelection,
  assignStashSelection,
  clearRegionSelection,
  clearStashSelection,
  closeWorldDetails,
  documentRef: document,
  fetchSettingsData,
  getAtlasPointerCell,
  initVoiceControls,
  load,
  moveSelectedAgentToAnchor,
  parseImportedAgentWorldStorageState,
  pushVoiceEvent,
  renderVisualEditor,
  renderWorld,
  resetChatBubbleFrame,
  resetEditorState,
  resizeTilemapGrid,
  saveGameState,
  saveSettings,
  saveSettingsFromJsonEditor,
  selectedChatBubbleTheme,
  selectAgent,
  setActiveEditorSubview,
  setActiveTab,
  setChatBubbleTextColor,
  setRegionLabelPosition,
  setSettingsResult,
  setStoredMap,
  setTilemapStatus,
  setVisualLayer,
  setVoiceStatus,
  speakText,
  startVoiceCapture,
  stopSpeechPlayback,
  stopVoiceCapture,
  structuredSnapshotFromGameState,
  submitCommand,
  syncGameStateTextarea,
  TILEMAP_STORAGE_KEYS,
  updateVoiceUi,
  writeGameStateToLocalStorage,
});

startApp({
  documentRef: document,
  initVoiceControls,
  load,
  setActiveTab,
  setTilemapStatus,
});
