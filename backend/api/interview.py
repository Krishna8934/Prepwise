import uuid
import logging
from fastapi import APIRouter, HTTPException, Path
try:
    from backend.models.schemas import (
        InterviewCreateRequest,
        InterviewSessionState,
        NextQuestionResponse,
        AnswerSubmitRequest,
        TurnRecord,
        InterviewReport,
    )
    from backend.services.interview_engine import generate_first_question, generate_next_question
    from backend.services.evaluation_service import evaluate_answer, generate_final_report
    from backend.api.session_store import sessions_db, reports_db
except ImportError:
    from models.schemas import (
        InterviewCreateRequest,
        InterviewSessionState,
        NextQuestionResponse,
        AnswerSubmitRequest,
        TurnRecord,
        InterviewReport,
    )
    from services.interview_engine import generate_first_question, generate_next_question
    from services.evaluation_service import evaluate_answer, generate_final_report
    from api.session_store import sessions_db, reports_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview", tags=["Interview"])

@router.post("/create", response_model=NextQuestionResponse)
async def create_interview(payload: InterviewCreateRequest):
    """Create a new mock interview session and return the first question."""
    session_id = str(uuid.uuid4())
    
    first_question = generate_first_question(
        profile=payload.candidate_profile,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty
    )
    
    session_state = InterviewSessionState(
        session_id=session_id,
        candidate_profile=payload.candidate_profile,
        resume_text=payload.resume_text or "",
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        total_questions=payload.total_questions,
        current_question_index=1,
        status="in_progress",
        turns=[TurnRecord(question=first_question)],
        topics_covered=[first_question.topic],
        current_question=first_question,
    )
    
    sessions_db[session_id] = session_state
    
    return NextQuestionResponse(
        session_id=session_id,
        current_question_index=1,
        total_questions=payload.total_questions,
        question=first_question,
        is_completed=False,
        message="Interview session created. First question ready."
    )

@router.get("/{session_id}/status", response_model=InterviewSessionState)
async def get_interview_status(session_id: str = Path(...)):
    """Retrieve the current state of the interview session."""
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found or expired.")
    return session

@router.post("/{session_id}/answer", response_model=NextQuestionResponse)
async def submit_answer(session_id: str, payload: AnswerSubmitRequest):
    """Submit candidate's answer for the current question and get the next question or completion signal."""
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found or expired.")
        
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Interview is already completed.")

    if not session.turns:
        raise HTTPException(status_code=400, detail="No active question found in session.")

    current_turn = session.turns[-1]
    current_turn.answer = payload.answer_text.strip()
    
    # Internal evaluation
    evaluation = evaluate_answer(
        question=current_turn.question,
        answer_text=payload.answer_text,
        profile=session.candidate_profile,
        difficulty=session.difficulty
    )
    current_turn.evaluation = evaluation

    # Check if target total questions reached
    if len(session.turns) >= session.total_questions:
        session.status = "completed"
        # Pre-generate final report
        report = generate_final_report(session)
        reports_db[session_id] = report
        
        return NextQuestionResponse(
            session_id=session_id,
            current_question_index=session.current_question_index,
            total_questions=session.total_questions,
            question=current_turn.question,
            is_completed=True,
            previous_evaluation=evaluation,
            message="Interview completed! Generating your comprehensive performance report."
        )

    # Generate next adaptive question
    next_question = generate_next_question(session, latest_evaluation=evaluation)
    session.current_question_index += 1
    session.current_question = next_question
    session.turns.append(TurnRecord(question=next_question))
    if next_question.topic not in session.topics_covered:
        session.topics_covered.append(next_question.topic)

    return NextQuestionResponse(
        session_id=session_id,
        current_question_index=session.current_question_index,
        total_questions=session.total_questions,
        question=next_question,
        is_completed=False,
        previous_evaluation=evaluation,
        message="Answer received. Next question ready."
    )

@router.post("/{session_id}/complete", response_model=InterviewReport)
async def complete_interview(session_id: str = Path(...)):
    """Force complete an interview early and generate report."""
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found or expired.")
        
    session.status = "completed"
    report = generate_final_report(session)
    reports_db[session_id] = report
    return report
