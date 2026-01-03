# Quick Start

Get your RAG API up and running in minutes.

## Prerequisites

- Python 3.11 or higher
- API keys for:
  - LLM provider (Anthropic or OpenAI)
  - Embedding provider (OpenAI)
- Qdrant instance (local or cloud)

## Installation

1. **Install dependencies:**

```bash
cd templates/rag-api
pip install -r requirements.txt
```

2. **Set environment variables:**

```bash
# LLM Configuration
export RAG_LLM_PROVIDER=anthropic
export RAG_LLM_API_KEY=sk-ant-...
export RAG_LLM_MODEL=claude-sonnet-4-20250514

# Embedding Configuration
export RAG_EMBEDDING_PROVIDER=openai
export RAG_EMBEDDING_API_KEY=sk-...
export RAG_EMBEDDING_MODEL=text-embedding-3-small

# Vector Store Configuration
export RAG_QDRANT_URL=http://localhost:6333
export RAG_COLLECTION_NAME=documents
```

3. **Start Qdrant (if using local instance):**

```bash
docker run -p 6333:6333 qdrant/qdrant
```

4. **Run the application:**

```bash
python src/main.py
```

Or with uvicorn for development:

```bash
uvicorn src.main:app --reload --port 8000
```

## Verify Installation

Check that the API is running:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy"
}
```

## First Query

Test the RAG API with a simple query:

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is artificial intelligence?",
    "top_k": 5,
    "max_tokens": 500
  }'
```

## Next Steps

- [Configure the API](configuration.md) for your use case
- [Ingest documents](api-reference.md#ingest-endpoint) into the knowledge base
- [Deploy to production](deployment.md)

