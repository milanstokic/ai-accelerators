# Cloud Run Terraform Module

Reusable Terraform module for deploying services to Google Cloud Run.

## Overview

This module provides a complete Terraform configuration for deploying containerized applications to Google Cloud Run with best practices.

## Features

- ✅ Automatic scaling
- ✅ Environment variables
- ✅ Secret management
- ✅ IAM configuration
- ✅ Custom domains
- ✅ Health checks

## Quick Start

```hcl
module "rag_api" {
  source = "../../modules/cloud-run"
  
  project_id = "my-gcp-project"
  service_name = "rag-api"
  image = "gcr.io/my-project/rag-api:latest"
}
```

## Documentation

- [Usage Guide](usage.md) - How to use this module
- [Variables](variables.md) - All input variables
- [Outputs](outputs.md) - Module outputs
- [Examples](examples.md) - Example configurations

## License

Part of the AI Accelerators platform by HTEC.

