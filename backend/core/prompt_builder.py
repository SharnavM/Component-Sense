def _format_match(match: dict) -> str:
    meta = match["metadata"]
    title = meta.get("title") or "Untitled"
    section = meta.get("section_title") or "General"
    text = meta.get("text") or ""
    return f"--- Document: {title} | Section: {section} ---\n{text}"


def build_rag_prompt(query: str, library: str, search_results: dict) -> str:
    """Compiles the Pinecone matches and the user query into the final LLM prompt."""

    # We store the chunk text directly in metadata so prompt assembly stays simple.
    context_blocks = [
        _format_match(match) for match in search_results.get("matches", [])
    ]
    compiled_context = "\n\n".join(context_blocks)

    prompt = f"""
    You are an expert UI/UX developer and coding assistant. 
    The user is asking a question about the {library} framework.
    
    Use ONLY the following retrieved documentation to answer the question. 
    If the documentation does not contain the answer, explicitly state that you cannot find it in the provided docs.
    Do not hallucinate APIs or props that are not mentioned in the context.
    Always provide a clean code example if applicable.

    Retrieved Documentation:
    {compiled_context}

    User Question:
    {query}
    
    Answer:
    """

    return prompt
