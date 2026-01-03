#!/bin/bash

echo "🔍 Checking prerequisites for Backstage local deployment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 18+ from https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js: $NODE_VERSION"
fi

# Check Yarn
if ! command -v yarn &> /dev/null; then
    echo "⚠️  Yarn is not installed. Will install it..."
    npm install -g yarn
else
    YARN_VERSION=$(yarn -v)
    echo "✅ Yarn: $YARN_VERSION"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "   Please update .env with your credentials"
    else
        echo "❌ .env.example not found"
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

# Check directories
if [ ! -d "techdocs" ]; then
    echo "📁 Creating techdocs directory..."
    mkdir -p techdocs
fi

if [ ! -d "data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p data
fi

echo ""
echo "✅ Prerequisites check complete!"
echo ""
echo "Next: Run 'yarn install' to install dependencies"

