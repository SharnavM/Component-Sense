from __future__ import annotations
import os
from typing import Any
from google import genai
from core.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

GENERATION_MODEL = os.getenv("GEMINI_GENERATION_MODEL", "gemini-3.1-flash-lite-preview")
EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_DIMENSION = int(os.getenv("GEMINI_EMBEDDING_DIMENSION", "768"))
GENERATION_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.2"))
GENERATION_MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "2048"))


def _extract_text(response: Any) -> str:
    """Pull text out of a Gemini response for our docs assistant."""
    text_parts: list[str] = []

    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            text = getattr(part, "text", None)
            if text:
                text_parts.append(text)

    if text_parts:
        return "".join(text_parts).strip()

    text = getattr(response, "text", None)
    return (text or "").strip()


def get_embedding(text: str) -> list[float]:
    """Embed the incoming user question before querying Pinecone."""
    embedding_response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config={
            "task_type": "RETRIEVAL_QUERY",
            "output_dimensionality": EMBEDDING_DIMENSION,
        },
    )

    if not getattr(embedding_response, "embeddings", None):
        raise RuntimeError("Gemini returned no embeddings.")

    return list(embedding_response.embeddings[0].values)


def generate_text(prompt: str) -> str:
    """Run the final docs-grounded prompt through Gemini."""
    generation_response = client.models.generate_content(
        model=GENERATION_MODEL,
        contents=prompt,
        config={
            "temperature": GENERATION_TEMPERATURE,
            "max_output_tokens": GENERATION_MAX_OUTPUT_TOKENS,
        },
    )

    text = _extract_text(generation_response)
    if not text:
        raise RuntimeError("Gemini returned an empty response.")

    return text
