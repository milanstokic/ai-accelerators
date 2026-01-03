# AI Accelerators SDK

Shared Python library providing abstractions and utilities for building AI applications.

## Installation

```bash
pip install -e .
```

For development with all dependencies:

```bash
pip install -e ".[dev]"
```

## Quick Start

### Using the LLM Client

```python
from accelerators.llm import LLMClient, Message

# Initialize with Anthropic
client = LLMClient(
    provider="anthropic",
    api_key="sk-ant-...",
    model="claude-sonnet-4-20250514"
)

# Generate a completion
response = await client.complete([
    Message(role="user", content="Hello!")
])
print(response.content)

# Streaming
async for chunk in client.stream([
    Message(role="user", content="Tell me a story")
]):
    print(chunk.content, end="")
```

### Using Configuration

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

## Development

### Running Tests

```bash
pytest
```

With coverage:

```bash
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

## Modules

- **`accelerators.llm`**: Unified interface for LLM providers (Anthropic, OpenAI, etc.)
- **`accelerators.config`**: Configuration management with environment variables

## License

MIT
