import {
  DEFAULT_WORLD_COLS,
  DEFAULT_WORLD_ROWS,
  OBJECT_TOKEN_DOOR,
  OBJECT_TOKEN_EMPTY,
  OBJECT_TOKEN_WALL,
  PASSABLE_DOOR_TILES,
} from "../../core/constants.js";

export function normalizeMapText(text) {
  return String(text || "").replace(/\r/g, "").trim();
}

export function parseMapText(text) {
  return normalizeMapText(text).split("\n");
}

export function parseObjectRow(line) {
  return String(line || "").trim().split(/\s+/).filter(Boolean);
}

export function parseFloorRow(line) {
  const raw = String(line || "").trim();
  if (!raw) return [];
  return raw.includes(" ") ? raw.split(/\s+/).filter(Boolean) : raw.split("");
}

export function tokenLabel(token) {
  return token.kind === "empty"
    ? "."
    : token.kind === "primitive"
      ? token.primitive
      : `${token.x}:${token.y}${token.passable ? "+" : ""}`;
}

export function validateGrid(lines, cols, rows, label) {
  if (lines.length !== rows) {
    throw new Error(`${label} map must have ${rows} rows, got ${lines.length}`);
  }
  for (const [index, line] of lines.entries()) {
    if (line.length !== cols) {
      throw new Error(`${label} map row ${index + 1} must have ${cols} columns, got ${line.length}`);
    }
  }
}

export function validateObjectGrid(lines, cols, rows) {
  if (lines.length !== rows) {
    throw new Error(`Object map must have ${rows} rows, got ${lines.length}`);
  }
  for (const [index, line] of lines.entries()) {
    if (line.length !== cols) {
      throw new Error(`Object map row ${index + 1} must have ${cols} cells, got ${line.length}`);
    }
  }
}

export function getGridShape(lines, label) {
  const rows = lines.length;
  const widths = new Set(lines.map((line) => line.length));
  if (widths.size !== 1) {
    throw new Error(`${label} map has inconsistent row widths.`);
  }
  return { rows, cols: lines[0]?.length || 0 };
}

export function resolveGridShape(layout, floorLines, wallLines, furnitureLines, propLines) {
  const floorShape = getGridShape(floorLines, "Floor");
  const wallShape = getGridShape(wallLines, "Wall");
  const furnitureShape = getGridShape(furnitureLines, "Furniture");
  const propShape = getGridShape(propLines, "Prop");
  const shapes = [floorShape, wallShape, furnitureShape, propShape];
  const first = `${shapes[0].cols}x${shapes[0].rows}`;
  const consistent = shapes.every((shape) => `${shape.cols}x${shape.rows}` === first);
  if (!consistent) {
    throw new Error(
      `Layer sizes do not match. Floor=${floorShape.cols}x${floorShape.rows}, Wall=${wallShape.cols}x${wallShape.rows}, Furniture=${furnitureShape.cols}x${furnitureShape.rows}, Prop=${propShape.cols}x${propShape.rows}.`,
    );
  }
  return {
    cols: floorShape.cols || layout.cols || DEFAULT_WORLD_COLS,
    rows: floorShape.rows || layout.rows || DEFAULT_WORLD_ROWS,
  };
}

export function parseObjectToken(token) {
  const raw = String(token || "").trim();
  const lower = raw.toLowerCase();
  if (!raw || raw === OBJECT_TOKEN_EMPTY) {
    return { raw: OBJECT_TOKEN_EMPTY, kind: "empty", passable: true };
  }
  if (lower === OBJECT_TOKEN_WALL) {
    return { raw, kind: "primitive", primitive: "wall", passable: false };
  }
  if (lower === OBJECT_TOKEN_DOOR) {
    return { raw, kind: "primitive", primitive: "door", passable: true, door: true };
  }
  const match = raw.match(/^(\d{1,2}):(\d{1,2})(\+)?$/);
  if (!match) {
    throw new Error(`Invalid object token "${raw}". Use ".", "wall", "door", or x:y / x:y+`);
  }
  const x = Number(match[1]);
  const y = Number(match[2]);
  const isDoorArt = PASSABLE_DOOR_TILES.has(`${x}:${y}`);
  const passable = Boolean(match[3]) || isDoorArt;
  if (x < 1 || x > 16 || y < 1 || y > 32) {
    throw new Error(`Object coordinate "${raw}" is out of range. X must be 1-16 and Y must be 1-32.`);
  }
  return { raw, kind: "atlas", x, y, passable, door: isDoorArt };
}

export function serializeFloorLines(lines) {
  return lines.map((row) => row.join(" ")).join("\n");
}

export function serializeObjectLines(lines) {
  return lines.map((row) => row.join(" ")).join("\n");
}

export function parseFloorToken(token) {
  const raw = String(token || "").trim();
  if (!raw || raw === ".") return { raw: ".", kind: "empty", passable: false };
  if (/^[a-zA-Z0-9]$/.test(raw)) {
    return { raw, kind: "code", code: raw, passable: true };
  }
  const match = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    throw new Error(`Invalid floor token "${raw}". Use ".", a floor code, or x:y.`);
  }
  const x = Number(match[1]);
  const y = Number(match[2]);
  if (x < 1 || x > 16 || y < 1 || y > 32) {
    throw new Error(`Floor coordinate "${raw}" is out of range. X must be 1-16 and Y must be 1-32.`);
  }
  return { raw, kind: "atlas", x, y, passable: true };
}

export function floorTokenLabel(token) {
  if (token.kind === "empty") return ".";
  if (token.kind === "code") return token.code;
  return `${token.x}:${token.y}`;
}
