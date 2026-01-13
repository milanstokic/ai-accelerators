"""${{ values.name | capitalize }} - RAG API Application.

A production-ready RAG API built with FastAPI.

Configuration:
- LLM Provider: ${{ values.llmProvider }}
- Vector Store: ${{ values.vectorStore }}
- Embedding Provider: ${{ values.embeddingProvider }}
"""

from typing import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .config import settings, get_llm_client, get_embedding_provider, get_vector_store

app = FastAPI(
    title="${{ values.name | capitalize }}",
    description="${{ values.description }}",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Request/Response Models
# =============================================================================

class QueryRequest(BaseModel):
    """Query request model."""
    query: str = Field(..., description="Query text", min_length=1, max_length=1000)
    max_tokens: int = Field(1000, description="Maximum tokens to generate", ge=1, le=4096)
    temperature: float = Field(0.7, description="Sampling temperature", ge=0, le=2)
    top_k: int = Field(5, description="Number of documents to retrieve", ge=1, le=20)


class QueryResponse(BaseModel):
    """Query response model."""
    answer: str = Field(..., description="Generated answer")
    sources: list[dict] = Field(default_factory=list, description="Source documents")
    model: str = Field(..., description="Model used")


class IngestRequest(BaseModel):
    """Ingest request model."""
    text: str = Field(..., description="Text content to ingest", min_length=1)
    metadata: dict = Field(default_factory=dict, description="Document metadata")
    chunk_size: int = Field(500, description="Chunk size in characters", ge=100, le=2000)


class IngestResponse(BaseModel):
    """Ingest response model."""
    document_ids: list[str] = Field(..., description="IDs of ingested documents")
    chunks: int = Field(..., description="Number of chunks created")


# =============================================================================
# Utility Functions
# =============================================================================

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Chunk text with overlap."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "${{ values.name }}"}


@app.get("/ready")
async def ready() -> dict[str, str]:
    """Readiness check endpoint."""
    try:
        # Verify connections
        get_vector_store()
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not ready", "error": str(e)}


@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest) -> QueryResponse:
    """Query the knowledge base with RAG.
    
    Args:
        request: Query request with question and parameters
        
    Returns:
        QueryResponse with answer and sources
    """
    try:
        # Get embedding for query
        embedding_provider = get_embedding_provider()
        query_embedding = await embedding_provider.embed(request.query)
        
        # Search vector store
        vector_store = get_vector_store()
        search_results = await vector_store.search(
            query_vector=query_embedding,
            limit=request.top_k,
        )
        
        # Build context from retrieved documents
        context = "\n\n".join([
            f"[{i+1}] {r.document.content}"
            for i, r in enumerate(search_results)
        ])
        
        # Generate answer with LLM
        llm_client = get_llm_client()
        
        system_prompt = """You are a helpful assistant. Answer questions based on the provided context.
Always cite your sources using [1], [2], etc. when referencing the context.
If the answer is not in the context, say so clearly."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {request.query}"},
        ]
        
        response = await llm_client.complete(
            messages=messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )
        
        # Prepare sources
        sources = [
            {
                "id": r.document.id,
                "content": r.document.content[:200] + "..." if len(r.document.content) > 200 else r.document.content,
                "score": r.score,
            }
            for r in search_results
        ]
        
        return QueryResponse(
            answer=response.content,
            sources=sources,
            model=response.model,
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/query/stream")
async def query_stream(request: QueryRequest) -> StreamingResponse:
    """Stream query response."""
    try:
        # Get embedding for query
        embedding_provider = get_embedding_provider()
        query_embedding = await embedding_provider.embed(request.query)
        
        # Search vector store
        vector_store = get_vector_store()
        search_results = await vector_store.search(
            query_vector=query_embedding,
            limit=request.top_k,
        )
        
        context = "\n\n".join([r.document.content for r in search_results])
        
        llm_client = get_llm_client()
        messages = [
            {"role": "system", "content": "Answer based on the provided context."},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {request.query}"},
        ]
        
        async def generate() -> AsyncIterator[str]:
            async for chunk in llm_client.stream(
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


@app.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest) -> IngestResponse:
    """Ingest text into the knowledge base.
    
    Args:
        request: Ingest request with text and metadata
        
    Returns:
        IngestResponse with document IDs
    """
    try:
        # Chunk the text
        chunks = chunk_text(request.text, chunk_size=request.chunk_size)
        
        # Generate embeddings
        embedding_provider = get_embedding_provider()
        embeddings = await embedding_provider.embed_batch(chunks)
        
        # Create documents
        from uuid import uuid4
        documents = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            doc_id = f"doc_{uuid4().hex[:8]}_{i}"
            documents.append({
                "id": doc_id,
                "content": chunk,
                "metadata": {**request.metadata, "chunk_index": i},
                "embedding": embedding,
            })
        
        # Store in vector database
        vector_store = get_vector_store()
        await vector_store.upsert(documents)
        
        return IngestResponse(
            document_ids=[doc["id"] for doc in documents],
            chunks=len(documents),
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str) -> dict[str, str]:
    """Delete a document by ID."""
    try:
        vector_store = get_vector_store()
        await vector_store.delete([document_id])
        return {"status": "success", "deleted": document_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
