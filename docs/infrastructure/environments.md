# Environments

Configuration for different deployment environments.

## Development

```hcl
# infra/examples/dev/main.tf
module "rag_api" {
  source = "../../modules/cloud-run"
  
  project_id = "dev-project"
  service_name = "rag-api-dev"
  region = "us-central1"
}
```

## Staging

```hcl
# infra/examples/staging/main.tf
module "rag_api" {
  source = "../../modules/cloud-run"
  
  project_id = "staging-project"
  service_name = "rag-api-staging"
  region = "us-central1"
}
```

## Production

```hcl
# infra/examples/prod/main.tf
module "rag_api" {
  source = "../../modules/cloud-run"
  
  project_id = "prod-project"
  service_name = "rag-api"
  region = "us-central1"
  
  min_instances = 1
  max_instances = 10
}
```

## Next Steps

- [GCP Setup](gcp-setup.md)
- [Terraform Guide](terraform-guide.md)



