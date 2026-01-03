# Local Development Setup

Guide for setting up a local development environment for the AI Accelerators platform.

## Prerequisites

- Python 3.11+
- Git
- Docker (for local services)
- IDE (VS Code, PyCharm, etc.)

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/htec/ai-accelerators.git
cd ai-accelerators
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 3. Install SDK in Development Mode

```bash
cd sdk
pip install -e ".[dev]"
```

### 4. Install Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

## Local Services

### Qdrant (Vector Database)

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  qdrant/qdrant
```

### Redis (Optional, for caching)

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine
```

## Development Workflow

### Running Tests

```bash
# All tests
cd sdk
pytest

# Specific test file
pytest tests/unit/llm/test_models.py

# With coverage
pytest --cov=accelerators --cov-report=html
```

### Code Quality

```bash
# Format code
black src tests

# Lint
ruff check src tests

# Type check
mypy src
```

### Running Templates Locally

```bash
# RAG API
cd templates/rag-api/src
uvicorn main:app --reload

# With hot reload for SDK changes
# Install SDK in editable mode: pip install -e ../../../sdk
```

## IDE Setup

### VS Code

Recommended extensions:
- Python
- Pylance
- Black Formatter
- Ruff

`.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true
}
```

### PyCharm

1. Open project
2. Configure Python interpreter: `venv/bin/python`
3. Enable Black formatter
4. Configure Ruff as external tool

## Environment Variables

Create `.env` file in project root:

```bash
# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Langfuse
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...

# Qdrant
QDRANT_URL=http://localhost:6333

# Application
RAG_LLM_PROVIDER=anthropic
RAG_LLM_MODEL=claude-sonnet-4-20250514
```

## Debugging

### Python Debugging

VS Code: Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Current File",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal"
    }
  ]
}
```

### API Debugging

Use FastAPI's interactive docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Common Issues

### Import Errors
- Ensure SDK is installed: `pip install -e sdk`
- Check Python path
- Verify virtual environment is activated

### Port Conflicts
- Change port in uvicorn: `--port 8001`
- Check what's using the port: `lsof -i :8000`

### Docker Issues
- Ensure Docker is running
- Check container logs: `docker logs qdrant`
- Restart containers: `docker restart qdrant`

## Next Steps

- [Contributing Guide](../contributing/) - Contribution guidelines
- [Testing Guide](../contributing/testing-guide.md) - Testing practices
- [Coding Standards](../contributing/coding-standards.md) - Code style guide

