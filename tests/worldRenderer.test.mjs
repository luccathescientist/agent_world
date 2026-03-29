import test from "node:test";
import assert from "node:assert/strict";

import {
  mountRendererView,
  renderWorld,
  resizeRendererViewport,
  syncRendererCanvasSize,
  syncSceneOffset,
  tickAgents,
} from "../src/render/worldRenderer.js";

test("mountRendererView appends the PIXI view into the active host", () => {
  const appended = [];
  const host = {
    appendChild(node) {
      appended.push(node);
      node.parentElement = this;
    },
  };
  const state = {
    activeTab: "world",
    editor: { activeSubview: "tilemap" },
    renderer: {
      pixiApp: {
        view: { parentElement: null },
      },
    },
  };
  let synced = 0;
  mountRendererView(state, {
    documentRef: {
      getElementById(id) {
        return id === "world-canvas" ? host : null;
      },
    },
    syncRendererCanvasSize: () => {
      synced += 1;
    },
  });
  assert.equal(appended.length, 1);
  assert.equal(synced, 1);
});

test("syncSceneOffset and syncRendererCanvasSize update layers and scaled editor canvas size", () => {
  const view = { style: {} };
  const state = {
    activeTab: "editor",
    editor: { activeSubview: "agent", zoom: 2.5 },
    renderer: {
      pixiApp: { view },
      floorLayer: {},
      wallLayer: {},
      depthLayer: {},
      overlayLayer: {},
      interactionLayer: {},
      labelLayer: {},
      agentLabelLayer: {},
      bubbleLayer: {},
      backgroundLayer: {},
    },
  };
  syncSceneOffset(state, {
    getSceneTopPadding: () => 18,
  });
  assert.equal(state.renderer.floorLayer.y, 18);
  assert.equal(state.renderer.backgroundLayer.y, 0);
  syncRendererCanvasSize(state, {
    getRenderHeight: () => 120,
    getWorldWidth: () => 200,
  });
  assert.equal(view.style.width, "500px");
  assert.equal(view.style.height, "300px");
});

test("resizeRendererViewport resizes renderer and refreshes offsets/canvas size", () => {
  const calls = [];
  const state = {
    renderer: {
      pixiApp: {
        renderer: {
          resize: (...args) => calls.push(["resize", ...args]),
        },
      },
    },
  };
  resizeRendererViewport(state, {
    getRenderHeight: () => 144,
    getWorldWidth: () => 256,
    syncRendererCanvasSize: () => calls.push(["canvas"]),
    syncSceneOffset: () => calls.push(["offset"]),
  });
  assert.deepEqual(calls, [["resize", 256, 144], ["offset"], ["canvas"]]);
});

test("tickAgents advances sprites, updates facing, and swaps textures when needed", () => {
  const sprite = {
    x: 0,
    y: 0,
    zIndex: 0,
    agentId: "lucca",
    _agent: { id: "lucca", runtimeStatus: "active" },
    _state: { facing: "down", path: [{ row: 0, col: 0 }, { row: 0, col: 1 }], currentTile: { row: 0, col: 0 } },
    _anim: {
      textures: [],
      gotoAndPlayCalled: 0,
      gotoAndPlay() {
        this.gotoAndPlayCalled += 1;
      },
      scale: {
        set(...args) {
          sprite.lastScale = args;
        },
      },
      tint: null,
    },
  };
  const state = {
    selectedAgentId: "lucca",
    renderer: {
      agents: new Map([["lucca", sprite]]),
      depthLayer: { sortDirty: false },
    },
  };
  const calls = [];
  tickAgents(state, 1, {
    applyPathing: () => ({
      goalTile: { row: 0, col: 1 },
      nextTile: { row: 0, col: 1 },
      target: { x: 1, y: 0 },
    }),
    chooseDisplayFrames: () => ["walk-1", "walk-2"],
    positionAgentLabel: () => calls.push("label"),
    positionBubble: () => calls.push("bubble"),
    shouldMirrorSpriteForFacing: () => false,
    updateActivityCue: () => calls.push("cue"),
    updateAgentLabel: () => calls.push("agent-label"),
  });
  assert.equal(sprite.x, 1);
  assert.equal(sprite.y, 0);
  assert.equal(sprite._state.facing, "right");
  assert.deepEqual(sprite._anim.textures, ["walk-1", "walk-2"]);
  assert.equal(sprite._anim.gotoAndPlayCalled, 1);
  assert.equal(state.renderer.depthLayer.sortDirty, true);
  assert.ok(calls.includes("cue"));
});

test("renderWorld creates sprites, updates visibility, and removes stale agents", () => {
  const depthAdds = [];
  const removed = [];
  const staleSprite = {
    _bubbleWrap: { parent: { removeChild: () => removed.push("bubble") } },
    _labelWrap: { parent: { removeChild: () => removed.push("label") } },
  };
  const activeSprite = {
    _bubble: true,
    _bubbleWrap: {},
    _label: { text: "" },
    _labelWrap: {},
    _selection: {
      clear: () => {},
      lineStyle: () => {},
      drawCircle: () => {},
    },
    scale: { set: () => {} },
    y: 12,
  };
  const agents = new Map([
    ["old", staleSprite],
    ["lucca", activeSprite],
  ]);
  const state = {
    activeTab: "editor",
    editor: { showAgents: false },
    renderer: {
      agents,
      depthLayer: {
        addChild: (sprite) => depthAdds.push(sprite),
        removeChild: (sprite) => removed.push(sprite),
        sortDirty: false,
      },
    },
    selectedAgentId: "lucca",
  };
  const texts = new Map();
  renderWorld(state, {
    room: { name: "Lab" },
    serverTime: "2025-01-01T00:00:00Z",
    agents: [{ id: "lucca", name: "Lucca", currentAction: "Reading", runtimeStatus: "active" }],
  }, {
    bubblePaletteForAgent: () => ({ fill: 1 }),
    createAgentSprite: () => {
      throw new Error("should not create a sprite when one exists");
    },
    createBenchmarkSprite: () => {
      throw new Error("unexpected benchmark sprite");
    },
    formatDate: () => "formatted",
    isBenchmarkAgent: () => false,
    populateAgentSelect: () => {},
    setText: (id, value) => texts.set(id, value),
    shouldShowAgentSprite: () => true,
    syncSelectedAgentDetailFromWorld: () => {},
    updateActivityCue: () => {},
    updateAgentLabel: () => {},
    updateBubble: () => {},
  });
  assert.equal(state.world.room.name, "Lab");
  assert.equal(texts.get("room-name"), "Lab");
  assert.equal(texts.get("server-time"), "formatted");
  assert.equal(activeSprite.visible, false);
  assert.equal(activeSprite._bubbleWrap.visible, false);
  assert.equal(activeSprite.interactive, false);
  assert.equal(agents.has("old"), false);
  assert.ok(removed.length >= 3);
});
