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

ANSWER_EVALUATOR_PROMPT = """You are an expert technical interviewer, speech coach, and hiring manager assessing a candidate's answer during a mock interview.

Evaluate the answer rigorously based on:
1. Technical Accuracy (1-10): Correctness of facts, concepts, mechanisms, and algorithms.
2. Relevance (1-10): Did the candidate directly answer what was asked without unnecessary rambling?
3. Depth (1-10): Did they demonstrate surface-level knowledge or deep architectural/under-the-hood understanding?
4. Communication & Clarity (1-10): Structure, clarity, conciseness, verbal precision, lack of filler words or vagueness.
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
  "follow_up_reason": "Candidate mentioned Redis but did not explain eviction policies",
  "communication_feedback": "Speech analysis: Well paced and structured. Avoid verbal fillers like 'basically' to sound more authoritative.",
  "better_answer_structure": "Recommended outline: 1. Core Principle -> 2. Implementation with Example -> 3. Edge-Case Trade-off"
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
    is_retry: bool = False,
    previous_communication_score: Optional[int] = None
) -> AnswerEvaluation:
    """Evaluate a single candidate answer with communication drill analysis."""
    cleaned_answer = (answer_text or "").strip()
    detected_fillers = detect_filler_words(cleaned_answer)
    default_structure = generate_structure_template(question)

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
            decision="next_topic",
            filler_words_detected=detected_fillers,
            communication_feedback="Answer was too brief to evaluate communication effectively. Practice delivering at least 2-3 structured sentences.",
            better_answer_structure=default_structure,
            is_retry=is_retry,
            previous_communication_score=previous_communication_score
        )

    if groq_service.is_configured():
        try:
            retry_context = ""
            if is_retry and previous_communication_score:
                retry_context = f"\nNote: This is a RETRY attempt. The candidate previously scored {previous_communication_score}/10 on communication. Assess if their structure, clarity, and conciseness improved."

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
{retry_context}

Evaluate this answer and provide communication & filler word feedback now.
"""
            data = groq_service.call_json_llm(
                system_prompt=ANSWER_EVALUATOR_PROMPT,
                user_prompt=user_prompt,
                temperature=0.3
            )
            
            comm_score = int(data.get("communication_score", 8))
            # If fillers were detected, slightly penalize communication if LLM gave 10
            if detected_fillers and comm_score > 8:
                comm_score = 8

            comm_improvement = None
            if is_retry and previous_communication_score is not None:
                comm_improvement = comm_score - previous_communication_score

            # Construct communicative feedback
            llm_comm_fb = data.get("communication_feedback", "")
            if detected_fillers:
                filler_str = ", ".join(f'"{f}"' for f in detected_fillers)
                comm_feedback = f"Detected {len(detected_fillers)} filler word(s): {filler_str}. Practice pausing instead of using fillers to project executive presence. {llm_comm_fb}"
            else:
                comm_feedback = f"Clean verbal delivery with zero filler words! {llm_comm_fb}"

            return AnswerEvaluation(
                technical_score=int(data.get("technical_score", 7)),
                relevance_score=int(data.get("relevance_score", 8)),
                depth_score=int(data.get("depth_score", 7)),
                communication_score=comm_score,
                confidence_score=int(data.get("confidence_score", 8)),
                feedback=data.get("feedback", "Good explanation with room to dive deeper into trade-offs."),
                strengths=data.get("strengths", ["Addressed core prompt"]),
                improvements=data.get("improvements", ["Could provide more technical depth"]),
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
            logger.warning(f"Groq answer evaluation failed: {e}. Using fallback.")

    # Fallback heuristic evaluation
    word_count = len(cleaned_answer.split())
    tech_score = min(9, max(5, 5 + (word_count // 30)))
    
    # Base communication score
    base_comm = 8
    if detected_fillers:
        base_comm -= min(3, len(detected_fillers))
    if word_count < 15:
        base_comm -= 2
    elif word_count > 120:
        base_comm -= 1 # rambling
    
    # If this is a retry attempt, reward candidate for making a deliberate second attempt
    if is_retry and previous_communication_score is not None:
        base_comm = max(base_comm, min(10, previous_communication_score + (2 if not detected_fillers else 1)))

    comm_score = max(4, min(10, base_comm))
    comm_improvement = (comm_score - previous_communication_score) if (is_retry and previous_communication_score is not None) else None

    if detected_fillers:
        filler_str = ", ".join(f'"{f}"' for f in detected_fillers)
        comm_fb = f"Noticeable filler words found: {filler_str}. Replace verbal pauses with silent breaths to elevate your answer clarity."
    elif word_count < 20:
        comm_fb = "Answer was somewhat terse. Try to elaborate on 'why' and 'how' using structured bullet points."
    else:
        comm_fb = "Articulate and fluent response with crisp sentence transitions."

    return AnswerEvaluation(
        technical_score=tech_score,
        relevance_score=8,
        depth_score=min(9, max(5, 4 + (word_count // 25))),
        communication_score=comm_score,
        confidence_score=8,
        feedback="Solid answer demonstrating practical experience. Adding specific metrics or architectural trade-offs would further elevate your response.",
        strengths=["Clear communication", "Relevance to question topic"],
        improvements=["Detail concrete edge cases and design trade-offs"],
        decision="next_topic",
        filler_words_detected=detected_fillers,
        communication_feedback=comm_fb,
        better_answer_structure=default_structure,
        is_retry=is_retry,
        previous_communication_score=previous_communication_score,
        communication_improvement=comm_improvement
    )

def generate_final_report(session: InterviewSessionState) -> InterviewReport:
    """Generate final comprehensive report from completed interview session."""
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

    if groq_service.is_configured() and valid_turns:
        try:
            transcript_text = "\n\n".join([
                f"Question {idx} ({t.question.category} - {t.question.topic}):\nQ: {t.question.question}\nA: {t.answer}\nEvaluation: Tech={t.evaluation.technical_score}/10, Comm={t.evaluation.communication_score}/10, Depth={t.evaluation.depth_score}/10. Feedback: {t.evaluation.feedback}"
                for idx, t in enumerate(valid_turns, 1)
            ])
            
            user_prompt = f"""
Candidate: {session.candidate_profile.name}
Target Company: {target_company}
Interview Type: {session.interview_type}
Difficulty: {session.difficulty}
Resume Summary: {session.candidate_profile.summary}

Full Interview Transcript & Internal Turn Evaluations:
{transcript_text}

Generate the final synthesis report JSON now tailored to {target_company}'s hiring bar.
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
            
            report = InterviewReport(
                session_id=session.session_id,
                candidate_name=session.candidate_profile.name or "Candidate",
                target_company=target_company,
                interview_type=session.interview_type,
                difficulty=session.difficulty,
                overall_score=int(data.get("overall_score", 82)),
                readiness_verdict=data.get("readiness_verdict", f"Strong {target_company} Candidate — Recommended for Next Round"),
                summary=data.get("summary", f"Solid overall interview performance with clear communication tailored for {target_company}."),
                category_scores=category_scores,
                strengths=data.get("strengths", ["Strong project ownership", "Clear technical communication"]),
                improvement_areas=data.get("improvement_areas", ["Deepen system design edge-case explanations"]),
                recommended_topics=recommended_topics,
                question_reviews=question_reviews,
                total_questions_answered=len(valid_turns),
                completed_at=datetime.datetime.now().strftime("%B %d, %Y - %I:%M %p"),
                company_prep_plan=company_plan
            )
            save_report_to_history(report)
            return report
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

    verdict = f"Ready for {target_company} Onsite" if overall >= 80 else (f"Promising {target_company} Candidate with Growth Areas" if overall >= 65 else f"Needs More Practice for {target_company}")

    report = InterviewReport(
        session_id=session.session_id,
        candidate_name=session.candidate_profile.name or "Candidate",
        target_company=target_company,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        overall_score=overall,
        readiness_verdict=verdict,
        summary=f"The candidate demonstrated solid domain foundation across {target_company} {session.interview_type} rounds with consistent communicative structure.",
        category_scores=category_scores,
        strengths=[
            f"Direct and relevant responses aligned with {target_company}'s engineering expectations",
            "Demonstrated practical familiarity with claimed resume technologies",
            "Maintained consistent pacing and professional English communication"
        ],
        improvement_areas=[
            "Incorporate more quantitative metrics and performance benchmarks into explanations",
            "Eliminate conversational filler words to project maximum confidence",
            "Deepen coverage of trade-offs when comparing architectural alternatives"
        ],
        recommended_topics=[
            RecommendedTopic(
                topic=f"{target_company} Core Technical Pattern",
                reason="Focus on textbook definitions linked directly to resume project implementations.",
                recommended_action=f"Review {target_company} syllabus: OOP, DBMS normalization, and system edge cases."
            ),
            RecommendedTopic(
                topic="Concise STAR Delivery",
                reason="Answers showed great substance but can be delivered even more crisply using STAR framework.",
                recommended_action="Practice 90-second structured responses highlighting Situation, Task, Action, and Result."
            )
        ],
        question_reviews=question_reviews,
        total_questions_answered=len(valid_turns),
        completed_at=datetime.datetime.now().strftime("%B %d, %Y - %I:%M %p"),
        company_prep_plan=company_plan
    )
    save_report_to_history(report)
    return report

