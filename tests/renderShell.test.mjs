import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimitiveTexture,
  buildTileTextures,
  createAnchorLabel,
  createRegionLabel,
  getFloorTexture,
  getLayerTexture,
  loadArtAssets,
  mountRendererView,
  resizeRendererViewport,
  syncRendererCanvasSize,
  syncSceneOffset,
} from "../src/app/renderShell.js";

test("render shell forwards scene helpers with PIXI and local adapters", async () => {
  const pixiRef = { name: "PIXI" };
  const calls = [];
  assert.equal(
    getFloorTexture("renderer", "floor-token", {
      getFloorTextureHelper: (...args) => {
        calls.push(["floor", ...args]);
        return "floor-texture";
      },
      PIXIRef: pixiRef,
    }),
    "floor-texture",
  );
  assert.equal(
    createAnchorLabel("Desk", 10, 20, {
      createAnchorLabelHelper: (...args) => {
        calls.push(["anchor", ...args]);
        return "anchor-label";
      },
      createText: () => "text",
      PIXIRef: pixiRef,
    }),
    "anchor-label",
  );
  assert.equal(
    createRegionLabel("region", {
      createAnchorLabel: () => "anchor",
      createRegionLabelHelper: (...args) => {
        calls.push(["region", ...args]);
        return "region-label";
      },
      regionCenter: () => ({ row: 1, col: 2 }),
    }),
    "region-label",
  );
  assert.equal(
    buildPrimitiveTexture("app", "wall", {
      buildPrimitiveTextureHelper: (...args) => {
        calls.push(["primitive", ...args]);
        return "primitive";
      },
      PIXIRef: pixiRef,
    }),
    "primitive",
  );
  assert.equal(
    await buildTileTextures("app", { a: true }, {
      buildPrimitiveTexture: () => "primitive",
      buildTileTexturesHelper: async (...args) => {
        calls.push(["tiles", ...args]);
        return "tiles";
      },
      PIXIRef: pixiRef,
    }),
    "tiles",
  );
  assert.equal(
    getLayerTexture("renderer", "token", "wall", {
      getLayerTextureHelper: (...args) => {
        calls.push(["layer", ...args]);
        return "layer-texture";
      },
      PIXIRef: pixiRef,
    }),
    "layer-texture",
  );
  assert.equal(calls.length, 6);
});

test("render shell forwards viewport helpers with stateful dependencies", async () => {
  const calls = [];
  const state = { id: "state" };
  mountRendererView(state, {
    documentRef: { body: {} },
    mountRendererViewHelper: (...args) => calls.push(["mount", ...args]),
    syncRendererCanvasSize: () => calls.push(["canvas-sync"]),
  });
  syncSceneOffset(state, {
    getSceneTopPadding: () => 12,
    syncSceneOffsetHelper: (...args) => calls.push(["offset", ...args]),
  });
  resizeRendererViewport(state, {
    getRenderHeight: () => 100,
    getWorldWidth: () => 200,
    resizeRendererViewportHelper: (...args) => calls.push(["resize", ...args]),
    syncRendererCanvasSize: () => calls.push(["canvas"]),
    syncSceneOffset: () => calls.push(["scene"]),
  });
  syncRendererCanvasSize(state, {
    getRenderHeight: () => 100,
    getWorldWidth: () => 200,
    syncRendererCanvasSizeHelper: (...args) => calls.push(["size", ...args]),
  });
  assert.equal(calls.length, 4);
});

test("loadArtAssets writes chat bubble themes back into shared state", async () => {
  const state = { chatBubbleThemes: null };
  const result = await loadArtAssets(state, {
    applyChatBubbleFrameStyles: () => {},
    defaultLayoutConfig: (value) => value,
    getJson: async () => ({}),
    loadArtAssetsHelper: async ({ setChatBubbleThemes }) => {
      setChatBubbleThemes({ assistant: true });
      return "loaded";
    },
    PIXIRef: {},
    setChatBubbleThemes: (target, themes) => {
      target.chatBubbleThemes = themes;
    },
    structuredSnapshotFromGameState: (value) => value,
    writeGameStateToLocalStorage: () => {},
  });
  assert.equal(result, "loaded");
  assert.deepEqual(state.chatBubbleThemes, { assistant: true });
});
