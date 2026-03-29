import test from "node:test";
import assert from "node:assert/strict";

import {
  closeWorldDetails,
  connectStream,
  handleStreamSnapshot,
  renderInspector,
  selectAgent,
  syncSelectedAgentDetailFromWorld,
} from "../src/features/world/agentDetails.js";

function makeDocument() {
  const badge = { textContent: "", className: "" };
  return {
    badge,
    getElementById(id) {
      if (id === "agent-status-badge") return badge;
      return null;
    },
  };
}

test("syncSelectedAgentDetailFromWorld merges live agent data into selected detail", () => {
  const calls = [];
  const state = {
    selectedAgentId: "lucca",
    detail: {
      agent: { id: "lucca", runtimeStatus: "idle", queueDepth: 1 },
      session: { sessionKey: "abc" },
    },
  };
  syncSelectedAgentDetailFromWorld(state, {
    agents: [{ id: "lucca", runtimeStatus: "active", queueDepth: 3 }],
  }, {
    renderInspector: (payload) => calls.push(payload),
  });
  assert.equal(state.detail.agent.runtimeStatus, "active");
  assert.equal(state.detail.agent.queueDepth, 3);
  assert.equal(calls.length, 1);
});

test("renderInspector updates state and status badge", () => {
  const documentRef = makeDocument();
  const texts = new Map();
  const state = { messageSelection: { locked: false, kind: "current" }, detail: null };
  const payload = {
    agent: {
      id: "lucca",
      name: "Lucca",
      model: "gpt",
      runtimeStatus: "active",
      currentAction: "Idle",
      currentActionFull: "Reading logs",
      visualState: "idle",
      lastTool: "search",
      queueDepth: 2,
      waitingReason: "none",
      lastUpdatedAt: "2025-01-01T00:00:00Z",
    },
    session: {
      sessionKey: "sess-1",
      lastChannel: "commentary",
    },
  };
  const shown = [];
  renderInspector(state, payload, {
    displayedLocationLabel: () => "Library",
    documentRef,
    formatDate: () => "formatted-date",
    setText: (id, value) => texts.set(id, value),
    showRichMessage: (...args) => shown.push(args),
    statusClass: (status) => `status-${status}`,
  });
  assert.equal(state.detail, payload);
  assert.equal(texts.get("agent-name"), "Lucca");
  assert.equal(texts.get("agent-location"), "Library");
  assert.equal(documentRef.badge.textContent, "active");
  assert.equal(documentRef.badge.className, "status-badge status-active");
  assert.equal(shown.length, 1);
});

test("handleStreamSnapshot routes detail and event payloads", () => {
  const calls = [];
  handleStreamSnapshot({
    world: { room: { name: "Lab" } },
    detail: { ok: true, history: [1], stash: [2] },
  }, {
    renderWorld: (payload) => calls.push(["world", payload]),
    renderInspector: (payload) => calls.push(["inspector", payload]),
    renderHistory: (payload) => calls.push(["history", payload]),
    renderSchedule: (payload) => calls.push(["schedule", payload]),
    renderStash: (payload) => calls.push(["stash", payload]),
  });
  assert.deepEqual(calls.map(([kind]) => kind), ["world", "inspector", "history", "schedule", "stash"]);
});

test("connectStream replaces prior stream and wires handlers", () => {
  const events = [];
  let closed = false;
  class FakeEventSource {
    constructor(url) {
      this.url = url;
      events.push(url);
    }
    close() {
      closed = true;
    }
  }
  const state = {
    selectedAgentId: "lucca",
    stream: { close() { closed = true; } },
  };
  connectStream(state, {
    EventSourceCtor: FakeEventSource,
    URLSearchParamsCtor: URLSearchParams,
    consoleRef: { error() {} },
    handleStreamSnapshot: () => {},
    setText: () => {},
  });
  assert.equal(closed, true);
  assert.equal(events[0], "/api/agent-world/stream?agent_id=lucca");
  assert.ok(state.stream instanceof FakeEventSource);
});

test("selectAgent fetches detail and refreshes dependent panels", async () => {
  const calls = [];
  const state = {
    selectedAgentId: null,
    world: { agents: [] },
  };
  await selectAgent(state, "lucca", {
    connectStream: () => calls.push("stream"),
    getJson: async (url) => {
      calls.push(url);
      return { history: [1], stash: [2], schedule: [3] };
    },
    renderHistory: (payload) => calls.push(["history", payload]),
    renderInspector: (payload) => calls.push(["inspector", payload]),
    renderSchedule: (payload) => calls.push(["schedule", payload]),
    renderStash: (payload) => calls.push(["stash", payload]),
    renderWorld: () => calls.push("world"),
    setMessageSelection: (...args) => calls.push(["message", args]),
    syncWorldDetailVisibility: () => calls.push("visibility"),
  });
  assert.equal(state.selectedAgentId, "lucca");
  assert.deepEqual(calls[0], "visibility");
  assert.deepEqual(calls[1][0], "message");
  assert.equal(calls.includes("stream"), true);
});

test("closeWorldDetails clears selection and resets visible panels", () => {
  const documentRef = makeDocument();
  const texts = new Map();
  const calls = [];
  const state = {
    selectedAgentId: "lucca",
    detail: { agent: { id: "lucca" } },
    world: { agents: [] },
  };
  closeWorldDetails(state, {
    connectStream: () => calls.push("stream"),
    documentRef,
    renderHistory: (value) => calls.push(["history", value]),
    renderSchedule: (value) => calls.push(["schedule", value]),
    renderStash: (value) => calls.push(["stash", value]),
    renderWorld: () => calls.push("world"),
    setText: (id, value) => texts.set(id, value),
    syncWorldDetailVisibility: () => calls.push("visibility"),
  });
  assert.equal(state.selectedAgentId, null);
  assert.equal(state.detail, null);
  assert.equal(texts.get("agent-status-badge"), "--");
  assert.equal(documentRef.badge.className, "status-badge");
  assert.equal(calls.includes("stream"), true);
});
