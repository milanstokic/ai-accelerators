# TechDocs GitHub Integration Issue

## Problem
TechDocs is trying to read from local `file://` paths instead of pulling from GitHub, even though:
- `backstage.io/source-location` points to GitHub
- `backstage.io/techdocs-ref` uses `dir:.` format
- GitHub integration is configured

## Error
```
Reading from 'file://../templates/' is not allowed
```

## Root Cause
The `local` publisher with `local` builder might not be automatically pulling from GitHub when using `dir:.` format. It's trying to resolve paths locally before pulling from GitHub.

## Solutions

### Option 1: Check Backend Logs
When accessing TechDocs, check backend logs for:
- GitHub API calls
- Build process messages
- Whether TechDocs is actually pulling from GitHub

### Option 2: Verify GitHub Integration
Test if GitHub integration is working:
```bash
# Test GitHub API access
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/milanstokic/ai-accelerators/contents/templates/rag-api/mkdocs.yml
```

### Option 3: Use External Builder (Production)
For production, use external builder with cloud storage:
```yaml
techdocs:
  builder: 'external'
  publisher:
    type: 'googleGcs'  # or 'awsS3'
```

### Option 4: Manual Build First
Build docs manually to verify they work:
```bash
cd templates/rag-api
techdocs-cli generate --no-docker
```

## Current Configuration
- Builder: `local`
- Publisher: `local`
- techdocs-ref: `dir:.`
- source-location: GitHub URL
- GitHub integration: Enabled

## Next Steps
1. Check backend logs when accessing TechDocs
2. Verify GitHub token has `repo` scope
3. Test GitHub API access
4. Consider using external builder for production
