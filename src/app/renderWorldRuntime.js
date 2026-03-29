export function createRenderWorldRuntime(state, deps = {}) {
  const {
    EventSourceCtor = globalThis.EventSource,
    URLSearchParamsCtor = globalThis.URLSearchParams,
    documentRef = globalThis.document,
    fetchRef = globalThis.fetch,
    windowRef = globalThis.window,
    consoleRef = globalThis.console,
    PIXIRef = globalThis.PIXI,
    connectStreamHelper = () => {},
    connectStreamShell = () => {},
    selectAgentHelper = async () => {},
    renderWorldShell = () => {},
    syncSelectedAgentDetailFromWorldShell = () => {},
    renderInspectorShell = () => {},
    showRichMessageShell = async () => {},
    showRichMessageHelper = async () => {},
    renderChatShell = () => {},
    renderHistoryShell = () => {},
    renderScheduleShell = () => {},
    showStashItemShell = () => {},
    renderStashShell = () => {},
    handleStreamSnapshotShell = () => {},
    closeWorldDetailsShell = () => {},
    drawRoomHelper = () => {},
    createStashBoxHelper = () => {},
    createAgentSpriteHelper = () => null,
    createBenchmarkSpriteHelper = () => null,
    updateBubbleHelper = () => {},
    updateActivityCueHelper = () => {},
    chooseDisplayFramesHelper = () => [],
    effectiveGoalTileForAgentHelper = () => null,
    applyPathingHelper = () => {},
    tickAgentsHelper = () => {},
    initRendererHelper = async () => {},
    historyRoleMetaHelper = () => ({ label: "", icon: "" }),
    createText = () => null,
    bubblePaletteForAgent = () => ({}),
    currentTileForAgent = () => null,
    displayActionText = (value) => value,
    getAnimationFrames = () => [],
    hashString = () => 0,
    positionAgentLabel = () => {},
    positionBubble = () => {},
    tilePoint = () => ({ x: 0, y: 0 }),
    formatDate = (value) => String(value || ""),
    formatTime = (value) => String(value || ""),
    setText = () => {},
    getFloorTexture = () => null,
    getLayerTexture = () => null,
    getRenderHeight = () => 0,
    getSceneTopPadding = () => 0,
    getSelectedCells = () => [],
    getWorldCols = () => 0,
    getWorldHeight = () => 0,
    getWorldRows = () => 0,
    getWorldWidth = () => 0,
    parseFloorToken = () => ({ token: "." }),
    parseObjectToken = () => ({ token: "." }),
    floorTokenLabel = (value) => String(value || ""),
    tokenLabel = (value) => String(value || ""),
    renderEditorSelectionOverlay = () => {},
    createAnchorLabel = () => null,
    createRegionLabel = () => null,
    normalizeStashPoint = (value) => value,
    showStashItemForStashBox = () => {},
    shouldShowAgentSprite = () => true,
    shouldMirrorSpriteForFacing = () => false,
    updateAgentLabel = () => {},
    isBenchmarkAgent = () => false,
    populateAgentSelect = () => {},
    renderWorldHelper = () => {},
    syncSelectedAgentDetailFromWorldHelper = () => {},
    renderInspectorHelper = () => {},
    displayedLocationLabel = () => "",
    statusClass = () => "",
    classifyPath = () => "file",
    extractPaths = () => [],
    fileUrl = (value) => value,
    renderRichText = () => {},
    setMessageSelection = () => {},
    historyRoleClass = () => "assistant",
    formatRichTextHtml = (value) => value,
    maybeSpeakReply = () => {},
    renderChatHelper = () => {},
    renderHistoryHelper = () => {},
    renderScheduleHelper = () => {},
    renderStashHelper = () => {},
    showStashItemHelper = () => {},
    handleStreamSnapshotHelper = () => {},
    syncWorldDetailVisibility = () => {},
    nextAmbientRandom = () => 0,
    regionForAnchor = () => null,
    regionForCell = () => null,
    roomGoalTile = () => null,
    roomIdForAgent = () => "",
    roomWaypointTiles = () => [],
    findPath = () => [],
    goalTileForAgent = () => null,
    isWalkable = () => false,
    nearestWalkableTile = () => null,
    tileFromWorldPoint = () => null,
    directionalIdleFrames = () => [],
    directionalWalkFrames = () => [],
    buildPrimitiveTexture = () => null,
    buildTileTextures = async () => ({}),
    buildTilemapState = () => null,
    getCanvasCellFromEvent = () => null,
    loadArtAssets = async () => {},
    mountRendererView = () => {},
    normalizeMapText = (value) => value,
    renderVisualEditor = () => {},
    setHoveredMapCell = () => {},
    setTilemapStatus = () => {},
    syncEditorInputs = () => {},
    syncRendererCanvasSize = () => {},
    syncSceneOffset = () => {},
  } = deps;

  function historyEventKey(event) {
    const label = String(event?.fullLabel || event?.label || "");
    return `${String(event?.type || "")}::${label}`;
  }

  function mergePendingHistory(events = []) {
    const serverEvents = Array.isArray(events) ? events : [];
    const pendingEvents = Array.isArray(state.pendingHistoryEvents) ? state.pendingHistoryEvents : [];
    if (!pendingEvents.length) return serverEvents;
    const seen = new Set(serverEvents.map((event) => historyEventKey(event)));
    const unresolvedPending = [];
    for (const pending of pendingEvents) {
      if (seen.has(historyEventKey(pending))) continue;
      unresolvedPending.push(pending);
    }
    state.pendingHistoryEvents = unresolvedPending;
    return [...serverEvents, ...unresolvedPending];
  }

  function createStashBox() {
    return createStashBoxHelper(state, {
      createText,
      documentRef,
      normalizeStashPoint,
      PIXIRef,
      showStashItem: showStashItemForStashBox,
    });
  }

  function drawRoom(renderer) {
    return drawRoomHelper(state, renderer, {
      createAnchorLabel,
      createRegionLabel,
      createStashBox,
      createText,
      floorTokenLabel,
      getFloorTexture,
      getLayerTexture,
      getRenderHeight,
      getSceneTopPadding,
      getSelectedCells,
      getWorldCols,
      getWorldHeight,
      getWorldRows,
      getWorldWidth,
      parseFloorToken,
      parseObjectToken,
      PIXIRef,
      renderEditorSelectionOverlay,
      tokenLabel,
    });
  }

  async function scrollInspectorToTop() {
    documentRef.querySelector(".inspector")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function createAgentSelectHandler(agentId) {
    await selectAgent(agentId);
    await scrollInspectorToTop();
  }

  function createAgentSprite(agent) {
    return createAgentSpriteHelper(state, agent, {
      bubblePaletteForAgent,
      createText,
      currentTileForAgent,
      displayActionText,
      getAnimationFrames,
      hashString,
      onSelectAgent: createAgentSelectHandler,
      PIXIRef,
      positionAgentLabel,
      positionBubble,
      tilePoint,
    });
  }

  function createBenchmarkSprite(agent) {
    return createBenchmarkSpriteHelper(state, agent, {
      bubblePaletteForAgent,
      createText,
      currentTileForAgent,
      displayActionText,
      hashString,
      onSelectAgent: createAgentSelectHandler,
      PIXIRef,
      positionAgentLabel,
      positionBubble,
    });
  }

  function updateBubble(container, text) {
    return updateBubbleHelper(container, text, {
      displayActionText,
      positionBubble,
    });
  }

  function updateActivityCue(container, agent, moving) {
    return updateActivityCueHelper(container, agent, moving, {
      activityCue: deps.activityCue || (() => ""),
    });
  }

  function chooseDisplayFrames(renderer, agent, moving) {
    return chooseDisplayFramesHelper(renderer, agent, moving, {
      directionalIdleFrames,
      directionalWalkFrames,
      getAnimationFrames,
    });
  }

  function effectiveGoalTileForAgent(sprite, agent, currentTile) {
    return effectiveGoalTileForAgentHelper(state, sprite, agent, currentTile, {
      nextAmbientRandom,
      regionForAnchor,
      regionForCell,
      roomGoalTile,
      roomIdForAgent,
      roomWaypointTiles,
    });
  }

  function applyPathing(sprite, agent) {
    return applyPathingHelper(state, sprite, agent, {
      effectiveGoalTileForAgent,
      findPath,
      goalTileForAgent,
      isWalkable,
      nearestWalkableTile,
      tileFromWorldPoint,
      tilePoint,
    });
  }

  function tickAgents(delta) {
    return tickAgentsHelper(state, delta, {
      applyPathing,
      chooseDisplayFrames,
      positionAgentLabel,
      positionBubble,
      shouldMirrorSpriteForFacing,
      updateActivityCue,
      updateAgentLabel,
    });
  }

  async function initRenderer() {
    return initRendererHelper(state, {
      PIXIRef: windowRef.PIXI,
      buildPrimitiveTexture,
      buildTileTextures,
      buildTilemapState,
      documentRef,
      drawRoom,
      getCanvasCellFromEvent,
      getRenderHeight,
      getWorldWidth,
      loadArtAssets,
      mountRendererView,
      normalizeMapText,
      normalizeStashPoint,
      renderVisualEditor,
      setHoveredMapCell,
      setTilemapStatus,
      syncEditorInputs,
      syncRendererCanvasSize,
      syncSceneOffset,
      tickAgents,
      windowRef,
    });
  }

  function renderWorld(worldState) {
    return renderWorldShell(state, worldState, {
      bubblePaletteForAgent,
      createAgentSprite,
      createBenchmarkSprite,
      formatDate,
      isBenchmarkAgent,
      populateAgentSelect,
      renderWorldHelper,
      setText,
      shouldShowAgentSprite,
      syncSelectedAgentDetailFromWorld,
      updateActivityCue,
      updateAgentLabel,
      updateBubble,
    });
  }

  function syncSelectedAgentDetailFromWorld(worldState) {
    return syncSelectedAgentDetailFromWorldShell(state, worldState, {
      renderInspector,
      syncSelectedAgentDetailFromWorldHelper,
    });
  }

  function renderInspector(detailPayload) {
    return renderInspectorShell(state, detailPayload, {
      displayedLocationLabel,
      documentRef,
      formatDate,
      renderInspectorHelper,
      setText,
      showRichMessage,
      statusClass,
    });
  }

  async function showRichMessage(kind, title, text, path = null) {
    return showRichMessageShell(state, kind, title, text, path, {
      classifyPath,
      createElement: (tag) => documentRef.createElement(tag),
      documentRef,
      extractPaths,
      fetchText: async (url) => {
        const res = await fetchRef(url);
        return res.text();
      },
      fileUrl,
      renderRichText,
      setMessageSelection,
      setText,
      showRichMessageHelper,
      windowRef,
    });
  }

  const historyRoleMeta = (type) => historyRoleMetaHelper(type, { historyRoleClass });

  function renderChat(history) {
    return renderChatShell(state, history, {
      applyChatRoleTheme: deps.applyChatRoleTheme || (() => {}),
      chatBubbleMarkup: deps.chatBubbleMarkup || (() => ""),
      classifyPath,
      createElement: (tag) => documentRef.createElement(tag),
      documentRef,
      extractPaths,
      fileUrl,
      formatRichTextHtml,
      formatTime,
      historyRoleClass,
      historyRoleMeta,
      maybeSpeakReply,
      renderChatHelper,
      setText,
      showRichMessage,
      windowRef,
    });
  }

  function renderHistory(events) {
    const mergedHistory = mergePendingHistory(events);
    return renderHistoryShell(mergedHistory, {
      createElement: (tag) => documentRef.createElement(tag),
      documentRef,
      extractPaths,
      formatTime,
      renderChat,
      renderHistoryHelper,
      showRichMessage,
    });
  }

  function renderSchedule(detailPayload) {
    return renderScheduleShell(detailPayload, {
      createElement: (tag) => documentRef.createElement(tag),
      documentRef,
      formatDate,
      renderScheduleHelper,
      setText,
      showRichMessage,
    });
  }

  function showStashItem(item) {
    return showStashItemShell(item, {
      formatDate,
      showRichMessage,
      showStashItemHelper,
    });
  }

  function renderStash(stash) {
    return renderStashShell(state, stash, {
      createElement: (tag) => documentRef.createElement(tag),
      documentRef,
      formatDate,
      renderStashHelper,
      setText,
      showStashItem,
    });
  }

  function handleStreamSnapshot(payload) {
    return handleStreamSnapshotShell(payload, {
      handleStreamSnapshotHelper,
      renderHistory,
      renderInspector,
      renderSchedule,
      renderStash,
      renderWorld,
    });
  }

  function connectStream() {
    return connectStreamShell(state, {
      EventSourceCtor,
      URLSearchParamsCtor,
      connectStreamHelper,
      consoleRef,
      handleStreamSnapshot,
      setText,
    });
  }

  async function selectAgent(agentId) {
    return selectAgentHelper(state, agentId, {
      connectStream,
      getJson: deps.getJson || (async () => ({})),
      renderHistory,
      renderInspector,
      renderSchedule,
      renderStash,
      renderWorld,
      setMessageSelection,
      syncWorldDetailVisibility,
    });
  }

  function closeWorldDetails() {
    return closeWorldDetailsShell(state, {
      closeWorldDetailsHelper,
      connectStream,
      documentRef,
      renderHistory,
      renderSchedule,
      renderStash,
      renderWorld,
      setText,
      syncWorldDetailVisibility,
    });
  }

  return {
    applyPathing,
    chooseDisplayFrames,
    closeWorldDetails,
    connectStream,
    createAgentSprite,
    createBenchmarkSprite,
    createStashBox,
    drawRoom,
    effectiveGoalTileForAgent,
    handleStreamSnapshot,
    initRenderer,
    renderChat,
    renderHistory,
    renderInspector,
    renderSchedule,
    renderStash,
    renderWorld,
    selectAgent,
    showRichMessage,
    showStashItem,
    syncSelectedAgentDetailFromWorld,
    tickAgents,
    updateActivityCue,
    updateBubble,
  };
}
