"""`POST /speech` — one piece of text, one voice, MP3 back (spec 008).

The browser holds no Azure credential, so synthesis happens here. Nothing about the agent passes
through: this endpoint reads text aloud and knows nothing about turns, tools or conversations.

`def`, not `async def`: synthesis is a blocking `httpx.post`, and a spoken answer calls this
once per sentence *while* the answer is streaming — the worst possible moment to own the loop.
"""

from __future__ import annotations

import logging
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from harness._shared.errors import client_message
from pydantic import BaseModel, Field

router = APIRouter()
_log = logging.getLogger(__name__)


class SpeechRequest(BaseModel):
    """What to say, and in which of the two languages the app ships (§7)."""

    text: str = Field(min_length=1, max_length=4000)
    lang: Literal["en", "pt"]


@router.post("/speech")
def speech(body: SpeechRequest, request: Request) -> Response:
    synthesize = request.app.state.synthesize
    if synthesize is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "speech is not configured on this server: set SPEECH_ENDPOINT and "
                "SPEECH_RESOURCE_ID. See .env.example."
            ),
        )

    settings = request.app.state.settings
    try:
        audio = synthesize(body.text, settings.voice_for(body.lang))
    except httpx.HTTPError as exc:
        # A missing `Cognitive Services Speech User` role is the likeliest first-run failure: a
        # configuration fact the browser can name, not a crash. The detail goes to the log.
        client_message(exc, _log, "speech synthesis failed upstream")
        raise HTTPException(status_code=502, detail="speech_upstream_failed") from None
    return Response(content=audio, media_type="audio/mpeg")
