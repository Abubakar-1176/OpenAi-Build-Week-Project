import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.config import settings

# Separate test database so we never touch dev data
TEST_DATABASE_URL = settings.DATABASE_URL.rsplit("/", 1)[0] + "/locallink_test_db"

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    session = TestingSessionLocal()
    yield session
    session.close()
    # Truncate everything between tests - simpler and safer than rollback
    # isolation, since the service layer commits internally.
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(text(f'TRUNCATE TABLE "{table.name}" RESTART IDENTITY CASCADE'))


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# --- shared helper fixtures -------------------------------------------------

def _register_and_login(client, name, email, password, role):
    client.post(
        "/auth/register",
        json={"name": name, "email": email, "password": password, "role": role},
    )
    resp = client.post("/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


@pytest.fixture()
def customer_token(client):
    return _register_and_login(client, "Test Customer", "customer@test.com", "testpass123", "CUSTOMER")


@pytest.fixture()
def provider_token(client):
    return _register_and_login(client, "Test Provider", "provider@test.com", "testpass123", "PROVIDER")


@pytest.fixture()
def admin_token(client):
    return _register_and_login(client, "Test Admin", "admin@test.com", "testpass123", "ADMIN")


@pytest.fixture()
def category_id(db_session):
    from app.models.category import Category
    category = Category(name="Electrician")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category.id


@pytest.fixture()
def provider_profile(client, provider_token, category_id):
    resp = client.post(
        "/providers/profile",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"category_id": category_id, "description": "Test provider", "hourly_rate": 1000},
    )
    return resp.json()
