from sqlalchemy.orm import Session

from app.models.notification import Notification


def notify(db: Session, user_id: int, title: str, message: str) -> Notification:
    notification = Notification(user_id=user_id, title=title, message=message)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
