import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
try:
    from backend.models.schemas import ResumeUploadResponse, CandidateProfile
    from backend.utils.file_utils import validate_pdf_file, extract_text_from_pdf
    from backend.services.resume_parser import parse_resume_with_llm
    from backend.services.groq_service import groq_service
except ImportError:
    from models.schemas import ResumeUploadResponse, CandidateProfile
    from utils.file_utils import validate_pdf_file, extract_text_from_pdf
    from services.resume_parser import parse_resume_with_llm
    from services.groq_service import groq_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume", tags=["Resume"])

class ResumeTextRequest(BaseModel):
    resume_text: str

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    """Upload PDF resume, extract text, and extract structured candidate profile."""
    if not groq_service.is_configured():
        raise HTTPException(
            status_code=403,
            detail="Groq API Key Required: An active Groq API key is required to analyze resumes with real AI. Please provide your key in the top bar or settings."
        )

    validate_pdf_file(file)
    
    try:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")
            
        extracted_text = extract_text_from_pdf(contents)
        candidate_profile = parse_resume_with_llm(extracted_text)
        
        return ResumeUploadResponse(
            success=True,
            candidate_profile=candidate_profile,
            resume_text_preview=extracted_text[:1200] + ("..." if len(extracted_text) > 1200 else ""),
            message="Resume uploaded and analyzed successfully with Groq AI."
        )
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error parsing resume upload: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while analyzing your resume with Groq AI: {str(e)}"
        )

@router.post("/analyze-text", response_model=ResumeUploadResponse)
async def analyze_resume_text(payload: ResumeTextRequest):
    """Analyze provided resume text without uploading a file (e.g. for sample templates)."""
    if not groq_service.is_configured():
        raise HTTPException(
            status_code=403,
            detail="Groq API Key Required: An active Groq API key is required to analyze resumes with real AI. Please provide your key in the top bar or settings."
        )

    text = payload.resume_text.strip()
    if not text or len(text) < 20:
        raise HTTPException(status_code=400, detail="Resume text is too short to analyze.")
        
    try:
        candidate_profile = parse_resume_with_llm(text)
        return ResumeUploadResponse(
            success=True,
            candidate_profile=candidate_profile,
            resume_text_preview=text[:1200] + ("..." if len(text) > 1200 else ""),
            message="Resume analyzed successfully with Groq AI."
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error parsing resume text: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume text with Groq AI: {str(e)}")

