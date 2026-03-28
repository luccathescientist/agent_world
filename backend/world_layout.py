"""Persistent game-state storage for Agent World."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict

from .registry import get_agent


ROOT_DIR = Path(__file__).resolve().parents[1]
OFFICE_WORLD_DIR = ROOT_DIR / "assets" / "tiles" / "office_world"
GAME_STATE_PATH = OFFICE_WORLD_DIR / "game_state.json"
LEGACY_LAYOUT_PATH = OFFICE_WORLD_DIR / "layout.json"
LEGACY_MOVEMENT_OVERRIDE_PATH = OFFICE_WORLD_DIR / "movement_overrides.json"
LEGACY_MAP_PATHS = {
    "agent-world-floor-map": OFFICE_WORLD_DIR / "floor_map.txt",
    "agent-world-wall-map": OFFICE_WORLD_DIR / "wall_map.txt",
    "agent-world-furniture-map": OFFICE_WORLD_DIR / "furniture_map.txt",
    "agent-world-prop-map": OFFICE_WORLD_DIR / "prop_map.txt",
}

GAME_STATE_KEYS = {
    "floor": "agent-world-floor-map",
    "wall": "agent-world-wall-map",
    "furniture": "agent-world-furniture-map",
    "prop": "agent-world-prop-map",
    "room_regions": "agent-world-room-regions",
    "stash": "agent-world-stash-point",
    "chat_bubble": "agent-world-chat-bubble-frame",
    "layout_config": "agent-world-layout-config",
    "movement_overrides": "agent-world-movement-overrides",
}

DEFAULT_LAYOUT_CONFIG: Dict[str, Any] = {
    "name": "Lucca Research Office",
    "tileSize": 32,
    "cols": 30,
    "rows": 18,
    "emptyObject": ".",
    "atlasTileSize": 32,
    "floorAtlasPath": "/agent-world-static/assets/tiles/office_tileset/Office%20Tileset/Office%20VX%20Ace/A2%20Office%20Floors.png",
    "officeAtlasPath": "/agent-world-static/assets/tiles/office_tileset/Office%20Tileset/Office%20Tileset%20All%2032x32.png",
    "wallAtlasPath": "/agent-world-static/assets/tiles/office_tileset/Office%20Tileset/Office%20VX%20Ace/A4%20Office%20Walls.png",
    "anchors": {},
}

DEFAULT_ROOM_STATE: Dict[str, Any] = {
    "roomRegions": [],
    "stash": {"col": 15, "row": 14},
    "chatBubbleThemes": {},
}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _read_json(path: Path, fallback: Any) -> Any:
    try:
        if not path.exists():
            return fallback
        data = json.loads(path.read_text())
        return data
    except Exception:
        return fallback


def _read_text(path: Path, fallback: str = "") -> str:
    try:
        if not path.exists():
            return fallback
        return path.read_text()
    except Exception:
        return fallback


def _stringify(value: Any) -> str:
    if isinstance(value, str):
        return value
    return json.dumps(value, indent=2) + "\n"


def _normalize_text_payload(value: Any) -> str:
    text = str(value or "")
    return text.rstrip() + "\n" if text.strip() else ""


def _normalize_game_state_payload(payload: Dict[str, Any]) -> Dict[str, str]:
    normalized: Dict[str, str] = {}
    for key, value in payload.items():
        if not str(key).startswith("agent-world-"):
            continue
        if value is None:
            continue
        if key in {
            GAME_STATE_KEYS["room_regions"],
            GAME_STATE_KEYS["stash"],
            GAME_STATE_KEYS["chat_bubble"],
            GAME_STATE_KEYS["layout_config"],
            GAME_STATE_KEYS["movement_overrides"],
        }:
            normalized[str(key)] = _stringify(value)
        else:
            normalized[str(key)] = _normalize_text_payload(value)
    return normalized


def _bootstrap_legacy_game_state() -> Dict[str, str]:
    legacy_layout = _read_json(LEGACY_LAYOUT_PATH, {})
    layout_config = {
        **DEFAULT_LAYOUT_CONFIG,
        **{k: legacy_layout.get(k) for k in DEFAULT_LAYOUT_CONFIG.keys() if k in legacy_layout},
    }
    room_state = {
        "roomRegions": legacy_layout.get("roomRegions", DEFAULT_ROOM_STATE["roomRegions"]),
        "stash": legacy_layout.get("stash", DEFAULT_ROOM_STATE["stash"]),
        "chatBubbleThemes": legacy_layout.get("chatBubbleThemes", DEFAULT_ROOM_STATE["chatBubbleThemes"]),
    }
    movement_overrides = _read_json(LEGACY_MOVEMENT_OVERRIDE_PATH, {"agents": {}})
    payload: Dict[str, Any] = {
        GAME_STATE_KEYS["layout_config"]: layout_config,
        GAME_STATE_KEYS["room_regions"]: room_state["roomRegions"],
        GAME_STATE_KEYS["stash"]: room_state["stash"],
        GAME_STATE_KEYS["chat_bubble"]: room_state["chatBubbleThemes"],
        GAME_STATE_KEYS["movement_overrides"]: movement_overrides,
    }
    for key, path in LEGACY_MAP_PATHS.items():
        payload[key] = _read_text(path, "")
    return _normalize_game_state_payload(payload)


def load_world_game_state() -> Dict[str, str]:
    data = _read_json(GAME_STATE_PATH, {})
    if isinstance(data, dict) and data:
        return _normalize_game_state_payload(data)
    bootstrapped = _bootstrap_legacy_game_state()
    if bootstrapped:
        save_world_game_state(bootstrapped)
    return bootstrapped


def save_world_game_state(payload: Dict[str, Any]) -> Dict[str, str]:
    current = _read_json(GAME_STATE_PATH, {})
    if not isinstance(current, dict):
        current = {}
    current = _normalize_game_state_payload(current)
    next_payload = {
        **current,
        **_normalize_game_state_payload(payload),
    }
    GAME_STATE_PATH.write_text(json.dumps(next_payload, indent=2) + "\n")
    return next_payload


def _parse_json_string(raw_value: str, fallback: Any) -> Any:
    try:
        value = json.loads(raw_value)
        return value
    except Exception:
        return fallback


def parse_world_game_state(game_state: Dict[str, str] | None = None) -> Dict[str, Any]:
    raw = game_state or load_world_game_state()
    layout_config = _parse_json_string(raw.get(GAME_STATE_KEYS["layout_config"], ""), {})
    room_regions = _parse_json_string(raw.get(GAME_STATE_KEYS["room_regions"], ""), [])
    stash = _parse_json_string(raw.get(GAME_STATE_KEYS["stash"], ""), DEFAULT_ROOM_STATE["stash"])
    chat_bubble_themes = _parse_json_string(raw.get(GAME_STATE_KEYS["chat_bubble"], ""), DEFAULT_ROOM_STATE["chatBubbleThemes"])
    movement_overrides = _parse_json_string(raw.get(GAME_STATE_KEYS["movement_overrides"], ""), {"agents": {}})
    return {
        "layout": {
            **DEFAULT_LAYOUT_CONFIG,
            **(layout_config if isinstance(layout_config, dict) else {}),
            "roomRegions": room_regions if isinstance(room_regions, list) else [],
            "stash": stash if isinstance(stash, dict) else DEFAULT_ROOM_STATE["stash"],
            "chatBubbleThemes": chat_bubble_themes if isinstance(chat_bubble_themes, dict) else DEFAULT_ROOM_STATE["chatBubbleThemes"],
        },
        "tilemap": {
            "floorText": raw.get(GAME_STATE_KEYS["floor"], ""),
            "wallText": raw.get(GAME_STATE_KEYS["wall"], ""),
            "furnitureText": raw.get(GAME_STATE_KEYS["furniture"], ""),
            "propText": raw.get(GAME_STATE_KEYS["prop"], ""),
        },
        "movementOverrides": movement_overrides if isinstance(movement_overrides, dict) else {"agents": {}},
        "raw": raw,
    }


def load_world_layout() -> Dict[str, Any]:
    return parse_world_game_state()["layout"]


def save_world_layout(payload: Dict[str, Any]) -> Dict[str, Any]:
    parsed = parse_world_game_state()
    layout = parsed["layout"]
    layout.update(payload)
    save_world_game_state(
        {
            GAME_STATE_KEYS["layout_config"]: {
                key: value
                for key, value in layout.items()
                if key not in {"roomRegions", "stash", "chatBubbleThemes"}
            },
            GAME_STATE_KEYS["room_regions"]: layout.get("roomRegions", []),
            GAME_STATE_KEYS["stash"]: layout.get("stash", DEFAULT_ROOM_STATE["stash"]),
            GAME_STATE_KEYS["chat_bubble"]: layout.get("chatBubbleThemes", DEFAULT_ROOM_STATE["chatBubbleThemes"]),
        }
    )
    return parse_world_game_state()["layout"]


def load_world_tilemap() -> Dict[str, str]:
    return parse_world_game_state()["tilemap"]


def save_world_tilemap(payload: Dict[str, Any]) -> Dict[str, str]:
    save_world_game_state(
        {
            GAME_STATE_KEYS["floor"]: payload.get("floorText", ""),
            GAME_STATE_KEYS["wall"]: payload.get("wallText", ""),
            GAME_STATE_KEYS["furniture"]: payload.get("furnitureText", ""),
            GAME_STATE_KEYS["prop"]: payload.get("propText", ""),
        }
    )
    return parse_world_game_state()["tilemap"]


def load_movement_overrides() -> Dict[str, Any]:
    parsed = parse_world_game_state()
    payload = parsed.get("movementOverrides", {"agents": {}})
    agents = payload.get("agents")
    if not isinstance(agents, dict):
        payload["agents"] = {}
    return payload


def get_agent_movement_override(agent_id: str) -> Dict[str, Any] | None:
    payload = load_movement_overrides()
    override = payload.get("agents", {}).get(agent_id)
    return override if isinstance(override, dict) else None


def set_agent_movement_override(agent_id: str, anchor_id: str, source: str = "ui") -> Dict[str, Any]:
    agent = get_agent(agent_id)
    accepted_at = _utc_now()
    if agent is None:
        return {
            "ok": False,
            "status": "rejected",
            "reason": "unknown_agent",
            "agentId": agent_id,
            "acceptedAt": accepted_at,
        }

    layout = load_world_layout()
    anchors = layout.get("anchors", {})
    if anchor_id not in anchors:
        return {
            "ok": False,
            "status": "rejected",
            "reason": "unknown_anchor",
            "agentId": agent_id,
            "anchorId": anchor_id,
            "acceptedAt": accepted_at,
        }

    payload = load_movement_overrides()
    payload.setdefault("agents", {})[agent_id] = {
        "anchorId": anchor_id,
        "source": source,
        "updatedAt": accepted_at,
    }
    save_world_game_state({GAME_STATE_KEYS["movement_overrides"]: payload})
    return {
        "ok": True,
        "status": "accepted",
        "agentId": agent_id,
        "anchorId": anchor_id,
        "acceptedAt": accepted_at,
    }
