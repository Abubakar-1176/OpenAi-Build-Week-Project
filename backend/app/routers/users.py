from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user_schema import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
def update_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if updates.name is not None:
        current_user.name = updates.name
    if updates.phone is not None:
        current_user.phone = updates.phone
    db.commit()
    db.refresh(current_user)
    return current_user
