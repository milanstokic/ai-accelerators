# AI Accelerators SDK

Unified Python SDK for building AI applications with consistent interfaces across multiple providers.

## Overview

The AI Accelerators SDK provides a unified interface for working with:

- **LLM Providers**: Anthropic, OpenAI, Google, Ollama
- **Vector Stores**: Qdrant, PostgreSQL with pgvector
- **Embeddings**: OpenAI, Sentence Transformers
- **Observability**: Langfuse integration for tracing and monitoring
- **Configuration**: Environment-aware settings management

## Features

- ✅ **Unified Interface**: Switch providers without changing code
- ✅ **Async Support**: Full async/await support
- ✅ **Type Safety**: Complete type hints
- ✅ **Observability**: Built-in tracing and monitoring
- ✅ **Configuration**: Environment-based settings
- ✅ **Production Ready**: Battle-tested in production

## Installation

```bash
pip install accelerators
```

Or from source:

```bash
git clone https://github.com/htec/ai-accelerators
cd ai-accelerators/sdk
pip install -e .
```

## Quick Example

```python
from accelerators.llm import LLMClient, Message
from accelerators.vectorstore import QdrantVectorStore
from accelerators.embeddings import OpenAIEmbeddingProvider

# LLM
client = LLMClient(
    provider="anthropic",
    api_key="sk-ant-...",
    model="claude-sonnet-4-20250514"
)

response = await client.complete([
    Message(role="user", content="Hello!")
])

# Vector Store
store = QdrantVectorStore(url="http://localhost:6333")
results = await store.search(query_vector=[0.1] * 1536, limit=5)

# Embeddings
provider = OpenAIEmbeddingProvider(api_key="sk-...")
embedding = await provider.embed("Hello, world!")
```

## Modules

### [LLM Module](modules/llm.md)
Unified interface for LLM providers. Supports Anthropic, OpenAI, Google, and Ollama.

### [Vector Store Module](modules/vectorstore.md)
Abstract interface for vector database operations. Supports Qdrant and PostgreSQL.

### [Embeddings Module](modules/embeddings.md)
Generate embeddings for text content. Supports OpenAI and Sentence Transformers.

### [Observability Module](modules/observability.md)
Instrument applications with Langfuse for tracing, monitoring, and cost tracking.

### [Config Module](modules/config.md)
Environment-aware configuration management with Pydantic Settings.

## Documentation

- [Quick Start Guide](quickstart.md) - Get started in 5 minutes
- [Module Documentation](modules/) - Detailed module guides
- [Examples](examples.md) - Code examples
- [API Reference](api-reference.md) - Complete API documentation

## License

Part of the AI Accelerators platform by HTEC.

