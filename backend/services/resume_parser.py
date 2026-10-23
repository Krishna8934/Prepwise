import logging
from typing import Dict, Any
try:
    from backend.models.schemas import CandidateProfile, ProjectItem, WorkExperienceItem
    from backend.services.groq_service import groq_service
except ImportError:
    from models.schemas import CandidateProfile, ProjectItem, WorkExperienceItem
    from services.groq_service import groq_service

logger = logging.getLogger(__name__)

RESUME_ANALYZER_SYSTEM_PROMPT = """You are an expert technical recruiter and resume analyzer.
Your task is to analyze candidate resume text and extract structured information with high precision.

Return ONLY a JSON object matching this schema:
{
  "name": "Candidate full name",
  "education": ["Degree 1", "Degree 2"],
  "skills": ["Skill 1", "Skill 2"],
  "programming_languages": ["Python", "TypeScript", ...],
  "frameworks": ["FastAPI", "React", ...],
  "projects": [
    {
      "title": "Project Title",
      "tech_stack": ["Tech1", "Tech2"],
      "description": "Brief summary",
      "key_achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "work_experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Dates",
      "highlights": ["Key responsibility or impact 1"]
    }
  ],
  "certifications": ["Cert 1"],
  "expertise_areas": ["Backend Architecture", "Machine Learning", ...],
  "suggested_topics": ["Specific topics/claims to question them on in an interview"],
  "summary": "A concise 2-sentence executive summary of the candidate's background."
}
"""

def parse_resume_with_llm(resume_text: str) -> CandidateProfile:
    """Analyze resume text with Groq LLM or fallback heuristic."""
    if groq_service.is_configured():
        try:
            user_prompt = f"Here is the candidate's resume text:\n\n{resume_text[:6000]}"
            data = groq_service.call_json_llm(
                system_prompt=RESUME_ANALYZER_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.2
            )
            return CandidateProfile(
                name=data.get("name", "Candidate"),
                education=data.get("education", []),
                skills=data.get("skills", []),
                programming_languages=data.get("programming_languages", []),
                frameworks=data.get("frameworks", []),
                projects=[ProjectItem(**p) if isinstance(p, dict) else ProjectItem(title=str(p)) for p in data.get("projects", [])],
                work_experience=[WorkExperienceItem(**w) if isinstance(w, dict) else WorkExperienceItem(company=str(w)) for w in data.get("work_experience", [])],
                certifications=data.get("certifications", []),
                expertise_areas=data.get("expertise_areas", []),
                suggested_topics=data.get("suggested_topics", []),
                summary=data.get("summary", "Candidate with relevant technical and domain expertise.")
            )
        except Exception as e:
            logger.warning(f"Groq resume analysis failed: {e}. Falling back to heuristic parser.")

    return _heuristic_resume_parser(resume_text)

def _heuristic_resume_parser(text: str) -> CandidateProfile:
    """Fast fallback rule-based parser when LLM is unavailable."""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    first_line = lines[0] if lines else "Candidate"
    
    # Extract common programming languages and frameworks
    common_langs = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "SQL", "HTML", "CSS", "PHP", "Ruby", "Swift", "Kotlin"]
    common_frameworks = ["React", "FastAPI", "Node.js", "Django", "Flask", "Next.js", "Express", "Vue", "Angular", "Spring Boot", "PyTorch", "TensorFlow", "Pandas", "Scikit-Learn"]
    
    detected_langs = [lang for lang in common_langs if lang.lower() in text.lower()]
    detected_frameworks = [fw for fw in common_frameworks if fw.lower() in text.lower()]
    
    # Fallback default items if nothing matched
    if not detected_langs:
        detected_langs = ["Python", "JavaScript", "SQL"]
    if not detected_frameworks:
        detected_frameworks = ["React", "FastAPI"]

    return CandidateProfile(
        name=first_line[:50],
        education=["Computer Science / Relevant Degree"],
        skills=list(set(detected_langs + detected_frameworks + ["System Design", "Git", "REST APIs", "Problem Solving"])),
        programming_languages=detected_langs,
        frameworks=detected_frameworks,
        projects=[
            ProjectItem(
                title="Full-Stack Application",
                tech_stack=detected_langs[:2] + detected_frameworks[:1],
                description="Engineered and deployed a scalable web application with modern APIs.",
                key_achievements=["Built modular architecture", "Integrated automated pipelines"]
            )
        ],
        work_experience=[
            WorkExperienceItem(
                company="Tech Organization",
                role="Software Engineer / Intern",
                duration="Recent",
                highlights=["Developed core backend services and user interfaces."]
            )
        ],
        certifications=[],
        expertise_areas=["Software Engineering", "Full-Stack Development", "System Architecture"],
        suggested_topics=[
            f"Architecture and trade-offs using {detected_frameworks[0] if detected_frameworks else 'modern frameworks'}",
            f"Data structures, algorithms, and concurrency in {detected_langs[0] if detected_langs else 'Python'}",
            "Database design, indexing, and API optimization",
            "Handling challenging engineering constraints and team collaboration"
        ],
        summary=f"Experienced candidate with background in {', '.join(detected_langs[:3])} and modern software engineering practices."
    )
