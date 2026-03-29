import test from "node:test";
import assert from "node:assert/strict";

import {
  createAnchorLabel,
  createRegionLabel,
  createStashBox,
  drawRoom,
  getFloorTexture,
  renderEditorSelectionOverlay,
} from "../src/render/scene.js";

function makeGraphicsClass(log) {
  return class Graphics {
    beginFill(...args) { log.push(["beginFill", ...args]); }
    drawRect(...args) { log.push(["drawRect", ...args]); }
    drawRoundedRect(...args) { log.push(["drawRoundedRect", ...args]); }
    drawEllipse(...args) { log.push(["drawEllipse", ...args]); }
    endFill() { log.push(["endFill"]); }
    lineStyle(...args) { log.push(["lineStyle", ...args]); }
    moveTo(...args) { log.push(["moveTo", ...args]); }
    lineTo(...args) { log.push(["lineTo", ...args]); }
  };
}

test("getFloorTexture returns code textures and caches atlas textures", () => {
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
      floorAtlasBaseTexture: { id: "atlas" },
      floorAtlasTextures: {},
      layout: { atlasTileSize: 16 },
      tileTextures: { A: { id: "code-texture" } },
    },
  };
  assert.equal(getFloorTexture(renderer, { kind: "code", code: "A" }), renderer.assets.tileTextures.A);
  const first = getFloorTexture(renderer, { kind: "atlas", x: 2, y: 3 }, {
    PIXIRef: { Rectangle, Texture },
  });
  const second = getFloorTexture(renderer, { kind: "atlas", x: 2, y: 3 }, {
    PIXIRef: { Rectangle, Texture },
  });
  assert.equal(first, second);
  assert.deepEqual(first.rect, new Rectangle(16, 32, 16, 16));
});

test("createAnchorLabel and createRegionLabel position labels correctly", () => {
  const log = [];
  class Container {
    constructor() {
      this.children = [];
      this.pivot = { x: 0 };
      this.width = 40;
    }
    addChild(...children) {
      this.children.push(...children);
    }
  }
  const Graphics = makeGraphicsClass(log);
  const createTextStub = (text) => ({ text, width: 30, height: 10, x: 0, y: 0 });
  const anchor = createAnchorLabel("Desk", 12, 34, {
    createText: createTextStub,
    PIXIRef: { Container, Graphics },
  });
  assert.equal(anchor.x, 12);
  assert.equal(anchor.y, 34);
  const regionLabel = createRegionLabel({ id: "library", label: "Library", cells: [{ row: 2, col: 3 }] }, {
    createAnchorLabel: (text, x, y) => ({ text, x, y, width: 40, pivot: { x: 0 } }),
    regionCenter: () => ({ row: 2, col: 3 }),
  });
  assert.equal(regionLabel.text, "Library");
  assert.equal(regionLabel.x, 112);
  assert.equal(regionLabel.y, 46);
  assert.equal(regionLabel.pivot.x, 20);
});

test("renderEditorSelectionOverlay draws hovered region and selected cells in editor mode", () => {
  const log = [];
  class Graphics {
    lineStyle(...args) { log.push(["lineStyle", ...args]); }
    beginFill(...args) { log.push(["beginFill", ...args]); }
    drawRect(...args) { log.push(["drawRect", ...args]); }
    endFill() { log.push(["endFill"]); }
  }
  const interactionLayer = {
    children: [],
    removeChildren() {
      this.children = [];
    },
    addChild(child) {
      this.children.push(child);
    },
  };
  renderEditorSelectionOverlay({
    activeTab: "editor",
    editor: {
      hoveredCell: { row: 2, col: 2 },
      hoveredRegionId: "library",
    },
    roomRegions: [{ id: "library", kind: "room", cells: [{ row: 1, col: 1 }] }],
  }, { interactionLayer }, {
    getSelectedCells: () => [{ row: 3, col: 4 }],
    PIXIRef: { Graphics },
  });
  assert.equal(interactionLayer.children.length, 3);
  assert.ok(log.length > 0);
});

test("createStashBox wires pointer handler to scroll and select first stash item", async () => {
  const log = [];
  class Container {
    constructor() {
      this.handlers = {};
      this.children = [];
    }
    addChild(...children) {
      this.children.push(...children);
    }
    on(event, handler) {
      this.handlers[event] = handler;
    }
  }
  const Graphics = makeGraphicsClass(log);
  const stashPanel = { scrollIntoViewCalled: false, scrollIntoView() { this.scrollIntoViewCalled = true; } };
  const state = {
    activeTab: "world",
    stash: [{ id: "item-1" }],
    tilemap: { layout: { stash: { col: 2, row: 3 } } },
  };
  const seen = [];
  const box = createStashBox(state, {
    createText: () => ({ anchor: { set() {} }, y: 0 }),
    documentRef: {
      querySelector(selector) {
        return selector === ".stash-panel" ? stashPanel : null;
      },
    },
    normalizeStashPoint: (value) => value,
    PIXIRef: { Container, Graphics },
    showStashItem: (item) => seen.push(item),
  });
  box.handlers.pointertap();
  assert.equal(box.x, 80);
  assert.equal(box.y, 112);
  assert.equal(stashPanel.scrollIntoViewCalled, true);
  assert.deepEqual(seen, [{ id: "item-1" }]);
});

test("drawRoom populates layers and editor overlay for a minimal tilemap", () => {
  const log = [];
  class Graphics {
    beginFill(...args) { log.push(["beginFill", ...args]); }
    drawRect(...args) { log.push(["drawRect", ...args]); }
    drawRoundedRect(...args) { log.push(["drawRoundedRect", ...args]); }
    endFill() { log.push(["endFill"]); }
    lineStyle(...args) { log.push(["lineStyle", ...args]); }
    moveTo(...args) { log.push(["moveTo", ...args]); }
    lineTo(...args) { log.push(["lineTo", ...args]); }
  }
  class Sprite {
    constructor(texture) {
      this.texture = texture;
    }
  }
  const layer = () => ({
    children: [],
    removeChildren() { this.children = []; },
    addChild(...items) { this.children.push(...items); },
  });
  const depthLayer = layer();
  depthLayer.children = [{ agentId: "keep" }, { other: true }];
  depthLayer.removeChild = function (child) {
    this.children = this.children.filter((item) => item !== child);
  };
  const renderer = {
    backgroundLayer: layer(),
    floorLayer: layer(),
    wallLayer: layer(),
    depthLayer,
    overlayLayer: layer(),
    labelLayer: layer(),
  };
  const state = {
    activeTab: "world",
    editor: { enabled: false },
    roomRegions: [],
    tilemap: {
      floorGrid: [["."]],
      wallGrid: [["."]],
      furnitureGrid: [["."]],
      layout: { anchors: { lounge: { label: "Lounge", col: 0, row: 0 } } },
      propGrid: [["."]],
    },
  };
  drawRoom(state, renderer, {
    createAnchorLabel: (text) => ({ text }),
    createRegionLabel: () => null,
    createStashBox: () => ({ stash: true }),
    createText: (text) => ({ text }),
    floorTokenLabel: (value) => value,
    getFloorTexture: () => ({ floor: true }),
    getLayerTexture: () => null,
    getRenderHeight: () => 32,
    getSceneTopPadding: () => 0,
    getSelectedCells: () => [],
    getWorldCols: () => 1,
    getWorldHeight: () => 32,
    getWorldRows: () => 1,
    getWorldWidth: () => 32,
    parseFloorToken: () => ({ kind: "code", code: "A" }),
    parseObjectToken: () => ({ kind: "empty", passable: true }),
    PIXIRef: { Graphics, Sprite },
    renderEditorSelectionOverlay: () => log.push(["overlay"]),
    tokenLabel: (value) => value,
  });
  assert.equal(renderer.floorLayer.children.length, 1);
  assert.equal(renderer.depthLayer.children.some((item) => item.stash === true), true);
  assert.equal(renderer.labelLayer.children.length, 1);
  assert.ok(log.some((entry) => entry[0] === "overlay"));
});
