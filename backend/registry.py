"""Registry for visible core named agents in Agent World.

Single-agent first, multi-agent ready.
"""

from __future__ import annotations

from dataclasses import dataclass
import json
from typing import List, Optional

from .settings import get_openclaw_home


@dataclass(frozen=True)
class CoreAgent:
    id: str
    name: str
    session_agent_id: str
    session_label: str
    sprite_seed: str = "default"
    enabled: bool = True
    description: Optional[str] = None


def _load_agent_config() -> List[dict]:
    openclaw_config_path = get_openclaw_home() / "openclaw.json"
    if not openclaw_config_path.exists():
        return []
    try:
        payload = json.loads(openclaw_config_path.read_text())
    except Exception:
        return []
    entries = payload.get("agents", {}).get("list", [])
    return entries if isinstance(entries, list) else []


def _core_agent_from_config(entry: dict) -> Optional[CoreAgent]:
    if not isinstance(entry, dict):
        return None
    agent_id = str(entry.get("id") or "").strip()
    if not agent_id:
        return None
    if agent_id == "main":
        return CoreAgent(
            id="lucca-main",
            name="Lucca",
            session_agent_id="main",
            session_label="main",
            sprite_seed="lucca-default",
            description="Primary named agent in the main environment.",
        )
    if agent_id.startswith("bench-"):
        return CoreAgent(
            id=agent_id,
            name=str(entry.get("name") or agent_id),
            session_agent_id=agent_id,
            session_label="main",
            sprite_seed="robo-default",
            description=f"Benchmark worker for {entry.get('model') or agent_id}.",
        )
    return None


def _load_core_agents() -> List[CoreAgent]:
    agents: List[CoreAgent] = []
    for entry in _load_agent_config():
        agent = _core_agent_from_config(entry)
        if agent:
            agents.append(agent)
    if agents:
        return agents
    return [
        CoreAgent(
            id="lucca-main",
            name="Lucca",
            session_agent_id="main",
            session_label="main",
            sprite_seed="lucca-default",
            description="Primary named agent in the main environment.",
        )
    ]


def get_visible_agents() -> List[CoreAgent]:
    return [agent for agent in _load_core_agents() if agent.enabled]


def get_agent(agent_id: str) -> Optional[CoreAgent]:
    for agent in _load_core_agents():
        if agent.id == agent_id:
            return agent
    return None
