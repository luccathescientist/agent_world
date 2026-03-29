import {
  DEFAULT_CHAT_BUBBLE_FRAME,
  TILE_SIZE,
  TILEMAP_STORAGE_KEYS,
} from "../core/constants.js";

export async function loadArtAssets(helpers = {}) {
  const {
    applyChatBubbleFrameStyles = () => {},
    defaultLayoutConfig = () => ({}),
    getJson = async () => ({}),
    setChatBubbleThemes = () => {},
    structuredSnapshotFromGameState = () => ({}),
    writeGameStateToLocalStorage = () => {},
  } = helpers;
  const PIXIRef = helpers.PIXIRef ?? globalThis.PIXI;
  const [luccaAtlasMeta, roboAtlasMeta] = await Promise.all([
    getJson("/agent-world-static/assets/sprites/lucca_atlas.json"),
    getJson("/agent-world-static/assets/sprites/robo_atlas.json"),
  ]);
  const [luccaAtlasTexture, roboAtlasTexture] = await Promise.all([
    PIXIRef.Assets.load("/agent-world-static/assets/sprites/lucca_atlas.png"),
    PIXIRef.Assets.load("/agent-world-static/robo.png"),
  ]);
  const manifest = await getJson("/agent-world-static/assets/tiles/office_world/manifest.json");
  const layout = defaultLayoutConfig({});
  let persistedGameState = null;
  try {
    persistedGameState = await getJson("/api/agent-world/game-state");
  } catch (error) {
    console.warn("Falling back to static agent world assets.", error);
  }
  const fallbackGameState = {
    [TILEMAP_STORAGE_KEYS.floor]: "",
    [TILEMAP_STORAGE_KEYS.wall]: "",
    [TILEMAP_STORAGE_KEYS.furniture]: "",
    [TILEMAP_STORAGE_KEYS.prop]: "",
    [TILEMAP_STORAGE_KEYS.roomRegions]: JSON.stringify([], null, 2),
    [TILEMAP_STORAGE_KEYS.stash]: JSON.stringify({ col: 15, row: 14 }, null, 2),
    [TILEMAP_STORAGE_KEYS.chatBubbleFrame]: JSON.stringify(DEFAULT_CHAT_BUBBLE_FRAME, null, 2),
    "agent-world-layout-config": JSON.stringify(defaultLayoutConfig(layout), null, 2),
    "agent-world-movement-overrides": JSON.stringify({ agents: {} }, null, 2),
  };
  const resolvedGameState = persistedGameState && typeof persistedGameState === "object" ? persistedGameState : fallbackGameState;
  const snapshot = structuredSnapshotFromGameState(resolvedGameState, layout);
  writeGameStateToLocalStorage(snapshot.raw, false);
  const floorText = snapshot.floorText;
  const wallText = snapshot.wallText;
  const furnitureText = snapshot.furnitureText;
  const propText = snapshot.propText;
  const roomRegions = snapshot.roomRegions;
  const stash = snapshot.stash;
  setChatBubbleThemes(snapshot.chatBubbleThemes);
  applyChatBubbleFrameStyles();

  const buildSpriteFrames = (atlasMeta, atlasTexture) => {
    const frames = {};
    for (const [name, frame] of Object.entries(atlasMeta.frames || {})) {
      frames[name] = new PIXIRef.Texture(
        atlasTexture.baseTexture || atlasTexture,
        new PIXIRef.Rectangle(frame.x, frame.y, frame.w, frame.h),
      );
    }
    return frames;
  };
  const spriteFrames = {
    "lucca-default": buildSpriteFrames(luccaAtlasMeta, luccaAtlasTexture),
    "robo-default": buildSpriteFrames(roboAtlasMeta, roboAtlasTexture),
  };

  return {
    frames: spriteFrames["lucca-default"],
    spriteFrames,
    spriteAtlasMeta: {
      "lucca-default": luccaAtlasMeta,
      "robo-default": roboAtlasMeta,
    },
    spriteAtlasPaths: {
      "lucca-default": "/agent-world-static/assets/sprites/lucca_atlas.png",
      "robo-default": "/agent-world-static/assets/sprites/robo_atlas.png",
    },
    tileManifest: manifest,
    layout: snapshot.layout,
    gameStateRaw: snapshot.raw,
    floorText,
    wallText,
    furnitureText,
    propText,
    roomRegions,
    stash,
  };
}

export function buildPrimitiveTexture(pixiApp, primitiveName, helpers = {}) {
  const PIXIRef = helpers.PIXIRef ?? globalThis.PIXI;
  const g = new PIXIRef.Graphics();
  if (primitiveName === "wall") {
    g.beginFill(0xf2efe7);
    g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.endFill();
    g.lineStyle(2, 0x3c3540, 1);
    g.moveTo(0, 2);
    g.lineTo(TILE_SIZE, 2);
    g.moveTo(0, TILE_SIZE - 2);
    g.lineTo(TILE_SIZE, TILE_SIZE - 2);
  } else {
    g.beginFill(0xf2efe7);
    g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.endFill();
    g.beginFill(0x7f5a31);
    g.drawRect(8, 2, TILE_SIZE - 16, TILE_SIZE - 4);
    g.endFill();
    g.lineStyle(2, 0x4f3518, 1);
    g.drawRect(8, 2, TILE_SIZE - 16, TILE_SIZE - 4);
    g.beginFill(0xe6c676);
    g.drawCircle(TILE_SIZE - 11, TILE_SIZE / 2, 2);
    g.endFill();
  }
  const texture = pixiApp.renderer.generateTexture(g, { resolution: 1, region: new PIXIRef.Rectangle(0, 0, TILE_SIZE, TILE_SIZE) });
  texture.baseTexture.scaleMode = PIXIRef.SCALE_MODES.NEAREST;
  g.destroy();
  return texture;
}

export async function buildTileTextures(pixiApp, manifest, helpers = {}) {
  const {
    buildPrimitiveTexture = () => null,
  } = helpers;
  const PIXIRef = helpers.PIXIRef ?? globalThis.PIXI;
  const atlasPaths = [...new Set(Object.values(manifest).filter((entry) => entry.atlasPath).map((entry) => entry.atlasPath))];
  const atlasCache = {};
  await Promise.all(atlasPaths.map(async (atlasPath) => {
    const texture = await PIXIRef.Assets.load(atlasPath);
    const baseTexture = texture.baseTexture || texture;
    baseTexture.scaleMode = PIXIRef.SCALE_MODES.NEAREST;
    atlasCache[atlasPath] = baseTexture;
  }));

  const textures = {};
  const primitives = {};
  for (const [code, entry] of Object.entries(manifest)) {
    if (entry.primitive) {
      if (!primitives[entry.primitive]) {
        primitives[entry.primitive] = buildPrimitiveTexture(pixiApp, entry.primitive);
      }
      textures[code] = primitives[entry.primitive];
      continue;
    }
    const [gridX, gridY] = entry.grid;
    const tileSize = entry.atlasTileSize || TILE_SIZE;
    textures[code] = new PIXIRef.Texture(
      atlasCache[entry.atlasPath],
      new PIXIRef.Rectangle(gridX * tileSize, gridY * tileSize, tileSize, tileSize),
    );
  }
  return textures;
}

export function getLayerTexture(renderer, objectToken, layerName, helpers = {}) {
  const PIXIRef = helpers.PIXIRef ?? globalThis.PIXI;
  if (objectToken.kind === "empty") return null;
  if (objectToken.kind === "primitive") {
    return objectToken.primitive === "door" ? renderer.assets.primitiveTextures.door : renderer.assets.primitiveTextures.wall;
  }
  const atlasKey = layerName === "wall" ? "wallAtlasTextures" : "officeAtlasTextures";
  const atlasBaseTexture = layerName === "wall" ? renderer.assets.wallAtlasBaseTexture : renderer.assets.officeAtlasBaseTexture;
  const cache = renderer.assets[atlasKey];
  const key = `${objectToken.x}:${objectToken.y}`;
  if (!cache[key]) {
    const tileSize = renderer.assets.layout.atlasTileSize || TILE_SIZE;
    cache[key] = new PIXIRef.Texture(
      atlasBaseTexture,
      new PIXIRef.Rectangle((objectToken.x - 1) * tileSize, (objectToken.y - 1) * tileSize, tileSize, tileSize),
    );
  }
  return cache[key];
}
