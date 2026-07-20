from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.chatbot_service import get_chat_response

router = APIRouter(tags=["chatbot"])


@router.post("/chat", response_model=ChatResponse)
def chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    answer = get_chat_response(db, current_user.id, data.message)
    return ChatResponse(answer=answer)
