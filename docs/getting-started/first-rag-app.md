# Building Your First RAG Application

A step-by-step guide to building a complete RAG (Retrieval-Augmented Generation) application.

## Overview

This guide will walk you through:
1. Setting up the RAG API template
2. Ingesting documents
3. Querying the knowledge base
4. Deploying to production

## Step 1: Setup

### Install Dependencies

```bash
# Install SDK
cd sdk
pip install -e ".[dev]"

# Install template dependencies
cd ../templates/rag-api
pip install -r requirements.txt
```

### Configure Environment

```bash
export RAG_LLM_PROVIDER=anthropic
export RAG_LLM_API_KEY=sk-ant-...
export RAG_LLM_MODEL=claude-sonnet-4-20250514
export QDRANT_URL=http://localhost:6333  # If using local Qdrant
```

## Step 2: Start Services

### Start Qdrant (Local)

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Start RAG API

```bash
cd templates/rag-api/src
uvicorn main:app --reload
```

## Step 3: Ingest Documents

```python
from accelerators.embeddings import OpenAIEmbeddingProvider
from accelerators.vectorstore import QdrantVectorStore, Document

# Initialize components
embedding_provider = OpenAIEmbeddingProvider(api_key="sk-...")
vector_store = QdrantVectorStore(url="http://localhost:6333", collection_name="docs")

# Create collection
await vector_store.create_collection("docs", dimension=1536)

# Ingest documents
documents = [
    Document(
        id="doc1",
        content="Artificial intelligence is the simulation of human intelligence...",
        metadata={"source": "wikipedia", "topic": "AI"}
    ),
    Document(
        id="doc2",
        content="Machine learning is a subset of artificial intelligence...",
        metadata={"source": "wikipedia", "topic": "ML"}
    )
]

# Generate embeddings
for doc in documents:
    doc.embedding = await embedding_provider.embed(doc.content)

# Store in vector database
await vector_store.upsert(documents)
```

## Step 4: Query the Knowledge Base

```python
from accelerators.llm import LLMClient, Message

# Initialize LLM client
llm_client = LLMClient(
    provider="anthropic",
    api_key="sk-ant-...",
    model="claude-sonnet-4-20250514"
)

# Query
query = "What is machine learning?"
query_embedding = await embedding_provider.embed(query)

# Search vector store
results = await vector_store.search(query_embedding, limit=5)

# Build context from results
context = "\n\n".join([r.document.content for r in results])

# Generate answer with LLM
response = await llm_client.complete([
    Message(role="system", content="You are a helpful assistant."),
    Message(role="user", content=f"Context: {context}\n\nQuestion: {query}")
])

print(response.content)
```

## Step 5: Deploy to Production

### Build Container Image

```bash
docker build -t rag-api -f templates/rag-api/Dockerfile .
docker tag rag-api gcr.io/YOUR_PROJECT/rag-api:latest
docker push gcr.io/YOUR_PROJECT/rag-api:latest
```

### Deploy with Terraform

```bash
cd infra/examples/dev
terraform init
terraform apply -var="project_id=YOUR_PROJECT"
```

## Advanced Features

### Streaming Responses

```python
async for chunk in llm_client.stream(messages):
    print(chunk.content, end="")
```

### Filtered Search

```python
results = await vector_store.search(
    query_embedding,
    filters={"topic": "ML", "source": "wikipedia"}
)
```

### Observability

```python
from accelerators.observability import observe, trace

@observe(name="rag_query")
async def handle_query(query: str):
    with trace.span("retrieval"):
        results = await vector_store.search(...)
    
    with trace.span("generation"):
        response = await llm_client.complete(...)
    
    trace.log_evaluation("relevance", score=0.9)
    return response
```

## Next Steps

- Explore [Template Documentation](../templates/rag-api/) for more features
- Learn about [Vector Stores](../sdk/vectorstore.md)
- Check out [Infrastructure Guide](../infrastructure/) for deployment options



