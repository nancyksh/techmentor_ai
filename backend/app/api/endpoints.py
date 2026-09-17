import logging
import os
import subprocess
import sys
import tempfile
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.digital_twin import DigitalTwin
from app.schemas.schemas import (
    UserCreate, UserResponse, DigitalTwinResponse,
    InterviewEvaluationRequest, InterviewEvaluationResponse,
    CodingEvaluationRequest, CodingEvaluationResponse,
    CodeExecutionRequest, CodeExecutionResponse,
    CodeDebugRequest, CodeDebugResponse,
    QuestionGenerationRequest, QuestionGenerationResponse,
    QuizTutorRequest, QuizTutorResponse,
)
from app.services.llm import LLMError, complete_json

logger = logging.getLogger(__name__)
router = APIRouter()

AI_UNAVAILABLE = "The AI service is unavailable right now. Please try again in a moment."


def ask_llm(system_prompt: str, user_prompt: str, temperature: float) -> dict:
    """Call the LLM; log the real cause server-side and give the client a clean 502."""
    try:
        return complete_json(system_prompt, user_prompt, temperature)
    except LLMError:
        logger.exception("LLM request failed")
        raise HTTPException(status_code=502, detail=AI_UNAVAILABLE)


# ---------- Users ----------

@router.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(name=user.name, email=user.email)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Every user starts with an empty Digital Twin
    db.add(DigitalTwin(user_id=new_user.id))
    await db.commit()

    return new_user


@router.get("/users/{user_id}/digital-twin", response_model=DigitalTwinResponse)
async def get_digital_twin(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DigitalTwin).where(DigitalTwin.user_id == user_id))
    twin = result.scalars().first()
    if not twin:
        raise HTTPException(status_code=404, detail="Digital Twin not found")
    return twin


# ---------- Mock interview ----------

INTERVIEW_PROMPT = """You are a master AI orchestration system managing a technical interview panel consisting of a Tech Lead, an HR Manager, and a Recruiter.
You must evaluate the candidate's answer to the current question and return a JSON object with EXACTLY these keys:
- "review": The Tech Lead's technical feedback on the answer. Be sharp and analytical. If the answer is just "hi", nonsense, or avoids the question, call them out professionally.
- "confidence": "High", "Medium", or "Low" based on how assured their answer sounds.
- "clarity": "High", "Medium", or "Low" based on their communication.
- "next_question": A relevant, dynamic follow-up technical question based on their answer (or lack thereof).
- "hr_review": Feedback from the HR Manager on their communication style and professionalism.
- "recruiter_review": Feedback from the Recruiter on their cultural fit and overall impression.

Return ONLY valid JSON. No markdown, no introduction."""


def _level(value) -> str:
    return value if value in ("High", "Medium", "Low") else "Medium"


@router.post("/interview/evaluate", response_model=InterviewEvaluationResponse)
def evaluate_interview(data: InterviewEvaluationRequest):
    result = ask_llm(
        INTERVIEW_PROMPT,
        f"Question asked: {data.question}\nCandidate's Answer: {data.answer}\nEvaluate this.",
        temperature=0.7,
    )
    return InterviewEvaluationResponse(
        review=str(result.get("review", "Unable to generate review.")),
        confidence=_level(result.get("confidence")),
        clarity=_level(result.get("clarity")),
        next_question=str(result.get("next_question", "Could you elaborate on that?")),
        hr_review=str(result.get("hr_review", "Communication noted.")),
        recruiter_review=str(result.get("recruiter_review", "Profile noted.")),
    )


# ---------- Coding room ----------

CODE_REVIEW_PROMPT = """You are a master AI orchestration system acting as a Tech Lead evaluating a candidate's code submission.
You must evaluate the candidate's code submission to the current problem and return a JSON object with EXACTLY these keys:
- "review": The Tech Lead's comprehensive technical feedback on the code. Be sharp and analytical. Reference specific lines, variables, or logic from their code to make the review highly tailored and suitable to their exact implementation. Look for bugs, algorithmic efficiency, syntax, naming conventions, code readability, and their overall problem-solving approach.
- "time_complexity": The Big-O time complexity of their code (e.g., O(N), O(N^2), etc.).
- "space_complexity": The Big-O space complexity of their code.
- "bugs_found": A string detailing any bugs found, or "None" if the code is perfect.

Return ONLY valid JSON. No markdown, no introduction."""


@router.post("/coding-room/evaluate", response_model=CodingEvaluationResponse)
def evaluate_coding(data: CodingEvaluationRequest):
    run_context = ""
    if data.stdout or data.stderr:
        run_context = (
            f"\nActual program output (stdout):\n{data.stdout or '(empty)'}"
            f"\nActual program error (stderr):\n{data.stderr or '(none)'}\n"
        )
    user_prompt = (
        f"Problem: {data.question}\nLanguage: {data.language}\nCandidate's Code:\n{data.code}\n{run_context}\n"
        "Evaluate this code, taking into account whether the actual output above correctly solves the stated problem."
    )
    result = ask_llm(CODE_REVIEW_PROMPT, user_prompt, temperature=0.2)
    return CodingEvaluationResponse(
        review=str(result.get("review", "Unable to generate review.")),
        time_complexity=str(result.get("time_complexity", "Unknown")),
        space_complexity=str(result.get("space_complexity", "Unknown")),
        bugs_found=str(result.get("bugs_found", "None")),
    )


RUNNERS = {
    "python": {"ext": ".py", "cmd": [sys.executable, "-I"]},  # -I: ignore PYTHON* env vars and user site-packages
    "javascript": {"ext": ".js", "cmd": ["node"]},
}
RUN_TIMEOUT_SECONDS = 5
MAX_OUTPUT_CHARS = 10_000


def _truncate(text: str) -> str:
    if len(text) <= MAX_OUTPUT_CHARS:
        return text
    return text[:MAX_OUTPUT_CHARS] + f"\n... output truncated after {MAX_OUTPUT_CHARS} characters"


@router.post("/coding-room/execute", response_model=CodeExecutionResponse)
def execute_code(data: CodeExecutionRequest):
    runner = RUNNERS.get(data.language)
    if runner is None:
        return CodeExecutionResponse(
            stdout="",
            stderr=f"Running {data.language} code isn't supported yet. You can still submit it for AI review.",
            exit_code=1,
            execution_time_ms=0.0,
        )

    with tempfile.TemporaryDirectory() as workdir:
        path = os.path.join(workdir, "main" + runner["ext"])
        with open(path, "w", encoding="utf-8") as f:
            f.write(data.code)

        # Submitted code must never see the server's environment (it holds GROQ_API_KEY),
        # so the child process gets only the minimum it needs to start.
        safe_env = {"PATH": os.environ.get("PATH", ""), "PYTHONIOENCODING": "utf-8"}
        if os.name == "nt":
            safe_env["SYSTEMROOT"] = os.environ.get("SYSTEMROOT", "")

        start = time.perf_counter()
        try:
            process = subprocess.run(
                runner["cmd"] + [path],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=RUN_TIMEOUT_SECONDS,
                cwd=workdir,
                env=safe_env,
            )
        except subprocess.TimeoutExpired:
            return CodeExecutionResponse(
                stdout="",
                stderr=f"Execution timed out after {RUN_TIMEOUT_SECONDS} seconds. Check for an infinite loop.",
                exit_code=124,
                execution_time_ms=RUN_TIMEOUT_SECONDS * 1000.0,
            )
        except FileNotFoundError:
            return CodeExecutionResponse(
                stdout="",
                stderr=f"The {data.language} runtime isn't installed on this server.",
                exit_code=127,
                execution_time_ms=0.0,
            )

        return CodeExecutionResponse(
            stdout=_truncate(process.stdout),
            stderr=_truncate(process.stderr),
            exit_code=process.returncode,
            execution_time_ms=round((time.perf_counter() - start) * 1000, 2),
        )


DEBUG_PROMPT = """You are an expert AI debugger. Analyze the provided code, language, and error message.
Return a JSON object with EXACTLY these keys:
- "explanation": A clear, concise explanation of why the error occurred.
- "fixed_code": The complete corrected code.

Return ONLY valid JSON. No markdown, no introduction."""


@router.post("/coding-room/debug", response_model=CodeDebugResponse)
def debug_code(data: CodeDebugRequest):
    result = ask_llm(
        DEBUG_PROMPT,
        f"Language: {data.language}\nCode:\n{data.code}\n\nError:\n{data.error}\n\nDebug and fix this code.",
        temperature=0.2,
    )
    return CodeDebugResponse(
        explanation=str(result.get("explanation", "Unable to generate explanation.")),
        fixed_code=str(result.get("fixed_code", data.code)),
    )


QUESTION_PROMPT = """You are an expert technical interviewer and AI Professor.
Generate a coding problem for a candidate based on the requested subject and difficulty.
Return a JSON object with EXACTLY these keys:
- "question_text": A clear, concise problem statement with examples.
- "starter_code": A dictionary containing the starter code templates for the following languages: "python", "javascript", "cpp", "java". The code should just be the function signature/definition with a comment, and any necessary class wrappers for Java/C++.

Return ONLY valid JSON. No markdown, no introduction."""

DEFAULT_STARTER_CODE = {
    "python": "def solution():\n    pass",
    "javascript": "function solution() {\n    // Write your code here\n}",
    "cpp": "#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};",
    "java": "class Solution {\n    public void solve() {\n        \n    }\n}",
}


@router.post("/coding-room/generate-question", response_model=QuestionGenerationResponse)
def generate_question(data: QuestionGenerationRequest):
    result = ask_llm(
        QUESTION_PROMPT,
        f"Subject: {data.subject}\nDifficulty: {data.difficulty}\nGenerate a question.",
        temperature=0.7,
    )
    returned = result.get("starter_code")
    returned = returned if isinstance(returned, dict) else {}
    # Fall back to a generic template for any language the model left out
    starter_code = {
        lang: str(returned.get(lang) or default) for lang, default in DEFAULT_STARTER_CODE.items()
    }
    return QuestionGenerationResponse(
        question_text=str(result.get("question_text", "Failed to generate question text.")),
        starter_code=starter_code,
    )


# ---------- Adaptive quiz tutor ----------

MISSION_GUIDANCE = {
    "Learning Mission": "Focus on teaching-style questions that build foundational understanding step by step. Favor 'what is' and 'how does X work' questions, and gently correct misconceptions in your follow-ups.",
    "Interview Mission": "Ask questions in the style of a technical interviewer assessing job-readiness: problem-solving, trade-offs, and real-world application scenarios, similar to what a hiring panel would ask.",
    "Revision Mission": "Treat this as a rapid-fire recap for someone who has already studied the topic. Ask concise recall and clarification questions covering key facts, rather than teaching from scratch.",
    "Skill Gap Mission": "Probe specifically for weaknesses. Ask pointed, slightly harder questions designed to surface what the candidate does NOT know, and drill into any shaky answers with a tougher follow-up.",
    "Placement Preparation Mission": "Simulate placement-test style questions: a mix of conceptual depth and applied problem-solving, similar to campus recruitment technical rounds, with an emphasis on practical readiness.",
}
QUIZ_LENGTH = 2


def _clamp_delta(value) -> int:
    try:
        return max(-5, min(5, int(value)))
    except (TypeError, ValueError):
        return 0


@router.post("/quiz-tutor/respond", response_model=QuizTutorResponse)
def quiz_tutor_respond(data: QuizTutorRequest):
    mission_focus = MISSION_GUIDANCE.get(data.mission_type, MISSION_GUIDANCE["Learning Mission"])
    answers_so_far = sum(1 for turn in data.history if turn.get("role") == "user") + 1
    is_final_question = answers_so_far >= QUIZ_LENGTH

    finished_instruction = (
        "true, since this is your reply to their 2nd and final answer — conclude the assessment now."
        if is_final_question
        else "false, since one more question remains after this."
    )
    system_prompt = f"""You are NOVA, an adaptive AI tutor running a short baseline assessment quiz on a technical topic.
The current mission profile is "{data.mission_type}". {mission_focus}
The assessment is intentionally short: only 2 questions total. Every question you ask must be substantive and detailed (2-3 sentences, with context or a concrete scenario where relevant) — never a short one-line question, since there is no room for a quick warm-up.
Return a JSON object with EXACTLY these keys:
- "reply": Your next message to the candidate. If the assessment isn't finished, ask a detailed, well-developed follow-up question about the topic that matches the mission profile's style, based on their answer. If finished, give a thorough summary of their readiness, referencing both of their answers.
- "readiness_delta": An integer from -5 to 5 reflecting how much their last answer should move their readiness score (negative for weak/incorrect answers, positive for strong ones, 0 if neutral).
- "is_finished": {finished_instruction}

Return ONLY valid JSON. No markdown, no introduction."""

    history_text = "\n".join(f"{turn.get('role', 'user')}: {turn.get('content', '')}" for turn in data.history)
    user_prompt = (
        f"Topic: {data.topic}\nMission Profile: {data.mission_type}\n"
        f"This is answer #{answers_so_far} of {QUIZ_LENGTH}.\nConversation so far:\n{history_text}\n\n"
        f"Candidate's latest answer: {data.answer}\n\nRespond as NOVA."
    )
    result = ask_llm(system_prompt, user_prompt, temperature=0.6)
    return QuizTutorResponse(
        reply=str(result.get("reply", "Could you elaborate further?")),
        readiness_delta=_clamp_delta(result.get("readiness_delta", 0)),
        # The server decides when the quiz ends so the model can't cut it short or drag it on
        is_finished=is_final_question,
    )
