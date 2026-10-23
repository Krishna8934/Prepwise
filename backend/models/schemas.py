from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
import time

class ProjectItem(BaseModel):
    title: str = ""
    tech_stack: List[str] = Field(default_factory=list)
    description: str = ""
    key_achievements: List[str] = Field(default_factory=list)

class WorkExperienceItem(BaseModel):
    company: str = ""
    role: str = ""
    duration: str = ""
    highlights: List[str] = Field(default_factory=list)

class CandidateProfile(BaseModel):
    name: Optional[str] = "Candidate"
    education: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    programming_languages: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    work_experience: List[WorkExperienceItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    expertise_areas: List[str] = Field(default_factory=list)
    suggested_topics: List[str] = Field(default_factory=list)
    summary: str = ""

class ResumeUploadResponse(BaseModel):
    success: bool
    candidate_profile: CandidateProfile
    resume_text_preview: str
    message: str = "Resume parsed and analyzed successfully."

class InterviewCreateRequest(BaseModel):
    candidate_profile: CandidateProfile
    resume_text: Optional[str] = ""
    interview_type: Literal["Technical", "HR", "Mixed"] = "Mixed"
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"
    total_questions: int = Field(default=10, ge=3, le=20)
    target_company: Optional[str] = "General"

class QuestionItem(BaseModel):
    id: int
    question: str
    category: str = "Technical"
    topic: str = "General"
    difficulty: str = "Medium"
    is_follow_up: bool = False
    follow_up_to_id: Optional[int] = None
    target_skill_or_project: Optional[str] = None
    context_hint: Optional[str] = None
    round_name: Optional[str] = None

class AnswerSubmitRequest(BaseModel):
    answer_text: str
    response_time_seconds: Optional[float] = None
    is_retry: bool = False
    previous_score: Optional[int] = None

class AnswerEvaluation(BaseModel):
    technical_score: int = Field(ge=1, le=10, default=7)
    relevance_score: int = Field(ge=1, le=10, default=8)
    depth_score: int = Field(ge=1, le=10, default=7)
    communication_score: int = Field(ge=1, le=10, default=8)
    confidence_score: int = Field(ge=1, le=10, default=8)
    feedback: str = ""
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    decision: Literal["follow_up", "next_topic", "increase_difficulty", "decrease_difficulty"] = "next_topic"
    follow_up_reason: Optional[str] = None
    # Communication drill & retry fields
    filler_words_detected: List[str] = Field(default_factory=list)
    communication_feedback: str = ""
    better_answer_structure: str = ""
    is_retry: bool = False
    previous_communication_score: Optional[int] = None
    communication_improvement: Optional[int] = None

class TurnRecord(BaseModel):
    question: QuestionItem
    answer: Optional[str] = None
    evaluation: Optional[AnswerEvaluation] = None
    timestamp: float = Field(default_factory=time.time)
    retry_history: List[Dict[str, Any]] = Field(default_factory=list)

class InterviewSessionState(BaseModel):
    session_id: str
    candidate_profile: CandidateProfile
    resume_text: str
    interview_type: str
    difficulty: str
    total_questions: int
    current_question_index: int
    target_company: Optional[str] = "General"
    status: Literal["created", "in_progress", "completed"] = "in_progress"
    turns: List[TurnRecord] = Field(default_factory=list)
    topics_covered: List[str] = Field(default_factory=list)
    current_question: Optional[QuestionItem] = None
    created_at: float = Field(default_factory=time.time)

class CategoryScores(BaseModel):
    technical_knowledge: int = 80
    problem_solving: int = 80
    communication: int = 85
    relevance: int = 85
    answer_depth: int = 75
    confidence: int = 80

class QuestionReviewItem(BaseModel):
    question_number: int
    question: str
    category: str
    topic: str
    is_follow_up: bool = False
    answer: str
    score: int
    feedback: str
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    communication_score: Optional[int] = None
    filler_words_detected: List[str] = Field(default_factory=list)
    better_answer_structure: Optional[str] = None

class RecommendedTopic(BaseModel):
    topic: str
    reason: str
    recommended_action: str

class InterviewReport(BaseModel):
    session_id: str
    candidate_name: str
    target_company: str = "General"
    interview_type: str
    difficulty: str
    overall_score: int
    readiness_verdict: str
    summary: str
    category_scores: CategoryScores
    strengths: List[str]
    improvement_areas: List[str]
    recommended_topics: List[RecommendedTopic]
    question_reviews: List[QuestionReviewItem]
    total_questions_answered: int
    completed_at: str
    company_prep_plan: Optional[Dict[str, Any]] = None

class NextQuestionResponse(BaseModel):
    session_id: str
    current_question_index: int
    total_questions: int
    question: QuestionItem
    is_completed: bool = False
    previous_evaluation: Optional[AnswerEvaluation] = None
    message: str = "Question retrieved successfully"

class RetryAnswerRequest(BaseModel):
    answer_text: str
    response_time_seconds: Optional[float] = None
    previous_score: Optional[int] = None

class RetryAnswerResponse(BaseModel):
    session_id: str
    evaluation: AnswerEvaluation
    improved: bool = False
    improvement_points: int = 0
    message: str = "Retry evaluated successfully"

class InterviewHistoryItem(BaseModel):
    session_id: str
    candidate_name: str
    target_company: str = "General"
    interview_type: str
    difficulty: str
    overall_score: int
    readiness_verdict: str
    completed_at: str
    total_questions: int
    weak_topics: List[str] = Field(default_factory=list)

class InterviewHistoryResponse(BaseModel):
    history: List[InterviewHistoryItem] = Field(default_factory=list)
    last_score: Optional[int] = None
    current_score: Optional[int] = None
    improvement_trend: Optional[int] = None
    recurring_weak_topics: List[str] = Field(default_factory=list)
