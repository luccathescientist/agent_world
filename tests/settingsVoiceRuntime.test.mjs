import test from "node:test";
import assert from "node:assert/strict";

import { createSettingsVoiceRuntime } from "../src/app/settingsVoiceRuntime.js";

test("settingsVoiceRuntime wires settings fetch/save flows through shell adapters", async () => {
  const state = { voice: { events: [] } };
  const calls = [];
  const runtime = createSettingsVoiceRuntime(state, {
    documentRef: {
      getElementById() {
        return { textContent: "", style: {} };
      },
    },
    getJson: async (url) => ({ url }),
    postJson: async (url, payload) => ({ url, payload }),
    fetchSettingsDataShell: async (_state, deps) => {
      calls.push("fetchSettingsData");
      assert.deepEqual(await deps.fetchDiagnostics(), { url: "/api/agent-world/settings/diagnostics" });
      assert.deepEqual(await deps.fetchSettings(), { url: "/api/agent-world/settings" });
      deps.renderSettingsSummary();
      deps.syncSettingsForm();
      deps.syncSettingsJsonEditor();
      deps.setSettingsResult("ok");
    },
    renderSettingsSummaryShell: (_state, deps) => {
      calls.push("renderSettingsSummary");
      deps.applyRuntimeStatusTone("settings-result", "online");
      deps.renderSettingsChecks();
      deps.setText({}, "summary");
    },
    renderSettingsChecksShell: (_state, deps) => {
      calls.push("renderSettingsChecks");
      deps.renderCodeWithLineNumbers("x");
    },
    renderCodeWithLineNumbersShell: (text, deps) => {
      calls.push(["renderCodeWithLineNumbers", text]);
      return deps.renderCodeWithLineNumbersHelper(text, { escapeHtml: deps.escapeHtml });
    },
    renderCodeWithLineNumbersHelper: (text, deps) => deps.escapeHtml(text),
    fetchSettingsDataHelper: async () => {},
    syncSettingsFormShell: () => calls.push("syncSettingsForm"),
    syncSettingsJsonEditorShell: () => calls.push("syncSettingsJsonEditor"),
    setSettingsResultShell: (text) => calls.push(["setSettingsResult", text]),
    applyRuntimeStatusToneShell: (id, tone) => calls.push(["applyRuntimeStatusTone", id, tone]),
    setText: () => calls.push("setText"),
    saveSettingsShell: async (_state, deps) => {
      calls.push("saveSettings");
      deps.collectSettingsPayload();
      await deps.fetchSettingsData();
      await deps.fetchVoiceConfig();
      await deps.postSettings({ ok: true });
      deps.renderSettingsSummary();
      deps.setSettingsResult("saved");
    },
    collectSettingsPayloadShell: () => {
      calls.push("collectSettingsPayload");
      return { ok: true };
    },
    fetchVoiceConfigShell: async () => calls.push("fetchVoiceConfig"),
  });

  await runtime.fetchSettingsData();
  await runtime.saveSettings();

  assert.ok(calls.includes("fetchSettingsData"));
  assert.ok(calls.includes("saveSettings"));
  assert.ok(calls.includes("renderSettingsSummary"));
  assert.ok(calls.includes("renderSettingsChecks"));
  assert.ok(calls.includes("syncSettingsForm"));
  assert.ok(calls.includes("syncSettingsJsonEditor"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "setSettingsResult"));
});

test("settingsVoiceRuntime sendCommandText and voice actions keep browser/runtime bindings", async () => {
  const result = { textContent: "", style: {} };
  const state = { selectedAgentId: "agent-1", detail: { history: [], session: { history: [] } }, stream: {} };
  const calls = [];
  const runtime = createSettingsVoiceRuntime(state, {
    documentRef: {
      getElementById(id) {
        if (id === "command-result") return result;
        return { textContent: "", style: {}, value: "" };
      },
    },
    getJson: async (url, options) => {
      calls.push(["getJson", url, options?.method]);
      return {
        status: "accepted",
        acceptedAt: "2026-03-29T12:00:00Z",
        echoedCommand: "hello",
        reason: "",
      };
    },
    formatTime: () => "12:00",
    load: async () => calls.push("load"),
    renderHistory: (history) => calls.push(["renderHistory", history]),
    speakTextShell: async (_state, text, source, deps) => {
      calls.push(["speakText", text, source]);
      deps.setVoiceStatus("speaking");
      deps.pushVoiceEvent("voice");
      deps.renderVoiceDebugUi();
      deps.stopSpeechPlayback();
      deps.updateVoiceUi();
    },
    setVoiceStatusShell: (text) => calls.push(["setVoiceStatus", text]),
    pushVoiceEventShell: (_state, message, deps) => {
      calls.push(["pushVoiceEvent", message]);
      deps.setVoiceDebugText("voice-debug", message);
    },
    setVoiceDebugTextShell: (id, value) => calls.push(["setVoiceDebugText", id, value]),
    renderVoiceDebugUiShell: () => calls.push("renderVoiceDebugUi"),
    stopSpeechPlaybackShell: () => calls.push("stopSpeechPlayback"),
    updateVoiceUiShell: () => calls.push("updateVoiceUi"),
    startVoiceCaptureShell: async (_state, deps) => {
      calls.push("startVoiceCapture");
      await deps.ensureMicMeter();
      await deps.transcribeRecordedAudio("blob");
      deps.updateVoiceUi();
    },
    ensureMicMeterShell: async () => calls.push("ensureMicMeter"),
    transcribeRecordedAudioShell: async (_state, blob, deps) => {
      calls.push(["transcribeRecordedAudio", blob]);
      await deps.sendCommandText("voice");
    },
  });

  const accepted = await runtime.sendCommandText("hello");
  await runtime.speakText("reply", "agent");
  await runtime.startVoiceCapture();

  assert.equal(accepted, true);
  assert.match(result.textContent, /Sent at 12:00: hello/);
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "getJson"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "renderHistory"));
  assert.ok(state.detail.history.length >= 1);
  assert.equal(state.detail.history[0].type, "operator_command");
  assert.ok(state.detail.history.some((event) => event.label === "hello"));
  assert.equal(state.detail.session.history.length, state.detail.history.length);
  assert.equal(calls.includes("load"), false);
  assert.ok(calls.includes("startVoiceCapture"));
  assert.ok(calls.includes("ensureMicMeter"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "transcribeRecordedAudio"));
});
