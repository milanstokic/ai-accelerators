# RAG API Template

Minimal viable RAG (Retrieval-Augmented Generation) API template.

## Quick Start

### Prerequisites
- Python 3.11+
- API keys for LLM provider (Anthropic or OpenAI)

### Setup

1. Install dependencies:
```bash
cd templates/rag-api
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export RAG_LLM_PROVIDER=anthropic
export RAG_LLM_API_KEY=sk-ant-...
export RAG_LLM_MODEL=claude-sonnet-4-20250514
```

3. Run the application:
```bash
python src/main.py
```

Or with uvicorn:
```bash
uvicorn src.main:app --reload
```

### API Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `POST /query` - Query the knowledge base
- `POST /query/stream` - Stream query response
- `POST /ingest` - Ingest text (MVP - not stored)

### Example Usage

```bash
# Query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is AI?"}'

# Stream query
curl -X POST http://localhost:8000/query/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "Tell me a story"}'
```

## Docker

Build and run with Docker:

```bash
docker build -t rag-api -f templates/rag-api/Dockerfile .
docker run -p 8000:8000 \
  -e RAG_LLM_PROVIDER=anthropic \
  -e RAG_LLM_API_KEY=sk-ant-... \
  rag-api
```

## Development

This is a minimal viable version. Full features include:
- Vector store integration
- Document chunking
- Embedding generation
- Advanced retrieval strategies

