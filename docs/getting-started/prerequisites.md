# Prerequisites

Before you begin, ensure you have the following tools and accounts set up.

## Required Tools

### Python
- **Version**: Python 3.11 or higher
- **Installation**: [python.org](https://www.python.org/downloads/)
- **Verification**: `python --version`

### Git
- **Purpose**: Version control and cloning repositories
- **Installation**: [git-scm.com](https://git-scm.com/downloads)
- **Verification**: `git --version`

### Docker (Optional)
- **Purpose**: Containerized deployment
- **Installation**: [docker.com](https://www.docker.com/get-started)
- **Verification**: `docker --version`

### Terraform (For Infrastructure)
- **Version**: Terraform >= 1.5.0
- **Installation**: [terraform.io](https://www.terraform.io/downloads)
- **Verification**: `terraform version`

## Required Accounts

### LLM Provider
Choose at least one:

- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
  - Required: API key
- **OpenAI**: [platform.openai.com](https://platform.openai.com/)
  - Required: API key

### Google Cloud Platform (For Deployment)
- **Account**: [cloud.google.com](https://cloud.google.com/)
- **Required**:
  - GCP Project
  - Billing enabled
  - Cloud Run API enabled
  - Service account with appropriate permissions

### Langfuse (For Observability)
- **Account**: [langfuse.com](https://langfuse.com/)
- **Required**: Public and secret keys
- **Note**: Optional but recommended for production

## Optional Tools

- **Qdrant**: Vector database (can use cloud or self-hosted)
- **VS Code** or **PyCharm**: Recommended IDE
- **Postman** or **curl**: For API testing

## Next Steps

Once you have the prerequisites, proceed to [Installation](installation.md).

