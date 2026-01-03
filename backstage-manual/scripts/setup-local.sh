#!/bin/bash

set -e

echo "🚀 Setting up Backstage for local development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if Yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "📦 Installing Yarn..."
    npm install -g yarn
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your GitHub credentials"
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Create techdocs directory
echo "📁 Creating techdocs directory..."
mkdir -p techdocs

# Create data directory for SQLite
echo "📁 Creating data directory..."
mkdir -p data

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your GitHub token and credentials"
echo "2. Run 'yarn dev' to start Backstage"
echo "3. Open http://localhost:3000 in your browser"

