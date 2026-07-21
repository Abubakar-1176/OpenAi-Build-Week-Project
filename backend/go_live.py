"""One-shot bring-up: verify DB reachable, run migrations, seed data.

Run AFTER PostgreSQL is installed and running:
    venv\\Scripts\\activate
    python go_live.py
Then start the server:
    uvicorn app.main:app --reload --port 8000
"""
import subprocess
import sys
from urllib.parse import urlsplit

from sqlalchemy import create_engine, text

from app.config import settings


def ensure_database() -> bool:
    """Create the target database if it doesn't exist yet.

    Connects to the server's default 'postgres' maintenance database first,
    since the target DB won't exist on a fresh PostgreSQL install.
    """
    parts = urlsplit(settings.DATABASE_URL)
    db_name = parts.path.lstrip("/")
    admin_url = settings.DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
    try:
        # AUTOCOMMIT: CREATE DATABASE cannot run inside a transaction block.
        engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
        with engine.connect() as conn:
            exists = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": db_name}
            ).scalar()
            if exists:
                print(f"[ok] Database '{db_name}' already exists")
            else:
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                print(f"[ok] Created database '{db_name}'")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[fail] Could not create/verify database: {exc}")
        return False


def check_db() -> bool:
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[ok] Connected to {settings.DATABASE_URL}")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[fail] Cannot connect to database: {exc}")
        return False


def run(label: str, *args: str) -> None:
    print(f"\n=== {label} ===")
    result = subprocess.run(args)
    if result.returncode != 0:
        print(f"[fail] {label} exited with {result.returncode}")
        sys.exit(result.returncode)


if __name__ == "__main__":
    if not ensure_database():
        sys.exit(1)
    if not check_db():
        sys.exit(1)
    run("alembic upgrade head", "alembic", "upgrade", "head")
    run("seed categories", sys.executable, "-m", "app.seed_categories")
    run("seed admin", sys.executable, "-m", "app.seed_admin")
    print("\n[done] Database ready. Start the server with:")
    print("    uvicorn app.main:app --reload --port 8000")
