# RAG API Reference

Complete API reference for the RAG API template.

## Base URL

```
http://localhost:8000
```

## Endpoints

### Health Check

#### GET /health

Check API health status.

**Response:**
```json
{
  "status": "healthy"
}
```

### Readiness Check

#### GET /ready

Check if API is ready to serve requests.

**Response:**
```json
{
  "status": "ready"
}
```

### Query

#### POST /query

Query the knowledge base with RAG.

**Request Body:**
```json
{
  "query": "What is artificial intelligence?",
  "max_tokens": 1000,
  "temperature": 1.0,
  "top_k": 5,
  "filters": {
    "source": "wikipedia"
  }
}
```

**Response:**
```json
{
  "answer": "Artificial intelligence is...",
  "sources": [
    {
      "id": "doc_123",
      "content": "AI is the simulation...",
      "score": 0.95,
      "metadata": {"source": "wikipedia"}
    }
  ],
  "model": "claude-sonnet-4-20250514",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 200
  }
}
```

### Stream Query

#### POST /query/stream

Stream query response.

**Request Body:** Same as `/query`

**Response:** Server-Sent Events (SSE) stream

```
data: Hello
data:  world
data: [DONE]
```

### Ingest

#### POST /ingest

Ingest text into the knowledge base.

**Request Body:**
```json
{
  "text": "Document content here...",
  "metadata": {
    "source": "wikipedia",
    "topic": "AI"
  },
  "chunk_size": 500
}
```

**Response:**
```json
{
  "document_ids": ["doc_123", "doc_124"],
  "chunks": 2
}
```

### Delete Document

#### DELETE /documents/{document_id}

Delete a document by ID.

**Response:**
```json
{
  "status": "success",
  "message": "Document doc_123 deleted"
}
```

### Delete Documents

#### DELETE /documents

Delete multiple documents.

**Request Body:**
```json
{
  "document_ids": ["doc_123", "doc_124"]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Deleted 2 documents"
}
```

### List Collections

#### GET /collections

List available collections.

**Response:**
```json
{
  "collections": ["documents"]
}
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `500` - Internal Server Error

## Next Steps

- [Customization](customization.md)
- [Deployment](deployment.md)

