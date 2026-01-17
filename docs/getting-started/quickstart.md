# Quickstart Guide

Deploy your first AI application in 15 minutes using the RAG API template.

## Step 1: Prerequisites

Ensure you have:
- Python 3.11+
- API key for Anthropic or OpenAI
- Docker (optional, for containerized deployment)

## Step 2: Install SDK

```bash
cd sdk
pip install -e .
```

## Step 3: Set Up RAG API

```bash
cd ../templates/rag-api
pip install -r requirements.txt
```

## Step 4: Configure Environment

Create a `.env` file or export variables:

```bash
export RAG_LLM_PROVIDER=anthropic
export RAG_LLM_API_KEY=sk-ant-...
export RAG_LLM_MODEL=claude-sonnet-4-20250514
```

## Step 5: Run Locally

```bash
cd src
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --reload
```

## Step 6: Test the API

```bash
# Health check
curl http://localhost:8000/health

# Query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is artificial intelligence?"}'
```

## Step 7: Deploy to Cloud Run (Optional)

### Build Container

```bash
docker build -t rag-api -f templates/rag-api/Dockerfile .
```

### Deploy with Terraform

```bash
cd infra/examples/dev
terraform init
terraform plan -var="project_id=your-gcp-project"
terraform apply
```

## What's Next?

- [First RAG App](first-rag-app.md) - Detailed RAG application guide
- [Template Documentation](../templates/) - Explore other templates
- [SDK Reference](../sdk/) - Learn about the SDK modules

## Troubleshooting

### API Key Issues
- Verify your API key is correct
- Check environment variables are set
- Ensure billing is enabled (for cloud providers)

### Port Already in Use
- Change the port: `uvicorn main:app --port 8001`
- Or stop the process using port 8000

### Import Errors
- Ensure SDK is installed: `pip install -e ../sdk`
- Check Python version: `python --version` (should be 3.11+)



