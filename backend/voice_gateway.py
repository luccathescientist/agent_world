"""Agent World voice helpers backed directly by the configured provider."""

from __future__ import annotations

import mimetypes
from pathlib import Path
import tempfile
from typing import Any, Dict, Optional

from .settings import (
    get_voice_api_key,
    get_voice_api_key_env_name,
    get_voice_openai_version,
    get_voice_provider,
    get_voice_settings,
)


DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe"
DEFAULT_TTS_MODEL = "gpt-4o-mini-tts"
DEFAULT_TTS_VOICE = "nova"


def _openai_client():
    api_key = get_voice_api_key()
    if not api_key:
        return None, {
            "ok": False,
            "reason": "voice_api_key_missing",
            "detail": f"Set the {get_voice_api_key_env_name()} environment variable before using voice features.",
        }
    try:
        from openai import OpenAI
    except Exception as error:
        return None, {
            "ok": False,
            "reason": "openai_package_missing",
            "detail": f"Install the openai Python package to enable voice features: {error}",
        }
    return OpenAI(api_key=api_key), None


def voice_config_payload() -> Dict[str, Any]:
    voice_settings = get_voice_settings()
    provider = get_voice_provider()
    api_key_env = get_voice_api_key_env_name()
    openai_version = get_voice_openai_version()
    configured = bool(provider == "openai" and openai_version and get_voice_api_key())
    detail = None
    if not configured:
        if provider != "openai":
            detail = f"Unsupported voice provider: {provider}"
        elif not openai_version:
            detail = "Install the openai Python package to enable Agent World voice."
        else:
            detail = f"Set the {api_key_env} environment variable to enable Agent World voice."
    return {
        "ok": True,
        "provider": provider,
        "configured": configured,
        "transcribeModel": str(voice_settings.get("transcribeModel") or DEFAULT_TRANSCRIBE_MODEL),
        "speechModel": str(voice_settings.get("speechModel") or DEFAULT_TTS_MODEL),
        "voices": ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"],
        "defaultVoice": str(voice_settings.get("defaultVoice") or DEFAULT_TTS_VOICE),
        "speechFormat": str(voice_settings.get("speechFormat") or "mp3"),
        "apiKeyEnv": api_key_env,
        "sdkVersion": openai_version,
        "detail": detail,
    }


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
    provider = get_voice_provider()
    if provider != "openai":
        return {"ok": False, "reason": "unsupported_voice_provider", "detail": f"Unsupported provider: {provider}"}
    client, error = _openai_client()
    if error:
        return error

    suffix = Path(filename or "voice.webm").suffix or mimetypes.guess_extension(content_type or "") or ".webm"
    with tempfile.NamedTemporaryFile(prefix="agent-world-voice-", suffix=suffix, delete=True) as handle:
        handle.write(audio_bytes)
        handle.flush()
        with open(handle.name, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                file=audio_file,
                model=model,
                language=language or None,
                prompt=prompt or None,
                timeout=timeout,
            )
    text = response if isinstance(response, str) else getattr(response, "text", "")
    return {
        "ok": True,
        "provider": "agent_world",
        "upstreamProvider": "openai",
        "model": model,
        "text": str(text or "").strip(),
    }


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
    provider = get_voice_provider()
    if provider != "openai":
        return {"ok": False, "reason": "unsupported_voice_provider", "detail": f"Unsupported provider: {provider}"}
    client, error = _openai_client()
    if error:
        return error

    response = client.audio.speech.create(
        input=spoken,
        model=model,
        voice=voice,
        response_format=response_format,
        timeout=timeout,
    )
    audio = response.read()
    output_format = str(response_format or "mp3").strip().lower()
    mime_type = {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "opus": "audio/ogg",
        "ogg": "audio/ogg",
        "aac": "audio/aac",
        "flac": "audio/flac",
        "pcm": "audio/L16",
    }.get(output_format, f"audio/{output_format}")
    return {
        "ok": True,
        "provider": "agent_world",
        "upstreamProvider": "openai",
        "model": model,
        "voice": voice,
        "format": output_format,
        "audio": audio,
        "mimeType": mime_type,
    }
