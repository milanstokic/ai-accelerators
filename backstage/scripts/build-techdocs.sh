#!/bin/bash
# Build TechDocs for all components
# Usage: ./scripts/build-techdocs.sh

set -e

# Ensure mkdocs is in PATH
export PATH="$HOME/.local/bin:$PATH"

# Base directories
PROJECT_ROOT="/Users/milanstokic/development/htec-ai-accelerators"
STORAGE_DIR="$PROJECT_ROOT/backstage/techdocs-storage"

echo "🏗️  Building TechDocs for all components..."
echo ""

# Function to build docs for a component
build_docs() {
    local namespace=$1
    local kind=$2
    local name=$3
    local source_dir=$4
    
    echo "Building docs for $kind:$namespace/$name..."
    
    # Create output directory
    local output_dir="$STORAGE_DIR/$namespace/$kind/$name"
    mkdir -p "$output_dir"
    
    # Build docs
    cd "$source_dir"
    mkdocs build --site-dir "$output_dir" --quiet
    
    # Create metadata file
    cat > "$output_dir/techdocs_metadata.json" << EOF
{
  "site_name": "$name",
  "site_description": "Documentation for $name",
  "build_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "files": []
}
EOF
    
    echo "  ✅ Built $kind:$namespace/$name"
}

# Build rag-api-template
build_docs "default" "component" "rag-api-template" "$PROJECT_ROOT/templates/rag-api"

# Build SDK docs (shared by all SDK modules)
if [ -f "$PROJECT_ROOT/docs/sdk/mkdocs.yml" ]; then
    for module in llm vectorstore embeddings observability config; do
        mkdir -p "$STORAGE_DIR/default/component/accelerators-$module"
        cd "$PROJECT_ROOT/docs/sdk"
        mkdocs build --site-dir "$STORAGE_DIR/default/component/accelerators-$module" --quiet
        cat > "$STORAGE_DIR/default/component/accelerators-$module/techdocs_metadata.json" << EOF
{
  "site_name": "accelerators-$module",
  "site_description": "Documentation for accelerators-$module",
  "build_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "files": []
}
EOF
        echo "  ✅ Built component:default/accelerators-$module"
    done
fi

# Build cloud-run-module docs
if [ -f "$PROJECT_ROOT/infra/modules/cloud-run/docs/mkdocs.yml" ]; then
    build_docs "default" "resource" "cloud-run-module" "$PROJECT_ROOT/infra/modules/cloud-run/docs"
fi

echo ""
echo "✅ TechDocs build complete!"
echo ""
echo "Storage directory: $STORAGE_DIR"
ls -la "$STORAGE_DIR/default/"



