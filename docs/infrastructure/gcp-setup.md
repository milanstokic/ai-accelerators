# GCP Setup

Guide for setting up Google Cloud Platform for AI Accelerators deployment.

## Prerequisites

- Google Cloud account
- gcloud CLI installed
- Terraform installed

## Initial Setup

1. **Create GCP Project:**

```bash
gcloud projects create my-ai-accelerators --name="AI Accelerators"
gcloud config set project my-ai-accelerators
```

2. **Enable Required APIs:**

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com
```

3. **Set Up Authentication:**

```bash
gcloud auth application-default login
```

## Service Account

Create a service account for Terraform:

```bash
gcloud iam service-accounts create terraform \
  --display-name="Terraform Service Account"

gcloud projects add-iam-policy-binding my-ai-accelerators \
  --member="serviceAccount:terraform@my-ai-accelerators.iam.gserviceaccount.com" \
  --role="roles/owner"
```

## Next Steps

- [Terraform Guide](terraform-guide.md)
- [Cloud Run Module](modules/cloud-run.md)



