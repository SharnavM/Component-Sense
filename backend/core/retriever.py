from __future__ import annotations
from pinecone import Pinecone
from core.config import PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_NAMESPACE

pc = Pinecone(api_key=PINECONE_API_KEY)
index_host = pc.describe_index(PINECONE_INDEX_NAME).host
index = pc.Index(host=index_host)


def search_docs(query_vector: list[float], library: str, top_k: int = 5) -> dict:
    """Fetch the top matching docs chunks for the specified library."""
    query_kwargs = {
        "vector": query_vector,
        "top_k": top_k,
        "include_metadata": True,
        "include_values": False,
        "filter": {"library": {"$eq": library}},
    }

    if PINECONE_NAMESPACE:
        query_kwargs["namespace"] = PINECONE_NAMESPACE

    results = index.query(**query_kwargs)
    return results.to_dict() if hasattr(results, "to_dict") else results
