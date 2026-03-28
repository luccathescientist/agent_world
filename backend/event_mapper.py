"""Produce recent semantic Agent World events."""

from __future__ import annotations

from typing import Dict, List

from .state_mapper import derive_agent_world_events


def get_agent_world_events() -> Dict[str, List[dict]]:
    return derive_agent_world_events()


__all__ = ["derive_agent_world_events", "get_agent_world_events"]
