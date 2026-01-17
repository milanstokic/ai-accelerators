# HTEC AI Platform

Spotify Backstage instance for the AI Accelerators platform, configured to use local file paths.

## Quick Start

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Yarn** - Installed automatically with the app

### Start Backstage

```bash
cd backstage
yarn install  # If not already done
yarn dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:7007

### Configuration

The app is configured to:
- ✅ Use **local file paths** for catalog entries (no GitHub required)
- ✅ Use **guest authentication** (no login needed for local dev)
- ✅ Use **local TechDocs** generation
- ✅ Read catalog entries from your local repository

### Catalog Entries

Service catalog entries are loaded from:
- `../templates/rag-api/catalog-info.yaml`
- `../sdk/src/accelerators/*/catalog-info.yaml`
- `../infra/modules/cloud-run/catalog-info.yaml`

All paths are relative to `packages/backend` directory.

### What You'll See

Once Backstage is running, you can:
- Browse the **Software Catalog** to see your templates and SDK modules
- View **TechDocs** documentation
- Use **Search** to find services and documentation
- Explore **APIs** (when configured)

## Documentation

- [Backstage Documentation](https://backstage.io/docs)
- [What is Backstage?](https://backstage.io/docs/overview/what-is-backstage)
- [Software Catalog](https://backstage.io/docs/features/software-catalog/)
- [TechDocs](https://backstage.io/docs/features/techdocs/)

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 7007 or 3000
lsof -i :7007
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Catalog Entries Not Showing

1. Verify catalog files exist at the paths specified in `app-config.yaml`
2. Check file paths are relative to `packages/backend` directory
3. Restart Backstage after adding new catalog entries

### Dependencies Issues

```bash
# Clean install
rm -rf node_modules packages/*/node_modules yarn.lock
yarn install
```
