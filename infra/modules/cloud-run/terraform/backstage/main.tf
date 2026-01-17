# Backstage Cloud Run Deployment
# Terraform module for deploying Backstage to Cloud Run

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

variable "image" {
  description = "Backstage container image"
  type        = string
}

variable "database_instance" {
  description = "Cloud SQL instance name for Backstage database"
  type        = string
}

variable "techdocs_bucket" {
  description = "GCS bucket for TechDocs"
  type        = string
}

variable "github_token" {
  description = "GitHub token for integrations"
  type        = string
  sensitive   = true
}

variable "oidc_metadata_url" {
  description = "OIDC metadata URL for authentication"
  type        = string
  default     = ""
}

variable "oidc_client_id" {
  description = "OIDC client ID"
  type        = string
  default     = ""
}

variable "oidc_client_secret" {
  description = "OIDC client secret"
  type        = string
  sensitive   = true
  default     = ""
}

# Cloud Run Service
resource "google_cloud_run_service" "backstage" {
  name     = "backstage"
  location = var.region
  project  = var.project_id

  template {
    spec {
      service_account_name = google_service_account.backstage.email
      containers {
        image = var.image

        env {
          name  = "POSTGRES_HOST"
          value = "/cloudsql/${google_sql_database_instance.backstage.connection_name}"
        }
        env {
          name  = "POSTGRES_PORT"
          value = "5432"
        }
        env {
          name  = "POSTGRES_USER"
          value = google_sql_user.backstage.name
        }
        env {
          name  = "POSTGRES_PASSWORD"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.postgres_password.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name  = "POSTGRES_DATABASE"
          value = google_sql_database.backstage.name
        }
        env {
          name  = "GITHUB_TOKEN"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.github_token.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name  = "TECHDOCS_BUCKET"
          value = var.techdocs_bucket
        }
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        env {
          name  = "OIDC_METADATA_URL"
          value = var.oidc_metadata_url
        }
        env {
          name  = "OIDC_CLIENT_ID"
          value = var.oidc_client_id
        }
        env {
          name  = "OIDC_CLIENT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.oidc_client_secret.secret_id
              key  = "latest"
            }
          }
        }

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }
      }

      timeout_seconds = 300
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "10"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.backstage.connection_name
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Cloud SQL Instance
resource "google_sql_database_instance" "backstage" {
  name             = var.database_instance
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier = "db-f1-micro"

    backup_configuration {
      enabled = true
    }

    ip_configuration {
      ipv4_enabled = false
      private_network = google_compute_network.backstage.id
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "backstage" {
  name     = "backstage"
  instance = google_sql_database_instance.backstage.name
  project  = var.project_id
}

resource "google_sql_user" "backstage" {
  name     = "backstage"
  instance = google_sql_database_instance.backstage.name
  password = random_password.postgres_password.result
  project  = var.project_id
}

resource "random_password" "postgres_password" {
  length  = 16
  special = true
}

# Secrets
resource "google_secret_manager_secret" "postgres_password" {
  secret_id = "backstage-postgres-password"
  project   = var.project_id

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "postgres_password" {
  secret      = google_secret_manager_secret.postgres_password.id
  secret_data = random_password.postgres_password.result
}

resource "google_secret_manager_secret" "github_token" {
  secret_id = "backstage-github-token"
  project   = var.project_id

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "github_token" {
  secret      = google_secret_manager_secret.github_token.id
  secret_data = var.github_token
}

resource "google_secret_manager_secret" "oidc_client_secret" {
  count     = var.oidc_client_secret != "" ? 1 : 0
  secret_id = "backstage-oidc-client-secret"
  project   = var.project_id

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "oidc_client_secret" {
  count       = var.oidc_client_secret != "" ? 1 : 0
  secret      = google_secret_manager_secret.oidc_client_secret[0].id
  secret_data = var.oidc_client_secret
}

# Service Account
resource "google_service_account" "backstage" {
  account_id   = "backstage"
  display_name = "Backstage Service Account"
  project      = var.project_id
}

resource "google_project_iam_member" "backstage_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backstage.email}"
}

resource "google_project_iam_member" "backstage_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backstage.email}"
}

resource "google_project_iam_member" "backstage_storage_object_viewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.backstage.email}"
}

# VPC Network (if needed)
resource "google_compute_network" "backstage" {
  name                    = "backstage-network"
  auto_create_subnetworks = false
  project                 = var.project_id
}

resource "google_compute_subnetwork" "backstage" {
  name          = "backstage-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.backstage.id
  project       = var.project_id
}

# VPC Connector for Serverless
resource "google_vpc_access_connector" "backstage" {
  name          = "backstage-connector"
  region        = var.region
  project       = var.project_id
  network       = google_compute_network.backstage.name
  ip_cidr_range = "10.8.0.0/28"
}

# Outputs
output "service_url" {
  description = "URL of the Backstage service"
  value       = google_cloud_run_service.backstage.status[0].url
}

output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.backstage.connection_name
}



