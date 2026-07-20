import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_chat_history import AIChatHistory

FALLBACK_RESPONSE = (
    "I can't reach the assistant right now. In the meantime: use Search to find "
    "providers by category, open a provider's profile to check availability and "
    "book a slot, or go to My Bookings to view, cancel, or review a booking."
)

SYSTEM_PROMPT = (
    "You are the LocalLink customer support assistant. LocalLink is a local service "
    "marketplace connecting customers with providers (electricians, plumbers, mechanics, "
    "tutors, cleaners). Your only job is to help users understand the platform and guide "
    "them through common actions - searching, booking, cancelling, reviewing. "
    "You cannot create, modify, or cancel bookings yourself - only tell the user how to do "
    "it themselves in the app. Keep answers to 1-3 short sentences."
)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "deepseek/deepseek-r1-0528:free"


def _call_llm(message: str) -> str:
    """Calls the configured LLM API. Raises on any failure - caller handles fallback."""
    if not settings.AI_API_KEY:
        raise RuntimeError("AI_API_KEY not configured")

    response = httpx.post(
        OPENROUTER_API_URL,
        headers={
            "Authorization": f"Bearer {settings.AI_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "LocalLink",
        },
        json={
            "model": OPENROUTER_MODEL,
            "max_tokens": 200,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": message}],
        },
        timeout=10.0,
    )
    response.raise_for_status()
    data = response.json()
    answer = data["choices"][0]["message"]["content"].strip()
   
    if not answer:
        raise RuntimeError("Empty response from LLM")
    return answer


def get_chat_response(db: Session, user_id: int, message: str) -> str:
    try:
        answer = _call_llm(message)
    except (httpx.TimeoutException, httpx.HTTPError, RuntimeError, ValueError):
        answer = FALLBACK_RESPONSE

    db.add(AIChatHistory(user_id=user_id, message=message, response=answer))
    db.commit()

    return answer
