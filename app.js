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
  const lines = String(text || "").split("\n");
  return `
    <div class="settings-code">
      ${lines.map((line, index) => `
        <div class="settings-code-line">
          <span class="settings-code-line-no">${index + 1}</span>
          <span class="settings-code-line-text">${line ? escapeHtml(line) : "&nbsp;"}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSettingsChecks() {
  const container = document.getElementById("settings-checks");
  if (!container) return;
  const checks = Array.isArray(appState.settings.diagnostics?.checks) ? appState.settings.diagnostics.checks : [];
  const readyCount = checks.filter((check) => check?.ok).length;
  setText("settings-check-count", checks.length ? `${readyCount}/${checks.length} ready` : "No checks");
  if (!checks.length) {
    container.innerHTML = '<div class="event-item empty">No diagnostics loaded.</div>';
    return;
  }
  container.innerHTML = checks.map((check) => {
    const statusClass = check.ok ? "ok" : "warn";
    const icon = check.ok ? "&#10003;" : "&#10005;";
    const help = check.appliesTo ? `<span class="settings-check-help" tabindex="0" data-tooltip="${escapeHtml(check.appliesTo)}">?</span>` : "";
    const noteLine = check.ok && check.detail ? `<p class="settings-check-note">${escapeHtml(check.detail)}</p>` : "";
    const reasonLine = !check.ok && check.detail ? `<p class="settings-check-reason">${escapeHtml(check.detail)}</p>` : "";
    const recordSections = Array.isArray(check.records) && check.records.length
      ? `
        <div class="settings-record-list">
          ${check.records.map((record) => `
            <section class="settings-record">
              <h4>${escapeHtml(record.title || "Parsed fields")}</h4>
              <div class="settings-field-list">
                ${(Array.isArray(record.fields) ? record.fields : []).map((field) => `
                  <div class="settings-field-row">
                    <span class="settings-field-label">${escapeHtml(field.label || "Field")}</span>
                    <span class="settings-field-value">${escapeHtml(field.value || "--")}</span>
                  </div>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </div>
      `
      : "";
    const sourceSections = Array.isArray(check.sources) && check.sources.length
      ? `
        <div class="settings-source-list">
          ${check.sources.map((source) => `
            <section class="settings-source">
              <details class="settings-source-toggle">
                <summary>${escapeHtml(source.label || "Source")}</summary>
                <div class="settings-source-body">
                  <h4>${escapeHtml(source.label || "Source")}</h4>
                  ${renderCodeWithLineNumbers(source.text || "")}
                </div>
              </details>
            </section>
          `).join("")}
        </div>
      `
      : "";
    return `
      <details class="settings-check-item ${statusClass}" ${check.ok ? "" : "open"}>
        <summary class="settings-check-head">
          <span class="settings-check-title">
            ${escapeHtml(check.label || check.id || "Check")}
            ${help}
          </span>
          <span class="settings-check-meta">
            <span class="settings-check-icon ${statusClass}" aria-hidden="true">${icon}</span>
          </span>
        </summary>
        <div class="settings-check-body">
          ${noteLine}
          ${reasonLine}
          ${recordSections}
          ${sourceSections}
        </div>
      </details>
    `;
  }).join("");
}

function syncSettingsJsonEditor() {
  const editor = document.getElementById("settings-json-editor");
  if (!editor) return;
  const payload = appState.settings.data ?? {};
  editor.value = JSON.stringify(payload, null, 2);
}

function syncSettingsForm() {
  const cfg = appState.settings.data || {};
  const openclaw = cfg.openclaw || {};
  const voice = cfg.voice || {};
  const server = cfg.server || {};
  const allowedRoots = Array.isArray(openclaw.allowedFileRoots) ? openclaw.allowedFileRoots.join("\n") : "";
  const homeInput = document.getElementById("settings-openclaw-home");
  const mediaInput = document.getElementById("settings-openclaw-media-dir");
  const hostInput = document.getElementById("settings-server-host");
  const portInput = document.getElementById("settings-server-port");
  const allowedRootsInput = document.getElementById("settings-allowed-file-roots");
  const voiceProviderInput = document.getElementById("settings-voice-provider");
  const voiceApiKeyEnvInput = document.getElementById("settings-voice-api-key-env");
  const voiceTranscribeModelInput = document.getElementById("settings-voice-transcribe-model");
  const voiceSpeechModelInput = document.getElementById("settings-voice-speech-model");
  const voiceDefaultVoiceInput = document.getElementById("settings-voice-default-voice");
  const voiceSpeechFormatInput = document.getElementById("settings-voice-speech-format");
  if (homeInput) homeInput.value = openclaw.home || "";
  if (mediaInput) mediaInput.value = openclaw.mediaDir || "";
  if (hostInput) hostInput.value = server.host || "";
  if (portInput) portInput.value = server.port ?? "";
  if (allowedRootsInput) allowedRootsInput.value = allowedRoots;
  if (voiceProviderInput) voiceProviderInput.value = voice.provider || "openai";
  if (voiceApiKeyEnvInput) voiceApiKeyEnvInput.value = voice.apiKeyEnv || "OPENAI_API_KEY";
  if (voiceTranscribeModelInput) voiceTranscribeModelInput.value = voice.transcribeModel || "gpt-4o-mini-transcribe";
  if (voiceSpeechModelInput) voiceSpeechModelInput.value = voice.speechModel || "gpt-4o-mini-tts";
  if (voiceDefaultVoiceInput) voiceDefaultVoiceInput.value = voice.defaultVoice || "nova";
  if (voiceSpeechFormatInput) voiceSpeechFormatInput.value = voice.speechFormat || "mp3";
}

function renderSettingsSummary() {
  const diagnostics = appState.settings.diagnostics;
  const runtime = diagnostics?.runtime || null;
  setText("settings-path", diagnostics?.settingsPath || "agent_world.json");
  setText("resolved-settings-path", diagnostics?.resolvedPaths?.settingsPath || diagnostics?.settingsPath || "--");
  setText(
    "settings-summary",
    appState.settings.loading
      ? "Loading..."
      : appState.settings.saving
        ? "Saving..."
        : runtime?.label || "Needs attention",
  );
  setText("settings-diagnostics-state", runtime?.label || "Needs attention");
  setText("openclaw-runtime-pill", runtime?.label || "OpenClaw --");
  applyRuntimeStatusTone("settings-diagnostics-state", runtime?.state);
  applyRuntimeStatusTone("openclaw-runtime-pill", runtime?.state);
  setText("resolved-openclaw-home", diagnostics?.resolvedPaths?.openclawHome || "--");
  setText("resolved-openclaw-config", diagnostics?.resolvedPaths?.openclawConfig || "--");
  setText("resolved-main-sessions", diagnostics?.resolvedPaths?.mainSessionsIndex || "--");
  setText("resolved-openclaw-media", diagnostics?.resolvedPaths?.openclawMediaDir || "--");
  renderSettingsChecks();
}

function collectSettingsPayload() {
  const allowedRootsText = document.getElementById("settings-allowed-file-roots")?.value || "";
  return {
    openclaw: {
      home: document.getElementById("settings-openclaw-home")?.value.trim() || "",
      mediaDir: document.getElementById("settings-openclaw-media-dir")?.value.trim() || "",
      allowedFileRoots: allowedRootsText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
    },
    voice: {
      provider: document.getElementById("settings-voice-provider")?.value.trim() || "openai",
      apiKeyEnv: document.getElementById("settings-voice-api-key-env")?.value.trim() || "OPENAI_API_KEY",
      transcribeModel: document.getElementById("settings-voice-transcribe-model")?.value.trim() || "gpt-4o-mini-transcribe",
      speechModel: document.getElementById("settings-voice-speech-model")?.value.trim() || "gpt-4o-mini-tts",
      defaultVoice: document.getElementById("settings-voice-default-voice")?.value.trim() || "nova",
      speechFormat: document.getElementById("settings-voice-speech-format")?.value.trim() || "mp3",
    },
    server: {
      host: document.getElementById("settings-server-host")?.value.trim() || "0.0.0.0",
      port: Number(document.getElementById("settings-server-port")?.value) || 8890,
    },
  };
}

async function fetchSettingsData() {
  appState.settings.loading = true;
  renderSettingsSummary();
  try {
    const [settings, diagnostics] = await Promise.all([
      getJson("/api/agent-world/settings"),
      getJson("/api/agent-world/settings/diagnostics"),
    ]);
    appState.settings.data = settings;
    appState.settings.diagnostics = diagnostics;
    syncSettingsForm();
    syncSettingsJsonEditor();
    renderSettingsSummary();
    setSettingsResult("");
  } catch (error) {
    setSettingsResult(`Settings load error: ${error?.message || String(error)}`, true);
  } finally {
    appState.settings.loading = false;
    renderSettingsSummary();
  }
}

async function saveSettings() {
  appState.settings.saving = true;
  renderSettingsSummary();
  try {
    const payload = collectSettingsPayload();
    const saved = await postJson("/api/agent-world/settings", payload);
    appState.settings.data = saved;
    await fetchSettingsData();
    await fetchVoiceConfig();
    setSettingsResult("Settings saved. Server host/port changes apply on the next restart.");
  } catch (error) {
    setSettingsResult(`Settings save error: ${error?.message || String(error)}`, true);
  } finally {
    appState.settings.saving = false;
    renderSettingsSummary();
  }
}

async function saveSettingsFromJsonEditor() {
  const editor = document.getElementById("settings-json-editor");
  if (!editor) return;
  appState.settings.saving = true;
  renderSettingsSummary();
  try {
    const raw = editor.value.trim();
    const payload = raw ? JSON.parse(raw) : {};
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Root settings payload must be a JSON object.");
    }
    const saved = await postJson("/api/agent-world/settings", payload);
    appState.settings.data = saved;
    syncSettingsForm();
    syncSettingsJsonEditor();
    await fetchSettingsData();
    await fetchVoiceConfig();
    setSettingsResult("Raw settings JSON saved.");
  } catch (error) {
    setSettingsResult(`Raw settings save error: ${error?.message || String(error)}`, true);
  } finally {
    appState.settings.saving = false;
    renderSettingsSummary();
  }
}

async function fetchVoiceConfig() {
  try {
    const config = await getJson("/api/agent-world/voice/config");
    appState.voice.backendConfigured = !!config?.configured;
    appState.voice.backendProvider = config?.provider || "openai";
    appState.voice.transcribeModel = config?.transcribeModel || "gpt-4o-mini-transcribe";
    appState.voice.speechModel = config?.speechModel || "gpt-4o-mini-tts";
    appState.voice.speechVoice = config?.defaultVoice || "nova";
    appState.voice.speechFormat = config?.speechFormat || "mp3";
    if (appState.voice.backendConfigured) {
      appState.voice.mode = "openai";
      pushVoiceEvent(`Voice backend ready via ${appState.voice.backendProvider}.`);
    } else {
      pushVoiceEvent("Voice backend unavailable. Falling back to browser voice APIs.");
    }
  } catch (error) {
    pushVoiceEvent(`Voice backend config failed: ${error?.message || String(error)}`);
  }
  updateVoiceUi();
}

function pushVoiceEvent(message) {
  const stamp = new Date().toLocaleTimeString();
  appState.voice.events = [`[${stamp}] ${message}`, ...appState.voice.events].slice(0, 8);
  setVoiceDebugText("voice-events", appState.voice.events.join("\n") || "No voice events yet.");
}

function renderVoiceTranscriptDebug() {
  const finalText = normalizeSpeechText(appState.voice.transcriptBuffer);
  const interimText = normalizeSpeechText(appState.voice.interimTranscript);
  if (!finalText && !interimText) {
    setVoiceDebugText("voice-transcript", "No transcript yet.");
    return;
  }
  const lines = [];
  if (finalText) lines.push(`Final: ${finalText}`);
  if (interimText) lines.push(`Interim: ${interimText}`);
  setVoiceDebugText("voice-transcript", lines.join("\n"));
}

function renderVoiceDebugUi() {
  setVoiceDebugText("voice-support", appState.voice.supportSummary || "Checking...");
  setVoiceDebugText("voice-recognition-state", appState.voice.recognitionState || "idle");
  setVoiceDebugText("voice-error", appState.voice.lastError || "None");
  const levelFill = document.getElementById("voice-level-fill");
  if (levelFill) levelFill.style.width = `${Math.max(0, Math.min(100, Math.round(appState.voice.micLevel * 100)))}%`;
  setVoiceDebugText(
    "voice-level-text",
    appState.voice.micStream
      ? `Live input level: ${Math.round(appState.voice.micLevel * 100)}%${appState.voice.currentInputLabel ? ` via ${appState.voice.currentInputLabel}` : ""}`
      : "No mic capture yet.",
  );
  const spokenSummary = appState.voice.lastSpokenText
    ? `${appState.voice.lastSpokenSource ? `[${appState.voice.lastSpokenSource}] ` : ""}${appState.voice.lastSpokenText}`
    : "Nothing queued for speech.";
  setVoiceDebugText("voice-spoken-text", spokenSummary);
  renderVoiceTranscriptDebug();
  setVoiceDebugText("voice-events", appState.voice.events.join("\n") || "No voice events yet.");
}

function updateVoiceUi() {
  const toggle = document.getElementById("voice-toggle");
  const stop = document.getElementById("voice-stop");
  const speakCurrent = document.getElementById("voice-speak-current");
  const autoSend = document.getElementById("voice-auto-send");
  const speakReplies = document.getElementById("voice-speak-replies");
  const inputSelect = document.getElementById("voice-input-select");
  if (toggle) {
    toggle.disabled = !(appState.voice.recordingSupported || appState.voice.supported);
    if (appState.voice.isTranscribing) toggle.textContent = "Transcribing...";
    else toggle.textContent = appState.voice.listening ? "Recording..." : "Start Mic";
  }
  if (stop) stop.disabled = !(appState.voice.listening || appState.voice.isSpeaking);
  if (speakCurrent) speakCurrent.disabled = !(appState.voice.backendConfigured || appState.voice.ttsSupported);
  if (autoSend) autoSend.checked = !!appState.voice.autoSend;
  if (speakReplies) speakReplies.checked = !!appState.voice.speakReplies;
  if (inputSelect) {
    const options = ['<option value="">System Default</option>'];
    for (const device of appState.voice.inputDevices) {
      const selected = device.deviceId === appState.voice.selectedInputDeviceId ? " selected" : "";
      options.push(`<option value="${device.deviceId}"${selected}>${device.label || "Unnamed input"}</option>`);
    }
    inputSelect.innerHTML = options.join("");
    inputSelect.value = appState.voice.selectedInputDeviceId || "";
    inputSelect.disabled = !appState.voice.meterSupported;
  }
  renderVoiceDebugUi();
}

function appendVoiceTranscript(text) {
  const input = document.getElementById("command-input");
  if (!input) return;
  const nextText = String(text || "").trim();
  if (!nextText) return;
  input.value = input.value.trim() ? `${input.value.trim()} ${nextText}` : nextText;
}

function normalizeSpeechText(text) {
  return String(text || "")
    .replace(/`+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stopSpeechPlayback() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (appState.voice.audioPlayer) {
    appState.voice.audioPlayer.pause();
    appState.voice.audioPlayer.src = "";
    appState.voice.audioPlayer = null;
  }
  if (appState.voice.audioObjectUrl) {
    URL.revokeObjectURL(appState.voice.audioObjectUrl);
    appState.voice.audioObjectUrl = "";
  }
  appState.voice.isSpeaking = false;
}

async function speakText(text, source = "manual") {
  const spoken = normalizeSpeechText(text);
  if (!spoken) {
    pushVoiceEvent("Speech synthesis skipped because no text was available.");
    setVoiceStatus("Nothing to speak yet.", true);
    return;
  }
  stopSpeechPlayback();
  appState.voice.lastSpokenText = spoken;
  appState.voice.lastSpokenSource = source;
  appState.voice.lastError = "";
  if (appState.voice.backendConfigured && appState.selectedAgentId) {
    try {
      pushVoiceEvent(`OpenAI speech queued from ${source}.`);
      appState.voice.isSpeaking = true;
      appState.voice.recognitionState = appState.voice.listening ? "recording + speaking" : "speaking";
      updateVoiceUi();
      setVoiceStatus("Generating speech...");
      const response = await fetch(`/api/agent-world/agents/${encodeURIComponent(appState.selectedAgentId)}/voice/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: spoken,
          voice: appState.voice.speechVoice,
          model: appState.voice.speechModel,
          format: appState.voice.speechFormat,
        }),
      });
      if (!response.ok) throw new Error(`speech request failed: ${response.status}`);
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      appState.voice.audioObjectUrl = audioUrl;
      const audio = new Audio(audioUrl);
      appState.voice.audioPlayer = audio;
      audio.onplay = () => {
        appState.voice.isSpeaking = true;
        appState.voice.recognitionState = appState.voice.listening ? "recording + speaking" : "speaking";
        pushVoiceEvent(`OpenAI speech started from ${source}.`);
        updateVoiceUi();
        setVoiceStatus("Speaking selected message.");
      };
      audio.onended = () => {
        stopSpeechPlayback();
        appState.voice.recognitionState = appState.voice.listening ? "recording" : "idle";
        pushVoiceEvent(`OpenAI speech finished from ${source}.`);
        updateVoiceUi();
        setVoiceStatus(appState.voice.listening ? "Recording..." : "Voice idle.");
      };
      audio.onerror = () => {
        stopSpeechPlayback();
        appState.voice.lastError = "OpenAI speech playback failed.";
        appState.voice.recognitionState = appState.voice.listening ? "recording" : "idle";
        pushVoiceEvent(`OpenAI speech failed from ${source}.`);
        updateVoiceUi();
        setVoiceStatus("Speech playback failed.", true);
      };
      await audio.play();
      renderVoiceDebugUi();
      return;
    } catch (error) {
      appState.voice.lastError = error?.message || String(error);
      pushVoiceEvent(`OpenAI speech failed, falling back to browser TTS: ${appState.voice.lastError}`);
      stopSpeechPlayback();
      updateVoiceUi();
    }
  }

  if (!appState.voice.ttsSupported) {
    appState.voice.lastError = "Speech synthesis is not supported in this browser.";
    pushVoiceEvent("Speech synthesis unavailable.");
    renderVoiceDebugUi();
    setVoiceStatus("Speech playback is not supported in this browser.", true);
    return;
  }

  pushVoiceEvent(`Speech synthesis queued from ${source}.`);
  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onstart = () => {
    appState.voice.isSpeaking = true;
    appState.voice.recognitionState = appState.voice.listening ? "recording + speaking" : "speaking";
    pushVoiceEvent(`Speech synthesis started from ${source}.`);
    updateVoiceUi();
    setVoiceStatus("Speaking selected message.");
  };
  utterance.onend = () => {
    stopSpeechPlayback();
    appState.voice.recognitionState = appState.voice.listening ? "recording" : "idle";
    pushVoiceEvent(`Speech synthesis finished from ${source}.`);
    updateVoiceUi();
    setVoiceStatus(appState.voice.listening ? "Recording..." : "Voice idle.");
  };
  utterance.onerror = () => {
    stopSpeechPlayback();
    appState.voice.lastError = "Speech playback failed.";
    appState.voice.recognitionState = appState.voice.listening ? "recording" : "idle";
    pushVoiceEvent(`Speech synthesis failed from ${source}.`);
    updateVoiceUi();
    setVoiceStatus("Speech playback failed.", true);
  };
  window.speechSynthesis.speak(utterance);
  renderVoiceDebugUi();
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
  if (!appState.voice.speakReplies || !("speechSynthesis" in window)) return;
  const latestAssistant = [...(history || [])].reverse().find((event) => historyRoleClass(event.type) === "assistant");
  if (!latestAssistant) return;
  const spokenText = normalizeSpeechText(latestAssistant.fullLabel || latestAssistant.label || latestAssistant.fullDetail || latestAssistant.detail);
  if (!spokenText) return;
  if (latestAssistant.type === "tool_started" || latestAssistant.type === "tool_finished") return;
  if (spokenText === "NO_REPLY" || spokenText.startsWith("HEARTBEAT_OK")) return;
  const signature = `${latestAssistant.id || ""}:${latestAssistant.ts || ""}:${spokenText}`;
  if (signature === appState.voice.lastSpokenSignature) return;
  if (appState.voice.spokenReplySignatures.includes(signature)) return;
  appState.voice.lastSpokenSignature = signature;
  appState.voice.spokenReplySignatures = [...appState.voice.spokenReplySignatures, signature].slice(-40);
  speakText(spokenText, "agent-reply");
}

function stopMicMeter() {
  if (appState.voice.meterFrame) {
    cancelAnimationFrame(appState.voice.meterFrame);
    appState.voice.meterFrame = 0;
  }
  if (appState.voice.audioContext) {
    appState.voice.audioContext.close().catch(() => {});
    appState.voice.audioContext = null;
  }
  if (appState.voice.micStream) {
    for (const track of appState.voice.micStream.getTracks()) track.stop();
    appState.voice.micStream = null;
  }
  appState.voice.analyser = null;
  appState.voice.analyserData = null;
  appState.voice.micLevel = 0;
  appState.voice.currentInputLabel = "";
  renderVoiceDebugUi();
}

async function transcribeRecordedAudio(blob) {
  if (!blob || !appState.selectedAgentId) return;
  appState.voice.isTranscribing = true;
  appState.voice.recognitionState = "transcribing";
  appState.voice.lastError = "";
  updateVoiceUi();
  setVoiceStatus("Uploading audio for transcription...");
  try {
    const form = new FormData();
    form.append("file", blob, `voice.${appState.voice.recordingMimeType.includes("ogg") ? "ogg" : "webm"}`);
    form.append("model", appState.voice.transcribeModel);
    const response = await fetch(`/api/agent-world/agents/${encodeURIComponent(appState.selectedAgentId)}/voice/transcribe`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      let detail = `transcription failed: ${response.status}`;
      try {
        const payload = await response.json();
        detail = payload?.detail?.reason || payload?.detail?.detail || detail;
      } catch {}
      throw new Error(detail);
    }
    const payload = await response.json();
    const transcript = normalizeSpeechText(payload?.text || "");
    appState.voice.transcriptBuffer = transcript;
    appState.voice.interimTranscript = "";
    pushVoiceEvent("OpenAI transcription completed.");
    renderVoiceDebugUi();
    if (transcript) {
      const input = document.getElementById("command-input");
      if (input) input.value = transcript;
    }
    if (appState.voice.autoSend && transcript) {
      setVoiceStatus("Sending transcript...");
      const sent = await sendCommandText(transcript);
      if (sent) {
        const input = document.getElementById("command-input");
        if (input) input.value = "";
        appState.voice.transcriptBuffer = "";
        renderVoiceDebugUi();
        setVoiceStatus("Transcript sent.");
      }
    } else {
      setVoiceStatus(transcript ? "Transcript captured." : "No speech detected.");
    }
  } catch (error) {
    appState.voice.lastError = error?.message || String(error);
    pushVoiceEvent(`OpenAI transcription failed: ${appState.voice.lastError}`);
    setVoiceStatus(`Voice transcription failed: ${appState.voice.lastError}`, true);
  } finally {
    appState.voice.isTranscribing = false;
    appState.voice.listening = false;
    appState.voice.recognitionState = appState.voice.isSpeaking ? "speaking" : "idle";
    stopMicMeter();
    updateVoiceUi();
  }
}

async function refreshVoiceInputDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    appState.voice.inputDevices = devices
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Audio Input ${index + 1}`,
      }));
    if (appState.voice.selectedInputDeviceId && !appState.voice.inputDevices.some((device) => device.deviceId === appState.voice.selectedInputDeviceId)) {
      appState.voice.selectedInputDeviceId = "";
      setStoredMap(TILEMAP_STORAGE_KEYS.voiceInputDeviceId, "");
    }
    updateVoiceUi();
  } catch (error) {
    pushVoiceEvent(`Input device scan failed: ${error?.message || String(error)}`);
  }
}

function startMicMeterLoop() {
  const analyser = appState.voice.analyser;
  const data = appState.voice.analyserData;
  if (!analyser || !data) return;
  analyser.getByteTimeDomainData(data);
  let peak = 0;
  let sumSquares = 0;
  for (let index = 0; index < data.length; index += 1) {
    const normalized = Math.abs((data[index] - 128) / 128);
    sumSquares += normalized * normalized;
    if (normalized > peak) peak = normalized;
  }
  const rms = Math.sqrt(sumSquares / data.length);
  const boostedLevel = Math.max(peak * 3.5, rms * 9);
  appState.voice.micLevel = Math.max(appState.voice.micLevel * 0.72, Math.min(1, boostedLevel));
  renderVoiceDebugUi();
  appState.voice.meterFrame = requestAnimationFrame(startMicMeterLoop);
}

async function ensureMicMeter() {
  if (appState.voice.micStream && appState.voice.audioContext && appState.voice.analyser) return true;
  if (!appState.voice.meterSupported) {
    pushVoiceEvent("Microphone meter unavailable in this browser.");
    return false;
  }
  try {
    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };
    if (appState.voice.selectedInputDeviceId) {
      audioConstraints.deviceId = { exact: appState.voice.selectedInputDeviceId };
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
    });
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextCtor();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    appState.voice.micStream = stream;
    appState.voice.audioContext = audioContext;
    appState.voice.analyser = analyser;
    appState.voice.analyserData = new Uint8Array(analyser.frequencyBinCount);
    const activeTrack = stream.getAudioTracks()[0];
    const activeSettings = activeTrack?.getSettings?.() || {};
    const activeDeviceId = activeSettings.deviceId || "";
    const matchedDevice = appState.voice.inputDevices.find((device) => device.deviceId === activeDeviceId);
    appState.voice.currentInputLabel = matchedDevice?.label || activeTrack?.label || "";
    if (activeDeviceId && activeDeviceId !== appState.voice.selectedInputDeviceId) {
      appState.voice.selectedInputDeviceId = activeDeviceId;
      setStoredMap(TILEMAP_STORAGE_KEYS.voiceInputDeviceId, activeDeviceId);
    }
    pushVoiceEvent("Microphone meter connected.");
    if (appState.voice.currentInputLabel) pushVoiceEvent(`Active input: ${appState.voice.currentInputLabel}`);
    await refreshVoiceInputDevices();
    startMicMeterLoop();
    return true;
  } catch (error) {
    appState.voice.lastError = error?.message || String(error);
    pushVoiceEvent(`Microphone meter failed: ${appState.voice.lastError}`);
    updateVoiceUi();
    setVoiceStatus(`Microphone access failed: ${appState.voice.lastError}`, true);
    return false;
  }
}

function stopVoiceCapture() {
  if (appState.voice.isSpeaking) {
    stopSpeechPlayback();
    appState.voice.recognitionState = appState.voice.listening ? "recording" : "idle";
    updateVoiceUi();
    setVoiceStatus(appState.voice.listening ? "Recording..." : "Voice idle.");
  }
  if (appState.voice.mediaRecorder && appState.voice.mediaRecorder.state !== "inactive") {
    try {
      pushVoiceEvent("Recording stop requested.");
      appState.voice.mediaRecorder.stop();
    } catch (error) {
      appState.voice.lastError = error?.message || String(error);
      pushVoiceEvent(`Recording stop failed: ${appState.voice.lastError}`);
      stopMicMeter();
      updateVoiceUi();
      setVoiceStatus(`Voice stop failed: ${appState.voice.lastError}`, true);
    }
    return;
  }
  if (appState.voice.recognition && appState.voice.listening) {
    try {
      pushVoiceEvent("Stop requested.");
      appState.voice.recognition.stop();
    } catch (error) {
      appState.voice.lastError = error?.message || String(error);
      pushVoiceEvent(`Stop failed: ${appState.voice.lastError}`);
      updateVoiceUi();
      setVoiceStatus(`Voice stop failed: ${appState.voice.lastError}`, true);
    }
  }
}

async function startVoiceCapture() {
  if (!appState.selectedAgentId) {
    setVoiceStatus("Select an agent before starting voice mode.", true);
    return;
  }
  if (appState.voice.backendConfigured && appState.voice.recordingSupported) {
    appState.voice.transcriptBuffer = "";
    appState.voice.interimTranscript = "";
    appState.voice.lastError = "";
    renderVoiceDebugUi();
    const ready = await ensureMicMeter();
    if (!ready || !appState.voice.micStream) return;
    try {
      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/webm",
      ];
      const mimeType = preferredMimeTypes.find((candidate) => window.MediaRecorder?.isTypeSupported?.(candidate)) || "";
      appState.voice.recordingMimeType = mimeType || "audio/webm";
      appState.voice.recordedChunks = [];
      const recorder = mimeType ? new MediaRecorder(appState.voice.micStream, { mimeType }) : new MediaRecorder(appState.voice.micStream);
      appState.voice.mediaRecorder = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) appState.voice.recordedChunks.push(event.data);
      };
      recorder.onstart = () => {
        appState.voice.listening = true;
        appState.voice.recognitionState = "recording";
        pushVoiceEvent("Recording started.");
        updateVoiceUi();
        setVoiceStatus("Recording voice...");
      };
      recorder.onerror = (event) => {
        appState.voice.lastError = event?.error?.message || "recording error";
        appState.voice.listening = false;
        pushVoiceEvent(`Recording error: ${appState.voice.lastError}`);
        stopMicMeter();
        updateVoiceUi();
        setVoiceStatus(`Voice input error: ${appState.voice.lastError}`, true);
      };
      recorder.onstop = async () => {
        const blob = new Blob(appState.voice.recordedChunks, {
          type: appState.voice.recordingMimeType || "audio/webm",
        });
        appState.voice.mediaRecorder = null;
        appState.voice.recordedChunks = [];
        pushVoiceEvent("Recording stopped.");
        if (blob.size > 0) await transcribeRecordedAudio(blob);
        else {
          appState.voice.listening = false;
          stopMicMeter();
          updateVoiceUi();
          setVoiceStatus("No audio captured.", true);
        }
      };
      recorder.start();
      return;
    } catch (error) {
      appState.voice.lastError = error?.message || String(error);
      pushVoiceEvent(`Recording start failed: ${appState.voice.lastError}`);
      stopMicMeter();
      updateVoiceUi();
      setVoiceStatus(`Voice start failed: ${appState.voice.lastError}`, true);
      return;
    }
  }

  if (!appState.voice.recognition) {
    pushVoiceEvent("Start requested but recognition is unavailable.");
    setVoiceStatus("Speech recognition is not available in this browser.", true);
    return;
  }
  appState.voice.transcriptBuffer = "";
  appState.voice.interimTranscript = "";
  appState.voice.lastError = "";
  renderVoiceDebugUi();
  await ensureMicMeter();
  try {
    pushVoiceEvent("Recognition start requested.");
    appState.voice.recognition.start();
  } catch (error) {
    appState.voice.lastError = error?.message || String(error);
    appState.voice.recognitionState = "start failed";
    pushVoiceEvent(`Recognition start failed: ${appState.voice.lastError}`);
    updateVoiceUi();
    setVoiceStatus(`Voice start failed: ${appState.voice.lastError}`, true);
  }
}

function initVoiceControls() {
  const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  appState.voice.recordingSupported = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  appState.voice.ttsSupported = "speechSynthesis" in window;
  appState.voice.supported = typeof RecognitionCtor === "function";
  appState.voice.meterSupported = !!(navigator.mediaDevices?.getUserMedia && AudioContextCtor);
  const browserHints = [];
  if (!window.isSecureContext) browserHints.push("not a secure context");
  if (!appState.voice.supported) browserHints.push("speech recognition API missing");
  if (!appState.voice.ttsSupported) browserHints.push("speech synthesis API missing");
  if (!appState.voice.meterSupported) browserHints.push("mic meter API missing");
  if (!appState.voice.recordingSupported) browserHints.push("media recorder API missing");
  appState.voice.supportSummary = [
    appState.voice.recordingSupported ? "recording available" : "recording unavailable",
    appState.voice.supported ? "recognition available" : "recognition unavailable",
    appState.voice.meterSupported ? "mic meter available" : "mic meter unavailable",
    appState.voice.ttsSupported ? "speech output available" : "speech output unavailable",
    window.isSecureContext ? "secure context" : "insecure context",
    ...browserHints,
  ].join(" | ");
  appState.voice.selectedInputDeviceId = getStoredMap(TILEMAP_STORAGE_KEYS.voiceInputDeviceId, "");
  pushVoiceEvent("Voice controls initialized.");
  updateVoiceUi();
  refreshVoiceInputDevices();
  fetchVoiceConfig();
  if (!appState.voice.recordingSupported && !appState.voice.supported) {
    setVoiceStatus("Voice input is unavailable here. Try a Chromium-based browser.", true);
    return;
  }
  if (!appState.voice.supported) {
    setVoiceStatus(appState.voice.backendConfigured ? "OpenAI voice recording ready." : "Voice input is unavailable here. Try a Chromium-based browser.", !appState.voice.backendConfigured);
    return;
  }
  const recognition = new RecognitionCtor();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  appState.voice.recognition = recognition;

  recognition.onstart = () => {
    appState.voice.listening = true;
    appState.voice.recognitionState = "listening";
    appState.voice.draftBeforeListening = document.getElementById("command-input")?.value.trim() || "";
    appState.voice.lastError = "";
    pushVoiceEvent("Recognition started.");
    updateVoiceUi();
    setVoiceStatus("Listening for speech...");
  };
  recognition.onend = async () => {
    appState.voice.listening = false;
    appState.voice.recognitionState = "idle";
    appState.voice.interimTranscript = "";
    stopMicMeter();
    pushVoiceEvent("Recognition ended.");
    updateVoiceUi();
    const finalDraft = normalizeSpeechText(`${appState.voice.draftBeforeListening} ${appState.voice.transcriptBuffer}`);
    if (finalDraft) {
      const input = document.getElementById("command-input");
      if (input) input.value = finalDraft;
    }
    if (appState.voice.autoSend && finalDraft) {
      setVoiceStatus("Sending transcript...");
      const sent = await sendCommandText(finalDraft);
      if (sent) {
        const input = document.getElementById("command-input");
        if (input) input.value = "";
        appState.voice.transcriptBuffer = "";
        appState.voice.draftBeforeListening = "";
        appState.voice.interimTranscript = "";
        pushVoiceEvent("Transcript auto-sent.");
        renderVoiceDebugUi();
        setVoiceStatus("Transcript sent.");
        return;
      }
    }
    setVoiceStatus("Voice idle.");
  };
  recognition.onerror = (event) => {
    appState.voice.listening = false;
    appState.voice.recognitionState = `error: ${event.error || "unknown"}`;
    appState.voice.lastError = event.error || "unknown";
    stopMicMeter();
    pushVoiceEvent(`Recognition error: ${appState.voice.lastError}`);
    updateVoiceUi();
    setVoiceStatus(`Voice input error: ${event.error || "unknown"}.`, true);
  };
  recognition.onresult = async (event) => {
    let finalTranscript = "";
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result?.[0]?.transcript || "";
      if (result.isFinal) finalTranscript += `${transcript} `;
      else interimTranscript += `${transcript} `;
    }
    const combined = normalizeSpeechText(`${appState.voice.transcriptBuffer} ${finalTranscript}`);
    if (combined) appState.voice.transcriptBuffer = combined;
    appState.voice.interimTranscript = normalizeSpeechText(interimTranscript);
    const preview = normalizeSpeechText(`${appState.voice.draftBeforeListening} ${combined} ${interimTranscript}`);
    if (preview) {
      const input = document.getElementById("command-input");
      if (input) input.value = preview;
    }
    pushVoiceEvent(finalTranscript.trim() ? "Recognition produced final transcript." : "Recognition produced interim transcript.");
    renderVoiceDebugUi();
    if (finalTranscript.trim()) {
      setVoiceStatus(appState.voice.autoSend ? "Transcript captured. Sending..." : "Transcript captured.");
    }
  };
  recognition.onaudiostart = () => {
    appState.voice.recognitionState = "hearing audio";
    pushVoiceEvent("Audio capture started.");
    updateVoiceUi();
  };
  recognition.onsoundstart = () => {
    appState.voice.recognitionState = "sound detected";
    pushVoiceEvent("Sound detected.");
    updateVoiceUi();
  };
  recognition.onspeechstart = () => {
    appState.voice.recognitionState = "speech detected";
    pushVoiceEvent("Speech detected.");
    updateVoiceUi();
  };
  recognition.onspeechend = () => {
    pushVoiceEvent("Speech ended.");
    updateVoiceUi();
  };
  recognition.onaudioend = () => {
    pushVoiceEvent("Audio capture ended.");
    updateVoiceUi();
  };
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
  appState.messageSelection = {
    locked,
    kind: kind || "detail",
    title: title || "--",
    body: body || "--",
    path: path || null,
  };
}

function fileUrl(path) {
  return `/api/agent-world/file?path=${encodeURIComponent(path)}`;
}

function cleanPath(text) {
  return text.replace(/[\\.,:;)\]>`"']+$/g, "");
}

function extractPaths(...parts) {
  const out = [];
  for (const part of parts) {
    for (const match of String(part || "").match(PATH_RE) || []) {
      const cleaned = cleanPath(match);
      if (!out.includes(cleaned)) out.push(cleaned);
    }
  }
  return out;
}

function classifyPath(path) {
  const lower = path.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(lower)) return "image";
  if (/\.(mp4|mov|webm)$/.test(lower)) return "video";
  if (/\.pdf$/.test(lower)) return "pdf";
  if (/\.(txt|md|json|jsonl|log)$/.test(lower)) return "text";
  return "file";
}

function createText(text, style) {
  return new PIXI.Text(text, style);
}

function stripControlTags(text) {
  return String(text || "").replace(/\[\[[^\]]+\]\]/g, "");
}

function displayActionText(text) {
  const cleaned = stripControlTags(text)
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Idle";
}

function formatInlineRichText(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function formatRichTextHtml(text) {
  const source = stripControlTags(text).replace(/\r/g, "").trim();
  if (!source) return "--";
  const blocks = [];
  const parts = source.split(/```/);
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (index % 2 === 1) {
      blocks.push(`<pre class="rich-code"><code>${escapeHtml(part.replace(/^\n+|\n+$/g, ""))}</code></pre>`);
      continue;
    }
    for (const chunk of part.split(/\n{2,}/)) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      const lines = trimmed.split("\n");
      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        blocks.push(`<ul class="rich-list">${lines.map((line) => `<li>${formatInlineRichText(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`);
      } else {
        blocks.push(`<p>${lines.map((line) => formatInlineRichText(line)).join("<br>")}</p>`);
      }
    }
  }
  return blocks.join("");
}

function renderRichText(target, text) {
  if (!target) return;
  target.innerHTML = formatRichTextHtml(text);
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
  return isIdleLikeAgent(agent)
    ? "lounge"
    : agent.targetAnchor || agent.currentAnchor || "lounge";
}

function roomGoalTile(anchorId, startTile = null) {
  const region = regionForAnchor(anchorId);
  if (region?.cells?.length && startTile) {
    const center = regionCenter(region);
    const candidates = [];
    for (const cell of region.cells) {
      if (!isWalkable(cell.row, cell.col)) continue;
      const path = findPath(startTile, cell);
      if (!path.length) continue;
      const isSeat = SEAT_FURNITURE_TILES.has(furnitureTokenAt(cell.row, cell.col));
      const centerDistance = center
        ? Math.abs(cell.row - center.row) + Math.abs(cell.col - center.col)
        : 0;
      candidates.push({
        cell,
        pathLength: path.length,
        isSeat,
        centerDistance,
      });
    }
    if (candidates.length) {
      candidates.sort((a, b) => {
        if (a.isSeat !== b.isSeat) return a.isSeat ? -1 : 1;
        if (a.centerDistance !== b.centerDistance) return a.centerDistance - b.centerDistance;
        return a.pathLength - b.pathLength;
      });
      return candidates[0].cell;
    }
  }
  const anchor = getAnchorTile(anchorId);
  return nearestWalkableTile(anchor.row, anchor.col);
}

function roomWaypointTiles(anchorId, startTile = null) {
  const region = regionForAnchor(anchorId);
  if (!region?.cells?.length) return [];
  const regionCellKeys = new Set(region.cells.map((cell) => `${cell.row}:${cell.col}`));
  const points = [];
  const seen = new Set();
  const pushPoint = (row, col, type, label) => {
    if (!inBounds(row, col) || !isWalkable(row, col)) return;
    const key = `${row}:${col}`;
    if (seen.has(key)) return;
    if (regionCellKeys.size && !regionCellKeys.has(key)) return;
    if (startTile) {
      const path = findPath(startTile, { row, col });
      if (!path.length) return;
    }
    seen.add(key);
    points.push({ row, col, type, label });
  };

  for (const cell of region.cells) {
    const furnitureToken = furnitureTokenAt(cell.row, cell.col);
    if (SEAT_FURNITURE_TILES.has(furnitureToken)) {
      pushPoint(cell.row, cell.col, "seat", furnitureToken);
    }
    for (const landmark of ROOM_LANDMARK_TOKENS) {
      const token = landmark.layer === "prop" ? propTokenAt(cell.row, cell.col) : furnitureToken;
      if (token === landmark.token) {
        const offset = landmark.offset || { row: 1, col: 0 };
        pushPoint(cell.row + offset.row, cell.col + offset.col, "landmark", landmark.label);
      }
    }
  }

  if (!points.length) {
    const center = regionCenter(region);
    if (center) pushPoint(Math.round(center.row), Math.round(center.col), "center", "center");
  }
  return points;
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
  const anchor = agent.targetAnchor || agent.currentAnchor || "lounge";
  const base = getAnchorTile(anchor);
  const slot = agent.slotIndex || 0;
  const columnOffset = ((slot % 3) - 1) * 18;
  const rowOffset = Math.floor(slot / 3) * 16;
  return {
    x: base.col * TILE_SIZE + TILE_SIZE / 2 + columnOffset,
    y: base.row * TILE_SIZE + TILE_SIZE - 4 + rowOffset,
  };
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
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE - 2,
  };
}

function tileFromWorldPoint(x, y) {
  const col = Math.round((x - TILE_SIZE / 2) / TILE_SIZE);
  const row = Math.round((y - (TILE_SIZE - 2)) / TILE_SIZE);
  return nearestWalkableTile(
    Math.max(0, Math.min(getWorldRows() - 1, row)),
    Math.max(0, Math.min(getWorldCols() - 1, col)),
  );
}

function inBounds(row, col) {
  return row >= 0 && col >= 0 && row < getWorldRows() && col < getWorldCols();
}

function isWalkable(row, col) {
  return Boolean(appState.tilemap?.walkableGrid?.[row]?.[col]);
}

function nearestWalkableTile(row, col) {
  if (isWalkable(row, col)) return { row, col };
  const visited = new Set([`${row}:${col}`]);
  const queue = [{ row, col }];
  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  while (queue.length) {
    const current = queue.shift();
    for (const [dr, dc] of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      const key = `${nr}:${nc}`;
      if (!inBounds(nr, nc) || visited.has(key)) continue;
      if (isWalkable(nr, nc)) return { row: nr, col: nc };
      visited.add(key);
      queue.push({ row: nr, col: nc });
    }
  }
  return { row, col };
}

function goalTileForAgent(agent, startTile = null) {
  return roomGoalTile(agent.targetAnchor || agent.currentAnchor || "lounge", startTile);
}

function currentTileForAgent(agent) {
  const anchor = getAnchorTile(agent.currentAnchor || agent.targetAnchor || "lounge");
  return nearestWalkableTile(anchor.row, anchor.col);
}

function findPath(startTile, goalTile) {
  if (!startTile || !goalTile) return [];
  const startKey = `${startTile.row}:${startTile.col}`;
  const goalKey = `${goalTile.row}:${goalTile.col}`;
  if (startKey === goalKey) return [startTile];
  const queue = [startTile];
  const seen = new Set([startKey]);
  const cameFrom = new Map();
  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  while (queue.length) {
    const current = queue.shift();
    for (const [dr, dc] of dirs) {
      const next = { row: current.row + dr, col: current.col + dc };
      const key = `${next.row}:${next.col}`;
      if (!inBounds(next.row, next.col) || seen.has(key) || !isWalkable(next.row, next.col)) continue;
      cameFrom.set(key, current);
      if (key === goalKey) {
        const path = [next];
        let cursor = current;
        while (cursor) {
          path.push(cursor);
          const parent = cameFrom.get(`${cursor.row}:${cursor.col}`);
          cursor = parent || null;
        }
        return path.reverse();
      }
      seen.add(key);
      queue.push(next);
    }
  }
  return [];
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
  const frames = renderer?.assets?.spriteFrames?.[agent?.spriteSeed];
  return frames || renderer.assets.frames;
}

function getAnimationFrames(renderer, agent, visualState) {
  const frames = spriteFramesForAgent(renderer, agent);
  if (visualState === "reading") return [frames.read_0, frames.read_1];
  if (visualState === "working" || visualState === "writing" || visualState === "messaging") return [frames.work_0, frames.work_1];
  if (visualState === "blocked" && frames.shocked_0) return [frames.shocked_0, frames.shocked_1 || frames.shocked_0];
  if ((visualState === "waiting" || visualState === "idle") && frames.rest_0) return [frames.rest_0, frames.rest_1 || frames.rest_0];
  return [frames.idle_0, frames.idle_1];
}

function collectFrameSequence(frames, prefix) {
  const sequence = [];
  for (let index = 0; index < 8; index += 1) {
    const texture = frames[`${prefix}_${index}`];
    if (!texture) break;
    sequence.push(texture);
  }
  return sequence;
}

function directionalIdleFrames(renderer, agent, facing) {
  const frames = spriteFramesForAgent(renderer, agent);
  if (facing === "up" && frames.idle_up) return [frames.idle_up];
  if (facing === "left" && frames.idle_left) return [frames.idle_left];
  if (facing === "right" && frames.idle_right) return [frames.idle_right];
  if ((facing === "left" || facing === "right") && frames.idle_side) return [frames.idle_side];
  if (frames.idle_down) return [frames.idle_down];
  return getAnimationFrames(renderer, agent, "idle");
}

function directionalWalkFrames(renderer, agent, facing) {
  const frames = spriteFramesForAgent(renderer, agent);
  if (facing === "up") {
    const sequence = collectFrameSequence(frames, "walk_up");
    if (sequence.length) return sequence;
  }
  if (facing === "left") {
    const sequence = collectFrameSequence(frames, "walk_left");
    if (sequence.length) return sequence;
  }
  if (facing === "right") {
    const sequence = collectFrameSequence(frames, "walk_right");
    if (sequence.length) return sequence;
  }
  if ((facing === "left" || facing === "right")) {
    const sequence = collectFrameSequence(frames, "walk_side");
    if (sequence.length) return sequence;
  }
  {
    const sequence = collectFrameSequence(frames, "walk_down");
    if (sequence.length) return sequence;
  }
  return collectFrameSequence(frames, "walk");
}

function shouldMirrorSpriteForFacing(renderer, agent, facing) {
  if (facing !== "left") return false;
  const frames = spriteFramesForAgent(renderer, agent);
  if (frames.idle_left || frames.walk_left_0) return false;
  return Boolean(frames.idle_side || frames.walk_side_0);
}

async function loadArtAssets() {
  const [luccaAtlasMeta, roboAtlasMeta] = await Promise.all([
    getJson("/agent-world-static/assets/sprites/lucca_atlas.json"),
    getJson("/agent-world-static/assets/sprites/robo_atlas.json"),
  ]);
  const [luccaAtlasTexture, roboAtlasTexture] = await Promise.all([
    PIXI.Assets.load("/agent-world-static/assets/sprites/lucca_atlas.png"),
    PIXI.Assets.load("/agent-world-static/robo.png"),
  ]);
  const manifest = await getJson("/agent-world-static/assets/tiles/office_world/manifest.json");
  const layout = defaultLayoutConfig({});
  let persistedGameState = null;
  try {
    persistedGameState = await getJson("/api/agent-world/game-state");
  } catch (error) {
    console.warn("Falling back to static agent world assets.", error);
  }
  const fallbackGameState = {
    [TILEMAP_STORAGE_KEYS.floor]: "",
    [TILEMAP_STORAGE_KEYS.wall]: "",
    [TILEMAP_STORAGE_KEYS.furniture]: "",
    [TILEMAP_STORAGE_KEYS.prop]: "",
    [TILEMAP_STORAGE_KEYS.roomRegions]: JSON.stringify([], null, 2),
    [TILEMAP_STORAGE_KEYS.stash]: JSON.stringify({ col: 15, row: 14 }, null, 2),
    [TILEMAP_STORAGE_KEYS.chatBubbleFrame]: JSON.stringify(DEFAULT_CHAT_BUBBLE_FRAME, null, 2),
    "agent-world-layout-config": JSON.stringify(defaultLayoutConfig(layout), null, 2),
    "agent-world-movement-overrides": JSON.stringify({ agents: {} }, null, 2),
  };
  const resolvedGameState = persistedGameState && typeof persistedGameState === "object" ? persistedGameState : fallbackGameState;
  const snapshot = structuredSnapshotFromGameState(resolvedGameState, layout);
  writeGameStateToLocalStorage(snapshot.raw, false);
  const floorText = snapshot.floorText;
  const wallText = snapshot.wallText;
  const furnitureText = snapshot.furnitureText;
  const propText = snapshot.propText;
  const roomRegions = snapshot.roomRegions;
  const stash = snapshot.stash;
  appState.chatBubbleThemes = snapshot.chatBubbleThemes;
  applyChatBubbleFrameStyles();

  const buildSpriteFrames = (atlasMeta, atlasTexture) => {
    const frames = {};
    for (const [name, frame] of Object.entries(atlasMeta.frames || {})) {
      frames[name] = new PIXI.Texture(
        atlasTexture.baseTexture || atlasTexture,
        new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h),
      );
    }
    return frames;
  };
  const spriteFrames = {
    "lucca-default": buildSpriteFrames(luccaAtlasMeta, luccaAtlasTexture),
    "robo-default": buildSpriteFrames(roboAtlasMeta, roboAtlasTexture),
  };

  return {
    frames: spriteFrames["lucca-default"],
    spriteFrames,
    spriteAtlasMeta: {
      "lucca-default": luccaAtlasMeta,
      "robo-default": roboAtlasMeta,
    },
    spriteAtlasPaths: {
      "lucca-default": "/agent-world-static/assets/sprites/lucca_atlas.png",
      "robo-default": "/agent-world-static/assets/sprites/robo_atlas.png",
    },
    tileManifest: manifest,
    layout: snapshot.layout,
    gameStateRaw: snapshot.raw,
    floorText,
    wallText,
    furnitureText,
    propText,
    roomRegions,
    stash,
  };
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
  const g = new PIXI.Graphics();
  if (primitiveName === "wall") {
    g.beginFill(0xf2efe7);
    g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.endFill();
    g.lineStyle(2, 0x3c3540, 1);
    g.moveTo(0, 2);
    g.lineTo(TILE_SIZE, 2);
    g.moveTo(0, TILE_SIZE - 2);
    g.lineTo(TILE_SIZE, TILE_SIZE - 2);
  } else {
    g.beginFill(0xf2efe7);
    g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.endFill();
    g.beginFill(0x7f5a31);
    g.drawRect(8, 2, TILE_SIZE - 16, TILE_SIZE - 4);
    g.endFill();
    g.lineStyle(2, 0x4f3518, 1);
    g.drawRect(8, 2, TILE_SIZE - 16, TILE_SIZE - 4);
    g.beginFill(0xe6c676);
    g.drawCircle(TILE_SIZE - 11, TILE_SIZE / 2, 2);
    g.endFill();
  }
  const texture = pixiApp.renderer.generateTexture(g, { resolution: 1, region: new PIXI.Rectangle(0, 0, TILE_SIZE, TILE_SIZE) });
  texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  g.destroy();
  return texture;
}

async function buildTileTextures(pixiApp, manifest) {
  const atlasPaths = [...new Set(Object.values(manifest).filter((entry) => entry.atlasPath).map((entry) => entry.atlasPath))];
  const atlasCache = {};
  await Promise.all(atlasPaths.map(async (atlasPath) => {
    const texture = await PIXI.Assets.load(atlasPath);
    const baseTexture = texture.baseTexture || texture;
    baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    atlasCache[atlasPath] = baseTexture;
  }));

  const textures = {};
  const primitives = {};
  for (const [code, entry] of Object.entries(manifest)) {
    if (entry.primitive) {
      if (!primitives[entry.primitive]) {
        primitives[entry.primitive] = buildPrimitiveTexture(pixiApp, entry.primitive);
      }
      textures[code] = primitives[entry.primitive];
      continue;
    }
    const [gridX, gridY] = entry.grid;
    const tileSize = entry.atlasTileSize || TILE_SIZE;
    textures[code] = new PIXI.Texture(
      atlasCache[entry.atlasPath],
      new PIXI.Rectangle(gridX * tileSize, gridY * tileSize, tileSize, tileSize),
    );
  }
  return textures;
}

function getLayerTexture(renderer, objectToken, layerName) {
  if (objectToken.kind === "empty") return null;
  if (objectToken.kind === "primitive") {
    return objectToken.primitive === "door" ? renderer.assets.primitiveTextures.door : renderer.assets.primitiveTextures.wall;
  }
  const atlasKey = layerName === "wall" ? "wallAtlasTextures" : "officeAtlasTextures";
  const atlasBaseTexture = layerName === "wall" ? renderer.assets.wallAtlasBaseTexture : renderer.assets.officeAtlasBaseTexture;
  const cache = renderer.assets[atlasKey];
  const key = `${objectToken.x}:${objectToken.y}`;
  if (!cache[key]) {
    const tileSize = renderer.assets.layout.atlasTileSize || TILE_SIZE;
    cache[key] = new PIXI.Texture(
      atlasBaseTexture,
      new PIXI.Rectangle((objectToken.x - 1) * tileSize, (objectToken.y - 1) * tileSize, tileSize, tileSize),
    );
  }
  return cache[key];
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
  if (!["tilemap", "room-mapping", "chat-bubble", "agent"].includes(viewName)) viewName = "tilemap";
  appState.editor.activeSubview = viewName;
  renderEditorSubviews();
  if (appState.renderer && (viewName === "tilemap" || viewName === "room-mapping")) {
    mountRendererView();
    resizeRendererViewport();
    drawRoom(appState.renderer);
  }
  renderVisualEditor();
}

function renderEditorSubviews() {
  const currentView = appState.editor.activeSubview || "tilemap";
  const visualToolTitle = document.getElementById("visual-tool-title");
  const previewTitle = document.getElementById("editor-preview-title");
  for (const button of document.querySelectorAll(".editor-subtab-btn")) {
    button.classList.toggle("active", button.dataset.editorView === currentView);
  }
  for (const panel of document.querySelectorAll(".editor-subview")) {
    const views = String(panel.dataset.editorViews || "")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean);
    panel.classList.toggle("active", views.includes(currentView));
  }
  for (const panel of document.querySelectorAll(".editor-preview-mode")) {
    panel.classList.toggle("active", panel.dataset.editorPreview === currentView);
  }
  for (const section of document.querySelectorAll("[data-editor-only]")) {
    section.hidden = section.dataset.editorOnly !== currentView;
  }
  if (currentView === "chat-bubble" && !["floor", "wall"].includes(appState.editor.selectedLayer)) {
    appState.editor.selectedLayer = "wall";
  }
  for (const button of document.querySelectorAll("#visual-layer-toggle [data-layer]")) {
    const layer = button.dataset.layer || "";
    const allowed = currentView !== "chat-bubble" || layer === "floor" || layer === "wall";
    button.hidden = !allowed;
  }
  if (visualToolTitle) {
    visualToolTitle.textContent = currentView === "chat-bubble" ? "Bubble Tile Palette" : "Tile Palette";
  }
  if (previewTitle) {
    previewTitle.textContent =
      currentView === "chat-bubble"
        ? "Chat Bubble Preview"
        : currentView === "agent"
          ? "Agent Sprite Preview"
          : currentView === "room-mapping"
            ? "Room Mapping Preview"
            : "Tilemap Preview";
  }
  setText(
    "editor-subview-pill",
    currentView === "chat-bubble"
      ? "Chat Bubble"
      : currentView === "agent"
        ? "Agent"
        : currentView === "room-mapping"
          ? "Room Mapping"
          : "Tilemap",
  );
}

function syncEditorInputs() {
  const floorInput = document.getElementById("floor-map-input");
  const wallInput = document.getElementById("wall-map-input");
  const furnitureInput = document.getElementById("furniture-map-input");
  const propInput = document.getElementById("prop-map-input");
  if (floorInput && floorInput.value !== appState.editor.draftFloorText) floorInput.value = appState.editor.draftFloorText;
  if (wallInput && wallInput.value !== appState.editor.draftWallText) wallInput.value = appState.editor.draftWallText;
  if (furnitureInput && furnitureInput.value !== appState.editor.draftFurnitureText) furnitureInput.value = appState.editor.draftFurnitureText;
  if (propInput && propInput.value !== appState.editor.draftPropText) propInput.value = appState.editor.draftPropText;
  const tileCodes = Object.keys(appState.tilemap?.manifest || {}).length;
  setText("tilemap-summary", `${getWorldCols()}x${getWorldRows()} grid · ${tileCodes} codes`);
  if (appState.tilemap) {
    setText("tilemap-walkability", `${appState.tilemap.walkableTiles} walkable · ${appState.tilemap.solidTiles} solid · ${appState.tilemap.doorTiles} doors`);
  }
  syncGameStateTextarea();
  renderVisualEditor();
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
  const canvas = document.getElementById("visual-selection-preview");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const titleEl = document.getElementById("visual-selection-title");
  const detailEl = document.getElementById("visual-selection-detail");
  const isChatBubbleView = appState.editor.activeSubview === "chat-bubble";
  let layer = appState.editor.selectedLayer;
  const hover = appState.editor.hoveredAtlasCell;
  const selected = appState.editor.selectedAtlasCell;
  const selectedCell = appState.editor.selectedCell;
  let assignedValue = selectedCell ? getDraftCellValue(layer, selectedCell.row, selectedCell.col) : null;
  let assignedAtlasCell = getAssignedAtlasCell(layer, assignedValue);
  let assignedPreviewToken = getAssignedPreviewToken(layer, assignedValue);
  if (isChatBubbleView) {
    const theme = selectedChatBubbleTheme();
    const frame = theme?.frame?.[appState.editor.selectedChatBubbleSlot || "mm"] || null;
    if (frame?.layer && ["floor", "wall"].includes(frame.layer)) {
      layer = frame.layer;
      assignedValue = frame.token || ".";
      assignedAtlasCell = getAssignedAtlasCell(layer, assignedValue);
      assignedPreviewToken = getAssignedPreviewToken(layer, assignedValue);
    } else {
      assignedValue = null;
      assignedAtlasCell = null;
      assignedPreviewToken = null;
    }
  }
  const atlasCell = hover || selected || assignedAtlasCell;

  if (!atlasCell && !assignedPreviewToken) {
    titleEl.textContent = isChatBubbleView ? "No bubble tile selected" : "No atlas tile selected";
    detailEl.textContent = isChatBubbleView
      ? "Pick Agent, Tool, or User, click a bubble segment in the preview, then choose a floor or wall atlas tile."
      : "Click a map cell, then hover or click a tile in the atlas.";
    return;
  }

  if (hover || selected || assignedAtlasCell) {
    const image = document.getElementById("atlas-picker-image");
    if (!image?.complete || !image.naturalWidth) return;
    const tileSize = appState.renderer?.assets?.layout?.atlasTileSize || TILE_SIZE;
    const sx = (atlasCell.x - 1) * tileSize;
    const sy = (atlasCell.y - 1) * tileSize;
    ctx.drawImage(image, sx, sy, tileSize, tileSize, 0, 0, canvas.width, canvas.height);
  } else if (assignedPreviewToken?.kind === "primitive" && appState.renderer?.assets?.primitiveTextures?.[assignedPreviewToken.primitive]) {
    const texture = appState.renderer.assets.primitiveTextures[assignedPreviewToken.primitive];
    const source = texture.baseTexture.resource?.source;
    const frame = texture.frame;
    if (source && frame) {
      ctx.drawImage(source, frame.x, frame.y, frame.width, frame.height, 0, 0, canvas.width, canvas.height);
    }
  }

  const code = atlasCell ? `${atlasCell.x}:${atlasCell.y}` : String(assignedValue || "--");
  if (isChatBubbleView) {
    const roleLabel = appState.editor.selectedChatBubbleRole === "assistant"
      ? "Agent"
      : appState.editor.selectedChatBubbleRole === "tool"
        ? "Tool"
        : "User";
    const slotLabel = String(appState.editor.selectedChatBubbleSlot || "mm").toUpperCase();
    titleEl.textContent = `${roleLabel} ${slotLabel} · ${getVisualLayerConfig().label} ${code}`;
    detailEl.textContent = hover
      ? `Ready to assign ${layer} ${code} to ${roleLabel} ${slotLabel}.`
      : assignedValue && assignedValue !== "--"
        ? `Selected bubble segment uses ${assignedValue}.`
        : `Ready to assign ${layer} ${code} to ${roleLabel} ${slotLabel}.`;
    return;
  }

  titleEl.textContent = atlasCell
    ? `${getVisualLayerConfig().label} ${atlasCell.x}:${atlasCell.y}`
    : `${getVisualLayerConfig().label} ${assignedValue}`;
  detailEl.textContent = hover
    ? `Will write \`${code}\` into the ${layer} map.`
    : assignedValue && assignedValue !== "--"
      ? `Current ${layer} value is \`${assignedValue}\`.`
      : `Will write \`${code}\` into the ${layer} map.`;
}

function renderVisualEditor() {
  const selectedCellEl = document.getElementById("selected-map-cell");
  const selectedLayerEl = document.getElementById("selected-layer-cell");
  const hoveredAtlasEl = document.getElementById("hovered-atlas-cell");
  const atlasTitleEl = document.getElementById("atlas-picker-title");
  const atlasModeEl = document.getElementById("atlas-picker-mode");
  const atlasImage = document.getElementById("atlas-picker-image");
  const atlasHover = document.getElementById("atlas-picker-hover");
  const emptyButton = document.getElementById("visual-token-empty");
  const colsInput = document.getElementById("grid-cols-input");
  const rowsInput = document.getElementById("grid-rows-input");
  const zoomSelect = document.getElementById("editor-zoom-select");
  const showAgentsToggle = document.getElementById("toggle-editor-agents");
  const regionKindInput = document.getElementById("region-kind-input");
  const regionIdInput = document.getElementById("region-id-input");
  const regionLabelInput = document.getElementById("region-label-input");
  const regionSummary = document.getElementById("room-region-summary");
  const regionList = document.getElementById("room-region-list");
  const stashSummary = document.getElementById("stash-cell-summary");
  const chatBubblePreviewList = document.getElementById("editor-chat-bubble-preview-list");
  const chatBubbleTextColor = document.getElementById("chat-bubble-text-color");
  const chatBubbleSlotSummary = document.getElementById("chat-bubble-slot-summary");

  if (!selectedCellEl || !selectedLayerEl || !hoveredAtlasEl || !atlasTitleEl || !atlasModeEl || !atlasImage || !atlasHover || !emptyButton || !colsInput || !rowsInput || !zoomSelect || !showAgentsToggle || !regionKindInput || !regionIdInput || !regionLabelInput || !regionSummary || !regionList || !stashSummary || !chatBubblePreviewList || !chatBubbleTextColor || !chatBubbleSlotSummary) {
    return;
  }

  const layer = appState.editor.selectedLayer;
  const currentView = appState.editor.activeSubview || "tilemap";
  const config = getVisualLayerConfig();
  const selectedCell = appState.editor.selectedCell;
  const selectedCells = getSelectedCells();
  const currentValue = selectedCell ? getDraftCellValue(layer, selectedCell.row, selectedCell.col) : "--";
  selectedCellEl.textContent = selectedCell
    ? selectedCells.length > 1
      ? `Cells ${selectedCells.length} selected`
      : `Cell ${selectedCell.col + 1}:${selectedCell.row + 1}`
    : "Cell --";
  selectedLayerEl.textContent = `${config.label} ${currentValue}`;
  const hovered = appState.editor.hoveredAtlasCell;
  hoveredAtlasEl.textContent = hovered ? `Atlas ${hovered.x}:${hovered.y}` : "Atlas --";

  atlasTitleEl.textContent = currentView === "chat-bubble" ? `${config.label} Atlas` : config.title;
  atlasModeEl.textContent = config.modeLabel;
  if (document.activeElement !== colsInput) colsInput.value = String(getWorldCols());
  if (document.activeElement !== rowsInput) rowsInput.value = String(getWorldRows());
  zoomSelect.value = String(appState.editor.zoom);
  showAgentsToggle.checked = appState.editor.showAgents;
  regionKindInput.value = appState.editor.regionKind;
  populateRegionIdSelect(regionIdInput);
  if (document.activeElement !== regionLabelInput) regionLabelInput.value = appState.editor.regionLabel;
  const activeChatTheme = selectedChatBubbleTheme();
  chatBubbleTextColor.value = activeChatTheme?.textColor || DEFAULT_CHAT_TEXT_COLORS[appState.editor.selectedChatBubbleRole] || "#fff4d7";
  const chatRoleLabel = appState.editor.selectedChatBubbleRole === "assistant"
    ? "Agent"
    : appState.editor.selectedChatBubbleRole === "tool"
      ? "Tool"
      : "User";
  chatBubbleSlotSummary.textContent = `${chatRoleLabel} · ${(appState.editor.selectedChatBubbleSlot || "mm").toUpperCase()}`;
  regionSummary.textContent = `${appState.roomRegions.length} regions`;
  const stash = normalizeStashPoint(appState.tilemap?.layout?.stash || appState.renderer?.assets?.layout?.stash || { col: 15, row: 14 });
  stashSummary.textContent = `Stash ${stash.col + 1}:${stash.row + 1}`;
  const atlasPath = getAtlasPathForLayer(layer);
  if (atlasImage.getAttribute("src") !== atlasPath) {
    atlasImage.setAttribute("src", atlasPath);
  }
  atlasImage.dataset.cols = String(config.cols);
  atlasImage.dataset.rows = String(config.rows);

  if (hovered) {
    const cellWidth = atlasImage.clientWidth / config.cols;
    const cellHeight = atlasImage.clientHeight / config.rows;
    atlasHover.style.display = "block";
    atlasHover.style.width = `${cellWidth}px`;
    atlasHover.style.height = `${cellHeight}px`;
    atlasHover.style.transform = `translate(${(hovered.x - 1) * cellWidth}px, ${(hovered.y - 1) * cellHeight}px)`;
  } else {
    atlasHover.style.display = "none";
  }

  emptyButton.textContent = layer === "floor" ? "Set `.` floor" : "Set `.`";
  syncRendererCanvasSize();
  renderAgentEditorPanel();

  for (const button of document.querySelectorAll("#visual-layer-toggle [data-layer]")) {
    button.classList.toggle("active", button.dataset.layer === layer);
  }
  regionList.innerHTML = appState.roomRegions.length
    ? appState.roomRegions.map((region) => `
      <div class="room-region-item${appState.editor.hoveredRegionId === region.id ? " active" : ""}" data-region-id="${region.id}">
        <div class="room-region-copy">
          <span>${region.label}</span>
          <span class="room-region-meta">${region.kind} · ${region.id} · ${region.cells.length} cells${region.labelCell ? ` · label ${region.labelCell.col + 1}:${region.labelCell.row + 1}` : ""}</span>
        </div>
        <button class="secondary-btn room-region-delete" type="button" data-region-id="${region.id}">Delete</button>
      </div>
    `).join("")
    : `<div class="room-region-item"><span>No mapped rooms yet.</span><span class="room-region-meta">Select cells and assign one.</span></div>`;
  for (const row of regionList.querySelectorAll(".room-region-item[data-region-id]")) {
    row.addEventListener("mouseenter", () => {
      appState.editor.hoveredRegionId = row.dataset.regionId || "";
      drawRoom(appState.renderer);
    });
    row.addEventListener("mouseleave", () => {
      appState.editor.hoveredRegionId = "";
      drawRoom(appState.renderer);
    });
  }
  for (const button of regionList.querySelectorAll(".room-region-delete")) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteRoomRegion(button.dataset.regionId || "");
    });
  }
  chatBubblePreviewList.innerHTML = CHAT_BUBBLE_PREVIEW_SAMPLES.map((sample) => `
    <article class="chat-bubble-preview-card ${sample.role}">
      <div class="chat-bubble-preview-label">${sample.label}</div>
      <div class="chat-item ${sample.role} preview">
        ${chatBubbleMarkup(sample.role, sample.metaLabel, sample.eventType, sample.time, formatRichTextHtml(sample.body))}
        ${chatBubbleSlotOverlayMarkup(sample.role)}
      </div>
    </article>
  `).join("");
  for (const item of chatBubblePreviewList.querySelectorAll(".chat-item.preview")) {
    const role = item.classList.contains("user") ? "user" : item.classList.contains("tool") ? "tool" : "assistant";
    applyChatRoleTheme(item, role);
  }
  for (const button of chatBubblePreviewList.querySelectorAll(".chat-bubble-slot-hotspot")) {
    button.addEventListener("click", () => {
      appState.editor.selectedChatBubbleRole = ["assistant", "tool", "user"].includes(button.dataset.role) ? button.dataset.role : "assistant";
      appState.editor.selectedChatBubbleSlot = button.dataset.slot || "mm";
      const frame = selectedChatBubbleTheme()?.frame?.[appState.editor.selectedChatBubbleSlot] || null;
      if (frame?.layer && ["floor", "wall"].includes(frame.layer)) {
        appState.editor.selectedLayer = frame.layer;
      }
      renderVisualEditor();
    });
  }
  for (const button of document.querySelectorAll(".chat-bubble-role-btn")) {
    button.classList.toggle("active", button.dataset.role === appState.editor.selectedChatBubbleRole);
  }
  renderVisualSelectionPreview();
}

function renderAgentEditorPanel() {
  const agent = (appState.world?.agents || []).find((item) => item.id === appState.selectedAgentId) || appState.detail?.agent || null;
  const previewList = document.getElementById("agent-sprite-preview-list");
  setText("agent-editor-selected-id", appState.selectedAgentId || "--");
  setText("agent-editor-name", agent?.name || "--");
  setText("agent-editor-model", agent?.model || "--");
  setText("agent-editor-status", agent?.runtimeStatus || agent?.status || "--");
  setText("agent-editor-anchor", agent?.targetAnchor || agent?.currentAnchor || "--");
  setText("agent-editor-action", agent?.currentAction || "--");
  setText("agent-editor-visual", agent?.visualState || "--");
  if (!previewList) return;
  const agents = (appState.world?.agents || []).filter((item) => shouldShowAgentSprite(item));
  if (!agents.length) {
    previewList.innerHTML = '<div class="event-item empty">No renderable agents are currently available.</div>';
    return;
  }
  previewList.innerHTML = agents.map((item) => {
    const frame = previewSpriteFrame(item);
    if (!frame) {
      return `
        <article class="agent-sprite-preview-card">
          <div class="agent-sprite-preview-figure">
            <div class="agent-sprite-preview-copy">No sprite frame</div>
          </div>
          <div class="agent-sprite-preview-meta">
            <div class="agent-sprite-preview-name">${escapeHtml(item.name || item.id || "Agent")}</div>
            <div class="agent-sprite-preview-copy">${escapeHtml(item.visualState || "idle")} · ${escapeHtml(item.runtimeStatus || "--")}</div>
          </div>
        </article>
      `;
    }
    return `
      <article class="agent-sprite-preview-card">
        <div class="agent-sprite-preview-figure">
          <div
            class="agent-sprite-preview-sheet"
            style="
              width:${frame.w}px;
              height:${frame.h}px;
              background-image:url('${frame.atlasPath}');
              background-position:-${frame.x}px -${frame.y}px;
              background-size:${frame.sheetWidth}px ${frame.sheetHeight}px;
              transform:scale(${frame.scaleX}, ${frame.scale});
            "
            aria-hidden="true"
          ></div>
        </div>
        <div class="agent-sprite-preview-meta">
          <div class="agent-sprite-preview-name">${escapeHtml(item.name || item.id || "Agent")}</div>
          <div class="agent-sprite-preview-copy">${escapeHtml(item.visualState || "idle")} · ${escapeHtml(item.runtimeStatus || "--")}</div>
        </div>
      </article>
    `;
  }).join("");
}

function previewSpriteFrame(agent) {
  const seed = agent?.spriteSeed || "lucca-default";
  const atlasMeta = appState.renderer?.assets?.spriteAtlasMeta?.[seed];
  const atlasPath = appState.renderer?.assets?.spriteAtlasPaths?.[seed];
  if (!atlasMeta || !atlasPath) return null;
  const frameName = previewSpriteFrameName(agent, atlasMeta.frames || {});
  const frame = atlasMeta.frames?.[frameName];
  if (!frame) return null;
  const sheetWidth = atlasMeta?.meta?.size?.w || Math.max(frame.x + frame.w, 1);
  const sheetHeight = atlasMeta?.meta?.size?.h || Math.max(frame.y + frame.h, 1);
  const mirrored = shouldMirrorPreviewSprite(agent, atlasMeta.frames || {});
  const scale = frame.h <= 40 ? 2.1 : 1.8;
  return {
    ...frame,
    atlasPath,
    sheetWidth,
    sheetHeight,
    scale,
    scaleX: mirrored ? -scale : scale,
  };
}

function previewSpriteFrameName(agent, frames) {
  if (!frames || typeof frames !== "object") return "idle_0";
  if (agent?.visualState === "reading" && frames.read_0) return "read_0";
  if ((agent?.visualState === "working" || agent?.visualState === "writing" || agent?.visualState === "messaging") && frames.work_0) return "work_0";
  if (agent?.visualState === "blocked" && frames.shocked_0) return "shocked_0";
  if (frames.idle_down) return "idle_down";
  if (frames.idle_0) return "idle_0";
  return Object.keys(frames)[0] || "idle_0";
}

function shouldMirrorPreviewSprite(agent, frames) {
  if (!frames) return false;
  if (frames.idle_side && !frames.idle_left) return true;
  return false;
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
  const cells = getSelectedCells();
  if (!cells.length) {
    setTilemapStatus("Select cells before assigning a room region.", true);
    return;
  }
  const regionId = canonicalizeAnchorId(appState.editor.regionId.trim());
  if (!regionId) {
    setTilemapStatus("Room region id is required.", true);
    return;
  }
  const regionLabel = appState.editor.regionLabel.trim() || regionId;
  const existingRegion = appState.roomRegions.find((region) => region.id === regionId);
  const nextRegion = {
    id: regionId,
    label: regionLabel,
    kind: appState.editor.regionKind,
    cells,
    labelCell: existingRegion?.labelCell || null,
  };
  const selectedKeys = cellsKeySet(cells);
  const survivors = appState.roomRegions
    .map((region) => ({
      ...region,
      cells: region.cells.filter((cell) => !selectedKeys.has(`${cell.row}:${cell.col}`)),
    }))
    .filter((region) => region.cells.length && region.id !== regionId);
  appState.roomRegions = normalizeRoomRegions([...survivors, nextRegion]);
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, appState.roomRegions);
  commitDraftTilemap(`Assigned ${cells.length} cells to ${appState.editor.regionKind} ${regionId}.`);
}

function resolveRoomRegion(rawId, selectedCell = null) {
  const canonicalId = canonicalizeAnchorId(rawId);
  if (canonicalId) {
    const byId = appState.roomRegions.find((region) => region.id === canonicalId);
    if (byId) return byId;
  }
  const typed = String(rawId || "").trim().toLowerCase();
  if (typed) {
    const byLabel = appState.roomRegions.find((region) => String(region.label || "").trim().toLowerCase() === typed);
    if (byLabel) return byLabel;
  }
  if (selectedCell) {
    const byCell = regionForCell(selectedCell.row, selectedCell.col);
    if (byCell) return byCell;
  }
  return null;
}

function deleteRoomRegion(regionId) {
  const canonicalId = canonicalizeAnchorId(regionId);
  if (!canonicalId) return;
  const beforeCount = appState.roomRegions.length;
  appState.roomRegions = normalizeRoomRegions(appState.roomRegions.filter((region) => region.id !== canonicalId));
  if (appState.roomRegions.length === beforeCount) {
    setTilemapStatus(`No room region found for ${canonicalId}.`, true);
    return;
  }
  if (appState.editor.hoveredRegionId === canonicalId) appState.editor.hoveredRegionId = "";
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, appState.roomRegions);
  commitDraftTilemap(`Deleted room region ${canonicalId}.`);
}

function setRegionLabelPosition() {
  const selected = appState.editor.selectedCell;
  if (!selected) {
    setTilemapStatus("Select a cell before positioning a room label.", true);
    return;
  }
  const region = resolveRoomRegion(appState.editor.regionId, selected);
  if (!region) {
    setTilemapStatus("Choose a room id before positioning its label.", true);
    return;
  }
  let updated = false;
  appState.roomRegions = normalizeRoomRegions(
    appState.roomRegions.map((region) => {
      if (region.id !== resolveRoomRegion(appState.editor.regionId, selected).id) return region;
      updated = true;
      return {
        ...region,
        labelCell: { row: selected.row, col: selected.col },
      };
    }),
  );
  if (!updated) {
    setTilemapStatus(`No room region found for ${region.id}.`, true);
    return;
  }
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, appState.roomRegions);
  drawRoom(appState.renderer);
  renderVisualEditor();
  setTilemapStatus(`Set label position for ${region.id} to ${selected.col + 1}:${selected.row + 1}.`);
}

function clearRegionSelection() {
  const cells = getSelectedCells();
  if (!cells.length) {
    setTilemapStatus("Select cells before clearing a room region.", true);
    return;
  }
  const selectedKeys = cellsKeySet(cells);
  appState.roomRegions = normalizeRoomRegions(
    appState.roomRegions
      .map((region) => ({
        ...region,
        cells: region.cells.filter((cell) => !selectedKeys.has(`${cell.row}:${cell.col}`)),
      }))
      .filter((region) => region.cells.length),
  );
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, appState.roomRegions);
  commitDraftTilemap(`Cleared room mappings from ${cells.length} cells.`);
}

function commitDraftTilemap(successMessage = "Applied draft tilemap.") {
  const nextTilemap = buildTilemapState(
    appState.editor.draftFloorText,
    appState.editor.draftWallText,
    appState.editor.draftFurnitureText,
    appState.editor.draftPropText,
    appState.renderer.assets.tileManifest,
    appState.renderer.assets.layout,
    appState.roomRegions,
  );
  appState.tilemap = nextTilemap;
  appState.roomRegions = nextTilemap.layout.roomRegions || [];
  appState.editor.draftFloorText = nextTilemap.floorText;
  appState.editor.draftWallText = nextTilemap.wallText;
  appState.editor.draftFurnitureText = nextTilemap.furnitureText;
  appState.editor.draftPropText = nextTilemap.propText;
  appState.renderer.assets.layout.cols = nextTilemap.layout.cols;
  appState.renderer.assets.layout.rows = nextTilemap.layout.rows;
  setStoredMap(TILEMAP_STORAGE_KEYS.floor, nextTilemap.floorText);
  setStoredMap(TILEMAP_STORAGE_KEYS.wall, nextTilemap.wallText);
  setStoredMap(TILEMAP_STORAGE_KEYS.furniture, nextTilemap.furnitureText);
  setStoredMap(TILEMAP_STORAGE_KEYS.prop, nextTilemap.propText);
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, appState.roomRegions);
  resizeRendererViewport();
  drawRoom(appState.renderer);
  if (appState.world) renderWorld(appState.world);
  syncEditorInputs();
  setTilemapStatus(successMessage);
}

function resizeGridText(text, cols, rows, fillToken, parser, serializer) {
  const parsed = parseMapText(text).map(parser);
  const next = [];
  for (let row = 0; row < rows; row += 1) {
    const source = parsed[row] || [];
    const nextRow = [];
    for (let col = 0; col < cols; col += 1) {
      nextRow.push(source[col] ?? fillToken);
    }
    next.push(nextRow);
  }
  return serializer(next);
}

function resizeTilemapGrid(cols, rows) {
  const nextCols = Math.max(4, Math.min(80, Number(cols) || getWorldCols()));
  const nextRows = Math.max(4, Math.min(80, Number(rows) || getWorldRows()));
  appState.editor.draftFloorText = resizeGridText(appState.editor.draftFloorText, nextCols, nextRows, ".", parseFloorRow, serializeFloorLines);
  appState.editor.draftWallText = resizeGridText(appState.editor.draftWallText, nextCols, nextRows, ".", parseObjectRow, serializeObjectLines);
  appState.editor.draftFurnitureText = resizeGridText(appState.editor.draftFurnitureText, nextCols, nextRows, ".", parseObjectRow, serializeObjectLines);
  appState.editor.draftPropText = resizeGridText(appState.editor.draftPropText, nextCols, nextRows, ".", parseObjectRow, serializeObjectLines);
  const nextLayout = { ...appState.renderer.assets.layout, cols: nextCols, rows: nextRows };
  const nextTilemap = buildTilemapState(
    appState.editor.draftFloorText,
    appState.editor.draftWallText,
    appState.editor.draftFurnitureText,
    appState.editor.draftPropText,
    appState.renderer.assets.tileManifest,
    nextLayout,
    appState.roomRegions,
  );
  appState.tilemap = nextTilemap;
  appState.roomRegions = nextTilemap.layout.roomRegions || [];
  appState.renderer.assets.layout = nextLayout;
  appState.editor.selectedCell = null;
  appState.editor.hoveredCell = null;
  resizeRendererViewport();
  setStoredMap(TILEMAP_STORAGE_KEYS.floor, nextTilemap.floorText);
  setStoredMap(TILEMAP_STORAGE_KEYS.wall, nextTilemap.wallText);
  setStoredMap(TILEMAP_STORAGE_KEYS.furniture, nextTilemap.furnitureText);
  setStoredMap(TILEMAP_STORAGE_KEYS.prop, nextTilemap.propText);
  setStoredJson(TILEMAP_STORAGE_KEYS.roomRegions, appState.roomRegions);
  drawRoom(appState.renderer);
  if (appState.world) renderWorld(appState.world);
  syncEditorInputs();
  setTilemapStatus(`Resized grid to ${nextCols}x${nextRows}.`);
}

function applyVisualToken(rawValue) {
  const selected = appState.editor.selectedCell;
  const layer = appState.editor.selectedLayer;
  if (!selected) {
    setTilemapStatus("Select a map cell first.", true);
    return;
  }
  const cells = getSelectedCells();
  for (const cell of cells) {
    updateDraftCell(layer, cell.row, cell.col, rawValue);
  }
  commitDraftTilemap(
    cells.length > 1
      ? `Updated ${cells.length} ${layer} cells to ${rawValue}.`
      : `Updated ${layer} ${selected.col + 1}:${selected.row + 1} to ${rawValue}.`,
  );
}

function applyVisualAtlasCell(atlasCell) {
  const layer = appState.editor.selectedLayer;
  let value = null;
  if (layer === "floor") {
    value = `${atlasCell.x}:${atlasCell.y}`;
  } else {
    value = `${atlasCell.x}:${atlasCell.y}`;
  }
  appState.editor.selectedAtlasCell = atlasCell;
  applyVisualToken(value);
}

function assignChatBubbleTile() {
  if (!["wall", "floor"].includes(appState.editor.selectedLayer)) {
    setTilemapStatus("Switch to the wall or floor layer before assigning a chat bubble tile.", true);
    return;
  }
  if (!appState.editor.selectedAtlasCell) {
    setTilemapStatus("Choose a floor or wall atlas tile first.", true);
    return;
  }
  const slot = appState.editor.selectedChatBubbleSlot || "mm";
  const token = `${appState.editor.selectedAtlasCell.x}:${appState.editor.selectedAtlasCell.y}`;
  const role = appState.editor.selectedChatBubbleRole;
  const theme = selectedChatBubbleTheme();
  appState.chatBubbleThemes = {
    ...appState.chatBubbleThemes,
    [role]: {
      ...theme,
      frame: {
        ...theme.frame,
        [slot]: {
          layer: appState.editor.selectedLayer === "floor" ? "floor" : "wall",
          token,
        },
      },
    },
  };
  setStoredJson(TILEMAP_STORAGE_KEYS.chatBubbleFrame, appState.chatBubbleThemes);
  applyChatBubbleFrameStyles();
  renderVisualEditor();
  renderChat(appState.detail?.session?.history || []);
  setTilemapStatus(`Set ${role} chat bubble ${slot} to ${appState.editor.selectedLayer} ${token}.`);
}

function resetChatBubbleFrame() {
  const role = appState.editor.selectedChatBubbleRole;
  appState.chatBubbleThemes = {
    ...appState.chatBubbleThemes,
    [role]: normalizeChatBubbleTheme(DEFAULT_CHAT_BUBBLE_FRAME, role),
  };
  setStoredJson(TILEMAP_STORAGE_KEYS.chatBubbleFrame, appState.chatBubbleThemes);
  applyChatBubbleFrameStyles();
  renderVisualEditor();
  renderChat(appState.detail?.session?.history || []);
  setTilemapStatus(`Reset ${role} chat bubble theme to the default pattern.`);
}

function setChatBubbleTextColor(color) {
  const normalized = String(color || "").trim();
  if (!/^#[0-9a-f]{6}$/i.test(normalized)) return;
  const role = appState.editor.selectedChatBubbleRole;
  const theme = selectedChatBubbleTheme();
  appState.chatBubbleThemes = {
    ...appState.chatBubbleThemes,
    [role]: {
      ...theme,
      textColor: normalized,
    },
  };
  setStoredJson(TILEMAP_STORAGE_KEYS.chatBubbleFrame, appState.chatBubbleThemes);
  applyChatBubbleFrameStyles();
  renderVisualEditor();
  renderChat(appState.detail?.session?.history || []);
}

function setVisualLayer(layerName) {
  appState.editor.selectedLayer = VISUAL_LAYER_CONFIG[layerName] ? layerName : "floor";
  renderVisualEditor();
}

function setSelectedMapCell(row, col) {
  appState.editor.selectedCell = { row, col };
  appState.editor.selectionAnchor = { row, col };
  appState.editor.selectionFocus = { row, col };
  appState.editor.selectedAtlasCell = null;
  const region = regionForCell(row, col);
  if (region) {
    appState.editor.regionKind = region.kind;
    appState.editor.regionId = region.id;
    appState.editor.regionLabel = region.label;
  }
  drawRoom(appState.renderer);
  renderVisualEditor();
}

function setHoveredMapCell(row, col) {
  const next = row == null || col == null ? null : { row, col };
  const prev = appState.editor.hoveredCell;
  if (prev?.row === next?.row && prev?.col === next?.col) return;
  appState.editor.hoveredCell = next;
  drawRoom(appState.renderer);
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
  const selected = appState.editor.selectedCell;
  if (!selected) {
    setTilemapStatus("Select a cell before placing the stash box.", true);
    return;
  }
  const stash = normalizeStashPoint(selected);
  appState.renderer.assets.layout.stash = stash;
  if (appState.tilemap) appState.tilemap.layout.stash = stash;
  setStoredJson(TILEMAP_STORAGE_KEYS.stash, stash);
  drawRoom(appState.renderer);
  renderVisualEditor();
  setTilemapStatus(`Placed stash at ${stash.col + 1}:${stash.row + 1}.`);
}

function clearStashSelection() {
  const stash = normalizeStashPoint({ col: 15, row: 14 });
  appState.renderer.assets.layout.stash = stash;
  if (appState.tilemap) appState.tilemap.layout.stash = stash;
  setStoredJson(TILEMAP_STORAGE_KEYS.stash, stash);
  drawRoom(appState.renderer);
  renderVisualEditor();
  setTilemapStatus(`Reset stash to ${stash.col + 1}:${stash.row + 1}.`);
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
  const renderer = appState.renderer;
  const container = new PIXI.Container();
  container.interactive = true;
  container.buttonMode = true;
  container.cursor = "pointer";
  container.agentId = agent.id;
  const startTile = currentTileForAgent(agent);
  container._state = {
    currentTile: startTile,
    path: [startTile],
    goalKey: "",
    currentAnchorKey: agent.currentAnchor || "",
    targetAnchorKey: agent.targetAnchor || "",
    facing: "down",
    ambientRoomKey: "",
    ambientGoalTile: null,
    ambientPauseUntil: 0,
    ambientWaypointIndex: 0,
    ambientSeed: (hashString(`${agent.id}:${agent.name}:wander`) || 1) >>> 0,
    lastAmbientKey: "",
  };

  const selection = new PIXI.Graphics();
  const anim = new PIXI.AnimatedSprite(getAnimationFrames(renderer, agent, agent.visualState));
  anim.anchor.set(0.5, 1);
  anim.y = -4;
  anim.scale.set(1.72);
  anim.animationSpeed = 0.14;
  anim.play();
  anim.roundPixels = false;

  const bubble = createText(displayActionText(agent.currentAction), {
    fontFamily: "Courier New",
    fontSize: 12,
    fontWeight: "bold",
    fill: 0xf6ebc7,
    wordWrap: true,
    wordWrapWidth: 150,
    align: "center",
  });
  bubble.anchor.set(0.5, 1);
  bubble.roundPixels = true;
  bubble.resolution = 2;

  const bubbleBg = new PIXI.Graphics();
  const bubbleWrap = new PIXI.Container();
  const labelBg = new PIXI.Graphics();
  const label = createText(agent.name, {
    fontFamily: "Courier New",
    fontSize: 12,
    fontWeight: "bold",
    fill: 0x111111,
    letterSpacing: 1,
  });
  label.anchor.set(0.5, 0);
  const labelWrap = new PIXI.Container();
  labelWrap.addChild(labelBg, label);

  const cue = createText("", {
    fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    fontSize: 13,
    fontWeight: "bold",
    fill: 0xffffff,
  });
  cue.anchor.set(0.5, 0);

  const cueBg = new PIXI.Graphics();
  const cueWrap = new PIXI.Container();
  cueWrap.addChild(cueBg, cue);

  bubbleWrap.addChild(bubbleBg, bubble, cueWrap);
  container.addChild(selection, anim);
  container.on("pointertap", async () => {
    await selectAgent(agent.id);
    document.querySelector(".inspector")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  container._selection = selection;
  container._anim = anim;
  container._bubble = bubble;
  container._bubbleBg = bubbleBg;
  container._bubbleWrap = bubbleWrap;
  container._labelBg = labelBg;
  container._label = label;
  container._labelWrap = labelWrap;
  container._cue = cue;
  container._cueBg = cueBg;
  container._cueWrap = cueWrap;
  container._agent = agent;
  container._bubblePalette = bubblePaletteForAgent(agent);
  const p = tilePoint(startTile.row, startTile.col);
  container.x = p.x;
  container.y = p.y;
  positionBubble(container);
  positionAgentLabel(container);
  renderer.bubbleLayer.addChild(bubbleWrap);
  renderer.agentLabelLayer.addChild(labelWrap);
  return container;
}

function createBenchmarkSprite(agent) {
  const renderer = appState.renderer;
  const container = new PIXI.Container();
  container.interactive = true;
  container.buttonMode = true;
  container.cursor = "pointer";
  container.agentId = agent.id;
  container._kind = "benchmark";
  container._state = {
    currentTile: currentTileForAgent(agent),
    benchIndex: 0,
    ambientSeed: (hashString(`${agent.id}:${agent.name}:bench`) || 1) >>> 0,
    lastAmbientKey: "",
  };

  const selection = new PIXI.Graphics();
  const chassis = new PIXI.Graphics();
  const labelBg = new PIXI.Graphics();
  const label = createText(agent.name.replace(/^bench-/, "").slice(0, 18), {
    fontFamily: "Courier New",
    fontSize: 11,
    fontWeight: "bold",
    fill: 0x111111,
    letterSpacing: 0.7,
  });
  label.anchor.set(0.5, 0);
  const labelWrap = new PIXI.Container();
  labelWrap.addChild(labelBg, label);

  const bubble = createText(displayActionText(agent.currentAction), {
    fontFamily: "Courier New",
    fontSize: 12,
    fontWeight: "bold",
    fill: 0xf6ebc7,
    wordWrap: true,
    wordWrapWidth: 150,
    align: "center",
  });
  bubble.anchor.set(0.5, 1);
  bubble.roundPixels = true;
  bubble.resolution = 2;

  const bubbleBg = new PIXI.Graphics();
  const bubbleWrap = new PIXI.Container();
  const cue = createText("🧪", {
    fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    fontSize: 13,
    fontWeight: "bold",
    fill: 0xffffff,
  });
  cue.anchor.set(0.5, 0);
  const cueBg = new PIXI.Graphics();
  const cueWrap = new PIXI.Container();
  cueWrap.addChild(cueBg, cue);
  bubbleWrap.addChild(bubbleBg, bubble, cueWrap);

  chassis.beginFill(0x1a2340, 0.98);
  chassis.lineStyle(3, 0x91b7ff, 0.95);
  chassis.drawRoundedRect(-18, -40, 36, 26, 5);
  chassis.beginFill(0x75f0d2, 0.92);
  chassis.lineStyle(2, 0x10233e, 1);
  chassis.drawRoundedRect(-13, -35, 26, 14, 3);
  chassis.beginFill(0x27304f, 0.98);
  chassis.lineStyle(2, 0x6e7fa8, 1);
  chassis.drawRoundedRect(-14, -14, 28, 10, 3);
  chassis.beginFill(0xffd86b, 0.95);
  chassis.drawCircle(-8, -9, 2);
  chassis.beginFill(0x87f5a6, 0.95);
  chassis.drawCircle(0, -9, 2);
  chassis.beginFill(0xff9279, 0.95);
  chassis.drawCircle(8, -9, 2);

  container.addChild(selection, chassis);
  container.on("pointertap", async () => {
    await selectAgent(agent.id);
    document.querySelector(".inspector")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  container._selection = selection;
  container._chassis = chassis;
  container._bubble = bubble;
  container._bubbleBg = bubbleBg;
  container._bubbleWrap = bubbleWrap;
  container._labelBg = labelBg;
  container._label = label;
  container._labelWrap = labelWrap;
  container._cue = cue;
  container._cueBg = cueBg;
  container._cueWrap = cueWrap;
  container._agent = agent;
  container._bubblePalette = bubblePaletteForAgent(agent);
  positionBubble(container);
  positionAgentLabel(container);
  renderer.bubbleLayer.addChild(bubbleWrap);
  renderer.agentLabelLayer.addChild(labelWrap);
  return container;
}

function updateBubble(container, text) {
  const palette = container._bubblePalette || { fill: 0x111111, stroke: 0xf6e8bf, text: 0xf6ebc7 };
  container._bubble.text = displayActionText(text);
  container._bubble.style.fill = palette.text;
  const bubbleWidth = Math.max(90, Math.min(180, container._bubble.width + 14));
  const bubbleHeight = Math.max(22, container._bubble.height + 8);
  container._bubbleBg.clear();
  container._bubbleBg.beginFill(palette.fill, 0.92);
  container._bubbleBg.lineStyle(3, palette.stroke, 1);
  container._bubbleBg.drawRoundedRect(-bubbleWidth / 2, -bubbleHeight, bubbleWidth, bubbleHeight, 6);
  container._bubbleBg.endFill();
  container._bubbleBg.y = 0;
  container._bubble.y = 0;
  positionBubble(container);
}

function updateAgentLabel(container, selected = false) {
  if (!container?._label || !container?._labelBg) return;
  const paddingX = 7;
  const paddingY = 3;
  const width = Math.max(46, container._label.width + paddingX * 2);
  const height = Math.max(18, container._label.height + paddingY * 2);
  container._label.style.fill = 0x111111;
  container._labelBg.clear();
  container._labelBg.beginFill(0xf7f1de, 0.94);
  container._labelBg.lineStyle(2, selected ? 0x76d0a8 : 0x7f6f48, 0.96);
  container._labelBg.drawRoundedRect(-width / 2, 0, width, height, 6);
  container._labelBg.endFill();
  container._label.x = 0;
  container._label.y = 2;
}

function positionBubble(container) {
  if (!container?._bubbleWrap) return;
  container._bubbleWrap.x = container.x;
  container._bubbleWrap.y = container.y - 84;
}

function positionAgentLabel(container) {
  if (!container?._labelWrap) return;
  container._labelWrap.x = container.x;
  container._labelWrap.y = container.y + (container._kind === "benchmark" ? 18 : 16);
}

function updateActivityCue(container, agent, moving) {
  if (!container?._cue || !container?._cueBg) return;
  container._cue.text = activityCue(agent, container, moving);
  const width = Math.max(24, container._cue.width + 10);
  const height = Math.max(22, container._cue.height + 6);
  container._cueBg.clear();
  container._cueBg.beginFill(0xf7f3e6, 0.96);
  container._cueBg.lineStyle(2, 0x8c7a52, 0.95);
  container._cueBg.drawRoundedRect(-width / 2, 0, width, height, 6);
  container._cueBg.endFill();
  container._cue.x = 0;
  container._cue.y = 1;
  container._cueWrap.y = 8;
  container._cueWrap.x = 48;
}

function chooseDisplayFrames(renderer, agent, moving) {
  const facing = renderer.agents?.get(agent.id)?._state?.facing || "down";
  if (moving) return directionalWalkFrames(renderer, agent, facing);
  if (agent.visualState === "reading" || agent.visualState === "working" || agent.visualState === "writing" || agent.visualState === "messaging") {
    return getAnimationFrames(renderer, agent, agent.visualState);
  }
  return directionalIdleFrames(renderer, agent, facing);
}

function effectiveGoalTileForAgent(sprite, agent, currentTile) {
  const state = sprite._state;
  const desiredRoomId = roomIdForAgent(agent);
  const desiredRegion = regionForAnchor(desiredRoomId);
  const currentRegion = regionForCell(currentTile.row, currentTile.col);
  if (state.ambientRoomKey !== desiredRoomId) {
    state.ambientRoomKey = desiredRoomId;
    state.ambientGoalTile = null;
    state.ambientPauseUntil = 0;
    state.ambientWaypointIndex = 0;
    state.lastAmbientKey = "";
  }
  if (!desiredRegion || currentRegion?.id !== desiredRegion.id) {
    state.ambientGoalTile = null;
    state.ambientPauseUntil = 0;
    return roomGoalTile(desiredRoomId, currentTile);
  }

  const waypoints = roomWaypointTiles(desiredRoomId, currentTile);
  if (!waypoints.length) return roomGoalTile(desiredRoomId, currentTile);

  const now = Date.now();
  const atAmbientGoal = state.ambientGoalTile
    && state.ambientGoalTile.row === currentTile.row
    && state.ambientGoalTile.col === currentTile.col;
  if (atAmbientGoal) {
    if (!state.ambientPauseUntil) {
      state.ambientPauseUntil = now + 900 + Math.round(nextAmbientRandom(state) * 1800);
    }
    if (now < state.ambientPauseUntil) {
      return currentTile;
    }
    state.ambientGoalTile = null;
    state.ambientPauseUntil = 0;
  }
  if (!state.ambientGoalTile) {
    const options = waypoints.filter((point) => point.row !== currentTile.row || point.col !== currentTile.col);
    let pool = options.length ? options : waypoints;
    if (pool.length > 1 && state.lastAmbientKey) {
      const filtered = pool.filter((point) => `${point.row}:${point.col}` !== state.lastAmbientKey);
      if (filtered.length) pool = filtered;
    }
    const ranked = pool
      .map((point) => ({
        point,
        score: nextAmbientRandom(state) + (point.type === "seat" ? 0.12 : point.type === "landmark" ? 0.06 : 0),
      }))
      .sort((a, b) => b.score - a.score);
    const next = ranked[0]?.point || pool[0];
    state.ambientWaypointIndex = (state.ambientWaypointIndex + 1) % pool.length;
    state.ambientGoalTile = { row: next.row, col: next.col };
    state.lastAmbientKey = `${next.row}:${next.col}`;
    state.ambientPauseUntil = 0;
  }
  return state.ambientGoalTile || currentTile;
}

function applyPathing(sprite, agent) {
  const state = sprite._state;
  const currentAnchorKey = agent.currentAnchor || "";
  const targetAnchorKey = agent.targetAnchor || agent.currentAnchor || "";
  if (state.currentAnchorKey !== currentAnchorKey) {
    state.currentAnchorKey = currentAnchorKey;
    state.currentTile = tileFromWorldPoint(sprite.x, sprite.y);
    state.path = [state.currentTile];
    state.ambientGoalTile = null;
    state.ambientPauseUntil = 0;
  }
  const fallbackTile = goalTileForAgent(agent, state.currentTile || null);
  const currentTile = state.currentTile && isWalkable(state.currentTile.row, state.currentTile.col)
    ? state.currentTile
    : nearestWalkableTile(fallbackTile.row, fallbackTile.col);
  const goalTile = effectiveGoalTileForAgent(sprite, agent, currentTile);
  const goalKey = `${goalTile.row}:${goalTile.col}`;
  if (state.targetAnchorKey !== targetAnchorKey) {
    state.targetAnchorKey = targetAnchorKey;
    state.goalKey = "";
    state.ambientGoalTile = null;
    state.ambientPauseUntil = 0;
  }
  if (state.goalKey !== goalKey) {
    state.goalKey = goalKey;
    state.path = findPath(currentTile, goalTile);
  }
  if (!state.path?.length) {
    state.path = [currentTile];
  }
  const nextStep = state.path[1] || state.path[0];
  return {
    target: tilePoint(nextStep.row, nextStep.col),
    nextTile: nextStep,
    goalTile,
  };
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
  if (!appState.selectedAgentId || !worldState?.agents?.length) return;
  const liveAgent = worldState.agents.find((agent) => agent.id === appState.selectedAgentId);
  if (!liveAgent) return;
  if (!appState.detail?.agent || appState.detail.agent.id !== liveAgent.id) {
    renderInspector({ agent: liveAgent, session: appState.detail?.session || {} });
    return;
  }
  appState.detail = {
    ...appState.detail,
    agent: {
      ...appState.detail.agent,
      ...liveAgent,
    },
  };
  renderInspector(appState.detail);
}

function renderInspector(detailPayload) {
  const detail = detailPayload?.agent;
  const session = detailPayload?.session || {};
  appState.detail = detailPayload;
  if (!detail) return;
  setText("selected-agent-id", detail.id);
  setText("agent-name", detail.name);
  setText("agent-model", detail.model);
  setText("agent-runtime-status", detail.runtimeStatus);
  setText("agent-location", displayedLocationLabel(detail));
  setText("agent-action", detail.currentActionFull || detail.currentAction);
  setText("agent-visual-state", detail.visualState);
  setText("agent-tool", detail.lastTool || "none");
  setText("agent-queue-depth", String(detail.queueDepth ?? 0));
  setText("agent-session-label", detail.sessionLabel || session.sessionKey || "--");
  setText("agent-last-channel", session.lastChannel || "--");
  setText("agent-waiting-reason", detail.waitingReason || "none");
  setText("agent-updated", formatDate(detail.lastUpdatedAt));
  const badge = document.getElementById("agent-status-badge");
  badge.textContent = detail.runtimeStatus || "--";
  badge.className = `status-badge ${statusClass(detail.runtimeStatus)}`;
  if (!appState.messageSelection.locked || appState.messageSelection.kind === "current") {
    showRichMessage("current", `${detail.name} current action`, detail.currentActionFull || detail.currentAction);
  }
}

async function showRichMessage(kind, title, text, path = null) {
  setMessageSelection(kind, title, text, path, kind !== "current");
  setText("message-kind", kind);
  setText("message-title", title);
  const body = document.getElementById("message-body");
  body.innerHTML = "";

  if (path) {
    const kindGuess = classifyPath(path);
    if (kindGuess === "image") {
      const img = document.createElement("img");
      img.src = fileUrl(path);
      img.className = "media-preview";
      img.addEventListener("click", () => window.open(fileUrl(path), "_blank", "noopener,noreferrer"));
      body.appendChild(img);
    } else if (kindGuess === "video") {
      const video = document.createElement("video");
      video.src = fileUrl(path);
      video.controls = true;
      video.className = "media-preview";
      body.appendChild(video);
    } else if (kindGuess === "pdf") {
      const link = document.createElement("a");
      link.href = fileUrl(path);
      link.target = "_blank";
      link.textContent = `Open PDF: ${path}`;
      body.appendChild(link);
    } else if (kindGuess === "text") {
      try {
        const res = await fetch(fileUrl(path));
        const fileText = await res.text();
        renderRichText(body, fileText);
      } catch {
        renderRichText(body, text || path);
      }
    } else {
      const link = document.createElement("a");
      link.href = fileUrl(path);
      link.target = "_blank";
      link.textContent = `Open file: ${path}`;
      body.appendChild(link);
    }
    if (text) {
      const meta = document.createElement("pre");
      meta.className = "message-meta";
      meta.textContent = text;
      body.appendChild(meta);
    }
    return;
  }

  const paths = extractPaths(text);
  if (paths.length && classifyPath(paths[0]) === "image") {
    const img = document.createElement("img");
    img.src = fileUrl(paths[0]);
    img.className = "media-preview";
    body.appendChild(img);
    const meta = document.createElement("pre");
    meta.className = "message-meta";
    meta.textContent = text;
    body.appendChild(meta);
    return;
  }

  renderRichText(body, text || "--");
}

function historyRoleClass(type) {
  if (type === "operator_command") return "user";
  if (type === "state_changed") return "assistant";
  return "tool";
}

function historyRoleMeta(type) {
  const role = historyRoleClass(type);
  if (role === "user") return { label: "You", icon: ">>" };
  if (role === "assistant") return { label: "Lucca", icon: "AI" };
  return { label: "Tool", icon: ".." };
}

function renderChat(history) {
  const list = document.getElementById("chat-list");
  const previousScrollTop = list.scrollTop;
  const previousScrollHeight = list.scrollHeight;
  list.innerHTML = "";
  const ordered = [...(history || [])].reverse();
  setText("chat-summary", `${ordered.length} messages`);
  for (const event of ordered) {
    const item = document.createElement("article");
    const role = historyRoleClass(event.type);
    const meta = historyRoleMeta(event.type);
    item.className = `chat-item ${role}`;
    applyChatRoleTheme(item, role);
    const paths = extractPaths(event.fullLabel || event.label, event.fullDetail || event.detail);
    item.innerHTML = chatBubbleMarkup(role, `${meta.icon} ${meta.label}`, event.type, formatTime(event.ts), formatRichTextHtml(event.fullLabel || event.label));
    if (paths[0] && classifyPath(paths[0]) === "image") {
      const img = document.createElement("img");
      img.src = fileUrl(paths[0]);
      img.className = "chat-thumb";
      img.addEventListener("click", (pointerEvent) => {
        pointerEvent.stopPropagation();
        window.open(fileUrl(paths[0]), "_blank", "noopener,noreferrer");
      });
      item.querySelector(".chat-bubble-content")?.appendChild(img);
    }
    item.addEventListener("click", () => {
      showRichMessage(event.type, event.fullLabel || event.label, event.fullDetail || event.detail || event.fullLabel || event.label, paths[0] || null);
    });
    list.appendChild(item);
  }
  const maxScrollTop = Math.max(0, list.scrollHeight - list.clientHeight);
  const preservedScrollTop = previousScrollTop + (list.scrollHeight - previousScrollHeight);
  list.scrollTop = Math.max(0, Math.min(preservedScrollTop, maxScrollTop));
  maybeSpeakReply(history);
}

function renderHistory(events) {
  const list = document.getElementById("event-list");
  list.innerHTML = "";
  if (!events?.length) {
    const item = document.createElement("li");
    item.className = "event-item empty";
    item.textContent = "No recent agent history.";
    list.appendChild(item);
    renderChat([]);
    return;
  }
  renderChat(events);
  for (const event of events) {
    const item = document.createElement("li");
    item.className = "event-item";
    item.innerHTML = `
      <div class="event-meta">${formatTime(event.ts)} · ${event.type}</div>
      <div>${event.label}</div>
      ${event.detail ? `<div class="event-meta">${event.detail}</div>` : ""}
    `;
    item.addEventListener("click", () => {
      const paths = extractPaths(event.fullLabel || event.label, event.fullDetail || event.detail);
      showRichMessage(event.type, event.fullLabel || event.label, event.fullDetail || event.detail || event.fullLabel || event.label, paths[0] || null);
    });
    list.appendChild(item);
  }
}

function renderSchedule(detailPayload) {
  const list = document.getElementById("schedule-list");
  const schedule = detailPayload?.schedule || [];
  const recentRuns = detailPayload?.recentCronRuns || [];
  list.innerHTML = "";
  const bind = (row, title, body) => row.addEventListener("click", () => showRichMessage("schedule", title, body));
  if (schedule.length) {
    for (const item of schedule) {
      const row = document.createElement("li");
      row.className = "event-item";
      row.innerHTML = `<div class="event-meta">${item.enabled ? "enabled" : "disabled"}${item.cron ? ` · ${item.cron}` : ""}</div><div>${item.label || "Scheduled task"}</div><div class="event-meta">${item.nextRunAt ? `Next run ${formatDate(item.nextRunAt)}` : "No next run available"}</div>`;
      bind(row, item.label || "Scheduled task", `Cron: ${item.cron || "n/a"}\nTimezone: ${item.tz || "n/a"}\nNext run: ${item.nextRunAt ? formatDate(item.nextRunAt) : "unknown"}`);
      list.appendChild(row);
    }
  } else if (recentRuns.length) {
    for (const run of recentRuns.slice(0, 6)) {
      const row = document.createElement("li");
      row.className = "event-item";
      row.innerHTML = `<div class="event-meta">recent cron run${run.channel ? ` · ${run.channel}` : ""}</div><div>${run.label || "Scheduled task"}</div><div class="event-meta">${formatDate(run.updatedAt)}</div>`;
      bind(row, run.label || "Scheduled task", `Channel: ${run.channel || "n/a"}\nUpdated: ${formatDate(run.updatedAt)}\nSession: ${run.sessionKey || "n/a"}`);
      list.appendChild(row);
    }
  } else {
    const row = document.createElement("li");
    row.className = "event-item empty";
    row.textContent = "No schedule data yet.";
    list.appendChild(row);
  }
  setText("schedule-summary", schedule.length ? `${schedule.length} scheduled` : recentRuns.length ? `${recentRuns.length} past runs` : "none");
}

function showStashItem(item) {
  showRichMessage("stash", item.name, `${item.note || item.source}\nUpdated: ${formatDate(item.updatedAt)}\nPath: ${item.path}`, item.path);
}

function renderStash(stash) {
  appState.stash = stash || [];
  const list = document.getElementById("stash-list");
  list.innerHTML = "";
  setText("stash-summary", `${appState.stash.length} files`);
  if (!appState.stash.length) {
    const row = document.createElement("li");
    row.className = "event-item empty";
    row.textContent = "No stash items found.";
    list.appendChild(row);
    return;
  }
  for (const item of appState.stash) {
    const row = document.createElement("li");
    row.className = "event-item";
    row.innerHTML = `<div class="event-meta">${item.kind} · ${formatDate(item.updatedAt)}</div><div>${item.name}</div><div class="event-meta">${item.note || item.source}</div>`;
    row.addEventListener("click", () => showStashItem(item));
    list.appendChild(row);
  }
}

function handleStreamSnapshot(payload) {
  if (payload.world) renderWorld(payload.world);
  if (payload.detail?.ok) {
    renderInspector(payload.detail);
    renderHistory(payload.detail.history || []);
    renderSchedule(payload.detail);
    renderStash(payload.detail.stash || []);
    return;
  }
  if (payload.events?.events) renderHistory(payload.events.events);
}

function connectStream() {
  if (appState.stream) {
    appState.stream.close();
    appState.stream = null;
  }
  const params = new URLSearchParams();
  if (appState.selectedAgentId) params.set("agent_id", appState.selectedAgentId);
  const stream = new EventSource(`/api/agent-world/stream?${params.toString()}`);
  stream.onmessage = (event) => {
    try {
      handleStreamSnapshot(JSON.parse(event.data));
    } catch (err) {
      console.error("stream parse error", err);
    }
  };
  stream.onerror = () => setText("command-result", "Live stream disconnected. Retrying...");
  appState.stream = stream;
}

async function selectAgent(agentId) {
  appState.selectedAgentId = agentId;
  syncWorldDetailVisibility();
  setMessageSelection("current", "--", "Loading agent detail...", null, false);
  if (appState.world) renderWorld(appState.world);
  const detail = await getJson(`/api/agent-world/agents/${encodeURIComponent(agentId)}`);
  renderInspector(detail);
  renderHistory(detail.history || []);
  renderSchedule(detail);
  renderStash(detail.stash || []);
  connectStream();
}

function closeWorldDetails() {
  appState.selectedAgentId = null;
  appState.detail = null;
  syncWorldDetailVisibility();
  setText("agent-status-badge", "--");
  const badge = document.getElementById("agent-status-badge");
  if (badge) badge.className = "status-badge";
  if (appState.world) renderWorld(appState.world);
  renderHistory([]);
  renderSchedule(null);
  renderStash([]);
  connectStream();
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
  const floorInput = document.getElementById("floor-map-input");
  const wallInput = document.getElementById("wall-map-input");
  const furnitureInput = document.getElementById("furniture-map-input");
  const propInput = document.getElementById("prop-map-input");
  appState.editor.draftFloorText = normalizeMapText(floorInput?.value || "");
  appState.editor.draftWallText = normalizeMapText(wallInput?.value || "");
  appState.editor.draftFurnitureText = normalizeMapText(furnitureInput?.value || "");
  appState.editor.draftPropText = normalizeMapText(propInput?.value || "");
  commitDraftTilemap("Applied draft tilemap.");
}

function resetEditorState() {
  appState.editor.draftFloorText = appState.editor.baseFloorText;
  appState.editor.draftWallText = appState.editor.baseWallText;
  appState.editor.draftFurnitureText = appState.editor.baseFurnitureText;
  appState.editor.draftPropText = appState.editor.basePropText;
  appState.renderer.assets.layout.cols = appState.editor.baseCols;
  appState.renderer.assets.layout.rows = appState.editor.baseRows;
  document.getElementById("floor-map-input").value = appState.editor.baseFloorText;
  document.getElementById("wall-map-input").value = appState.editor.baseWallText;
  document.getElementById("furniture-map-input").value = appState.editor.baseFurnitureText;
  document.getElementById("prop-map-input").value = appState.editor.basePropText;
  setStoredMap(TILEMAP_STORAGE_KEYS.floor, appState.editor.baseFloorText);
  setStoredMap(TILEMAP_STORAGE_KEYS.wall, appState.editor.baseWallText);
  setStoredMap(TILEMAP_STORAGE_KEYS.furniture, appState.editor.baseFurnitureText);
  setStoredMap(TILEMAP_STORAGE_KEYS.prop, appState.editor.basePropText);
  applyEditorState();
}

function toggleEditMode() {
  appState.editor.enabled = !appState.editor.enabled;
  syncEditorInputs();
  drawRoom(appState.renderer);
  if (appState.world) renderWorld(appState.world);
}

function getAtlasPointerCell(event) {
  const image = document.getElementById("atlas-picker-image");
  const config = getVisualLayerConfig();
  if (!image) return null;
  const rect = image.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
  const col = Math.floor((x / rect.width) * config.cols) + 1;
  const row = Math.floor((y / rect.height) * config.rows) + 1;
  if (col < 1 || row < 1 || col > config.cols || row > config.rows) return null;
  return { x: col, y: row };
}

function getCanvasCellFromEvent(event, view) {
  const rect = view.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * getWorldWidth();
  const y = ((event.clientY - rect.top) / rect.height) * getWorldHeight();
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  if (col < 0 || row < 0 || col >= getWorldCols() || row >= getWorldRows()) return null;
  return { row, col };
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

document.getElementById("command-form").addEventListener("submit", submitCommand);
document.getElementById("voice-toggle").addEventListener("click", async () => {
  if (appState.voice.listening) stopVoiceCapture();
  else await startVoiceCapture();
});
document.getElementById("voice-stop").addEventListener("click", stopVoiceCapture);
document.getElementById("voice-speak-current").addEventListener("click", () => {
  speakText(appState.messageSelection.body || appState.messageSelection.title, "selected-message");
});
document.getElementById("voice-auto-send").addEventListener("change", (event) => {
  appState.voice.autoSend = !!event.target.checked;
  setVoiceStatus(appState.voice.autoSend ? "Auto-send is on." : "Auto-send is off.");
});
document.getElementById("voice-speak-replies").addEventListener("change", (event) => {
  appState.voice.speakReplies = !!event.target.checked;
  if (!appState.voice.speakReplies) stopSpeechPlayback();
  setVoiceStatus(appState.voice.speakReplies ? "Reply speech is on." : "Reply speech is off.");
});
document.getElementById("voice-input-select").addEventListener("change", (event) => {
  appState.voice.selectedInputDeviceId = event.target.value || "";
  setStoredMap(TILEMAP_STORAGE_KEYS.voiceInputDeviceId, appState.voice.selectedInputDeviceId);
  pushVoiceEvent(appState.voice.selectedInputDeviceId ? "Preferred mic input updated." : "Preferred mic input cleared.");
  if (appState.voice.listening) {
    stopVoiceCapture();
    setVoiceStatus("Microphone changed. Press Start Mic to reconnect.", false);
  } else {
    updateVoiceUi();
  }
});
document.getElementById("agent-select").addEventListener("change", async (event) => {
  const agentId = event.target.value;
  if (!agentId) {
    closeWorldDetails();
    return;
  }
  await selectAgent(agentId);
});
document.getElementById("close-world-details").addEventListener("click", closeWorldDetails);
document.getElementById("refresh-button").addEventListener("click", load);
document.getElementById("tab-world").addEventListener("click", () => setActiveTab("world"));
document.getElementById("tab-editor").addEventListener("click", () => setActiveTab("editor"));
document.getElementById("tab-settings").addEventListener("click", () => setActiveTab("settings"));
for (const button of document.querySelectorAll(".editor-subtab-btn")) {
  button.addEventListener("click", () => setActiveEditorSubview(button.dataset.editorView || "tilemap"));
}
document.getElementById("settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveSettings();
});
document.getElementById("settings-refresh").addEventListener("click", async () => {
  await fetchSettingsData();
  setSettingsResult("Diagnostics refreshed.");
});
document.getElementById("settings-save-json").addEventListener("click", async () => {
  await saveSettingsFromJsonEditor();
});
document.getElementById("settings-reload-json").addEventListener("click", async () => {
  await fetchSettingsData();
  setSettingsResult("Settings JSON reloaded from disk.");
});
document.getElementById("editor-shared-toggle").addEventListener("click", () => {
  const panel = document.getElementById("editor-shared-panel");
  if (!panel) return;
  panel.open = !panel.open;
});
document.getElementById("apply-tilemap").addEventListener("click", () => {
  try {
    applyEditorState();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("save-game-state").addEventListener("click", async () => {
  try {
    applyEditorState();
    await saveGameState();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("apply-game-state-json").addEventListener("click", () => {
  try {
    const textarea = document.getElementById("tilemap-state-json");
    const payload = parseImportedAgentWorldStorageState(textarea?.value || "");
    applyImportedAgentWorldStorageState(payload);
    writeGameStateToLocalStorage(payload);
    const snapshot = structuredSnapshotFromGameState(payload, appState.renderer?.assets?.layout || {});
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
document.getElementById("download-game-state-json").addEventListener("click", () => {
  try {
    syncGameStateTextarea();
    const textarea = document.getElementById("tilemap-state-json");
    const content = textarea?.value || "{}";
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "agent_world_game_state.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setTilemapStatus("Downloaded current game state JSON.");
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("reset-tilemap").addEventListener("click", () => {
  try {
    resetEditorState();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("floor-map-input").addEventListener("input", (event) => {
  appState.editor.draftFloorText = event.target.value;
  renderVisualEditor();
});
document.getElementById("wall-map-input").addEventListener("input", (event) => {
  appState.editor.draftWallText = event.target.value;
  renderVisualEditor();
});
document.getElementById("furniture-map-input").addEventListener("input", (event) => {
  appState.editor.draftFurnitureText = event.target.value;
  renderVisualEditor();
});
document.getElementById("prop-map-input").addEventListener("input", (event) => {
  appState.editor.draftPropText = event.target.value;
  renderVisualEditor();
});
document.getElementById("visual-token-empty").addEventListener("click", () => {
  try {
    applyVisualToken(".");
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("assign-chat-bubble-tile").addEventListener("click", () => {
  try {
    assignChatBubbleTile();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("reset-chat-bubble-frame").addEventListener("click", () => {
  try {
    resetChatBubbleFrame();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
for (const button of document.querySelectorAll(".chat-bubble-role-btn")) {
  button.addEventListener("click", () => {
    appState.editor.selectedChatBubbleRole = ["assistant", "tool", "user"].includes(button.dataset.role) ? button.dataset.role : "assistant";
    const frame = selectedChatBubbleTheme()?.frame?.[appState.editor.selectedChatBubbleSlot || "mm"] || null;
    if (frame?.layer && ["floor", "wall"].includes(frame.layer)) {
      appState.editor.selectedLayer = frame.layer;
    }
    renderVisualEditor();
  });
}
document.getElementById("chat-bubble-text-color").addEventListener("input", (event) => {
  setChatBubbleTextColor(event.target.value);
});
document.getElementById("toggle-editor-agents").addEventListener("change", (event) => {
  appState.editor.showAgents = Boolean(event.target.checked);
  if (appState.world) renderWorld(appState.world);
});
document.getElementById("region-kind-input").addEventListener("change", (event) => {
  appState.editor.regionKind = event.target.value === "door" ? "door" : "room";
});
document.getElementById("region-id-input").addEventListener("change", (event) => {
  appState.editor.regionId = event.target.value;
});
document.getElementById("region-label-input").addEventListener("input", (event) => {
  appState.editor.regionLabel = event.target.value;
});
document.getElementById("assign-region").addEventListener("click", () => {
  try {
    assignRegionSelection();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("clear-region").addEventListener("click", () => {
  try {
    clearRegionSelection();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("set-region-label-position").addEventListener("click", () => {
  try {
    setRegionLabelPosition();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("assign-stash").addEventListener("click", () => {
  try {
    assignStashSelection();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("clear-stash").addEventListener("click", () => {
  try {
    clearStashSelection();
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
document.getElementById("editor-zoom-select").addEventListener("change", (event) => {
  appState.editor.zoom = Number(event.target.value) || 2;
  renderVisualEditor();
});
document.getElementById("resize-grid").addEventListener("click", () => {
  try {
    resizeTilemapGrid(
      document.getElementById("grid-cols-input").value,
      document.getElementById("grid-rows-input").value,
    );
  } catch (err) {
    setTilemapStatus(err.message, true);
  }
});
for (const button of document.querySelectorAll("#visual-layer-toggle [data-layer]")) {
  button.addEventListener("click", () => setVisualLayer(button.dataset.layer));
}
const atlasBoard = document.getElementById("atlas-picker-board");
document.getElementById("atlas-picker-image").addEventListener("load", () => renderVisualEditor());
atlasBoard.addEventListener("mousemove", (event) => {
  const cell = getAtlasPointerCell(event);
  appState.editor.hoveredAtlasCell = cell;
  renderVisualEditor();
});
atlasBoard.addEventListener("mouseleave", () => {
  appState.editor.hoveredAtlasCell = null;
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
document.getElementById("move-agent-button").addEventListener("click", async () => {
  try {
    await moveSelectedAgentToAnchor();
  } catch (err) {
    document.getElementById("command-result").textContent = `Move error: ${err.message}`;
  }
});

setActiveTab("world");

load().catch((err) => {
  setTilemapStatus(err.message, true);
  document.getElementById("command-result").textContent = `Load error: ${err.message}`;
});
initVoiceControls();
