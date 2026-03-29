"""Agent World voice gateway helpers backed by OpenClaw runtime."""

from __future__ import annotations

import base64
import json
import mimetypes
import os
from pathlib import Path
import subprocess
import tempfile
from typing import Any, Dict, Optional

from .settings import get_openclaw_workspace


VOICE_BRIDGE_PATH = Path(__file__).resolve().parents[1] / "tools" / "openclaw_voice_bridge.mjs"
DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe"
DEFAULT_TTS_MODEL = "gpt-4o-mini-tts"
DEFAULT_TTS_VOICE = "nova"


def _bridge_payload(payload: Dict[str, Any], timeout: float = 120.0) -> Dict[str, Any]:
    openclaw_workspace = get_openclaw_workspace()
    openclaw_tsx_loader = (
        openclaw_workspace / "node_modules" / "tsx" / "dist" / "loader.mjs"
        if openclaw_workspace
        else None
    )
    if not openclaw_workspace:
        return {
            "ok": False,
            "reason": "openclaw_workspace_not_configured",
            "detail": "Set OPENCLAW_WORKSPACE to an OpenClaw checkout before using voice features.",
        }
    if not openclaw_tsx_loader or not openclaw_tsx_loader.exists():
        return {
            "ok": False,
            "reason": "openclaw_tsx_loader_missing",
            "detail": f"Expected tsx loader at {openclaw_tsx_loader}",
        }
    proc = subprocess.run(
        [
            "node",
            "--import",
            str(openclaw_tsx_loader),
            str(VOICE_BRIDGE_PATH),
        ],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        cwd=str(openclaw_workspace),
        timeout=timeout,
    )
    stdout = (proc.stdout or "").strip()
    stderr = (proc.stderr or "").strip()
    if not stdout:
        return {
            "ok": False,
            "reason": "openclaw_voice_bridge_no_output",
            "detail": stderr[:1000],
        }
    try:
        result = json.loads(stdout.splitlines()[-1])
    except Exception:
        return {
            "ok": False,
            "reason": "openclaw_voice_bridge_invalid_output",
            "detail": stdout[:1000] or stderr[:1000],
        }
    if not result.get("ok"):
        return {
            "ok": False,
            "reason": result.get("error") or result.get("reason") or "openclaw_voice_bridge_failed",
            "detail": stderr[:1000] if stderr else None,
        }
    return result


def voice_config_payload() -> Dict[str, Any]:
    result = _bridge_payload({"action": "status"}, timeout=30.0)
    if not result.get("ok"):
        return {
            "ok": True,
            "provider": "openclaw",
            "configured": False,
            "transcribeModel": DEFAULT_TRANSCRIBE_MODEL,
            "speechModel": DEFAULT_TTS_MODEL,
            "voices": ["nova"],
            "defaultVoice": DEFAULT_TTS_VOICE,
            "speechFormat": "mp3",
            "detail": result.get("reason"),
        }
    return result


def transcribe_audio_bytes(
    audio_bytes: bytes,
    filename: str,
    *,
    content_type: str = "application/octet-stream",
    model: str = DEFAULT_TRANSCRIBE_MODEL,
    language: Optional[str] = None,
    prompt: Optional[str] = None,
    timeout: float = 120.0,
) -> Dict[str, Any]:
    if not audio_bytes:
        return {"ok": False, "reason": "empty_audio"}

    suffix = Path(filename or "voice.webm").suffix or mimetypes.guess_extension(content_type or "") or ".webm"
    with tempfile.NamedTemporaryFile(prefix="agent-world-voice-", suffix=suffix, delete=False) as handle:
        handle.write(audio_bytes)
        temp_path = handle.name

    try:
        result = _bridge_payload(
            {
                "action": "transcribe",
                "filePath": temp_path,
                "mimeType": content_type,
                "model": model,
                "language": language,
                "prompt": prompt,
            },
            timeout=timeout,
        )
        if not result.get("ok"):
            return result
        return {
            "ok": True,
            "provider": "openclaw",
            "upstreamProvider": result.get("upstreamProvider"),
            "model": result.get("model") or model,
            "text": str(result.get("text") or "").strip(),
        }
    finally:
        try:
            os.unlink(temp_path)
        except OSError:
            pass


def synthesize_speech_bytes(
    text: str,
    *,
    model: str = DEFAULT_TTS_MODEL,
    voice: str = DEFAULT_TTS_VOICE,
    response_format: str = "mp3",
    timeout: float = 120.0,
) -> Dict[str, Any]:
    spoken = str(text or "").strip()
    if not spoken:
        return {"ok": False, "reason": "empty_text"}

    result = _bridge_payload(
        {
            "action": "speech",
            "text": spoken,
            "model": model,
            "voice": voice,
            "format": response_format,
        },
        timeout=timeout,
    )
    if not result.get("ok"):
        return result
    audio_b64 = str(result.get("audioBase64") or "").strip()
    if not audio_b64:
        return {"ok": False, "reason": "missing_audio_data"}
    try:
        audio = base64.b64decode(audio_b64)
    except Exception:
        return {"ok": False, "reason": "invalid_audio_data"}
    output_format = str(result.get("outputFormat") or response_format or "mp3").strip().lower()
    mime_type = {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "opus": "audio/ogg",
        "ogg": "audio/ogg",
    }.get(output_format, f"audio/{output_format}")
    return {
        "ok": True,
        "provider": "openclaw",
        "upstreamProvider": result.get("upstreamProvider"),
        "model": result.get("model") or model,
        "voice": result.get("voice") or voice,
        "format": output_format,
        "audio": audio,
        "mimeType": mime_type,
    }
