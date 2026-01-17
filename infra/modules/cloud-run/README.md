# Cloud Run Terraform Module

Reusable Terraform module for deploying services to Google Cloud Run.

## Usage

```hcl
module "rag_api" {
  source = "../../modules/cloud-run"

  project_id  = "my-gcp-project"
  region      = "us-central1"
  service_name = "rag-api"
  image       = "gcr.io/my-project/rag-api:latest"

  env_vars = {
    RAG_LLM_PROVIDER = "anthropic"
    RAG_LLM_MODEL    = "claude-sonnet-4-20250514"
  }

  secrets = {
    "rag-llm-api-key" = "RAG_LLM_API_KEY"
  }

  min_instances = 0
  max_instances = 10
  cpu           = "1"
  memory        = "512Mi"
  timeout       = 300

  allow_unauthenticated = true
}
```

## Variables

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `project_id` | GCP Project ID | `string` | Required |
| `region` | GCP Region | `string` | `"us-central1"` |
| `service_name` | Name of the Cloud Run service | `string` | Required |
| `image` | Container image URL | `string` | Required |
| `service_account_email` | Service account email | `string` | `null` |
| `env_vars` | Environment variables | `map(string)` | `{}` |
| `secrets` | Secret environment variables | `map(string)` | `{}` |
| `min_instances` | Minimum instances | `number` | `0` |
| `max_instances` | Maximum instances | `number` | `100` |
| `cpu` | CPU allocation | `string` | `"1"` |
| `memory` | Memory allocation | `string` | `"512Mi"` |
| `timeout` | Request timeout (seconds) | `number` | `300` |
| `allow_unauthenticated` | Allow unauthenticated access | `bool` | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `service_url` | URL of the Cloud Run service |
| `service_name` | Name of the Cloud Run service |
| `service_location` | Location of the Cloud Run service |

## Requirements

- Terraform >= 1.5.0
- Google Cloud Provider >= 5.0



