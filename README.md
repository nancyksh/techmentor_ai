# CORTEX · TechMentor AI

An AI placement-prep platform for CS students: practise coding problems with AI review, take a mock technical interview, and learn a topic through an adaptive quiz tutor.

**Live demo:** https://nancy-25etcs126011-techmentor.vercel.app
(The backend runs on Render's free tier. If the first request is slow, it's waking up.)

## What works today

| Feature | What it does | Backend |
|---|---|---|
| **Coding Room** | Generates a problem with starter code in Python, JavaScript, C++ and Java; runs Python/JS code; reviews your solution (complexity, bugs, style); explains and fixes errors | `/coding-room/generate-question`, `/execute`, `/evaluate`, `/debug` |
| **Mock Interview** | Asks a question, scores the answer for confidence and clarity, and asks a follow-up | `/interview/evaluate` |
| **Adaptive Quiz Tutor** | Socratic back-and-forth on any topic, updating a readiness score after each answer | `/quiz-tutor/respond` |
| **Analytics** | Session history and scores across quizzes and interviews | stored in the browser |

Every AI endpoint asks the LLM for **structured JSON** (`response_format: json_object`), validates it against Pydantic schemas, and fills in safe defaults if the model leaves a field out.

## Architecture

```
Next.js (Vercel)  ──HTTPS──▶  FastAPI (Render)  ──▶  Groq LLM API
   React 19, TS,                 Pydantic schemas,      model set by GROQ_MODEL
   Tailwind, Monaco              SQLAlchemy (async)
                                      │
                                      ▼
                          SQLite by default · PostgreSQL via DATABASE_URL

UptimeRobot ──▶ GET /health   (uptime monitoring + keeps the free instance warm)
```

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Monaco editor |
| Backend | FastAPI, Pydantic, SQLAlchemy (async) |
| LLM | Groq API, model configurable via `GROQ_MODEL` (default `openai/gpt-oss-120b`) |
| Database | SQLite locally; PostgreSQL supported through `DATABASE_URL` |
| Deploy | Vercel (frontend), Render (backend, `render.yaml`), UptimeRobot on `/health` |
| Quality | 11 backend tests (pytest) + ESLint + production build, run by GitHub Actions on every push |

### Dashboard note
The home dashboard's agent **Live Collaboration Feed**, **Neural System Logs** and **Agent Activity Log** are marked *Simulated*. They show how the planned agents would coordinate. Scores, mastery bars and readiness come from your real quiz and interview results.

## Roadmap
- Wire the CrewAI multi-agent crew in `agents/` (professor, planner, research, quiz, reflection, memory) into the "Autonomous Mode" endpoint; today that flow is simulated in the UI
- Run submitted code in an isolated container sandbox (see Security below)
- Persist session history server-side (PostgreSQL / Supabase) instead of browser storage

## Security and reliability
- **Secrets stay on the server.** Submitted code runs in a child process with a stripped environment, so it can't read `GROQ_API_KEY` (covered by a test).
- **Code execution is bounded:** 5-second timeout, isolated temp directory, output capped at 10,000 characters, request size limits on every endpoint.
- **LLM output is never trusted blindly:** JSON mode, defaults for missing fields, and values such as confidence levels and score changes are validated and clamped server-side.
- **Clean errors:** if the LLM provider fails, the API logs the real cause and returns a clear `502` message instead of leaking internal details.
- **Honest limitation:** a subprocess isn't a full sandbox. For a public production launch, code execution should move to an isolated container (e.g. Judge0 or Firecracker).

## Run locally

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
# create backend/.env with:
#   GROQ_API_KEY=your_key
#   GROQ_MODEL=openai/gpt-oss-120b      (optional)
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

**Tests**
```bash
cd backend
pip install -r requirements-dev.txt
pytest -q tests
```

**Frontend**
```bash
cd frontend
npm install
# frontend/.env.local:  NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```
App: http://localhost:3000

`docker-compose.yml` starts optional PostgreSQL and ChromaDB containers for local experiments; set `DATABASE_URL` to use Postgres.

## Deployment
- **Frontend → Vercel:** root directory `frontend`, env var `NEXT_PUBLIC_API_URL=<your Render URL>`
- **Backend → Render:** uses `render.yaml`; set `GROQ_API_KEY` and `FRONTEND_ORIGIN` in the dashboard
- **Monitoring → UptimeRobot:** HTTP monitor on `<Render URL>/health`

### Changing the LLM
Groq retires models regularly (`llama-3.3-70b-versatile` was shut down on 16 Aug 2026 and broke every AI feature). The model is now an environment variable, so a future deprecation only needs `GROQ_MODEL` changed in Render, with no code change.

---
Built by **Nancy Kshetrimayum**, M.Tech AI & ML.
