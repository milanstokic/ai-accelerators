# Contributing to AI Accelerators

Welcome to the AI Accelerators contributor guide! We're excited that you want to contribute to the platform.

## Overview

The AI Accelerators platform is a monorepo containing:

- **SDK**: Shared Python library (`accelerators`) for LLM, vector stores, and observability
- **Templates**: Pre-built application templates (RAG, agents, etc.)
- **Infrastructure**: Terraform modules for cloud deployment
- **Documentation**: Technical documentation via Backstage TechDocs

## Quick Links

| Guide | Description |
|-------|-------------|
| [Development Setup](development-setup.md) | Set up your local development environment |
| [Coding Standards](coding-standards.md) | Code style, conventions, and best practices |
| [Testing Guide](testing-guide.md) | Testing requirements and practices |
| [Documentation Guide](documentation-guide.md) | How to write and maintain documentation |
| [Pull Request Guide](pull-request-guide.md) | PR process and review criteria |
| [Release Process](release-process.md) | Release and versioning workflow |

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/ai-accelerators.git
cd ai-accelerators
```

### 2. Set Up Development Environment

Follow the [Development Setup](development-setup.md) guide to configure your local environment.

### 3. Create a Branch

```bash
# Create a feature branch from trunk
git checkout -b feature/your-feature-name
```

### 4. Make Your Changes

- Follow our [Coding Standards](coding-standards.md)
- Write tests per our [Testing Guide](testing-guide.md)
- Update documentation per our [Documentation Guide](documentation-guide.md)

### 5. Submit a Pull Request

Follow our [Pull Request Guide](pull-request-guide.md) for the review process.

## Types of Contributions

### Code Contributions

- **Bug fixes**: Fix issues reported in GitHub Issues
- **Features**: Add new functionality to the SDK, templates, or infrastructure
- **Performance**: Improve performance of existing code
- **Refactoring**: Clean up code without changing functionality

### Documentation Contributions

- **Fix typos and errors**: Small corrections are always welcome
- **Improve clarity**: Make existing documentation clearer
- **Add examples**: Provide more code examples
- **New guides**: Write new how-to guides or tutorials

### Other Contributions

- **Bug reports**: Report bugs with detailed reproduction steps
- **Feature requests**: Suggest new features with use cases
- **Code reviews**: Review pull requests from other contributors
- **Community support**: Help answer questions from other users

## Communication

### GitHub Issues

Use GitHub Issues for:
- Bug reports
- Feature requests
- Documentation issues

### Pull Requests

Use Pull Requests for:
- Code changes
- Documentation updates
- Any modifications to the repository

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors are expected to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Recognition

All contributors are recognized in our release notes and CHANGELOG. We value every contribution, no matter how small!

## Questions?

If you have questions about contributing:

1. Check the [FAQ](../getting-started/faq.md)
2. Search existing GitHub Issues
3. Open a new GitHub Issue with the `question` label

Thank you for contributing to AI Accelerators! 🚀
