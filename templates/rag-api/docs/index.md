# RAG API Template

Production-ready RAG (Retrieval-Augmented Generation) API template for building knowledge base applications.

## Overview

The RAG API Template provides a complete, production-ready FastAPI application for building Retrieval-Augmented Generation systems. It integrates with the AI Accelerators SDK to provide:

- **LLM Integration**: Support for multiple LLM providers (Anthropic, OpenAI, Google, Ollama)
- **Vector Store**: Qdrant integration for semantic search
- **Embeddings**: OpenAI embeddings for document vectorization
- **Observability**: Langfuse integration for tracing and monitoring
- **Streaming**: Real-time streaming responses

## Features

- ✅ FastAPI-based REST API
- ✅ Vector store integration (Qdrant)
- ✅ Multiple LLM provider support
- ✅ Streaming responses
- ✅ Document ingestion
- ✅ Health and readiness checks
- ✅ Observability with Langfuse
- ✅ Docker support
- ✅ Environment-based configuration

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  FastAPI    │────▶│  Vector      │────▶│   Qdrant    │
│   Server    │     │   Store      │     │  Database   │
└──────┬──────┘     └──────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│     LLM     │────▶│  Embeddings  │
│   Client    │     │   Provider   │
└─────────────┘     └──────────────┘
```

## Quick Links

- [Quick Start Guide](quickstart.md) - Get started in minutes
- [Configuration](configuration.md) - Environment variables and settings
- [API Reference](api-reference.md) - Complete API documentation
- [Deployment](deployment.md) - Deploy to production
- [Customization](customization.md) - Extend and customize
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## Dependencies

This template depends on the following AI Accelerators SDK modules:

- `accelerators.llm` - LLM client abstraction
- `accelerators.vectorstore` - Vector database operations
- `accelerators.embeddings` - Text embedding generation
- `accelerators.observability` - Tracing and monitoring
- `accelerators.config` - Configuration management

## License

Part of the AI Accelerators platform by HTEC.



