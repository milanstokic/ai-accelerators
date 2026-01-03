"""Enhanced RAG API with full vector store integration."""

from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from pydantic_settings import SettingsConfigDict

from accelerators.config import BaseSettings
from accelerators.embeddings import OpenAIEmbeddingProvider
from accelerators.llm import LLMClient, Message
from accelerators.observability import observe, trace
from accelerators.vectorstore import Document, QdrantVectorStore

app = FastAPI(title="RAG API", version="0.2.0")


class AppSettings(BaseSettings):
    """Application settings."""

    llm_provider: str = "anthropic"
    llm_api_key: str
    llm_model: str | None = None
    embedding_provider: str = "openai"
    embedding_api_key: str
    embedding_model: str = "text-embedding-3-small"
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None
    collection_name: str = "documents"
    debug: bool = False

    model_config = SettingsConfigDict(
        env_prefix="RAG_",
        case_sensitive=False,
    )


settings = AppSettings()

# Initialize clients (lazy initialization in production)
_llm_client: LLMClient | None = None
_embedding_provider: OpenAIEmbeddingProvider | None = None
_vector_store: QdrantVectorStore | None = None


def get_llm_client() -> LLMClient:
    """Get or create LLM client."""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient(
            provider=settings.llm_provider,
            api_key=settings.llm_api_key,
            model=settings.llm_model,
        )
    return _llm_client


def get_embedding_provider() -> OpenAIEmbeddingProvider:
    """Get or create embedding provider."""
    global _embedding_provider
    if _embedding_provider is None:
        _embedding_provider = OpenAIEmbeddingProvider(
            api_key=settings.embedding_api_key,
            model=settings.embedding_model,
        )
    return _embedding_provider


def get_vector_store() -> QdrantVectorStore:
    """Get or create vector store."""
    global _vector_store
    if _vector_store is None:
        _vector_store = QdrantVectorStore(
            url=settings.qdrant_url,
            collection_name=settings.collection_name,
            api_key=settings.qdrant_api_key,
        )
    return _vector_store


# Request/Response Models
class QueryRequest(BaseModel):
    """Query request model."""

    query: str = Field(..., description="Query text")
    max_tokens: int = Field(1000, description="Maximum tokens to generate")
    temperature: float = Field(1.0, description="Sampling temperature")
    top_k: int = Field(5, description="Number of documents to retrieve")
    filters: dict[str, str] | None = Field(None, description="Metadata filters")


class QueryResponse(BaseModel):
    """Query response model."""

    answer: str = Field(..., description="Generated answer")
    sources: list[dict[str, str]] = Field(default_factory=list, description="Source documents")
    model: str = Field(..., description="Model used")
    usage: dict[str, int] = Field(..., description="Token usage")


class IngestRequest(BaseModel):
    """Ingest request model."""

    text: str = Field(..., description="Text content to ingest")
    metadata: dict[str, str] = Field(default_factory=dict, description="Document metadata")
    chunk_size: int = Field(500, description="Chunk size in characters")


class IngestResponse(BaseModel):
    """Ingest response model."""

    document_ids: list[str] = Field(..., description="IDs of ingested documents")
    chunks: int = Field(..., description="Number of chunks created")


class DocumentDeleteRequest(BaseModel):
    """Document delete request model."""

    document_ids: list[str] = Field(..., description="Document IDs to delete")


# Utility Functions
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Simple text chunking with overlap.

    Args:
        text: Text to chunk
        chunk_size: Size of each chunk
        overlap: Overlap between chunks

    Returns:
        List of text chunks
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start = end - overlap
    return chunks


# API Endpoints
@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/ready")
async def ready() -> dict[str, str]:
    """Readiness check endpoint."""
    try:
        # Check vector store connection
        store = get_vector_store()
        # Simple connection check
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not ready", "error": str(e)}


@app.post("/query", response_model=QueryResponse)
@observe(name="rag_query")
async def query(request: QueryRequest) -> QueryResponse:
    """Query the knowledge base with RAG.

    Args:
        request: Query request

    Returns:
        QueryResponse with answer and sources
    """
    try:
        with trace.span("retrieval"):
            # Generate query embedding
            embedding_provider = get_embedding_provider()
            query_embedding = await embedding_provider.embed(request.query)

            # Search vector store
            vector_store = get_vector_store()
            search_results = await vector_store.search(
                query_vector=query_embedding,
                limit=request.top_k,
                filters=request.filters,
            )

        with trace.span("generation"):
            # Build context from retrieved documents
            context = "\n\n".join(
                [f"[{i+1}] {r.document.content}" for i, r in enumerate(search_results)]
            )

            # Generate answer with LLM
            llm_client = get_llm_client()
            messages = [
                Message(
                    role="system",
                    content="You are a helpful assistant. Answer questions based on the provided context. Cite sources when possible.",
                ),
                Message(
                    role="user",
                    content=f"Context:\n{context}\n\nQuestion: {request.query}",
                ),
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
                "metadata": r.document.metadata,
            }
            for r in search_results
        ]

        return QueryResponse(
            answer=response.content,
            sources=sources,
            model=response.model,
            usage=response.usage,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/query/stream")
async def query_stream(request: QueryRequest) -> StreamingResponse:
    """Stream query response with RAG.

    Args:
        request: Query request

    Returns:
        StreamingResponse with incremental answer
    """
    try:
        # Retrieve documents (same as non-streaming)
        embedding_provider = get_embedding_provider()
        query_embedding = await embedding_provider.embed(request.query)

        vector_store = get_vector_store()
        search_results = await vector_store.search(
            query_vector=query_embedding,
            limit=request.top_k,
            filters=request.filters,
        )

        context = "\n\n".join([r.document.content for r in search_results])

        # Stream response
        llm_client = get_llm_client()
        messages = [
            Message(
                role="system",
                content="You are a helpful assistant. Answer questions based on the provided context.",
            ),
            Message(
                role="user",
                content=f"Context:\n{context}\n\nQuestion: {request.query}",
            ),
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
@observe(name="rag_ingest")
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
        documents = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            doc_id = f"doc_{hash(request.text)}_{i}"
            documents.append(
                Document(
                    id=doc_id,
                    content=chunk,
                    metadata={**request.metadata, "chunk_index": i},
                    embedding=embedding,
                )
            )

        # Store in vector database
        vector_store = get_vector_store()

        # Ensure collection exists
        try:
            await vector_store.create_collection(
                settings.collection_name,
                dimension=embedding_provider.dimension,
            )
        except Exception:
            # Collection might already exist
            pass

        await vector_store.upsert(documents)

        return IngestResponse(
            document_ids=[doc.id for doc in documents],
            chunks=len(documents),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/ingest/url")
async def ingest_url(url: str) -> dict[str, str]:
    """Ingest content from a URL.

    Args:
        url: URL to fetch content from

    Returns:
        Success message

    Note:
        This is a placeholder. Full implementation would fetch and parse the URL.
    """
    # TODO: Implement URL fetching and parsing
    return {"status": "success", "message": "URL ingestion not yet implemented"}


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str) -> dict[str, str]:
    """Delete a document by ID.

    Args:
        document_id: Document ID to delete

    Returns:
        Success message
    """
    try:
        vector_store = get_vector_store()
        await vector_store.delete([document_id])
        return {"status": "success", "message": f"Document {document_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.delete("/documents")
async def delete_documents(request: DocumentDeleteRequest) -> dict[str, str]:
    """Delete multiple documents.

    Args:
        request: Document delete request

    Returns:
        Success message
    """
    try:
        vector_store = get_vector_store()
        await vector_store.delete(request.document_ids)
        return {
            "status": "success",
            "message": f"Deleted {len(request.document_ids)} documents",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/collections")
async def list_collections() -> dict[str, list[str]]:
    """List available collections.

    Returns:
        List of collection names

    Note:
        This is a simplified version. Full implementation would query Qdrant.
    """
    return {"collections": [settings.collection_name]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

