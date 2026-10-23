from typing import Dict
from backend.models.schemas import InterviewSessionState, InterviewReport

# In-memory session and report cache for active mock interviews
sessions_db: Dict[str, InterviewSessionState] = {}
reports_db: Dict[str, InterviewReport] = {}
