# ADR-001: Backstage AI Chatbot Architecture

**Status:** Approved  
**Date:** 2026-01-13  
**Decision Makers:** AI Platform Team  
**Technical Story:** Implement an AI-powered chatbot plugin for Backstage

---

## Context

The AI Accelerators platform uses Backstage as its developer portal. Users currently rely on keyword-based search and manual navigation to find information across the Catalog, TechDocs, and API documentation. This creates friction, especially for new developers who don't know the platform structure.

We need an AI assistant that can:
1. Answer natural language questions about the platform
2. Index and search across all Backstage resources
3. Provide source-cited answers with direct links
4. Prevent hallucinations through strict grounding

---

## Decision Drivers

1. **Accuracy**: Responses must be factually correct and verifiable
2. **Traceability**: Every answer must cite its sources with links
3. **Performance**: Response time must be under 3 seconds
4. **Integration**: Must work seamlessly within the existing Backstage UI
5. **Maintainability**: Architecture should leverage existing AI Accelerators SDK
6. **Cost Efficiency**: LLM usage must be optimized to control costs

---

## Considered Options

### Option 1: Full RAG Pipeline with Vector Store (Recommended)

**Architecture:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Query    │────▶│  Query Embedder │────▶│  Vector Search  │
└─────────────────┘     └─────────────────┘     │    (Qdrant)     │
                                                └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┘
                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  LLM Response   │◀────│ Context Builder │◀────│ Retrieved Docs  │
│  + Validation   │     │   + Grounding   │     │   (Top-K=5)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Components:**
- **Indexing Service**: Extracts and embeds content from Catalog, TechDocs, APIs
- **Vector Store**: Qdrant for semantic similarity search
- **RAG Pipeline**: Query → Retrieve → Generate → Validate
- **Response Validator**: Enforces source grounding, checks factual accuracy

**Pros:**
- Semantic understanding of queries
- High relevance ranking
- Supports complex questions
- Scalable to large knowledge bases
- Leverages existing AI Accelerators SDK (VectorStore, LLM modules)

**Cons:**
- Requires vector database infrastructure
- Initial indexing takes time
- LLM costs for each query

### Option 2: LLM with Full Context Window

**Architecture:**
- Load all documentation into LLM context window
- Use LLM directly without retrieval step

**Pros:**
- Simpler architecture
- No vector store needed
- Potentially better coherence

**Cons:**
- Context window limitations (can't fit all docs)
- Higher per-query costs
- No semantic ranking of relevance
- Slower response times
- Harder to enforce source citations

### Option 3: Keyword Search + LLM Summarization

**Architecture:**
- Use Backstage's built-in search for retrieval
- Pass search results to LLM for summarization

**Pros:**
- Leverages existing search infrastructure
- Simpler to implement
- Lower infrastructure costs

**Cons:**
- Keyword search misses semantic matches
- Poor handling of natural language queries
- Limited relevance ranking
- Still requires LLM for response generation

---

## Decision

**We will implement Option 1: Full RAG Pipeline with Vector Store.**

This decision is based on:
1. **Best accuracy**: Semantic search provides superior retrieval
2. **SDK alignment**: Leverages existing AI Accelerators VectorStore and LLM modules
3. **Scalability**: Can handle growing documentation
4. **Source grounding**: Easier to enforce citations with explicit retrieval

---

## Technical Architecture

### 1. Plugin Structure

```
backstage/
├── plugins/
│   ├── ai-chatbot/                    # Frontend plugin
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ChatPanel.tsx      # Main sidebar panel
│   │   │   │   ├── ChatMessage.tsx    # Message display
│   │   │   │   ├── ChatInput.tsx      # Input component
│   │   │   │   ├── SourceCitation.tsx # Citation links
│   │   │   │   └── SuggestedQueries.tsx
│   │   │   ├── api/
│   │   │   │   └── AiChatbotClient.ts # API client
│   │   │   ├── hooks/
│   │   │   │   └── useChat.ts         # Chat state hook
│   │   │   └── plugin.ts
│   │   └── package.json
│   │
│   └── ai-chatbot-backend/            # Backend plugin
│       ├── src/
│       │   ├── service/
│       │   │   ├── router.ts          # API routes
│       │   │   ├── indexer.ts         # Content indexing
│       │   │   ├── retriever.ts       # Vector search
│       │   │   ├── generator.ts       # LLM response
│       │   │   └── validator.ts       # Guardrails
│       │   └── plugin.ts
│       └── package.json
```

### 2. Indexing Pipeline

**Content Sources:**
| Source | Extraction Method | Metadata |
|--------|-------------------|----------|
| Catalog Entities | Backstage Catalog API | kind, name, description, owner, tags |
| TechDocs | Parse generated HTML/Markdown | title, path, headings, content |
| API Specs | OpenAPI parser | endpoints, descriptions, schemas |

**Chunking Strategy:**
- Chunk size: 500 tokens
- Overlap: 50 tokens
- Preserve heading hierarchy
- Include metadata in each chunk

**Embedding Model:**
- Primary: `text-embedding-3-small` (OpenAI) or equivalent
- Dimension: 1536
- Batch processing for efficiency

### 3. Query Pipeline

```typescript
interface QueryPipeline {
  // Step 1: Process query
  processQuery(query: string): ProcessedQuery;
  
  // Step 2: Retrieve relevant chunks
  retrieve(query: ProcessedQuery, topK: number): RetrievedChunk[];
  
  // Step 3: Build context with sources
  buildContext(chunks: RetrievedChunk[]): GroundedContext;
  
  // Step 4: Generate response
  generate(query: string, context: GroundedContext): RawResponse;
  
  // Step 5: Validate and format
  validate(response: RawResponse, context: GroundedContext): ValidatedResponse;
}
```

### 4. Hallucination Prevention Guardrails

**Layer 1: Retrieval Grounding**
- Only use information from retrieved chunks
- System prompt explicitly forbids external knowledge
- Require chunk reference for each claim

**Layer 2: Response Validation**
```typescript
interface ResponseValidator {
  // Check all entity names exist in catalog
  validateEntityNames(response: string): ValidationResult;
  
  // Verify all URLs are valid Backstage paths
  validateUrls(response: string): ValidationResult;
  
  // Ensure all citations map to retrieved chunks
  validateCitations(response: string, chunks: Chunk[]): ValidationResult;
  
  // Check confidence threshold
  checkConfidence(response: string): number;
}
```

**Layer 3: Scope Enforcement**
- Detect out-of-scope queries
- Return "I don't have information about that" for unknown topics
- Redirect to appropriate resources

**Layer 4: Output Filtering**
- Remove speculative language ("might", "possibly", "I think")
- Flag low-confidence responses for review
- Add disclaimer for partial answers

### 5. LLM Configuration

**System Prompt Template:**
```
You are an AI assistant for the AI Accelerators developer portal.

RULES:
1. ONLY answer based on the provided context documents
2. ALWAYS cite sources using [1], [2], etc. format
3. If the answer is not in the context, say "I don't have information about that"
4. NEVER make up information or speculate
5. Provide direct links to documentation when available
6. Keep answers concise and actionable

CONTEXT DOCUMENTS:
{retrieved_chunks_with_sources}

USER QUESTION: {query}
```

**Model Selection:**
- Primary: Anthropic Claude 3 Haiku (cost-effective, fast)
- Fallback: Claude 3 Sonnet (for complex queries)
- API Key: `ANTHROPIC_API_KEY` environment variable
- Temperature: 0.1 (low creativity, high consistency)
- Max tokens: 1000

### 6. API Design

**Endpoints:**
```typescript
// POST /api/ai-chatbot/chat
interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    currentPath: string;  // Current Backstage page
    entityRef?: string;   // Current entity being viewed
  };
}

interface ChatResponse {
  message: string;
  sources: Source[];
  confidence: number;
  sessionId: string;
}

interface Source {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

// POST /api/ai-chatbot/index (admin only)
interface IndexRequest {
  scope: 'full' | 'incremental';
  sources?: ('catalog' | 'techdocs' | 'apis')[];
}

// GET /api/ai-chatbot/health
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  indexLastUpdated: string;
  documentCount: number;
}
```

---

## Infrastructure Requirements

### Vector Store (Qdrant)
- **Collection**: `backstage_knowledge`
- **Vectors**: ~10,000 (estimated)
- **Storage**: ~500MB
- **Deployment**: Existing Qdrant instance (shared infrastructure)

### LLM API
- **Provider**: Anthropic Claude
- **Model**: Claude 3 Haiku (primary), Claude 3 Sonnet (fallback)
- **API Key**: Environment variable `ANTHROPIC_API_KEY`
- **Estimated Usage**: 
  - 1000 queries/day × 2000 tokens/query = 2M tokens/day
  - Cost: ~$1-3/day with Claude 3 Haiku

### Caching
- Cache frequent queries (Redis)
- TTL: 1 hour
- Cache key: hash(query + context)

---

## Security Considerations

### Input Validation
- Sanitize user input
- Limit query length (500 chars)
- Rate limiting (30 queries/user/minute)

### Prompt Injection Prevention
- Input filtering for known attack patterns
- System prompt hardening
- Output validation

### Data Privacy
- No PII in logs
- Session data not persisted
- API keys in secrets manager

---

## Rollout Strategy

### Phase 1: Internal Alpha
- Deploy to staging environment
- AI Platform team testing only
- Collect accuracy metrics

### Phase 2: Limited Beta
- Enable for select users
- Feedback collection
- Iterate on guardrails

### Phase 3: General Availability
- Full rollout to all users
- Monitoring and alerting
- Documentation published

---

## Consequences

### Positive
- Users can find information faster with natural language
- Reduced onboarding time for new developers
- Better discovery of platform capabilities
- Source citations ensure accuracy and traceability

### Negative
- Ongoing LLM API costs
- Index maintenance overhead
- Potential for edge-case hallucinations despite guardrails

### Risks
- LLM provider outages affect availability
- Index staleness if not properly maintained
- User trust if early responses have errors

---

## Alternatives Rejected

1. **No AI chatbot**: Would leave users with existing search limitations
2. **Third-party chatbot**: Less control over grounding and integration
3. **Fine-tuned model**: Higher cost, harder to update with new content

---

## References

- [Backstage Plugin Development](https://backstage.io/docs/plugins/)
- [RAG Best Practices](https://docs.llamaindex.ai/en/stable/)
- [AI Accelerators SDK Documentation](/docs/sdk/)
- [PRD: Backstage AI Chatbot](/product-documentation/prds/prd-backstage-ai-chatbot.md)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-13 | Proposed RAG architecture | Best balance of accuracy and cost |
| 2026-01-13 | Selected Anthropic Claude | Strong reasoning, good cost/performance |
| 2026-01-13 | Use existing Qdrant | Leverage existing infrastructure |
| 2026-01-13 | ADR Approved | Ready for implementation |

---

**Next Steps:**
1. ~~Review and approve this ADR~~ ✅
2. ~~Finalize LLM provider selection~~ ✅ Anthropic Claude
3. ~~Confirm vector store infrastructure~~ ✅ Existing Qdrant
4. Begin Phase 1 implementation
