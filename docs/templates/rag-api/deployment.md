# RAG API Deployment

Guide for deploying the RAG API to production.

## Docker Deployment

### Build Image

```bash
docker build -t rag-api -f templates/rag-api/Dockerfile .
```

### Run Container

```bash
docker run -p 8000:8000 \
  -e RAG_LLM_PROVIDER=anthropic \
  -e RAG_LLM_API_KEY=sk-ant-... \
  -e RAG_EMBEDDING_API_KEY=sk-... \
  -e RAG_QDRANT_URL=http://qdrant:6333 \
  rag-api
```

## Cloud Run Deployment

### Using Terraform

```bash
cd infra/examples/dev
terraform init
terraform apply -var="project_id=your-gcp-project"
```

### Manual Deployment

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/rag-api

# Deploy to Cloud Run
gcloud run deploy rag-api \
  --image gcr.io/PROJECT_ID/rag-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars RAG_LLM_PROVIDER=anthropic \
  --set-secrets RAG_LLM_API_KEY=llm-api-key:latest
```

## Kubernetes Deployment

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: rag-api
        image: gcr.io/PROJECT_ID/rag-api:latest
        env:
        - name: RAG_LLM_PROVIDER
          value: "anthropic"
        - name: RAG_LLM_API_KEY
          valueFrom:
            secretKeyRef:
              name: rag-secrets
              key: llm-api-key
```

## Environment Setup

### Required Services

- **Qdrant**: Vector database
- **Redis** (optional): For caching

### Qdrant Setup

```bash
# Cloud Qdrant
export RAG_QDRANT_URL=https://your-cluster.qdrant.io
export RAG_QDRANT_API_KEY=your-api-key

# Self-hosted
docker run -d -p 6333:6333 qdrant/qdrant
```

## Monitoring

### Health Checks

Configure health check endpoint:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
readinessProbe:
  httpGet:
    path: /ready
    port: 8000
```

### Observability

Enable Langfuse for tracing:

```bash
export LANGFUSE_PUBLIC_KEY=pk-...
export LANGFUSE_SECRET_KEY=sk-...
```

## Scaling

### Horizontal Scaling

- Cloud Run: Automatic scaling
- Kubernetes: HPA based on CPU/memory

### Vertical Scaling

Adjust resources in deployment:

```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "1000m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

## Security

### Secrets Management

Use secret managers:
- GCP Secret Manager
- AWS Secrets Manager
- Kubernetes Secrets

### API Authentication

Add authentication middleware:

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.post("/query")
async def query(request: QueryRequest, token: str = Depends(security)):
    # Verify token
    if not verify_token(token):
        raise HTTPException(status_code=401)
    # ...
```

## Next Steps

- [Troubleshooting](troubleshooting.md)
- [Configuration](configuration.md)

