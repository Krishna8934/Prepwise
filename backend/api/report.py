import logging
from fastapi import APIRouter, HTTPException, Path
try:
    from backend.models.schemas import InterviewReport
    from backend.api.session_store import sessions_db, reports_db
    from backend.services.evaluation_service import generate_final_report
    from backend.services.groq_service import groq_service
except ImportError:
    from models.schemas import InterviewReport
    from api.session_store import sessions_db, reports_db
    from services.evaluation_service import generate_final_report
    from services.groq_service import groq_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview", tags=["Report"])

@router.get("/{session_id}/report", response_model=InterviewReport)
async def get_interview_report(session_id: str = Path(...)):
    """Retrieve the generated performance report for an interview session."""
    if session_id in reports_db:
        return reports_db[session_id]
        
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview report not found. Session may have expired.")

    if not groq_service.is_configured():
        raise HTTPException(
            status_code=403,
            detail="Groq API Key Required: An active Groq API key is required to synthesize the final report."
        )

    # Generate on the fly if not cached
    try:
        report = generate_final_report(session)
        reports_db[session_id] = report
        return report
    except Exception as e:
        logger.error(f"Error generating interview report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

