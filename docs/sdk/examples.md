# SDK Examples

Code examples for using the AI Accelerators SDK.

## Complete RAG Example

```python
from accelerators.llm import LLMClient, Message
from accelerators.vectorstore import QdrantVectorStore, Document
from accelerators.embeddings import OpenAIEmbeddingProvider

# Initialize components
llm = LLMClient(
    provider="anthropic",
    api_key="sk-ant-...",
    model="claude-sonnet-4-20250514"
)

embeddings = OpenAIEmbeddingProvider(api_key="sk-...")
vector_store = QdrantVectorStore(url="http://localhost:6333")

# Ingest documents
doc = Document(
    content="AI is artificial intelligence",
    metadata={"source": "wikipedia"}
)
await vector_store.add_documents([doc])

# Query
query = "What is AI?"
query_embedding = await embeddings.embed(query)
results = await vector_store.search(query_vector=query_embedding, limit=5)

# Generate answer
context = "\n".join([r.document.content for r in results])
response = await llm.complete([
    Message(role="system", content="Answer based on context."),
    Message(role="user", content=f"Context: {context}\n\nQuestion: {query}")
])

print(response.content)
```

## Streaming Example

```python
async for chunk in llm.stream([
    Message(role="user", content="Tell me a story")
]):
    print(chunk.content, end="", flush=True)
```

## Batch Embeddings

```python
texts = ["text1", "text2", "text3"]
embeddings_list = await embeddings.embed_batch(texts, batch_size=100)
```

## Next Steps

- [API Reference](api-reference.md)
- [Module Documentation](modules/)

