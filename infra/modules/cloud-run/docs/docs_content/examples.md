# Examples

Example configurations for the Cloud Run module.

## Development Environment

```hcl
module "rag_api_dev" {
  source = "../../modules/cloud-run"
  
  project_id = "dev-project"
  service_name = "rag-api-dev"
  image = "gcr.io/dev-project/rag-api:latest"
  
  min_instances = 0
  max_instances = 2
}
```

## Production Environment

```hcl
module "rag_api_prod" {
  source = "../../modules/cloud-run"
  
  project_id = "prod-project"
  service_name = "rag-api"
  image = "gcr.io/prod-project/rag-api:latest"
  
  min_instances = 1
  max_instances = 10
  
  env_vars = {
    RAG_LLM_PROVIDER = "anthropic"
  }
  
  secrets = {
    RAG_LLM_API_KEY = "llm-api-key"
  }
}
```

## Next Steps

- [Usage Guide](usage.md)
- [Variables](variables.md)

