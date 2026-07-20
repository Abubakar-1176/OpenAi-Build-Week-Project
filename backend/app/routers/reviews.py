from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.review_schema import ReviewCreate, ReviewOut
from app.services import review_service

router = APIRouter(tags=["reviews"])


@router.post("/reviews", response_model=ReviewOut, status_code=201)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return review_service.create_review(db, current_user, data)


@router.get("/providers/{provider_id}/reviews", response_model=List[ReviewOut])
def get_provider_reviews(provider_id: int, db: Session = Depends(get_db)):
    return review_service.get_provider_reviews(db, provider_id)
