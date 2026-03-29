import { TILE_SIZE } from "../core/constants.js";

export function getFloorTexture(renderer, floorToken, helpers = {}) {
  const PIXIRef = helpers.PIXIRef ?? globalThis.PIXI;
  if (floorToken.kind === "empty") return null;
  if (floorToken.kind === "code") return renderer.assets.tileTextures[floorToken.code] || null;
  const cache = renderer.assets.floorAtlasTextures;
  const key = `${floorToken.x}:${floorToken.y}`;
  if (!cache[key]) {
    const tileSize = renderer.assets.layout.atlasTileSize || TILE_SIZE;
    cache[key] = new PIXIRef.Texture(
      renderer.assets.floorAtlasBaseTexture,
      new PIXIRef.Rectangle((floorToken.x - 1) * tileSize, (floorToken.y - 1) * tileSize, tileSize, tileSize),
    );
  }
  return cache[key];
}

export function createAnchorLabel(text, x, y, helpers = {}) {
  const {
    createText = () => ({}),
  } = helpers;
  const PIXIRef = helpers.PIXIRef ?? globalThis.PIXI;
  const label = new PIXIRef.Container();
  const bg = new PIXIRef.Graphics();
  const txt = createText(text, {
    fontFamily: "Courier New",
    fontSize: 12,
    fontWeight: "bold",
    fill: 0xf7ecc5,
    letterSpacing: 1,
  });
  bg.beginFill(0x1b2438, 0.9);
  bg.lineStyle(2, 0xe9d59b, 1);
  bg.drawRoundedRect(0, 0, txt.width + 14, txt.height + 8, 4);
  bg.endFill();
  txt.x = 7;
  txt.y = 3;
  label.addChild(bg, txt);
  label.x = x;
  label.y = y;
  return label;
}

export function createRegionLabel(region, helpers = {}) {
  const {
    createAnchorLabel = () => null,
    regionCenter = () => null,
  } = helpers;
  const anchorCell = region.labelCell || regionCenter(region);
  if (!anchorCell) return null;
  const text = String(region.label || region.id || "").trim();
  if (!text) return null;
  const x = Math.round(anchorCell.col * TILE_SIZE + TILE_SIZE / 2);
  const y = Math.max(4, Math.round(anchorCell.row * TILE_SIZE) - 18);
  const label = createAnchorLabel(text, x, y);
  label.pivot.x = label.width / 2;
  return label;
}

export function renderEditorSelectionOverlay(state, renderer, helpers = {}) {
  const {
    getSelectedCells = () => [],
  } = helpers;
  const PIXIRef = helpers.PIXIRef ?? globalThis.PIXI;
  const { interactionLayer } = renderer;
  interactionLayer.removeChildren();
  if (state.activeTab !== "editor") return;

  const roomColors = {
    room: 0x5fb3ff,
    door: 0xffc76b,
  };
  for (const region of state.roomRegions) {
    const isHoveredRegion = state.editor.hoveredRegionId && region.id === state.editor.hoveredRegionId;
    for (const cell of region.cells) {
      const box = new PIXIRef.Graphics();
      const color = isHoveredRegion ? 0xfff18b : (roomColors[region.kind] || 0x5fb3ff);
      const alpha = isHoveredRegion ? 0.22 : 0.08;
      box.lineStyle(isHoveredRegion ? 2 : 1, color, isHoveredRegion ? 0.95 : 0.55);
      box.beginFill(color, alpha);
      box.drawRect(cell.col * TILE_SIZE, cell.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      box.endFill();
      interactionLayer.addChild(box);
    }
  }

  const drawBox = (cell, color, alpha) => {
    if (!cell) return;
    const box = new PIXIRef.Graphics();
    box.lineStyle(2, color, 0.95);
    box.beginFill(color, alpha);
    box.drawRect(cell.col * TILE_SIZE, cell.row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    box.endFill();
    interactionLayer.addChild(box);
  };

  drawBox(state.editor.hoveredCell, 0xe4c97a, 0.12);
  for (const cell of getSelectedCells()) {
    drawBox(cell, 0x83d7bf, 0.18);
  }
}

export function createStashBox(state, helpers = {}) {
  const {
    createText = () => ({}),
    documentRef = document,
    normalizeStashPoint = (value) => value,
    showStashItem = () => {},
  } = helpers;
  const PIXIRef = helpers.PIXIRef ?? globalThis.PIXI;
  const stash = normalizeStashPoint(state.tilemap?.layout?.stash || { col: 15, row: 14 });
  const container = new PIXIRef.Container();
  const interactive = state.activeTab !== "editor";
  container.interactive = interactive;
  container.buttonMode = interactive;
  container.cursor = interactive ? "pointer" : "default";
  container.x = stash.col * TILE_SIZE + TILE_SIZE / 2;
  container.y = stash.row * TILE_SIZE + TILE_SIZE / 2;
  container.zIndex = container.y;
  container._sceneSprite = true;

  const shadow = new PIXIRef.Graphics();
  shadow.beginFill(0x000000, 0.25);
  shadow.drawEllipse(0, 0, 18, 6);
  shadow.endFill();
  shadow.y = 18;

  const chest = new PIXIRef.Graphics();
  chest.beginFill(0x8f633b);
  chest.drawRect(-18, -6, 36, 20);
  chest.endFill();
  chest.beginFill(0xc99a54);
  chest.drawRect(-18, -16, 36, 10);
  chest.endFill();
  chest.lineStyle(3, 0x5d3f20, 1);
  chest.drawRect(-18, -6, 36, 20);
  chest.drawRect(-18, -16, 36, 10);

  const label = createText("STASH", {
    fontFamily: "Courier New",
    fontSize: 9,
    fontWeight: "bold",
    fill: 0xf7ecc5,
  });
  label.anchor.set(0.5, 0);
  label.y = 18;

  container.addChild(shadow, chest, label);
  container.on("pointertap", () => {
    documentRef.querySelector(".stash-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const first = state.stash?.[0];
    if (first) showStashItem(first);
  });
  return container;
}

export function drawRoom(state, renderer, helpers = {}) {
  const {
    createAnchorLabel = () => null,
    createRegionLabel = () => null,
    createStashBox = () => null,
    createText = () => ({}),
    floorTokenLabel = (value) => value,
    getFloorTexture = () => null,
    getLayerTexture = () => null,
    getRenderHeight = () => 0,
    getSceneTopPadding = () => 0,
    getSelectedCells = () => [],
    getWorldCols = () => 0,
    getWorldHeight = () => 0,
    getWorldRows = () => 0,
    getWorldWidth = () => 0,
    parseFloorToken = (value) => value,
    parseObjectToken = (value) => value,
    renderEditorSelectionOverlay = () => {},
    tokenLabel = (value) => value,
  } = helpers;
  const PIXIRef = helpers.PIXIRef ?? globalThis.PIXI;
  const { backgroundLayer, floorLayer, wallLayer, depthLayer, overlayLayer, labelLayer } = renderer;
  backgroundLayer.removeChildren();
  floorLayer.removeChildren();
  wallLayer.removeChildren();
  overlayLayer.removeChildren();
  labelLayer.removeChildren();
  for (const child of [...depthLayer.children]) {
    if (!child.agentId) depthLayer.removeChild(child);
  }

  const worldWidth = getWorldWidth();
  const worldHeight = getWorldHeight();
  const sceneTop = getSceneTopPadding();
  const renderHeight = getRenderHeight();
  const worldCols = getWorldCols();
  const worldRows = getWorldRows();
  const bg = new PIXIRef.Graphics();
  bg.beginFill(0x000000);
  bg.drawRect(0, 0, worldWidth, renderHeight);
  bg.endFill();
  bg.lineStyle(4, 0x1e2536, 1);
  bg.drawRect(2, sceneTop + 2, worldWidth - 4, worldHeight - 4);
  backgroundLayer.addChild(bg);

  if (!state.tilemap) return;
  const { floorGrid, wallGrid, furnitureGrid, propGrid } = state.tilemap;

  for (let row = 0; row < floorGrid.length; row += 1) {
    for (let col = 0; col < floorGrid[row].length; col += 1) {
      const floorToken = parseFloorToken(floorGrid[row][col]);
      const floorTexture = getFloorTexture(renderer, floorToken);
      if (floorTexture) {
        const sprite = new PIXIRef.Sprite(floorTexture);
        sprite.x = col * TILE_SIZE;
        sprite.y = row * TILE_SIZE;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        floorLayer.addChild(sprite);
      }

      const wallToken = parseObjectToken(wallGrid[row][col]);
      const wallTexture = getLayerTexture(renderer, wallToken, "wall");
      if (wallTexture) {
        const sprite = new PIXIRef.Sprite(wallTexture);
        sprite.x = col * TILE_SIZE;
        sprite.y = row * TILE_SIZE;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        wallLayer.addChild(sprite);
      }

      const furnitureToken = parseObjectToken(furnitureGrid[row][col]);
      const furnitureTexture = getLayerTexture(renderer, furnitureToken, "furniture");
      if (furnitureTexture) {
        const sprite = new PIXIRef.Sprite(furnitureTexture);
        sprite.x = col * TILE_SIZE;
        sprite.y = row * TILE_SIZE;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        sprite.zIndex = sprite.y + TILE_SIZE;
        sprite._sceneSprite = true;
        depthLayer.addChild(sprite);
      }

      const propToken = parseObjectToken(propGrid[row][col]);
      const propTexture = getLayerTexture(renderer, propToken, "prop");
      if (propTexture) {
        const sprite = new PIXIRef.Sprite(propTexture);
        sprite.x = col * TILE_SIZE;
        sprite.y = row * TILE_SIZE;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        sprite.zIndex = sprite.y + TILE_SIZE;
        sprite._sceneSprite = true;
        depthLayer.addChild(sprite);
      }
    }
  }

  depthLayer.addChild(createStashBox());
  depthLayer.sortDirty = true;

  const roomLabels = state.roomRegions
    .filter((region) => region.kind === "room")
    .map((region) => createRegionLabel(region))
    .filter(Boolean);
  if (roomLabels.length) {
    for (const label of roomLabels) labelLayer.addChild(label);
  } else if (state.activeTab !== "editor") {
    for (const anchor of Object.values(state.tilemap.layout.anchors || {})) {
      labelLayer.addChild(createAnchorLabel(anchor.label, anchor.col * TILE_SIZE + 4, Math.max(4, anchor.row * TILE_SIZE - 18)));
    }
  }

  if (state.editor.enabled) {
    const grid = new PIXIRef.Graphics();
    grid.lineStyle(1, 0xffffff, 0.14);
    for (let col = 0; col <= worldCols; col += 1) {
      grid.moveTo(col * TILE_SIZE, 0);
      grid.lineTo(col * TILE_SIZE, worldHeight);
    }
    for (let row = 0; row <= worldRows; row += 1) {
      grid.moveTo(0, row * TILE_SIZE);
      grid.lineTo(worldWidth, row * TILE_SIZE);
    }
    overlayLayer.addChild(grid);

    for (let row = 0; row < floorGrid.length; row += 1) {
      for (let col = 0; col < floorGrid[row].length; col += 1) {
        const floorCode = floorTokenLabel(parseFloorToken(floorGrid[row][col]));
        const wallToken = parseObjectToken(wallGrid[row][col]);
        const furnitureToken = parseObjectToken(furnitureGrid[row][col]);
        const propToken = parseObjectToken(propGrid[row][col]);
        const badge = new PIXIRef.Graphics();
        badge.beginFill(0x08101d, 0.72);
        badge.drawRoundedRect(0, 0, TILE_SIZE - 4, 20, 3);
        badge.endFill();
        badge.x = col * TILE_SIZE + 2;
        badge.y = row * TILE_SIZE + 2;

        const text = createText(`${floorCode}\nW:${tokenLabel(wallToken)} F:${tokenLabel(furnitureToken)} P:${tokenLabel(propToken)}`, {
          fontFamily: "Courier New",
          fontSize: 5,
          fontWeight: "bold",
          fill: wallToken.door ? 0x9ff5be : !wallToken.passable ? 0xffb9a5 : 0xd7e5ff,
        });
        text.x = col * TILE_SIZE + 5;
        text.y = row * TILE_SIZE + 3;
        overlayLayer.addChild(badge, text);
      }
    }
  }
  renderEditorSelectionOverlay(renderer);
}
