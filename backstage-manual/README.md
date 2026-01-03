# AI Accelerators Backstage Developer Portal

Spotify Backstage instance for the AI Accelerators platform.

## Quick Start

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Yarn** - Will be installed automatically if missing
- **GitHub Token** - Optional (only needed if using GitHub integration)

### Local Development Setup

#### Quick Start (Recommended) - No GitHub Required!

```bash
cd backstage
./scripts/start-local.sh
```

This will:
- Check prerequisites
- Set up environment file if needed
- Install dependencies if needed
- Start Backstage using **local file paths** (no GitHub needed!)

**Note**: The setup uses local file paths by default, so you don't need GitHub credentials to get started.

#### Detailed Setup

For detailed instructions, see [LOCAL_SETUP.md](LOCAL_SETUP.md)

#### Option 1: Automated Setup

Run the setup script:

```bash
cd backstage
./scripts/setup-local.sh
```

This will:
- Check prerequisites
- Install dependencies
- Create necessary directories
- Set up environment file

#### Option 2: Manual Setup

1. **Install dependencies:**
```bash
cd backstage
yarn install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and add your GitHub credentials
```

3. **Create necessary directories:**
```bash
mkdir -p techdocs data
```

### Running Backstage Locally

1. **Start the development server:**
```bash
yarn dev
```

This starts both frontend and backend concurrently.

2. **Access Backstage:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:7007

### Environment Variables

Create a `.env` file in the `backstage/` directory with:

```env
# GitHub Integration (optional for basic setup)
GITHUB_TOKEN=your-github-token-here
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Backstage Configuration
BACKSTAGE_BASE_URL=http://localhost:7007
```

**Getting a GitHub Token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` and `read:org` scopes
3. Add it to your `.env` file

**GitHub OAuth App (for authentication):**
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `http://localhost:7007/api/auth/github/handler/frame`
4. Add Client ID and Secret to your `.env` file

### Docker Deployment (Local)

If you prefer Docker:

```bash
# Build the image
docker build -t backstage .

# Run with docker-compose
docker-compose up
```

Or run directly:

```bash
docker run -p 7007:7007 \
  -e GITHUB_TOKEN=your-token \
  -v $(pwd)/app-config.yaml:/app/app-config.yaml \
  backstage
```

## Configuration

- **`app-config.yaml`** - Development configuration
- **`app-config.production.yaml`** - Production configuration
- **`.env`** - Local environment variables (not committed to git)

## Troubleshooting

### Port Already in Use

If port 7007 or 3000 is already in use:

```bash
# Find the process
lsof -i :7007
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Issues

Backstage uses SQLite by default for local development. If you encounter database errors:

```bash
# Remove the database and restart
rm -f data/dev.db
yarn dev
```

### TechDocs Not Loading

Ensure the `techdocs` directory exists and has proper permissions:

```bash
mkdir -p techdocs
chmod 755 techdocs
```

## Next Steps

1. **Add Service Catalog Entries**: See `templates/rag-api/catalog-info.yaml` for examples
2. **Configure TechDocs**: Documentation will be generated automatically
3. **Set up Authentication**: Configure OAuth providers in `app-config.yaml`

## Deployment

### Cloud Run

See `infra/modules/cloud-run/terraform/backstage/` for Terraform deployment.

## Documentation

- [Backstage Documentation](https://backstage.io/docs)
- [TechDocs Guide](https://backstage.io/docs/features/techdocs/)
- [Service Catalog](https://backstage.io/docs/features/software-catalog/)

