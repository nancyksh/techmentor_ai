from app.services.llm import LLMError


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_generate_question_fills_missing_starter_code(client, fake_llm):
    fake_llm({"question_text": "Reverse a string.", "starter_code": {"python": "def reverse(s):\n    pass"}})
    res = client.post("/api/v1/coding-room/generate-question", json={"subject": "Strings", "difficulty": "Easy"})
    assert res.status_code == 200
    body = res.json()
    assert body["starter_code"]["python"].startswith("def reverse")
    assert set(body["starter_code"]) == {"python", "javascript", "cpp", "java"}


def test_llm_failure_returns_clean_502(client, fake_llm):
    fake_llm(LLMError("Groq returned HTTP 404: model_not_found"))
    res = client.post("/api/v1/coding-room/generate-question", json={"subject": "Arrays"})
    assert res.status_code == 502
    assert "model_not_found" not in res.text  # internal details stay in the server logs


def test_interview_normalises_unexpected_levels(client, fake_llm):
    fake_llm({"review": "Good.", "confidence": "Very high!", "clarity": "Low", "next_question": "Why?"})
    res = client.post("/api/v1/interview/evaluate", json={"question": "What is a deadlock?", "answer": "Processes waiting forever."})
    assert res.status_code == 200
    assert res.json()["confidence"] == "Medium"
    assert res.json()["clarity"] == "Low"


def test_quiz_tutor_clamps_delta_and_server_ends_quiz(client, fake_llm):
    fake_llm({"reply": "Nice.", "readiness_delta": 40, "is_finished": False})
    history = [{"role": "ai", "content": "Q1"}, {"role": "user", "content": "A1"}]
    res = client.post("/api/v1/quiz-tutor/respond", json={"topic": "OS", "history": history, "answer": "A2"})
    body = res.json()
    assert body["readiness_delta"] == 5
    assert body["is_finished"] is True


def test_request_size_is_limited(client):
    res = client.post("/api/v1/coding-room/execute", json={"code": "x" * 20001, "language": "python"})
    assert res.status_code == 422


def test_execute_python(client):
    res = client.post("/api/v1/coding-room/execute", json={"code": "print(2 + 3)", "language": "python"})
    assert res.status_code == 200
    assert res.json()["stdout"].strip() == "5"
    assert res.json()["exit_code"] == 0


def test_executed_code_cannot_read_server_secrets(client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "super-secret-value")
    code = "import os\nprint(os.environ.get('GROQ_API_KEY'))"
    res = client.post("/api/v1/coding-room/execute", json={"code": code, "language": "python"})
    assert "super-secret-value" not in res.json()["stdout"]


def test_execute_timeout(client):
    res = client.post("/api/v1/coding-room/execute", json={"code": "while True: pass", "language": "python"})
    assert res.json()["exit_code"] == 124


def test_unsupported_language_is_explained(client):
    res = client.post("/api/v1/coding-room/execute", json={"code": "int main(){}", "language": "cpp"})
    assert res.status_code == 200
    assert "isn't supported" in res.json()["stderr"]


def test_create_user_and_digital_twin(client):
    res = client.post("/api/v1/users/", json={"name": "Asha", "email": "asha@example.com"})
    assert res.status_code == 200
    user_id = res.json()["id"]
    assert client.get(f"/api/v1/users/{user_id}/digital-twin").status_code == 200
    assert client.post("/api/v1/users/", json={"name": "Asha", "email": "asha@example.com"}).status_code == 400
