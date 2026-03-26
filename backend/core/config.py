import os
from pathlib import Path

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "").strip()

RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_PER_IP = int(os.getenv("RATE_LIMIT_PER_IP", "10"))
RATE_LIMIT_GLOBAL = int(os.getenv("RATE_LIMIT_GLOBAL", "60"))

FRONTEND_URL = os.getenv("FRONTEND_URL", "*")


if not GEMINI_API_KEY or not PINECONE_API_KEY:
    raise ValueError("Missing essential API keys in environment variables.")

if not PINECONE_INDEX_NAME:
    raise ValueError("Missing Pinecone index name in environment variables.")
