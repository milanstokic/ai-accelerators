# Usage

How to use the Cloud Run Terraform module.

## Basic Usage

```hcl
module "my_service" {
  source = "../../modules/cloud-run"
  
  project_id = var.project_id
  service_name = "my-service"
  image = "gcr.io/${var.project_id}/my-service:latest"
}
```

## With Environment Variables

```hcl
module "rag_api" {
  source = "../../modules/cloud-run"
  
  project_id = var.project_id
  service_name = "rag-api"
  image = "gcr.io/${var.project_id}/rag-api:latest"
  
  env_vars = {
    RAG_LLM_PROVIDER = "anthropic"
    RAG_DEBUG = "false"
  }
}
```

## With Secrets

```hcl
module "rag_api" {
  source = "../../modules/cloud-run"
  
  project_id = var.project_id
  service_name = "rag-api"
  image = "gcr.io/${var.project_id}/rag-api:latest"
  
  secrets = {
    RAG_LLM_API_KEY = "llm-api-key"
    RAG_EMBEDDING_API_KEY = "embedding-api-key"
  }
}
```

## Next Steps

- [Variables](variables.md)
- [Outputs](outputs.md)
- [Examples](examples.md)

