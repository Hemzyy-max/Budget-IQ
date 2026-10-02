from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.api.auth import router as auth_router
from app.api.transactions import router as transactions_router
from app.api.budgets import router as budgets_router
from app.api.recurring import router as recurring_router
from app.api.goals import router as goals_router
from app.api.analytics import router as analytics_router
from app.api.notifications import router as notifications_router
from app.services.demo_seeder import seed_demo_data
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("budget_iq")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    logger.info("Initializing Budget IQ Database tables...")
    try:
        init_db()
        # Seed demo user if database is empty
        db = SessionLocal()
        try:
            user_count = db.query(User).count()
            if user_count == 0:
                logger.info("Empty database detected. Seeding initial demo scenario...")
                seed_demo_data(db, force_reset=False)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error during database startup initialization: {e}")
    yield
    # Shutdown
    logger.info("Budget IQ API shutting down.")

app = FastAPI(
    title="Budget IQ API",
    description="Predictive Personal Finance Intelligence Engine: Track → Understand → Predict → Warn → Improve",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.web\.app|https://.*\.firebaseapp\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(transactions_router, prefix=settings.API_V1_STR)
app.include_router(budgets_router, prefix=settings.API_V1_STR)
app.include_router(recurring_router, prefix=settings.API_V1_STR)
app.include_router(goals_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health Check"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "tagline": "Don't just track your money. Understand where it's going.",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
