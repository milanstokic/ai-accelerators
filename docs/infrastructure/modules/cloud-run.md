# Cloud Run Module

Reusable Terraform module for deploying services to Google Cloud Run.

## Overview

The Cloud Run module provides a complete Terraform configuration for deploying containerized applications to Google Cloud Run.

## Usage

```hcl
module "rag_api" {
  source = "../../modules/cloud-run"
  
  project_id = "my-gcp-project"
  service_name = "rag-api"
  image = "gcr.io/my-project/rag-api:latest"
  
  env_vars = {
    RAG_LLM_PROVIDER = "anthropic"
  }
  
  secrets = {
    RAG_LLM_API_KEY = "llm-api-key"
  }
}
```

## Variables

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `project_id` | GCP project ID | string | - |
| `service_name` | Cloud Run service name | string | - |
| `image` | Container image | string | - |
| `region` | GCP region | string | `us-central1` |
| `env_vars` | Environment variables | map(string) | `{}` |
| `secrets` | Secret references | map(string) | `{}` |

## Outputs

- `service_url` - Cloud Run service URL
- `service_id` - Service ID

## Next Steps

- [GCP Setup](../gcp-setup.md)
- [Terraform Guide](../terraform-guide.md)



