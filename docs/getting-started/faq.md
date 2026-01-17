# Frequently Asked Questions

Common questions and answers about the AI Accelerators platform.

## General

### What is the AI Accelerators platform?

A monorepo containing reusable templates, a shared Python SDK, and Terraform infrastructure modules for rapidly building and deploying production-ready AI applications.

### What's the goal?

Enable engineers to deploy production-ready AI applications in under 4 hours.

### What's included?

- **SDK**: Python library for LLM, vector stores, embeddings, observability
- **Templates**: Pre-built application templates (RAG, agents, etc.)
- **Infrastructure**: Terraform modules for cloud deployment

## SDK

### Which LLM providers are supported?

Currently: Anthropic (Claude) and OpenAI. Google (Gemini) and Ollama support coming soon.

### Can I use the SDK without templates?

Yes! The SDK is designed to be incrementally adoptable. Use individual modules as needed.

### How do I add a custom LLM provider?

1. Create provider class in `sdk/src/accelerators/llm/providers/`
2. Inherit from `BaseLLMClient`
3. Implement `complete()` and `stream()` methods
4. Add to `LLMProvider` enum
5. Update `LLMClient` to support new provider

## Templates

### Can I customize templates?

Yes! Templates are starting points. Modify them to fit your needs.

### Which templates are available?

- RAG API (available now)
- Conversational Agent (coming soon)
- Document Processor (coming soon)
- Voice Assistant (coming soon)
- React Chat UI (coming soon)

### How do I create a new template?

Use the template structure as a guide, or use `scripts/create-template.sh` (coming soon).

## Infrastructure

### Which cloud providers are supported?

Currently: Google Cloud Platform (GCP). AWS support coming in Phase 4.

### Can I deploy to other platforms?

Yes, templates are containerized. You can deploy to any container platform (Kubernetes, ECS, etc.).

### How much does deployment cost?

Costs vary by usage. See [Cost Optimization](../infrastructure/cost-optimization.md) for details.

## Development

### How do I contribute?

See the [Contributing Guide](../contributing/index.md) for details.

### What's the testing strategy?

- Unit tests for SDK modules (90%+ coverage)
- Integration tests for API endpoints
- E2E tests for critical paths

### How do I report bugs?

Open an issue on GitHub with:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## Troubleshooting

### API key errors

- Verify API key is correct
- Check environment variables are set
- Ensure billing is enabled (for cloud providers)

### Import errors

- Ensure SDK is installed: `pip install -e sdk`
- Check Python version (3.11+)
- Verify virtual environment is activated

### Deployment issues

- Check Terraform logs
- Verify GCP permissions
- Ensure APIs are enabled
- Review Cloud Run logs

## Support

### Where can I get help?

- Documentation: Check the [docs](../) directory
- Issues: GitHub Issues
- Discussions: GitHub Discussions (coming soon)

### Is there commercial support?

Contact the HTEC AI team for enterprise support options.



