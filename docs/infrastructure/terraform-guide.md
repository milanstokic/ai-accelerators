# Terraform Guide

Guide for using Terraform modules to deploy AI Accelerators infrastructure.

## Quick Start

```bash
cd infra/examples/dev
terraform init
terraform plan
terraform apply
```

## Module Usage

```hcl
module "rag_api" {
  source = "../../modules/cloud-run"
  
  project_id = var.project_id
  service_name = "rag-api"
  image = "gcr.io/${var.project_id}/rag-api:latest"
  
  env_vars = {
    RAG_LLM_PROVIDER = "anthropic"
  }
  
  secrets = {
    RAG_LLM_API_KEY = "llm-api-key"
  }
}
```

## Variables

Define variables in `terraform.tfvars`:

```hcl
project_id = "my-gcp-project"
region = "us-central1"
```

## Outputs

Access outputs:

```hcl
output "service_url" {
  value = module.rag_api.service_url
}
```

## Next Steps

- [Cloud Run Module](modules/cloud-run.md)
- [Environments](environments.md)



