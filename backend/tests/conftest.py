import os
import sys
from pathlib import Path

import pytest

# Tests run against a throwaway SQLite file and never call the real LLM.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_techmentor.db"
os.environ.setdefault("GROQ_API_KEY", "test-key")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
    Path("test_techmentor.db").unlink(missing_ok=True)


@pytest.fixture
def fake_llm(monkeypatch):
    """Replace the Groq call with a canned JSON reply; records the prompts it received."""
    calls = []

    def install(reply):
        def fake(system_prompt, user_prompt, temperature=0.5):
            calls.append({"system": system_prompt, "user": user_prompt})
            if isinstance(reply, Exception):
                raise reply
            return reply
        monkeypatch.setattr("app.api.endpoints.complete_json", fake)
        return calls

    return install
