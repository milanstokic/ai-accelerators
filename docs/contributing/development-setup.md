# Development Setup

This guide walks you through setting up your local development environment for contributing to the AI Accelerators platform.

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | SDK and template development |
| Node.js | 20+ | Backstage and frontend development |
| Git | 2.x | Version control |
| Docker | 24+ | Container builds and local testing |
| Terraform | 1.5+ | Infrastructure development |

### Recommended Tools

| Tool | Purpose |
|------|---------|
| [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.sh/) | IDE with excellent Python support |
| [pyenv](https://github.com/pyenv/pyenv) | Python version management |
| [nvm](https://github.com/nvm-sh/nvm) | Node.js version management |
| [pre-commit](https://pre-commit.com/) | Git hook management |

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/htec/ai-accelerators.git
cd ai-accelerators
```

### 2. Set Up Python Environment

```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip
```

### 3. Install SDK in Development Mode

```bash
cd sdk
pip install -e ".[dev]"
cd ..
```

This installs:
- The `accelerators` SDK package
- Development dependencies (pytest, black, ruff, mypy)
- All optional dependencies for development

### 4. Install Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

Pre-commit hooks automatically run:
- **Black**: Code formatting
- **Ruff**: Linting
- **MyPy**: Type checking
- Various file checks (trailing whitespace, YAML validation, etc.)

### 5. Set Up Backstage (Frontend Development)

```bash
cd backstage
yarn install
cd ..
```

## Environment Variables

Create a `.env` file in the root directory for local development:

```bash
# LLM Providers (at least one required for testing)
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Vector Store (optional for local development)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Observability (optional)
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

# GCP (for infrastructure development)
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**Note**: Never commit `.env` files to version control.

## Verifying Your Setup

### Run SDK Tests

```bash
cd sdk
pytest
```

All tests should pass. If any fail, check:
- Python version is 3.11+
- All dependencies are installed
- Required environment variables are set

### Run Linting

```bash
# Run all pre-commit hooks
pre-commit run --all-files
```

### Run Type Checks

```bash
cd sdk
mypy src/accelerators
```

### Start Backstage Locally

```bash
cd backstage
yarn dev
```

Access Backstage at `http://localhost:3000`.

## IDE Configuration

### VS Code / Cursor

Recommended extensions:
- Python
- Pylance
- Black Formatter
- Ruff
- YAML
- Terraform
- Markdown All in One

Recommended settings (`.vscode/settings.json`):

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "editor.formatOnSave": true,
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  }
}
```

## Working with Different Components

### SDK Development

```bash
cd sdk/src/accelerators

# Work on specific modules
# - llm/       LLM provider abstractions
# - vectorstore/  Vector database operations
# - embeddings/   Embedding generation
# - observability/  Tracing and monitoring
# - config/      Configuration management
```

### Template Development

```bash
cd templates

# Available templates
# - rag-api/    RAG application template
```

### Infrastructure Development

```bash
cd infra/modules

# Available modules
# - cloud-run/   Cloud Run deployment
```

### Documentation Development

```bash
cd docs

# Documentation structure
# - getting-started/  Onboarding documentation
# - sdk/             SDK reference
# - templates/       Template documentation
# - infrastructure/  Infrastructure guides
# - contributing/    Contributor guides
```

## Common Issues

### Pre-commit Hooks Failing

If pre-commit hooks fail:

```bash
# Auto-fix formatting issues
black sdk/
ruff check sdk/ --fix

# Re-run hooks
pre-commit run --all-files
```

### Import Errors

If you get import errors for the `accelerators` package:

```bash
# Ensure SDK is installed in development mode
cd sdk
pip install -e ".[dev]"
```

### Type Check Errors

If mypy reports errors:

```bash
# Install type stubs
pip install types-all
```

## Next Steps

Once your environment is set up:

1. Read the [Coding Standards](coding-standards.md) guide
2. Review the [Testing Guide](testing-guide.md)
3. Check out open [GitHub Issues](https://github.com/htec/ai-accelerators/issues)

Happy coding! 🎉
