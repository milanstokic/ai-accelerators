# Release Process

This guide covers the release and versioning process for the AI Accelerators platform.

## Overview

We follow [Semantic Versioning](https://semver.org/) (SemVer) for all releases. This ensures predictable versioning that communicates the impact of changes to users.

## Version Numbering

### Format: MAJOR.MINOR.PATCH

| Component | When to Increment | Example |
|-----------|-------------------|---------|
| **MAJOR** | Breaking changes | 1.0.0 → 2.0.0 |
| **MINOR** | New features (backward compatible) | 1.0.0 → 1.1.0 |
| **PATCH** | Bug fixes (backward compatible) | 1.0.0 → 1.0.1 |

### Pre-release Versions

For pre-release versions, append a suffix:
- Alpha: `1.0.0-alpha.1`
- Beta: `1.0.0-beta.1`
- Release Candidate: `1.0.0-rc.1`

## Release Branches

### Branch Strategy

```
trunk (main development)
  │
  ├── release/1.0.x (maintenance branch)
  │
  └── release/1.1.x (maintenance branch)
```

### Branch Lifecycle

1. **trunk**: Active development, always releasable
2. **release/X.Y.x**: Created for each minor version, receives patch releases
3. **hotfix/**: Created from release branch for urgent fixes

## Release Types

### Regular Releases

Scheduled releases with planned features:

1. Features developed in feature branches
2. Merged to trunk via PR
3. Release branch created at release time
4. Version bumped and tagged

### Patch Releases

Bug fixes for released versions:

1. Fix developed on trunk or hotfix branch
2. Cherry-picked to release branch
3. Patch version bumped and tagged

### Hotfix Releases

Urgent fixes for critical issues:

1. Hotfix branch created from release tag
2. Fix applied directly to hotfix branch
3. Merged back to trunk and release branch
4. Patch version bumped and tagged

## Release Workflow

### Step 1: Prepare Release

```bash
# Ensure trunk is up to date
git checkout trunk
git pull origin trunk

# Create release branch (for new minor/major versions)
git checkout -b release/1.2.x

# Or for patches, checkout existing release branch
git checkout release/1.2.x
git pull origin release/1.2.x
```

### Step 2: Update Version

Update version in relevant files:

**SDK** (`sdk/pyproject.toml`):
```toml
[project]
version = "1.2.0"
```

**Backstage** (`backstage/package.json`):
```json
{
  "version": "1.2.0"
}
```

### Step 3: Update CHANGELOG

Add release notes to `CHANGELOG.md`:

```markdown
## [1.2.0] - 2026-01-15

### Added
- Streaming support for LLM client (#123)
- New embedding providers (#124)

### Changed
- Improved vector search performance (#125)

### Fixed
- Memory leak in batch processing (#126)

### Deprecated
- Old configuration format (use new format)

### Security
- Updated dependencies to address CVE-XXXX
```

### Step 4: Create Release PR

```bash
# Commit changes
git add .
git commit -m "chore(release): prepare v1.2.0"

# Push and create PR
git push origin release/1.2.x
```

### Step 5: Review and Merge

- Get PR approval
- Ensure CI passes
- Merge to trunk (for new releases)

### Step 6: Tag Release

```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release v1.2.0"

# Push tag
git push origin v1.2.0
```

### Step 7: Publish Release

**GitHub Release:**
```bash
# Create GitHub release using CLI
gh release create v1.2.0 \
  --title "v1.2.0" \
  --notes-file RELEASE_NOTES.md
```

**PyPI (SDK):**
```bash
# Build and publish (automated in CI)
cd sdk
python -m build
twine upload dist/*
```

## Changelog Guidelines

### Keep a CHANGELOG

Maintain `CHANGELOG.md` in the repository root following [Keep a Changelog](https://keepachangelog.com/) format.

### Categories

| Category | Description |
|----------|-------------|
| Added | New features |
| Changed | Changes to existing functionality |
| Deprecated | Features to be removed |
| Removed | Removed features |
| Fixed | Bug fixes |
| Security | Security fixes |

### Example Entry

```markdown
## [1.2.0] - 2026-01-15

### Added
- `LLMClient.stream()` method for streaming responses (#123)
  - Supports all providers (Anthropic, OpenAI, Google)
  - Returns async iterator of response chunks

### Changed
- `VectorStore.search()` now returns `SearchResult` objects instead of dicts (#125)
  - Migration: Replace `result['id']` with `result.id`

### Fixed
- Fixed memory leak when processing large document batches (#126)

### Security
- Updated `httpx` to 0.26.0 to address CVE-2024-XXXXX
```

## Breaking Changes

### Definition

A breaking change is any change that:
- Removes or renames public APIs
- Changes function signatures
- Changes return types
- Removes configuration options
- Changes default behavior

### Handling Breaking Changes

1. **Document clearly**: List all breaking changes in CHANGELOG
2. **Provide migration guide**: Help users update their code
3. **Deprecation period**: Warn before removing (when possible)
4. **Major version bump**: Always increment MAJOR version

### Migration Guide Example

```markdown
## Migration Guide: v1.x to v2.0

### Breaking Change: LLMClient Constructor

**Before (v1.x):**
```python
client = LLMClient("anthropic", "claude-sonnet-4-20250514")
```

**After (v2.0):**
```python
client = LLMClient(provider="anthropic", model="claude-sonnet-4-20250514")
```

### Breaking Change: Search Results

**Before (v1.x):**
```python
results = store.search(query)
for r in results:
    print(r["id"], r["score"])
```

**After (v2.0):**
```python
results = store.search(query)
for r in results:
    print(r.id, r.score)
```
```

## Deprecation Policy

### Deprecation Timeline

1. **Announce**: Add deprecation warning in current version
2. **Document**: Note deprecation in CHANGELOG and docs
3. **Maintain**: Keep deprecated feature for at least one minor version
4. **Remove**: Remove in next major version

### Deprecation Warnings

```python
import warnings

def old_method():
    warnings.warn(
        "old_method is deprecated and will be removed in v2.0. "
        "Use new_method instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return new_method()
```

## Release Schedule

### Cadence

| Release Type | Frequency | Description |
|--------------|-----------|-------------|
| Major | As needed | Breaking changes, major features |
| Minor | Monthly | New features, improvements |
| Patch | As needed | Bug fixes, security updates |

### Release Calendar

- **Feature freeze**: 1 week before release
- **Code freeze**: 2 days before release
- **Release day**: Last Wednesday of month

## Automated Releases

### CI/CD Pipeline

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build SDK
        run: |
          cd sdk
          python -m build

      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          packages-dir: sdk/dist/

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: sdk/dist/*
          body_path: RELEASE_NOTES.md
```

## Release Checklist

### Before Release

- [ ] All planned features merged
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version numbers updated
- [ ] Migration guide written (if breaking changes)

### During Release

- [ ] Release PR approved and merged
- [ ] Tag created and pushed
- [ ] CI/CD pipeline completed
- [ ] Packages published
- [ ] GitHub release created

### After Release

- [ ] Verify package installation works
- [ ] Announce release (if significant)
- [ ] Monitor for issues
- [ ] Close related milestones/issues

## Rollback Procedure

If a release has critical issues:

### 1. Assess Impact

- How many users affected?
- Is there a workaround?
- Can it wait for a patch release?

### 2. Decide Action

| Severity | Action |
|----------|--------|
| Low | Patch release |
| Medium | Quick patch release |
| High | Yank release + patch |

### 3. Yank Release (if needed)

```bash
# PyPI - yank version
pip install twine
twine upload --skip-existing --repository pypi

# GitHub - mark as pre-release or delete
gh release edit v1.2.0 --prerelease
```

### 4. Communicate

- Update GitHub release notes
- Notify affected users
- Document incident

## Questions?

For release questions:
- Check the [FAQ](../getting-started/faq.md)
- Open a GitHub Issue
- Contact the platform team
