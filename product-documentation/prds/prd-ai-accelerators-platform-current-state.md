# AI Accelerators Platform - Comprehensive Product Requirements Document (Current State)

**Version:** 1.0  
**Author:** AI Platform Team  
**Created:** 2026-01-14  
**Last Updated:** 2026-01-14  
**Status:** Current State Documentation

---

## 1. Executive Summary

The AI Accelerators Platform is a comprehensive monorepo designed to accelerate the development and deployment of production-ready AI applications. The platform consists of four major components:

1. **AI Accelerators SDK** (`accelerators`) - A Python library providing unified abstractions for LLMs, vector stores, embeddings, observability, and configuration management
2. **Application Templates** - Pre-built, production-ready application scaffolds for common AI use cases
3. **Infrastructure Modules** - Terraform modules for Google Cloud Platform (GCP) deployment
4. **Backstage Developer Portal** - A Spotify Backstage-based developer portal with an AI-powered chatbot assistant

The platform's goal is to reduce time-to-first-deployment for AI applications from weeks to under 4 hours while maintaining enterprise-grade quality, security, and observability standards.

---

## 2. Platform Architecture Overview

```
ai-accelerators/
├── sdk/                    # Python SDK (accelerators package)
│   └── src/accelerators/
│       ├── llm/            # LLM provider abstractions
│       ├── vectorstore/    # Vector database operations
│       ├── embeddings/     # Text embedding generation
│       ├── observability/  # Tracing and monitoring
│       └── config/         # Configuration management
├── templates/              # Application templates
│   └── rag-api/            # RAG API template
├── infra/                  # Terraform infrastructure
│   └── modules/
│       └── cloud-run/      # Cloud Run deployment module
├── backstage/              # Developer portal
│   ├── packages/           # Backstage app and backend
│   └── plugins/            # Custom plugins
│       ├── ai-chatbot/     # Frontend chatbot plugin
│       └── ai-chatbot-backend/  # Backend chatbot plugin
└── docs/                   # Documentation
    ├── getting-started/
    ├── templates/
    └── infrastructure/
```

---

## 3. Component 1: AI Accelerators SDK

### 3.1 Overview

The SDK (`accelerators`) is a Python package (version 0.1.0) that provides abstractions and utilities shared across all templates and applications. It is designed to be:

- **Incrementally adoptable** - Use one module without importing everything
- **Provider-agnostic** - Swap LLM or vector DB providers via configuration
- **Observable by default** - All operations instrumented for tracing
- **Type-safe** - Full type hints and Pydantic models

### 3.2 Technical Specifications

| Specification | Value |
|---------------|-------|
| Package Name | `accelerators` |
| Version | 0.1.0 |
| Python Version | 3.11+ |
| Build System | Hatchling |
| License | MIT |

### 3.3 SDK Modules - Current Implementation

#### 3.3.1 LLM Module (`accelerators.llm`)

**Purpose**: Unified interface for interacting with LLM providers

**Implemented Components**:

| Component | Description | Status |
|-----------|-------------|--------|
| `LLMClient` | Unified client interface supporting multiple providers | ✅ Implemented |
| `AnthropicProvider` | Anthropic Claude integration | ✅ Implemented |
| `OpenAIProvider` | OpenAI GPT integration | ✅ Implemented |
| `Message` | Pydantic model for conversation messages | ✅ Implemented |
| `LLMResponse` | Pydantic model for completion responses | ✅ Implemented |
| `LLMStreamChunk` | Pydantic model for streaming responses | ✅ Implemented |

**Supported Providers**:
- ✅ Anthropic (Claude models)
- ✅ OpenAI (GPT-4, GPT-4o)
- 🔲 Google (Gemini) - Defined in enum, not implemented
- 🔲 Ollama (local models) - Defined in enum, not implemented

**Features**:
- Streaming and non-streaming completions
- Automatic retries with exponential backoff (tenacity)
- Token usage tracking
- Error handling with custom exception types:
  - `LLMAuthenticationError`
  - `LLMRateLimitError`
  - `LLMProviderError`
  - `LLMError`

**API Interface**:
```python
from accelerators.llm import LLMClient, Message

client = LLMClient(
    provider="anthropic",
    api_key="sk-ant-...",
    model="claude-sonnet-4-20250514"
)

# Non-streaming completion
response = await client.complete(
    messages=[Message(role="user", content="Hello!")],
    max_tokens=1000,
    temperature=1.0
)

# Streaming completion
async for chunk in client.stream(messages):
    print(chunk.content, end="")
```

#### 3.3.2 Vector Store Module (`accelerators.vectorstore`)

**Purpose**: Unified interface for vector database operations

**Implemented Components**:

| Component | Description | Status |
|-----------|-------------|--------|
| `VectorStore` | Abstract base class defining interface | ✅ Implemented |
| `QdrantVectorStore` | Qdrant vector database implementation | ✅ Implemented |
| `Document` | Pydantic model for documents | ✅ Implemented |
| `SearchResult` | Pydantic model for search results | ✅ Implemented |

**Supported Providers**:
- ✅ Qdrant (primary)
- 🔲 PostgreSQL with pgvector (planned)

**Features**:
- Collection management (create, delete)
- Document upsert with metadata
- Similarity search with filters
- Batch operations
- Async operations

**API Interface**:
```python
from accelerators.vectorstore import QdrantVectorStore, Document

store = QdrantVectorStore(
    url="http://localhost:6333",
    collection_name="knowledge_base"
)

# Create collection
await store.create_collection("knowledge_base", dimension=1536)

# Upsert documents
await store.upsert([
    Document(
        id="doc1",
        content="Hello world",
        metadata={"source": "test"},
        embedding=[0.1, 0.2, ...]
    )
])

# Search
results = await store.search(
    query_vector=[0.1, 0.2, ...],
    limit=10,
    filters={"source": "test"}
)
```

#### 3.3.3 Embeddings Module (`accelerators.embeddings`)

**Purpose**: Generate embeddings for text content

**Implemented Components**:

| Component | Description | Status |
|-----------|-------------|--------|
| `EmbeddingProvider` | Abstract base class | ✅ Implemented |
| `OpenAIEmbeddingProvider` | OpenAI embeddings implementation | ✅ Implemented |

**Supported Providers**:
- ✅ OpenAI (text-embedding-3-small, text-embedding-3-large)
- 🔲 Sentence Transformers (planned)

#### 3.3.4 Observability Module (`accelerators.observability`)

**Purpose**: Instrument applications for monitoring and debugging

**Implemented Components**:

| Component | Description | Status |
|-----------|-------------|--------|
| `observe` | Decorator for function tracing | ✅ Implemented |
| `trace` | Context manager for span creation | ✅ Implemented |

**Features**:
- Langfuse integration for LLM tracing
- Automatic trace propagation
- Custom span creation

**API Interface**:
```python
from accelerators.observability import observe, trace

@observe(name="rag_query")
async def handle_query(query: str) -> str:
    with trace.span("retrieval"):
        docs = await retrieve(query)
    
    with trace.span("generation"):
        response = await generate(query, docs)
    
    return response
```

#### 3.3.5 Config Module (`accelerators.config`)

**Purpose**: Configuration management with environment awareness

**Implemented Components**:

| Component | Description | Status |
|-----------|-------------|--------|
| `BaseSettings` | Extended Pydantic Settings base class | ✅ Implemented |

**Features**:
- Pydantic Settings integration
- Environment variable loading with `.env` file support
- Configuration validation
- Case-insensitive environment variables

**API Interface**:
```python
from accelerators.config import BaseSettings
from pydantic_settings import SettingsConfigDict

class AppSettings(BaseSettings):
    api_key: str
    debug: bool = False
    
    model_config = SettingsConfigDict(
        env_prefix="APP_",
    )

settings = AppSettings()
# Loads from APP_API_KEY, APP_DEBUG environment variables
```

### 3.4 SDK Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| pydantic | >=2.5.0 | Data validation and models |
| pydantic-settings | >=2.1.0 | Configuration management |
| anthropic | >=0.18.0 | Anthropic Claude API |
| openai | >=1.12.0 | OpenAI API |
| httpx | >=0.26.0 | HTTP client |
| tenacity | >=8.2.0 | Retry logic |
| qdrant-client | >=1.7.0 | Qdrant vector database |

**Optional Dependencies**:
- `langfuse>=2.31.0` (observability)
- `google-cloud-secret-manager>=2.18.0` (GCP)

---

## 4. Component 2: Application Templates

### 4.1 RAG API Template

**Location**: `templates/rag-api/`

**Purpose**: Production-ready Retrieval-Augmented Generation API for document Q&A and knowledge bases

**Status**: ✅ Implemented (MVP + Enhanced versions)

#### 4.1.1 Technical Specifications

| Specification | Value |
|---------------|-------|
| Framework | FastAPI |
| Python Version | 3.11+ |
| API Version | 0.2.0 |
| Default Port | 8000 |

#### 4.1.2 Implemented Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/health` | GET | Health check | ✅ |
| `/ready` | GET | Readiness check | ✅ |
| `/query` | POST | Query knowledge base | ✅ |
| `/query/stream` | POST | Streaming query response | ✅ |
| `/ingest` | POST | Ingest documents | ✅ |
| `/ingest/url` | POST | Ingest from URL | 🔲 Placeholder |
| `/documents/{id}` | DELETE | Delete document | ✅ |
| `/documents` | DELETE | Delete multiple documents | ✅ |
| `/collections` | GET | List collections | ✅ (simplified) |

#### 4.1.3 Configuration Options

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `RAG_LLM_PROVIDER` | LLM provider (anthropic/openai) | anthropic |
| `RAG_LLM_API_KEY` | LLM API key | Required |
| `RAG_LLM_MODEL` | LLM model identifier | Provider default |
| `RAG_EMBEDDING_PROVIDER` | Embedding provider | openai |
| `RAG_EMBEDDING_API_KEY` | Embedding API key | Required |
| `RAG_EMBEDDING_MODEL` | Embedding model | text-embedding-3-small |
| `RAG_QDRANT_URL` | Qdrant server URL | http://localhost:6333 |
| `RAG_QDRANT_API_KEY` | Qdrant API key | Optional |
| `RAG_COLLECTION_NAME` | Vector collection name | documents |
| `RAG_DEBUG` | Debug mode | false |

#### 4.1.4 Features

- **Document Ingestion**: Text chunking with configurable overlap
- **Semantic Search**: Vector similarity search via Qdrant
- **RAG Pipeline**: Query → Embed → Retrieve → Generate with context
- **Streaming**: Server-sent events for real-time responses
- **Observability**: Integrated tracing with `@observe` decorator
- **Metadata Filtering**: Filter search results by metadata

#### 4.1.5 Docker Support

```dockerfile
# Multi-stage build
FROM python:3.11-slim
# Installs SDK and dependencies
# Exposes port 8000
```

### 4.2 Planned Templates (Not Yet Implemented)

| Template | Purpose | Status |
|----------|---------|--------|
| Chat Agent | Conversational agents with tool calling | 🔲 Planned |
| Document Processor | Async document processing pipelines | 🔲 Planned |
| Voice Assistant | Telephony integration for voice agents | 🔲 Planned |
| React Chat UI | Frontend chat interface | 🔲 Planned |

---

## 5. Component 3: Infrastructure Modules

### 5.1 Cloud Run Module

**Location**: `infra/modules/cloud-run/`

**Purpose**: Deploy containerized services to Google Cloud Run

**Status**: ✅ Implemented

#### 5.1.1 Technical Specifications

| Specification | Value |
|---------------|-------|
| Terraform Version | >= 1.5.0 |
| Google Provider | ~> 5.0 |
| Resource Type | `google_cloud_run_service` |

#### 5.1.2 Input Variables

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `project_id` | string | GCP Project ID | Required |
| `region` | string | GCP Region | us-central1 |
| `service_name` | string | Cloud Run service name | Required |
| `image` | string | Container image URL | Required |
| `service_account_email` | string | Service account email | null |
| `env_vars` | map(string) | Environment variables | {} |
| `secrets` | map(string) | Secret environment variables | {} |
| `min_instances` | number | Minimum instances | 0 |
| `max_instances` | number | Maximum instances | 100 |
| `cpu` | string | CPU allocation | "1" |
| `memory` | string | Memory allocation | "512Mi" |
| `timeout` | number | Request timeout (seconds) | 300 |
| `allow_unauthenticated` | bool | Allow public access | false |

#### 5.1.3 Outputs

| Output | Description |
|--------|-------------|
| `service_url` | URL of the deployed Cloud Run service |
| `service_name` | Name of the Cloud Run service |
| `service_location` | Location of the Cloud Run service |

#### 5.1.4 Features

- Secret Manager integration for sensitive values
- Auto-scaling with min/max instance configuration
- IAM policy for unauthenticated access (optional)
- Traffic routing to latest revision

### 5.2 Planned Infrastructure Modules (Not Yet Implemented)

| Module | Purpose | Status |
|--------|---------|--------|
| cloud-sql | PostgreSQL database | 🔲 Planned |
| qdrant | Vector database deployment | 🔲 Planned |
| redis | Caching and pub/sub | 🔲 Planned |
| networking | VPC and connectivity | 🔲 Planned |
| secrets | Secret management | 🔲 Planned |
| observability | Monitoring stack | 🔲 Planned |

---

## 6. Component 4: Backstage Developer Portal

### 6.1 Overview

The Backstage Developer Portal provides a unified interface for discovering and understanding the AI Accelerators platform. It includes custom plugins for an AI-powered assistant.

**Location**: `backstage/`

**Status**: ✅ Implemented

### 6.2 Technical Specifications

| Specification | Value |
|---------------|-------|
| Backstage Version | Latest (v1.x) |
| Frontend Framework | React |
| Backend Framework | Node.js/Express |
| Database (dev) | SQLite (in-memory) |
| Authentication | Guest (development) |
| Port (Frontend) | 3000 |
| Port (Backend) | 7007 |

### 6.3 Backstage Features

| Feature | Description | Status |
|---------|-------------|--------|
| Service Catalog | Browse components, templates, SDK modules | ✅ |
| TechDocs | Documentation rendering | ✅ |
| Search | Cross-catalog search | ✅ |
| Scaffolder | Create new projects from templates | ✅ |
| API Explorer | Interactive API documentation | ✅ |
| AI Chatbot | Natural language assistant | ✅ |
| Custom Home Page | Platform overview and navigation | ✅ |

### 6.4 Service Catalog Entities

**Systems**:
- `ai-accelerators` - Main platform system
- `ai-accelerators-sdk` - SDK system
- `ai-accelerators-infrastructure` - Infrastructure system

**Components**:
| Entity Name | Type | Description |
|-------------|------|-------------|
| `rag-api-template` | template | RAG API application template |
| `accelerators-llm` | library | LLM SDK module |
| `accelerators-vectorstore` | library | Vector store SDK module |
| `accelerators-embeddings` | library | Embeddings SDK module |
| `accelerators-observability` | library | Observability SDK module |
| `accelerators-config` | library | Config SDK module |
| `cloud-run-module` | resource | Cloud Run Terraform module |

**Groups**:
- `ai-platform-team` - Owning team

### 6.5 AI Chatbot Plugin

**Frontend Plugin**: `backstage/plugins/ai-chatbot/`
**Backend Plugin**: `backstage/plugins/ai-chatbot-backend/`

#### 6.5.1 Architecture

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
│  │  │  Query    │ │ Index     │ │  Response         │  │    │
│  │  │  Router   │ │ Manager   │ │  Validator        │  │    │
│  │  └───────────┘ └───────────┘ └───────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  Vector  │   │   LLM    │   │ Backstage│
        │  Store   │   │(Anthropic)   │ Catalog  │
        │ (Qdrant) │   │          │   │  API     │
        └──────────┘   └──────────┘   └──────────┘
```

#### 6.5.2 Frontend Components

| Component | Description | File |
|-----------|-------------|------|
| `AiChatbotSidebar` | Main sidebar integration | plugin.ts |
| `ChatPanel` | Collapsible chat panel | ChatPanel/ChatPanel.tsx |
| `ChatMessage` | Message display component | ChatMessage/ChatMessage.tsx |
| `ChatInput` | Input field component | ChatInput/ChatInput.tsx |
| `SourceCitation` | Citation link component | SourceCitation/SourceCitation.tsx |

#### 6.5.3 Backend Services

| Service | Description | File |
|---------|-------------|------|
| Router | API endpoints (`/chat`, `/health`, `/index`) | router.ts |
| Retriever | Vector search for relevant documents | retriever.ts |
| Generator | LLM response generation with citations | generator.ts |
| Validator | Response validation and guardrails | validator.ts |
| Indexer | Content indexing pipeline | indexer.ts |

#### 6.5.4 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai-chatbot/health` | GET | Health check with index status |
| `/api/ai-chatbot/chat` | POST | Send chat message, receive response |
| `/api/ai-chatbot/index` | POST | Trigger index refresh (admin) |

#### 6.5.5 Configuration

```yaml
# app-config.yaml
aiChatbot:
  anthropicApiKey: ${ANTHROPIC_API_KEY}
  qdrantUrl: ${QDRANT_URL:-http://localhost:6333}
  qdrantCollection: ${QDRANT_COLLECTION:-backstage_knowledge}
  model: ${AI_CHATBOT_MODEL:-claude-3-haiku-20240307}
```

#### 6.5.6 Hallucination Prevention Guardrails

The chatbot implements multi-layer guardrails:

1. **Source Grounding**: Only uses information from retrieved documents
2. **System Prompt Enforcement**: Explicit rules forbidding speculation
3. **Citation Requirement**: Every claim must cite a source
4. **Scope Boundaries**: Redirects out-of-scope queries
5. **Response Validation**: Verifies entity names and URLs
6. **Confidence Scoring**: Tracks response confidence levels

#### 6.5.7 Chatbot System Prompt

```
You are an AI assistant for the AI Accelerators developer portal.

CRITICAL RULES:
1. ONLY use information from the PROVIDED CONTEXT DOCUMENTS
2. ALWAYS cite sources using [1], [2], etc. format
3. If the answer is not in the context, say "I don't have information about that"
4. NEVER make up information or speculate
5. Provide direct links to documentation when available
6. Keep answers concise and actionable
```

### 6.6 Home Page

**Location**: `backstage/packages/app/src/components/home/HomePage.tsx`

**Features**:
- Welcome message with platform overview
- Search bar integration
- Quick start highlight box
- Feature cards for all platform sections:
  - Service Catalog
  - TechDocs
  - API Documentation
  - Software Templates
  - AI Accelerators SDK
  - Infrastructure Modules
- Team information section

---

## 7. Documentation

### 7.1 Documentation Structure

```
docs/
├── getting-started/
│   ├── index.md              # Overview and navigation
│   ├── prerequisites.md      # Required tools and accounts
│   ├── installation.md       # SDK installation
│   ├── quickstart.md         # 15-minute tutorial
│   ├── first-rag-app.md      # Step-by-step RAG guide
│   ├── local-development.md  # Development environment
│   └── faq.md                # Frequently asked questions
├── infrastructure/
│   ├── index.md              # Infrastructure overview
│   ├── environments.md       # Environment configuration
│   ├── gcp-setup.md          # GCP setup guide
│   ├── terraform-guide.md    # Terraform usage
│   └── modules/
│       └── cloud-run.md      # Cloud Run module docs
├── sdk/                      # SDK documentation (planned)
│   └── docs/                 # Reference documentation
└── templates/
    └── rag-api/              # RAG API template docs
        ├── index.md
        ├── quickstart.md
        ├── configuration.md
        ├── customization.md
        ├── api-reference.md
        ├── deployment.md
        └── troubleshooting.md
```

### 7.2 Documentation Format

- **Format**: Markdown with MkDocs
- **Rendering**: Backstage TechDocs
- **Publisher**: Local (development), External storage (production)

---

## 8. CI/CD Pipeline

### 8.1 GitHub Actions Workflows

**Location**: `.github/workflows/`

#### 8.1.1 CI Workflow (`ci.yml`)

**Triggers**: Push/PR to main, develop branches

**Jobs**:

| Job | Description | Steps |
|-----|-------------|-------|
| `lint` | Code quality checks | black, ruff, mypy |
| `test` | Unit tests with coverage | pytest, codecov upload |
| `security` | Vulnerability scanning | Trivy scanner |

#### 8.1.2 TechDocs Workflow (`techdocs.yml`)

**Purpose**: Generate and publish TechDocs documentation

### 8.2 Pre-commit Hooks

**Configuration**: `.pre-commit-config.yaml`

Hooks for code formatting and linting before commits.

---

## 9. Quality Assurance

### 9.1 Testing Configuration

| Specification | Value |
|---------------|-------|
| Test Framework | pytest |
| Coverage Target | 80% |
| Async Support | pytest-asyncio |
| Test Directory | `sdk/tests/` |

### 9.2 Code Quality Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| Black | Code formatting | Line length: 120, Python 3.11 |
| Ruff | Linting | E, W, F, I, B, C4, UP rules |
| MyPy | Type checking | Strict mode |

---

## 10. Security

### 10.1 Secret Management

- API keys loaded via environment variables
- Secret Manager integration for GCP deployments
- No secrets in code or configuration files

### 10.2 Container Security

- Multi-stage Docker builds
- Non-root user execution
- Minimal runtime images (python:3.11-slim)

### 10.3 Dependency Security

- Trivy vulnerability scanning in CI
- Pinned dependency versions
- Regular security updates

---

## 11. Feature Completeness Matrix

### 11.1 SDK Modules

| Module | Status | Core Features | Notes |
|--------|--------|---------------|-------|
| LLM | ✅ 80% | Anthropic, OpenAI providers | Missing: Google, Ollama |
| VectorStore | ✅ 70% | Qdrant provider | Missing: pgvector |
| Embeddings | ✅ 60% | OpenAI provider | Missing: Sentence Transformers |
| Observability | ✅ 50% | Basic tracing | Missing: Full Langfuse integration |
| Config | ✅ 80% | Env vars, validation | Missing: Hot reload |
| Auth | 🔲 0% | Not implemented | Planned |
| Evals | 🔲 0% | Not implemented | Planned |

### 11.2 Templates

| Template | Status | Notes |
|----------|--------|-------|
| RAG API | ✅ 90% | Full implementation |
| Chat Agent | 🔲 0% | Planned |
| Document Processor | 🔲 0% | Planned |
| Voice Assistant | 🔲 0% | Planned |
| React Chat UI | 🔲 0% | Planned |

### 11.3 Infrastructure

| Module | Status | Notes |
|--------|--------|-------|
| Cloud Run | ✅ 90% | Full implementation |
| Cloud SQL | 🔲 0% | Planned |
| Qdrant | 🔲 0% | Planned |
| Redis | 🔲 0% | Planned |
| Networking | 🔲 0% | Planned |
| Secrets | 🔲 0% | Planned |
| Observability | 🔲 0% | Planned |

### 11.4 Backstage Portal

| Feature | Status | Notes |
|---------|--------|-------|
| Service Catalog | ✅ 100% | Fully configured |
| TechDocs | ✅ 90% | Local generation |
| AI Chatbot | ✅ 85% | Core features complete |
| Home Page | ✅ 100% | Custom implementation |
| Scaffolder | ✅ 80% | RAG template available |
| Search | ✅ 100% | Backstage default |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| Accelerator | Pre-built template for a specific AI application pattern |
| SDK | Shared Python library providing common functionality |
| Template | Scaffolded project structure with working code |
| Module | Reusable Terraform configuration |
| RAG | Retrieval-Augmented Generation - AI pattern combining search with LLM |
| TechDocs | Backstage's documentation rendering system |
| Service Catalog | Backstage's service discovery and management system |
| ADR | Architecture Decision Record |

---

## 13. References

### Internal Documentation
- [AI Accelerators Platform PRD](prd-accelerators-platform.md)
- [Backstage Developer Portal PRD](prd-backstage-developer-portal.md)
- [Backstage AI Chatbot PRD](prd-backstage-ai-chatbot.md)
- [ADR-001: Backstage AI Chatbot Architecture](../adrs/adr-001-backstage-ai-chatbot-architecture.md)

### External Documentation
- [Backstage Documentation](https://backstage.io/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

---

## 14. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-14 | AI Platform Team | Initial comprehensive documentation of current state |

---

## 15. Appendix A: Environment Variables Reference

### A.1 SDK Environment Variables

| Variable | Module | Description |
|----------|--------|-------------|
| `ANTHROPIC_API_KEY` | llm | Anthropic API key |
| `OPENAI_API_KEY` | llm/embeddings | OpenAI API key |
| `QDRANT_URL` | vectorstore | Qdrant server URL |
| `QDRANT_API_KEY` | vectorstore | Qdrant API key |
| `LANGFUSE_PUBLIC_KEY` | observability | Langfuse public key |
| `LANGFUSE_SECRET_KEY` | observability | Langfuse secret key |

### A.2 RAG API Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RAG_LLM_PROVIDER` | LLM provider | anthropic |
| `RAG_LLM_API_KEY` | LLM API key | Required |
| `RAG_LLM_MODEL` | LLM model | claude-sonnet-4-20250514 |
| `RAG_EMBEDDING_PROVIDER` | Embedding provider | openai |
| `RAG_EMBEDDING_API_KEY` | Embedding API key | Required |
| `RAG_EMBEDDING_MODEL` | Embedding model | text-embedding-3-small |
| `RAG_QDRANT_URL` | Qdrant URL | http://localhost:6333 |
| `RAG_COLLECTION_NAME` | Collection name | documents |

### A.3 Backstage Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub API token | Required for GitHub features |
| `ANTHROPIC_API_KEY` | AI chatbot LLM key | Required for chatbot |
| `QDRANT_URL` | Vector store URL | http://localhost:6333 |
| `QDRANT_COLLECTION` | Chatbot collection | backstage_knowledge |
| `AI_CHATBOT_MODEL` | Claude model | claude-3-haiku-20240307 |

---

## 16. Appendix B: Quick Start Commands

### B.1 SDK Development

```bash
# Install SDK in development mode
cd sdk
pip install -e ".[dev]"

# Run tests
pytest

# Run with coverage
pytest --cov=accelerators --cov-report=html

# Format code
black src tests

# Lint code
ruff check src tests

# Type check
mypy src
```

### B.2 RAG API Template

```bash
# Setup
cd templates/rag-api
pip install -r requirements.txt

# Set environment variables
export RAG_LLM_PROVIDER=anthropic
export RAG_LLM_API_KEY=sk-ant-...
export RAG_LLM_MODEL=claude-sonnet-4-20250514

# Run
python src/main.py
# or
uvicorn src.main:app --reload
```

### B.3 Backstage Portal

```bash
# Setup and run
cd backstage
yarn install
yarn dev

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:7007
```

### B.4 Terraform Deployment

```bash
cd infra/examples/dev

# Initialize
terraform init

# Plan
terraform plan -var="project_id=my-project"

# Apply
terraform apply -var="project_id=my-project"
```

---

**End of Document**
