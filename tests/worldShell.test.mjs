import test from "node:test";
import assert from "node:assert/strict";

import {
  closeWorldDetails,
  connectStream,
  handleStreamSnapshot,
  renderChat,
  renderHistory,
  renderInspector,
  renderSchedule,
  renderStash,
  renderWorld,
  showRichMessage,
  showStashItem,
  syncSelectedAgentDetailFromWorld,
} from "../src/app/worldShell.js";

test("world shell forwards render and stream helpers", async () => {
  const state = { selectedAgentId: "lucca" };
  const calls = [];

  renderWorld(state, { agents: [] }, {
    bubblePaletteForAgent: () => ({}),
    createAgentSprite: () => null,
    createBenchmarkSprite: () => null,
    formatDate: () => "date",
    isBenchmarkAgent: () => false,
    populateAgentSelect: () => {},
    renderWorldHelper: (...args) => calls.push(["world", ...args]),
    setText: () => {},
    shouldShowAgentSprite: () => true,
    syncSelectedAgentDetailFromWorld: () => {},
    updateActivityCue: () => {},
    updateAgentLabel: () => {},
    updateBubble: () => {},
  });
  syncSelectedAgentDetailFromWorld(state, { agents: [] }, {
    renderInspector: () => {},
    syncSelectedAgentDetailFromWorldHelper: (...args) => calls.push(["syncDetail", ...args]),
  });
  renderInspector(state, { detail: true }, {
    displayedLocationLabel: () => "Library",
    documentRef: { body: {} },
    formatDate: () => "date",
    renderInspectorHelper: (...args) => calls.push(["inspector", ...args]),
    setText: () => {},
    showRichMessage: async () => {},
    statusClass: () => "active",
  });
  await showRichMessage(state, "detail", "Title", "Body", null, {
    classifyPath: () => "text",
    createElement: () => ({}),
    documentRef: { body: {} },
    extractPaths: () => [],
    fetchText: async () => "",
    fileUrl: (value) => value,
    renderRichText: () => {},
    setMessageSelection: () => {},
    setText: () => {},
    showRichMessageHelper: async (...args) => {
      calls.push(["showRich", ...args]);
    },
    windowRef: {},
  });
  renderChat(state, [], {
    applyChatRoleTheme: () => {},
    chatBubbleMarkup: () => "",
    classifyPath: () => "text",
    createElement: () => ({}),
    documentRef: { body: {} },
    extractPaths: () => [],
    fileUrl: (value) => value,
    formatRichTextHtml: (value) => value,
    formatTime: () => "time",
    historyRoleClass: () => "assistant",
    historyRoleMeta: () => ({ label: "", icon: "" }),
    maybeSpeakReply: () => {},
    renderChatHelper: (...args) => calls.push(["chat", ...args]),
    setText: () => {},
    showRichMessage: async () => {},
    windowRef: {},
  });
  renderHistory([], {
    createElement: () => ({}),
    documentRef: { body: {} },
    extractPaths: () => [],
    formatTime: () => "time",
    renderChat: () => {},
    renderHistoryHelper: (...args) => calls.push(["history", ...args]),
    showRichMessage: async () => {},
  });
  renderSchedule(null, {
    createElement: () => ({}),
    documentRef: { body: {} },
    formatDate: () => "date",
    renderScheduleHelper: (...args) => calls.push(["schedule", ...args]),
    setText: () => {},
    showRichMessage: async () => {},
  });
  showStashItem({ id: 1 }, {
    formatDate: () => "date",
    showRichMessage: async () => {},
    showStashItemHelper: (...args) => calls.push(["stashItem", ...args]),
  });
  renderStash(state, [], {
    createElement: () => ({}),
    documentRef: { body: {} },
    formatDate: () => "date",
    renderStashHelper: (...args) => calls.push(["stash", ...args]),
    setText: () => {},
    showStashItem: () => {},
  });
  handleStreamSnapshot({ world: {} }, {
    handleStreamSnapshotHelper: (...args) => calls.push(["streamSnapshot", ...args]),
    renderHistory: () => {},
    renderInspector: () => {},
    renderSchedule: () => {},
    renderStash: () => {},
    renderWorld: () => {},
  });
  connectStream(state, {
    EventSourceCtor: class FakeEventSource {},
    URLSearchParamsCtor: URLSearchParams,
    connectStreamHelper: (...args) => calls.push(["connect", ...args]),
    consoleRef: console,
    handleStreamSnapshot: () => {},
    setText: () => {},
  });
  closeWorldDetails(state, {
    closeWorldDetailsHelper: (...args) => calls.push(["close", ...args]),
    connectStream: () => {},
    documentRef: { body: {} },
    renderHistory: () => {},
    renderSchedule: () => {},
    renderStash: () => {},
    renderWorld: () => {},
    setText: () => {},
    syncWorldDetailVisibility: () => {},
  });

  assert.equal(calls.length, 12);
});
