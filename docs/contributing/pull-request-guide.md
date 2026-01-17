# Pull Request Guide

This guide covers the pull request process, review criteria, and best practices for contributing to AI Accelerators.

## Overview

All changes to the repository go through pull requests (PRs). This ensures:
- Code quality through peer review
- Knowledge sharing across the team
- Consistent coding standards
- Clear change history

## Before Creating a PR

### 1. Create an Issue (Optional)

For significant changes, create a GitHub Issue first to:
- Discuss the approach
- Get early feedback
- Avoid duplicate work

### 2. Create a Feature Branch

```bash
# Update trunk
git checkout trunk
git pull origin trunk

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### Branch Naming Conventions

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New features | `feature/streaming-support` |
| `fix/` | Bug fixes | `fix/empty-query-error` |
| `docs/` | Documentation | `docs/contributing-guide` |
| `refactor/` | Code restructuring | `refactor/llm-providers` |
| `test/` | Test additions | `test/vectorstore-coverage` |

### 3. Make Your Changes

- Follow [Coding Standards](coding-standards.md)
- Write tests per [Testing Guide](testing-guide.md)
- Update documentation as needed

### 4. Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Good commit messages
git commit -m "feat(sdk): add streaming support to LLM client"
git commit -m "fix(vectorstore): handle empty query results"
git commit -m "docs(contributing): add PR guide"

# Bad commit messages
git commit -m "update code"
git commit -m "fix stuff"
```

### 5. Run Pre-commit Checks

```bash
# Run all checks
pre-commit run --all-files

# Or let them run automatically on commit
git commit -m "your message"  # Pre-commit runs automatically
```

## Creating a Pull Request

### 1. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 2. Open a PR on GitHub

Navigate to the repository and click "Compare & pull request".

### 3. Fill Out the PR Template

```markdown
## Description

Brief description of the changes and why they are needed.

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

Describe the tests that you ran to verify your changes.

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### 4. Request Review

- Assign reviewers from the team
- Add relevant labels
- Link related issues

## PR Size Guidelines

### Ideal PR Size

| Size | Lines Changed | Review Time |
|------|---------------|-------------|
| Small | < 200 | < 30 min |
| Medium | 200-400 | 30-60 min |
| Large | 400-800 | 1-2 hours |
| Too Large | > 800 | Split it! |

### Tips for Smaller PRs

- Split features into incremental changes
- Separate refactoring from feature changes
- Create draft PRs for early feedback
- Use feature flags for partially complete features

## Code Review Process

### For Authors

**Before requesting review:**
- Self-review your code
- Ensure CI passes
- Update PR description if needed
- Mark as "Ready for Review"

**During review:**
- Respond to all comments
- Discuss disagreements constructively
- Make requested changes promptly
- Re-request review after changes

**Common feedback to address proactively:**
- Add tests for new code
- Update documentation
- Improve variable naming
- Handle edge cases
- Add error handling

### For Reviewers

**Review checklist:**
- [ ] Does the code do what the PR claims?
- [ ] Are there sufficient tests?
- [ ] Is the code readable and maintainable?
- [ ] Does it follow coding standards?
- [ ] Are there any security concerns?
- [ ] Is documentation updated?
- [ ] Are there any performance concerns?

**Providing feedback:**
- Be specific and actionable
- Explain the "why" behind suggestions
- Distinguish between blocking and non-blocking
- Offer alternatives when suggesting changes
- Acknowledge good work

**Comment prefixes:**

| Prefix | Meaning |
|--------|---------|
| `nit:` | Minor suggestion, not blocking |
| `question:` | Clarification needed |
| `suggestion:` | Recommended change |
| `blocking:` | Must be addressed before merge |

## CI Requirements

All PRs must pass CI checks:

### Required Checks

| Check | Description |
|-------|-------------|
| Lint | Black, Ruff formatting |
| Type Check | MyPy type validation |
| Unit Tests | pytest with coverage |
| Security Scan | Trivy vulnerability scan |

### Fixing CI Failures

```bash
# Lint failures
black sdk/
ruff check sdk/ --fix

# Type check failures
mypy sdk/src/accelerators

# Test failures
cd sdk && pytest -v
```

## Merging PRs

### Requirements

Before merging, PRs must have:
- [ ] At least one approval
- [ ] All CI checks passing
- [ ] All conversations resolved
- [ ] Up-to-date with trunk

### Merge Strategy

We use **squash and merge** to maintain a clean commit history:

1. Click "Squash and merge"
2. Edit the commit message if needed
3. Confirm the merge

### After Merging

- Delete your feature branch
- Close related issues
- Verify deployment (if applicable)

## Handling Feedback

### Responding to Comments

```markdown
# Good responses
"Good catch! Fixed in abc1234"
"I considered that approach, but went with X because [reason]. What do you think?"
"Could you clarify what you mean by [specific part]?"

# Responses to avoid
"Done"
"Why?"
"I disagree" (without explanation)
```

### Resolving Disagreements

1. **Understand first**: Ask clarifying questions
2. **Explain your reasoning**: Share context the reviewer may not have
3. **Find common ground**: Often both perspectives have merit
4. **Escalate if needed**: Involve a third party for tie-breaking
5. **Document decisions**: Update code comments or ADRs

## Draft PRs

Use draft PRs for:
- Work in progress needing early feedback
- Exploring different approaches
- Documenting design decisions

```bash
# Create draft PR via GitHub CLI
gh pr create --draft --title "WIP: Feature X"
```

## Common PR Issues

### "Changes requested" but no comments

Ask the reviewer to specify what needs to change.

### Stale PR

If your PR has been open for a while:
```bash
# Update with latest trunk
git checkout feature/your-branch
git rebase trunk
git push --force-with-lease
```

### Merge conflicts

```bash
# Resolve conflicts
git checkout feature/your-branch
git rebase trunk
# Resolve conflicts in files
git add .
git rebase --continue
git push --force-with-lease
```

### CI keeps failing

1. Check the CI logs for specific errors
2. Run the failing checks locally
3. Ask for help if stuck

## Best Practices Summary

### Do

- ✅ Keep PRs small and focused
- ✅ Write descriptive PR titles and descriptions
- ✅ Respond to review comments promptly
- ✅ Update your PR based on feedback
- ✅ Be respectful in all communications
- ✅ Test your changes thoroughly

### Don't

- ❌ Merge without approval
- ❌ Ignore CI failures
- ❌ Leave comments unresolved
- ❌ Mix unrelated changes in one PR
- ❌ Force push after review has started
- ❌ Take feedback personally

## Need Help?

- Ask in the PR comments
- Reach out to the team on Slack
- Check the [FAQ](../getting-started/faq.md)
