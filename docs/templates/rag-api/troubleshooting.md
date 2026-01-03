# RAG API Troubleshooting

Common issues and solutions for the RAG API.

## Connection Issues

### Qdrant Connection Failed

**Error:** `Connection refused` or `Cannot connect to Qdrant`

**Solutions:**
1. Verify Qdrant is running: `docker ps | grep qdrant`
2. Check URL: `curl http://localhost:6333/health`
3. Verify network connectivity
4. Check firewall rules

### LLM API Errors

**Error:** `Authentication failed` or `Invalid API key`

**Solutions:**
1. Verify API key is correct
2. Check environment variables are set
3. Ensure billing is enabled
4. Check API key permissions

## Performance Issues

### Slow Queries

**Symptoms:** Queries take > 5 seconds

**Solutions:**
1. Reduce `top_k` parameter
2. Optimize chunk size
3. Use faster embedding model
4. Enable caching
5. Scale Qdrant resources

### High Memory Usage

**Solutions:**
1. Reduce batch sizes
2. Limit concurrent requests
3. Increase container memory
4. Optimize chunking strategy

## Data Issues

### Documents Not Found

**Symptoms:** Queries return no results

**Solutions:**
1. Verify documents were ingested
2. Check collection name
3. Verify embeddings were generated
4. Check filters aren't too restrictive

### Poor Search Results

**Solutions:**
1. Increase `top_k`
2. Adjust chunk size
3. Improve document quality
4. Use reranking
5. Tune embedding model

## Deployment Issues

### Container Won't Start

**Solutions:**
1. Check logs: `docker logs rag-api`
2. Verify environment variables
3. Check port conflicts
4. Verify dependencies installed

### Cloud Run Deployment Fails

**Solutions:**
1. Check build logs
2. Verify image exists
3. Check IAM permissions
4. Verify API quotas

## Debugging

### Enable Debug Mode

```bash
export RAG_DEBUG=true
```

### Check Logs

```bash
# Docker
docker logs rag-api

# Cloud Run
gcloud run services logs read rag-api

# Kubernetes
kubectl logs deployment/rag-api
```

### Test Components

```python
# Test vector store
from accelerators.vectorstore import QdrantVectorStore
store = QdrantVectorStore(url="http://localhost:6333")
await store.create_collection("test", dimension=1536)

# Test embeddings
from accelerators.embeddings import OpenAIEmbeddingProvider
provider = OpenAIEmbeddingProvider(api_key="sk-...")
embedding = await provider.embed("test")
```

## Common Errors

### `Collection not found`

**Solution:** Create collection before ingesting:
```python
await vector_store.create_collection("documents", dimension=1536)
```

### `Embedding dimension mismatch`

**Solution:** Ensure embedding model matches collection dimension:
- `text-embedding-3-small`: 1536
- `text-embedding-3-large`: 3072

### `Rate limit exceeded`

**Solution:**
1. Implement retry logic
2. Reduce request rate
3. Use batch processing
4. Upgrade API tier

## Getting Help

- Check [API Reference](api-reference.md)
- Review [Configuration](configuration.md)
- Open GitHub issue
- Check logs for detailed error messages

