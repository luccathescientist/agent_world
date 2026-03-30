import test from "node:test";
import assert from "node:assert/strict";

import { createWorldUiRuntime } from "../src/app/worldUiRuntime.js";

test("world UI runtime wires moved world/chat/detail methods through shells and helpers", async () => {
  const calls = [];
  const state = { selectedAgentId: "lucca" };

  const runtime = createWorldUiRuntime(state, {
    documentRef: {
      body: {},
      createElement: () => ({}),
    },
    windowRef: {},
    fetchRef: async () => ({ text: async () => "" }),
    EventSourceCtor: class FakeEventSource {},
    URLSearchParamsCtor: URLSearchParams,
    consoleRef: console,
    setText: () => {},
    getJson: async () => ({}),
    bubblePaletteForAgent: () => ({}),
    createAgentSprite: () => null,
    createBenchmarkSprite: () => null,
    isBenchmarkAgent: () => false,
    maybeSpeakReply: () => {},
    displayedLocationLabel: () => "Library",
    populateAgentSelect: () => {},
    shouldShowAgentSprite: () => true,
    statusClass: () => "active",
    updateActivityCue: () => {},
    updateAgentLabel: () => {},
    updateBubble: () => {},
    applyChatRoleTheme: () => {},
    chatBubbleMarkup: () => "",
    formatRichTextHtml: (value) => value,
    renderRichText: () => {},
    setMessageSelection: () => {},
    renderWorldShell: (...args) => calls.push(["world", ...args]),
    syncSelectedAgentDetailFromWorldShell: (...args) => calls.push(["syncDetail", ...args]),
    renderInspectorShell: (...args) => calls.push(["inspector", ...args]),
    showRichMessageShell: async (...args) => {
      calls.push(["showRich", ...args]);
    },
    renderChatShell: (...args) => calls.push(["chat", ...args]),
    renderHistoryShell: (...args) => calls.push(["history", ...args]),
    renderScheduleShell: (...args) => calls.push(["schedule", ...args]),
    showStashItemShell: (...args) => calls.push(["stashItem", ...args]),
    renderStashShell: (...args) => calls.push(["stash", ...args]),
    handleStreamSnapshotShell: (...args) => calls.push(["streamSnapshot", ...args]),
    connectStreamShell: (...args) => calls.push(["connect", ...args]),
    selectAgentHelper: async (...args) => {
      calls.push(["select", ...args]);
    },
    closeWorldDetailsShell: (...args) => calls.push(["close", ...args]),
  });

  runtime.renderWorld({ agents: [] });
  runtime.syncSelectedAgentDetailFromWorld({ agents: [] });
  runtime.renderInspector({ detail: true });
  await runtime.showRichMessage("detail", "Title", "Body");
  runtime.renderChat([]);
  runtime.renderHistory([]);
  runtime.renderSchedule(null);
  runtime.showStashItem({ id: 1 });
  runtime.renderStash([]);
  runtime.handleStreamSnapshot({ world: {} });
  runtime.connectStream();
  await runtime.selectAgent("lucca-main");
  runtime.closeWorldDetails();

  assert.equal(calls.length, 13);
});
