from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional, Dict

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    role: str

    model_config = ConfigDict(from_attributes=True)

class DigitalTwinBase(BaseModel):
    subject_mastery: Dict[str, float] = {}
    topic_mastery: Dict[str, float] = {}
    weakness_map: Dict[str, list] = {}
    placement_readiness_score: float = 0.0
    interview_readiness_score: float = 0.0

class DigitalTwinResponse(DigitalTwinBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

# Length limits keep prompts (and Groq costs) bounded and reject abusive payloads early.
class InterviewEvaluationRequest(BaseModel):
    question: str = Field(max_length=4000)
    answer: str = Field(max_length=8000)

class InterviewEvaluationResponse(BaseModel):
    review: str
    confidence: str
    clarity: str
    next_question: str
    hr_review: Optional[str] = None
    recruiter_review: Optional[str] = None

class CodingEvaluationRequest(BaseModel):
    question: str = Field(max_length=8000)
    code: str = Field(max_length=20000)
    language: str = Field(max_length=20)
    stdout: str = Field(default="", max_length=20000)
    stderr: str = Field(default="", max_length=20000)

class CodingEvaluationResponse(BaseModel):
    review: str
    time_complexity: str
    space_complexity: str
    bugs_found: str

class CodeExecutionRequest(BaseModel):
    code: str = Field(max_length=20000)
    language: str = Field(max_length=20)

class CodeExecutionResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: float

class CodeDebugRequest(BaseModel):
    code: str = Field(max_length=20000)
    language: str = Field(max_length=20)
    error: str = Field(max_length=20000)

class CodeDebugResponse(BaseModel):
    explanation: str
    fixed_code: str

class QuestionGenerationRequest(BaseModel):
    subject: str = Field(max_length=200)
    difficulty: str = Field(default="Medium", max_length=20)

class QuestionGenerationResponse(BaseModel):
    question_text: str
    starter_code: Dict[str, str]

class QuizTutorRequest(BaseModel):
    topic: str = Field(max_length=300)
    mission_type: str = Field(default="Learning Mission", max_length=50)
    history: list[Dict[str, str]] = Field(default_factory=list, max_length=20)
    answer: str = Field(max_length=8000)

class QuizTutorResponse(BaseModel):
    reply: str
    readiness_delta: int
    is_finished: bool
