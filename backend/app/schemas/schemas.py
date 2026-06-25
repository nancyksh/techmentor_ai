from pydantic import BaseModel, EmailStr
from typing import Optional, Dict

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

class DigitalTwinBase(BaseModel):
    subject_mastery: Dict[str, float] = {}
    topic_mastery: Dict[str, float] = {}
    weakness_map: Dict[str, list] = {}
    placement_readiness_score: float = 0.0
    interview_readiness_score: float = 0.0

class DigitalTwinResponse(DigitalTwinBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class InterviewEvaluationRequest(BaseModel):
    question: str
    answer: str

class InterviewEvaluationResponse(BaseModel):
    review: str
    confidence: str
    clarity: str
    next_question: str
    hr_review: Optional[str] = None
    recruiter_review: Optional[str] = None

class CodingEvaluationRequest(BaseModel):
    question: str
    code: str
    language: str
    stdout: str = ""
    stderr: str = ""

class CodingEvaluationResponse(BaseModel):
    review: str
    time_complexity: str
    space_complexity: str
    bugs_found: str

class CodeExecutionRequest(BaseModel):
    code: str
    language: str

class CodeExecutionResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: float

class CodeDebugRequest(BaseModel):
    code: str
    language: str
    error: str

class CodeDebugResponse(BaseModel):
    explanation: str
    fixed_code: str

class QuestionGenerationRequest(BaseModel):
    subject: str
    difficulty: str = "Medium"

class QuestionGenerationResponse(BaseModel):
    question_text: str
    starter_code: Dict[str, str]
