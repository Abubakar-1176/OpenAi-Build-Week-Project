from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.utils.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user


def require_role(*allowed_roles: UserRole):
    """Factory for role-scoped dependencies, e.g. Depends(require_role(UserRole.ADMIN))."""

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission",
            )
        return current_user

    return role_checker


def get_current_customer(current_user: User = Depends(require_role(UserRole.CUSTOMER))) -> User:
    return current_user


def get_current_provider(current_user: User = Depends(require_role(UserRole.PROVIDER))) -> User:
    return current_user


def get_current_admin(current_user: User = Depends(require_role(UserRole.ADMIN))) -> User:
    return current_user
