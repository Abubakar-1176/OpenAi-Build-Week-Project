import logging

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_chat_history import AIChatHistory

logger = logging.getLogger("servio.chatbot")

FALLBACK_RESPONSE = (
    "I can't reach the assistant right now. In the meantime: use Search to find "
    "providers by category, open a provider's profile to check availability and "
    "book a slot, or go to My Bookings to view, cancel, or review a booking."
)

SYSTEM_PROMPT = (
    "You are the Servio customer support assistant. Servio is a local service "
    "marketplace connecting customers with providers (electricians, plumbers, mechanics, "
    "tutors, cleaners). Your only job is to help users understand the platform and guide "
    "them through common actions - searching, booking, cancelling, reviewing. "
    "You cannot create, modify, or cancel bookings yourself - only tell the user how to do "
    "it themselves in the app. Keep answers to 1-3 short sentences."
)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def _call_llm(message: str) -> str:
    """Call OpenRouter's OpenAI-compatible chat completions endpoint.

    Raises on any failure - the caller is responsible for falling back.
    """
    api_key = settings.openrouter_key
    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not configured. Add it to backend/.env "
            "(get a key at https://openrouter.ai/keys)."
        )

    response = httpx.post(
        OPENROUTER_API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            # OpenRouter uses these for dashboard attribution; they are optional.
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-Title": settings.OPENROUTER_APP_NAME,
        },
        json={
            "model": settings.OPENROUTER_MODEL,
            "max_tokens": 300,
            # OpenRouter is OpenAI-compatible: the system prompt is a message
            # with role "system", NOT a top-level "system" field (that is the
            # Anthropic-native format and is silently ignored here).
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
        },
        timeout=settings.OPENROUTER_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = response.json()

    # Surface OpenRouter's own error envelope (it can return HTTP 200 with an
    # "error" body for e.g. invalid model or insufficient credits).
    if "error" in data:
        raise RuntimeError(f"OpenRouter error: {data['error']}")

    try:
        answer = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected OpenRouter response shape: {data}") from exc

    if not answer:
        raise RuntimeError("Empty response from LLM")
    return answer


def get_chat_response(db: Session, user_id: int, message: str) -> str:
    try:
        answer = _call_llm(message)
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "OpenRouter returned %s: %s",
            exc.response.status_code,
            exc.response.text[:500],
        )
        answer = FALLBACK_RESPONSE
    except (httpx.TimeoutException, httpx.HTTPError, RuntimeError, ValueError) as exc:
        logger.warning("AI assistant call failed: %s", exc)
        answer = FALLBACK_RESPONSE

    db.add(AIChatHistory(user_id=user_id, message=message, response=answer))
    db.commit()

    return answer
