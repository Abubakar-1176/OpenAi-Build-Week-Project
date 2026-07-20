"""One-off seed script: python -m app.seed_categories"""
from app.database import SessionLocal
from app.models.category import Category

STARTER_CATEGORIES = ["Electrician", "Plumber", "Mechanic", "Tutor", "Cleaner"]


def seed():
    db = SessionLocal()
    try:
        added = []
        for name in STARTER_CATEGORIES:
            if not db.query(Category).filter(Category.name == name).first():
                db.add(Category(name=name))
                added.append(name)
        db.commit()
        print(f"Seeded categories: {added or '(none - already present)'}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
