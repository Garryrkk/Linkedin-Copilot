from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.config import settings
from db.session import init_db
from api.routes import posts, comments, users, voice
import structlog

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("engageiq_api_starting", version=settings.APP_VERSION)
    await init_db()
    logger.info("database_ready")
    yield
    # Shutdown
    logger.info("engageiq_api_shutting_down")


app = FastAPI(
    title="EngageIQ API",
    version=settings.APP_VERSION,
    description="Personal Brand Engagement Intelligence System",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/")
async def root():
    return {"message": "EngageIQ API", "docs": "/docs"}