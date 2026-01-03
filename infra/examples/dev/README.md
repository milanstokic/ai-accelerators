# Development Environment

Example Terraform configuration for a development environment.

## Usage

1. Set your GCP project ID:
```bash
export TF_VAR_project_id=your-gcp-project-id
```

2. Initialize Terraform:
```bash
terraform init
```

3. Plan the deployment:
```bash
terraform plan
```

4. Apply the configuration:
```bash
terraform apply
```

## What Gets Created

- Cloud Run service for RAG API
- Minimal resources for development
- Public access enabled for testing

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

