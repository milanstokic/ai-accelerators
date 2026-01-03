# API Reference

Complete API reference for the AI Accelerators SDK.

## LLM Client

### `LLMClient`

Unified client for LLM providers.

#### Methods

- `complete(messages, model=None, max_tokens=None, temperature=1.0)` - Generate completion
- `stream(messages, model=None, max_tokens=None, temperature=1.0)` - Stream completion

## Vector Store

### `QdrantVectorStore`

Qdrant vector store implementation.

#### Methods

- `create_collection(name, dimension)` - Create collection
- `add_documents(documents)` - Add documents
- `search(query_vector, limit, filters=None)` - Search documents
- `delete_documents(document_ids)` - Delete documents

## Embeddings

### `OpenAIEmbeddingProvider`

OpenAI embedding provider.

#### Methods

- `embed(text)` - Generate single embedding
- `embed_batch(texts, batch_size=100)` - Generate batch embeddings

## Observability

### `observe(name)`

Decorator for instrumenting functions.

### `trace.span(name)`

Context manager for custom spans.

## Config

### `BaseSettings`

Base class for configuration settings.

## Next Steps

- [Examples](examples.md)
- [Module Documentation](modules/)

