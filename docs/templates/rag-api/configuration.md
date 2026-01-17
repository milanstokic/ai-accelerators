# RAG API Configuration

Complete configuration guide for the RAG API template.

## Environment Variables

All configuration is done via environment variables with the `RAG_` prefix.

### LLM Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RAG_LLM_PROVIDER` | LLM provider (`anthropic`, `openai`) | `anthropic` | Yes |
| `RAG_LLM_API_KEY` | LLM provider API key | - | Yes |
| `RAG_LLM_MODEL` | LLM model identifier | Provider default | No |

### Embedding Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RAG_EMBEDDING_PROVIDER` | Embedding provider | `openai` | Yes |
| `RAG_EMBEDDING_API_KEY` | Embedding provider API key | - | Yes |
| `RAG_EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` | No |

### Vector Store Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RAG_QDRANT_URL` | Qdrant server URL | `http://localhost:6333` | Yes |
| `RAG_QDRANT_API_KEY` | Qdrant API key (optional) | - | No |
| `RAG_COLLECTION_NAME` | Default collection name | `documents` | No |

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
export RAG_DEBUG=true
```

### Production

```bash
export RAG_LLM_PROVIDER=anthropic
export RAG_LLM_API_KEY=sk-ant-...
export RAG_LLM_MODEL=claude-sonnet-4-20250514
export RAG_EMBEDDING_PROVIDER=openai
export RAG_EMBEDDING_API_KEY=sk-...
export RAG_QDRANT_URL=https://qdrant.example.com
export RAG_QDRANT_API_KEY=your-api-key
export RAG_COLLECTION_NAME=production_docs
```

## Configuration File

You can also use a `.env` file:

```bash
RAG_LLM_PROVIDER=anthropic
RAG_LLM_API_KEY=sk-ant-...
RAG_EMBEDDING_API_KEY=sk-...
RAG_QDRANT_URL=http://localhost:6333
```

## Next Steps

- [API Reference](api-reference.md)
- [Customization](customization.md)



