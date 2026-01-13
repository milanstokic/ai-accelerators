# ${{ values.name | capitalize }}

${{ values.description }}

## Overview

This is a RAG (Retrieval-Augmented Generation) API built with:
- **LLM Provider**: ${{ values.llmProvider | capitalize }}
- **Vector Store**: ${{ values.vectorStore | capitalize }}
- **Embedding Provider**: ${{ values.embeddingProvider | capitalize }}

## Quick Start

### Prerequisites

- Python 3.11+
- Docker (optional)
- API keys for your chosen providers

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Set the required environment variables:

```bash
# LLM Configuration
export RAG_LLM_PROVIDER="${{ values.llmProvider }}"
export RAG_LLM_API_KEY="your-api-key"
{% if values.llmModel %}export RAG_LLM_MODEL="${{ values.llmModel }}"{% endif %}

# Embedding Configuration
export RAG_EMBEDDING_PROVIDER="${{ values.embeddingProvider }}"
export RAG_EMBEDDING_API_KEY="your-api-key"
export RAG_EMBEDDING_MODEL="${{ values.embeddingModel }}"

# Vector Store Configuration
{% if values.vectorStore == 'qdrant' %}
export RAG_QDRANT_URL="http://localhost:6333"
export RAG_COLLECTION_NAME="${{ values.collectionName }}"
{% elif values.vectorStore == 'pinecone' %}
export RAG_PINECONE_API_KEY="your-api-key"
export RAG_PINECONE_ENVIRONMENT="your-environment"
export RAG_COLLECTION_NAME="${{ values.collectionName }}"
{% endif %}
```

### Running the API

```bash
# Development
uvicorn src.main:app --reload --port 8000

# Production
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Docker

```bash
# Build
docker build -t ${{ values.name }} .

# Run
docker run -p 8000:8000 --env-file .env ${{ values.name }}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/ready` | GET | Readiness check |
| `/query` | POST | Query the knowledge base |
| `/query/stream` | POST | Stream query response |
| `/ingest` | POST | Ingest text content |
| `/documents/{id}` | DELETE | Delete a document |

## Usage Examples

### Query the Knowledge Base

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is machine learning?", "top_k": 5}'
```

### Ingest Content

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"text": "Machine learning is a subset of AI...", "metadata": {"source": "intro"}}'
```

## Project Structure

```
${{ values.name }}/
├── src/
│   ├── main.py          # FastAPI application
│   └── config.py        # Configuration settings
├── tests/
│   └── test_api.py      # API tests
├── catalog-info.yaml    # Backstage catalog entry
├── Dockerfile           # Container definition
├── requirements.txt     # Python dependencies
└── README.md            # This file
```

## Documentation

Full documentation is available in the [Developer Portal](/docs/default/component/${{ values.name }}).

## Support

- **Owner**: ${{ values.owner }}
- **Issues**: [GitHub Issues](https://github.com/${{ values.destination.owner }}/${{ values.destination.repo }}/issues)
