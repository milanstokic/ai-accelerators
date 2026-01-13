# Backstage AI Chatbot Plugin - Product Requirements Document

**Version:** 1.0  
**Author:** AI Platform Team  
**Created:** 2026-01-13  
**Status:** Draft - Pending Review

---

## 1. Executive Summary

This PRD defines the requirements for an AI-powered chatbot plugin for the Backstage developer portal. The chatbot will serve as an intelligent assistant that helps developers discover resources, navigate documentation, and find answers to questions about the AI Accelerators platform using natural language.

The chatbot will index all Backstage catalog entities, TechDocs content, and API documentation, providing contextual answers with source citations and direct links to relevant resources.

---

## 2. Problem Statement

### Current Pain Points

1. **Information Overload**: Developers must navigate through multiple sections (Catalog, Docs, APIs) to find information
2. **Search Limitations**: Current search is keyword-based and doesn't understand context or intent
3. **Learning Curve**: New developers struggle to discover relevant resources and best practices
4. **Time to Answer**: Finding specific information requires multiple clicks and manual searching
5. **Context Switching**: Users must leave their current workflow to search for related information

### Target Outcome

An AI-powered chatbot that:
- Understands natural language queries about the platform
- Provides accurate, source-cited answers
- Links directly to relevant documentation and catalog entries
- Reduces time-to-answer from minutes to seconds
- Maintains strict accuracy through hallucination prevention guardrails

---

## 3. Goals and Non-Goals

### Goals

| Priority | Goal |
|----------|------|
| P0 | Provide natural language interface for querying platform resources |
| P0 | Index and search across Catalog entities, TechDocs, and APIs |
| P0 | Cite sources with direct links for every answer |
| P0 | Implement hallucination prevention guardrails |
| P1 | Provide contextual suggestions based on current page |
| P1 | Support follow-up questions and conversation context |
| P2 | Learn from user interactions to improve responses |
| P2 | Support multiple languages |

### Non-Goals

- Replacing the existing search functionality (complementary feature)
- Executing actions on behalf of users (read-only assistant)
- Accessing external resources outside Backstage
- Storing conversation history permanently (session-only)
- Real-time data updates (periodic re-indexing is acceptable)

---

## 4. Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Query response accuracy | N/A | > 90% | Manual review sampling |
| Source citation rate | N/A | 100% | Automated tracking |
| Average response time | N/A | < 3 seconds | Performance monitoring |
| User satisfaction | N/A | > 4.0/5.0 | In-chat feedback |
| Hallucination rate | N/A | < 2% | Manual audit |
| Daily active users | N/A | 50% of portal users | Analytics |

---

## 5. User Personas

### 5.1 New Developer
**Needs**: Quick answers about getting started, basic concepts, where to find things  
**Example Queries**:
- "How do I create a new RAG application?"
- "What SDK modules are available?"
- "Where can I find the deployment guide?"

### 5.2 Experienced Developer
**Needs**: Specific technical details, API references, advanced configurations  
**Example Queries**:
- "What are the configuration options for the LLM module?"
- "How do I customize the vector store provider?"
- "What's the API endpoint for document ingestion?"

### 5.3 Platform Engineer
**Needs**: Infrastructure details, service dependencies, ownership information  
**Example Queries**:
- "Who owns the Cloud Run module?"
- "What services depend on Qdrant?"
- "What Terraform modules are available for GCP?"

---

## 6. Functional Requirements

### 6.1 Chat Interface

**FR-1**: Collapsible sidebar panel on the right side of the UI
- Default state: Collapsed (icon button visible)
- Expanded state: 400px wide panel with chat interface
- Persists across page navigation within session

**FR-2**: Chat input with auto-suggestions
- Text input field at bottom of panel
- Submit on Enter or button click
- Character limit: 500 characters
- Suggested queries based on current page context

**FR-3**: Message display
- User messages aligned right
- Assistant messages aligned left with avatar
- Markdown rendering for responses
- Code block syntax highlighting
- Expandable source citations

**FR-4**: Conversation management
- Clear conversation button
- Session-based history (not persisted)
- Maximum 50 messages per session

### 6.2 Knowledge Indexing

**FR-5**: Catalog entity indexing
- Components, APIs, Resources, Systems, Groups, Users
- Entity metadata: name, description, tags, owner, lifecycle
- Relationships between entities

**FR-6**: TechDocs content indexing
- Full-text content from all documentation
- Section headings and hierarchy
- Code examples and configurations
- Last updated timestamps

**FR-7**: API documentation indexing
- OpenAPI/Swagger specifications
- Endpoint descriptions and parameters
- Request/response schemas

**FR-8**: Index refresh
- Full re-index: Daily at midnight
- Incremental updates: On catalog refresh events
- Manual trigger available for admins

### 6.3 Query Processing

**FR-9**: Natural language understanding
- Intent classification (search, explain, compare, how-to)
- Entity extraction (component names, concepts, actions)
- Query reformulation for better retrieval

**FR-10**: Retrieval-Augmented Generation (RAG)
- Semantic search across indexed content
- Top-k relevant chunks retrieval (k=5)
- Context window management

**FR-11**: Response generation
- Grounded responses based only on retrieved content
- Structured answers with clear sections
- Inline source citations with links

### 6.4 Hallucination Prevention Guardrails

**FR-12**: Source grounding enforcement
- Every claim must be traceable to indexed content
- Confidence scoring for each statement
- "I don't know" responses for low-confidence queries

**FR-13**: Factual consistency checks
- Cross-reference generated content with source
- Flag potential inconsistencies
- Prevent speculation beyond indexed content

**FR-14**: Response validation
- Entity name verification against catalog
- URL validation for cited links
- Version/date accuracy checks

**FR-15**: Scope boundaries
- Only answer questions about indexed content
- Redirect out-of-scope queries appropriately
- Clear communication of limitations

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Requirement | Target |
|-------------|--------|
| Response latency (P50) | < 2 seconds |
| Response latency (P99) | < 5 seconds |
| Index query time | < 500ms |
| UI render time | < 100ms |

### 7.2 Scalability

- Support 100 concurrent chat sessions
- Handle 1000 queries per hour
- Index up to 10,000 documents

### 7.3 Availability

- 99.9% uptime during business hours
- Graceful degradation when LLM unavailable
- Offline mode with basic search fallback

### 7.4 Security

- No sensitive data in chat logs
- Rate limiting: 30 queries per user per minute
- Input sanitization and validation
- No prompt injection vulnerabilities

---

## 8. Technical Architecture Overview

### 8.1 High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Backstage Frontend                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AI Chatbot Plugin (React)               │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │    │
│  │  │  Chat UI  │ │ Context   │ │ Source Citation   │  │    │
│  │  │ Component │ │ Provider  │ │ Component         │  │    │
│  │  └───────────┘ └───────────┘ └───────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backstage Backend                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           AI Chatbot Backend Plugin                  │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │    │
│  │  │  Query    │ │  Index    │ │  Response         │  │    │
│  │  │  Router   │ │  Manager  │ │  Validator        │  │    │
│  │  └───────────┘ └───────────┘ └───────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  Vector  │   │   LLM    │   │ Backstage│
        │  Store   │   │  (API)   │   │ Catalog  │
        │ (Qdrant) │   │          │   │  API     │
        └──────────┘   └──────────┘   └──────────┘
```

### 8.2 Data Flow

1. **Indexing Pipeline**:
   - Backstage Catalog → Entity Extractor → Embeddings → Vector Store
   - TechDocs → Content Parser → Chunker → Embeddings → Vector Store
   - OpenAPI Specs → Schema Parser → Embeddings → Vector Store

2. **Query Pipeline**:
   - User Query → Intent Classifier → Query Embedder → Vector Search
   - Retrieved Chunks → Context Builder → LLM → Response Validator → User

---

## 9. User Interface Design

### 9.1 Collapsed State
- Floating action button (FAB) in bottom-right corner
- Chat bubble icon with subtle animation
- Tooltip: "Ask AI Assistant"

### 9.2 Expanded State
```
┌─────────────────────────────┐
│ AI Assistant            [×] │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ How can I help you      │ │
│ │ explore the platform?   │ │
│ └─────────────────────────┘ │
│                             │
│ Suggested questions:        │
│ • What templates are        │
│   available?                │
│ • How do I get started?     │
│ • What SDK modules exist?   │
│                             │
├─────────────────────────────┤
│ ┌─────────────────────┐ [↑] │
│ │ Ask a question...   │     │
│ └─────────────────────┘     │
└─────────────────────────────┘
```

### 9.3 Response with Citations
```
┌─────────────────────────────┐
│ User: What is the RAG API?  │
├─────────────────────────────┤
│ The RAG API template is a   │
│ FastAPI-based application   │
│ for building Retrieval-     │
│ Augmented Generation        │
│ systems. [1]                │
│                             │
│ Key features:               │
│ • Document ingestion [2]    │
│ • Semantic search [2]       │
│ • LLM integration [3]       │
│                             │
│ Sources:                    │
│ [1] RAG API Overview        │
│     /docs/.../rag-api       │
│ [2] RAG API Quickstart      │
│     /docs/.../quickstart    │
│ [3] SDK LLM Module          │
│     /catalog/.../llm-module │
└─────────────────────────────┘
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up plugin scaffolding (frontend + backend)
- [ ] Implement basic chat UI component
- [ ] Create sidebar panel integration
- [ ] Set up development environment

### Phase 2: Indexing (Week 2-3)
- [ ] Implement catalog entity indexer
- [ ] Implement TechDocs content indexer
- [ ] Set up vector store (Qdrant)
- [ ] Create embedding pipeline

### Phase 3: RAG Pipeline (Week 3-4)
- [ ] Implement query processing
- [ ] Set up LLM integration
- [ ] Create retrieval pipeline
- [ ] Implement response generation

### Phase 4: Guardrails (Week 4-5)
- [ ] Implement source grounding
- [ ] Add factual consistency checks
- [ ] Create response validation
- [ ] Add scope boundary enforcement

### Phase 5: Polish & Testing (Week 5-6)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation

---

## 11. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM hallucinations | High | Medium | Multi-layer guardrails, strict grounding |
| High latency | Medium | Medium | Caching, optimized retrieval, streaming |
| Index staleness | Medium | Low | Event-driven updates, scheduled refreshes |
| Cost overruns (LLM API) | Medium | Medium | Rate limiting, caching, query optimization |
| Security vulnerabilities | High | Low | Input validation, prompt injection prevention |

---

## 12. Decisions (Resolved)

| Question | Decision |
|----------|----------|
| **LLM Provider** | Anthropic Claude (API key via environment variable `ANTHROPIC_API_KEY`) |
| **Vector Store** | Existing Qdrant instance |
| **Authentication** | Not required for initial release |
| **Infrastructure** | Dedicated backend service |

### Open Questions (Remaining)

1. **Analytics**: What conversation metrics should be tracked?
2. **Feedback Loop**: How should user corrections be incorporated?

---

## 13. Dependencies

- Backstage Plugin SDK
- Vector Store: Existing Qdrant instance
- LLM API: Anthropic Claude (`ANTHROPIC_API_KEY` environment variable)
- Embedding Model: Voyage AI or Claude embeddings
- AI Accelerators SDK (for LLM and Vector Store modules)

---

## 14. Appendix

### 14.1 Example Conversations

**Example 1: Getting Started**
```
User: I'm new here. How do I create my first AI application?
Assistant: Welcome! Start with the RAG API template via Create menu [1].

[1] /create
[2] /docs/.../quickstart

```

**Example 2: Technical Question**
```
User: What vector store providers does the SDK support?

Assistant: The AI Accelerators SDK supports multiple vector store providers [1]:

1. **Qdrant** (recommended) - Cloud-native vector database
2. **Pinecone** - Managed vector database service  
3. **Weaviate** - Open-source vector search engine
4. **ChromaDB** - Lightweight local option

Sources:
[1] Vector Store Module - /catalog/default/component/vectorstore-module
```

**Example 3: Out-of-Scope Query**
```
User: What is the weather today?

Assistant: I can only help with questions about the AI Accelerators platform, including templates, SDK modules, infrastructure, and documentation. For weather information, please use a weather service.
```

### 14.2 Guardrail Examples

**Hallucination Prevention in Action:**

| Query | Without Guardrails | With Guardrails |
|-------|-------------------|------------------|
| "Does SDK support Azure?" | "Yes, Azure is fully supported..." | "I don't have information about Azure support in the indexed documentation." |
| "What's the latest version?" | "Version 2.5.0 was released..." | "Based on the catalog, the current components are: [lists actual versions with sources]" |

---

## 15. Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 2026-01-13 | AI Platform Team | Initial draft |

---

**Review Status:** Pending approval before implementation

**Next Steps:**
1. Review PRD with stakeholders
2. Approve ADR-001 architecture decisions
3. Finalize open questions (LLM provider, infrastructure)
4. Begin Phase 1 implementation
