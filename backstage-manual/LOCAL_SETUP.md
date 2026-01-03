# Local Backstage Setup Guide

This guide will help you set up and run Backstage locally for development **without requiring GitHub**.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Yarn** - Will be installed automatically if missing
- **No GitHub token required!** - We're using local file paths

## Quick Start

### 1. Run Setup Script

```bash
cd backstage
./scripts/setup-local.sh
```

This will:
- ✅ Check Node.js version
- ✅ Install Yarn if needed
- ✅ Create `.env` file from template (GitHub credentials optional)
- ✅ Create necessary directories

### 2. Start Backstage (No GitHub Required!)

```bash
./scripts/start-local.sh
```

Or manually:

```bash
yarn dev
```

**That's it!** Backstage will use local file paths instead of GitHub URLs.

## How It Works

### Local File Paths

The configuration uses **local file paths** instead of GitHub URLs:

- **Catalog entries**: Read from `../../templates/rag-api/catalog-info.yaml` (relative to backstage directory)
- **TechDocs**: Generated from local `docs/` directory
- **No GitHub API calls**: Everything is read from your local filesystem

### Configuration Files

- **`app-config.yaml`** - Default config (supports both local and GitHub)
- **`app-config.local.yaml`** - Local-only config (no GitHub required)

The start script automatically uses `app-config.local.yaml` if it exists.

## Catalog Locations

Service catalog entries are loaded from local paths:

```
backstage/
├── app-config.yaml (or app-config.local.yaml)
└── catalog locations point to:
    ├── ../../templates/rag-api/catalog-info.yaml
    ├── ../../sdk/src/accelerators/llm/catalog-info.yaml
    ├── ../../sdk/src/accelerators/vectorstore/catalog-info.yaml
    └── ... (other SDK modules and infrastructure)
```

## TechDocs

TechDocs are generated from your local `docs/` directory:

1. Documentation source: `docs/` directory in the repo root
2. Generated docs: `backstage/techdocs/` directory
3. Access: http://localhost:3000/docs

## Making Changes

### Update Catalog Entries

Edit the `catalog-info.yaml` files directly:

```bash
# Edit a catalog entry
nano ../../templates/rag-api/catalog-info.yaml

# Backstage will automatically reload (may take a few seconds)
```

### Update Documentation

Edit files in the `docs/` directory:

```bash
# Edit documentation
nano ../../docs/getting-started/quickstart.md

# Regenerate TechDocs (if needed)
# Backstage will handle this automatically
```

### Add New Services

1. Create a `catalog-info.yaml` file in your service directory
2. Add the path to `app-config.yaml` (or `app-config.local.yaml`) under `catalog.locations`
3. Restart Backstage or wait for auto-reload

## Troubleshooting

### Catalog Entries Not Showing

1. **Check file paths**: Ensure paths in `app-config.yaml` are correct relative to the `backstage/` directory
2. **Check file exists**: Verify the `catalog-info.yaml` files exist at the specified paths
3. **Check YAML syntax**: Ensure `catalog-info.yaml` files are valid YAML
4. **Restart Backstage**: Sometimes a restart helps

```bash
# Verify a catalog file exists
ls -la ../../templates/rag-api/catalog-info.yaml

# Check YAML syntax
cat ../../templates/rag-api/catalog-info.yaml | head -20
```

### TechDocs Not Loading

1. **Check docs directory**: Ensure `docs/` directory exists in repo root
2. **Check techdocs directory**: Ensure `backstage/techdocs/` exists
3. **Check permissions**: Ensure directories are readable

```bash
# Check directories
ls -la ../../docs/
ls -la techdocs/

# Create if missing
mkdir -p techdocs
```

### File Path Errors

If you see errors about file paths:

1. **Relative paths**: All paths in `app-config.yaml` are relative to the `backstage/` directory
2. **Use `../../`**: To go up two levels to the repo root
3. **Check working directory**: Make sure you're running commands from `backstage/` directory

## Optional: GitHub Integration

If you want to add GitHub integration later (for authentication, source links, etc.):

1. **Get GitHub token**: [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. **Add to `.env`**:
   ```env
   GITHUB_TOKEN=your-token-here
   ```
3. **Uncomment GitHub config** in `app-config.yaml`:
   ```yaml
   integrations:
     github:
       - host: github.com
         token: ${GITHUB_TOKEN}
   ```

## Development Workflow

### Making Changes

1. **Frontend changes**: Edit files in `packages/frontend/src/`
   - Changes hot-reload automatically

2. **Backend changes**: Edit files in `packages/backend/src/`
   - Backend restarts automatically

3. **Configuration changes**: Edit `app-config.yaml` or `app-config.local.yaml`
   - Restart Backstage to apply changes

4. **Catalog changes**: Edit `catalog-info.yaml` files
   - Backstage auto-reloads catalog (may take a few seconds)

### Viewing Logs

- **Frontend logs**: Check the terminal where `yarn dev` is running
- **Backend logs**: Check the same terminal (backend logs appear first)
- **Catalog loading**: Watch for "Processing locations" messages in backend logs

## Next Steps

1. **Explore the Service Catalog**: Navigate to the catalog to see your services
2. **View Documentation**: Check the Docs section for TechDocs
3. **Add More Services**: Create more `catalog-info.yaml` files
4. **Customize**: Modify the frontend and backend to fit your needs

## Getting Help

- [Backstage Documentation](https://backstage.io/docs)
- [Backstage Discord](https://discord.gg/backstage)
- Check the main [README.md](README.md) for more information
