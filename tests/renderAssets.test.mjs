import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPrimitiveTexture,
  buildTileTextures,
  getLayerTexture,
  loadArtAssets,
} from "../src/render/assets.js";

test("getLayerTexture returns primitive textures directly and caches atlas slices", () => {
  class Rectangle {
    constructor(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
  }
  class Texture {
    constructor(baseTexture, rect) {
      this.baseTexture = baseTexture;
      this.rect = rect;
    }
  }
  const renderer = {
    assets: {
      layout: { atlasTileSize: 16 },
      officeAtlasBaseTexture: { id: "office" },
      officeAtlasTextures: {},
      primitiveTextures: {
        door: { id: "door" },
        wall: { id: "wall" },
      },
      wallAtlasBaseTexture: { id: "wall-atlas" },
      wallAtlasTextures: {},
    },
  };
  assert.equal(getLayerTexture(renderer, { kind: "primitive", primitive: "door" }, "wall"), renderer.assets.primitiveTextures.door);
  const first = getLayerTexture(renderer, { kind: "atlas", x: 2, y: 3 }, "furniture", {
    PIXIRef: { Rectangle, Texture },
  });
  const second = getLayerTexture(renderer, { kind: "atlas", x: 2, y: 3 }, "furniture", {
    PIXIRef: { Rectangle, Texture },
  });
  assert.equal(first, second);
  assert.deepEqual(first.rect, new Rectangle(16, 32, 16, 16));
});

test("buildPrimitiveTexture draws and destroys the temporary graphics object", () => {
  const ops = [];
  class Graphics {
    beginFill(...args) { ops.push(["beginFill", ...args]); }
    drawRect(...args) { ops.push(["drawRect", ...args]); }
    endFill() { ops.push(["endFill"]); }
    lineStyle(...args) { ops.push(["lineStyle", ...args]); }
    moveTo(...args) { ops.push(["moveTo", ...args]); }
    lineTo(...args) { ops.push(["lineTo", ...args]); }
    drawCircle(...args) { ops.push(["drawCircle", ...args]); }
    destroy() { ops.push(["destroy"]); }
  }
  class Rectangle {
    constructor(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
  }
  const pixiApp = {
    renderer: {
      generateTexture(_graphics, options) {
        ops.push(["generateTexture", options.region.w, options.region.h]);
        return { baseTexture: {} };
      },
    },
  };
  const texture = buildPrimitiveTexture(pixiApp, "door", {
    PIXIRef: {
      Graphics,
      Rectangle,
      SCALE_MODES: { NEAREST: "nearest" },
    },
  });
  assert.equal(texture.baseTexture.scaleMode, "nearest");
  assert.ok(ops.some((entry) => entry[0] === "drawCircle"));
  assert.deepEqual(ops.at(-1), ["destroy"]);
});

test("buildTileTextures loads atlases once and reuses primitive textures", async () => {
  const loads = [];
  class Rectangle {
    constructor(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
  }
  class Texture {
    constructor(baseTexture, rect) {
      this.baseTexture = baseTexture;
      this.rect = rect;
    }
  }
  const manifest = {
    floor: { atlasPath: "/atlas.png", grid: [1, 2] },
    wall: { primitive: "wall" },
    door: { primitive: "wall" },
  };
  const textures = await buildTileTextures({
    renderer: {},
  }, manifest, {
    PIXIRef: {
      Assets: {
        async load(path) {
          loads.push(path);
          return { baseTexture: {} };
        },
      },
      Rectangle,
      SCALE_MODES: { NEAREST: "nearest" },
      Texture,
    },
    buildPrimitiveTexture: (_app, primitiveName) => ({ primitiveName }),
  });
  assert.deepEqual(loads, ["/atlas.png"]);
  assert.equal(textures.wall, textures.door);
  assert.deepEqual(textures.floor.rect, new Rectangle(32, 64, 32, 32));
});

test("loadArtAssets resolves persisted game state and sprite metadata", async () => {
  const calls = [];
  const chatThemes = [];
  const snapshot = {
    chatBubbleThemes: { assistant: { textColor: "#fff" } },
    floorText: "a b",
    furnitureText: ". .",
    layout: { cols: 10, rows: 8 },
    propText: ". .",
    roomRegions: [{ id: "library" }],
    raw: { ok: true },
    stash: { col: 2, row: 3 },
    wallText: ". .",
  };
  class Rectangle {
    constructor(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
    }
  }
  class Texture {
    constructor(baseTexture, rect) {
      this.baseTexture = baseTexture;
      this.rect = rect;
    }
  }
  const result = await loadArtAssets({
    PIXIRef: {
      Assets: {
        async load(path) {
          calls.push(["asset", path]);
          return { baseTexture: { path } };
        },
      },
      Rectangle,
      Texture,
    },
    applyChatBubbleFrameStyles: () => calls.push(["applyThemes"]),
    defaultLayoutConfig: () => ({ cols: 30, rows: 18 }),
    getJson: async (url) => {
      calls.push(["json", url]);
      if (url === "/api/agent-world/game-state") return { persisted: true };
      if (url.endsWith("lucca_atlas.json")) return { frames: { idle_0: { x: 0, y: 0, w: 10, h: 20 } } };
      if (url.endsWith("robo_atlas.json")) return { frames: { idle_0: { x: 1, y: 2, w: 10, h: 20 } } };
      if (url.endsWith("manifest.json")) return { floor: { grid: [0, 0], atlasPath: "/atlas.png" } };
      throw new Error(`unexpected url ${url}`);
    },
    setChatBubbleThemes: (value) => chatThemes.push(value),
    structuredSnapshotFromGameState: () => snapshot,
    writeGameStateToLocalStorage: (raw, sync) => calls.push(["writeState", raw, sync]),
  });
  assert.equal(chatThemes.length, 1);
  assert.equal(result.frames.idle_0.rect.w, 10);
  assert.equal(result.spriteAtlasPaths["lucca-default"], "/agent-world-static/assets/sprites/lucca_atlas.png");
  assert.deepEqual(result.layout, { cols: 10, rows: 8 });
  assert.ok(calls.some((entry) => entry[0] === "applyThemes"));
});
