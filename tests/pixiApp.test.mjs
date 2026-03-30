import test from "node:test";
import assert from "node:assert/strict";

import { initRenderer } from "../src/render/pixiApp.js";

test("initRenderer builds PIXI state, normalizes assets, and wires editor events", async () => {
  const viewListeners = new Map();
  const windowListeners = new Map();
  class FakeContainer {
    constructor() {
      this.children = [];
      this.sortableChildren = false;
    }
    addChild(...items) {
      this.children.push(...items);
    }
  }
  class FakeApplication {
    constructor(options) {
      this.options = options;
      this.view = {
        addEventListener(type, handler) {
          viewListeners.set(type, handler);
        },
      };
      this.renderer = {
        resizeCalls: [],
        resize: (...args) => {
          this.renderer.resizeCalls.push(args);
        },
      };
      this.stage = new FakeContainer();
      this.ticker = {
        add: (handler) => {
          this.ticker.handler = handler;
        },
      };
    }
  }
  const host = {
    appended: [],
    appendChild(node) {
      this.appended.push(node);
      node.parentElement = this;
    },
  };
  const state = {
    activeTab: "editor",
    editor: {
      activeSubview: "tilemap",
      isSelecting: false,
    },
  };
  const drawCalls = [];
  const renderCalls = [];
  const hoverCalls = [];
  const mountCalls = [];
  const statusCalls = [];
  const syncCalls = [];
  const sceneCalls = [];
  const assets = {
    floorText: "a b",
    wallText: ". .",
    furnitureText: ". .",
    propText: ". .",
    gameStateRaw: { ok: true },
    layout: {},
    roomRegions: [{ id: "library" }],
    stash: { col: 1, row: 2 },
    tileManifest: { floor: true },
  };

  await initRenderer(state, {
    PIXIRef: {
      Application: FakeApplication,
      Assets: {
        async load(path) {
          return { baseTexture: { path } };
        },
      },
      Container: FakeContainer,
      SCALE_MODES: { NEAREST: "nearest" },
    },
    buildPrimitiveTexture: (_app, kind) => ({ kind }),
    buildTileTextures: async () => ({ floor: { id: "tile" } }),
    buildTilemapState: (_floor, _wall, _furniture, _prop, _manifest, layout, roomRegions) => ({
      floorText: "a b",
      wallText: ". .",
      furnitureText: ". .",
      propText: ". .",
      layout: {
        ...layout,
        anchors: { lounge: { row: 0, col: 0 } },
        cols: 12,
        roomRegions,
        rows: 8,
      },
    }),
    documentRef: {
      getElementById(id) {
        return id === "world-canvas" ? host : null;
      },
    },
    drawRoom: (renderer) => drawCalls.push(renderer),
    getCanvasCellFromEvent: () => ({ row: 2, col: 3 }),
    getRenderHeight: () => 256,
    getWorldWidth: () => 384,
    loadArtAssets: async () => assets,
    mountRendererView: () => mountCalls.push("mount"),
    normalizeMapText: (value) => `norm:${value}`,
    normalizeStashPoint: (value) => ({ ...value, normalized: true }),
    renderVisualEditor: () => renderCalls.push("render"),
    setHoveredMapCell: (...args) => hoverCalls.push(args),
    setTilemapStatus: (value) => statusCalls.push(value),
    syncEditorInputs: () => syncCalls.push("sync"),
    syncRendererCanvasSize: () => sceneCalls.push("canvas"),
    syncSceneOffset: () => sceneCalls.push("offset"),
    tickAgents: () => {},
    windowRef: {
      addEventListener(type, handler) {
        windowListeners.set(type, handler);
      },
    },
  });

  assert.ok(state.renderer);
  assert.equal(host.appended.length, 1);
  assert.equal(state.renderer.assets.layout.cols, 12);
  assert.equal(state.renderer.assets.layout.rows, 8);
  assert.deepEqual(state.renderer.assets.layout.stash, { col: 1, row: 2, normalized: true });
  assert.equal(state.editor.baseFloorText, "norm:a b");
  assert.equal(state.editor.draftPropText, ". .");
  assert.equal(drawCalls.length, 1);
  assert.deepEqual(statusCalls, ["Tilemap loaded."]);
  assert.equal(syncCalls.length, 1);
  assert.deepEqual(sceneCalls, ["offset", "canvas"]);
  assert.equal(mountCalls.length, 1);
  assert.ok(typeof state.renderer.pixiApp.ticker.handler === "function");
  assert.ok(viewListeners.has("mousemove"));
  assert.ok(viewListeners.has("mousedown"));
  assert.ok(viewListeners.has("mouseleave"));
  assert.ok(windowListeners.has("mouseup"));

  state.activeTab = "editor";
  state.editor.isSelecting = true;
  viewListeners.get("mousemove")({});
  assert.deepEqual(hoverCalls.at(-1), [2, 3]);
  assert.equal(renderCalls.length, 1);

  viewListeners.get("mousedown")({});
  assert.equal(state.editor.isSelecting, true);
  assert.deepEqual(state.editor.selectionAnchor, { row: 2, col: 3 });

  windowListeners.get("mouseup")({});
  assert.equal(state.editor.isSelecting, false);
  assert.deepEqual(state.editor.selectedCell, { row: 2, col: 3 });
});
