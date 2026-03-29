export function spriteFramesForAgent(renderer, agent) {
  const frames = renderer?.assets?.spriteFrames?.[agent?.spriteSeed];
  return frames || renderer.assets.frames;
}

export function getAnimationFrames(renderer, agent, visualState, helpers = {}) {
  const { spriteFramesForAgent = () => ({}) } = helpers;
  const frames = spriteFramesForAgent(renderer, agent);
  if (visualState === "reading") return [frames.read_0, frames.read_1];
  if (visualState === "working" || visualState === "writing" || visualState === "messaging") return [frames.work_0, frames.work_1];
  if (visualState === "blocked" && frames.shocked_0) return [frames.shocked_0, frames.shocked_1 || frames.shocked_0];
  if ((visualState === "waiting" || visualState === "idle") && frames.rest_0) return [frames.rest_0, frames.rest_1 || frames.rest_0];
  return [frames.idle_0, frames.idle_1];
}

export function collectFrameSequence(frames, prefix) {
  const sequence = [];
  for (let index = 0; index < 8; index += 1) {
    const texture = frames[`${prefix}_${index}`];
    if (!texture) break;
    sequence.push(texture);
  }
  return sequence;
}

export function directionalIdleFrames(renderer, agent, facing, helpers = {}) {
  const {
    getAnimationFrames = () => [],
    spriteFramesForAgent = () => ({}),
  } = helpers;
  const frames = spriteFramesForAgent(renderer, agent);
  if (facing === "up" && frames.idle_up) return [frames.idle_up];
  if (facing === "left" && frames.idle_left) return [frames.idle_left];
  if (facing === "right" && frames.idle_right) return [frames.idle_right];
  if ((facing === "left" || facing === "right") && frames.idle_side) return [frames.idle_side];
  if (frames.idle_down) return [frames.idle_down];
  return getAnimationFrames(renderer, agent, "idle");
}

export function directionalWalkFrames(renderer, agent, facing, helpers = {}) {
  const {
    collectFrameSequence = () => [],
    spriteFramesForAgent = () => ({}),
  } = helpers;
  const frames = spriteFramesForAgent(renderer, agent);
  if (facing === "up") {
    const sequence = collectFrameSequence(frames, "walk_up");
    if (sequence.length) return sequence;
  }
  if (facing === "left") {
    const sequence = collectFrameSequence(frames, "walk_left");
    if (sequence.length) return sequence;
  }
  if (facing === "right") {
    const sequence = collectFrameSequence(frames, "walk_right");
    if (sequence.length) return sequence;
  }
  if ((facing === "left" || facing === "right")) {
    const sequence = collectFrameSequence(frames, "walk_side");
    if (sequence.length) return sequence;
  }
  {
    const sequence = collectFrameSequence(frames, "walk_down");
    if (sequence.length) return sequence;
  }
  return collectFrameSequence(frames, "walk");
}

export function shouldMirrorSpriteForFacing(renderer, agent, facing, helpers = {}) {
  const { spriteFramesForAgent = () => ({}) } = helpers;
  if (facing !== "left") return false;
  const frames = spriteFramesForAgent(renderer, agent);
  if (frames.idle_left || frames.walk_left_0) return false;
  return Boolean(frames.idle_side || frames.walk_side_0);
}

export function updateBubble(container, text, helpers = {}) {
  const {
    displayActionText = (value) => value,
    positionBubble = () => {},
  } = helpers;
  const palette = container._bubblePalette || { fill: 0x111111, stroke: 0xf6e8bf, text: 0xf6ebc7 };
  container._bubble.text = displayActionText(text);
  container._bubble.style.fill = palette.text;
  const bubbleWidth = Math.max(90, Math.min(180, container._bubble.width + 14));
  const bubbleHeight = Math.max(22, container._bubble.height + 8);
  container._bubbleBg.clear();
  container._bubbleBg.beginFill(palette.fill, 0.92);
  container._bubbleBg.lineStyle(3, palette.stroke, 1);
  container._bubbleBg.drawRoundedRect(-bubbleWidth / 2, -bubbleHeight, bubbleWidth, bubbleHeight, 6);
  container._bubbleBg.endFill();
  container._bubbleBg.y = 0;
  container._bubble.y = 0;
  positionBubble(container);
}

export function updateAgentLabel(container, selected = false) {
  if (!container?._label || !container?._labelBg) return;
  const paddingX = 7;
  const paddingY = 3;
  const width = Math.max(46, container._label.width + paddingX * 2);
  const height = Math.max(18, container._label.height + paddingY * 2);
  container._label.style.fill = 0x111111;
  container._labelBg.clear();
  container._labelBg.beginFill(0xf7f1de, 0.94);
  container._labelBg.lineStyle(2, selected ? 0x76d0a8 : 0x7f6f48, 0.96);
  container._labelBg.drawRoundedRect(-width / 2, 0, width, height, 6);
  container._labelBg.endFill();
  container._label.x = 0;
  container._label.y = 2;
}

export function positionBubble(container) {
  if (!container?._bubbleWrap) return;
  container._bubbleWrap.x = container.x;
  container._bubbleWrap.y = container.y - 84;
}

export function positionAgentLabel(container) {
  if (!container?._labelWrap) return;
  container._labelWrap.x = container.x;
  container._labelWrap.y = container.y + (container._kind === "benchmark" ? 18 : 16);
}

export function updateActivityCue(container, agent, moving, helpers = {}) {
  const { activityCue = () => "" } = helpers;
  if (!container?._cue || !container?._cueBg) return;
  container._cue.text = activityCue(agent, container, moving);
  const width = Math.max(24, container._cue.width + 10);
  const height = Math.max(22, container._cue.height + 6);
  container._cueBg.clear();
  container._cueBg.beginFill(0xf7f3e6, 0.96);
  container._cueBg.lineStyle(2, 0x8c7a52, 0.95);
  container._cueBg.drawRoundedRect(-width / 2, 0, width, height, 6);
  container._cueBg.endFill();
  container._cue.x = 0;
  container._cue.y = 1;
  container._cueWrap.y = 8;
  container._cueWrap.x = 48;
}

export function chooseDisplayFrames(renderer, agent, moving, helpers = {}) {
  const {
    directionalIdleFrames = () => [],
    directionalWalkFrames = () => [],
    getAnimationFrames = () => [],
  } = helpers;
  const facing = renderer.agents?.get(agent.id)?._state?.facing || "down";
  if (moving) return directionalWalkFrames(renderer, agent, facing);
  if (agent.visualState === "reading" || agent.visualState === "working" || agent.visualState === "writing" || agent.visualState === "messaging") {
    return getAnimationFrames(renderer, agent, agent.visualState);
  }
  return directionalIdleFrames(renderer, agent, facing);
}

export function createAgentSprite(state, agent, helpers = {}) {
  const {
    bubblePaletteForAgent = () => null,
    createText = () => ({}),
    currentTileForAgent = () => ({ row: 0, col: 0 }),
    displayActionText = (value) => value,
    getAnimationFrames = () => [],
    hashString = () => 1,
    onSelectAgent = async () => {},
    PIXIRef = PIXI,
    positionAgentLabel = () => {},
    positionBubble = () => {},
    tilePoint = () => ({ x: 0, y: 0 }),
  } = helpers;
  const renderer = state.renderer;
  const container = new PIXIRef.Container();
  container.interactive = true;
  container.buttonMode = true;
  container.cursor = "pointer";
  container.agentId = agent.id;
  const startTile = currentTileForAgent(agent);
  container._state = {
    currentTile: startTile,
    path: [startTile],
    goalKey: "",
    currentAnchorKey: agent.currentAnchor || "",
    targetAnchorKey: agent.targetAnchor || "",
    facing: "down",
    ambientRoomKey: "",
    ambientGoalTile: null,
    ambientPauseUntil: 0,
    ambientWaypointIndex: 0,
    ambientSeed: (hashString(`${agent.id}:${agent.name}:wander`) || 1) >>> 0,
    lastAmbientKey: "",
  };

  const selection = new PIXIRef.Graphics();
  const anim = new PIXIRef.AnimatedSprite(getAnimationFrames(renderer, agent, agent.visualState));
  anim.anchor.set(0.5, 1);
  anim.y = -4;
  anim.scale.set(1.72);
  anim.animationSpeed = 0.14;
  anim.play();
  anim.roundPixels = false;

  const bubble = createText(displayActionText(agent.currentAction), {
    fontFamily: "Courier New",
    fontSize: 12,
    fontWeight: "bold",
    fill: 0xf6ebc7,
    wordWrap: true,
    wordWrapWidth: 150,
    align: "center",
  });
  bubble.anchor.set(0.5, 1);
  bubble.roundPixels = true;
  bubble.resolution = 2;

  const bubbleBg = new PIXIRef.Graphics();
  const bubbleWrap = new PIXIRef.Container();
  const labelBg = new PIXIRef.Graphics();
  const label = createText(agent.name, {
    fontFamily: "Courier New",
    fontSize: 12,
    fontWeight: "bold",
    fill: 0x111111,
    letterSpacing: 1,
  });
  label.anchor.set(0.5, 0);
  const labelWrap = new PIXIRef.Container();
  labelWrap.addChild(labelBg, label);

  const cue = createText("", {
    fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    fontSize: 13,
    fontWeight: "bold",
    fill: 0xffffff,
  });
  cue.anchor.set(0.5, 0);

  const cueBg = new PIXIRef.Graphics();
  const cueWrap = new PIXIRef.Container();
  cueWrap.addChild(cueBg, cue);

  bubbleWrap.addChild(bubbleBg, bubble, cueWrap);
  container.addChild(selection, anim);
  container.on("pointertap", async () => {
    await onSelectAgent(agent.id);
  });

  container._selection = selection;
  container._anim = anim;
  container._bubble = bubble;
  container._bubbleBg = bubbleBg;
  container._bubbleWrap = bubbleWrap;
  container._labelBg = labelBg;
  container._label = label;
  container._labelWrap = labelWrap;
  container._cue = cue;
  container._cueBg = cueBg;
  container._cueWrap = cueWrap;
  container._agent = agent;
  container._bubblePalette = bubblePaletteForAgent(agent);
  const p = tilePoint(startTile.row, startTile.col);
  container.x = p.x;
  container.y = p.y;
  positionBubble(container);
  positionAgentLabel(container);
  renderer.bubbleLayer.addChild(bubbleWrap);
  renderer.agentLabelLayer.addChild(labelWrap);
  return container;
}

export function createBenchmarkSprite(state, agent, helpers = {}) {
  const {
    bubblePaletteForAgent = () => null,
    createText = () => ({}),
    currentTileForAgent = () => ({ row: 0, col: 0 }),
    displayActionText = (value) => value,
    hashString = () => 1,
    onSelectAgent = async () => {},
    PIXIRef = PIXI,
    positionAgentLabel = () => {},
    positionBubble = () => {},
  } = helpers;
  const renderer = state.renderer;
  const container = new PIXIRef.Container();
  container.interactive = true;
  container.buttonMode = true;
  container.cursor = "pointer";
  container.agentId = agent.id;
  container._kind = "benchmark";
  container._state = {
    currentTile: currentTileForAgent(agent),
    benchIndex: 0,
    ambientSeed: (hashString(`${agent.id}:${agent.name}:bench`) || 1) >>> 0,
    lastAmbientKey: "",
  };

  const selection = new PIXIRef.Graphics();
  const chassis = new PIXIRef.Graphics();
  const labelBg = new PIXIRef.Graphics();
  const label = createText(agent.name.replace(/^bench-/, "").slice(0, 18), {
    fontFamily: "Courier New",
    fontSize: 11,
    fontWeight: "bold",
    fill: 0x111111,
    letterSpacing: 0.7,
  });
  label.anchor.set(0.5, 0);
  const labelWrap = new PIXIRef.Container();
  labelWrap.addChild(labelBg, label);

  const bubble = createText(displayActionText(agent.currentAction), {
    fontFamily: "Courier New",
    fontSize: 12,
    fontWeight: "bold",
    fill: 0xf6ebc7,
    wordWrap: true,
    wordWrapWidth: 150,
    align: "center",
  });
  bubble.anchor.set(0.5, 1);
  bubble.roundPixels = true;
  bubble.resolution = 2;

  const bubbleBg = new PIXIRef.Graphics();
  const bubbleWrap = new PIXIRef.Container();
  const cue = createText("🧪", {
    fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
    fontSize: 13,
    fontWeight: "bold",
    fill: 0xffffff,
  });
  cue.anchor.set(0.5, 0);
  const cueBg = new PIXIRef.Graphics();
  const cueWrap = new PIXIRef.Container();
  cueWrap.addChild(cueBg, cue);
  bubbleWrap.addChild(bubbleBg, bubble, cueWrap);

  chassis.beginFill(0x1a2340, 0.98);
  chassis.lineStyle(3, 0x91b7ff, 0.95);
  chassis.drawRoundedRect(-18, -40, 36, 26, 5);
  chassis.beginFill(0x75f0d2, 0.92);
  chassis.lineStyle(2, 0x10233e, 1);
  chassis.drawRoundedRect(-13, -35, 26, 14, 3);
  chassis.beginFill(0x27304f, 0.98);
  chassis.lineStyle(2, 0x6e7fa8, 1);
  chassis.drawRoundedRect(-14, -14, 28, 10, 3);
  chassis.beginFill(0xffd86b, 0.95);
  chassis.drawCircle(-8, -9, 2);
  chassis.beginFill(0x87f5a6, 0.95);
  chassis.drawCircle(0, -9, 2);
  chassis.beginFill(0xff9279, 0.95);
  chassis.drawCircle(8, -9, 2);

  container.addChild(selection, chassis);
  container.on("pointertap", async () => {
    await onSelectAgent(agent.id);
  });

  container._selection = selection;
  container._chassis = chassis;
  container._bubble = bubble;
  container._bubbleBg = bubbleBg;
  container._bubbleWrap = bubbleWrap;
  container._labelBg = labelBg;
  container._label = label;
  container._labelWrap = labelWrap;
  container._cue = cue;
  container._cueBg = cueBg;
  container._cueWrap = cueWrap;
  container._agent = agent;
  container._bubblePalette = bubblePaletteForAgent(agent);
  positionBubble(container);
  positionAgentLabel(container);
  renderer.bubbleLayer.addChild(bubbleWrap);
  renderer.agentLabelLayer.addChild(labelWrap);
  return container;
}
