# Coding Standards

This guide covers the coding standards and conventions used in the AI Accelerators platform.

## Overview

We maintain consistent coding standards to ensure:
- Code readability and maintainability
- Easier code reviews
- Seamless collaboration across teams
- High-quality, production-ready code

## Python Standards

### Formatting

We use **Black** for code formatting with a line length of 120 characters.

```bash
# Format code
black --line-length 120 sdk/

# Check formatting
black --check --line-length 120 sdk/
```

Configuration is defined in `pyproject.toml`:

```toml
[tool.black]
line-length = 120
target-version = ['py311']
```

### Linting

We use **Ruff** for linting with auto-fix capability.

```bash
# Lint code
ruff check sdk/

# Auto-fix issues
ruff check sdk/ --fix
```

### Type Hints

We use **MyPy** for static type checking in strict mode.

```bash
# Type check
mypy --strict sdk/src/accelerators
```

**Requirements**:
- All functions must have type hints for parameters and return values
- Use `Optional[T]` for nullable types
- Use `Union[A, B]` for multiple types
- Prefer `list[str]` over `List[str]` (Python 3.9+)

```python
# Good
def process_documents(docs: list[str], max_length: int = 1000) -> list[dict[str, Any]]:
    ...

# Good - with Optional
def get_user(user_id: str) -> Optional[User]:
    ...

# Bad - missing type hints
def process_documents(docs, max_length=1000):
    ...
```

### Imports

Organize imports in the following order:
1. Standard library imports
2. Third-party imports
3. Local application imports

Use Ruff's `isort` functionality for automatic sorting.

```python
# Good
import asyncio
import json
from typing import Any, Optional

import httpx
from pydantic import BaseModel

from accelerators.config import Settings
from accelerators.llm import LLMClient
```

### Docstrings

Use Google-style docstrings for all public functions, classes, and modules.

```python
def create_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """Generate an embedding vector for the given text.

    Args:
        text: The input text to embed. Must be non-empty.
        model: The embedding model to use. Defaults to "text-embedding-3-small".

    Returns:
        A list of floats representing the embedding vector.

    Raises:
        ValueError: If text is empty.
        EmbeddingError: If the embedding service fails.

    Example:
        >>> embedding = create_embedding("Hello, world!")
        >>> len(embedding)
        1536
    """
    ...
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Modules | snake_case | `llm_client.py` |
| Classes | PascalCase | `LLMClient` |
| Functions | snake_case | `create_embedding` |
| Variables | snake_case | `user_count` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Private | Leading underscore | `_internal_method` |

### Error Handling

- Use custom exception classes for domain-specific errors
- Always include meaningful error messages
- Don't catch generic `Exception` unless re-raising

```python
# Good
class LLMError(Exception):
    """Base exception for LLM operations."""
    pass

class RateLimitError(LLMError):
    """Raised when rate limit is exceeded."""
    pass

try:
    response = await client.complete(messages)
except RateLimitError as e:
    logger.warning(f"Rate limit exceeded: {e}")
    await asyncio.sleep(retry_delay)

# Bad - too generic
try:
    response = await client.complete(messages)
except Exception:
    pass  # Silently ignoring errors
```

### Async/Await

- Use `async/await` for I/O-bound operations
- Use `asyncio.gather` for concurrent operations
- Avoid blocking calls in async functions

```python
# Good - concurrent execution
async def fetch_all_documents(doc_ids: list[str]) -> list[Document]:
    tasks = [fetch_document(doc_id) for doc_id in doc_ids]
    return await asyncio.gather(*tasks)

# Bad - sequential execution
async def fetch_all_documents(doc_ids: list[str]) -> list[Document]:
    results = []
    for doc_id in doc_ids:
        doc = await fetch_document(doc_id)  # Inefficient!
        results.append(doc)
    return results
```

## Pydantic Models

Use Pydantic for data validation and settings management.

```python
from pydantic import BaseModel, Field, field_validator

class QueryRequest(BaseModel):
    """Request model for RAG queries."""

    query: str = Field(..., min_length=1, max_length=10000, description="The query text")
    collection: str = Field(default="default", description="The collection to search")
    top_k: int = Field(default=10, ge=1, le=100, description="Number of results")

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        return v.strip()
```

## TypeScript Standards (Backstage)

### Formatting

We use **Prettier** for TypeScript/JavaScript formatting.

```bash
cd backstage
yarn prettier --check .
```

### Linting

We use **ESLint** for linting.

```bash
cd backstage
yarn lint
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | PascalCase | `ChatWidget.tsx` |
| Files (utilities) | camelCase | `apiClient.ts` |
| Components | PascalCase | `ChatWidget` |
| Functions | camelCase | `fetchMessages` |
| Variables | camelCase | `messageCount` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Interfaces | PascalCase (no prefix) | `Message` |
| Types | PascalCase | `MessageType` |

### React Components

```typescript
// Good - functional component with proper typing
interface ChatWidgetProps {
  title: string;
  onSubmit: (message: string) => void;
  className?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  title,
  onSubmit,
  className,
}) => {
  const [message, setMessage] = useState('');

  return (
    <div className={className}>
      <h2>{title}</h2>
      {/* Component content */}
    </div>
  );
};
```

## Terraform Standards

### Formatting

Use `terraform fmt` for consistent formatting.

```bash
cd infra
terraform fmt -recursive
```

### Naming Conventions

- Use snake_case for resource names
- Use descriptive names that indicate purpose
- Prefix with environment when needed

```hcl
# Good
resource "google_cloud_run_service" "rag_api" {
  name     = "${var.environment}-rag-api"
  location = var.region
}

# Bad - unclear naming
resource "google_cloud_run_service" "service1" {
  name     = "my-service"
  location = "us-central1"
}
```

### Variables

All variables should have descriptions and appropriate defaults.

```hcl
variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "min_instances" {
  description = "Minimum number of container instances"
  type        = number
  default     = 0
}
```

## Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting (no code change) |
| `refactor` | Code restructuring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |

### Examples

```bash
# Feature
feat(sdk): add streaming support to LLM client

# Bug fix
fix(vectorstore): handle empty query results correctly

# Documentation
docs(contributing): add coding standards guide

# Refactor
refactor(embeddings): extract common retry logic
```

## File Organization

### SDK Structure

```
sdk/src/accelerators/
├── __init__.py           # Package exports
├── module_name/
│   ├── __init__.py       # Module exports
│   ├── base.py           # Abstract base classes
│   ├── models.py         # Pydantic models
│   ├── exceptions.py     # Custom exceptions
│   └── providers/        # Provider implementations
│       ├── __init__.py
│       └── provider.py
```

### Test Structure

Mirror the source structure in tests:

```
sdk/tests/
├── unit/
│   ├── test_llm.py
│   ├── test_vectorstore.py
│   └── test_embeddings.py
├── integration/
│   └── test_rag_pipeline.py
└── conftest.py           # Shared fixtures
```

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] Code follows formatting standards (run `pre-commit`)
- [ ] All functions have type hints
- [ ] Public APIs have docstrings
- [ ] Tests are included for new functionality
- [ ] No secrets or credentials in code
- [ ] Error handling is appropriate
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventions

## Tools Summary

| Purpose | Python | TypeScript | Terraform |
|---------|--------|------------|-----------|
| Formatting | Black | Prettier | terraform fmt |
| Linting | Ruff | ESLint | tflint |
| Type Checking | MyPy | TypeScript | N/A |
| Testing | pytest | Jest | terratest |

## Enforcement

These standards are enforced through:
1. **Pre-commit hooks**: Run locally before each commit
2. **CI pipeline**: Validates all PRs
3. **Code review**: Reviewers check for compliance
