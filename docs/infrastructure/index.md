# Infrastructure Documentation

Infrastructure modules for deploying AI Accelerators components to Google Cloud Platform (GCP).

## Overview

This documentation covers the infrastructure-as-code (IaC) modules for deploying the AI Accelerators platform to GCP using Terraform.

## Modules

### [Cloud Run Module](modules/cloud-run.md)
Reusable Terraform module for deploying services to Google Cloud Run.

## Getting Started

1. [GCP Setup](gcp-setup.md) - Set up your GCP project
2. [Terraform Guide](terraform-guide.md) - Learn how to use Terraform modules
3. [Environments](environments.md) - Configure different environments

## Quick Start

```bash
cd infra/examples/dev
terraform init
terraform plan
terraform apply
```

## Documentation

- [GCP Setup Guide](gcp-setup.md)
- [Terraform Modules](modules/)
- [Environment Configuration](environments.md)

## License

Part of the AI Accelerators platform by HTEC.



