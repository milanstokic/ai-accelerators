# Project Plan: RAG API Scaffolder Template

**Version:** 1.0  
**Created:** 2026-01-13  
**Status:** Complete

---

## Overview

Create a Backstage Software Template for scaffolding new RAG (Retrieval-Augmented Generation) API applications from the developer portal.

## Goals

1. Enable self-service creation of RAG applications
2. Provide configurable options for LLM, vector store, and embeddings
3. Generate production-ready code structure
4. Auto-register new applications in Backstage catalog

## Implementation Complete

### Template Structure

```
backstage/templates/rag-api/
├── template.yaml              # Scaffolder template definition
└── skeleton/                  # Template files
    ├── catalog-info.yaml      # Backstage catalog entry
    ├── README.md              # Project documentation
    ├── Dockerfile             # Container definition
    ├── requirements.txt       # Python dependencies
    ├── .gitignore            # Git ignore rules
    ├── env.example           # Environment variables template
    ├── src/
    │   ├── __init__.py
    │   ├── main.py           # FastAPI application
    │   └── config.py         # Configuration management
    └── tests/
        ├── __init__.py
        └── test_api.py       # API tests
```

### Configurable Parameters

| Parameter | Options | Default |
|-----------|---------|---------|
| `llmProvider` | anthropic, openai, google | anthropic |
| `vectorStore` | qdrant, pinecone, chromadb | qdrant |
| `embeddingProvider` | openai, voyage, cohere | openai |
| `collectionName` | Custom string | documents |

### Backend Changes

- Enabled `@backstage/plugin-scaffolder-backend`
- Enabled `@backstage/plugin-scaffolder-backend-module-github`
- Enabled `@backstage/plugin-catalog-backend-module-scaffolder-entity-model`

### Configuration Changes

- Added `Template` to allowed catalog rules
- Registered template in catalog locations

## Features

- ✅ Parameterized template with multiple provider options
- ✅ GitHub repository creation
- ✅ Auto-registration in Backstage catalog
- ✅ Production-ready project structure
- ✅ Docker support
- ✅ Test scaffolding
- ✅ Environment configuration templates

## Usage

1. Navigate to **Create** in Backstage
2. Select **RAG API Application** template
3. Fill in application details and configuration
4. Choose repository location
5. Click **Create**

The template will:
1. Generate the project from the skeleton
2. Create a new GitHub repository
3. Register the component in Backstage catalog
