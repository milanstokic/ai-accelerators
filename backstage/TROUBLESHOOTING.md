# Troubleshooting Backstage

## Common Issues and Solutions

### Console and Network Errors

#### Issue: CORS Errors
**Symptoms**: Network errors in browser console about CORS policy

**Solution**: The CORS configuration in `app-config.yaml` should allow `http://localhost:3000`. Verify:
```yaml
backend:
  cors:
    origin: http://localhost:3000
    methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
    credentials: true
```

#### Issue: Catalog Not Loading
**Symptoms**: Empty catalog, 404 errors for catalog endpoints

**Solutions**:
1. **Check file paths**: Catalog file paths in `app-config.yaml` are relative to `packages/backend` directory
2. **Verify files exist**: Run from `packages/backend`:
   ```bash
   ls -la ../../../templates/rag-api/catalog-info.yaml
   ```
3. **Check backend logs**: Look for catalog processing errors
4. **Restart Backstage**: After changing catalog locations, restart is required

#### Issue: Frontend Can't Connect to Backend
**Symptoms**: Network errors, "Failed to fetch" messages

**Solutions**:
1. **Verify backend is running**: Check `http://localhost:7007/api/catalog/health`
2. **Check baseUrl**: Ensure `app.baseUrl` matches frontend URL
3. **Check backend.baseUrl**: Should be `http://localhost:7007`
4. **Verify ports**: Ensure ports 3000 and 7007 are not in use by other processes

#### Issue: TechDocs Not Loading
**Symptoms**: Documentation pages show errors

**Solutions**:
1. **Check TechDocs config**: For local development, use:
   ```yaml
   techdocs:
     builder: 'local'
     generator:
       runIn: 'local'  # Not 'docker'
     publisher:
       type: 'local'
   ```
2. **Verify docs directory**: Ensure `docs/` directory exists in repo root
3. **Check mkdocs.yml**: Should exist if using TechDocs

### Catalog File Path Issues

#### Verify Paths
Catalog file paths in `app-config.yaml` are relative to `packages/backend`:

```bash
# From backstage/packages/backend directory
cd backstage/packages/backend
ls -la ../../../templates/rag-api/catalog-info.yaml
```

If files don't exist, the paths are wrong. Update paths in `app-config.yaml`.

### Restarting Backstage

After making configuration changes:

1. **Stop Backstage**: Press `Ctrl+C` in the terminal
2. **Restart**: `yarn start`
3. **Wait for compilation**: First startup takes 1-2 minutes

### Checking Backend Health

```bash
# Check if backend is responding
curl http://localhost:7007/api/catalog/health

# Check catalog entities
curl http://localhost:7007/api/catalog/entities | jq
```

### Browser Console Errors

Common errors and fixes:

1. **"Failed to fetch"**: Backend not running or CORS issue
2. **"404 Not Found"**: Check API endpoint paths
3. **"CORS policy"**: Verify CORS configuration in `app-config.yaml`
4. **"Catalog empty"**: Check catalog file paths and restart

### Debugging Steps

1. **Check backend logs**: Look at terminal where `yarn start` is running
2. **Check browser console**: Open DevTools (F12) and check Console tab
3. **Check network tab**: See which requests are failing
4. **Verify configuration**: Check `app-config.yaml` for typos
5. **Test endpoints**: Use `curl` to test backend endpoints directly

### Quick Fixes

```bash
# Restart Backstage
cd backstage
# Stop with Ctrl+C, then:
yarn start

# Clear cache and restart
rm -rf node_modules/.cache
yarn start

# Check if ports are in use
lsof -i :3000
lsof -i :7007
```



