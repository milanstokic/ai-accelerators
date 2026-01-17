# GitHub Migration Guide

Complete guide for migrating the AI Accelerators platform to GitHub and integrating with Backstage.

## Overview

This guide covers:
1. Setting up GitHub repository
2. Pushing code to GitHub
3. Configuring Backstage for GitHub integration
4. Updating catalog entries to use GitHub URLs
5. Configuring TechDocs to pull from GitHub
6. Setting up authentication

---

## Step 1: Create GitHub Repository

### 1.1 Create New Repository on GitHub

1. Go to [GitHub](https://github.com) and sign in
2. Click **"New repository"** (or go to https://github.com/new)
3. Repository settings:
   - **Name**: `ai-accelerators` (or your preferred name)
   - **Description**: "AI Accelerators Platform - SDK, Templates, and Infrastructure"
   - **Visibility**: Private (recommended) or Public
   - **Initialize**: ❌ Don't initialize with README, .gitignore, or license (we have existing code)
4. Click **"Create repository"**

### 1.2 Get Repository URL

After creating, GitHub will show you the repository URL:
- **HTTPS**: `https://github.com/YOUR_USERNAME/ai-accelerators.git`
- **SSH**: `git@github.com:YOUR_USERNAME/ai-accelerators.git`

Save this URL - you'll need it in the next steps.

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git (if not already done)

```bash
cd /Users/milanstokic/development/htec-ai-accelerators

# Check if git is already initialized
git status

# If not initialized, run:
git init
```

### 2.2 Add Remote and Push

```bash
# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/ai-accelerators.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/ai-accelerators.git

# Check current branch
git branch

# Add all files
git add .

# Commit (if not already committed)
git commit -m "Initial commit: AI Accelerators Platform"

# Push to GitHub
git push -u origin main
# Or if your default branch is 'master':
# git push -u origin master
```

### 2.3 Verify Push

1. Go to your GitHub repository page
2. Verify all files are present
3. Check that the repository structure matches your local structure

---

## Step 3: Create GitHub Personal Access Token

Backstage needs a GitHub token to access your repository.

### 3.1 Create Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Configure token:
   - **Note**: "Backstage Developer Portal"
   - **Expiration**: Choose appropriate expiration (90 days, 1 year, or no expiration)
   - **Scopes**: Select these permissions:
     - ✅ `repo` (Full control of private repositories)
       - ✅ `repo:status`
       - ✅ `repo_deployment`
       - ✅ `public_repo` (if using public repo)
     - ✅ `read:org` (if using GitHub organizations)
4. Click **"Generate token"**
5. **Copy the token immediately** - you won't be able to see it again!

### 3.2 Store Token Securely

```bash
# Create .env file in backstage directory
cd backstage
cat > .env << EOF
GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE
EOF

# Make sure .env is in .gitignore
echo ".env" >> ../.gitignore
```

---

## Step 4: Update Backstage Configuration

### 4.1 Update app-config.yaml

Update the Backstage configuration to use GitHub instead of local file paths.

#### 4.1.1 Enable GitHub Integration

```yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
```

#### 4.1.2 Update Catalog Locations

Change from local file paths to GitHub URLs:

```yaml
catalog:
  locations:
    # Remove local file paths, add GitHub URLs
    - type: url
      target: https://github.com/YOUR_USERNAME/ai-accelerators/blob/main/templates/rag-api/catalog-info.yaml
    - type: url
      target: https://github.com/YOUR_USERNAME/ai-accelerators/blob/main/sdk/src/accelerators/llm/catalog-info.yaml
    # ... (add all other catalog-info.yaml files)
```

#### 4.1.3 Update TechDocs Configuration

```yaml
techdocs:
  builder: 'external'  # Use external builder for GitHub
  generator:
    runIn: 'local'  # Or 'docker' if you prefer
  publisher:
    type: 'googleGcs'  # Or 'awsS3' for production
    # For local development, you can still use 'localFilesystem'
    # type: 'localFilesystem'
    # localPublishPath: './techdocs'
```

---

## Step 5: Update Catalog-Info.yaml Files

Update all `catalog-info.yaml` files to use GitHub URLs instead of local file paths.

### 5.1 Update source-location Annotations

Change from:
```yaml
backstage.io/source-location: url:file://../../templates/rag-api
```

To:
```yaml
backstage.io/source-location: url:https://github.com/YOUR_USERNAME/ai-accelerators/tree/main/templates/rag-api
```

### 5.2 Update TechDocs References

For TechDocs, you can use GitHub URLs:

```yaml
backstage.io/techdocs-ref: url:https://github.com/YOUR_USERNAME/ai-accelerators/tree/main/templates/rag-api
```

Or if using `dir:` format (TechDocs will pull from GitHub):
```yaml
backstage.io/techdocs-ref: dir:.
```

---

## Step 6: Update Authentication

### 6.1 Configure GitHub Authentication

Update `app-config.yaml`:

```yaml
auth:
  providers:
    github:
      development:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}
```

### 6.2 Create GitHub OAuth App (for authentication)

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Click **"New OAuth App"**
3. Configure:
   - **Application name**: "Backstage Developer Portal"
   - **Homepage URL**: `http://localhost:3000` (for local) or your production URL
   - **Authorization callback URL**: `http://localhost:7007/api/auth/github/handler/frame` (for local)
4. Click **"Register application"**
5. Copy **Client ID** and generate **Client Secret**
6. Add to `.env`:
   ```bash
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

---

## Step 7: Update All Catalog-Info.yaml Files

You need to update source-location annotations in all catalog files.

### Files to Update:

1. `templates/rag-api/catalog-info.yaml`
2. `sdk/src/accelerators/llm/catalog-info.yaml`
3. `sdk/src/accelerators/vectorstore/catalog-info.yaml`
4. `sdk/src/accelerators/embeddings/catalog-info.yaml`
5. `sdk/src/accelerators/observability/catalog-info.yaml`
6. `sdk/src/accelerators/config/catalog-info.yaml`
7. `infra/modules/cloud-run/catalog-info.yaml`

### Example Update:

**Before:**
```yaml
annotations:
  backstage.io/techdocs-ref: dir:.
  backstage.io/source-location: url:file://../../templates/rag-api
```

**After:**
```yaml
annotations:
  backstage.io/techdocs-ref: dir:.
  backstage.io/source-location: url:https://github.com/YOUR_USERNAME/ai-accelerators/tree/main/templates/rag-api
  github.com/project-slug: YOUR_USERNAME/ai-accelerators
```

---

## Step 8: Commit and Push Changes

```bash
# Add all updated files
git add .

# Commit changes
git commit -m "Configure Backstage for GitHub integration"

# Push to GitHub
git push origin main
```

---

## Step 9: Restart and Test Backstage

### 9.1 Restart Backstage

```bash
cd backstage
yarn start
```

### 9.2 Verify Integration

1. **Check Catalog**: Entities should load from GitHub
2. **Check TechDocs**: Documentation should pull from GitHub
3. **Check Authentication**: GitHub login should work
4. **Check Source Links**: Should point to GitHub

---

## Step 10: Production Considerations

### 10.1 Use Secret Manager

For production, store secrets in:
- **GCP Secret Manager**
- **AWS Secrets Manager**
- **Kubernetes Secrets**

### 10.2 Update Production Config

Create `app-config.production.yaml`:

```yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}  # From secret manager

techdocs:
  builder: 'external'
  publisher:
    type: 'googleGcs'  # Or 'awsS3'
    googleGcs:
      projectId: ${GCP_PROJECT_ID}
      bucketName: ${TECHDOCS_BUCKET}
```

---

## Troubleshooting

### Catalog Not Loading from GitHub

1. Verify GitHub token is correct
2. Check token has `repo` scope
3. Verify repository is accessible with the token
4. Check Backstage backend logs for errors

### TechDocs Not Building

1. Verify `mkdocs.yml` files exist in repository
2. Check TechDocs builder configuration
3. Verify GitHub integration is working
4. Check Backstage backend logs

### Authentication Not Working

1. Verify OAuth app callback URL is correct
2. Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
3. Verify OAuth app is approved (if organization requires approval)

---

## Next Steps

After migration:
- ✅ All code is in GitHub
- ✅ Backstage pulls catalog from GitHub
- ✅ TechDocs pulls from GitHub
- ✅ GitHub authentication enabled
- ✅ Source links point to GitHub

You can now:
- Use GitHub Actions for CI/CD
- Set up automated TechDocs generation
- Use GitHub for collaboration
- Deploy Backstage to production with GitHub integration



