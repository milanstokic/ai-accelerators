"""RAG API - Minimal Viable Version."""

from typing import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pydantic_settings import SettingsConfigDict

from accelerators.config import BaseSettings
from accelerators.llm import LLMClient, Message
from accelerators.observability import observe

app = FastAPI(title="RAG API", version="0.1.0")


class AppSettings(BaseSettings):
    """Application settings."""

    llm_provider: str = "anthropic"
    llm_api_key: str
    llm_model: str | None = None
    debug: bool = False

    model_config = SettingsConfigDict(
        env_prefix="RAG_",
        case_sensitive=False,
    )


settings = AppSettings()


class QueryRequest(BaseModel):
    """Query request model."""

    query: str
    max_tokens: int = 1000
    temperature: float = 1.0


class QueryResponse(BaseModel):
    """Query response model."""

    answer: str
    model: str
    usage: dict[str, int]


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/ready")
async def ready() -> dict[str, str]:
    """Readiness check endpoint."""
    return {"status": "ready"}


@app.post("/query", response_model=QueryResponse)
@observe(name="rag_query")
async def query(request: QueryRequest) -> QueryResponse:
    """Query the knowledge base.

    Args:
        request: Query request with question

    Returns:
        QueryResponse with answer and metadata
    """
    try:
        # Initialize LLM client
        client = LLMClient(
            provider=settings.llm_provider,
            api_key=settings.llm_api_key,
            model=settings.llm_model,
        )

        # For MVP, we'll just pass the query directly to the LLM
        # In a full implementation, this would include vector search
        messages = [
            Message(role="user", content=request.query),
        ]

        response = await client.complete(
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        return QueryResponse(
            answer=response.content,
            model=response.model,
            usage=response.usage,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/query/stream")
async def query_stream(request: QueryRequest) -> StreamingResponse:
    """Stream query response.

    Args:
        request: Query request with question

    Returns:
        StreamingResponse with incremental answer
    """
    try:
        client = LLMClient(
            provider=settings.llm_provider,
            api_key=settings.llm_api_key,
            model=settings.llm_model,
        )

        messages = [
            Message(role="user", content=request.query),
        ]

        async def generate() -> AsyncIterator[str]:
            async for chunk in client.stream(
                messages=messages,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
            ):
                if chunk.content:
                    yield f"data: {chunk.content}\n\n"
                if chunk.done:
                    yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/ingest")
async def ingest(text: str) -> dict[str, str]:
    """Ingest text into the knowledge base.

    Args:
        text: Text content to ingest

    Returns:
        Success message

    Note:
        This is a minimal implementation. In a full version, this would:
        - Chunk the text
        - Generate embeddings
        - Store in vector database
    """
    # For MVP, we'll just return success
    # In a full implementation, this would process and store the text
    return {"status": "success", "message": "Text ingested (MVP - not stored)"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

