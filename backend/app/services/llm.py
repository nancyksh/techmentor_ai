"""Thin client for Groq's OpenAI-compatible chat API that always returns parsed JSON."""
import json
import logging
import os
import urllib.error
import urllib.request

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# Groq retires models regularly (llama-3.3-70b-versatile was shut down 16 Aug 2026),
# so the model is configured per environment instead of hardcoded.
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
TIMEOUT_SECONDS = 30


class LLMError(Exception):
    """The LLM call failed or returned something that isn't a JSON object."""


def complete_json(system_prompt: str, user_prompt: str, temperature: float = 0.5) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise LLMError("GROQ_API_KEY is not set")

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "response_format": {"type": "json_object"},
    }
    request = urllib.request.Request(
        GROQ_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            # Groq's edge rejects urllib's default user agent
            "User-Agent": "TechMentorAI/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            body = json.loads(response.read().decode("utf-8"))
        result = json.loads(body["choices"][0]["message"]["content"])
    except urllib.error.HTTPError as e:
        raise LLMError(f"Groq returned HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:500]}") from e
    except (urllib.error.URLError, TimeoutError) as e:
        raise LLMError(f"Could not reach Groq: {e}") from e
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise LLMError(f"Unexpected response from Groq: {e}") from e

    if not isinstance(result, dict):
        raise LLMError("Model did not return a JSON object")
    return result
