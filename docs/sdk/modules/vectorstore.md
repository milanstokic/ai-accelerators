# Vector Store Module

Unified interface for vector database operations (Qdrant, PostgreSQL with pgvector).

## Overview

The Vector Store module provides a consistent interface for working with vector databases, enabling semantic search and similarity matching.

## Supported Providers

- **Qdrant**: High-performance vector database
- **PostgreSQL**: With pgvector extension

## Basic Usage

```python
from accelerators.vectorstore import QdrantVectorStore, Document

# Initialize store
store = QdrantVectorStore(url="http://localhost:6333")

# Create collection
await store.create_collection("documents", dimension=1536)

# Add documents
documents = [
    Document(
        content="AI is artificial intelligence",
        metadata={"source": "wikipedia", "topic": "AI"}
    ),
    Document(
        content="Machine learning is a subset of AI",
        metadata={"source": "wikipedia", "topic": "ML"}
    )
]
await store.add_documents(documents)

# Search
results = await store.search(
    query_vector=[0.1] * 1536,
    limit=5,
    filters={"source": "wikipedia"}
)

for result in results:
    print(result.document.content)
    print(result.score)
```

## Filtering

```python
# Metadata filters
results = await store.search(
    query_vector=embedding,
    limit=10,
    filters={
        "source": "wikipedia",
        "topic": {"$in": ["AI", "ML"]}
    }
)
```

## Next Steps

- [Embeddings Module](embeddings.md)
- [Examples](../../examples.md)

