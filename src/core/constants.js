/*
 * Shared frontend constants.
 * This file centralizes stable IDs, defaults, storage keys, tile sizes, and
 * visual/editor configuration values used across the frontend modules.
 */
export const TILE_SIZE = 32;
export const WORLD_TOP_PADDING = 48;
export const DEFAULT_WORLD_COLS = 30;
export const DEFAULT_WORLD_ROWS = 18;
export const DEFAULT_FLOOR_ATLAS_PATH = "/agent-world-static/assets/tiles/office_tileset/Office%20Tileset/Office%20VX%20Ace/A2%20Office%20Floors.png";
export const DEFAULT_OFFICE_ATLAS_PATH = "/agent-world-static/assets/tiles/office_tileset/Office%20Tileset/Office%20Tileset%20All%2032x32.png";
export const DEFAULT_WALL_ATLAS_PATH = "/agent-world-static/assets/tiles/office_tileset/Office%20Tileset/Office%20VX%20Ace/A4%20Office%20Walls.png";
export const EMPTY_OBJECT = ".";
export const OBJECT_TOKEN_EMPTY = ".";
export const OBJECT_TOKEN_WALL = "wall";
export const OBJECT_TOKEN_DOOR = "door";
export const PASSABLE_DOOR_TILES = new Set(["9:15", "9:16"]);
export const SEAT_FURNITURE_TILES = new Set(["1:17", "5:17", "1:19"]);
export const ROOM_LANDMARK_TOKENS = [
  { layer: "furniture", token: "10:19", label: "water-cooler" },
  { layer: "furniture", token: "15:19", label: "vending-machine" },
  { layer: "furniture", token: "16:19", label: "vending-machine" },
  { layer: "furniture", token: "6:3", label: "coffee-machine" },
  { layer: "furniture", token: "9:11", label: "bookshelf" },
  { layer: "furniture", token: "10:11", label: "bookshelf" },
  { layer: "furniture", token: "11:11", label: "bookshelf" },
  { layer: "furniture", token: "14:8", label: "bookshelf" },
  { layer: "furniture", token: "15:8", label: "bookshelf" },
  { layer: "furniture", token: "3:20", label: "bookshelf", offset: { row: 0, col: 1 } },
  { layer: "furniture", token: "4:3", label: "printer" },
  { layer: "furniture", token: "5:3", label: "printer" },
  { layer: "furniture", token: "11:30", label: "documents" },
  { layer: "prop", token: "3:26", label: "painting" },
  { layer: "prop", token: "4:26", label: "painting" },
  { layer: "prop", token: "5:26", label: "painting" },
  { layer: "prop", token: "3:28", label: "chart" },
  { layer: "prop", token: "4:28", label: "chart" },
  { layer: "prop", token: "1:28", label: "chalkboard" },
  { layer: "prop", token: "2:28", label: "chalkboard" },
  { layer: "prop", token: "8:26", label: "paper" },
  { layer: "prop", token: "6:26", label: "painting" },
  { layer: "prop", token: "13:21", label: "telephone" },
];
export const TILEMAP_STORAGE_KEYS = {
  floor: "agent-world-floor-map",
  wall: "agent-world-wall-map",
  furniture: "agent-world-furniture-map",
  prop: "agent-world-prop-map",
  roomRegions: "agent-world-room-regions",
  stash: "agent-world-stash-point",
  chatBubbleFrame: "agent-world-chat-bubble-frame",
  voiceInputDeviceId: "agent-world-voice-input-device-id",
};
export const GAME_STATE_STORAGE_KEYS = [
  TILEMAP_STORAGE_KEYS.floor,
  TILEMAP_STORAGE_KEYS.wall,
  TILEMAP_STORAGE_KEYS.furniture,
  TILEMAP_STORAGE_KEYS.prop,
  TILEMAP_STORAGE_KEYS.roomRegions,
  TILEMAP_STORAGE_KEYS.stash,
  TILEMAP_STORAGE_KEYS.chatBubbleFrame,
  "agent-world-layout-config",
  "agent-world-movement-overrides",
];
export const DEFAULT_CHAT_BUBBLE_FRAME = {
  tl: { layer: "wall", token: "1:3" },
  tm: { layer: "wall", token: "4:3" },
  tr: { layer: "wall", token: "5:2" },
  ml: { layer: "wall", token: "1:4" },
  mm: { layer: "wall", token: "3:4" },
  mr: { layer: "wall", token: "5:4" },
  bl: { layer: "wall", token: "2:6" },
  bm: { layer: "wall", token: "4:6" },
  br: { layer: "wall", token: "5:6" },
};
export const DEFAULT_CHAT_TEXT_COLORS = {
  assistant: "#fff4d7",
  tool: "#d7e7ff",
  user: "#d8f3e8",
};
export const AGENT_INACTIVE_HIDE_MS = 20 * 60 * 1000;
export const AGENT_BUBBLE_PALETTES = [
  { fill: 0x1f2f2b, stroke: 0x76d0a8, text: 0xeafff4 },
  { fill: 0x2d2236, stroke: 0xe0a9ff, text: 0xf9ecff },
  { fill: 0x2d261d, stroke: 0xf4c46a, text: 0xfff3d7 },
  { fill: 0x1f2938, stroke: 0x84c7ff, text: 0xe7f4ff },
  { fill: 0x372123, stroke: 0xff9f8b, text: 0xffebe6 },
  { fill: 0x222f24, stroke: 0x9ddb7c, text: 0xf0ffe7 },
  { fill: 0x312431, stroke: 0xff9de1, text: 0xffedf9 },
  { fill: 0x1e3034, stroke: 0x74d9e8, text: 0xe7fdff },
];
export const CHAT_BUBBLE_SLOT_LAYOUT = [
  ["tl", "tm", "tm", "tr"],
  ["ml", "mm", "mm", "mr"],
  ["ml", "mm", "mm", "mr"],
  ["bl", "bm", "bm", "br"],
];
export const CHAT_BUBBLE_PREVIEW_SAMPLES = [
  {
    key: "short",
    role: "assistant",
    label: "Agent",
    metaLabel: "Lucca",
    eventType: "reply",
    time: "3:18 PM",
    body: "Ready.",
  },
  {
    key: "medium",
    role: "tool",
    label: "Tool",
    metaLabel: "Tool",
    eventType: "research",
    time: "3:19 PM",
    body: "Opened the atlas and read the selected wall tile metadata.",
  },
  {
    key: "long",
    role: "user",
    label: "User",
    metaLabel: "You",
    eventType: "command",
    time: "3:20 PM",
    body: "Head to the library, check the shelves, and tell me if anything looks out of place.",
  },
];
export const VISUAL_LAYER_CONFIG = {
  floor: {
    label: "Floor",
    atlasKind: "floor",
    title: "Floor Atlas",
    modeLabel: "A2 floor atlas",
    cols: 16,
    rows: 12,
  },
  wall: {
    label: "Wall",
    atlasKind: "wall",
    title: "Wall Atlas",
    modeLabel: "A4 wall atlas",
    cols: 16,
    rows: 15,
  },
  furniture: {
    label: "Furniture",
    atlasKind: "office",
    title: "Furniture Atlas",
    modeLabel: "Office atlas",
    cols: 16,
    rows: 32,
  },
  prop: {
    label: "Prop",
    atlasKind: "office",
    title: "Prop Atlas",
    modeLabel: "Office atlas",
    cols: 16,
    rows: 32,
  },
};
export const DEFAULT_ANCHOR_TILES = {
  library: { col: 5, row: 3, label: "LIBRARY" },
  comms: { col: 24, row: 3, label: "COMMS" },
  terminal: { col: 15, row: 9, label: "TERMINAL" },
  desk: { col: 5, row: 15, label: "DESK" },
  lounge: { col: 24, row: 15, label: "LOUNGE" },
};
export const CANONICAL_ANCHOR_ALIASES = {
  library: "library",
  books: "library",
  bookshelf: "library",
  terminal: "terminal",
  workdesk: "desk",
  desk: "desk",
  writing: "desk",
  lounge: "lounge",
  rest: "lounge",
  comms: "comms",
  communication: "comms",
  communications: "comms",
  conference: "comms",
};
export const PATH_RE = /\/home\/[^/\s)"'`]+\/[^\s)"'`]+/g;
export const DEFAULT_SELECTED_AGENT_ID = "lucca-main";
