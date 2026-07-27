from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (ensures all models are registered on Base.metadata)
from app.routers import auth, users, categories, providers, bookings, reviews, availability, notifications, chatbot, admin

app = FastAPI(
    title="Servio API",
    description="Local service marketplace connecting customers with verified local providers.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(providers.router)
app.include_router(bookings.router)
app.include_router(reviews.router)
app.include_router(availability.router)
app.include_router(notifications.router)
app.include_router(chatbot.router)
app.include_router(admin.router)


@app.get("/health", tags=["health"])
def health_check():
    """Basic liveness check - confirms the API process is up."""
    return {"status": "ok", "service": "Servio API"}


@app.get("/", tags=["health"])
def root():
    return {"message": "Servio API is running. See /docs for API documentation."}
