import logging
import datetime
import re
from typing import List, Dict, Any, Optional
try:
    from backend.models.schemas import (
        CandidateProfile,
        QuestionItem,
        AnswerEvaluation,
        TurnRecord,
        InterviewReport,
        CategoryScores,
        QuestionReviewItem,
        RecommendedTopic,
        InterviewSessionState,
    )
    from backend.services.groq_service import groq_service
    from backend.services.interview_engine import get_company_plan
    from backend.api.session_store import save_report_to_history
except ImportError:
    from models.schemas import (
        CandidateProfile,
        QuestionItem,
        AnswerEvaluation,
        TurnRecord,
        InterviewReport,
        CategoryScores,
        QuestionReviewItem,
        RecommendedTopic,
        InterviewSessionState,
    )
    from services.groq_service import groq_service
    from services.interview_engine import get_company_plan
    from api.session_store import save_report_to_history

logger = logging.getLogger(__name__)

COMMON_FILLER_WORDS = [
    "um", "uh", "ah", "er", "like", "basically", "you know", "actually",
    "sort of", "kind of", "i mean", "honestly", "literally", "to be honest", "so yeah"
]

def detect_filler_words(text: str) -> List[str]:
    """Detect presence of common filler words or verbal crutches."""
    if not text:
        return []
    found = []
    lower = text.lower()
    for word in COMMON_FILLER_WORDS:
        pattern = r"\b" + re.escape(word) + r"\b"
        if re.search(pattern, lower):
            found.append(word)
    return found

def generate_structure_template(question: QuestionItem) -> str:
    """Generate question-specific STAR or 3-step structured answer model."""
    is_behavioral = question.category in ["Behavioral", "HR", "Problem Solving", "Introduction"]
    if is_behavioral:
        return (
            "Recommended STAR Framework:\n"
            "1. Situation: Set the scene in 1 sentence ('In my college final year project...').\n"
            "2. Task: State the primary goal or conflict you had to resolve.\n"
            "3. Action: Detail your specific technical steps and decisions.\n"
            "4. Result: Conclude with quantifiable impact ('reduced page load by 35%')."
        )
    return (
        "Recommended Technical Architecture Framework:\n"
        "1. Core Concept & Definition: Define the mechanism directly in 1 crisp sentence.\n"
        "2. Architecture & Implementation: Explain data flow, components, and trade-offs.\n"
        "3. Scalability & Edge Cases: Discuss failure modes, time/space complexity, or caching."
    )

ANSWER_EVALUATOR_PROMPT = """You are a Principal Software Engineer, Bar-Raiser, and Speech Coach conducting a rigorous technical interview evaluation.

Your evaluation must be GENUINE, CANDID, and UNCOMPROMISING. Do NOT give inflated scores to superficial answers.

EVALUATION CRITERIA:
1. Technical Accuracy (1-10): Are the technical facts, mechanisms, architectural patterns, and algorithms correct? Flag any technical misconceptions or inaccuracies.
2. Relevance (1-10): Did the candidate directly answer the specific question asked, or did they beat around the bush, pivot to a generic topic, or give textbook definitions without addressing the question?
3. Depth & Nuance (1-10): Did they explain the 'how' and 'why' (e.g. trade-offs, time/space complexity, race conditions, caching, failure modes, scale)? Or was it just high-level buzzwords?
4. Communication & Structure (1-10): Was the response structured with clean logical transitions (e.g. Problem -> Solution -> Trade-offs, or Situation -> Task -> Action -> Result)?
5. Confidence (1-10): Did the candidate communicate assertively without excessive hedging or doubt on core technical facts?

SCORING RUBRIC:
- 1-3: Inaccurate, completely superficial, or completely dodged the question.
- 4-5: Weak or vague answer with noticeable factual errors or lack of depth.
- 6-7: Competent response that addresses the core question, but lacks deep edge-case analysis or architectural trade-offs.
- 8: Strong, well-articulated engineering answer with concrete mechanisms.
- 9-10: Exceptional senior/staff-level answer that thoroughly analyzes trade-offs, scalability, and failure recovery.

DECISION CRITERIA:
- Set "decision" to "follow_up" if the candidate made an interesting technical claim that warrants verification, or gave a surface-level answer that requires probing deeper.
- Set "decision" to "next_topic" if the candidate gave a comprehensive answer or if this topic has already been probed.

Return ONLY a valid JSON object matching this schema:
{
  "technical_score": 7,
  "relevance_score": 8,
  "depth_score": 6,
  "communication_score": 7,
  "confidence_score": 7,
  "feedback": "Candid 2-3 sentence evaluation directly referencing what the candidate said, highlighting both merits and specific shortcomings.",
  "strengths": ["Specific point or concept they explained accurately"],
  "improvements": ["Specific missing trade-off, edge case, or concept they should have mentioned"],
  "decision": "follow_up" | "next_topic",
  "follow_up_reason": "Specific technical claim or ambiguity in their answer that needs probing",
  "communication_feedback": "Speech & pacing critique. Mention conciseness, verbal presence, and clarity.",
  "better_answer_structure": "Recommended outline: 1. Core Mechanism -> 2. Implementation with Example -> 3. Edge-Case Trade-off"
}
"""

FINAL_REPORT_PROMPT = """You are the Chair of an Executive Engineering Hiring Committee conducting the final interview debrief for Prepwise.

Review the complete interview transcript, every question asked, the candidate's exact spoken responses, and the turn-by-turn evaluations.
Synthesize an authentic, data-driven hiring assessment tailored to the target company's hiring bar.

SCORING PRINCIPLE:
Be realistic and objective. Calculate scores based on the actual technical quality of their spoken answers.
- 85-100: Strong Hire / Bar-Raiser performance across all rounds.
- 70-84: Solid Candidate with specific, actionable technical growth areas.
- 50-69: Needs further study before being interview-ready.
- Below 50: Significant foundational gaps in technical knowledge or communication.

Return ONLY a valid JSON object matching this schema:
{
  "overall_score": 78,
  "readiness_verdict": "Realistic readiness verdict for this target company",
  "summary": "3-sentence executive debrief synthesizing technical mastery, problem-solving depth, and verbal communication.",
  "category_scores": {
    "technical_knowledge": 75,
    "problem_solving": 78,
    "communication": 82,
    "relevance": 85,
    "answer_depth": 72,
    "confidence": 76
  },
  "strengths": [
    "Concrete, verified strength demonstrated in their answers",
    "Another specific area of technical competence"
  ],
  "improvement_areas": [
    "Specific technical gap or trade-off that was missed during the interview",
    "Communication or structural improvement needed"
  ],
  "recommended_topics": [
    {
      "topic": "Specific Technical Topic (e.g. Distributed Caching & Invalidation)",
      "reason": "Specific reason why they struggled or hesitated on this topic during the interview",
      "recommended_action": "Actionable, concrete study step or paper/documentation to review"
    }
  ]
}
"""

def evaluate_answer(
    question: QuestionItem,
    answer_text: str,
    profile: CandidateProfile,
    difficulty: str,
    is_retry: bool = False,
    previous_communication_score: Optional[int] = None
) -> AnswerEvaluation:
    """Evaluate a single candidate answer strictly using Groq LLM and speech analysis."""
    if not groq_service.is_configured():
        raise ValueError(
            "Groq API key is not configured. An active Groq API key is required to evaluate interview answers. "
            "Please provide your Groq API key in the settings modal."
        )

    cleaned_answer = (answer_text or "").strip()
    detected_fillers = detect_filler_words(cleaned_answer)
    default_structure = generate_structure_template(question)

    if not cleaned_answer or len(cleaned_answer) < 8:
        return AnswerEvaluation(
            technical_score=2,
            relevance_score=2,
            depth_score=1,
            communication_score=2,
            confidence_score=3,
            feedback="No substantive answer was provided. In an interview, try to acknowledge the question, break down the core concept, and provide at least a high-level approach.",
            strengths=["Acknowledged the question"],
            improvements=["Provide a structured answer explaining the mechanism, an example, and edge cases"],
            decision="next_topic",
            filler_words_detected=detected_fillers,
            communication_feedback="Answer was too brief to evaluate. Practice speaking for at least 60-90 seconds per technical question.",
            better_answer_structure=default_structure,
            is_retry=is_retry,
            previous_communication_score=previous_communication_score
        )

    retry_context = ""
    if is_retry and previous_communication_score:
        retry_context = f"\nNote: This is a RETRY drill attempt. The candidate previously scored {previous_communication_score}/10 on communication. Compare their structure and clarity against the previous attempt."

    user_prompt = f"""
CANDIDATE BACKGROUND:
- Claimed Skills: {', '.join(profile.skills[:10])}
- Languages: {', '.join(profile.programming_languages)}
- Primary Projects: {[p.title for p in profile.projects[:3]]}

QUESTION ASKED:
- Category: {question.category}
- Topic: {question.topic}
- Target Item: {question.target_skill_or_project or 'General'}
- Difficulty Tier: {difficulty}
- Full Question: "{question.question}"

CANDIDATE'S SPOKEN TRANSCRIPT:
"{cleaned_answer}"
{retry_context}

Evaluate this spoken answer now with rigorous engineering standards.
"""

    try:
        data = groq_service.call_json_llm(
            system_prompt=ANSWER_EVALUATOR_PROMPT,
            user_prompt=user_prompt,
            temperature=0.2,
            max_tokens=1500
        )

        raw_comm_score = int(data.get("communication_score", 7))
        # Account for detected speech fillers
        if detected_fillers and raw_comm_score > 7:
            raw_comm_score = max(5, raw_comm_score - min(2, len(detected_fillers)))

        comm_improvement = None
        if is_retry and previous_communication_score is not None:
            comm_improvement = raw_comm_score - previous_communication_score

        # Enrich verbal feedback with speech analysis
        llm_comm_fb = data.get("communication_feedback", "")
        if detected_fillers:
            filler_str = ", ".join(f'"{f}"' for f in detected_fillers)
            comm_feedback = f"Identified {len(detected_fillers)} filler word(s): {filler_str}. Pausing silently instead of using verbal crutches projects greater authority. {llm_comm_fb}"
        else:
            comm_feedback = f"Clean verbal delivery with zero filler words! {llm_comm_fb}"

        return AnswerEvaluation(
            technical_score=max(1, min(10, int(data.get("technical_score", 6)))),
            relevance_score=max(1, min(10, int(data.get("relevance_score", 7)))),
            depth_score=max(1, min(10, int(data.get("depth_score", 5)))),
            communication_score=max(1, min(10, raw_comm_score)),
            confidence_score=max(1, min(10, int(data.get("confidence_score", 7)))),
            feedback=data.get("feedback", "Answer touched upon the core concepts, but needs deeper exploration of trade-offs and edge cases."),
            strengths=data.get("strengths") or ["Addressed the core prompt"],
            improvements=data.get("improvements") or ["Deepen the explanation of architectural trade-offs and failure modes"],
            decision=data.get("decision", "next_topic"),
            follow_up_reason=data.get("follow_up_reason"),
            filler_words_detected=detected_fillers,
            communication_feedback=comm_feedback,
            better_answer_structure=data.get("better_answer_structure") or default_structure,
            is_retry=is_retry,
            previous_communication_score=previous_communication_score,
            communication_improvement=comm_improvement
        )
    except Exception as e:
        logger.error(f"Groq answer evaluation failed: {e}")
        raise RuntimeError(f"Failed to evaluate answer with Groq: {str(e)}. Please check your Groq API key and network connection.")

def generate_final_report(session: InterviewSessionState) -> InterviewReport:
    """Generate final comprehensive report from completed interview session using Groq LLM."""
    if not groq_service.is_configured():
        raise ValueError(
            "Groq API key is not configured. An active Groq API key is required to synthesize the interview report. "
            "Please provide your Groq API key in the settings modal."
        )

    turns = session.turns
    valid_turns = [t for t in turns if t.answer and t.evaluation]
    target_company = session.target_company or "General"
    company_plan = get_company_plan(target_company)

    question_reviews: List[QuestionReviewItem] = []
    for idx, turn in enumerate(turns, 1):
        eval_data = turn.evaluation or AnswerEvaluation()
        avg_score = int(round((eval_data.technical_score + eval_data.relevance_score + eval_data.depth_score + eval_data.communication_score) * 2.5))
        question_reviews.append(
            QuestionReviewItem(
                question_number=idx,
                question=turn.question.question,
                category=turn.question.category,
                topic=turn.question.topic,
                is_follow_up=turn.question.is_follow_up,
                answer=turn.answer or "No answer provided.",
                score=avg_score,
                feedback=eval_data.feedback,
                strengths=eval_data.strengths,
                improvements=eval_data.improvements,
                communication_score=eval_data.communication_score,
                filler_words_detected=eval_data.filler_words_detected,
                better_answer_structure=eval_data.better_answer_structure
            )
        )

    if not valid_turns:
        raise ValueError("Cannot generate an interview report because no answers were recorded.")

    transcript_text = "\n\n".join([
        f"Question {idx} ({t.question.category} - {t.question.topic}):\n"
        f"Q: {t.question.question}\n"
        f"A: {t.answer}\n"
        f"Internal Evaluation: Tech={t.evaluation.technical_score}/10, Comm={t.evaluation.communication_score}/10, Depth={t.evaluation.depth_score}/10.\n"
        f"Turn Feedback: {t.evaluation.feedback}"
        for idx, t in enumerate(valid_turns, 1)
    ])

    user_prompt = f"""
CANDIDATE: {session.candidate_profile.name}
TARGET COMPANY: {target_company}
INTERVIEW TYPE: {session.interview_type}
DIFFICULTY TIER: {session.difficulty}
RESUME SUMMARY: {session.candidate_profile.summary}

COMPLETE INTERVIEW TRANSCRIPT & PER-TURN EVALUATIONS:
{transcript_text}

TASK:
Synthesize all turns into an authoritative, genuine final report matching {target_company}'s engineering hiring standard.
"""

    try:
        data = groq_service.call_json_llm(
            system_prompt=FINAL_REPORT_PROMPT,
            user_prompt=user_prompt,
            temperature=0.2,
            max_tokens=2500
        )

        raw_scores = data.get("category_scores", {})
        category_scores = CategoryScores(
            technical_knowledge=int(raw_scores.get("technical_knowledge", 75)),
            problem_solving=int(raw_scores.get("problem_solving", 75)),
            communication=int(raw_scores.get("communication", 80)),
            relevance=int(raw_scores.get("relevance", 80)),
            answer_depth=int(raw_scores.get("answer_depth", 70)),
            confidence=int(raw_scores.get("confidence", 75)),
        )

        recommended_topics = [
            RecommendedTopic(
                topic=r.get("topic", "System Architecture & Trade-offs"),
                reason=r.get("reason", "Identified hesitation or conceptual gap during the interview"),
                recommended_action=r.get("recommended_action", "Review core engineering documentation and build a proof of concept")
            )
            for r in data.get("recommended_topics", [])
        ]

        report = InterviewReport(
            session_id=session.session_id,
            candidate_name=session.candidate_profile.name or "Candidate",
            target_company=target_company,
            interview_type=session.interview_type,
            difficulty=session.difficulty,
            overall_score=int(data.get("overall_score", 75)),
            readiness_verdict=data.get("readiness_verdict", f"{target_company} Mock Completed"),
            summary=data.get("summary", f"Completed {target_company} mock interview with detailed performance breakdown."),
            category_scores=category_scores,
            strengths=data.get("strengths") or ["Demonstrated hands-on familiarity with project stack"],
            improvement_areas=data.get("improvement_areas") or ["Deepen knowledge of architectural trade-offs and edge-case handling"],
            recommended_topics=recommended_topics,
            question_reviews=question_reviews,
            total_questions_answered=len(valid_turns),
            completed_at=datetime.datetime.now().strftime("%B %d, %Y - %I:%M %p"),
            company_prep_plan=company_plan
        )
        save_report_to_history(report)
        return report
    except Exception as e:
        logger.error(f"Groq final report synthesis failed: {e}")
        raise RuntimeError(f"Failed to generate final report with Groq: {str(e)}. Please check your Groq API key and network connection.")


