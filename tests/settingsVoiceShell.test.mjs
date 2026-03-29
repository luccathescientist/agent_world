import test from "node:test";
import assert from "node:assert/strict";

import {
  appendVoiceTranscript,
  applyRuntimeStatusTone,
  collectSettingsPayload,
  fetchSettingsData,
  fetchVoiceConfig,
  pushVoiceEvent,
  renderCodeWithLineNumbers,
  renderSettingsChecks,
  renderSettingsSummary,
  renderVoiceDebugUi,
  renderVoiceTranscriptDebug,
  saveSettings,
  saveSettingsFromJsonEditor,
  setSettingsResult,
  setVoiceDebugText,
  setVoiceStatus,
  speakText,
  stopSpeechPlayback,
  syncSettingsForm,
  syncSettingsJsonEditor,
  updateVoiceUi,
} from "../src/app/settingsVoiceShell.js";

test("settings/voice shell updates DOM status elements", () => {
  const voice = { textContent: "", style: { color: "" } };
  const settings = { textContent: "", style: { color: "" } };
  const debug = { textContent: "" };
  const documentRef = {
    getElementById(id) {
      if (id === "voice-status") return voice;
      if (id === "settings-result") return settings;
      if (id === "voice-debug") return debug;
      return null;
    },
  };
  setVoiceStatus("Listening", true, { documentRef });
  setSettingsResult("Saved", false, { documentRef });
  setVoiceDebugText("voice-debug", "trace", { documentRef });
  applyRuntimeStatusTone("settings-result", "offline", { documentRef });
  assert.equal(voice.textContent, "Listening");
  assert.equal(voice.style.color, "var(--warning)");
  assert.equal(settings.textContent, "Saved");
  assert.equal(settings.style.color, "var(--warning)");
  assert.equal(debug.textContent, "trace");
});

test("settings/voice shell forwards settings helpers", async () => {
  const calls = [];
  const state = {};
  assert.equal(
    renderCodeWithLineNumbers("code", {
      escapeHtml: (value) => `e:${value}`,
      renderCodeWithLineNumbersHelper: (...args) => {
        calls.push(["code", ...args]);
        return "rendered";
      },
    }),
    "rendered",
  );
  renderSettingsChecks(state, {
    documentRef: { body: {} },
    escapeHtml: (value) => value,
    renderCodeWithLineNumbers: () => "",
    renderSettingsChecksHelper: (...args) => calls.push(["checks", ...args]),
    setText: () => {},
  });
  syncSettingsJsonEditor(state, {
    documentRef: { body: {} },
    syncSettingsJsonEditorHelper: (...args) => calls.push(["json", ...args]),
  });
  syncSettingsForm(state, {
    documentRef: { body: {} },
    syncSettingsFormHelper: (...args) => calls.push(["form", ...args]),
  });
  renderSettingsSummary(state, {
    applyRuntimeStatusTone: () => {},
    renderSettingsChecks: () => {},
    renderSettingsSummaryHelper: (...args) => calls.push(["summary", ...args]),
    setText: () => {},
  });
  assert.deepEqual(
    collectSettingsPayload({
      collectSettingsPayloadHelper: (...args) => {
        calls.push(["collect", ...args]);
        return { ok: true };
      },
      documentRef: { body: {} },
    }),
    { ok: true },
  );
  await fetchSettingsData(state, {
    fetchDiagnostics: async () => ({}),
    fetchSettings: async () => ({}),
    fetchSettingsDataHelper: async (...args) => calls.push(["fetchSettings", ...args]),
    renderSettingsSummary: () => {},
    setSettingsResult: () => {},
    syncSettingsForm: () => {},
    syncSettingsJsonEditor: () => {},
  });
  await saveSettings(state, {
    collectSettingsPayload: () => ({}),
    fetchSettingsData: async () => {},
    fetchVoiceConfig: async () => {},
    postSettings: async () => ({}),
    renderSettingsSummary: () => {},
    saveSettingsHelper: async (...args) => calls.push(["save", ...args]),
    setSettingsResult: () => {},
  });
  await saveSettingsFromJsonEditor(state, {
    documentRef: { body: {} },
    fetchSettingsData: async () => {},
    fetchVoiceConfig: async () => {},
    postSettings: async () => ({}),
    renderSettingsSummary: () => {},
    saveSettingsFromJsonEditorHelper: async (...args) => calls.push(["saveJson", ...args]),
    setSettingsResult: () => {},
    syncSettingsForm: () => {},
    syncSettingsJsonEditor: () => {},
  });
  assert.ok(calls.length >= 8);
});

test("settings/voice shell forwards voice helpers", async () => {
  const calls = [];
  const state = {};
  await fetchVoiceConfig(state, {
    fetchVoiceConfigHelper: async (...args) => calls.push(["voiceConfig", ...args]),
    getJson: async () => ({}),
    pushVoiceEvent: () => {},
    updateVoiceUi: () => {},
  });
  pushVoiceEvent(state, "hello", {
    pushVoiceEventHelper: (...args) => calls.push(["push", ...args]),
    setVoiceDebugText: () => {},
  });
  renderVoiceTranscriptDebug(state, {
    normalizeSpeechText: (value) => value,
    renderVoiceTranscriptDebugHelper: (...args) => calls.push(["transcript", ...args]),
    setVoiceDebugText: () => {},
  });
  renderVoiceDebugUi(state, {
    documentRef: { body: {} },
    renderVoiceDebugUiHelper: (...args) => calls.push(["debugUi", ...args]),
    renderVoiceTranscriptDebug: () => {},
    setVoiceDebugText: () => {},
  });
  updateVoiceUi(state, {
    documentRef: { body: {} },
    renderVoiceDebugUi: () => {},
    updateVoiceUiHelper: (...args) => calls.push(["voiceUi", ...args]),
  });
  appendVoiceTranscript("hi", {
    appendVoiceTranscriptHelper: (...args) => calls.push(["append", ...args]),
    documentRef: { body: {} },
  });
  stopSpeechPlayback(state, {
    stopSpeechPlaybackHelper: (...args) => calls.push(["stopSpeech", ...args]),
    URLRef: URL,
    windowRef: {},
  });
  await speakText(state, "hello", "manual", {
    AudioCtor: class FakeAudio {},
    fetchRef: async () => ({}),
    normalizeSpeechText: (value) => value,
    pushVoiceEvent: () => {},
    renderVoiceDebugUi: () => {},
    setVoiceStatus: () => {},
    speakTextHelper: async (...args) => calls.push(["speak", ...args]),
    stopSpeechPlayback: () => {},
    updateVoiceUi: () => {},
    URLRef: URL,
    windowRef: {},
  });
  assert.ok(calls.length >= 8);
});
