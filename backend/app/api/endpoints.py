from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.digital_twin import DigitalTwin
from app.schemas.schemas import UserCreate, UserResponse, DigitalTwinResponse, InterviewEvaluationRequest, InterviewEvaluationResponse
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

