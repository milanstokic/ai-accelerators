# RAG API Customization

Guide for customizing and extending the RAG API template.

## Custom Chunking Strategy

Replace the simple chunking with a more sophisticated approach:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

def chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=50,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)
```

## Custom Reranking

Add reranking for better results:

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# After initial search
results = await vector_store.search(...)

# Rerank
pairs = [[request.query, r.document.content] for r in results]
scores = reranker.predict(pairs)

# Sort by rerank scores
reranked = sorted(zip(results, scores), key=lambda x: x[1], reverse=True)
```

## Custom Document Loaders

Add support for different document types:

```python
import requests
from bs4 import BeautifulSoup

async def load_from_url(url: str) -> str:
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    return soup.get_text()
```

## Custom Filters

Add more sophisticated filtering:

```python
# In query endpoint
filters = {
    "source": request.filters.get("source"),
    "date": {"$gte": "2024-01-01"}  # Example date filter
}
```

## Add Conversation Memory

```python
from redis import Redis

redis_client = Redis(host='localhost', port=6379)

@app.post("/query")
async def query_with_memory(request: QueryRequest, session_id: str):
    # Get conversation history
    history = redis_client.get(f"session:{session_id}")
    
    # Add to context
    messages = build_messages_with_history(request.query, history)
    
    # Store in Redis
    redis_client.set(f"session:{session_id}", json.dumps(messages))
```

## Custom Observability

Add custom metrics:

```python
from accelerators.observability import trace

@observe(name="rag_query")
async def query(request: QueryRequest):
    with trace.span("retrieval"):
        results = await vector_store.search(...)
        trace.set_metadata({"results_count": len(results)})
    
    trace.log_evaluation("relevance", score=0.9)
```

## Next Steps

- [Deployment Guide](deployment.md)
- [Troubleshooting](troubleshooting.md)

