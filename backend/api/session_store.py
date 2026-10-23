from typing import Dict, List, Optional
import json
import logging
from pathlib import Path
try:
    from backend.models.schemas import InterviewSessionState, InterviewReport, InterviewHistoryItem
except ImportError:
    from models.schemas import InterviewSessionState, InterviewReport, InterviewHistoryItem

logger = logging.getLogger(__name__)

# In-memory session and report cache for active mock interviews
sessions_db: Dict[str, InterviewSessionState] = {}
reports_db: Dict[str, InterviewReport] = {}

HISTORY_FILE = Path(__file__).resolve().parent.parent / "temp" / "interview_history.json"

def _ensure_history_dir():
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump([], f)
        except Exception as e:
            logger.warning(f"Failed to initialize history file: {e}")

_ensure_history_dir()

def save_report_to_history(report: InterviewReport):
    """Persist a completed interview report to history."""
    try:
        _ensure_history_dir()
        existing = []
        if HISTORY_FILE.exists():
            try:
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            except Exception:
                existing = []

        # Extract weak topics from recommended_topics
        weak_topics = [r.topic for r in report.recommended_topics] if report.recommended_topics else []

        history_entry = {
            "session_id": report.session_id,
            "candidate_name": report.candidate_name,
            "target_company": getattr(report, "target_company", "General") or "General",
            "interview_type": report.interview_type,
            "difficulty": report.difficulty,
            "overall_score": report.overall_score,
            "readiness_verdict": report.readiness_verdict,
            "completed_at": report.completed_at,
            "total_questions": report.total_questions_answered,
            "weak_topics": weak_topics
        }

        # Avoid duplicates for same session_id
        existing = [item for item in existing if item.get("session_id") != report.session_id]
        existing.append(history_entry)

        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not persist interview report to history: {e}")

def get_history_list() -> List[Dict]:
    """Retrieve full history list from storage."""
    try:
        _ensure_history_dir()
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning(f"Could not load interview history: {e}")
    return []

