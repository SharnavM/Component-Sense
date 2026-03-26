import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from pinecone import Pinecone


def load_env():
    env_path = (Path(__file__).resolve().parent.parent / ".env").resolve()
    load_dotenv(env_path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "query",
        nargs="?",
        default="How do I control the expanded state of MUI Accordion?",
    )
    parser.add_argument(
        "--index-name", default=os.getenv("PINECONE_INDEX_NAME", "ui-component-sense")
    )
    parser.add_argument(
        "--namespace", default=os.getenv("PINECONE_NAMESPACE", "mui-rnpaper")
    )
    parser.add_argument(
        "--embed-model", default=os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
    )
    parser.add_argument(
        "--gen-model",
        default=os.getenv("GEMINI_GENERATION_MODEL", "gemini-3.1-flash-lite-preview"),
    )
    parser.add_argument("--top-k", type=int, default=6)
    parser.add_argument(
        "--dimension", type=int, default=int(os.getenv("GEMINI_EMBED_DIMENSION", "768"))
    )
    args = parser.parse_args()

    load_env()

    gclient = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

    index_info = pc.describe_index(args.index_name)
    index = pc.Index(host=index_info.host)

    # 1) Embed the user query
    emb = gclient.models.embed_content(
        model=args.embed_model,
        contents=args.query,
        config={
            "task_type": "RETRIEVAL_QUERY",
            "output_dimensionality": args.dimension,
        },
    )
    query_vector = emb.embeddings[0].values

    # 2) Search Pinecone
    res = index.query(
        namespace=args.namespace,
        vector=query_vector,
        top_k=args.top_k,
        include_metadata=True,
        include_values=False,
    )

    matches = res.matches or []
    if not matches:
        print("No matches found.")
        return

    print("\nTop matches:")
    context_parts = []
    for i, m in enumerate(matches, start=1):
        md = m.metadata or {}
        text = (md.get("text") or "").strip()
        print(
            f"{i}. score={m.score:.4f} | "
            f"{md.get('library', '-')}/{md.get('component', '-')} | "
            f"{md.get('section_title', md.get('section_path', '-'))}"
        )
        if text:
            context_parts.append(
                f"[Source {i}]\n"
                f"Library: {md.get('library', '')}\n"
                f"Component: {md.get('component', '')}\n"
                f"Section: {md.get('section_path', md.get('section_title', ''))}\n"
                f"Content:\n{text}\n"
            )

    context = "\n\n".join(context_parts)[:12000]

    # 3) Ask Gemini to answer only from retrieved context
    prompt = f"""You are a precise assistant for UI framework docs.
Answer ONLY from the provided retrieved context.
If the answer is not in the context, say that clearly.
Be concise. At the end, add 'Sources used: ...'.

User question:
{args.query}

Retrieved context:
{context}
"""

    out = gclient.models.generate_content(
        model=args.gen_model,
        contents=prompt,
    )

    print("\n--- ANSWER ---\n")
    print(out.text)


if __name__ == "__main__":
    main()
