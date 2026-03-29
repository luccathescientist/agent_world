import test from "node:test";
import assert from "node:assert/strict";

import { createRenderWorldRuntime } from "../src/app/renderWorldRuntime.js";

test("renderWorldRuntime wires render and stream helpers through the runtime", async () => {
  const calls = [];
  const state = {};
  const documentRef = {
    createElement(tag) {
      return { tag };
    },
    querySelector() {
      return { scrollIntoView: () => calls.push("scrollIntoView") };
    },
  };
  const runtime = createRenderWorldRuntime(state, {
    documentRef,
    renderWorldShell: (_state, worldState, deps) => {
      calls.push(["renderWorld", worldState]);
      deps.createAgentSprite({ id: "agent-1" });
      deps.createBenchmarkSprite({ id: "bench-1" });
      deps.populateAgentSelect([]);
      deps.syncSelectedAgentDetailFromWorld(worldState);
    },
    createAgentSpriteHelper: (_state, agent, deps) => {
      calls.push(["createAgentSprite", agent.id]);
      assert.equal(typeof deps.onSelectAgent, "function");
      return { kind: "agent" };
    },
    createBenchmarkSpriteHelper: (_state, agent) => {
      calls.push(["createBenchmarkSprite", agent.id]);
      return { kind: "benchmark" };
    },
    populateAgentSelect: () => calls.push("populateAgentSelect"),
    syncSelectedAgentDetailFromWorldShell: (_state, worldState, deps) => {
      calls.push(["syncSelectedAgentDetailFromWorld", worldState]);
      deps.renderInspector({ id: "detail" });
    },
    renderInspectorShell: (_state, detailPayload) => calls.push(["renderInspector", detailPayload]),
    handleStreamSnapshotShell: (payload, deps) => {
      calls.push(["handleStreamSnapshot", payload]);
      deps.renderWorld({ agents: [] });
      deps.renderHistory([]);
      deps.renderSchedule(null);
      deps.renderStash([]);
    },
    renderHistoryShell: () => calls.push("renderHistory"),
    renderScheduleShell: () => calls.push("renderSchedule"),
    renderStashShell: () => calls.push("renderStash"),
    connectStreamShell: (_state, deps) => {
      calls.push("connectStream");
      deps.handleStreamSnapshot({ type: "snapshot" });
    },
    selectAgentHelper: async (_state, agentId, deps) => {
      calls.push(["selectAgent", agentId]);
      deps.connectStream();
    },
    bubblePaletteForAgent: () => ({}),
    createText: () => ({}),
    currentTileForAgent: () => ({ row: 0, col: 0 }),
    displayActionText: (value) => value,
    getAnimationFrames: () => [],
    hashString: () => 1,
    positionAgentLabel: () => {},
    positionBubble: () => {},
    tilePoint: () => ({ x: 0, y: 0 }),
    setText: () => {},
    formatDate: () => "date",
    shouldShowAgentSprite: () => true,
    updateActivityCueHelper: () => {},
    updateAgentLabel: () => {},
    updateBubbleHelper: () => {},
  });

  runtime.renderWorld({ agents: [{ id: "agent-1" }] });
  runtime.handleStreamSnapshot({ type: "snapshot" });
  await runtime.selectAgent("agent-1");

  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "renderWorld"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "createAgentSprite"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "createBenchmarkSprite"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "handleStreamSnapshot"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "selectAgent"));
  assert.ok(calls.includes("connectStream"));
});

test("renderWorldRuntime forwards renderer bootstrap and rich-message dependencies", async () => {
  const calls = [];
  const state = {};
  const documentRef = {
    createElement(tag) {
      return { tag };
    },
    querySelector() {
      return null;
    },
  };
  const runtime = createRenderWorldRuntime(state, {
    documentRef,
    windowRef: { PIXI: { Application: class FakeApp {} } },
    fetchRef: async (url) => ({ text: async () => `body:${url}` }),
    initRendererHelper: async (_state, deps) => {
      calls.push("initRenderer");
      deps.drawRoom({});
      deps.tickAgents(1);
      deps.mountRendererView();
      deps.loadArtAssets();
    },
    drawRoomHelper: (_state, renderer, deps) => {
      calls.push(["drawRoom", renderer]);
      deps.createStashBox();
      deps.renderEditorSelectionOverlay(renderer);
    },
    createStashBoxHelper: () => {
      calls.push("createStashBox");
      return {};
    },
    tickAgentsHelper: (_state, delta, deps) => {
      calls.push(["tickAgents", delta]);
      deps.applyPathing({}, {});
      deps.chooseDisplayFrames({}, {}, false);
    },
    applyPathingHelper: () => calls.push("applyPathing"),
    chooseDisplayFramesHelper: () => {
      calls.push("chooseDisplayFrames");
      return [];
    },
    mountRendererView: () => calls.push("mountRendererView"),
    loadArtAssets: () => calls.push("loadArtAssets"),
    renderEditorSelectionOverlay: () => calls.push("renderEditorSelectionOverlay"),
    showRichMessageShell: async (_state, kind, title, text, path, deps) => {
      calls.push(["showRichMessage", kind, title, text, path]);
      assert.equal(await deps.fetchText("/asset.txt"), "body:/asset.txt");
      deps.createElement("div");
      deps.renderRichText({}, text);
      deps.setMessageSelection(kind, title, text, path, true);
      deps.setText({}, title);
    },
    renderRichText: () => calls.push("renderRichText"),
    setMessageSelection: () => calls.push("setMessageSelection"),
    setText: () => calls.push("setText"),
    buildPrimitiveTexture: () => ({}),
    buildTileTextures: async () => ({}),
    buildTilemapState: () => ({}),
    getCanvasCellFromEvent: () => null,
    getRenderHeight: () => 100,
    getWorldWidth: () => 100,
    normalizeMapText: (value) => value,
    normalizeStashPoint: (value) => value,
    renderVisualEditor: () => {},
    setHoveredMapCell: () => {},
    setTilemapStatus: () => {},
    syncEditorInputs: () => {},
    syncRendererCanvasSize: () => {},
    syncSceneOffset: () => {},
  });

  await runtime.initRenderer();
  await runtime.showRichMessage("file", "Title", "Body", "/tmp/file.txt");

  assert.ok(calls.includes("initRenderer"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "drawRoom"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "tickAgents"));
  assert.ok(calls.includes("applyPathing"));
  assert.ok(calls.includes("chooseDisplayFrames"));
  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "showRichMessage"));
});

test("renderWorldRuntime forwards chat bubble markup into chat rendering", () => {
  const calls = [];
  const runtime = createRenderWorldRuntime({}, {
    documentRef: {
      createElement(tag) {
        return { tag };
      },
    },
    renderChatShell: (_state, history, deps) => {
      calls.push(["renderChat", history]);
      const markup = deps.chatBubbleMarkup("assistant", "AI", "event", "now", "<p>body</p>");
      assert.equal(markup, "<article>bubble</article>");
      deps.applyChatRoleTheme({}, "assistant");
    },
    chatBubbleMarkup: () => "<article>bubble</article>",
    applyChatRoleTheme: () => calls.push("applyChatRoleTheme"),
    setText: () => {},
    formatRichTextHtml: (value) => value,
    formatTime: (value) => value,
    historyRoleClass: () => "assistant",
    historyRoleMetaHelper: () => ({ label: "Lucca", icon: "AI" }),
    classifyPath: () => "file",
    extractPaths: () => [],
    fileUrl: (value) => value,
    maybeSpeakReply: () => {},
  });

  runtime.renderChat([{ type: "assistant_reply", label: "Hello", ts: "now" }]);

  assert.ok(calls.some((entry) => Array.isArray(entry) && entry[0] === "renderChat"));
  assert.ok(calls.includes("applyChatRoleTheme"));
});

test("renderWorldRuntime merges pending history events into rendered history", () => {
  const seen = [];
  const state = {
    pendingHistoryEvents: [{
      type: "operator_command",
      label: "hello",
      fullLabel: "hello",
      ts: "2026-03-29T12:00:00Z",
    }],
  };
  const runtime = createRenderWorldRuntime(state, {
    documentRef: {
      createElement(tag) {
        return { tag };
      },
    },
    renderHistoryShell: (events) => {
      seen.push(events);
    },
  });

  runtime.renderHistory([]);
  assert.equal(seen[0].length, 1);
  assert.equal(seen[0][0].label, "hello");
  assert.equal(state.pendingHistoryEvents.length, 1);

  runtime.renderHistory([{ type: "operator_command", label: "hello", fullLabel: "hello", ts: "2026-03-29T12:00:01Z" }]);
  assert.equal(seen[1].length, 1);
  assert.equal(state.pendingHistoryEvents.length, 0);
});
