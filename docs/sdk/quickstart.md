# Quick Start

Get started with the AI Accelerators SDK in 5 minutes.

## Installation

```bash
pip install accelerators
```

## Basic Usage

### LLM Client

```python
from accelerators.llm import LLMClient, Message

# Initialize client
client = LLMClient(
    provider="anthropic",
    api_key="sk-ant-...",
    model="claude-sonnet-4-20250514"
)

# Complete a conversation
response = await client.complete([
    Message(role="user", content="What is AI?")
])

print(response.content)
```

### Vector Store

```python
from accelerators.vectorstore import QdrantVectorStore, Document

# Initialize store
store = QdrantVectorStore(url="http://localhost:6333")

# Create collection
await store.create_collection("documents", dimension=1536)

# Add documents
doc = Document(
    content="AI is artificial intelligence",
    metadata={"source": "wikipedia"}
)
await store.add_documents([doc])

# Search
results = await store.search(
    query_vector=[0.1] * 1536,
    limit=5
)
```

### Embeddings

```python
from accelerators.embeddings import OpenAIEmbeddingProvider

# Initialize provider
provider = OpenAIEmbeddingProvider(
    api_key="sk-...",
    model="text-embedding-3-small"
)

# Generate embedding
embedding = await provider.embed("Hello, world!")
print(len(embedding))  # 1536
```

## Next Steps

- [LLM Module](modules/llm.md)
- [Vector Store Module](modules/vectorstore.md)
- [Examples](examples.md)

