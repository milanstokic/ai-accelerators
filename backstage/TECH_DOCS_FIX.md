# TechDocs Error Fix

## Current Error
TechDocs is looking for metadata in:
```
node_modules/@backstage/plugin-techdocs-backend/static/docs/default/component/rag-api-template/techdocs_metadata.json
```

## Root Cause
The build process isn't being triggered automatically. TechDocs should build on first access, but it's trying to read metadata before the build completes.

## Solution

### Option 1: Wait for Automatic Build (Recommended)
1. Ensure `GITHUB_TOKEN` is set in your environment:
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ```

2. Restart Backstage:
   ```bash
   cd backstage
   yarn start
   ```

3. Navigate to the TechDocs page:
   ```
   http://localhost:3000/docs/default/component/rag-api-template
   ```

4. **Wait 30-60 seconds** - TechDocs will:
   - Pull source from GitHub
   - Build docs using mkdocs
   - Publish to static directory

5. Refresh the page - docs should appear

### Option 2: Manual Build (If automatic doesn't work)
If the automatic build isn't working, you can manually build:

```bash
# Install TechDocs CLI
npm install -g @techdocs/cli

# Build docs locally
cd templates/rag-api
techdocs-cli generate --no-docker

# This will create the docs in a local directory
# Then copy them to the expected location
```

### Option 3: Check Backend Logs
When you access the TechDocs page, check backend logs for:
- "Building TechDocs for component:default/rag-api-template"
- GitHub API errors
- mkdocs build errors

## Verification
After build completes, check:
```bash
ls -la backstage/node_modules/@backstage/plugin-techdocs-backend/static/docs/default/component/rag-api-template/
```

You should see `techdocs_metadata.json` and other generated files.

## If Still Not Working
1. Verify GitHub token has `repo` scope
2. Test GitHub API access:
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/repos/milanstokic/ai-accelerators/contents/templates/rag-api/mkdocs.yml
   ```
3. Check that `mkdocs.yml` exists in GitHub
4. Verify `backstage.io/techdocs-ref: dir:.` in catalog-info.yaml
