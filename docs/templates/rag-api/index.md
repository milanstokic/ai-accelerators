# RAG API Template

A production-ready RAG (Retrieval-Augmented Generation) API template for building knowledge base applications.

## Overview

The RAG API template provides:
- Document ingestion with automatic chunking
- Vector-based semantic search
- LLM-powered answer generation
- Source citation
- Streaming responses
- Collection management

## Features

- ✅ Document ingestion (text)
- ✅ Automatic text chunking
- ✅ Embedding generation
- ✅ Vector store integration (Qdrant)
- ✅ Semantic search with filters
- ✅ LLM-powered answer generation
- ✅ Source citations
- ✅ Streaming responses
- ✅ Document deletion
- ✅ Collection management

## Quick Start

See the [Quickstart Guide](quickstart.md) to get started in 15 minutes.

## Documentation

- [Quickstart](quickstart.md) - Get running quickly
- [Configuration](configuration.md) - All configuration options
- [API Reference](api-reference.md) - Complete API documentation
- [Customization](customization.md) - How to extend the template
- [Deployment](deployment.md) - Deploy to production
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## Architecture

```
Client → FastAPI → Vector Store (Qdrant)
                ↓
            Embeddings (OpenAI)
                ↓
            LLM (Anthropic/OpenAI)
```

## Use Cases

- Document Q&A systems
- Knowledge bases
- Customer support bots
- Internal documentation search
- Research assistants

## Next Steps

- [Quickstart Guide](quickstart.md)
- [First RAG App](../../getting-started/first-rag-app.md)

