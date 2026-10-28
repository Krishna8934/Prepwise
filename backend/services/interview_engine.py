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

COMPANY_PREPARATION_PLANS: Dict[str, Dict[str, Any]] = {
    "TCS": {
        "company": "TCS",
        "tagline": "Tata Consultancy Services NQT & Technical Assessment Pattern",
        "overview": "TCS evaluates strong CS fundamentals, procedural vs OOP clarity, relational database queries, and dependable situational flexibility.",
        "rounds": [
            {"round": "Round 1", "name": "Core Technical & CS Fundamentals", "topics": ["OOP concepts", "DBMS & SQL queries", "Basic Data Structures", "Operating System Basics"]},
            {"round": "Round 2", "name": "Resume Project Deep-Dive", "topics": ["Project role & individual contribution", "Technology stack choices", "Handling bugs & testing"]},
            {"round": "Round 3", "name": "Managerial & HR Fit", "topics": ["Willingness to learn new stacks", "Shift flexibility", "Conflict resolution", "Company loyalty & ethics"]}
        ],
        "key_focus_areas": ["Object-Oriented Programming (Polymorphism, Inheritance, Encapsulation)", "SQL Joins & Group By", "Clean communication in English", "Project architectural rationale"],
        "recommended_tip": "Keep definitions crisp and textbook-accurate, then connect them to your project code."
    },
    "Infosys": {
        "company": "Infosys",
        "tagline": "Infosys Specialist Programmer & Digital Specialist Engineer Pattern",
        "overview": "Infosys focuses heavily on algorithmic logic, pseudo-code dry runs, database normalization, and structured software lifecycle understanding.",
        "rounds": [
            {"round": "Round 1", "name": "Coding Logic & Algorithmic Problem Solving", "topics": ["Array/String manipulation", "Time/space complexity", "Recursion & loops"]},
            {"round": "Round 2", "name": "Core Software Engineering & DB", "topics": ["Python/Java collections", "RDBMS Normalization", "API & Web architecture"]},
            {"round": "Round 3", "name": "HR & Cultural Alignment", "topics": ["Adaptability to Mysore training", "Team communication", "Handling feedback"]}
        ],
        "key_focus_areas": ["Clean variable naming and logical flow", "SQL Normalization (1NF, 2NF, 3NF)", "Python/Java core mechanics", "Clarity in English verbal explanation"],
        "recommended_tip": "Always dry-run your logic aloud step-by-step before stating the final answer."
    },
    "Wipro": {
        "company": "Wipro",
        "tagline": "Wipro Elite National Talent Hunt (NTH) & Turbo Pattern",
        "overview": "Wipro focuses on core programming logic, software engineering principles (SDLC/Agile), database handling, and client-centric communication.",
        "rounds": [
            {"round": "Round 1", "name": "Technical Breadth & Fundamentals", "topics": ["Pointers/Memory or Garbage Collection", "Data Structures (Stacks, Queues, Trees)", "OOP pillars"]},
            {"round": "Round 2", "name": "Applied Project Discussion", "topics": ["Frontend-backend integration", "Error handling in projects", "Database schema decisions"]},
            {"round": "Round 3", "name": "Business & HR Readiness", "topics": ["Client interaction scenarios", "Work ethic & deadline pressure", "Relocation adaptability"]}
        ],
        "key_focus_areas": ["Data structure operations", "Agile sprint understanding", "English communicative clarity", "Clear explanation of project challenges"],
        "recommended_tip": "Structure your answers with beginning, middle, and end without trailing off."
    },
    "Accenture": {
        "company": "Accenture",
        "tagline": "Accenture Advanced Associate Software Engineer (AASE) Pattern",
        "overview": "Accenture values cloud awareness, modern Agile practices, API integration, and strong collaborative communication.",
        "rounds": [
            {"round": "Round 1", "name": "Modern Tech & Cloud Basics", "topics": ["Cloud service models (IaaS/PaaS/SaaS)", "RESTful APIs", "Microservices vs Monolith basics"]},
            {"round": "Round 2", "name": "Resume Deep-Dive & Engineering Practices", "topics": ["Version control (Git)", "CI/CD pipelines", "Project architecture & security"]},
            {"round": "Round 3", "name": "Client Situational & Behavioral HR", "topics": ["Cross-functional teamwork", "Handling difficult stakeholders", "Communication agility"]}
        ],
        "key_focus_areas": ["Cloud fundamentals (AWS/Azure/GCP)", "Agile ceremonies & Git workflows", "Professional English delivery", "Business impact of technical choices"],
        "recommended_tip": "Highlight how your technical decisions solve end-user problems."
    },
    "Amazon": {
        "company": "Amazon",
        "tagline": "Amazon SDE (Software Development Engineer) Bar-Raiser Pattern",
        "overview": "Amazon tests rigorous Data Structures & Algorithms, high-scale system architecture, and deep adherence to Amazon Leadership Principles.",
        "rounds": [
            {"round": "Round 1", "name": "Data Structures & Computational Complexity", "topics": ["Trees, Graphs, Dynamic Programming", "Big-O runtime & memory bounds", "Concurrency & Threads"]},
            {"round": "Round 2", "name": "Low-Level & High-Level System Design", "topics": ["Distributed Caching & Sharding", "API Rate Limiting", "Database Partitioning & Latency"]},
            {"round": "Round 3", "name": "Leadership Principles (STAR Method)", "topics": ["Customer Obsession", "Ownership & Bias for Action", "Have Backbone; Disagree and Commit"]}
        ],
        "key_focus_areas": ["Strict STAR format for all behavioral answers", "Edge case identification", "Trade-offs between latency, throughput, and consistency", "Measurable quantitative impact"],
        "recommended_tip": "Every story must clearly define the Situation, Task, Action, and quantifiable Result with zero ambiguity."
    },
    "Startup": {
        "company": "Startup",
        "tagline": "Fast-Paced Startup & High-Growth Product Engineering Pattern",
        "overview": "Startups look for high agency, fullstack capability, rapid debugging under ambiguity, pragmatic trade-offs, and product intuition.",
        "rounds": [
            {"round": "Round 1", "name": "Fullstack Architecture & Practical Coding", "topics": ["End-to-end data flow", "State management & React/Vue lifecycle", "Backend API design & auth"]},
            {"round": "Round 2", "name": "Production Debugging & Trade-offs", "topics": ["Triage production outage", "Speed vs clean code trade-offs", "Handling third-party API failures"]},
            {"round": "Round 3", "name": "Ownership, Ambiguity & Culture", "topics": ["Prioritizing with incomplete specs", "Fast iteration cycle", "Product mindset"]}
        ],
        "key_focus_areas": ["High bias for action & shipping fast", "Deep ownership of past projects", "Practical trade-offs over academic theory", "Comfort with ambiguous problem statements"],
        "recommended_tip": "Show passion for product impact and explain what you learned from real technical mistakes."
    },
    "General": {
        "company": "General",
        "tagline": "Comprehensive Software Engineering & Placement Mock",
        "overview": "A balanced, holistic evaluation covering technical depth, problem-solving reasoning, system design, and behavioral storytelling.",
        "rounds": [
            {"round": "Round 1", "name": "Core Engineering Concepts", "topics": ["Languages, frameworks, and architecture"]},
            {"round": "Round 2", "name": "Resume Project Exploration", "topics": ["Hands-on project decisions and challenges"]},
            {"round": "Round 3", "name": "Behavioral & Communication", "topics": ["Team collaboration, STAR stories, career vision"]}
        ],
        "key_focus_areas": ["Technical fundamentals", "Project ownership", "Verbal clarity", "Problem-solving methodology"],
        "recommended_tip": "Be honest about what you know and demonstrate curiosity to learn."
    }
}

def get_company_plan(company_name: Optional[str]) -> Dict[str, Any]:
    """Retrieve structured company preparation plan."""
    if not company_name:
        return COMPANY_PREPARATION_PLANS["General"]
    return COMPANY_PREPARATION_PLANS.get(company_name, COMPANY_PREPARATION_PLANS["General"])

INTERVIEWER_SYSTEM_PROMPT = """You are a Principal Software Engineer and Bar-Raiser at a top technology company conducting a rigorous, real-time mock interview for Prepwise.

Your mission is to conduct a genuine, deeply personalized, and intellectually challenging interview.

CRITICAL RULES:
1. DEEPLY RESUME-CENTERED:
   - Every question must be anchored in the candidate's actual projects, claimed tech stack, stated achievements, or work experience.
   - Specifically reference the candidate's project titles, technologies they chose, and architectural mechanisms they claim to have implemented.
   - Respectfully verify and challenge claims: if they claim "handled 5k req/s" or "used Redis locks", ask them *how* they handled race conditions, cache invalidation, or network partitions.
2. NO REPETITION & PROGRESSIVE DEPTH:
   - Track all previously asked questions and topics. Never ask the same question or touch the same sub-topic twice.
   - Rotate across different projects, frameworks, system design scenarios, and behavioral challenges as the interview progresses.
3. ADAPTIVE REAL-TIME DIALOGUE:
   - If the candidate's previous answer was shallow, vague, or made an unverified claim, ask a sharp follow-up probing trade-offs, failure modes, or under-the-hood mechanics.
   - If the candidate demonstrated mastery or this is a new round, transition smoothly to a different project or technical domain.
4. COMPANY-SPECIFIC FOCUS:
   - TCS: Emphasize core Object-Oriented principles, database normalization & SQL query efficiency, modular code organization, and adaptability.
   - Amazon: Emphasize high-scale distributed architecture, caching/sharding trade-offs, failure recovery, and Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action via STAR method).
   - Infosys: Emphasize algorithmic logic, data structures, database normalization (1NF-3NF), clean pseudocode walkthrough, and learning agility.
   - Accenture: Emphasize cloud services (AWS/Azure), REST API design, CI/CD, microservices, and end-user business impact.
   - Startup: Emphasize production triage, speed vs technical debt trade-offs, fullstack problem solving, and ambiguity.
   - General: Holistic evaluation across system design, API contracts, data models, and edge cases.
5. NATURAL SPOKEN PHRASING:
   - The question will be spoken aloud to the candidate via Text-to-Speech (TTS).
   - Keep the question phrasing natural, direct, conversational, and articulate.
   - Do NOT output markdown bullets, bold asterisks (**), or headers in the question string.

Return ONLY a valid JSON object matching this schema:
{
  "question": "The conversational spoken interview question",
  "category": "Project Deep Dive" | "Technical" | "System Design" | "Problem Solving" | "Behavioral",
  "topic": "Short title of the specific technical topic being tested",
  "is_follow_up": true | false,
  "difficulty": "Easy" | "Medium" | "Hard",
  "target_skill_or_project": "The exact project name, framework, or skill from the resume being probed",
  "context_hint": "Brief rationale for why this question is being asked",
  "round_name": "e.g. Round 1: Core Architecture or Round 2: Project Deep-Dive"
}
"""

def _format_candidate_profile_for_prompt(profile: CandidateProfile) -> str:
    """Format full candidate profile with high detail for LLM context."""
    projects_text = []
    for idx, p in enumerate(profile.projects, 1):
        achievements_str = "; ".join(p.key_achievements) if p.key_achievements else "No specific metrics listed"
        projects_text.append(
            f"Project {idx}: '{p.title}'\n"
            f"  - Tech Stack: {', '.join(p.tech_stack) if p.tech_stack else 'Not specified'}\n"
            f"  - Summary: {p.description or 'Hands-on application'}\n"
            f"  - Key Claims/Achievements: {achievements_str}"
        )

    work_text = []
    for idx, w in enumerate(profile.work_experience, 1):
        highlights_str = "; ".join(w.highlights) if w.highlights else "Engineering responsibilities"
        work_text.append(
            f"Experience {idx}: {w.company} as {w.role} ({w.duration or 'Recent'})\n"
            f"  - Highlights: {highlights_str}"
        )

    return f"""
Candidate Name: {profile.name}
Summary: {profile.summary}
Programming Languages: {', '.join(profile.programming_languages) if profile.programming_languages else 'General'}
Frameworks: {', '.join(profile.frameworks) if profile.frameworks else 'Modern frameworks'}
Technical Skills & Tools: {', '.join(profile.skills) if profile.skills else 'Fullstack engineering'}
Expertise Domains: {', '.join(profile.expertise_areas) if profile.expertise_areas else 'Software Engineering'}

Extracted Resume Projects:
{chr(10).join(projects_text) if projects_text else 'None extracted'}

Extracted Work Experience:
{chr(10).join(work_text) if work_text else 'None extracted'}

Key Probing Topics from Resume:
{chr(10).join(['- ' + t for t in profile.suggested_topics]) if profile.suggested_topics else '- Architecture and trade-offs'}
"""

def generate_first_question(
    profile: CandidateProfile,
    interview_type: str,
    difficulty: str,
    target_company: str = "General",
) -> QuestionItem:
    """Generate the opening interview question strictly tailored to the candidate's resume and target company."""
    if not groq_service.is_configured():
        raise ValueError(
            "Groq API key is not configured. An active Groq API key is required to start an interview with Prepwise. "
            "Please provide your Groq API key in the settings modal."
        )

    company_plan = get_company_plan(target_company)
    rounds = company_plan.get("rounds", [{}])
    first_round_name = rounds[0].get("name", "Round 1: Screening & Architecture")
    profile_summary = _format_candidate_profile_for_prompt(profile)

    user_prompt = f"""
TARGET COMPANY: {target_company}
HIRING TRACK: {company_plan.get('tagline')}
COMPANY OVERVIEW: {company_plan.get('overview')}
KEY FOCUS AREAS: {company_plan.get('key_focus_areas')}
INTERVIEW TYPE: {interview_type}
DIFFICULTY: {difficulty}

FULL CANDIDATE RESUME PROFILE:
{profile_summary}

TASK:
Generate Question 1 (Opening Question) for this candidate's {target_company} interview.

MANDATORY INSTRUCTIONS:
1. Greet the candidate warmly by their first name ({profile.name.split()[0] if profile.name else 'Candidate'}).
2. Specifically introduce the interview for {target_company}.
3. Anchor Question 1 in their primary resume project (Project 1).
4. Explicitly state the exact name of their project and mention technologies they used in it.
5. Ask them to explain the high-level architecture of that project, and drill into how they handled a specific technical challenge or design decision related to {target_company}'s engineering focus.
6. Make sure the phrasing sounds natural when spoken aloud. Do NOT include markdown formatting.
"""

    try:
        data = groq_service.call_json_llm(
            system_prompt=INTERVIEWER_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=1500
        )
        return QuestionItem(
            id=1,
            question=data.get("question", f"Hello {profile.name.split()[0] if profile.name else 'there'}, welcome to your {target_company} interview. Could you walk me through your primary project from your resume and explain the architectural decisions you made?"),
            category=data.get("category", "Project Deep Dive"),
            topic=data.get("topic", "Project Architecture"),
            difficulty=difficulty,
            is_follow_up=False,
            target_skill_or_project=data.get("target_skill_or_project", profile.projects[0].title if profile.projects else "Resume Project"),
            context_hint=data.get("context_hint", f"Opening {target_company} interview question grounded in resume"),
            round_name=data.get("round_name", first_round_name)
        )
    except Exception as e:
        logger.error(f"Groq first question generation failed: {e}")
        raise RuntimeError(f"Failed to generate opening question with Groq: {str(e)}. Please check your Groq API key and network connection.")

def generate_next_question(
    session: InterviewSessionState,
    latest_evaluation: Optional[AnswerEvaluation] = None,
) -> QuestionItem:
    """Generate the next adaptive question based on candidate resume, past turns, and evaluation."""
    if not groq_service.is_configured():
        raise ValueError(
            "Groq API key is not configured. An active Groq API key is required to generate interview questions. "
            "Please provide your Groq API key in the settings modal."
        )

    next_id = session.current_question_index + 1
    target_company = session.target_company or "General"
    company_plan = get_company_plan(target_company)
    rounds = company_plan.get("rounds", [])

    # Determine current round based on progress
    total_q = max(session.total_questions, 1)
    if next_id <= max(1, total_q // 3):
        current_round = rounds[0] if len(rounds) > 0 else {"name": "Round 1: Screening & Core Concepts"}
    elif next_id <= max(2, (2 * total_q) // 3):
        current_round = rounds[1] if len(rounds) > 1 else (rounds[0] if rounds else {"name": "Round 2: Technical Deep Dive"})
    else:
        current_round = rounds[2] if len(rounds) > 2 else (rounds[-1] if rounds else {"name": "Round 3: Behavioral & System Design"})

    # Build full conversation history
    history_lines = []
    already_asked_topics = []
    for idx, turn in enumerate(session.turns, 1):
        ans = turn.answer or "[No answer]"
        eval_info = ""
        if turn.evaluation:
            eval_info = f"[Scores: Tech={turn.evaluation.technical_score}/10, Depth={turn.evaluation.depth_score}/10, Comm={turn.evaluation.communication_score}/10 | Feedback: {turn.evaluation.feedback}]"
        history_lines.append(f"Turn {idx}:\n  Question ({turn.question.category} - {turn.question.topic}): {turn.question.question}\n  Candidate Answer: {ans}\n  Internal Evaluation: {eval_info}")
        if turn.question.topic:
            already_asked_topics.append(turn.question.topic)

    history_text = "\n\n".join(history_lines)

    # Calculate consecutive follow-ups
    recent_follow_ups = 0
    for turn in reversed(session.turns):
        if turn.question.is_follow_up:
            recent_follow_ups += 1
        else:
            break

    profile_summary = _format_candidate_profile_for_prompt(session.candidate_profile)

    user_prompt = f"""
TARGET COMPANY: {target_company} ({company_plan.get('tagline')})
ROUND: {current_round.get('name')} (Target Topics: {', '.join(current_round.get('topics', []))})
INTERVIEW TYPE: {session.interview_type}
CONFIGURED DIFFICULTY: {session.difficulty}
CURRENT QUESTION NUMBER: {next_id} of {session.total_questions}
CONSECUTIVE FOLLOW-UPS ON PREVIOUS TOPIC: {recent_follow_ups}

TOPICS ALREADY ASKED (DO NOT REPEAT):
{', '.join(set(already_asked_topics))}

CANDIDATE RESUME PROFILE:
{profile_summary}

CONVERSATION TRANSCRIPT & EVALUATIONS SO FAR:
{history_text}

LATEST TURN EVALUATION:
- Recommendation: {latest_evaluation.decision if latest_evaluation else 'next_topic'}
- Candidate Answer Strengths: {latest_evaluation.strengths if latest_evaluation else 'N/A'}
- Candidate Missing Improvements: {latest_evaluation.improvements if latest_evaluation else 'N/A'}
- Follow-up Reason (if applicable): {latest_evaluation.follow_up_reason if latest_evaluation else 'N/A'}

QUESTION GENERATION INSTRUCTIONS:
1. DECISION LOGIC:
   - If (latest_evaluation.decision == 'follow_up' OR latest_evaluation.technical_score < 7) AND consecutive follow-ups < 2:
     Ask a SHARP, probing follow-up targeting the specific missing trade-off, edge case, or claim they just mentioned. Reference what they said directly.
   - Otherwise (consecutive follow-ups >= 2 OR decision == 'next_topic'):
     Transition cleanly to a DIFFERENT project, a different framework, or a company-specific round topic from their resume.
     For example:
     - If Project 1 was explored, question them on Project 2 or a work experience bullet point.
     - Question them on the internal mechanics of a framework they explicitly listed (e.g. {session.candidate_profile.frameworks[0] if session.candidate_profile.frameworks else 'their tech stack'}).
     - If in late rounds, present a realistic system design, debugging scenario, or behavioral STAR question tailored to {target_company}.

2. CRITICAL CONSTRAINT:
   - The question MUST be grounded in the candidate's actual resume items.
   - Do NOT ask generic textbook questions without tying them to their projects or technical background.
   - Keep the question conversational, professional, and clear for voice synthesis (no markdown formatting).
"""

    try:
        data = groq_service.call_json_llm(
            system_prompt=INTERVIEWER_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=1500
        )
        return QuestionItem(
            id=next_id,
            question=data.get("question", "Could you elaborate on how you designed the data flow and handled potential concurrency bottlenecks in your projects?"),
            category=data.get("category", "Technical"),
            topic=data.get("topic", current_round.get("topics", ["System Architecture"])[0]),
            difficulty=data.get("difficulty", session.difficulty),
            is_follow_up=data.get("is_follow_up", False),
            follow_up_to_id=session.turns[-1].question.id if data.get("is_follow_up") and session.turns else None,
            target_skill_or_project=data.get("target_skill_or_project", ""),
            context_hint=data.get("context_hint", f"Adaptive question tailored to resume and {target_company}"),
            round_name=data.get("round_name", current_round.get("name", "Interview Round"))
        )
    except Exception as e:
        logger.error(f"Groq next question generation failed: {e}")
        raise RuntimeError(f"Failed to generate question #{next_id} with Groq: {str(e)}. Please check your Groq API key and network connection.")


