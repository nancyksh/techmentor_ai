from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.digital_twin import DigitalTwin
from app.schemas.schemas import UserCreate, UserResponse, DigitalTwinResponse, InterviewEvaluationRequest, InterviewEvaluationResponse, CodingEvaluationRequest, CodingEvaluationResponse, CodeExecutionRequest, CodeExecutionResponse, CodeDebugRequest, CodeDebugResponse, QuestionGenerationRequest, QuestionGenerationResponse, QuizTutorRequest, QuizTutorResponse
import sys
import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv

# Add the parent directory of backend to sys.path so we can import agents
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

router = APIRouter()

@router.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user.email))
    db_user = result.scalars().first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(name=user.name, email=user.email)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Create an initial Digital Twin for the new user
    new_twin = DigitalTwin(user_id=new_user.id)
    db.add(new_twin)
    await db.commit()
    
    return new_user

@router.get("/users/{user_id}/digital-twin", response_model=DigitalTwinResponse)
async def get_digital_twin(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DigitalTwin).where(DigitalTwin.user_id == user_id))
    twin = result.scalars().first()
    if not twin:
        raise HTTPException(status_code=404, detail="Digital Twin not found")
    return twin

@router.post("/trigger-autonomous-mode/{user_id}")
async def trigger_autonomous_mode(user_id: int, goal: str):
    # In a real scenario, LLM would be initialized with an API key
    # For now, we mock the LLM or require environment variables
    # We will instantiate the crew and kickoff the background process
    # Note: Long-running CrewAI tasks should normally be pushed to Celery/BackgroundTasks
    
    return {"message": f"Autonomous mode triggered for user {user_id} with goal: {goal}"}

@router.post("/interview/evaluate", response_model=InterviewEvaluationResponse)
def evaluate_interview(data: InterviewEvaluationRequest):
    try:
        import urllib.request
        import urllib.error
        
        # Load environment variables
        load_dotenv()
        
        # Initialize Groq client
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise Exception("GROQ_API_KEY not found in environment")
            
        system_prompt = """You are a master AI orchestration system managing a technical interview panel consisting of a Tech Lead, an HR Manager, and a Recruiter.
You must evaluate the candidate's answer to the current question and return a JSON object with EXACTLY these keys:
- "review": The Tech Lead's technical feedback on the answer. Be sharp and analytical. If the answer is just "hi", nonsense, or avoids the question, call them out professionally.
- "confidence": "High", "Medium", or "Low" based on how assured their answer sounds.
- "clarity": "High", "Medium", or "Low" based on their communication.
- "next_question": A relevant, dynamic follow-up technical question based on their answer (or lack thereof).
- "hr_review": Feedback from the HR Manager on their communication style and professionalism.
- "recruiter_review": Feedback from the Recruiter on their cultural fit and overall impression.

Return ONLY valid JSON. No markdown, no introduction."""

        user_prompt = f"Question asked: {data.question}\nCandidate's Answer: {data.answer}\nEvaluate this."

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"}
        }

        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                response_text = response.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise Exception(f"Groq API HTTP Error: {e.code} - {error_body}")
        
        # Parse standard OpenAI-compatible response format
        api_result = json.loads(response_text)
        content = api_result["choices"][0]["message"]["content"]
        result = json.loads(content)
            
        return InterviewEvaluationResponse(
            review=result.get("review", "Unable to generate review."),
            confidence=result.get("confidence", "Medium"),
            clarity=result.get("clarity", "Medium"),
            next_question=result.get("next_question", "Could you elaborate on that?"),
            hr_review=result.get("hr_review", "Communication noted."),
            recruiter_review=result.get("recruiter_review", "Profile noted.")
        )
        
    except Exception as e:
        print(f"Error evaluating interview: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/coding-room/evaluate", response_model=CodingEvaluationResponse)
def evaluate_coding(data: CodingEvaluationRequest):
    try:
        import urllib.request
        import urllib.error
        
        load_dotenv()
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise Exception("GROQ_API_KEY not found in environment")
            
        system_prompt = """You are a master AI orchestration system acting as a Tech Lead evaluating a candidate's code submission.
You must evaluate the candidate's code submission to the current problem and return a JSON object with EXACTLY these keys:
- "review": The Tech Lead's comprehensive technical feedback on the code. Be sharp and analytical. Reference specific lines, variables, or logic from their code to make the review highly tailored and suitable to their exact implementation. Look for bugs, algorithmic efficiency, syntax, naming conventions, code readability, and their overall problem-solving approach.
- "time_complexity": The Big-O time complexity of their code (e.g., O(N), O(N^2), etc.).
- "space_complexity": The Big-O space complexity of their code.
- "bugs_found": A string detailing any bugs found, or "None" if the code is perfect.

Return ONLY valid JSON. No markdown, no introduction."""

        run_context = ""
        if data.stdout or data.stderr:
            run_context = f"\nActual program output (stdout):\n{data.stdout or '(empty)'}\nActual program error (stderr):\n{data.stderr or '(none)'}\n"

        user_prompt = f"Problem: {data.question}\nLanguage: {data.language}\nCandidate's Code:\n{data.code}\n{run_context}\nEvaluate this code, taking into account whether the actual output above correctly solves the stated problem."

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                response_text = response.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise Exception(f"Groq API HTTP Error: {e.code} - {error_body}")
        
        api_result = json.loads(response_text)
        content = api_result["choices"][0]["message"]["content"]
        result = json.loads(content)
            
        return CodingEvaluationResponse(
            review=result.get("review", "Unable to generate review."),
            time_complexity=result.get("time_complexity", "Unknown"),
            space_complexity=result.get("space_complexity", "Unknown"),
            bugs_found=result.get("bugs_found", "None")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
@router.post("/coding-room/execute", response_model=CodeExecutionResponse)
async def execute_code(data: CodeExecutionRequest):
    import subprocess
    import tempfile
    import time
    
    start_time = time.time()
    
    # Map supported languages to their file extensions and execution commands
    lang_map = {
        "python": {"ext": ".py", "cmd": ["python"]},
        "javascript": {"ext": ".js", "cmd": ["node"]},
    }
    
    if data.language not in lang_map:
        return CodeExecutionResponse(
            stdout="",
            stderr=f"Execution for language '{data.language}' is not supported yet.",
            exit_code=1,
            execution_time_ms=0.0
        )
        
    config = lang_map[data.language]
    
    try:
        # Create a temporary file with the code
        with tempfile.NamedTemporaryFile(mode='w', suffix=config["ext"], delete=False, encoding='utf-8') as temp_file:
            temp_file.write(data.code)
            temp_file_path = temp_file.name
            
        try:
            # Execute the code with a strict 5-second timeout
            process = subprocess.run(
                config["cmd"] + [temp_file_path],
                capture_output=True,
                text=True,
                timeout=5.0
            )
            
            execution_time_ms = (time.time() - start_time) * 1000
            
            return CodeExecutionResponse(
                stdout=process.stdout,
                stderr=process.stderr,
                exit_code=process.returncode,
                execution_time_ms=round(execution_time_ms, 2)
            )
            
        except subprocess.TimeoutExpired:
            return CodeExecutionResponse(
                stdout="",
                stderr="Error: Execution timed out after 5 seconds. (Infinite loop detected?)",
                exit_code=124,
                execution_time_ms=5000.0
            )
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution engine error: {str(e)}")

@router.post("/coding-room/debug", response_model=CodeDebugResponse)
def debug_code(data: CodeDebugRequest):
    try:
        import urllib.request
        import json
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set. Cannot debug code.")
            
        system_prompt = """You are an expert AI debugger. Analyze the provided code, language, and error message.
Return a JSON object with EXACTLY these keys:
- "explanation": A clear, concise explanation of why the error occurred.
- "fixed_code": The complete corrected code.

Return ONLY valid JSON. No markdown, no introduction."""

        user_prompt = f"Language: {data.language}\nCode:\n{data.code}\n\nError:\n{data.error}\n\nDebug and fix this code."

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }

        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                response_text = response.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise Exception(f"Groq API HTTP Error: {e.code} - {error_body}")
        
        api_result = json.loads(response_text)
        content = api_result["choices"][0]["message"]["content"]
        result = json.loads(content)
            
        return CodeDebugResponse(
            explanation=result.get("explanation", "Unable to generate explanation."),
            fixed_code=result.get("fixed_code", data.code)
        )
        
    except Exception as e:
        print(f"Error in debug_code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/coding-room/generate-question", response_model=QuestionGenerationResponse)
def generate_question(data: QuestionGenerationRequest):
    try:
        import urllib.request
        import json
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set. Cannot generate question.")
            
        system_prompt = """You are an expert technical interviewer and AI Professor.
Generate a coding problem for a candidate based on the requested subject and difficulty.
Return a JSON object with EXACTLY these keys:
- "question_text": A clear, concise problem statement with examples.
- "starter_code": A dictionary containing the starter code templates for the following languages: "python", "javascript", "cpp", "java". The code should just be the function signature/definition with a comment, and any necessary class wrappers for Java/C++.

Return ONLY valid JSON. No markdown, no introduction."""

        user_prompt = f"Subject: {data.subject}\nDifficulty: {data.difficulty}\nGenerate a question."

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "response_format": {"type": "json_object"}
        }

        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                response_text = response.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise Exception(f"Groq API HTTP Error: {e.code} - {error_body}")
        
        api_result = json.loads(response_text)
        content = api_result["choices"][0]["message"]["content"]
        result = json.loads(content)
        
        starter_code = result.get("starter_code", {})
        # Ensure we have defaults if the model missed some
        defaults = {
            "python": "def solution():\n    pass",
            "javascript": "function solution() {\n    // Write your code here\n}",
            "cpp": "#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};",
            "java": "class Solution {\n    public void solve() {\n        \n    }\n}"
        }
        for lang in defaults:
            if lang not in starter_code:
                starter_code[lang] = defaults[lang]
            
        return QuestionGenerationResponse(
            question_text=result.get("question_text", "Failed to generate question text."),
            starter_code=starter_code
        )
        
    except Exception as e:
        print(f"Error generating question: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating question: {str(e)}")

@router.post("/quiz-tutor/respond", response_model=QuizTutorResponse)
def quiz_tutor_respond(data: QuizTutorRequest):
    try:
        import urllib.request
        import urllib.error

        load_dotenv()
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set. Cannot run quiz tutor.")

        mission_guidance = {
            "Learning Mission": "Focus on teaching-style questions that build foundational understanding step by step. Favor 'what is' and 'how does X work' questions, and gently correct misconceptions in your follow-ups.",
            "Interview Mission": "Ask questions in the style of a technical interviewer assessing job-readiness: problem-solving, trade-offs, and real-world application scenarios, similar to what a hiring panel would ask.",
            "Revision Mission": "Treat this as a rapid-fire recap for someone who has already studied the topic. Ask concise recall and clarification questions covering key facts, rather than teaching from scratch.",
            "Skill Gap Mission": "Probe specifically for weaknesses. Ask pointed, slightly harder questions designed to surface what the candidate does NOT know, and drill into any shaky answers with a tougher follow-up.",
            "Placement Preparation Mission": "Simulate placement-test style questions: a mix of conceptual depth and applied problem-solving, similar to campus recruitment technical rounds, with an emphasis on practical readiness."
        }
        mission_focus = mission_guidance.get(data.mission_type, mission_guidance["Learning Mission"])

        system_prompt = f"""You are NOVA, an adaptive AI tutor running a baseline assessment quiz on a technical topic.
The current mission profile is "{data.mission_type}". {mission_focus}
You ask probing questions to gauge the candidate's understanding, react to their answers, and decide when the assessment is complete.
Return a JSON object with EXACTLY these keys:
- "reply": Your next message to the candidate. If the assessment isn't finished, ask a focused follow-up question about the topic that matches the mission profile's style, based on their answer. If finished, summarize their readiness.
- "readiness_delta": An integer from -5 to 5 reflecting how much their last answer should move their readiness score (negative for weak/incorrect answers, positive for strong ones, 0 if neutral).
- "is_finished": true once you have asked 2 questions total (i.e. this is your reply to the 2nd answer) and are ready to conclude the assessment, otherwise false. Keep the assessment short — never exceed 2 questions.

Return ONLY valid JSON. No markdown, no introduction."""

        history_text = "\n".join(f"{turn.get('role', 'user')}: {turn.get('content', '')}" for turn in data.history)
        user_prompt = f"Topic: {data.topic}\nMission Profile: {data.mission_type}\nConversation so far:\n{history_text}\n\nCandidate's latest answer: {data.answer}\n\nRespond as NOVA."

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.6,
            "response_format": {"type": "json_object"}
        }

        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                response_text = response.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise Exception(f"Groq API HTTP Error: {e.code} - {error_body}")

        api_result = json.loads(response_text)
        content = api_result["choices"][0]["message"]["content"]
        result = json.loads(content)

        answers_so_far = sum(1 for turn in data.history if turn.get("role") == "user") + 1
        is_finished = result.get("is_finished", False) or answers_so_far >= 2

        return QuizTutorResponse(
            reply=result.get("reply", "Could you elaborate further?"),
            readiness_delta=result.get("readiness_delta", 0),
            is_finished=is_finished
        )

    except Exception as e:
        print(f"Error in quiz_tutor_respond: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
