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

INTERVIEWER_SYSTEM_PROMPT = """You are an elite, insightful AI interviewer conducting a real-time mock interview for Prepwise.
Your goal is to conduct a natural, rigorous, and highly personalized interview.

Key Guidelines:
1. ALWAYS base your questions on the candidate's actual resume (projects, tech stack, experience claims, education).
2. Incorporate the selected Target Company pattern (e.g. TCS emphasizes OOP/DBMS/flexibility; Amazon emphasizes Leadership Principles & scale; Infosys emphasizes logic/pseudocode; Accenture emphasizes cloud/agile).
3. Ask ONE focused question at a time.
4. Keep the question phrasing natural, direct, and conversational (it will be spoken aloud via Text-to-Speech). Avoid markdown bullets or formatting in the question string.
5. Adapt dynamically:
   - If the candidate's last answer was shallow or made an interesting technical claim, ask a deep follow-up probing trade-offs, architecture, or edge cases.
   - If the candidate answered thoroughly or already had follow-ups on the same topic, transition smoothly to a new skill/project/behavioral topic according to the company's round progression.
   - For Technical interviews: Focus on system architecture, algorithms, coding concepts, data modeling, optimization, and project trade-offs.
   - For HR interviews: Focus on behavioral STAR method questions, leadership, teamwork, handling conflicts, career trajectory.
   - For Mixed interviews: Balance technical deep dives, core CS, and situational/behavioral questions.
6. Challenge exaggerated claims respectfully.
7. Match the requested difficulty (Easy / Medium / Hard).

Return ONLY a JSON object:
{
  "question": "The spoken interview question",
  "category": "Technical" | "System Design" | "Project Deep Dive" | "Behavioral" | "Problem Solving" | "Aptitude / Logic",
  "topic": "Short name of the specific topic being tested",
  "is_follow_up": true | false,
  "difficulty": "Easy" | "Medium" | "Hard",
  "target_skill_or_project": "The specific item from their resume being targeted",
  "context_hint": "Brief internal rationale for why this question was chosen",
  "round_name": "e.g. Round 1: Core CS or Round 2: Project Discussion"
}
"""

def generate_first_question(
    profile: CandidateProfile,
    interview_type: str,
    difficulty: str,
    target_company: str = "General",
) -> QuestionItem:
    """Generate the opening interview question tailored to the candidate and target company."""
    company_plan = get_company_plan(target_company)
    
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
Target Company: {target_company}
Company Preparation Pattern: {company_plan.get('tagline')} - {company_plan.get('overview')}
Company Focus Areas: {company_plan.get('key_focus_areas')}
Interview Type: {interview_type}
Difficulty: {difficulty}

Candidate Profile:
{profile_summary}

Generate the opening question (Question 1) matching the {target_company} interview style:
- If TCS: Begin with a polite greeting and explore how their resume project incorporates Core OOP concepts or database design.
- If Amazon: Begin with a warm greeting and ask a project question that tests ownership and technical decision-making (Customer Obsession/Ownership).
- If Infosys: Begin with an introductory project walk-through focusing on algorithmic logic or core programming concepts.
- If Accenture: Begin with their project architecture and how it solves real-world user or client needs.
- If Startup: Begin with the biggest technical problem they had to solve quickly with minimal guidance.
- If General: Warm-up regarding top project architecture.
"""
            data = groq_service.call_json_llm(
                system_prompt=INTERVIEWER_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.4
            )
            return QuestionItem(
                id=1,
                question=data.get("question", f"Hello {profile.name.split()[0] if profile.name else 'there'}, welcome to your {target_company} mock interview with Prepwise. To start off, could you briefly introduce yourself and walk me through your most impactful project?"),
                category=data.get("category", "Introduction"),
                topic=data.get("topic", "Candidate Background"),
                difficulty=difficulty,
                is_follow_up=False,
                target_skill_or_project=data.get("target_skill_or_project", "Overview"),
                context_hint=data.get("context_hint", f"Opening {target_company} interview question"),
                round_name=data.get("round_name", company_plan.get("rounds", [{}])[0].get("name", "Round 1: Screening"))
            )
        except Exception as e:
            logger.warning(f"Groq first question generation failed: {e}. Using fallback.")

    # Intelligent deterministic fallback
    first_name = profile.name.split()[0] if profile.name and profile.name != "Candidate" else "there"
    top_project = profile.projects[0].title if profile.projects else "your recent technical work"
    top_lang = profile.programming_languages[0] if profile.programming_languages else "software development"
    
    if target_company == "TCS":
        q_text = f"Hello {first_name}, welcome to your TCS placement interview with Prepwise. To begin, could you introduce yourself and explain how you applied Object-Oriented principles like inheritance and encapsulation in '{top_project}'?"
        cat = "Project Deep Dive"
        top = "OOP in Project"
    elif target_company == "Amazon":
        q_text = f"Hello {first_name}, welcome to your Amazon SDE mock interview. Let's start with ownership: walk me through '{top_project}'. What was your specific architectural contribution, and what trade-offs did you make to ensure scalability?"
        cat = "Project Deep Dive"
        top = "Ownership & Architecture"
    elif target_company == "Infosys":
        q_text = f"Hello {first_name}, welcome to your Infosys technical interview. Looking at your resume, you built '{top_project}' with {top_lang}. Could you walk me through the primary data structures and database schema you designed for it?"
        cat = "Technical"
        top = "Data Structures & DB"
    elif target_company == "Accenture":
        q_text = f"Hello {first_name}, welcome to your Accenture mock interview. In your project '{top_project}', what modern web architecture or APIs did you use, and how did you ensure a seamless experience for end users?"
        cat = "Technical"
        top = "API & Architecture"
    elif target_company == "Startup":
        q_text = f"Hey {first_name}, welcome to Prepwise. In a fast-moving startup environment, shipping high quality code fast is key. In '{top_project}', what was the hardest bug or bottleneck you had to debug, and how did you resolve it?"
        cat = "Problem Solving"
        top = "Rapid Debugging"
    elif interview_type == "HR":
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
        context_hint=f"{target_company} interview opening baseline",
        round_name=company_plan.get("rounds", [{}])[0].get("name", "Round 1")
    )

def generate_next_question(
    session: InterviewSessionState,
    latest_evaluation: Optional[AnswerEvaluation] = None,
) -> QuestionItem:
    """Generate the next adaptive question based on past turns, evaluation, and company rounds."""
    next_id = session.current_question_index + 1
    target_company = session.target_company or "General"
    company_plan = get_company_plan(target_company)
    rounds = company_plan.get("rounds", [])
    
    # Determine current round based on progress
    total_q = max(session.total_questions, 1)
    if next_id <= max(1, total_q // 3):
        current_round = rounds[0] if len(rounds) > 0 else {"name": "Round 1: Screening"}
    elif next_id <= max(2, (2 * total_q) // 3):
        current_round = rounds[1] if len(rounds) > 1 else (rounds[0] if rounds else {"name": "Round 2: Technical"})
    else:
        current_round = rounds[2] if len(rounds) > 2 else (rounds[-1] if rounds else {"name": "Round 3: Behavioral"})

    if groq_service.is_configured():
        try:
            # Build conversation history
            history_lines = []
            for idx, turn in enumerate(session.turns, 1):
                ans = turn.answer or "[No answer]"
                eval_str = f"(Score: Tech={turn.evaluation.technical_score if turn.evaluation else 'N/A'}/10, Comm={turn.evaluation.communication_score if turn.evaluation else 'N/A'}/10)" if turn.evaluation else ""
                history_lines.append(f"Q{idx} ({turn.question.category} - {turn.question.topic}): {turn.question.question}")
                history_lines.append(f"A{idx}: {ans} {eval_str}")
            
            history_text = "\n".join(history_lines)
            
            # Check consecutive follow-ups
            recent_follow_ups = 0
            for turn in reversed(session.turns):
                if turn.question.is_follow_up:
                    recent_follow_ups += 1
                else:
                    break

            user_prompt = f"""
Candidate Name: {session.candidate_profile.name}
Target Company: {target_company}
Company Pattern: {company_plan.get('tagline')}
Current Target Round: {current_round.get('name')} (Focus: {', '.join(current_round.get('topics', []))})
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
- Communication Score: {latest_evaluation.communication_score if latest_evaluation else 'N/A'}/10

Instruction:
Generate Question #{next_id}.
- Match the {target_company} interview rounds (e.g. for TCS probe core CS/OOP/DBMS or project roles; for Amazon probe Leadership Principles with STAR context or high-scale system design; for Infosys probe logic/normalization).
- If consecutive follow-ups >= 2 OR decision is 'next_topic', you MUST transition to a different skill/project/topic from their resume or the company round focus.
- If decision is 'follow_up' and consecutive follow-ups < 2, ask a sharp, probing follow-up targeting specific nuances or edge cases of their previous answer.
- Ensure the question is direct, professional, conversational, and clear.
"""
            data = groq_service.call_json_llm(
                system_prompt=INTERVIEWER_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.4
            )
            return QuestionItem(
                id=next_id,
                question=data.get("question", f"Could you elaborate on how you handle scalability, database indexing, and error handling in your projects?"),
                category=data.get("category", "Technical"),
                topic=data.get("topic", current_round.get("topics", ["System Architecture"])[0]),
                difficulty=data.get("difficulty", session.difficulty),
                is_follow_up=data.get("is_follow_up", False),
                follow_up_to_id=session.turns[-1].question.id if data.get("is_follow_up") and session.turns else None,
                target_skill_or_project=data.get("target_skill_or_project", ""),
                context_hint=data.get("context_hint", f"Adaptive {target_company} question"),
                round_name=data.get("round_name", current_round.get("name", "Interview Round"))
            )
        except Exception as e:
            logger.warning(f"Groq next question generation failed: {e}. Using fallback.")

    # Deterministic fallback engine
    return _heuristic_next_question(session, next_id, latest_evaluation, current_round)

def _heuristic_next_question(
    session: InterviewSessionState,
    next_id: int,
    latest_evaluation: Optional[AnswerEvaluation],
    current_round: Optional[Dict[str, Any]] = None
) -> QuestionItem:
    """Fallback question generation with company-specific tracks and progressive difficulty."""
    p = session.candidate_profile
    turns_count = len(session.turns)
    target_company = session.target_company or "General"
    round_label = current_round.get("name", "Technical Round") if current_round else "Technical Round"
    
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
            context_hint="Follow-up probing performance trade-offs",
            round_name=round_label
        )

    # Company specific tailored question banks
    if target_company == "TCS":
        tcs_bank = [
            ("In Object-Oriented Programming, can you explain the core difference between Abstract Classes and Interfaces, and give an example of where you would use each?", "Technical", "OOP Concepts"),
            ("In database management systems, what is the difference between an INNER JOIN, LEFT JOIN, and FULL OUTER JOIN, and why is indexing important on foreign keys?", "Technical", "DBMS & SQL"),
            (f"In your project '{p.projects[0].title if p.projects else 'software application'}', how did you organize your code into modular layers or packages?", "Project Deep Dive", "Project Architecture"),
            ("At TCS, project requirements can evolve rapidly, and engineers often collaborate across different global locations. Tell me about a time you had to adapt quickly to an unexpected technical change.", "Behavioral", "Adaptability & Flexibility"),
            ("Can you explain how memory management and garbage collection work in modern languages, and what causes a memory leak?", "Technical", "Memory & Performance")
        ]
        q_text, cat, top = tcs_bank[turns_count % len(tcs_bank)]
    elif target_company == "Amazon":
        amazon_bank = [
            ("Amazon Leadership Principle - Customer Obsession: Tell me about a time when you had to make a tough technical compromise to ensure the end customer experienced zero downtime or degradation.", "Behavioral", "Customer Obsession"),
            ("How would you design a distributed cache like Redis or Memcached? Specifically, what cache eviction strategies (LRU, LFU) and consistent hashing mechanisms would you use?", "System Design", "Distributed Caching"),
            ("Amazon Leadership Principle - Ownership: Describe a time when you saw a problem in a codebase or project that was outside your direct responsibility, but you stepped up and fixed it anyway.", "Behavioral", "Ownership"),
            ("What is the time and space complexity of searching, inserting, and deleting in an AVL tree versus a Hash Map, and how do you handle hash bucket collisions under high load?", "Technical", "Algorithms & Data Structures"),
            ("Amazon Leadership Principle - Bias for Action: Tell me about a time you had to make an important engineering decision with incomplete data. How did you assess the risks and what was the outcome?", "Behavioral", "Bias for Action")
        ]
        q_text, cat, top = amazon_bank[turns_count % len(amazon_bank)]
    elif target_company == "Infosys":
        infosys_bank = [
            ("Can you walk me through the steps to normalize an unnormalized database schema into 1NF, 2NF, and 3NF, and explain why functional dependencies matter?", "Technical", "DB Normalization"),
            ("In algorithmic problem solving, how do you approach finding two numbers in an array that add up to a target sum in O(n) time complexity?", "Problem Solving", "Array Algorithms"),
            (f"In your project '{p.projects[0].title if p.projects else 'development work'}', what testing strategies (unit tests, integration tests) did you implement to verify reliability?", "Technical", "Testing & QA"),
            ("Describe a situation where you had to learn a completely new framework or library under a tight university or project deadline. What was your learning methodology?", "Behavioral", "Learning Agility"),
            ("Explain the concept of multithreading and race conditions, and how mutexes or semaphores prevent concurrent data corruption.", "Technical", "Concurrency & Threads")
        ]
        q_text, cat, top = infosys_bank[turns_count % len(infosys_bank)]
    elif target_company == "Accenture":
        accenture_bank = [
            ("In cloud computing, what are the architectural distinctions between IaaS, PaaS, and Serverless, and how do microservices communicate via REST or message queues?", "Technical", "Cloud & Microservices"),
            (f"Looking at your experience with {p.programming_languages[0] if p.programming_languages else 'modern stacks'}, how do you structure API security with tokens (JWT) and HTTPS encryption?", "Technical", "API Security"),
            ("In Agile development, how do you participate in daily standups and sprint retrospectives, and how do you handle a situation where a dependency blocks your deliverable?", "Behavioral", "Agile Collaboration"),
            ("Describe a technical challenge from your resume where you had to explain a complex engineering issue to a non-technical peer or stakeholder.", "Behavioral", "Client Communication"),
            ("What is continuous integration and continuous deployment (CI/CD), and how do automated pipelines improve release reliability?", "Technical", "CI/CD & DevOps")
        ]
        q_text, cat, top = accenture_bank[turns_count % len(accenture_bank)]
    elif target_company == "Startup":
        startup_bank = [
            ("In an early-stage startup, speed of shipping is critical. In your projects, how do you decide when to take on technical debt versus when to invest in scalable architecture?", "Technical", "Pragmatic Architecture"),
            (f"In your project '{p.projects[0].title if p.projects else 'web application'}', walk me through your end-to-end debugging workflow when an API returns an intermittent 500 internal server error.", "Problem Solving", "Production Debugging"),
            ("Tell me about a time when a project requirement or specification changed completely midway through development. How did you pivot your implementation?", "Behavioral", "Handling Ambiguity"),
            ("If our application suddenly experienced a 10x traffic spike tomorrow, what is the single biggest bottleneck in your current architecture that would fail first, and how would you fix it?", "System Design", "Scalability Bottlenecks"),
            ("How do you approach database migrations and schema updates without causing downtime or breaking active client sessions?", "Technical", "Zero-Downtime Migrations")
        ]
        q_text, cat, top = startup_bank[turns_count % len(startup_bank)]
    else:
        general_bank = [
            (f"You listed {p.frameworks[0] if p.frameworks else 'modern frameworks'} on your resume. What architectural patterns do you rely on to manage state and maintain clean separation of concerns?", "Technical", "Architecture"),
            (f"In your project '{p.projects[0].title if p.projects else 'backend system'}', how did you approach database schema design, indexing, and preventing query bottlenecks?", "System Design", "Database & Performance"),
            ("Tell me about a time when you encountered a subtle or critical bug in production or during testing. What was your debugging methodology to pinpoint the root cause?", "Problem Solving", "Debugging Methodology"),
            ("When collaborating on a team with conflicting technical opinions on architecture or tooling, how do you navigate the discussion to reach consensus?", "Behavioral", "Team Consensus"),
            ("If you had to design a rate-limiting service capable of handling millions of requests per second, what data structures and caching mechanisms would you employ?", "System Design", "Distributed Rate Limiting")
        ]
        q_text, cat, top = general_bank[turns_count % len(general_bank)]

    return QuestionItem(
        id=next_id,
        question=q_text,
        category=cat,
        topic=top,
        difficulty=session.difficulty,
        is_follow_up=False,
        target_skill_or_project=top,
        context_hint=f"{target_company} round question",
        round_name=round_label
    )

