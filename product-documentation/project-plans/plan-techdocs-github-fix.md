# TechDocs GitHub Integration Fix Plan

**Date:** 2026-01-03  
**Version:** 1.0  
**Status:** In Progress

## Problem Statement

TechDocs is unable to read metadata for components because:
1. The `techdocs_metadata.json` file doesn't exist in the static docs directory
2. TechDocs is looking in: `node_modules/@backstage/plugin-techdocs-backend/static/docs/`
3. The build process isn't being triggered or isn't completing successfully
4. When using `url:` format for `techdocs-ref`, TechDocs should pull from GitHub and build, but this isn't happening

## Root Cause Analysis

Based on Backstage documentation:
- **Local Builder Behavior**: With `builder: 'local'` and `publisher: 'local'`, TechDocs should:
  1. Detect that docs don't exist
  2. Pull source from GitHub (when using `url:` format in `techdocs-ref`)
  3. Build docs using mkdocs
  4. Publish to static directory
  5. Serve from static directory

- **Current Issue**: The build process isn't being triggered or is failing silently. The metadata file is created during the build process, so its absence indicates the build hasn't completed.

## Solution Plan

### Phase 1: Verify Current Configuration ✅

**Status:** Completed

- [x] GitHub integration configured in `app-config.yaml`
- [x] GitHub token is valid and accessible (verified via API)
- [x] `techdocs-ref` uses `url:` format pointing to GitHub
- [x] `source-location` points to GitHub
- [x] `backend.reading.allow` includes `github.com`

### Phase 2: Diagnose Build Process

**Tasks:**
1. **Check Backend Logs**
   - When accessing TechDocs page, monitor backend logs
   - Look for:
     - "Building TechDocs for component:default/rag-api-template"
     - GitHub API calls
     - mkdocs build messages
     - Any errors during build process

2. **Verify Build Trigger**
   - Access TechDocs page: `http://localhost:3000/docs/default/component/rag-api-template`
   - Wait 30-60 seconds
   - Check if build process starts

3. **Test GitHub Integration for TechDocs**
   - Verify TechDocs can access GitHub API
   - Check if source files are being pulled
   - Verify mkdocs.yml is accessible

### Phase 3: Fix Build Process

**Option A: Ensure Local Builder Works (Recommended for Development)**

If build isn't triggering:
1. **Check TechDocs Configuration**
   ```yaml
   techdocs:
     builder: 'local'
     generator:
       runIn: 'local'
     publisher:
       type: 'local'
   ```

2. **Verify Prerequisites**
   - mkdocs is installed: `pip install mkdocs-techdocs-core`
   - Python is available
   - All dependencies are installed

3. **Manual Build Test**
   ```bash
   cd templates/rag-api
   techdocs-cli generate --no-docker --verbose
   ```
   - This will show if there are any build errors
   - If successful, docs should be generated locally

4. **Check Build Output Location**
   - Local publisher stores docs in: `node_modules/@backstage/plugin-techdocs-backend/static/docs/`
   - Verify this directory exists and is writable

**Option B: Use External Builder (Recommended for Production)**

If local builder doesn't work:
1. **Switch to External Builder**
   ```yaml
   techdocs:
     builder: 'external'
     publisher:
       type: 'googleGcs'  # or 'awsS3', 'azureBlobStorage'
   ```

2. **Set Up CI/CD Pipeline**
   - Use GitHub Actions to build and publish docs
   - Docs are built in CI and published to cloud storage
   - Backstage reads from cloud storage

### Phase 4: Alternative Solutions

**If Local Builder Still Doesn't Work:**

1. **Use dir: Format with Local Files**
   - Temporarily use local file paths for development
   - Change `techdocs-ref` to `dir:.` 
   - Ensure files exist locally
   - This bypasses GitHub pull but allows testing

2. **Pre-build Docs Manually**
   - Build docs manually using techdocs-cli
   - Copy to static directory
   - This verifies the build process works

3. **Check TechDocs Plugin Version**
   - Ensure Backstage version supports GitHub integration
   - Update if necessary

## Implementation Steps

### Step 1: Check Backend Logs (Immediate)
```bash
# When accessing TechDocs page, check logs for:
- Build process messages
- GitHub API calls
- mkdocs errors
- File system errors
```

### Step 2: Verify Prerequisites
```bash
# Check if mkdocs is installed
pip list | grep mkdocs

# Install if missing
pip install mkdocs-techdocs-core

# Check Python version
python --version  # Should be 3.7+
```

### Step 3: Test Manual Build
```bash
cd templates/rag-api
techdocs-cli generate --no-docker --verbose
```

### Step 4: Check Directory Permissions
```bash
# Verify static docs directory is writable
ls -la backstage/node_modules/@backstage/plugin-techdocs-backend/static/docs/
chmod -R 755 backstage/node_modules/@backstage/plugin-techdocs-backend/static/docs/
```

### Step 5: Verify GitHub Integration
```bash
# Test GitHub API access
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/milanstokic/ai-accelerators/contents/templates/rag-api/mkdocs.yml
```

## Expected Outcomes

### Success Criteria
1. ✅ TechDocs page loads without errors
2. ✅ `techdocs_metadata.json` exists in static directory
3. ✅ Documentation is displayed correctly
4. ✅ Build process completes successfully
5. ✅ GitHub integration works for pulling source

### Failure Indicators
- Build process doesn't start
- GitHub API errors in logs
- mkdocs build errors
- Permission errors
- Missing dependencies

## Next Steps

1. **Immediate**: Check backend logs when accessing TechDocs page
2. **Short-term**: Verify prerequisites and test manual build
3. **Medium-term**: Fix build process or switch to external builder
4. **Long-term**: Set up CI/CD pipeline for production

## References

- [Backstage TechDocs Configuration](https://backstage.io/docs/features/techdocs/configuration)
- [Backstage TechDocs CI/CD Setup](https://backstage.io/docs/features/techdocs/configuring-ci-cd/)
- [Backstage TechDocs Troubleshooting](https://backstage.io/docs/features/techdocs/troubleshooting)

## Notes

- The `local` builder should automatically build on first access
- The metadata file is created during the build process
- If metadata doesn't exist, the build hasn't completed
- GitHub integration is working (verified via API test)
- The issue is likely in the build process itself



