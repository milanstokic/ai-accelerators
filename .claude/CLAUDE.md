# AI Accelerators Repository - Claude Context

This document provides context for AI-assisted development in this repository.

## Repository Structure

This is a monorepo containing:
- **`sdk/`**: Core Python SDK (`accelerators` package)
- **`templates/`**: Application templates (RAG, agents, etc.)
- **`infra/`**: Terraform infrastructure modules
- **`docs/`**: Documentation
- **`.claude/`**: AI-assisted development configurations

## Key Conventions

### Python Code
- Use Python 3.11+ features
- Full type hints required (mypy strict mode)
- Async/await for all I/O operations
- Pydantic models for data validation
- Follow PEP 8 with 120 character line length

### Testing
- pytest for all tests
- 90% code coverage target for SDK
- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- Use pytest-asyncio for async tests

### Documentation
- Docstrings for all public APIs
- Markdown documentation in `docs/`
- Code examples must be tested

## Common Tasks

### Adding a New LLM Provider
1. Create provider class in `sdk/src/accelerators/llm/providers/`
2. Inherit from `BaseLLMClient`
3. Implement `complete()` and `stream()` methods
4. Add to `LLMProvider` enum
5. Update `LLMClient` to support new provider
6. Add unit tests

### Adding a New SDK Module
1. Create module directory in `sdk/src/accelerators/`
2. Add `__init__.py` with public exports
3. Follow existing module patterns
4. Add comprehensive tests
5. Update main `__init__.py`
6. Document in `docs/sdk/`

### Creating a New Template
1. Use `scripts/create-template.sh` to scaffold
2. Follow template structure from existing templates
3. Use SDK modules for common functionality
4. Include Dockerfile and Terraform module
5. Document in `docs/templates/`

## Testing Requirements

- All code must have tests
- Tests must pass before merging
- Coverage must meet targets
- Integration tests for API endpoints

## Documentation Requirements

- All public APIs must be documented
- Code examples must be tested
- Documentation updated with code changes
- Markdown files validated in CI

## Links

- [PRD](../product-documentation/prds/prd-accelerators-platform.md)
- [Implementation Plan](../product-documentation/project-plans/plan-accelerators-platform.md)
