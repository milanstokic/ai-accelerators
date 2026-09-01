# FDE — Forward Deployed Engineering for VS Code

One sidebar for everything a forward deployed engineer juggles on an engagement:

| View | What it shows | Actions |
|------|---------------|---------|
| **Branches & Worktrees** | Every git worktree of the open repo: branch, dirty state, ahead/behind, sessions, PR | Add, open in new window, remove (guarded), start a Claude Code session |
| **Sessions** | Local Claude Code sessions grouped by worktree, newest first, live "active" badge | Resume in a terminal, open transcript, copy id |
| **Skills** | Skills and slash commands from the project, your `~/.claude`, and plugins, split by workflow phase | Run in the active session, open the file |
| **Progress** | Workflow phase checklist, the active session's task list, commits since the base branch, PR status | Tick items, switch phase |

A status bar item summarises the current worktree, active session count, and phase. When the optional Claude Code hooks are installed, finishing a session pops a notification with a **Resume** button.

## How it works

- Worktrees come from `git worktree list --porcelain` and `git status --porcelain=v2` per worktree.
- Sessions are read from Claude Code's own transcripts in `~/.claude/projects/<cwd-slug>/*.jsonl`. Only the head and tail of each file are read.
- Skills are discovered in `.claude/skills/*/SKILL.md`, `.claude/commands/*.md`, `~/.claude/skills`, and `~/.claude/plugins/**/skills`.
- The workflow is an optional `.claude/fde-workflow.yaml` in the repo (see `FDE: Create Example Workflow File`).
- Progress notifications use two Claude Code hooks (`SessionStart`, `Stop`) that append to `~/.claude/fde/events.jsonl`. Install them with `FDE: Install Claude Code Hooks`; they only touch `.claude/settings.local.json`.
- GitHub PR and check status is off by default. Enable `fde.github.enabled` to look up the PR for each branch via the built-in GitHub authentication provider.

The extension never edits transcripts or rewrites git history. Every mutating action runs `git` or `claude` in the open, and worktree removal refuses dirty trees unless you choose *Force Remove*.

## Settings

| Setting | Default | Purpose |
|---------|---------|---------|
| `fde.claudeHome` | `~/.claude` | Where Claude Code keeps projects, skills, plugins |
| `fde.claudeCommand` | `claude` | Command launched in terminals |
| `fde.sessions.activeWindowSeconds` | `120` | Transcript modified within this window = active |
| `fde.sessions.maxAgeDays` | `30` | Older sessions are hidden |
| `fde.worktrees.defaultParentDir` | `..` | Where new worktrees are created, relative to the main worktree |
| `fde.github.enabled` | `false` | PR and check lookup |
| `fde.skills.showUserScope` | `true` | Include `~/.claude` skills and plugins |

## Workflow file

```yaml
# .claude/fde-workflow.yaml
name: client-engagement
phases:
  - id: build
    title: Build
    skills: [scaffold, add-tests, run]      # names of skills/commands shown first in this phase
    checklist:
      - Feature implemented on a branch
      - Tests pass locally
```

## Development

See [TESTING.md](TESTING.md) for the full test matrix. Short version:

```bash
npm install
npm run check          # typecheck + unit tests + bundle
npm run demo           # build ./demo with a repo, worktrees, fake sessions, fake claude
# then press F5 in VS Code with this folder open → "Run Extension (demo workspace)"
npm run package        # produces fde-vscode-<version>.vsix
```
