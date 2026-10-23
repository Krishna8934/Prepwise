import logging
from typing import Dict, Any, List, Optional
try:
    from backend.models.schemas import (
        CandidateProfile,
        InterviewSessionState,
        QuestionItem,
        AnswerEvaluation,
        TurnRecord,
    )
    from backend.services.groq_service import groq_service
except ImportError:
    from models.schemas import (
        CandidateProfile,
        InterviewSessionState,
        QuestionItem,
        AnswerEvaluation,
        TurnRecord,
    )
    from services.groq_service import groq_service

logger = logging.getLogger(__name__)

INTERVIEWER_SYSTEM_PROMPT = """You are an elite, insightful AI interviewer conducting a real-time mock interview for Prepwise.
Your goal is to conduct a natural, rigorous, and highly personalized interview.

Key Guidelines:
1. ALWAYS base your questions on the candidate's actual resume (projects, tech stack, experience claims, education).
2. Ask ONE focused question at a time.
3. Keep the question phrasing natural, direct, and conversational (it will be spoken aloud via Text-to-Speech). Avoid markdown bullets or formatting in the question string.
4. Adapt dynamically:
   - If the candidate's last answer was shallow or made an interesting technical claim, ask a deep follow-up probing trade-offs, architecture, or edge cases.
   - If the candidate answered thoroughly or already had follow-ups on the same topic, transition smoothly to a new skill/project/behavioral topic.
   - For Technical interviews: Focus on system architecture, algorithms, coding concepts, data modeling, optimization, and project trade-offs.
   - For HR interviews: Focus on behavioral STAR method questions, leadership, teamwork, handling conflicts, career trajectory.
   - For Mixed interviews: Balance technical deep dives, system design, and situational/behavioral questions.
5. Challenge exaggerated claims respectfully (e.g., if they claim "expert in microservices", test their understanding of distributed tracing, consensus, or circuit breakers).
6. Match the requested difficulty:
   - Easy: Fundamental concepts, direct definitions, basic use-cases.
   - Medium: Practical problem solving, trade-offs, real-world project challenges.
   - Hard: Edge cases, low-level performance bottlenecks, distributed failure modes, complex system design.

Return ONLY a JSON object:
{
  "question": "The spoken interview question",
  "category": "Technical" | "System Design" | "Project Deep Dive" | "Behavioral" | "Problem Solving",
  "topic": "Short name of the specific topic being tested",
  "is_follow_up": true | false,
  "difficulty": "Easy" | "Medium" | "Hard",
  "target_skill_or_project": "The specific item from their resume being targeted",
  "context_hint": "Brief internal rationale for why this question was chosen"
}
"""

def generate_first_question(
    profile: CandidateProfile,
    interview_type: str,
    difficulty: str,
) -> QuestionItem:
    """Generate the opening interview question tailored to the candidate."""
    if groq_service.is_configured():
        try:
            profile_summary = f"""
Candidate Name: {profile.name}
Summary: {profile.summary}
Skills: {', '.join(profile.skills[:10])}
Languages: {', '.join(profile.programming_languages)}
Frameworks: {', '.join(profile.frameworks)}
Projects: {[p.title + ': ' + p.description for p in profile.projects[:3]]}
Work Experience: {[w.company + ' as ' + w.role for w in profile.work_experience[:2]]}
Suggested Topics: {profile.suggested_topics[:4]}
"""
            user_prompt = f"""
Start the interview.
Interview Type: {interview_type}
Difficulty: {difficulty}

Candidate Profile:
{profile_summary}

Generate the opening question (Question 1).
If Technical/Mixed, start with an engaging warm-up question regarding one of their top projects or primary programming language.
If HR, start with a focused introductory question about their background and engineering journey.
"""
            data = groq_service.call_json_llm(
                system_prompt=INTERVIEWER_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.4
            )
            return QuestionItem(
                id=1,
                question=data.get("question", f"Hello {profile.name.split()[0] if profile.name else 'there'}, welcome to Prepwise. To start off, could you briefly introduce yourself and tell me about the most impactful project you've worked on recently?"),
                category=data.get("category", "Introduction"),
                topic=data.get("topic", "Candidate Background"),
                difficulty=difficulty,
                is_follow_up=False,
                target_skill_or_project=data.get("target_skill_or_project", "Overview"),
                context_hint=data.get("context_hint", "Opening icebreaker and technical baseline")
            )
        except Exception as e:
            logger.warning(f"Groq first question generation failed: {e}. Using fallback.")

    # Intelligent deterministic fallback
    first_name = profile.name.split()[0] if profile.name and profile.name != "Candidate" else "there"
    top_project = profile.projects[0].title if profile.projects else "your recent technical work"
    top_lang = profile.programming_languages[0] if profile.programming_languages else "software development"
    
    if interview_type == "HR":
        q_text = f"Hello {first_name}, welcome to your interview with Prepwise. To begin, could you walk me through your background, what drove your interest in technology, and what you're looking for in your next role?"
        cat = "Behavioral"
        top = "Background & Motivations"
    elif interview_type == "Technical":
        q_text = f"Hello {first_name}, welcome to your technical interview. Looking at your resume, I see you built '{top_project}'. Could you walk me through the overall architecture of that project and explain why you chose {top_lang} for the implementation?"
        cat = "Project Deep Dive"
        top = top_project
    else:
        q_text = f"Hello {first_name}, welcome to Prepwise. Let's start with an overview: could you walk me through '{top_project}' and explain the biggest technical challenge you faced while building it?"
        cat = "Project Deep Dive"
        top = top_project

    return QuestionItem(
        id=1,
        question=q_text,
        category=cat,
        topic=top,
        difficulty=difficulty,
        is_follow_up=False,
        target_skill_or_project=top_project,
        context_hint="Opening question exploring project background"
    )

def generate_next_question(
    session: InterviewSessionState,
    latest_evaluation: Optional[AnswerEvaluation] = None,
) -> QuestionItem:
    """Generate the next adaptive question based on past turns and evaluation."""
    next_id = session.current_question_index + 1
    
    if groq_service.is_configured():
        try:
            # Build conversation history
            history_lines = []
            for idx, turn in enumerate(session.turns, 1):
                ans = turn.answer or "[No answer]"
                eval_str = f"(Score: Tech={turn.evaluation.technical_score if turn.evaluation else 'N/A'}/10)" if turn.evaluation else ""
                history_lines.append(f"Q{idx} ({turn.question.category} - {turn.question.topic}): {turn.question.question}")
                history_lines.append(f"A{idx}: {ans} {eval_str}")
            
            history_text = "\n".join(history_lines)
            
            latest_turn = session.turns[-1] if session.turns else None
            last_answer = latest_turn.answer if latest_turn else ""
            last_question = latest_turn.question.question if latest_turn else ""
            
            # Check how many consecutive follow-ups we've had on current topic
            recent_follow_ups = 0
            for turn in reversed(session.turns):
                if turn.question.is_follow_up:
                    recent_follow_ups += 1
                else:
                    break

            user_prompt = f"""
Candidate Name: {session.candidate_profile.name}
Resume Skills: {', '.join(session.candidate_profile.skills[:10])}
Resume Frameworks: {', '.join(session.candidate_profile.frameworks)}
Resume Projects: {[p.title + ' (' + ', '.join(p.tech_stack) + ')' for p in session.candidate_profile.projects[:3]]}
Suggested Resume Topics: {session.candidate_profile.suggested_topics}

Interview Settings:
- Type: {session.interview_type}
- Configured Difficulty: {session.difficulty}
- Current Question Number: {next_id} of {session.total_questions}
- Consecutive follow-ups on current topic: {recent_follow_ups}

Conversation History so far:
{history_text}

Latest Evaluation of Candidate's Answer:
- Decision recommendation: {latest_evaluation.decision if latest_evaluation else 'next_topic'}
- Feedback: {latest_evaluation.feedback if latest_evaluation else 'N/A'}
- Technical Score: {latest_evaluation.technical_score if latest_evaluation else 'N/A'}/10
- Depth Score: {latest_evaluation.depth_score if latest_evaluation else 'N/A'}/10

Instruction:
Generate Question #{next_id}.
- If consecutive follow-ups >= 2 OR decision is 'next_topic', you MUST transition to a different skill/project/topic from their resume to ensure broad topic coverage.
- If decision is 'follow_up' and consecutive follow-ups < 2, ask a sharp, probing follow-up targeting specific nuances or edge cases of their previous answer.
- Ensure the question is direct, professional, and clear.
"""
            data = groq_service.call_json_llm(
                system_prompt=INTERVIEWER_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.4
            )
            return QuestionItem(
                id=next_id,
                question=data.get("question", f"Could you elaborate on how you handle scalability and error handling in your projects?"),
                category=data.get("category", "Technical"),
                topic=data.get("topic", "System Architecture"),
                difficulty=data.get("difficulty", session.difficulty),
                is_follow_up=data.get("is_follow_up", False),
                follow_up_to_id=session.turns[-1].question.id if data.get("is_follow_up") and session.turns else None,
                target_skill_or_project=data.get("target_skill_or_project", ""),
                context_hint=data.get("context_hint", "Adaptive progression")
            )
        except Exception as e:
            logger.warning(f"Groq next question generation failed: {e}. Using fallback.")

    # Deterministic fallback engine
    return _heuristic_next_question(session, next_id, latest_evaluation)

def _heuristic_next_question(
    session: InterviewSessionState,
    next_id: int,
    latest_evaluation: Optional[AnswerEvaluation]
) -> QuestionItem:
    """Fallback question generation with progressive difficulty and coverage."""
    p = session.candidate_profile
    turns_count = len(session.turns)
    
    # Check if we should ask follow up
    last_turn = session.turns[-1] if session.turns else None
    if last_turn and not last_turn.question.is_follow_up and latest_evaluation and latest_evaluation.technical_score < 7:
        return QuestionItem(
            id=next_id,
            question=f"Building on your last point about {last_turn.question.topic}, what specific trade-offs did you encounter, and how would you optimize the performance if traffic grew tenfold?",
            category=last_turn.question.category,
            topic=last_turn.question.topic,
            difficulty=session.difficulty,
            is_follow_up=True,
            follow_up_to_id=last_turn.question.id,
            target_skill_or_project=last_turn.question.target_skill_or_project,
            context_hint="Follow-up probing performance trade-offs"
        )

    # Progression of topics
    skills = p.skills if p.skills else ["Database Design", "API Performance", "System Architecture"]
    frameworks = p.frameworks if p.frameworks else ["Modern Frameworks"]
    projects = p.projects if p.projects else []
    
    question_bank = [
        (
            f"You listed {frameworks[0] if frameworks else 'modern web frameworks'} on your resume. What architectural patterns do you rely on to manage state and maintain clean separation of concerns?",
            "Technical",
            frameworks[0] if frameworks else "Framework Architecture"
        ),
        (
            f"In your project '{projects[1].title if len(projects) > 1 else 'backend development'}', how did you approach database schema design, indexing, and preventing query bottlenecks?",
            "System Design",
            "Database & Performance"
        ),
        (
            "Tell me about a time when you encountered a subtle or critical bug in production. What was your debugging methodology to pinpoint the root cause?",
            "Problem Solving",
            "Debugging & Troubleshooting"
        ),
        (
            "When collaborating on a team with conflicting technical opinions on architecture or tooling, how do you navigate the discussion to reach consensus?",
            "Behavioral",
            "Team Collaboration & Conflict"
        ),
        (
            f"How do you approach automated testing, continuous integration, and ensuring high code quality in your {p.programming_languages[0] if p.programming_languages else 'software'} workflows?",
            "Engineering Best Practices",
            "Testing & CI/CD"
        ),
        (
            "If you had to design a rate-limiting service capable of handling millions of requests per second, what data structures and caching mechanisms would you employ?",
            "System Design",
            "Distributed Rate Limiting"
        )
    ]
    
    selected_idx = (turns_count) % len(question_bank)
    q_text, cat, top = question_bank[selected_idx]
    
    return QuestionItem(
        id=next_id,
        question=q_text,
        category=cat,
        topic=top,
        difficulty=session.difficulty,
        is_follow_up=False,
        target_skill_or_project=top,
        context_hint="Dynamic heuristic topic coverage"
    )
