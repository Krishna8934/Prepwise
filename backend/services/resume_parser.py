import logging
from typing import Dict, Any, List
try:
    from backend.models.schemas import CandidateProfile, ProjectItem, WorkExperienceItem
    from backend.services.groq_service import groq_service
except ImportError:
    from models.schemas import CandidateProfile, ProjectItem, WorkExperienceItem
    from services.groq_service import groq_service

logger = logging.getLogger(__name__)

RESUME_ANALYZER_SYSTEM_PROMPT = """You are an elite technical recruiter and principal engineering interviewer analyzing a candidate's resume for an intensive technical interview.

Extract structured information with MAXIMUM precision and depth from the provided resume text. Do NOT invent fake data; faithfully extract what is in the resume. If specific fields are not mentioned, leave them as empty lists.

CRITICAL EXTRACTION GUIDELINES:
1. "name": Extract the candidate's exact full name (usually at the very top).
2. "programming_languages": List every language explicitly mentioned (e.g. Python, Java, Go, TypeScript, C++, SQL, Rust, etc.).
3. "frameworks": List all libraries & frameworks (e.g. React, Next.js, FastAPI, Spring Boot, Node.js, Django, PyTorch, Tailwind, Express).
4. "skills": Extract ALL technical skills including databases (PostgreSQL, MongoDB, Redis), cloud & DevOps (Docker, Kubernetes, AWS, CI/CD, Kafka), architectures (Microservices, REST, GraphQL, System Design, Concurrency), and tools.
5. "projects": Extract ALL actual projects mentioned in the resume. For each project:
   - "title": Exact title of the project.
   - "tech_stack": Exact languages, frameworks, and databases used for that specific project.
   - "description": Comprehensive explanation of what the project actually does, its core architecture, and its primary purpose.
   - "key_achievements": Every specific bullet point, quantitative metric (e.g. 'reduced latency by 45%', 'handled 5k req/s'), architectural decision (e.g. 'implemented distributed locks with Redis', 'designed JWT authentication'), or feature built.
6. "work_experience": Extract every company, role, dates/duration, and detailed technical highlights/impact.
7. "education": Degrees, university names, graduation years, GPA/percentages if present.
8. "certifications": Any certifications or licenses found.
9. "expertise_areas": Key technical domains (e.g. Distributed Systems, Frontend Engineering, Machine Learning Inference, Cloud Architecture).
10. "suggested_topics": Generate 5 to 7 specific, highly technical interview discussion topics DIRECTLY referencing their specific projects, architectural decisions, and metric claims that an interviewer should challenge.
11. "summary": A compelling, factual 2-3 sentence executive summary of this candidate's genuine background and technical strengths.

Return ONLY a valid JSON object matching this schema:
{
  "name": "Candidate Name",
  "education": ["Degree, University"],
  "skills": ["Skill1", "Skill2"],
  "programming_languages": ["Language1", "Language2"],
  "frameworks": ["Framework1", "Framework2"],
  "projects": [
    {
      "title": "Exact Project Title",
      "tech_stack": ["Tech1", "Tech2"],
      "description": "Thorough description of what was built and how it functions.",
      "key_achievements": ["Specific achievement or architecture detail 1", "Metric or feature 2"]
    }
  ],
  "work_experience": [
    {
      "company": "Company Name",
      "role": "Role / Title",
      "duration": "Dates / Duration",
      "highlights": ["Impact 1", "Impact 2"]
    }
  ],
  "certifications": ["Cert 1"],
  "expertise_areas": ["Domain 1", "Domain 2"],
  "suggested_topics": [
    "Probing question or architecture trade-off for Project 1",
    "Specific edge-case or performance claim to test"
  ],
  "summary": "Concise executive summary of candidate background."
}
"""

def parse_resume_with_llm(resume_text: str) -> CandidateProfile:
    """Analyze resume text with Groq LLM. Strictly requires active Groq API Key."""
    if not groq_service.is_configured():
        raise ValueError(
            "Groq API key is not configured. An active Groq API key is required to analyze your resume with real AI. "
            "Please provide your Groq API key in the API Key settings or set GROQ_API_KEY in backend/.env."
        )

    try:
        user_prompt = f"Analyze the following candidate resume text and extract all technical details with high fidelity:\n\n{resume_text[:12000]}"
        data = groq_service.call_json_llm(
            system_prompt=RESUME_ANALYZER_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.1,
            max_tokens=3000
        )
        
        projects = []
        for p in data.get("projects", []):
            if isinstance(p, dict):
                projects.append(ProjectItem(
                    title=p.get("title", "Project"),
                    tech_stack=p.get("tech_stack", []) if isinstance(p.get("tech_stack"), list) else [str(p.get("tech_stack"))],
                    description=p.get("description", ""),
                    key_achievements=p.get("key_achievements", []) if isinstance(p.get("key_achievements"), list) else [str(p.get("key_achievements"))]
                ))
            elif isinstance(p, str):
                projects.append(ProjectItem(title=p, description=p))

        work_exp = []
        for w in data.get("work_experience", []):
            if isinstance(w, dict):
                work_exp.append(WorkExperienceItem(
                    company=w.get("company", "Company"),
                    role=w.get("role", "Engineer"),
                    duration=w.get("duration", ""),
                    highlights=w.get("highlights", []) if isinstance(w.get("highlights"), list) else [str(w.get("highlights"))]
                ))
            elif isinstance(w, str):
                work_exp.append(WorkExperienceItem(company=w, highlights=[w]))

        return CandidateProfile(
            name=data.get("name") or "Candidate",
            education=data.get("education", []),
            skills=data.get("skills", []),
            programming_languages=data.get("programming_languages", []),
            frameworks=data.get("frameworks", []),
            projects=projects,
            work_experience=work_exp,
            certifications=data.get("certifications", []),
            expertise_areas=data.get("expertise_areas", []),
            suggested_topics=data.get("suggested_topics", []),
            summary=data.get("summary") or "Technical candidate with hands-on software development experience."
        )
    except Exception as e:
        logger.error(f"Groq resume analysis failed: {e}")
        raise RuntimeError(f"Failed to analyze resume with Groq AI: {str(e)}. Please check your Groq API key and network connection.")

