# Configuration

The RAG API uses environment variables for configuration. All settings use the `RAG_` prefix.

## Environment Variables

### LLM Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RAG_LLM_PROVIDER` | LLM provider: `anthropic`, `openai`, `google`, `ollama` | `anthropic` | Yes |
| `RAG_LLM_API_KEY` | API key for LLM provider | - | Yes |
| `RAG_LLM_MODEL` | Model name (provider-specific) | Provider default | No |

### Embedding Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RAG_EMBEDDING_PROVIDER` | Embedding provider: `openai`, `sentence-transformers` | `openai` | Yes |
| `RAG_EMBEDDING_API_KEY` | API key for embedding provider | - | Yes |
| `RAG_EMBEDDING_MODEL` | Embedding model name | `text-embedding-3-small` | No |

### Vector Store Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RAG_QDRANT_URL` | Qdrant server URL | `http://localhost:6333` | Yes |
| `RAG_QDRANT_API_KEY` | Qdrant API key (for cloud instances) | - | No |
| `RAG_COLLECTION_NAME` | Collection name for documents | `documents` | No |

### Application Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RAG_DEBUG` | Enable debug mode | `false` | No |

## Example Configuration

### Development

```bash
export RAG_LLM_PROVIDER=anthropic
export RAG_LLM_API_KEY=sk-ant-...
export RAG_LLM_MODEL=claude-sonnet-4-20250514
export RAG_EMBEDDING_PROVIDER=openai
export RAG_EMBEDDING_API_KEY=sk-...
export RAG_QDRANT_URL=http://localhost:6333
export RAG_COLLECTION_NAME=documents
export RAG_DEBUG=true
```

### Production

```bash
export RAG_LLM_PROVIDER=anthropic
export RAG_LLM_API_KEY=${ANTHROPIC_API_KEY}
export RAG_LLM_MODEL=claude-sonnet-4-20250514
export RAG_EMBEDDING_PROVIDER=openai
export RAG_EMBEDDING_API_KEY=${OPENAI_API_KEY}
export RAG_QDRANT_URL=https://your-qdrant-instance.com
export RAG_QDRANT_API_KEY=${QDRANT_API_KEY}
export RAG_COLLECTION_NAME=production-docs
export RAG_DEBUG=false
```

## Configuration Files

You can also use a `.env` file:

```bash
# .env
RAG_LLM_PROVIDER=anthropic
RAG_LLM_API_KEY=sk-ant-...
RAG_EMBEDDING_PROVIDER=openai
RAG_EMBEDDING_API_KEY=sk-...
RAG_QDRANT_URL=http://localhost:6333
```

Load with:

```bash
export $(cat .env | xargs)
```

## Provider-Specific Settings

### Anthropic

- Models: `claude-sonnet-4-20250514`, `claude-opus-4-20250514`, `claude-haiku-4-20250514`
- API Key format: `sk-ant-...`

### OpenAI

- Models: `gpt-4`, `gpt-3.5-turbo`, `gpt-4-turbo`
- API Key format: `sk-...`

### Qdrant

- Local: `http://localhost:6333`
- Cloud: `https://your-instance.qdrant.io`
- API Key required for cloud instances

