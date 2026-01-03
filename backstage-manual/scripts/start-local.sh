#!/bin/bash

set -e

echo "🚀 Starting Backstage locally..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Running setup..."
    ./scripts/setup-local.sh
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Start Backstage
echo "🎬 Starting Backstage..."
echo ""
echo "Using local file paths (no GitHub required)"
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:7007"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Use local config if it exists, otherwise use default
if [ -f "app-config.local.yaml" ]; then
    echo "📝 Using app-config.local.yaml (local-only setup)"
    BACKSTAGE_CONFIG=app-config.local.yaml yarn dev
else
    echo "📝 Using app-config.yaml"
    yarn dev
fi

