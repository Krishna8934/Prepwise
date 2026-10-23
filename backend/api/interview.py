import uuid
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Path
try:
    from backend.models.schemas import (
        InterviewCreateRequest,
        InterviewSessionState,
        NextQuestionResponse,
        AnswerSubmitRequest,
        TurnRecord,
        InterviewReport,
        RetryAnswerRequest,
        RetryAnswerResponse,
        InterviewHistoryResponse,
        InterviewHistoryItem,
    )
    from backend.services.interview_engine import (
        generate_first_question,
        generate_next_question,
        COMPANY_PREPARATION_PLANS,
        get_company_plan
    )
    from backend.services.evaluation_service import evaluate_answer, generate_final_report
    from backend.api.session_store import sessions_db, reports_db, get_history_list, HISTORY_FILE
except ImportError:
    from models.schemas import (
        InterviewCreateRequest,
        InterviewSessionState,
        NextQuestionResponse,
        AnswerSubmitRequest,
        TurnRecord,
        InterviewReport,
        RetryAnswerRequest,
        RetryAnswerResponse,
        InterviewHistoryResponse,
        InterviewHistoryItem,
    )
    from services.interview_engine import (
        generate_first_question,
        generate_next_question,
        COMPANY_PREPARATION_PLANS,
        get_company_plan
    )
    from services.evaluation_service import evaluate_answer, generate_final_report
    from api.session_store import sessions_db, reports_db, get_history_list, HISTORY_FILE

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview", tags=["Interview"])

@router.get("/company-plans")
async def get_all_company_plans():
    """Retrieve full company preparation plans for all supported hiring tracks."""
    return COMPANY_PREPARATION_PLANS

@router.get("/company-plans/{company_name}")
async def get_single_company_plan(company_name: str = Path(...)):
    """Retrieve preparation plan for a specific company."""
    return get_company_plan(company_name)

@router.post("/create", response_model=NextQuestionResponse)
async def create_interview(payload: InterviewCreateRequest):
    """Create a new mock interview session and return the first question."""
    session_id = str(uuid.uuid4())
    target_company = payload.target_company or "General"
    
    first_question = generate_first_question(
        profile=payload.candidate_profile,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        target_company=target_company
    )
    
    session_state = InterviewSessionState(
        session_id=session_id,
        candidate_profile=payload.candidate_profile,
        resume_text=payload.resume_text or "",
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        total_questions=payload.total_questions,
        current_question_index=1,
        target_company=target_company,
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
        message=f"{target_company} mock interview session created. First question ready."
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
    
    # Internal evaluation with communication metrics
    evaluation = evaluate_answer(
        question=current_turn.question,
        answer_text=payload.answer_text,
        profile=session.candidate_profile,
        difficulty=session.difficulty,
        is_retry=payload.is_retry,
        previous_communication_score=payload.previous_score
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

@router.post("/{session_id}/retry-answer", response_model=RetryAnswerResponse)
async def retry_answer(session_id: str, payload: RetryAnswerRequest):
    """Drill Mode: Re-evaluate answer for the current question without advancing to the next question."""
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found or expired.")

    if not session.turns:
        raise HTTPException(status_code=400, detail="No active question found in session.")

    current_turn = session.turns[-1]
    prev_eval = current_turn.evaluation
    prev_score = payload.previous_score or (prev_eval.communication_score if prev_eval else 7)

    # Save previous attempt to turn's retry history
    current_turn.retry_history.append({
        "answer": current_turn.answer,
        "evaluation": prev_eval.model_dump() if prev_eval else None
    })

    # Evaluate retried answer
    new_evaluation = evaluate_answer(
        question=current_turn.question,
        answer_text=payload.answer_text,
        profile=session.candidate_profile,
        difficulty=session.difficulty,
        is_retry=True,
        previous_communication_score=prev_score
    )

    current_turn.answer = payload.answer_text.strip()
    current_turn.evaluation = new_evaluation

    diff = new_evaluation.communication_score - prev_score
    improved = diff > 0

    return RetryAnswerResponse(
        session_id=session_id,
        evaluation=new_evaluation,
        improved=improved,
        improvement_points=diff,
        message=f"Answer retried! Communication score: {prev_score}/10 → {new_evaluation.communication_score}/10"
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

@router.get("/history", response_model=InterviewHistoryResponse)
async def get_interview_history():
    """Retrieve full candidate interview history, improvement trend, and recurring weak topics."""
    raw_history = get_history_list()
    history_items = [InterviewHistoryItem(**item) for item in raw_history]

    last_score = None
    current_score = None
    improvement_trend = None

    if len(history_items) >= 2:
        last_score = history_items[-2].overall_score
        current_score = history_items[-1].overall_score
        improvement_trend = current_score - last_score
    elif len(history_items) == 1:
        current_score = history_items[0].overall_score

    # Compute recurring weak topics across all interviews
    topic_counts: Dict[str, int] = {}
    for item in history_items:
        for topic in item.weak_topics:
            topic_counts[topic] = topic_counts.get(topic, 0) + 1

    recurring = sorted(topic_counts.keys(), key=lambda t: topic_counts[t], reverse=True)[:5]

    return InterviewHistoryResponse(
        history=history_items,
        last_score=last_score,
        current_score=current_score,
        improvement_trend=improvement_trend,
        recurring_weak_topics=recurring
    )

@router.post("/history/clear")
async def clear_interview_history():
    """Clear all saved interview history."""
    import json
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
        return {"success": True, "message": "Interview history cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

