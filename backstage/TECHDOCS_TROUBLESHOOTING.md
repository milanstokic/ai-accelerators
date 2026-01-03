# TechDocs GitHub Integration Troubleshooting

## Current Issue

TechDocs is trying to read metadata from:
```
node_modules/@backstage/plugin-techdocs-backend/static/docs/default/component/rag-api-template/techdocs_metadata.json
```

But the configured path is:
```
packages/backend/techdocs/
```

## Expected Behavior

When using GitHub with a local builder, TechDocs should:
1. **On first access**: Pull source from GitHub → Build docs → Publish to `packages/backend/techdocs/`
2. **On subsequent access**: Read from `packages/backend/techdocs/`

## Troubleshooting Steps

### 1. Verify GitHub Integration

Check that `GITHUB_TOKEN` is set:
```bash
echo $GITHUB_TOKEN
```

If not set, add to `backstage/.env`:
```bash
GITHUB_TOKEN=ghp_your_token_here
```

### 2. Check Backend Logs

When you access the TechDocs page, look for:
- "Building TechDocs for component:default/rag-api-template"
- "TechDocs build completed"
- Any GitHub API errors

### 3. Verify Repository Access

Test if the token can access the repository:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/milanstokic/ai-accelerators/contents/templates/rag-api/mkdocs.yml
```

### 4. Manual Build Test

You can manually trigger a build by accessing:
```
http://localhost:3000/docs/default/component/rag-api-template
```

### 5. Check Directory Structure

Verify the techdocs directory exists:
```bash
ls -la backstage/packages/backend/techdocs/
```

### 6. Verify Catalog Configuration

Ensure the catalog entry has correct annotations:
```yaml
annotations:
  backstage.io/techdocs-ref: dir:.
  backstage.io/source-location: url:https://github.com/milanstokic/ai-accelerators/tree/trunk/templates/rag-api
  github.com/project-slug: milanstokic/ai-accelerators
```

## Common Issues

### Issue: Build Not Triggering
**Solution**: Access the TechDocs page directly - this triggers the build

### Issue: GitHub Token Invalid
**Solution**: Regenerate token with `repo` scope

### Issue: Wrong Path Resolution
**Solution**: The `localPublishPath` is relative to `packages/backend`, so `./techdocs` is correct

### Issue: mkdocs.yml Missing
**Solution**: Ensure `templates/rag-api/mkdocs.yml` exists in GitHub

## Next Steps

1. Restart Backstage with `GITHUB_TOKEN` set
2. Navigate to the component's TechDocs page
3. Wait 30-60 seconds for build
4. Check `packages/backend/techdocs/` for generated files
5. Refresh the page

If issues persist, check backend logs for detailed error messages.
