import os
import logging
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("prepwise")

import sys
from pathlib import Path

# Ensure both backend/ and root directories are in sys.path
_current_dir = Path(__file__).resolve().parent
_parent_dir = _current_dir.parent
for _p in [str(_current_dir), str(_parent_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Import routers with fallback
try:
    from backend.api.resume import router as resume_router
    from backend.api.interview import router as interview_router
    from backend.api.report import router as report_router
    from backend.services.groq_service import groq_service
except ImportError:
    from api.resume import router as resume_router
    from api.interview import router as interview_router
    from api.report import router as report_router
    from services.groq_service import groq_service

app = FastAPI(
    title="Prepwise API",
    description="Backend service for Prepwise — AI Mock Interviewer platform.",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def extract_groq_key_from_header(request: Request, call_next):
    header_key = request.headers.get("x-groq-api-key", "").strip()
    if header_key and header_key != groq_service.api_key:
        try:
            groq_service.validate_and_set_api_key(header_key, persist_to_env=True)
        except Exception as e:
            logger.warning(f"Could not auto-activate Groq key from request header: {e}")
    return await call_next(request)

# Register routers
app.include_router(resume_router)
app.include_router(interview_router)
app.include_router(report_router)


@app.get("/")
async def root():
    return {
        "app": "Prepwise — AI Mock Interviewer",
        "status": "online",
        "groq_configured": groq_service.is_configured(),
        "tagline": "Practice smarter. Interview better."
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "groq_connected": groq_service.is_configured(),
        "model": groq_service.primary_model if groq_service.is_configured() else "disconnected"
    }

@app.post("/api/config/groq-key")
async def update_groq_key(payload: dict = Body(...)):
    """Allow runtime configuration and verification of Groq API Key."""
    key = payload.get("api_key", "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    try:
        result = groq_service.validate_and_set_api_key(key, persist_to_env=True)
        return {
            "success": True,
            "message": result.get("message", "Groq API key updated successfully."),
            "groq_configured": True,
            "model": result.get("model")
        }
    except Exception as e:
        logger.error(f"Failed to update Groq API key: {e}")
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
