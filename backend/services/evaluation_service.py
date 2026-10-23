import logging
import datetime
from typing import List, Dict, Any
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

logger = logging.getLogger(__name__)

ANSWER_EVALUATOR_PROMPT = """You are an expert technical interviewer and hiring manager assessing a candidate's answer during a mock interview.

Evaluate the answer rigorously based on:
1. Technical Accuracy (1-10): Correctness of facts, concepts, mechanisms, and algorithms.
2. Relevance (1-10): Did the candidate directly answer what was asked without unnecessary rambling?
3. Depth (1-10): Did they demonstrate surface-level knowledge or deep architectural/under-the-hood understanding?
4. Communication (1-10): Structure, clarity, conciseness, and precision of terminology.
5. Confidence (1-10): Assertiveness, clear reasoning, lack of hedging on basic facts.

Decision Logic:
- Choose "follow_up" if the answer had an interesting unexplored technical claim or was slightly incomplete/shallow and warrants a follow-up test.
- Choose "next_topic" if the answer was comprehensive or if a follow-up was already explored.
- Choose "increase_difficulty" if the candidate aced the question effortlessly.
- Choose "decrease_difficulty" if the candidate struggled significantly with core concepts.

Return ONLY a JSON object:
{
  "technical_score": 8,
  "relevance_score": 9,
  "depth_score": 7,
  "communication_score": 8,
  "confidence_score": 8,
  "feedback": "Concise 1-2 sentence constructive feedback for this specific answer.",
  "strengths": ["Clear mention of time complexity", "Good architectural overview"],
  "improvements": ["Could explain cache invalidation trade-offs"],
  "decision": "follow_up" | "next_topic" | "increase_difficulty" | "decrease_difficulty",
  "follow_up_reason": "Candidate mentioned Redis but did not explain eviction policies"
}
"""

FINAL_REPORT_PROMPT = """You are an executive hiring committee chair generating the comprehensive final interview report for Prepwise.

Synthesize all questions, candidate answers, and internal evaluations into a polished, high-value performance report.

Return ONLY a JSON object:
{
  "overall_score": 84,
  "readiness_verdict": "Ready for Technical Onsite / Strong Potential",
  "summary": "2-3 sentence executive summary of the candidate's performance across technical and behavioral dimensions.",
  "category_scores": {
    "technical_knowledge": 85,
    "problem_solving": 80,
    "communication": 88,
    "relevance": 90,
    "answer_depth": 78,
    "confidence": 82
  },
  "strengths": [
    "Demonstrated solid understanding of backend architecture and API design.",
    "Structured answers clearly with concrete examples from past projects."
  ],
  "improvement_areas": [
    "Deepen knowledge of database indexing strategies and query plan analysis.",
    "Articulate trade-offs more explicitly when choosing between architectural patterns."
  ],
  "recommended_topics": [
    {
      "topic": "Database Indexing & B-Trees",
      "reason": "Hesitated when discussing index cardinality and join optimization.",
      "recommended_action": "Review PostgreSQL EXPLAIN ANALYZE and composite index design rules."
    },
    {
      "topic": "System Design: Distributed Caching",
      "reason": "Could elaborate more on cache stampede prevention and eviction algorithms.",
      "recommended_action": "Study Cache-Aside, Write-Through patterns and consistent hashing."
    }
  ]
}
"""

def evaluate_answer(
    question: QuestionItem,
    answer_text: str,
    profile: CandidateProfile,
    difficulty: str,
) -> AnswerEvaluation:
    """Evaluate a single candidate answer."""
    cleaned_answer = (answer_text or "").strip()
    if not cleaned_answer or len(cleaned_answer) < 5:
        return AnswerEvaluation(
            technical_score=3,
            relevance_score=3,
            depth_score=2,
            communication_score=3,
            confidence_score=4,
            feedback="The response was very brief or contained minimal technical content. Try to provide more structured context, trade-offs, and examples.",
            strengths=["Attempted to acknowledge the question"],
            improvements=["Expand on your reasoning with concrete examples", "Address the core question directly"],
            decision="next_topic"
        )

    if groq_service.is_configured():
        try:
            user_prompt = f"""
Candidate Profile:
- Skills: {', '.join(profile.skills[:8])}
- Languages: {', '.join(profile.programming_languages)}

Question Details:
- Category: {question.category}
- Topic: {question.topic}
- Configured Difficulty: {difficulty}
- Question Asked: "{question.question}"

Candidate's Spoken Answer:
"{cleaned_answer}"

Evaluate this answer now.
"""
            data = groq_service.call_json_llm(
                system_prompt=ANSWER_EVALUATOR_PROMPT,
                user_prompt=user_prompt,
                temperature=0.3
            )
            return AnswerEvaluation(
                technical_score=int(data.get("technical_score", 7)),
                relevance_score=int(data.get("relevance_score", 8)),
                depth_score=int(data.get("depth_score", 7)),
                communication_score=int(data.get("communication_score", 8)),
                confidence_score=int(data.get("confidence_score", 8)),
                feedback=data.get("feedback", "Good explanation with room to dive deeper into trade-offs."),
                strengths=data.get("strengths", ["Addressed core prompt"]),
                improvements=data.get("improvements", ["Could provide more technical depth"]),
                decision=data.get("decision", "next_topic"),
                follow_up_reason=data.get("follow_up_reason")
            )
        except Exception as e:
            logger.warning(f"Groq answer evaluation failed: {e}. Using fallback.")

    # Fallback heuristic evaluation
    word_count = len(cleaned_answer.split())
    tech_score = min(9, max(5, 5 + (word_count // 30)))
    return AnswerEvaluation(
        technical_score=tech_score,
        relevance_score=8,
        depth_score=min(9, max(5, 4 + (word_count // 25))),
        communication_score=8,
        confidence_score=8,
        feedback="Solid answer demonstrating practical experience. Adding specific metrics or architectural trade-offs would further elevate your response.",
        strengths=["Clear communication", "Relevance to question topic"],
        improvements=["Detail concrete edge cases and design trade-offs"],
        decision="next_topic"
    )

def generate_final_report(session: InterviewSessionState) -> InterviewReport:
    """Generate final comprehensive report from completed interview session."""
    turns = session.turns
    valid_turns = [t for t in turns if t.answer and t.evaluation]
    
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
                improvements=eval_data.improvements
            )
        )

    if groq_service.is_configured() and valid_turns:
        try:
            transcript_text = "\n\n".join([
                f"Question {idx} ({t.question.category} - {t.question.topic}):\nQ: {t.question.question}\nA: {t.answer}\nEvaluation: Tech={t.evaluation.technical_score}/10, Comm={t.evaluation.communication_score}/10, Depth={t.evaluation.depth_score}/10. Feedback: {t.evaluation.feedback}"
                for idx, t in enumerate(valid_turns, 1)
            ])
            
            user_prompt = f"""
Candidate: {session.candidate_profile.name}
Interview Type: {session.interview_type}
Difficulty: {session.difficulty}
Resume Summary: {session.candidate_profile.summary}

Full Interview Transcript & Internal Turn Evaluations:
{transcript_text}

Generate the final synthesis report JSON now.
"""
            data = groq_service.call_json_llm(
                system_prompt=FINAL_REPORT_PROMPT,
                user_prompt=user_prompt,
                temperature=0.3
            )
            
            raw_scores = data.get("category_scores", {})
            category_scores = CategoryScores(
                technical_knowledge=int(raw_scores.get("technical_knowledge", 80)),
                problem_solving=int(raw_scores.get("problem_solving", 80)),
                communication=int(raw_scores.get("communication", 85)),
                relevance=int(raw_scores.get("relevance", 85)),
                answer_depth=int(raw_scores.get("answer_depth", 78)),
                confidence=int(raw_scores.get("confidence", 80)),
            )
            
            recommended_topics = [
                RecommendedTopic(
                    topic=r.get("topic", "System Architecture"),
                    reason=r.get("reason", "Area for deeper study"),
                    recommended_action=r.get("recommended_action", "Practice real-world case studies")
                )
                for r in data.get("recommended_topics", [])
            ]
            
            return InterviewReport(
                session_id=session.session_id,
                candidate_name=session.candidate_profile.name or "Candidate",
                interview_type=session.interview_type,
                difficulty=session.difficulty,
                overall_score=int(data.get("overall_score", 82)),
                readiness_verdict=data.get("readiness_verdict", "Strong Candidate — Recommended for Next Round"),
                summary=data.get("summary", "Solid overall interview performance with clear communication."),
                category_scores=category_scores,
                strengths=data.get("strengths", ["Strong project ownership", "Clear technical communication"]),
                improvement_areas=data.get("improvement_areas", ["Deepen system design edge-case explanations"]),
                recommended_topics=recommended_topics,
                question_reviews=question_reviews,
                total_questions_answered=len(valid_turns),
                completed_at=datetime.datetime.now().strftime("%B %d, %Y - %I:%M %p")
            )
        except Exception as e:
            logger.warning(f"Groq final report synthesis failed: {e}. Falling back to computation.")

    # Fallback computation
    if valid_turns:
        avg_tech = sum(t.evaluation.technical_score for t in valid_turns) / len(valid_turns) * 10
        avg_comm = sum(t.evaluation.communication_score for t in valid_turns) / len(valid_turns) * 10
        avg_depth = sum(t.evaluation.depth_score for t in valid_turns) / len(valid_turns) * 10
        avg_rel = sum(t.evaluation.relevance_score for t in valid_turns) / len(valid_turns) * 10
        avg_conf = sum(t.evaluation.confidence_score for t in valid_turns) / len(valid_turns) * 10
        overall = int(round((avg_tech * 0.35) + (avg_comm * 0.25) + (avg_depth * 0.20) + (avg_rel * 0.10) + (avg_conf * 0.10)))
    else:
        avg_tech = avg_comm = avg_depth = avg_rel = avg_conf = overall = 75

    category_scores = CategoryScores(
        technical_knowledge=int(round(avg_tech)),
        problem_solving=int(round((avg_tech + avg_depth) / 2)),
        communication=int(round(avg_comm)),
        relevance=int(round(avg_rel)),
        answer_depth=int(round(avg_depth)),
        confidence=int(round(avg_conf)),
    )

    verdict = "Ready for Technical Onsite" if overall >= 80 else ("Promising Candidate with Growth Areas" if overall >= 65 else "Needs More Practice")

    return InterviewReport(
        session_id=session.session_id,
        candidate_name=session.candidate_profile.name or "Candidate",
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        overall_score=overall,
        readiness_verdict=verdict,
        summary=f"The candidate demonstrated solid domain foundation across {session.interview_type} questions with good communicative structure.",
        category_scores=category_scores,
        strengths=[
            "Direct and relevant responses with clear articulation",
            "Demonstrated practical familiarity with claimed resume technologies",
            "Maintained consistent pacing and professional communication"
        ],
        improvement_areas=[
            "Incorporate more quantitative metrics and performance benchmarks into explanations",
            "Deepen coverage of trade-offs when comparing architectural alternatives",
            "Proactively address error handling and system edge cases"
        ],
        recommended_topics=[
            RecommendedTopic(
                topic="System Architecture & Scalability Trade-offs",
                reason="Answers focused heavily on happy paths with fewer mentions of failure modes.",
                recommended_action="Practice explaining how your systems fail gracefully under extreme load or network partitions."
            ),
            RecommendedTopic(
                topic="Database Query Optimization & Indexing",
                reason="Discussing query plan execution and indexing strategies adds immediate senior-level depth.",
                recommended_action="Review B-tree vs Hash indexing, join algorithms, and connection pooling."
            )
        ],
        question_reviews=question_reviews,
        total_questions_answered=len(valid_turns),
        completed_at=datetime.datetime.now().strftime("%B %d, %Y - %I:%M %p")
    )
