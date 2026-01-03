# Embeddings Module

Generate embeddings for text content (OpenAI, Sentence Transformers).

## Overview

The Embeddings module provides a unified interface for generating text embeddings, which are essential for semantic search and similarity matching.

## Supported Providers

- **OpenAI**: `text-embedding-3-small`, `text-embedding-3-large`
- **Sentence Transformers**: Local models

## Basic Usage

```python
from accelerators.embeddings import OpenAIEmbeddingProvider

# Initialize provider
provider = OpenAIEmbeddingProvider(
    api_key="sk-...",
    model="text-embedding-3-small"
)

# Generate single embedding
embedding = await provider.embed("Hello, world!")
print(len(embedding))  # 1536

# Generate multiple embeddings
texts = ["Hello", "World", "AI"]
embeddings = await provider.embed_batch(texts)
print(len(embeddings))  # 3
```

## Batch Processing

```python
# Process large batches efficiently
texts = ["text1", "text2", "text3", ...]
embeddings = await provider.embed_batch(texts, batch_size=100)
```

## Next Steps

- [Observability Module](observability.md)
- [Examples](../../examples.md)

