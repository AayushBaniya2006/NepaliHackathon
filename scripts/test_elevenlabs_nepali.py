#!/usr/bin/env python3
"""
Minimal Nepali TTS check against ElevenLabs.

Precise setup that worked with the REST API:
  model_id:  eleven_v3   (ElevenLabs “Eleven v3”)
  language_code: ne      (Nepali; do not use “nep” — API returns validation_error)

Env (NepaliHackathon/.env):
  ELEVEN_LABS_API_KEY or ELEVENLABS_API_KEY
  ELEVENLABS_MODEL_ID=eleven_v3   (optional; this is the default in code)

Optional:
  ELEVENLABS_VOICE_ID  — default EXAVITQu4vr4xnSDxMaL (Sarah; same default as Node /speak)
  TEST_NEPALI_TEXT     — override sample Devanagari sentence
  TEST_TTS_OUT         — output path (default: nepali_tts_test.mp3 in repo root)

  pip install python-dotenv requests
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    print("Install: pip install python-dotenv", file=sys.stderr)
    sys.exit(1)

try:
    import requests
except ImportError:
    print("Install: pip install requests", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")


def resolve_api_key() -> str:
    for name in ("ELEVENLABS_API_KEY", "ELEVEN_LABS_API_KEY"):
        v = (os.getenv(name) or "").strip()
        if v:
            return v
    return ""


def main() -> None:
    api_key = resolve_api_key()
    if not api_key:
        print("Set ELEVENLABS_API_KEY or ELEVEN_LABS_API_KEY in .env", file=sys.stderr)
        sys.exit(1)

    model_id = (os.getenv("ELEVENLABS_MODEL_ID") or "eleven_v3").strip()
    voice_id = (os.getenv("ELEVENLABS_VOICE_ID") or "EXAVITQu4vr4xnSDxMaL").strip()
    # Shorter default uses fewer credits (v3 bills per character).
    text = (os.getenv("TEST_NEPALI_TEXT") or "नमस्ते, यो परीक्षण हो।").strip()
    out_path = Path(os.getenv("TEST_TTS_OUT") or (ROOT / "nepali_tts_test.mp3")).expanduser()

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload: dict = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {"stability": 0.75, "similarity_boost": 0.75},
    }
    # API accepts ISO 639-1 `ne` for Nepali on v3; `nep` is rejected (validation_error).
    if model_id == "eleven_v3":
        payload["language_code"] = "ne"

    r = requests.post(
        url,
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        json=payload,
        timeout=120,
    )
    if not r.ok:
        print(f"HTTP {r.status_code}", file=sys.stderr)
        print(r.text[:800], file=sys.stderr)
        sys.exit(1)

    out_path.write_bytes(r.content)
    print(f"OK → {out_path} ({len(r.content)} bytes)")
    print(f"  model={model_id} voice={voice_id}")


if __name__ == "__main__":
    main()
