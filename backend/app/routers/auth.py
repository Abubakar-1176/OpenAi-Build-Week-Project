from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user_schema import UserRegister, UserLogin, UserOut, Token
from app.services.auth_service import register_user, authenticate_user
from app.utils.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_token(user) -> Token:
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return Token(access_token=access_token, user_role=user.role)


@router.post("/register", response_model=UserOut, status_code=201)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    user = register_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """JSON login used by the frontend."""
    user = authenticate_user(db, credentials.email, credentials.password)
    return _issue_token(user)


@router.post("/token", response_model=Token)
def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """OAuth2 password-flow login (form-encoded).

    This powers the Swagger "Authorize" button so protected endpoints can be
    tested from /docs. Use your email as the username. The frontend uses
    /auth/login (JSON) instead.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    return _issue_token(user)


@router.post("/logout")
def logout():
    # Stateless JWT - logout is handled client-side by discarding the token.
    # Present as a real endpoint so the frontend has a consistent call to make.
    return {"message": "Logged out successfully"}
