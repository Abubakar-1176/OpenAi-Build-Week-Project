from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user_schema import UserRegister, UserLogin, UserOut, Token
from app.services.auth_service import register_user, authenticate_user
from app.utils.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    user = register_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return Token(access_token=access_token, user_role=user.role)


@router.post("/logout")
def logout():
    # Stateless JWT - logout is handled client-side by discarding the token.
    # Present as a real endpoint so the frontend has a consistent call to make.
    return {"message": "Logged out successfully"}
