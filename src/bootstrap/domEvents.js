/*
 * DOM event registration for the frontend.
 * This file wires the static page controls to the composed app/runtime APIs but
 * deliberately avoids owning the underlying feature logic itself.
 */
import { bindEditorSharedPanelToggle } from "../features/editor/shared/editorSharedPanel.js";
import { bindEditorSubviewTabEvents } from "../features/editor/shared/editorTabs.js";
import { bindRoomMappingEditorEvents } from "../features/editor/roomMapping/editorEvents.js";
import { bindTilemapEditorEvents } from "../features/editor/tilemap/editorEvents.js";

export function initDomEvents(state, deps = {}) {
  const {
    applyEditorState = () => {},
    applyImportedAgentWorldStorageState = () => {},
    applyStructuredGameState = () => {},
    applyVisualAtlasCell = () => {},
    applyVisualToken = () => {},
    assignChatBubbleTile = () => {},
    assignRegionSelection = () => {},
    assignStashSelection = () => {},
    clearRegionSelection = () => {},
    clearStashSelection = () => {},
    closeWorldDetails = () => {},
    documentRef = document,
    fetchSettingsData = async () => {},
    initVoiceControls = () => {},
    load = async () => {},
    moveSelectedAgentToAnchor = async () => {},
    parseImportedAgentWorldStorageState = () => ({}),
    renderVisualEditor = () => {},
    renderWorld = () => {},
    resetChatBubbleFrame = () => {},
    resetEditorState = () => {},
    resizeTilemapGrid = () => {},
    saveGameState = async () => {},
    saveSettings = async () => {},
    saveSettingsFromJsonEditor = async () => {},
    selectedChatBubbleTheme = () => null,
    setActiveEditorSubview = () => {},
    setActiveTab = () => {},
    setChatBubbleTextColor = () => {},
    setSettingsResult = () => {},
    setTilemapStatus = () => {},
    setVisualLayer = () => {},
    setVoiceStatus = () => {},
    setRegionLabelPosition = () => {},
    setStoredMap = () => {},
    selectAgent = async () => {},
    stopSpeechPlayback = () => {},
    stopVoiceCapture = () => {},
    structuredSnapshotFromGameState = () => ({}),
    submitCommand = async () => {},
    syncGameStateTextarea = () => {},
    updateVoiceUi = () => {},
    writeGameStateToLocalStorage = () => {},
    getAtlasPointerCell = () => null,
    pushVoiceEvent = () => {},
    speakText = () => {},
    startVoiceCapture = async () => {},
    TILEMAP_STORAGE_KEYS = {},
    URLRef = URL,
    BlobCtor = Blob,
  } = deps;

  documentRef.getElementById("command-form").addEventListener("submit", submitCommand);
  documentRef.getElementById("voice-toggle").addEventListener("click", async () => {
    if (state.voice.listening) stopVoiceCapture();
    else await startVoiceCapture();
  });
  documentRef.getElementById("voice-stop").addEventListener("click", stopVoiceCapture);
  documentRef.getElementById("voice-speak-current").addEventListener("click", () => {
    speakText(state.messageSelection.body || state.messageSelection.title, "selected-message");
  });
  documentRef.getElementById("voice-auto-send").addEventListener("change", (event) => {
    state.voice.autoSend = !!event.target.checked;
    setVoiceStatus(state.voice.autoSend ? "Auto-send is on." : "Auto-send is off.");
  });
  documentRef.getElementById("voice-speak-replies").addEventListener("change", (event) => {
    state.voice.speakReplies = !!event.target.checked;
    if (!state.voice.speakReplies) stopSpeechPlayback();
    setVoiceStatus(state.voice.speakReplies ? "Reply speech is on." : "Reply speech is off.");
  });
  documentRef.getElementById("voice-input-select").addEventListener("change", (event) => {
    state.voice.selectedInputDeviceId = event.target.value || "";
    setStoredMap(TILEMAP_STORAGE_KEYS.voiceInputDeviceId, state.voice.selectedInputDeviceId);
    pushVoiceEvent(state.voice.selectedInputDeviceId ? "Preferred mic input updated." : "Preferred mic input cleared.");
    if (state.voice.listening) {
      stopVoiceCapture();
      setVoiceStatus("Microphone changed. Press Start Mic to reconnect.", false);
    } else {
      updateVoiceUi();
    }
  });
  documentRef.getElementById("agent-select").addEventListener("change", async (event) => {
    const agentId = event.target.value;
    if (!agentId) {
      closeWorldDetails();
      return;
    }
    await selectAgent(agentId);
  });
  documentRef.getElementById("close-world-details").addEventListener("click", closeWorldDetails);
  documentRef.getElementById("refresh-button").addEventListener("click", load);
  documentRef.getElementById("tab-world").addEventListener("click", () => setActiveTab("world"));
  documentRef.getElementById("tab-editor").addEventListener("click", () => setActiveTab("editor"));
  documentRef.getElementById("tab-settings").addEventListener("click", () => setActiveTab("settings"));
  bindEditorSubviewTabEvents({ documentRef, setActiveEditorSubview });
  documentRef.getElementById("settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveSettings();
  });
  documentRef.getElementById("settings-refresh").addEventListener("click", async () => {
    await fetchSettingsData();
    setSettingsResult("Diagnostics refreshed.");
  });
  documentRef.getElementById("settings-save-json").addEventListener("click", async () => {
    await saveSettingsFromJsonEditor();
  });
  documentRef.getElementById("settings-reload-json").addEventListener("click", async () => {
    await fetchSettingsData();
    setSettingsResult("Settings JSON reloaded from disk.");
  });
  bindEditorSharedPanelToggle({ documentRef });
  bindTilemapEditorEvents(state, {
    applyEditorState,
    applyVisualToken,
    documentRef,
    renderVisualEditor,
    resizeTilemapGrid,
    saveGameState,
    setTilemapStatus,
  });
  bindRoomMappingEditorEvents(state, {
    assignRegionSelection,
    assignStashSelection,
    clearRegionSelection,
    clearStashSelection,
    documentRef,
    setRegionLabelPosition,
    setTilemapStatus,
  });
  documentRef.getElementById("apply-game-state-json").addEventListener("click", () => {
    try {
      const textarea = documentRef.getElementById("tilemap-state-json");
      const payload = parseImportedAgentWorldStorageState(textarea?.value || "");
      applyImportedAgentWorldStorageState(payload);
      writeGameStateToLocalStorage(payload);
      const snapshot = structuredSnapshotFromGameState(payload, state.renderer?.assets?.layout || {});
      applyStructuredGameState(snapshot, "Applied game state JSON.");
      if (textarea) textarea.value = JSON.stringify(payload, null, 2);
      if (!snapshot.floorText && !snapshot.wallText && !snapshot.furnitureText && !snapshot.propText) {
        setTilemapStatus("Imported JSON did not contain usable game-state map data.", true);
        return;
      }
      setTilemapStatus(`Imported ${Object.keys(payload).length} keys into local storage.`);
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });
  documentRef.getElementById("download-game-state-json").addEventListener("click", () => {
    try {
      syncGameStateTextarea();
      const textarea = documentRef.getElementById("tilemap-state-json");
      const content = textarea?.value || "{}";
      const blob = new BlobCtor([content], { type: "application/json" });
      const url = URLRef.createObjectURL(blob);
      const anchor = documentRef.createElement("a");
      anchor.href = url;
      anchor.download = "agent_world_game_state.json";
      documentRef.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URLRef.revokeObjectURL(url);
      setTilemapStatus("Downloaded current game state JSON.");
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });
  documentRef.getElementById("reset-tilemap").addEventListener("click", () => {
    try {
      resetEditorState();
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });
  documentRef.getElementById("assign-chat-bubble-tile").addEventListener("click", () => {
    try {
      assignChatBubbleTile();
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });
  documentRef.getElementById("reset-chat-bubble-frame").addEventListener("click", () => {
    try {
      resetChatBubbleFrame();
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });
  for (const button of documentRef.querySelectorAll(".chat-bubble-role-btn")) {
    button.addEventListener("click", () => {
      state.editor.selectedChatBubbleRole = ["assistant", "tool", "user"].includes(button.dataset.role) ? button.dataset.role : "assistant";
      const frame = selectedChatBubbleTheme()?.frame?.[state.editor.selectedChatBubbleSlot || "mm"] || null;
      if (frame?.layer && ["floor", "wall"].includes(frame.layer)) {
        state.editor.selectedLayer = frame.layer;
      }
      renderVisualEditor();
    });
  }
  documentRef.getElementById("chat-bubble-text-color").addEventListener("input", (event) => {
    setChatBubbleTextColor(event.target.value);
  });
  documentRef.getElementById("toggle-editor-agents").addEventListener("change", (event) => {
    state.editor.showAgents = Boolean(event.target.checked);
    if (state.world) renderWorld(state.world);
  });
  documentRef.getElementById("editor-zoom-select").addEventListener("change", (event) => {
    state.editor.zoom = Number(event.target.value) || 2;
    renderVisualEditor();
  });
  for (const button of documentRef.querySelectorAll("#visual-layer-toggle [data-layer]")) {
    button.addEventListener("click", () => setVisualLayer(button.dataset.layer));
  }
  const atlasBoard = documentRef.getElementById("atlas-picker-board");
  documentRef.getElementById("atlas-picker-image").addEventListener("load", () => renderVisualEditor());
  atlasBoard.addEventListener("mousemove", (event) => {
    const cell = getAtlasPointerCell(event);
    state.editor.hoveredAtlasCell = cell;
    renderVisualEditor();
  });
  atlasBoard.addEventListener("mouseleave", () => {
    state.editor.hoveredAtlasCell = null;
    renderVisualEditor();
  });
  atlasBoard.addEventListener("click", (event) => {
    try {
      const cell = getAtlasPointerCell(event);
      if (!cell) return;
      applyVisualAtlasCell(cell);
    } catch (err) {
      setTilemapStatus(err.message, true);
    }
  });
  documentRef.getElementById("move-agent-button").addEventListener("click", async () => {
    try {
      await moveSelectedAgentToAnchor();
    } catch (err) {
      documentRef.getElementById("command-result").textContent = `Move error: ${err.message}`;
    }
  });
}

export function startApp(deps = {}) {
  const {
    documentRef = document,
    initVoiceControls = () => {},
    load = async () => {},
    setActiveTab = () => {},
    setTilemapStatus = () => {},
  } = deps;
  setActiveTab("world");
  load().catch((err) => {
    setTilemapStatus(err.message, true);
    documentRef.getElementById("command-result").textContent = `Load error: ${err.message}`;
  });
  initVoiceControls();
}
