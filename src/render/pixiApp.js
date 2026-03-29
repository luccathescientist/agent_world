import {
  DEFAULT_FLOOR_ATLAS_PATH,
  DEFAULT_OFFICE_ATLAS_PATH,
  DEFAULT_WALL_ATLAS_PATH,
  DEFAULT_WORLD_COLS,
  DEFAULT_WORLD_ROWS,
} from "../core/constants.js";

export async function initRenderer(state, helpers = {}) {
  const {
    PIXIRef = globalThis.PIXI,
    buildPrimitiveTexture = () => null,
    buildTileTextures = async () => ({}),
    buildTilemapState = () => null,
    documentRef = document,
    drawRoom = () => {},
    getCanvasCellFromEvent = () => null,
    getRenderHeight = () => 0,
    getWorldWidth = () => 0,
    loadArtAssets = async () => ({}),
    mountRendererView = () => {},
    normalizeMapText = (value) => value,
    normalizeStashPoint = (value) => value,
    renderVisualEditor = () => {},
    setHoveredMapCell = () => {},
    setTilemapStatus = () => {},
    syncEditorInputs = () => {},
    syncRendererCanvasSize = () => {},
    syncSceneOffset = () => {},
    tickAgents = () => {},
    windowRef = window,
  } = helpers;
  if (state.renderer || !PIXIRef) return;
  const host = documentRef.getElementById("world-canvas");
  const pixiApp = new PIXIRef.Application({
    width: getWorldWidth(),
    height: getRenderHeight(),
    antialias: false,
    autoDensity: true,
    resolution: 1,
    backgroundAlpha: 0,
  });
  host.appendChild(pixiApp.view);

  const backgroundLayer = new PIXIRef.Container();
  const floorLayer = new PIXIRef.Container();
  const wallLayer = new PIXIRef.Container();
  const depthLayer = new PIXIRef.Container();
  depthLayer.sortableChildren = true;
  const overlayLayer = new PIXIRef.Container();
  const interactionLayer = new PIXIRef.Container();
  const labelLayer = new PIXIRef.Container();
  const agentLabelLayer = new PIXIRef.Container();
  const bubbleLayer = new PIXIRef.Container();
  pixiApp.stage.addChild(backgroundLayer, floorLayer, wallLayer, depthLayer, overlayLayer, interactionLayer, labelLayer, agentLabelLayer, bubbleLayer);

  const assets = await loadArtAssets();
  assets.tileTextures = await buildTileTextures(pixiApp, assets.tileManifest);
  const officeAtlas = await PIXIRef.Assets.load(assets.layout.officeAtlasPath || DEFAULT_OFFICE_ATLAS_PATH);
  const floorAtlas = await PIXIRef.Assets.load(assets.layout.floorAtlasPath || DEFAULT_FLOOR_ATLAS_PATH);
  const wallAtlas = await PIXIRef.Assets.load(assets.layout.wallAtlasPath || DEFAULT_WALL_ATLAS_PATH);
  assets.floorAtlasBaseTexture = floorAtlas.baseTexture || floorAtlas;
  assets.floorAtlasBaseTexture.scaleMode = PIXIRef.SCALE_MODES.NEAREST;
  assets.officeAtlasBaseTexture = officeAtlas.baseTexture || officeAtlas;
  assets.officeAtlasBaseTexture.scaleMode = PIXIRef.SCALE_MODES.NEAREST;
  assets.wallAtlasBaseTexture = wallAtlas.baseTexture || wallAtlas;
  assets.wallAtlasBaseTexture.scaleMode = PIXIRef.SCALE_MODES.NEAREST;
  assets.officeAtlasTextures = {};
  assets.wallAtlasTextures = {};
  assets.floorAtlasTextures = {};
  assets.primitiveTextures = {
    wall: buildPrimitiveTexture(pixiApp, "wall"),
    door: buildPrimitiveTexture(pixiApp, "door"),
  };
  assets.layout.stash = normalizeStashPoint(assets.stash || assets.layout.stash || { col: 15, row: 14 });
  state.tilemap = buildTilemapState(assets.floorText, assets.wallText, assets.furnitureText, assets.propText, assets.tileManifest, assets.layout, assets.roomRegions);
  state.roomRegions = state.tilemap.layout.roomRegions || [];
  assets.layout.cols = state.tilemap.layout.cols;
  assets.layout.rows = state.tilemap.layout.rows;
  assets.layout.anchors = state.tilemap.layout.anchors;
  state.gameStateRaw = assets.gameStateRaw || {};
  state.editor.baseFloorText = normalizeMapText(assets.floorText);
  state.editor.baseWallText = normalizeMapText(assets.wallText);
  state.editor.baseFurnitureText = normalizeMapText(assets.furnitureText);
  state.editor.basePropText = normalizeMapText(assets.propText);
  state.editor.baseCols = assets.layout.cols || DEFAULT_WORLD_COLS;
  state.editor.baseRows = assets.layout.rows || DEFAULT_WORLD_ROWS;
  state.editor.draftFloorText = state.tilemap.floorText;
  state.editor.draftWallText = state.tilemap.wallText;
  state.editor.draftFurnitureText = state.tilemap.furnitureText;
  state.editor.draftPropText = state.tilemap.propText;

  state.renderer = {
    host,
    pixiApp,
    backgroundLayer,
    floorLayer,
    wallLayer,
    depthLayer,
    overlayLayer,
    interactionLayer,
    labelLayer,
    agentLabelLayer,
    bubbleLayer,
    agents: new Map(),
    assets,
  };
  drawRoom(state.renderer);
  syncEditorInputs();
  setTilemapStatus("Tilemap loaded.");
  pixiApp.ticker.add((delta) => tickAgents(delta));
  syncSceneOffset();
  pixiApp.renderer.resize(getWorldWidth(), getRenderHeight());
  mountRendererView();
  syncRendererCanvasSize();

  pixiApp.view.addEventListener("mousemove", (event) => {
    if (state.activeTab !== "editor") return;
    const cell = getCanvasCellFromEvent(event, pixiApp.view);
    if (!cell) {
      setHoveredMapCell(null, null);
      return;
    }
    setHoveredMapCell(cell.row, cell.col);
    if (state.editor.isSelecting) {
      state.editor.selectionFocus = { row: cell.row, col: cell.col };
      state.editor.selectedCell = { row: cell.row, col: cell.col };
      drawRoom(state.renderer);
      renderVisualEditor();
    }
  });
  pixiApp.view.addEventListener("mouseleave", () => setHoveredMapCell(null, null));
  pixiApp.view.addEventListener("mousedown", (event) => {
    if (state.activeTab !== "editor") return;
    const cell = getCanvasCellFromEvent(event, pixiApp.view);
    if (!cell) return;
    state.editor.isSelecting = true;
    state.editor.selectionAnchor = { row: cell.row, col: cell.col };
    state.editor.selectionFocus = { row: cell.row, col: cell.col };
    state.editor.selectedCell = { row: cell.row, col: cell.col };
    state.editor.selectedAtlasCell = null;
    drawRoom(state.renderer);
    renderVisualEditor();
  });
  windowRef.addEventListener("mouseup", (event) => {
    if (!state.editor.isSelecting) return;
    state.editor.isSelecting = false;
    const cell = getCanvasCellFromEvent(event, pixiApp.view);
    if (cell) {
      state.editor.selectionFocus = { row: cell.row, col: cell.col };
      state.editor.selectedCell = { row: cell.row, col: cell.col };
    }
    drawRoom(state.renderer);
    renderVisualEditor();
  });
}
