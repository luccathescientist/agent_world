from __future__ import annotations

from pathlib import Path
import json


ROOT = Path(__file__).resolve().parent.parent
OFFICE_WORLD_DIR = ROOT / "assets" / "tiles" / "office_world"

ATLAS_PATH = "/agent-world-static/assets/tiles/office_tileset/Office%20Tileset/Office%20Tileset%20All%2032x32.png"
FLOOR_ATLAS_PATH = "/agent-world-static/assets/tiles/office_tileset/Office%20Tileset/Office%20VX%20Ace/A2%20Office%20Floors.png"
WALL_ATLAS_PATH = "/agent-world-static/assets/tiles/office_tileset/Office%20Tileset/Office%20VX%20Ace/A4%20Office%20Walls.png"
ATLAS_TILE_SIZE = 32

TILES = [
    {"code": "a", "kind": "floor", "name": "Warm Floor", "grid": [0, 4], "passable": True},
    {"code": "b", "kind": "floor", "name": "Light Floor", "grid": [1, 4], "passable": True},
    {"code": "c", "kind": "floor", "name": "Steel Floor", "grid": [2, 4], "passable": True},
    {"code": "d", "kind": "floor", "name": "Gold Floor", "grid": [3, 4], "passable": True},
    {"code": "e", "kind": "floor", "name": "Cream Floor", "grid": [0, 5], "passable": True},
    {"code": "f", "kind": "floor", "name": "Blue Floor", "grid": [1, 5], "passable": True},
    {"code": "g", "kind": "floor", "name": "Green Floor", "grid": [2, 5], "passable": True},
    {"code": "h", "kind": "floor", "name": "Pale Floor", "grid": [3, 5], "passable": True},
    {"code": "A", "kind": "object", "name": "Wall", "primitive": "wall", "passable": False},
    {"code": "B", "kind": "object", "name": "Door", "primitive": "door", "passable": True, "door": True},
    {"code": "C", "kind": "object", "name": "Window", "grid": [5, 22], "passable": False},
    {"code": "D", "kind": "object", "name": "Wood Desk Left", "grid": [0, 0], "passable": False},
    {"code": "E", "kind": "object", "name": "Wood Desk Right", "grid": [1, 0], "passable": False},
    {"code": "F", "kind": "object", "name": "Grey Desk Left", "grid": [0, 2], "passable": False},
    {"code": "G", "kind": "object", "name": "Grey Desk Right", "grid": [1, 2], "passable": False},
    {"code": "H", "kind": "object", "name": "Mauve Chair", "grid": [0, 16], "passable": False},
    {"code": "I", "kind": "object", "name": "White Chair", "grid": [4, 16], "passable": False},
    {"code": "J", "kind": "object", "name": "Water Cooler", "grid": [8, 16], "passable": False},
    {"code": "K", "kind": "object", "name": "Storage Cabinet Left", "grid": [11, 16], "passable": False},
    {"code": "L", "kind": "object", "name": "Storage Cabinet Right", "grid": [12, 16], "passable": False},
    {"code": "M", "kind": "object", "name": "Bookshelf Brown", "grid": [8, 10], "passable": False},
    {"code": "N", "kind": "object", "name": "Bookshelf Grey", "grid": [12, 10], "passable": False},
    {"code": "O", "kind": "object", "name": "CRT Terminal", "grid": [8, 22], "passable": False},
    {"code": "P", "kind": "object", "name": "Blue Terminal", "grid": [10, 22], "passable": False},
    {"code": "Q", "kind": "object", "name": "Flat Monitor", "grid": [12, 22], "passable": False},
    {"code": "R", "kind": "object", "name": "Laptop Desk", "grid": [8, 24], "passable": False},
    {"code": "S", "kind": "object", "name": "Chart Board", "grid": [1, 26], "passable": False},
    {"code": "T", "kind": "object", "name": "Small Plant", "grid": [2, 27], "passable": False},
    {"code": "U", "kind": "object", "name": "Tall Plant", "grid": [4, 27], "passable": False},
    {"code": "V", "kind": "object", "name": "Bench", "grid": [0, 18], "passable": False},
    {"code": "W", "kind": "object", "name": "Gold Rug", "grid": [0, 30], "passable": True},
    {"code": "X", "kind": "object", "name": "Blue Rug", "grid": [2, 30], "passable": True},
    {"code": "Y", "kind": "object", "name": "Phone", "grid": [12, 19], "passable": False},
    {"code": "Z", "kind": "object", "name": "Clock", "grid": [0, 22], "passable": False},
    {"code": "0", "kind": "object", "name": "Crate", "grid": [8, 27], "passable": False},
    {"code": "1", "kind": "object", "name": "Cabinet Brown", "grid": [8, 14], "passable": False},
    {"code": "2", "kind": "object", "name": "Cabinet Grey", "grid": [10, 14], "passable": False},
    {"code": "3", "kind": "object", "name": "Picture", "grid": [3, 24], "passable": False},
]


def main() -> None:
    OFFICE_WORLD_DIR.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, dict[str, object]] = {}
    for entry in TILES:
        code = str(entry["code"])
        payload: dict[str, object] = {
            "kind": entry["kind"],
            "name": entry["name"],
            "passable": bool(entry["passable"]),
            "door": bool(entry.get("door", False)),
        }
        if "primitive" in entry:
            payload["primitive"] = entry["primitive"]
        else:
            payload["atlasPath"] = FLOOR_ATLAS_PATH if entry["kind"] == "floor" else ATLAS_PATH
            payload["atlasTileSize"] = ATLAS_TILE_SIZE
            payload["grid"] = entry["grid"]
        manifest[code] = payload

    layout = {
        "tileSize": 32,
        "cols": 30,
        "rows": 18,
        "emptyObject": ".",
        "atlasTileSize": ATLAS_TILE_SIZE,
        "floorAtlasPath": FLOOR_ATLAS_PATH,
        "officeAtlasPath": ATLAS_PATH,
        "wallAtlasPath": WALL_ATLAS_PATH,
        "anchors": {
            "library": {"col": 5, "row": 3, "label": "LIBRARY"},
            "comms": {"col": 24, "row": 3, "label": "COMMS"},
            "terminal": {"col": 15, "row": 9, "label": "TERMINAL"},
            "desk": {"col": 5, "row": 15, "label": "DESK"},
            "lounge": {"col": 24, "row": 15, "label": "LOUNGE"},
        },
        "stash": {"col": 15, "row": 14},
    }

    game_state = {
        "agent-world-layout-config": json.dumps(layout, indent=2) + "\n",
        "agent-world-room-regions": "[]\n",
        "agent-world-stash-point": json.dumps(layout["stash"], indent=2) + "\n",
        "agent-world-chat-bubble-frame": "{}\n",
        "agent-world-floor-map": "",
        "agent-world-wall-map": "",
        "agent-world-furniture-map": "",
        "agent-world-prop-map": "",
        "agent-world-movement-overrides": json.dumps({"agents": {}}, indent=2) + "\n",
    }

    (OFFICE_WORLD_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    (OFFICE_WORLD_DIR / "game_state.json").write_text(json.dumps(game_state, indent=2) + "\n")


if __name__ == "__main__":
    main()
