# Plan: Forward Deployed Engineering (FDE) Plugin for VS Code

**Version:** 1.0  
**Created:** 2026-09-01  
**Status:** In Progress — Phases 0–4 implemented in `fde-vscode/` (see `fde-vscode/TESTING.md`); Phase 5 (hardening, release, dogfooding) pending

---

## Overview

Forward deployed engineers juggle several engagements at once. Each engagement has its own repository, a handful of feature branches checked out as git worktrees, one or more Claude Code sessions running against those worktrees, and a set of skills (slash commands, `SKILL.md` files, plugins) that matter at the current stage of the work. Today that state is spread across `git`, terminals, `~/.claude`, and GitHub.

The FDE plugin is a VS Code extension that puts all of it in one sidebar:

1. **Branches & Worktrees** - every worktree of the open repo, its branch, dirty state, ahead/behind, and the pull request it maps to.
2. **Sessions** - Claude Code sessions started in this repo, grouped by worktree, with resume and open-transcript actions and an "active" indicator.
3. **Skills** - the skills and commands available in this workspace, filtered to the current workflow phase.
4. **Status & Progress** - a status bar item plus a progress panel showing the workflow checklist, the task list of the active session, commits on the branch, and CI / PR state.

The extension is read-mostly. It never edits transcripts or rewrites git history. Every mutating action shells out to `git` or `claude` so the user sees exactly what ran.

## Proposed Decisions (confirm before Phase 1)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project shape | Standalone extension repo `fde-vscode`, publisher-agnostic | No coupling to any product repo; installable in any workspace. |
| Language / build | TypeScript 5, esbuild bundle, `@vscode/vsce` packaging | Standard extension toolchain, single-file bundle, fast reload. |
| Minimum VS Code | `^1.90.0` | Gives `TreeItem.checkboxState`, `TerminalShellIntegration`, and the stable Git extension API. |
| Git access | Spawn `git` directly; use the built-in `vscode.git` extension API only for the repo root and change events | `git worktree list --porcelain` and `git status --porcelain=v2` are stable and need no dependency. |
| Session source (v1) | Local Claude Code sessions in `~/.claude/projects/<slug>/*.jsonl` | Zero configuration, works offline. Remote (claude.ai/code) sessions are P2. |
| Skill sources | `.claude/skills/**/SKILL.md`, `.claude/commands/*.md`, `~/.claude/skills/**/SKILL.md`, `~/.claude/plugins/**/skills/**/SKILL.md` | Mirrors what Claude Code itself loads. |
| Workflow definition | Optional `.claude/fde-workflow.yaml` in the target repo | Declares phases and which skills belong to each. Without it the Skills view shows everything. |
| Progress signal from Claude Code | `SessionStart` / `Stop` hooks that append to `~/.claude/fde/events.jsonl` | The extension watches one file instead of tailing every transcript. |
| GitHub integration | Optional, via the built-in `vscode.authentication` GitHub provider and REST | PR number, review state, check status per branch. Off by default. |
| Tests | Vitest for pure logic (parsers), `@vscode/test-electron` for an activation smoke test | Parsers are where the risk is; fixtures make them cheap to test. |

## Non-Goals (v1)

- Running Claude Code inside a webview. The extension opens a terminal and runs `claude` there.
- Multi-root workspaces. One workspace folder = one engagement.
- Editing skills. The Skills view opens `SKILL.md` in the editor; that is enough.
- Windows. Paths and slug encoding are tested on macOS and Linux only.

---

## Architecture

```
┌────────────────────────────── VS Code ──────────────────────────────┐
│  Activity bar "FDE"                                                  │
│  ├─ Branches & Worktrees (TreeView)  ──┐                             │
│  ├─ Sessions (TreeView)               ──┤  ViewProviders (thin,      │
│  ├─ Skills (TreeView)                 ──┤  render Models only)       │
│  └─ Progress (TreeView)               ──┘                            │
│  Status bar: "$(git-branch) feat/x · 2 sessions · phase: Build"      │
│                          ▲                                           │
│                          │ events                                    │
│  ┌───────────────────────┴──────────────────────────────┐            │
│  │ FdeStore  (single in-memory model, emits onDidChange)│            │
│  └───┬─────────────┬─────────────┬─────────────┬────────┘            │
│      │             │             │             │                     │
│  GitService   SessionService  SkillService  ProgressService          │
│  (spawn git)  (~/.claude/     (SKILL.md +   (events.jsonl, tasks,    │
│               projects)       workflow.yaml) commits, GitHub)        │
└──────────────────────────────────────────────────────────────────────┘
```

Each service owns one data source, exposes `refresh()` and `onDidChange`, and is unit-tested against fixtures. `FdeStore` joins them: sessions attach to worktrees by matching `cwd`, skills are filtered by the current workflow phase, and progress is computed per worktree.

### Core data model (`src/model.ts`)

```ts
interface Worktree {
  path: string;            // absolute
  branch: string | null;   // null when detached
  head: string;            // sha
  isMain: boolean;         // the primary checkout
  isCurrent: boolean;      // the one open in this window
  dirty: boolean;
  ahead: number; behind: number;   // vs upstream
  upstream?: string;
  pr?: PullRequestRef;     // filled by GitHub integration
  sessions: Session[];
}

interface Session {
  id: string;
  cwd: string;
  gitBranch?: string;
  title: string;           // first human prompt, truncated
  startedAt: Date;
  lastActivityAt: Date;
  active: boolean;         // mtime within `fde.sessions.activeWindowSeconds`
  transcriptPath: string;
  tasks: Task[];           // latest task list seen in the transcript
  origin: 'local' | 'remote';
}

interface Skill {
  name: string;
  description: string;
  kind: 'skill' | 'command' | 'plugin';
  scope: 'project' | 'user' | 'plugin';
  path: string;
  phases: string[];        // from workflow.yaml; empty = all phases
}

interface Workflow {
  name: string;
  phases: Phase[];
  current: string;         // phase id, persisted in workspaceState
}
interface Phase { id: string; title: string; skills: string[]; checklist: string[] }
```

### Data sources and how each is read

**Worktrees** - `git worktree list --porcelain` for the list, then `git status --porcelain=v2 --branch` in each worktree for dirty / ahead / behind. Refresh on `vscode.git` repository state change, on a `FileSystemWatcher` over `.git/worktrees/**`, and on demand.

**Sessions** - Claude Code stores one JSONL per session under `~/.claude/projects/<slug>/`, where `<slug>` is the absolute cwd with every `/` replaced by `-`. Each worktree therefore has its own directory, which is what allows grouping by worktree. Each line carries `sessionId`, `cwd`, `gitBranch`, `timestamp`, and `version`. The parser reads only what it needs:

- first 64 KB: the first `type: "user"` line gives the identity fields and the first prompt (used as the title);
- last 64 KB: latest `timestamp` and the most recent task-list entry for the Progress view;
- file `mtime` decides `active`.

The format is undocumented, so the parser lives in one module, tolerates unknown line types, and is pinned by fixture files copied from real sessions.

**Skills** - glob the four locations above, parse the YAML frontmatter of each `SKILL.md` (`name`, `description`) and the first heading of each command file. Watch `.claude/**` in the workspace for live updates.

**Workflow** - `.claude/fde-workflow.yaml`, for example:

```yaml
name: client-onboarding
phases:
  - id: discover
    title: Discover
    skills: [kickoff-notes, architecture-sketch]
    checklist: ["Kickoff notes captured", "Data sources listed"]
  - id: build
    title: Build
    skills: [scaffold, add-tests, run]
    checklist: ["Feature implemented", "Tests pass"]
  - id: ship
    title: Ship
    skills: [code-review, security-review]
    checklist: ["PR opened", "CI green", "Deployed to dev"]
```

**Progress** - four inputs merged per worktree:

1. Workflow checklist ticks, stored in `workspaceState` keyed by branch.
2. Latest task list from the active session transcript.
3. Claude Code hook events. With explicit user consent the extension installs two hooks in `.claude/settings.local.json`:
   - `SessionStart` -> `fde-hook session-start`
   - `Stop` -> `fde-hook stop`
   Both append `{ts, event, sessionId, cwd, gitBranch, summary}` to `~/.claude/fde/events.jsonl`. The extension watches that file and raises a notification when a session in this workspace stops ("Session on feat/x finished: 3 files changed. Resume / Open diff").
4. Optional: commits since merge-base with the default branch, and PR checks from GitHub.

### Commands contributed

| Command | Where | Action |
|---------|-------|--------|
| `fde.refresh` | all views | Refresh every service |
| `fde.worktree.add` | Branches view title | Pick or type a branch, run `git worktree add ../<repo>-<branch> <branch>` |
| `fde.worktree.open` | worktree item | Open the worktree in a new window |
| `fde.worktree.remove` | worktree item | `git worktree remove` after confirmation; refuses when dirty |
| `fde.worktree.openPr` | worktree item | Open the PR in the browser |
| `fde.session.start` | worktree item | Open a terminal in the worktree and run `claude` |
| `fde.session.resume` | session item | Terminal in `cwd`, run `claude --resume <id>` |
| `fde.session.openTranscript` | session item | Open the JSONL read-only |
| `fde.session.copyId` | session item | Copy session id |
| `fde.skill.run` | skill item | Send `/<name>` to the active Claude Code terminal, or start one |
| `fde.skill.open` | skill item | Open `SKILL.md` / command file |
| `fde.workflow.setPhase` | Progress view title | Quick-pick a phase |
| `fde.workflow.toggleItem` | checklist item | Toggle a checklist entry |
| `fde.hooks.install` / `fde.hooks.uninstall` | command palette | Manage the two hooks in `.claude/settings.local.json` |

### Settings

```jsonc
"fde.claudeHome": "~/.claude",                 // override for tests / non-standard installs
"fde.sessions.activeWindowSeconds": 120,
"fde.sessions.maxAgeDays": 30,
"fde.worktrees.defaultParentDir": "..",        // where new worktrees go
"fde.github.enabled": false,
"fde.skills.showUserScope": true
```

---

## Implementation Tasks

### Phase 0: Scaffold (½ day)

- [ ] `package.json`, `tsconfig.json`, esbuild script, ESLint, Vitest config
- [ ] `extension.ts` registering the "FDE" view container with four empty views and `fde.refresh`
- [ ] `.vscode/launch.json` for the Extension Development Host; `npm run watch`
- [ ] CI: lint, typecheck, unit tests, `vsce package` as a build artifact
- [ ] `README.md` with a one-paragraph description and a screenshot placeholder

**Deliverable:** F5 opens a dev host with an empty FDE sidebar.

### Phase 1: Branches & Worktrees (1.5 days)

- [ ] `GitService`: `worktree list --porcelain` parser with fixtures (main, linked, detached, locked, prunable)
- [ ] Per-worktree `status --porcelain=v2 --branch` parser for dirty / ahead / behind / upstream
- [ ] `WorktreesView`: current worktree bold, icons for dirty and detached, tooltip with path and last commit
- [ ] Commands: add, open in new window, remove (guarded), copy path
- [ ] Refresh on `vscode.git` state change and `.git/worktrees` watcher, debounced 300 ms
- [ ] Unit tests for both parsers; smoke test that the view populates in a temp repo

**Deliverable:** worktrees listed and manageable without leaving VS Code.

### Phase 2: Sessions (2 days)

- [ ] `slug(cwd)` and its inverse, with tests for paths containing `-`, `.`, and spaces
- [ ] `TranscriptParser`: head/tail reader, tolerant JSONL, extracts the model fields above
- [ ] `SessionService`: scan `~/.claude/projects/<slug>/` for every worktree; watch those directories; mark active by mtime
- [ ] `SessionsView`: grouped by worktree, sorted by last activity, "active" badge, relative timestamps
- [ ] Commands: start, resume, open transcript, copy id
- [ ] Terminal management: one named terminal per worktree, reused if alive, correct `cwd`
- [ ] Fixtures: three anonymised real transcripts (short, long, one with a task list)

**Deliverable:** every Claude Code session for the repo is one click from resuming.

### Phase 3: Skills and Workflow (1.5 days)

- [ ] `SkillService`: discover the four locations, parse frontmatter, dedupe by name with project > user > plugin precedence
- [ ] `WorkflowService`: load and validate `.claude/fde-workflow.yaml` (zod schema), persist current phase in `workspaceState`
- [ ] `SkillsView`: sections "For this phase" and "All", scope icon, description as tooltip
- [ ] Commands: run (sends `/<name>` to the Phase 2 terminal), open file
- [ ] Watchers on workspace `.claude/**` and `~/.claude/skills/**`
- [ ] Ship an example `fde-workflow.yaml` and a JSON schema for editor validation

**Deliverable:** the skills relevant to the current stage are one click away.

### Phase 4: Status and Progress (2 days)

- [ ] Status bar item: current branch, active session count, current phase; click opens the Progress view
- [ ] `ProgressView`: phase checklist with checkboxes, tasks from the active session, commits since merge-base
- [ ] `fde-hook` script (`bin/fde-hook.js`, no dependencies) and `fde.hooks.install` with an explicit confirmation dialog that merges rather than overwrites
- [ ] `EventsWatcher` over `~/.claude/fde/events.jsonl`; toast on `stop` for sessions in this workspace, with Resume and Open Diff actions
- [ ] Optional GitHub: `fde.github.enabled` turns on PR lookup by branch (`GET /repos/{owner}/{repo}/pulls?head=`) and check rollup on the worktree item

**Deliverable:** the engineer sees at a glance where every branch stands and is told when a session finishes.

### Phase 5: Hardening and Release (1 day)

- [ ] Error boundaries: a broken transcript or missing `git` degrades one view, never the whole extension
- [ ] Performance: session scan bounded by `maxAgeDays`; head/tail reads only; measured on 500 transcripts
- [ ] Docs: install, workflow file reference, hooks, settings, troubleshooting
- [ ] Package `.vsix` in CI on tags; publish to a private Marketplace or distribute the VSIX
- [ ] Dogfood on one real engagement for a week; log issues

---

## Files to Create

```
fde-vscode/
├── package.json                    # contributes: viewsContainers, views, commands, menus, configuration
├── tsconfig.json
├── esbuild.mjs
├── vitest.config.ts
├── README.md
├── CHANGELOG.md
├── schemas/
│   └── fde-workflow.schema.json
├── bin/
│   └── fde-hook.js                 # appends to ~/.claude/fde/events.jsonl from Claude Code hooks
├── src/
│   ├── extension.ts                # activate(): wire services, store, views, commands, status bar
│   ├── model.ts                    # Worktree, Session, Skill, Workflow, Task
│   ├── store.ts                    # FdeStore: joins services, single onDidChange
│   ├── git/
│   │   ├── GitService.ts
│   │   ├── worktreeParser.ts       # `git worktree list --porcelain`
│   │   └── statusParser.ts         # `git status --porcelain=v2 --branch`
│   ├── sessions/
│   │   ├── SessionService.ts
│   │   ├── slug.ts                 # cwd <-> ~/.claude/projects directory name
│   │   ├── transcript.ts           # head/tail JSONL reader
│   │   └── terminal.ts             # one terminal per worktree, runs `claude`
│   ├── skills/
│   │   ├── SkillService.ts
│   │   ├── frontmatter.ts
│   │   └── WorkflowService.ts      # .claude/fde-workflow.yaml (zod schema)
│   ├── progress/
│   │   ├── ProgressService.ts
│   │   ├── EventsWatcher.ts        # ~/.claude/fde/events.jsonl
│   │   ├── hooksInstaller.ts       # manages .claude/settings.local.json hooks
│   │   └── github.ts               # optional PR / checks lookup
│   ├── views/
│   │   ├── WorktreesView.ts
│   │   ├── SessionsView.ts
│   │   ├── SkillsView.ts
│   │   ├── ProgressView.ts
│   │   └── StatusBar.ts
│   └── util/
│       ├── exec.ts                 # spawn with timeout, cwd, stdout capture
│       ├── debounce.ts
│       └── log.ts                  # OutputChannel "FDE"
├── test/
│   ├── fixtures/
│   │   ├── worktree-list/*.txt
│   │   ├── status/*.txt
│   │   ├── transcripts/*.jsonl
│   │   └── workflow/*.yaml
│   ├── unit/                       # vitest, pure logic
│   └── e2e/                        # @vscode/test-electron smoke test
└── media/
    └── fde.svg                     # activity bar icon
```

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude Code transcript format changes between versions | Sessions view breaks silently | Tolerant parser, `version` field logged, fixtures per CLI version, one view degrades not all |
| Large transcripts (100 MB+) | Slow scan, memory | Head/tail reads only, `maxAgeDays` cap, async fs off the UI thread |
| Path slug collisions (`/a-b/c` vs `/a/b-c`) | Sessions attached to the wrong worktree | Verify `cwd` inside the transcript matches the worktree path before attaching |
| Hooks modify user config | Surprise, broken existing hooks | Explicit confirm dialog, merge not overwrite, uninstall command, only touch `settings.local.json` |
| GitHub rate limits / auth prompts | Annoyance | Off by default, cached per branch for 60 s, one request per refresh |
| Worktree removal loses work | Data loss | Refuse when dirty or when a session was active in the last 10 minutes; always confirm |

## Open Questions

1. Remote (claude.ai/code) sessions in v1 via the session list API, or P2? Assumed P2.
2. One workspace folder per engagement, or multi-root? Assumed one; multi-root is P2.
3. Workflow file in `.claude/` next to skills, or a separate `.fde/` directory? Assumed `.claude/fde-workflow.yaml`.
4. Public Marketplace or internal VSIX distribution? Assumed VSIX first.

## Success Criteria

- [ ] A repo with three worktrees shows all three with correct dirty / ahead / behind in under 1 s
- [ ] Every local Claude Code session for those worktrees is listed and resumable with one click
- [ ] Active sessions are marked within 2 s of activity
- [ ] Skills view shows only phase-relevant skills when a workflow file exists, everything otherwise
- [ ] A `Stop` hook event produces a VS Code notification within 2 s
- [ ] Parser unit test coverage >= 90%; e2e smoke test passes in CI
- [ ] Activates in under 200 ms and degrades gracefully when `git` or `~/.claude` is missing

## Timeline

| Phase | Effort | Cumulative |
|-------|--------|------------|
| 0 Scaffold | 0.5 d | 0.5 d |
| 1 Worktrees | 1.5 d | 2 d |
| 2 Sessions | 2 d | 4 d |
| 3 Skills & Workflow | 1.5 d | 5.5 d |
| 4 Status & Progress | 2 d | 7.5 d |
| 5 Hardening & Release | 1 d | 8.5 d |

Phases 1, 2, and 3 are independent and can run in parallel across three worktrees or sessions. Phase 4 depends on 2 (terminals, transcripts) and 3 (workflow). Phase 5 depends on everything.
