# Installation

This guide covers installing the AI Accelerators SDK and setting up your development environment.

## Install the SDK

### From Source

```bash
# Clone the repository
git clone https://github.com/htec/ai-accelerators.git
cd ai-accelerators

# Install the SDK
cd sdk
pip install -e .
```

### With Development Dependencies

For development with testing and linting tools:

```bash
cd sdk
pip install -e ".[dev]"
```

## Verify Installation

```bash
python -c "from accelerators.llm import LLMClient; print('SDK installed successfully')"
```

## Environment Setup

### Create Virtual Environment (Recommended)

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Set Environment Variables

Create a `.env` file or export variables:

```bash
# LLM Provider
export ANTHROPIC_API_KEY=sk-ant-...
# or
export OPENAI_API_KEY=sk-...

# Langfuse (optional)
export LANGFUSE_PUBLIC_KEY=pk-...
export LANGFUSE_SECRET_KEY=sk-...
```

## Development Tools

### Pre-commit Hooks

Install pre-commit hooks for code quality:

```bash
pip install pre-commit
pre-commit install
```

### Testing

Run tests:

```bash
cd sdk
pytest
```

With coverage:

```bash
pytest --cov=accelerators --cov-report=html
```

## Next Steps

- [Quickstart](quickstart.md) - Deploy your first application
- [First RAG App](first-rag-app.md) - Build a RAG application

