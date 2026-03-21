from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pinecone import Pinecone, ServerlessSpec


DEFAULT_EMBED_MODEL = "gemini-embedding-001"
DEFAULT_DIMENSION = 768
DEFAULT_INDEX_NAME = "ui-component-sense"
DEFAULT_NAMESPACE = "default"
DEFAULT_CLOUD = "aws"
DEFAULT_REGION = "us-east-1"
DEFAULT_EMBED_BATCH_SIZE = 8
DEFAULT_METADATA_LIMIT_BYTES = 39_000
DEFAULT_EMBED_RPM = 4.0
DEFAULT_SLEEP_AFTER_UPSERT = 0.5


class QuotaExhaustedError(RuntimeError):
    pass


def load_project_env() -> Path:
    main_dir = Path(__file__).resolve().parent

    local_env = main_dir / "../.env"
    if local_env.exists():
        load_dotenv(local_env, override=False)

    return local_env


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def utf8_size(obj: Any) -> int:
    return len(json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))


def truncate_text_to_bytes(text: str, max_bytes: int) -> str:
    if len(text.encode("utf-8")) <= max_bytes:
        return text

    lo, hi = 0, len(text)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if len(text[:mid].encode("utf-8")) <= max_bytes:
            lo = mid
        else:
            hi = mid - 1

    truncated = text[:lo].rstrip()
    return truncated + "\n...[truncated to fit Pinecone metadata limit]"


def load_checkpoint(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    return read_json(path)


def save_checkpoint(path: Path, data: Dict[str, Any]) -> None:
    write_json(path, data)


def now_unix() -> int:
    return int(time.time())


def is_quota_exhausted_error(exc: Exception) -> bool:
    text = str(exc).upper()
    return "429" in text and "RESOURCE_EXHAUSTED" in text


class SimpleRateLimiter:
    def __init__(self, rpm: float | None) -> None:
        self.rpm = rpm if rpm and rpm > 0 else None
        self.min_interval = (60.0 / self.rpm) if self.rpm else 0.0
        self._last_time: Optional[float] = None

    def wait(self) -> None:
        if not self.min_interval:
            return
        if self._last_time is None:
            self._last_time = time.monotonic()
            return
        elapsed = time.monotonic() - self._last_time
        remaining = self.min_interval - elapsed
        if remaining > 0:
            time.sleep(remaining)
        self._last_time = time.monotonic()


class AdaptiveBatchSizer:
    def __init__(self, initial: int, minimum: int = 1) -> None:
        self.size = max(initial, minimum)
        self.minimum = minimum

    def shrink(self) -> int:
        if self.size <= self.minimum:
            return self.size
        self.size = max(self.minimum, self.size // 2)
        return self.size


def build_pinecone_metadata(chunk: Dict[str, Any], metadata_limit_bytes: int) -> Dict[str, Any]:
    src = chunk.get("metadata", {}) or {}

    metadata: Dict[str, Any] = {
        "library": src.get("library"),
        "component": src.get("component"),
        "sub_component": src.get("sub_component"),
        "doc_type": src.get("doc_type"),
        "file_name": src.get("file_name"),
        "title": src.get("title"),
        "section_title": src.get("section_title"),
        "section_path": src.get("section_path"),
        "section_slug_path": src.get("section_slug_path"),
        "chunk_kind": src.get("chunk_kind"),
        "chunk_part": src.get("chunk_part"),
        "chunk_index_in_file": src.get("chunk_index_in_file"),
        "chunk_count_in_file": src.get("chunk_count_in_file"),
        "source_path": src.get("source_path"),
        "text": chunk.get("text", ""),
    }
    metadata = {k: v for k, v in metadata.items() if v is not None}

    if utf8_size(metadata) <= metadata_limit_bytes:
        return metadata

    text_value = str(metadata.get("text", ""))
    fixed_metadata = {k: v for k, v in metadata.items() if k != "text"}

    for low_value_key in [
        "section_slug_path",
        "section_path",
        "file_name",
        "sub_component",
        "chunk_count_in_file",
        "chunk_index_in_file",
        "chunk_part",
    ]:
        if utf8_size(fixed_metadata) < metadata_limit_bytes:
            break
        fixed_metadata.pop(low_value_key, None)

    remaining = metadata_limit_bytes - utf8_size(fixed_metadata) - 20
    remaining = max(remaining, 0)
    fixed_metadata["text"] = truncate_text_to_bytes(text_value, remaining)
    return fixed_metadata


def validate_chunks(chunks: List[dict]) -> None:
    required_keys = {"id", "text", "embedding_text", "metadata"}
    for idx, chunk in enumerate(chunks[:20]):
        missing = required_keys - set(chunk.keys())
        if missing:
            raise ValueError(f"Chunk {idx} is missing required keys: {sorted(missing)}")


def wait_for_index_ready(pc: Pinecone, index_name: str, poll_seconds: float = 2.0, timeout_seconds: float = 300.0) -> str:
    started = time.time()
    while True:
        desc = pc.describe_index(name=index_name)
        status = desc.get("status", {}) if isinstance(desc, dict) else getattr(desc, "status", {})
        host = desc.get("host") if isinstance(desc, dict) else getattr(desc, "host", None)
        ready = status.get("ready") if isinstance(status, dict) else getattr(status, "ready", None)

        if ready and host:
            return host

        if time.time() - started > timeout_seconds:
            raise TimeoutError(f"Timed out waiting for Pinecone index '{index_name}' to become ready.")
        time.sleep(poll_seconds)


def get_or_create_index(pc: Pinecone, index_name: str, dimension: int, cloud: str, region: str):
    if not pc.has_index(index_name):
        print(f"Creating Pinecone index '{index_name}'...")
        pc.create_index(
            name=index_name,
            vector_type="dense",
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(cloud=cloud, region=region),
            deletion_protection="disabled",
            tags={
                "app": "ui-rag",
                "dimension": str(dimension),
            },
        )
    host = wait_for_index_ready(pc, index_name)
    return pc.Index(host=host)


def embed_once(client: genai.Client, texts: List[str], model: str, dimension: int) -> List[List[float]]:
    result = client.models.embed_content(
        model=model,
        contents=texts,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=dimension,
        ),
    )
    embeddings = result.embeddings
    if len(embeddings) != len(texts):
        raise RuntimeError(f"Embedding count mismatch. Expected {len(texts)}, got {len(embeddings)}")
    return [embedding.values for embedding in embeddings]


def embed_batch_with_retries(
    client: genai.Client,
    texts: List[str],
    model: str,
    dimension: int,
    rate_limiter: SimpleRateLimiter,
    max_retries: int = 4,
) -> List[List[float]]:
    last_error: Exception | None = None
    for attempt in range(max_retries):
        try:
            rate_limiter.wait()
            return embed_once(client=client, texts=texts, model=model, dimension=dimension)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if is_quota_exhausted_error(exc):
                raise QuotaExhaustedError(str(exc)) from exc
            sleep_for = min(30.0, 2 ** (attempt + 1))
            print(f"[embed] attempt {attempt + 1}/{max_retries} failed: {exc}", file=sys.stderr)
            if attempt == max_retries - 1:
                break
            time.sleep(sleep_for)
    raise RuntimeError(f"Gemini embedding failed after {max_retries} attempts: {last_error}")


def upsert_batch(index, namespace: str, vectors: List[Dict[str, Any]], max_retries: int = 6) -> None:
    last_error: Exception | None = None
    for attempt in range(max_retries):
        try:
            index.upsert(vectors=vectors, namespace=namespace)
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            print(f"[upsert] attempt {attempt + 1}/{max_retries} failed: {exc}", file=sys.stderr)
            if attempt == max_retries - 1:
                break
            time.sleep(min(30.0, 2 ** (attempt + 1)))
    raise RuntimeError(f"Pinecone upsert failed after {max_retries} attempts: {last_error}")


def checkpoint_payload(
    input_path: Path,
    index_name: str,
    namespace: str,
    embed_model: str,
    dimension: int,
    next_offset: int,
    total_chunks: int,
    last_batch_size: int,
) -> Dict[str, Any]:
    return {
        "input_path": str(input_path),
        "index_name": index_name,
        "namespace": namespace,
        "embed_model": embed_model,
        "dimension": dimension,
        "next_offset": next_offset,
        "total_chunks": total_chunks,
        "last_batch_size": last_batch_size,
        "updated_at_unix": now_unix(),
    }


def ingest_chunks(
    input_path: Path,
    index_name: str,
    namespace: str,
    embed_model: str,
    dimension: int,
    cloud: str,
    region: str,
    initial_embed_batch_size: int,
    checkpoint_path: Path,
    metadata_limit_bytes: int,
    start_from: int | None,
    embed_rpm: float | None,
    sleep_after_upsert: float,
) -> None:
    preferred_env = load_project_env()
    gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    pinecone_api_key = os.getenv("PINECONE_API_KEY")

    if not gemini_api_key:
        raise EnvironmentError(f"Missing GEMINI_API_KEY (or GOOGLE_API_KEY). Looked after loading: {preferred_env}")
    if not pinecone_api_key:
        raise EnvironmentError(f"Missing PINECONE_API_KEY. Looked after loading: {preferred_env}")

    chunks = read_json(input_path)
    if not isinstance(chunks, list):
        raise ValueError(f"Expected a JSON array in {input_path}, got {type(chunks).__name__}")
    validate_chunks(chunks)

    checkpoint = load_checkpoint(checkpoint_path)
    if start_from is None:
        start_from = int(checkpoint.get("next_offset", 0))

    print(f"Loaded {len(chunks)} chunks from {input_path}")
    print(f"Embedding model: {embed_model}")
    print(f"Index: {index_name} | Namespace: {namespace} | Dimension: {dimension}")
    print(f"Resuming from offset: {start_from}")
    print(f"Embedding batch size: {initial_embed_batch_size} | Target RPM: {embed_rpm or 'unlimited'}")

    client = genai.Client(api_key=gemini_api_key)
    pc = Pinecone(api_key=pinecone_api_key)
    index = get_or_create_index(pc=pc, index_name=index_name, dimension=dimension, cloud=cloud, region=region)

    total = len(chunks)
    rate_limiter = SimpleRateLimiter(embed_rpm)
    batch_sizer = AdaptiveBatchSizer(initial=initial_embed_batch_size, minimum=1)
    cursor = start_from

    while cursor < total:
        current_batch_size = min(batch_sizer.size, total - cursor)
        batch = chunks[cursor: cursor + current_batch_size]
        texts = [str(chunk["embedding_text"]) for chunk in batch]

        try:
            embeddings = embed_batch_with_retries(
                client=client,
                texts=texts,
                model=embed_model,
                dimension=dimension,
                rate_limiter=rate_limiter,
            )
        except QuotaExhaustedError as exc:
            save_checkpoint(
                checkpoint_path,
                checkpoint_payload(
                    input_path=input_path,
                    index_name=index_name,
                    namespace=namespace,
                    embed_model=embed_model,
                    dimension=dimension,
                    next_offset=cursor,
                    total_chunks=total,
                    last_batch_size=current_batch_size,
                ),
            )
            print("\n⛔ Gemini quota exhausted.")
            print(f"Checkpoint saved at offset {cursor}: {checkpoint_path}")
            print("Open AI Studio quota page, then resume later with the same command.")
            print(f"Last error: {exc}")
            return
        except Exception as exc:
            if current_batch_size > 1:
                new_size = batch_sizer.shrink()
                print(f"[embed] shrinking batch size due to failure. New batch size: {new_size}")
                continue
            raise exc

        vectors: List[Dict[str, Any]] = []
        for chunk, embedding in zip(batch, embeddings):
            metadata = build_pinecone_metadata(chunk, metadata_limit_bytes=metadata_limit_bytes)
            vectors.append({
                "id": str(chunk["id"]),
                "values": embedding,
                "metadata": metadata,
            })

        upsert_batch(index=index, namespace=namespace, vectors=vectors)
        cursor += len(batch)
        save_checkpoint(
            checkpoint_path,
            checkpoint_payload(
                input_path=input_path,
                index_name=index_name,
                namespace=namespace,
                embed_model=embed_model,
                dimension=dimension,
                next_offset=cursor,
                total_chunks=total,
                last_batch_size=current_batch_size,
            ),
        )
        print(f"Upserted {cursor}/{total} chunks")
        if sleep_after_upsert > 0:
            time.sleep(sleep_after_upsert)

    print("✅ Ingestion complete.")
    print(f"Checkpoint saved at: {checkpoint_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Embed semantic chunks with Gemini and upload to Pinecone.")
    parser.add_argument("--input", type=Path, default=Path("semantic_chunks.json"), help="Path to chunk JSON.")
    parser.add_argument("--index-name", default=os.getenv("PINECONE_INDEX_NAME", DEFAULT_INDEX_NAME))
    parser.add_argument("--namespace", default=os.getenv("PINECONE_NAMESPACE", DEFAULT_NAMESPACE))
    parser.add_argument("--embed-model", default=os.getenv("GEMINI_EMBED_MODEL", DEFAULT_EMBED_MODEL))
    parser.add_argument("--dimension", type=int, default=int(os.getenv("GEMINI_EMBED_DIMENSION", DEFAULT_DIMENSION)))
    parser.add_argument("--cloud", default=os.getenv("PINECONE_CLOUD", DEFAULT_CLOUD))
    parser.add_argument("--region", default=os.getenv("PINECONE_REGION", DEFAULT_REGION))
    parser.add_argument("--embed-batch-size", type=int, default=int(os.getenv("EMBED_BATCH_SIZE", DEFAULT_EMBED_BATCH_SIZE)))
    parser.add_argument("--embed-rpm", type=float, default=float(os.getenv("GEMINI_EMBED_RPM", DEFAULT_EMBED_RPM)))
    parser.add_argument("--sleep-after-upsert", type=float, default=float(os.getenv("SLEEP_AFTER_UPSERT", DEFAULT_SLEEP_AFTER_UPSERT)))
    parser.add_argument("--checkpoint", type=Path, default=Path(".ingest_checkpoint.json"))
    parser.add_argument("--start-from", type=int, default=None, help="Override checkpoint offset.")
    parser.add_argument("--metadata-limit-bytes", type=int, default=DEFAULT_METADATA_LIMIT_BYTES)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    ingest_chunks(
        input_path=args.input,
        index_name=args.index_name,
        namespace=args.namespace,
        embed_model=args.embed_model,
        dimension=args.dimension,
        cloud=args.cloud,
        region=args.region,
        initial_embed_batch_size=args.embed_batch_size,
        checkpoint_path=args.checkpoint,
        metadata_limit_bytes=args.metadata_limit_bytes,
        start_from=args.start_from,
        embed_rpm=args.embed_rpm,
        sleep_after_upsert=args.sleep_after_upsert,
    )
