# Project Plan: Backstage AI Chatbot Plugin

**Version:** 1.0  
**Created:** 2026-01-13  
**Status:** In Progress

---

## Overview

Implement an AI-powered chatbot plugin for Backstage that provides natural language search and Q&A capabilities across all platform resources.

## Approved Decisions

| Decision | Choice |
|----------|--------|
| LLM Provider | Anthropic Claude (via `ANTHROPIC_API_KEY`) |
| Vector Store | Existing Qdrant instance |
| Authentication | Not required (initial release) |
| Infrastructure | Dedicated backend service |

## Implementation Tasks

### Phase 1: Foundation

- [ ] Create frontend plugin (`@internal/plugin-ai-chatbot`)
- [ ] Create backend plugin (`@internal/plugin-ai-chatbot-backend`)
- [ ] Implement ChatPanel sidebar component
- [ ] Implement ChatMessage components with markdown support
- [ ] Implement ChatInput component
- [ ] Implement SourceCitation component

### Phase 2: Backend Infrastructure

- [ ] Create API routes (`/api/ai-chatbot/chat`, `/api/ai-chatbot/health`)
- [ ] Implement Qdrant connection using existing infrastructure
- [ ] Create indexing service for Catalog entities
- [ ] Create indexing service for TechDocs content
- [ ] Implement embedding generation

### Phase 3: RAG Pipeline

- [ ] Implement query processing and embedding
- [ ] Implement vector similarity search
- [ ] Integrate Anthropic Claude API
- [ ] Implement response generation with citations

### Phase 4: Guardrails

- [ ] Implement source grounding enforcement
- [ ] Add response validation (entity names, URLs)
- [ ] Implement scope boundary detection
- [ ] Add confidence scoring

### Phase 5: Integration

- [ ] Register plugins in Backstage app
- [ ] Add environment variable configuration
- [ ] Update app-config.yaml
- [ ] Testing and validation

## Files to Create

```
backstage/plugins/
├── ai-chatbot/                         # Frontend plugin
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── plugin.ts
│   │   ├── api/
│   │   │   ├── AiChatbotApi.ts
│   │   │   └── AiChatbotClient.ts
│   │   ├── components/
│   │   │   ├── ChatPanel/
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ChatMessage/
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ChatInput/
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── index.ts
│   │   │   └── SourceCitation/
│   │   │       ├── SourceCitation.tsx
│   │   │       └── index.ts
│   │   └── hooks/
│   │       └── useChat.ts
│   └── README.md
│
└── ai-chatbot-backend/                 # Backend plugin
    ├── package.json
    ├── src/
    │   ├── index.ts
    │   ├── plugin.ts
    │   └── service/
    │       ├── router.ts
    │       ├── indexer.ts
    │       ├── retriever.ts
    │       ├── generator.ts
    │       └── validator.ts
    └── README.md
```

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (defaults shown)
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=backstage_knowledge
AI_CHATBOT_MODEL=claude-3-haiku-20240307
```

## Success Criteria

- [ ] Chat sidebar opens/closes correctly
- [ ] Natural language queries return relevant results
- [ ] All responses include source citations with links
- [ ] Hallucination guardrails prevent false information
- [ ] Response time < 3 seconds
