from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.llm import get_embedding, generate_text
from core.retriever import search_docs
from core.prompt_builder import build_rag_prompt

# Initialize the router
router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    library: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    print("0. Received request")
    if request.library not in ["mui", "rn-paper"]:
        raise HTTPException(status_code=400, detail="Invalid library selected.")

    try:
        # Step 1: Embed the query
        print("1. Embedding query...")
        query_vector = get_embedding(request.query)

        # Step 2: Retrieve relevant chunks from Pinecone
        print("2. Querying Pinecone...")
        search_results = search_docs(query_vector, request.library)

        # Step 3: Build the prompt with the retrieved context
        print("3. Building prompt...")
        prompt = build_rag_prompt(request.query, request.library, search_results)

        # Step 4: Generate the final answer
        print("4. Calling Gemini generate...")
        answer = generate_text(prompt)

        return ChatResponse(answer=answer)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
