import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import get_settings
from app.api import router as api_router

# Configure structured application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("ai_service")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager:
    Executes startup health validations and resource teardown on shutdown.
    """
    logger.info("Initializing Hackathon AI Service...")
    logger.info(f"Target Host & Port: {settings.HOST}:{settings.PORT}")
    logger.info(f"LLM Model configured: {settings.GEMINI_MODEL}")
    logger.info(f"Embedding Model configured: {settings.EMBEDDING_MODEL}")
    logger.info(f"Allowed CORS Origins: {settings.ALLOWED_ORIGINS}")
    
    # Startup check for required API credentials
    if not settings.GEMINI_API_KEY:
        logger.critical("FATAL: GEMINI_API_KEY is not set in environment or .env file!")
    else:
        logger.info("Gemini credentials verified.")
        
    yield
    
    logger.info("Shutting down Hackathon AI Service...")


app = FastAPI(
    title="Hackathon AI Service",
    description="AI engine powering resume parsing, hybrid hackathon ranking, and custom project pitching.",
    version="1.0.0",
    lifespan=lifespan,
)

# --------------------------------------------------------------------------
# Cross-Origin Resource Sharing (CORS)
# --------------------------------------------------------------------------
# Restricts access to your configured React frontends and Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# Router Registration
# --------------------------------------------------------------------------
# Mounts all endpoints under the /api prefix:
# - POST /api/parse-resume
# - POST /api/embed-hackathon
# - POST /api/match-hackathons
# - POST /api/generate-pitch
# - GET  /api/health
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["System"])
def root():
    """Root status ping with link to Swagger documentation."""
    return {
        "status": "online",
        "service": "Hackathon AI Engine",
        "docs_url": "/docs",
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )