from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User, UserRole
from app.models.provider import Provider
from app.models.booking import Booking
from app.models.review import Review

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
def dashboard_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    return {
        "total_users": db.query(User).count(),
        "total_customers": db.query(User).filter(User.role == UserRole.CUSTOMER).count(),
        "total_providers": db.query(User).filter(User.role == UserRole.PROVIDER).count(),
        "verified_providers": db.query(Provider).filter(Provider.verified.is_(True)).count(),
        "unverified_providers": db.query(Provider).filter(Provider.verified.is_(False)).count(),
        "total_bookings": db.query(Booking).count(),
        "total_reviews": db.query(Review).count(),
    }
