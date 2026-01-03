# Example: Development Environment
# Minimal setup for development/testing

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

# Cloud Run service for RAG API
module "rag_api" {
  source = "../../modules/cloud-run"

  project_id   = var.project_id
  region       = var.region
  service_name = "rag-api-dev"
  image        = "gcr.io/${var.project_id}/rag-api:latest"

  env_vars = {
    RAG_LLM_PROVIDER = "anthropic"
    RAG_LLM_MODEL    = "claude-sonnet-4-20250514"
  }

  secrets = {
    "rag-llm-api-key" = "RAG_LLM_API_KEY"
  }

  min_instances = 0
  max_instances = 5
  cpu           = "1"
  memory        = "512Mi"
  timeout       = 300

  allow_unauthenticated = true
}

# Outputs
output "rag_api_url" {
  description = "URL of the RAG API service"
  value       = module.rag_api.service_url
}

