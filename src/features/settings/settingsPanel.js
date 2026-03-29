export function renderCodeWithLineNumbers(text, helpers = {}) {
  const { escapeHtml = (value) => value } = helpers;
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

export function renderSettingsChecks(state, helpers = {}) {
  const {
    documentRef = document,
    escapeHtml = (value) => value,
    renderCodeWithLineNumbers = (text) => text,
    setText = () => {},
  } = helpers;
  const container = documentRef.getElementById("settings-checks");
  if (!container) return;
  const checks = Array.isArray(state.settings.diagnostics?.checks) ? state.settings.diagnostics.checks : [];
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

export function syncSettingsJsonEditor(state, helpers = {}) {
  const { documentRef = document } = helpers;
  const editor = documentRef.getElementById("settings-json-editor");
  if (!editor) return;
  const payload = state.settings.data ?? {};
  editor.value = JSON.stringify(payload, null, 2);
}

export function syncSettingsForm(state, helpers = {}) {
  const { documentRef = document } = helpers;
  const cfg = state.settings.data || {};
  const openclaw = cfg.openclaw || {};
  const voice = cfg.voice || {};
  const server = cfg.server || {};
  const allowedRoots = Array.isArray(openclaw.allowedFileRoots) ? openclaw.allowedFileRoots.join("\n") : "";
  const homeInput = documentRef.getElementById("settings-openclaw-home");
  const mediaInput = documentRef.getElementById("settings-openclaw-media-dir");
  const hostInput = documentRef.getElementById("settings-server-host");
  const portInput = documentRef.getElementById("settings-server-port");
  const allowedRootsInput = documentRef.getElementById("settings-allowed-file-roots");
  const voiceProviderInput = documentRef.getElementById("settings-voice-provider");
  const voiceApiKeyEnvInput = documentRef.getElementById("settings-voice-api-key-env");
  const voiceTranscribeModelInput = documentRef.getElementById("settings-voice-transcribe-model");
  const voiceSpeechModelInput = documentRef.getElementById("settings-voice-speech-model");
  const voiceDefaultVoiceInput = documentRef.getElementById("settings-voice-default-voice");
  const voiceSpeechFormatInput = documentRef.getElementById("settings-voice-speech-format");
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

export function renderSettingsSummary(state, helpers = {}) {
  const {
    applyRuntimeStatusTone = () => {},
    renderSettingsChecks = () => {},
    setText = () => {},
  } = helpers;
  const diagnostics = state.settings.diagnostics;
  const runtime = diagnostics?.runtime || null;
  setText("settings-path", diagnostics?.settingsPath || "agent_world.json");
  setText("resolved-settings-path", diagnostics?.resolvedPaths?.settingsPath || diagnostics?.settingsPath || "--");
  setText(
    "settings-summary",
    state.settings.loading
      ? "Loading..."
      : state.settings.saving
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

export function collectSettingsPayload(helpers = {}) {
  const { documentRef = document } = helpers;
  const allowedRootsText = documentRef.getElementById("settings-allowed-file-roots")?.value || "";
  return {
    openclaw: {
      home: documentRef.getElementById("settings-openclaw-home")?.value.trim() || "",
      mediaDir: documentRef.getElementById("settings-openclaw-media-dir")?.value.trim() || "",
      allowedFileRoots: allowedRootsText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
    },
    voice: {
      provider: documentRef.getElementById("settings-voice-provider")?.value.trim() || "openai",
      apiKeyEnv: documentRef.getElementById("settings-voice-api-key-env")?.value.trim() || "OPENAI_API_KEY",
      transcribeModel: documentRef.getElementById("settings-voice-transcribe-model")?.value.trim() || "gpt-4o-mini-transcribe",
      speechModel: documentRef.getElementById("settings-voice-speech-model")?.value.trim() || "gpt-4o-mini-tts",
      defaultVoice: documentRef.getElementById("settings-voice-default-voice")?.value.trim() || "nova",
      speechFormat: documentRef.getElementById("settings-voice-speech-format")?.value.trim() || "mp3",
    },
    server: {
      host: documentRef.getElementById("settings-server-host")?.value.trim() || "0.0.0.0",
      port: Number(documentRef.getElementById("settings-server-port")?.value) || 8890,
    },
  };
}

export async function fetchSettingsData(state, helpers = {}) {
  const {
    fetchSettings = () => Promise.resolve({}),
    fetchDiagnostics = () => Promise.resolve({}),
    renderSettingsSummary = () => {},
    setSettingsResult = () => {},
    syncSettingsForm = () => {},
    syncSettingsJsonEditor = () => {},
  } = helpers;
  state.settings.loading = true;
  renderSettingsSummary();
  try {
    const [settings, diagnostics] = await Promise.all([
      fetchSettings(),
      fetchDiagnostics(),
    ]);
    state.settings.data = settings;
    state.settings.diagnostics = diagnostics;
    syncSettingsForm();
    syncSettingsJsonEditor();
    renderSettingsSummary();
    setSettingsResult("");
  } catch (error) {
    setSettingsResult(`Settings load error: ${error?.message || String(error)}`, true);
  } finally {
    state.settings.loading = false;
    renderSettingsSummary();
  }
}

export async function saveSettings(state, helpers = {}) {
  const {
    collectSettingsPayload = () => ({}),
    fetchSettingsData = async () => {},
    fetchVoiceConfig = async () => {},
    postSettings = async (payload) => payload,
    renderSettingsSummary = () => {},
    setSettingsResult = () => {},
  } = helpers;
  state.settings.saving = true;
  renderSettingsSummary();
  try {
    const payload = collectSettingsPayload();
    const saved = await postSettings(payload);
    state.settings.data = saved;
    await fetchSettingsData();
    await fetchVoiceConfig();
    setSettingsResult("Settings saved. Server host/port changes apply on the next restart.");
  } catch (error) {
    setSettingsResult(`Settings save error: ${error?.message || String(error)}`, true);
  } finally {
    state.settings.saving = false;
    renderSettingsSummary();
  }
}

export async function saveSettingsFromJsonEditor(state, helpers = {}) {
  const {
    documentRef = document,
    fetchSettingsData = async () => {},
    fetchVoiceConfig = async () => {},
    postSettings = async (payload) => payload,
    renderSettingsSummary = () => {},
    setSettingsResult = () => {},
    syncSettingsForm = () => {},
    syncSettingsJsonEditor = () => {},
  } = helpers;
  const editor = documentRef.getElementById("settings-json-editor");
  if (!editor) return;
  state.settings.saving = true;
  renderSettingsSummary();
  try {
    const raw = editor.value.trim();
    const payload = raw ? JSON.parse(raw) : {};
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Root settings payload must be a JSON object.");
    }
    const saved = await postSettings(payload);
    state.settings.data = saved;
    syncSettingsForm();
    syncSettingsJsonEditor();
    await fetchSettingsData();
    await fetchVoiceConfig();
    setSettingsResult("Raw settings JSON saved.");
  } catch (error) {
    setSettingsResult(`Raw settings save error: ${error?.message || String(error)}`, true);
  } finally {
    state.settings.saving = false;
    renderSettingsSummary();
  }
}
