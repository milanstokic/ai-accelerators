# AI Chatbot Backend Plugin

A Backstage backend plugin that provides the RAG (Retrieval-Augmented Generation) pipeline for the AI chatbot.

## Features

- 🔍 Vector search using Qdrant
- 🧠 LLM integration with Anthropic Claude
- ✅ Hallucination prevention guardrails
- 📊 Response validation and source grounding
- 🔄 Knowledge base indexing (TODO)

## Configuration

Add the following to your `app-config.yaml`:

```yaml
aiChatbot:
  # Required: Anthropic API key
  anthropicApiKey: ${ANTHROPIC_API_KEY}
  
  # Optional: Qdrant configuration
  qdrantUrl: ${QDRANT_URL:-http://localhost:6333}
  qdrantCollection: ${QDRANT_COLLECTION:-backstage_knowledge}
  
  # Optional: Model selection
  model: ${AI_CHATBOT_MODEL:-claude-3-haiku-20240307}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Anthropic API key for Claude |
| `QDRANT_URL` | No | `http://localhost:6333` | Qdrant server URL |
| `QDRANT_COLLECTION` | No | `backstage_knowledge` | Qdrant collection name |
| `AI_CHATBOT_MODEL` | No | `claude-3-haiku-20240307` | Claude model to use |

## API Endpoints

### POST /api/ai-chatbot/chat

Send a chat message and receive a response.

**Request:**
```json
{
  "message": "How do I create a RAG application?",
  "sessionId": "optional-session-id",
  "context": {
    "currentPath": "/docs/...",
    "entityRef": "component:default/rag-api"
  }
}
```

**Response:**
```json
{
  "message": "To create a RAG application, you can use the RAG API template...",
  "sources": [
    {
      "title": "RAG API Template",
      "url": "/docs/default/component/rag-api-template",
      "snippet": "The RAG API template is a FastAPI-based...",
      "relevance": 0.95
    }
  ],
  "confidence": 0.85,
  "sessionId": "generated-session-id"
}
```

### GET /api/ai-chatbot/health

Check the health status of the chatbot service.

**Response:**
```json
{
  "status": "healthy",
  "indexLastUpdated": "2026-01-13T10:00:00Z",
  "documentCount": 150
}
```

## Architecture

```
User Query → Query Embedder → Vector Search (Qdrant)
                                    ↓
Retrieved Docs → Context Builder → LLM (Claude) → Validator → Response
```

### Guardrails

The plugin implements multiple layers of hallucination prevention:

1. **Source Grounding**: Only uses information from retrieved documents
2. **Response Validation**: Verifies entity names, URLs, and citations
3. **Scope Enforcement**: Detects and handles out-of-scope queries
4. **Confidence Scoring**: Flags low-confidence responses

## Development

### Running Locally

1. Set the required environment variables
2. Start Backstage: `yarn dev`
3. The chat endpoint will be available at `http://localhost:7007/api/ai-chatbot/chat`

### Testing

```bash
# Test the health endpoint
curl http://localhost:7007/api/ai-chatbot/health

# Test the chat endpoint
curl -X POST http://localhost:7007/api/ai-chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What templates are available?"}'
```

## TODO

- [ ] Implement full knowledge base indexing from Catalog
- [ ] Implement TechDocs content parser
- [ ] Add embedding generation for queries
- [ ] Implement incremental index updates
- [ ] Add conversation memory to Redis
