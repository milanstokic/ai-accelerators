# AI Accelerators Repository

A monorepo containing reusable templates, a shared Python SDK, and Terraform infrastructure modules for rapidly building and deploying production-ready AI applications.

## 🚀 Quick Start

Get from zero to deployed AI application in under 4 hours.

```bash
# Install the SDK
cd sdk
pip install -e .

# Use a template
cd ../templates/rag-api
# Follow template-specific README
```

## 📁 Repository Structure

```
ai-accelerators/
├── sdk/              # Core Python SDK
├── templates/         # Application templates
├── infra/             # Terraform infrastructure modules
├── docs/              # Documentation
└── scripts/           # Development scripts
```

## 🎯 What's Included

### SDK (`accelerators`)
- **LLM Module**: Unified interface for Anthropic, OpenAI, Google, Ollama
- **Vector Store**: Qdrant and PostgreSQL with pgvector support
- **Embeddings**: OpenAI and Sentence Transformers
- **Observability**: Langfuse integration
- **Config**: Environment-based configuration management
- **Auth**: Authentication and authorization utilities

### Templates
- **RAG API**: Document Q&A and knowledge bases
- **Chat Agent**: Conversational agents with tool calling
- **Document Processor**: Async document processing pipelines
- **Voice Assistant**: Telephony integration for voice agents
- **React Chat UI**: Frontend chat interface

### Infrastructure
- Terraform modules for GCP deployment
- Cloud Run, Cloud SQL, Qdrant, Redis modules
- Environment configurations (dev, staging, prod)

## 📚 Documentation

- [Getting Started](docs/getting-started/index.md)
- [SDK Reference](docs/sdk/index.md)
- [Template Guides](docs/templates/)
- [Infrastructure Guide](docs/infrastructure/index.md)

## 🛠️ Development

See [Contributing Guide](docs/contributing/index.md) for development setup and guidelines.

## 📄 License

MIT

## 🔗 Links

- [Product Requirements](product-documentation/prds/prd-accelerators-platform.md)
- [Implementation Plan](product-documentation/project-plans/plan-accelerators-platform.md)
