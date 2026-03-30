import test from "node:test";
import assert from "node:assert/strict";

import {
  floorTokenLabel,
  normalizeMapText,
  parseFloorRow,
  parseFloorToken,
  parseMapText,
  parseObjectRow,
  parseObjectToken,
  resolveGridShape,
  serializeFloorLines,
  serializeObjectLines,
  tokenLabel,
  validateObjectGrid,
} from "../src/features/tilemap/mapText.js";

test("normalizeMapText strips carriage returns and trims outer whitespace", () => {
  assert.equal(normalizeMapText("\n a b \r\n c d \r\n"), "a b \n c d");
});

test("parseFloorRow supports spaced and compact row formats", () => {
  assert.deepEqual(parseFloorRow("a b c"), ["a", "b", "c"]);
  assert.deepEqual(parseFloorRow("abc"), ["a", "b", "c"]);
});

test("parseObjectRow splits object rows on whitespace", () => {
  assert.deepEqual(parseObjectRow("wall . 3:4+"), ["wall", ".", "3:4+"]);
});

test("parseObjectToken handles primitive and atlas values", () => {
  assert.deepEqual(parseObjectToken("."), { raw: ".", kind: "empty", passable: true });
  assert.deepEqual(parseObjectToken("wall"), { raw: "wall", kind: "primitive", primitive: "wall", passable: false });
  assert.deepEqual(parseObjectToken("door"), { raw: "door", kind: "primitive", primitive: "door", passable: true, door: true });
  assert.deepEqual(parseObjectToken("2:7+"), { raw: "2:7+", kind: "atlas", x: 2, y: 7, passable: true, door: false });
});

test("parseObjectToken recognizes baked-in passable door art", () => {
  const token = parseObjectToken("9:15");
  assert.equal(token.passable, true);
  assert.equal(token.door, true);
});

test("parseFloorToken handles floor codes and atlas coordinates", () => {
  assert.deepEqual(parseFloorToken("."), { raw: ".", kind: "empty", passable: false });
  assert.deepEqual(parseFloorToken("a"), { raw: "a", kind: "code", code: "a", passable: true });
  assert.deepEqual(parseFloorToken("3:4"), { raw: "3:4", kind: "atlas", x: 3, y: 4, passable: true });
});

test("serialization helpers round-trip parsed rows", () => {
  assert.equal(serializeFloorLines([["a", "b"], ["1:2", "."]]), "a b\n1:2 .");
  assert.equal(serializeObjectLines([["wall", "."], ["2:3+", "door"]]), "wall .\n2:3+ door");
});

test("resolveGridShape returns shared dimensions and validateObjectGrid enforces them", () => {
  const floor = parseMapText("a b\nc d").map(parseFloorRow);
  const wall = parseMapText(". .\nwall door").map(parseObjectRow);
  const furniture = parseMapText(". .\n. .").map(parseObjectRow);
  const prop = parseMapText(". .\n. .").map(parseObjectRow);
  const shape = resolveGridShape({ cols: 99, rows: 88 }, floor, wall, furniture, prop);
  assert.deepEqual(shape, { cols: 2, rows: 2 });
  assert.doesNotThrow(() => validateObjectGrid(wall, 2, 2));
});

test("resolveGridShape rejects inconsistent layer sizes", () => {
  const floor = parseMapText("a b").map(parseFloorRow);
  const wall = parseMapText(". .\n. .").map(parseObjectRow);
  const furniture = parseMapText(". .").map(parseObjectRow);
  const prop = parseMapText(". .").map(parseObjectRow);
  assert.throws(() => resolveGridShape({}, floor, wall, furniture, prop), /Layer sizes do not match/);
});

test("tokenLabel and floorTokenLabel render compact debug strings", () => {
  assert.equal(tokenLabel({ kind: "empty" }), ".");
  assert.equal(tokenLabel({ kind: "primitive", primitive: "wall" }), "wall");
  assert.equal(tokenLabel({ kind: "atlas", x: 4, y: 9, passable: true }), "4:9+");
  assert.equal(floorTokenLabel({ kind: "code", code: "a" }), "a");
  assert.equal(floorTokenLabel({ kind: "atlas", x: 4, y: 9 }), "4:9");
});
