/*
 * Thin renderer-shell adapters.
 * This layer binds app-owned state and PIXI globals to renderer modules without
 * moving renderer ownership or browser glue into the feature modules.
 */
export function getFloorTexture(renderer, floorToken, deps = {}) {
  const {
    getFloorTextureHelper = () => null,
    PIXIRef,
  } = deps;
  return getFloorTextureHelper(renderer, floorToken, { PIXIRef });
}

export function createAnchorLabel(text, x, y, deps = {}) {
  const {
    createAnchorLabelHelper = () => null,
    createText = () => null,
    PIXIRef,
  } = deps;
  return createAnchorLabelHelper(text, x, y, {
    createText,
    PIXIRef,
  });
}

export function createRegionLabel(region, deps = {}) {
  const {
    createAnchorLabel = () => null,
    createRegionLabelHelper = () => null,
    regionCenter = () => null,
  } = deps;
  return createRegionLabelHelper(region, {
    createAnchorLabel,
    regionCenter,
  });
}

export async function loadArtAssets(state, deps = {}) {
  const {
    applyChatBubbleFrameStyles = () => {},
    defaultLayoutConfig = (value) => value,
    getJson = async () => ({}),
    loadArtAssetsHelper = async () => ({}),
    setChatBubbleThemes = () => {},
    structuredSnapshotFromGameState = (value) => value,
    writeGameStateToLocalStorage = () => {},
    PIXIRef,
  } = deps;
  return loadArtAssetsHelper({
    PIXIRef,
    applyChatBubbleFrameStyles,
    defaultLayoutConfig,
    getJson,
    setChatBubbleThemes: (themes) => {
      setChatBubbleThemes(state, themes);
    },
    structuredSnapshotFromGameState,
    writeGameStateToLocalStorage,
  });
}

export function mountRendererView(state, deps = {}) {
  const {
    documentRef = document,
    mountRendererViewHelper = () => {},
    syncRendererCanvasSize = () => {},
  } = deps;
  return mountRendererViewHelper(state, {
    documentRef,
    syncRendererCanvasSize,
  });
}

export function syncSceneOffset(state, deps = {}) {
  const {
    getSceneTopPadding = () => 0,
    syncSceneOffsetHelper = () => {},
  } = deps;
  return syncSceneOffsetHelper(state, {
    getSceneTopPadding,
  });
}

export function resizeRendererViewport(state, deps = {}) {
  const {
    getRenderHeight = () => 0,
    getWorldWidth = () => 0,
    resizeRendererViewportHelper = () => {},
    syncRendererCanvasSize = () => {},
    syncSceneOffset = () => {},
  } = deps;
  return resizeRendererViewportHelper(state, {
    getRenderHeight,
    getWorldWidth,
    syncRendererCanvasSize,
    syncSceneOffset,
  });
}

export function syncRendererCanvasSize(state, deps = {}) {
  const {
    getRenderHeight = () => 0,
    getWorldWidth = () => 0,
    syncRendererCanvasSizeHelper = () => {},
  } = deps;
  return syncRendererCanvasSizeHelper(state, {
    getRenderHeight,
    getWorldWidth,
  });
}

export function buildPrimitiveTexture(pixiApp, primitiveName, deps = {}) {
  const {
    buildPrimitiveTextureHelper = () => null,
    PIXIRef,
  } = deps;
  return buildPrimitiveTextureHelper(pixiApp, primitiveName, {
    PIXIRef,
  });
}

export async function buildTileTextures(pixiApp, manifest, deps = {}) {
  const {
    buildPrimitiveTexture = () => null,
    buildTileTexturesHelper = async () => ({}),
    PIXIRef,
  } = deps;
  return buildTileTexturesHelper(pixiApp, manifest, {
    PIXIRef,
    buildPrimitiveTexture,
  });
}

export function getLayerTexture(renderer, objectToken, layerName, deps = {}) {
  const {
    getLayerTextureHelper = () => null,
    PIXIRef,
  } = deps;
  return getLayerTextureHelper(renderer, objectToken, layerName, {
    PIXIRef,
  });
}
