"""Create (or promote) an admin user.

Usage:
    python -m app.seed_admin                      # uses defaults below
    python -m app.seed_admin admin@servio.com "StrongPass123" "Site Admin"

Run this once after migrations so you have an account able to reach
/admin/dashboard and the admin-only category/verification endpoints.
"""
import sys

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.utils.security import hash_password

DEFAULT_EMAIL = "admin@servio.com"
DEFAULT_PASSWORD = "Admin123!"
DEFAULT_NAME = "Servio Admin"


def seed(email: str, password: str, name: str) -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            if user.role != UserRole.ADMIN:
                user.role = UserRole.ADMIN
                db.commit()
                print(f"Promoted existing user {email} to ADMIN.")
            else:
                print(f"Admin {email} already exists - nothing to do.")
            return

        admin = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.commit()
        print(f"Created admin user: {email} (password: {password})")
        print("Log in with these credentials, then change the password.")
    finally:
        db.close()


if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_EMAIL
    password = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_PASSWORD
    name = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_NAME
    seed(email, password, name)
