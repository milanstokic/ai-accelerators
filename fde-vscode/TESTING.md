# Testing the FDE extension

Three layers, from fastest to most realistic.

## 1. Unit tests (no VS Code needed)

```bash
cd fde-vscode
npm install
npm test               # vitest, ~2 s
npm run typecheck
npm run build
```

What is covered:

| Area | Test file | Notes |
|------|-----------|-------|
| `git worktree list --porcelain` parsing | `test/unit/worktreeParser.test.ts` | main / linked / detached / locked / prunable / bare |
| `git status --porcelain=v2` parsing | `test/unit/statusParser.test.ts` | ahead/behind, dirty count, detached |
| Real git operations | `test/unit/GitService.test.ts` | creates a temp repo and worktrees, needs `git` on PATH |
| Session directory slug | `test/unit/slug.test.ts` | |
| Transcript head/tail parsing | `test/unit/transcript.test.ts` | title, identity fields, TodoWrite and TaskCreate/TaskUpdate task lists |
| Session scanning | `test/unit/SessionService.test.ts` | temp `~/.claude`, active window, max age, slug collision guard, large files |
| Skill discovery | `test/unit/SkillService.test.ts` | project / user / plugin precedence, frontmatter, commands in subfolders |
| Workflow file | `test/unit/WorkflowService.test.ts` | validation errors, phase split, bundled example |
| Hook settings merge | `test/unit/hooksInstaller.test.ts` | idempotent, preserves foreign hooks, uninstall |
| Events tail | `test/unit/events.test.ts` | seeding, partial lines, truncation |
| GitHub lookup | `test/unit/github.test.ts` | remote URL parsing, check rollup, fake fetch |
| Hook script | `test/unit/fdeHook.test.ts` | runs `bin/fde-hook.js` end to end |

## 2. Extension Development Host with the demo workspace

You do not need Claude Code installed for this. The demo ships a fake `claude` CLI.

```bash
cd fde-vscode
npm run demo
```

This creates `demo/` with:

- `demo/repo` on `main`, plus worktrees `demo/repo-feat-search-api` (2 commits ahead, one uncommitted change) and `demo/repo-fix-login` (1 commit ahead).
- `demo/claude-home` standing in for `~/.claude`: four transcripts (one marked active for two minutes), a user-level skill, and two plugin skills.
- `demo/repo/.vscode/settings.json` that points `fde.claudeHome` and `fde.claudeCommand` at those.

Then in VS Code:

1. Open the `fde-vscode` folder.
2. Press **F5** and pick **Run Extension (demo workspace)**. A second window opens on `demo/repo`.
3. Click the **FDE** icon in the activity bar.

Walk through this checklist in the dev host:

- [ ] **Worktrees** lists `main` (current), `feat/search-api` (`↑2 · 1 changed · 1 active`), `fix/login` (`↑1 · 1 session`).
- [ ] Hover a worktree: tooltip shows path and last commit.
- [ ] Inline **▶** on `fix/login` opens a terminal named `FDE: fix/login` running the fake claude in that directory.
- [ ] Title bar **+** → *Create new branch…* → `feat/demo` → accept the suggested path. A new worktree appears; choose **Open in New Window** to confirm the path is right.
- [ ] Right-click the new worktree → **Remove Worktree**. It is removed. Try the same on `feat/search-api`: the dialog warns about the uncommitted change and offers **Force Remove** (cancel).
- [ ] **Sessions** groups by worktree. "Implement the search endpoint…" shows a green pulse icon and `active`. After two minutes it flips to inactive without a manual refresh.
- [ ] Click a session: the transcript opens read-only. Inline **resume** sends `<fake-claude> --resume <id>` to the terminal.
- [ ] **Skills** shows *For this phase: Discover* with `kickoff-notes`, and *All skills* with the rest, including `deploy-checklist` (user) and `security-review` (plugin).
- [ ] **Progress** title **milestone** icon → pick *Build*. The Skills view now lists `scaffold`, `add-tests`, `run` first. `code-review` appears under *Ship* as found from the plugin.
- [ ] Tick a checklist item. Reload the window (`Developer: Reload Window`): the tick persists. Switch to a different worktree window: ticks are per branch.
- [ ] With the `FDE: feat/search-api` terminal focused, inline **run** on a skill sends `/scaffold` to it.
- [ ] Status bar shows `main  ⏱ 1  Build`. Clicking it focuses the Progress view.
- [ ] Edit `demo/repo/.claude/fde-workflow.yaml` and break the YAML: Progress shows *Workflow file invalid: …*. Fix it: the error clears.
- [ ] Run **FDE: Install Claude Code Hooks**. Confirm. `demo/repo/.claude/settings.local.json` now contains `SessionStart` and `Stop` entries and `demo/claude-home/fde/fde-hook.js` exists.
- [ ] Simulate a session ending:

  ```bash
  echo '{"session_id":"11111111-1111-4111-8111-111111111111","cwd":"'"$PWD"'/demo/repo-feat-search-api","hook_event_name":"Stop"}' \
    | node demo/claude-home/fde/fde-hook.js stop
  ```

  Within five seconds a notification says *Claude Code session finished on feat/search-api: 1 file changed.* **Resume** opens the terminal with `--resume`.
- [ ] **FDE: Uninstall Claude Code Hooks** removes only the FDE entries.
- [ ] **FDE: Show Log** opens the output channel with the activation summary and any refresh errors.

## 3. Against a real engagement

1. `npm run package` → `fde-vscode-0.1.0.vsix`.
2. In VS Code: *Extensions* → `…` → **Install from VSIX…**.
3. Open any repository you have used with Claude Code. Sessions appear from your real `~/.claude/projects`; skills from your real `~/.claude/skills` and plugins.
4. Run **FDE: Install Claude Code Hooks**, start `claude` from the Sessions view, and end the session: the notification fires from the real hook.
5. Optional: set `fde.github.enabled` to `true`, sign in when prompted, and check that branches with open PRs show `#<n> ✓/✗`.

If something looks wrong, **FDE: Show Log** is the first place to look. Sessions not appearing usually means the transcript directory slug differs; the log prints how many sessions were found per refresh, and `fde.claudeHome` can be pointed at a copy of your `~/.claude` for a safe experiment.

## Continuous integration

`.github/workflows/fde-vscode.yml` runs typecheck, unit tests, bundling, and packaging on every push touching `fde-vscode/`, and uploads the `.vsix` as a build artifact so it can be installed straight from the workflow run.
