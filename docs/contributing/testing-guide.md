# Testing Guide

This guide covers testing requirements, practices, and conventions for the AI Accelerators platform.

## Overview

We maintain comprehensive test suites to ensure code quality and prevent regressions. All contributions must include appropriate tests.

## Testing Requirements

### Coverage Targets

| Test Type | Scope | Target Coverage |
|-----------|-------|-----------------|
| Unit Tests | SDK modules | 90% line coverage |
| Integration Tests | API endpoints | All endpoints tested |
| E2E Tests | Critical workflows | Core paths covered |

### When Tests Are Required

| Change Type | Tests Required |
|-------------|----------------|
| New feature | Unit + Integration tests |
| Bug fix | Test that reproduces the bug |
| Refactoring | Existing tests must pass |
| Documentation only | No tests required |

## Testing Stack

### Python (SDK)

| Tool | Purpose |
|------|---------|
| pytest | Test framework |
| pytest-asyncio | Async test support |
| pytest-cov | Coverage reporting |
| pytest-mock | Mocking utilities |
| httpx | HTTP client mocking |

### TypeScript (Backstage)

| Tool | Purpose |
|------|---------|
| Jest | Test framework |
| React Testing Library | Component testing |
| MSW | API mocking |

## Writing Tests

### Test File Structure

```
sdk/tests/
├── conftest.py           # Shared fixtures
├── unit/                 # Unit tests
│   ├── test_llm.py
│   ├── test_vectorstore.py
│   └── test_embeddings.py
├── integration/          # Integration tests
│   └── test_rag_pipeline.py
└── e2e/                  # End-to-end tests
    └── test_full_workflow.py
```

### Naming Conventions

```python
# Test files: test_<module>.py
test_llm.py

# Test classes: Test<Feature>
class TestLLMClient:

# Test functions: test_<behavior>_<scenario>
def test_complete_returns_response():
def test_complete_raises_on_invalid_model():
def test_stream_yields_chunks():
```

### Unit Test Example

```python
import pytest
from unittest.mock import AsyncMock, MagicMock

from accelerators.llm import LLMClient, Message
from accelerators.llm.exceptions import LLMError


class TestLLMClient:
    """Tests for the LLM client."""

    @pytest.fixture
    def mock_provider(self):
        """Create a mock LLM provider."""
        provider = AsyncMock()
        provider.complete.return_value = {"content": "Hello!", "usage": {"tokens": 10}}
        return provider

    @pytest.fixture
    def client(self, mock_provider):
        """Create an LLM client with mocked provider."""
        return LLMClient(provider=mock_provider)

    @pytest.mark.asyncio
    async def test_complete_returns_response(self, client):
        """Test that complete() returns a valid response."""
        messages = [Message(role="user", content="Hello")]

        response = await client.complete(messages)

        assert response.content == "Hello!"
        assert response.usage.tokens == 10

    @pytest.mark.asyncio
    async def test_complete_with_max_tokens(self, client, mock_provider):
        """Test that max_tokens is passed to provider."""
        messages = [Message(role="user", content="Hello")]

        await client.complete(messages, max_tokens=100)

        mock_provider.complete.assert_called_once()
        call_args = mock_provider.complete.call_args
        assert call_args.kwargs["max_tokens"] == 100

    @pytest.mark.asyncio
    async def test_complete_raises_on_provider_error(self, client, mock_provider):
        """Test that provider errors are propagated."""
        mock_provider.complete.side_effect = LLMError("API error")
        messages = [Message(role="user", content="Hello")]

        with pytest.raises(LLMError) as exc_info:
            await client.complete(messages)

        assert "API error" in str(exc_info.value)
```

### Integration Test Example

```python
import pytest
from httpx import AsyncClient

from templates.rag_api.src.main import app


class TestRAGEndpoints:
    """Integration tests for RAG API endpoints."""

    @pytest.fixture
    async def client(self):
        """Create an async HTTP client."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client

    @pytest.mark.asyncio
    async def test_health_endpoint(self, client):
        """Test the health endpoint returns OK."""
        response = await client.get("/health")

        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_query_endpoint_returns_response(self, client):
        """Test the query endpoint returns a valid response."""
        response = await client.post(
            "/query",
            json={"query": "What is RAG?", "collection": "test"}
        )

        assert response.status_code == 200
        assert "answer" in response.json()
        assert "sources" in response.json()

    @pytest.mark.asyncio
    async def test_query_endpoint_validates_input(self, client):
        """Test the query endpoint validates input."""
        response = await client.post(
            "/query",
            json={"query": "", "collection": "test"}  # Empty query
        )

        assert response.status_code == 422  # Validation error
```

### Using Fixtures

Define shared fixtures in `conftest.py`:

```python
# sdk/tests/conftest.py
import pytest
from unittest.mock import AsyncMock

from accelerators.config import Settings


@pytest.fixture
def mock_settings():
    """Create mock settings for testing."""
    return Settings(
        llm_provider="anthropic",
        llm_model="claude-sonnet-4-20250514",
        anthropic_api_key="test-key",
        debug=True,
    )


@pytest.fixture
def mock_vector_store():
    """Create a mock vector store."""
    store = AsyncMock()
    store.search.return_value = [
        {"id": "doc1", "content": "Test content", "score": 0.9}
    ]
    return store


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for async tests."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
```

## Running Tests

### Basic Commands

```bash
# Run all tests
cd sdk
pytest

# Run with coverage
pytest --cov=accelerators --cov-report=html

# Run specific test file
pytest tests/unit/test_llm.py

# Run specific test
pytest tests/unit/test_llm.py::TestLLMClient::test_complete_returns_response

# Run with verbose output
pytest -v

# Run tests matching pattern
pytest -k "test_complete"
```

### Running by Test Type

```bash
# Unit tests only
pytest tests/unit/

# Integration tests only
pytest tests/integration/

# E2E tests only
pytest tests/e2e/
```

### Coverage Reports

```bash
# Generate HTML coverage report
pytest --cov=accelerators --cov-report=html
# Open htmlcov/index.html in browser

# Generate terminal report
pytest --cov=accelerators --cov-report=term-missing

# Generate XML report (for CI)
pytest --cov=accelerators --cov-report=xml
```

## Testing Best Practices

### Do's

- **Write descriptive test names**: `test_complete_raises_on_invalid_model` not `test_error`
- **One assertion per test**: Focus each test on a single behavior
- **Use fixtures**: Share setup logic with fixtures
- **Mock external dependencies**: Don't call real APIs in unit tests
- **Test edge cases**: Empty inputs, large inputs, error conditions
- **Keep tests fast**: Mock slow operations

### Don'ts

- **Don't test implementation details**: Test behavior, not internals
- **Don't duplicate production code**: Use the actual implementation
- **Don't ignore flaky tests**: Fix or remove them
- **Don't test third-party code**: Trust library implementations
- **Don't use real credentials**: Always use mocks or test keys

### Testing Async Code

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    """Test async functions with pytest-asyncio."""
    result = await async_function()
    assert result is not None
```

### Testing Exceptions

```python
import pytest

def test_raises_value_error():
    """Test that ValueError is raised."""
    with pytest.raises(ValueError) as exc_info:
        function_that_raises()

    assert "expected message" in str(exc_info.value)
```

### Parameterized Tests

```python
import pytest

@pytest.mark.parametrize("input,expected", [
    ("hello", "HELLO"),
    ("world", "WORLD"),
    ("", ""),
])
def test_uppercase(input, expected):
    """Test uppercase conversion with multiple inputs."""
    assert input.upper() == expected
```

## CI Integration

Tests run automatically in CI on every pull request:

```yaml
# .github/workflows/ci.yml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: "3.11"

    - name: Install dependencies
      run: |
        cd sdk
        pip install -e ".[dev]"

    - name: Run tests
      run: |
        cd sdk
        pytest --cov=accelerators --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Required Checks

All PRs must pass:
- All existing tests
- New tests for new code
- Coverage thresholds (90% for SDK)

## Troubleshooting Tests

### Common Issues

**Tests not discovered:**
```bash
# Ensure test files are named correctly
# test_*.py or *_test.py
```

**Async tests not running:**
```bash
# Install pytest-asyncio
pip install pytest-asyncio

# Add marker to tests
@pytest.mark.asyncio
async def test_async():
    ...
```

**Mock not working:**
```python
# Ensure you're patching the correct path
# Patch where it's used, not where it's defined
@patch("accelerators.llm.client.httpx.AsyncClient")
```

**Slow tests:**
```bash
# Run tests in parallel
pytest -n auto  # Requires pytest-xdist
```

## Next Steps

- Review [Coding Standards](coding-standards.md) for code quality
- Check [Pull Request Guide](pull-request-guide.md) for submission process
