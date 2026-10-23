import os
import logging
from fastapi import FastAPI, HTTPException, Body
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
        "model": "llama-3.3-70b-versatile" if groq_service.is_configured() else "fallback-heuristic"
    }

@app.post("/api/config/groq-key")
async def update_groq_key(payload: dict = Body(...)):
    """Allow runtime configuration of Groq API Key."""
    key = payload.get("api_key", "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    groq_service.set_api_key(key)
    return {
        "success": True,
        "message": "Groq API key updated successfully.",
        "groq_configured": groq_service.is_configured()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
