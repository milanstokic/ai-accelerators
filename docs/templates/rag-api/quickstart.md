# RAG API Quickstart

Get the RAG API running in 15 minutes.

## Prerequisites

- Python 3.11+
- Docker (for Qdrant)
- API keys: Anthropic/OpenAI, OpenAI (for embeddings)

## Step 1: Start Qdrant

```bash
docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

## Step 2: Install Dependencies

```bash
cd templates/rag-api
pip install -r requirements.txt
```

## Step 3: Configure Environment

```bash
export RAG_LLM_PROVIDER=anthropic
export RAG_LLM_API_KEY=sk-ant-...
export RAG_LLM_MODEL=claude-sonnet-4-20250514
export RAG_EMBEDDING_PROVIDER=openai
export RAG_EMBEDDING_API_KEY=sk-...
export RAG_QDRANT_URL=http://localhost:6333
```

## Step 4: Run the API

```bash
cd src
python rag_api.py
```

Or with uvicorn:

```bash
uvicorn rag_api:app --reload
```

## Step 5: Ingest Documents

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial intelligence is the simulation of human intelligence by machines.",
    "metadata": {"source": "wikipedia", "topic": "AI"}
  }'
```

## Step 6: Query

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is artificial intelligence?",
    "top_k": 3
  }'
```

## Next Steps

- [Configuration Guide](configuration.md)
- [API Reference](api-reference.md)
- [Deployment Guide](deployment.md)



