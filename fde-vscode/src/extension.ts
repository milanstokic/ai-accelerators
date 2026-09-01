import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { GitService, suggestWorktreePath } from './git/GitService';
import type { Session, Worktree } from './model';
import { EventsTail, eventsFile, fdeDir } from './progress/events';
import { fetchPullRequest, parseRemote } from './progress/github';
import {
  addHooks,
  hasHooks,
  installHookScript,
  localSettingsPath,
  readSettings,
  removeHooks,
  writeSettings,
} from './progress/hooksInstaller';
import { projectsDir } from './sessions/SessionService';
import { TerminalManager } from './sessions/terminal';
import { EXAMPLE_WORKFLOW, WORKFLOW_FILE } from './skills/WorkflowService';
import { FdeStore, type PhaseState, type StoreConfig } from './store';
import { debounce } from './util/emitter';
import { expandHome, isWithin } from './util/fs';
import { ChecklistItem, ProgressView } from './views/ProgressView';
import { SessionGroupItem, SessionItem, SessionsView } from './views/SessionsView';
import { SkillItem, SkillsView } from './views/SkillsView';
import { WorktreeItem, WorktreesView, worktreeLabel } from './views/WorktreesView';
import { StatusBar } from './views/StatusBar';

interface FullConfig extends StoreConfig {
  claudeCommand: string;
  defaultParentDir: string;
}

function readConfig(): FullConfig {
  const c = vscode.workspace.getConfiguration('fde');
  return {
    claudeHome: expandHome(c.get<string>('claudeHome', '~/.claude')),
    claudeCommand: c.get<string>('claudeCommand', 'claude'),
    maxAgeDays: c.get<number>('sessions.maxAgeDays', 30),
    activeWindowSeconds: c.get<number>('sessions.activeWindowSeconds', 120),
    includeUserSkills: c.get<boolean>('skills.showUserScope', true),
    githubEnabled: c.get<boolean>('github.enabled', false),
    defaultParentDir: c.get<string>('worktrees.defaultParentDir', '..'),
  };
}

const PHASE_STATE_KEY = 'fde.phaseState';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const log = vscode.window.createOutputChannel('FDE', { log: true });
  context.subscriptions.push(log);
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const git = new GitService();

  const store = new FdeStore({
    git,
    workspaceRoot,
    getConfig: readConfig,
    log: (m) => log.info(m),
    loadPhaseState: () => context.workspaceState.get<PhaseState>(PHASE_STATE_KEY, { checks: {} }),
    savePhaseState: (state) => context.workspaceState.update(PHASE_STATE_KEY, state),
    fetchPullRequest: async (branch) => {
      if (!store.state.repoRoot) return undefined;
      const remote = await git.remoteUrl(store.state.repoRoot);
      const ref = remote ? parseRemote(remote) : undefined;
      if (!ref) return undefined;
      const auth = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
      return fetchPullRequest(auth.accessToken, ref, branch);
    },
  });
  const terminals = new TerminalManager(() => readConfig().claudeCommand);
  context.subscriptions.push(terminals);

  // Views
  const worktreesView = new WorktreesView(store);
  const sessionsView = new SessionsView(store);
  const skillsView = new SkillsView(store);
  const progressView = new ProgressView(store);
  const progressTree = vscode.window.createTreeView('fde.progress', { treeDataProvider: progressView, showCollapseAll: true });
  context.subscriptions.push(
    vscode.window.createTreeView('fde.worktrees', { treeDataProvider: worktreesView }),
    vscode.window.createTreeView('fde.sessions', { treeDataProvider: sessionsView, showCollapseAll: true }),
    vscode.window.createTreeView('fde.skills', { treeDataProvider: skillsView, showCollapseAll: true }),
    progressTree,
    progressTree.onDidChangeCheckboxState(async (e) => {
      for (const [item, state] of e.items) {
        if (item instanceof ChecklistItem) {
          await store.setChecked(item.phaseId, item.index, state === vscode.TreeItemCheckboxState.Checked);
        }
      }
    }),
  );
  context.subscriptions.push(new StatusBar(store));

  // Helpers
  const pickWorktree = async (placeHolder: string): Promise<Worktree | undefined> => {
    const items = store.state.worktrees
      .filter((w) => !w.prunable)
      .map((w) => ({ label: worktreeLabel(w), description: w.path, worktree: w }));
    if (items.length === 1) return items[0]?.worktree;
    const picked = await vscode.window.showQuickPick(items, { placeHolder });
    return picked?.worktree;
  };
  const worktreeOf = (arg: unknown): Worktree | undefined => {
    if (arg instanceof WorktreeItem) return arg.worktree;
    if (arg instanceof SessionGroupItem) return arg.worktree;
    return undefined;
  };
  const showError = (prefix: string, err: unknown) => {
    const message = `${prefix}: ${GitService.describeError(err)}`;
    log.error(message);
    void vscode.window.showErrorMessage(`FDE ${message}`);
  };

  // Commands
  const register = (id: string, handler: (...args: unknown[]) => unknown) =>
    context.subscriptions.push(vscode.commands.registerCommand(id, handler));

  register('fde.refresh', () => store.refreshAll());
  register('fde.showLog', () => log.show());

  register('fde.worktree.add', async () => {
    const repoRoot = store.state.repoRoot;
    const main = store.state.worktrees.find((w) => w.isMain);
    if (!repoRoot || !main) return void vscode.window.showWarningMessage('FDE: no git repository open.');
    const NEW = '$(add) Create new branch…';
    let branches: string[] = [];
    try {
      branches = await git.localBranches(repoRoot);
    } catch (err) {
      return showError('could not list branches', err);
    }
    const inUse = new Set(store.state.worktrees.map((w) => w.branch));
    const choice = await vscode.window.showQuickPick(
      [NEW, ...branches.filter((b) => !inUse.has(b))],
      { placeHolder: 'Branch to check out in the new worktree' },
    );
    if (!choice) return;
    let branch = choice;
    let create = false;
    if (choice === NEW) {
      const name = await vscode.window.showInputBox({ prompt: 'New branch name', validateInput: (v) => (v.trim() ? undefined : 'Required') });
      if (!name) return;
      branch = name.trim();
      create = true;
    }
    const target = await vscode.window.showInputBox({
      prompt: 'Worktree directory',
      value: suggestWorktreePath(main.path, readConfig().defaultParentDir, branch),
      valueSelection: undefined,
    });
    if (!target) return;
    try {
      await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Adding worktree for ${branch}` }, () =>
        git.addWorktree(repoRoot, target, branch, create),
      );
    } catch (err) {
      return showError('could not add worktree', err);
    }
    await store.refreshGit();
    const open = await vscode.window.showInformationMessage(`FDE: worktree created at ${target}`, 'Open in New Window', 'Start Session');
    if (open === 'Open in New Window') await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(target), { forceNewWindow: true });
    if (open === 'Start Session') terminals.startSession({ path: target, branch });
  });

  register('fde.worktree.open', async (arg) => {
    const w = worktreeOf(arg) ?? (await pickWorktree('Worktree to open'));
    if (w) await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(w.path), { forceNewWindow: true });
  });

  register('fde.worktree.copyPath', async (arg) => {
    const w = worktreeOf(arg);
    if (w) await vscode.env.clipboard.writeText(w.path);
  });

  register('fde.worktree.openPr', async (arg) => {
    const w = worktreeOf(arg);
    if (w?.pr) await vscode.env.openExternal(vscode.Uri.parse(w.pr.url));
  });

  register('fde.worktree.remove', async (arg) => {
    const w = worktreeOf(arg);
    const repoRoot = store.state.repoRoot;
    if (!w || !repoRoot) return;
    if (w.isCurrent || w.isMain) return void vscode.window.showWarningMessage('FDE: cannot remove the main or currently open worktree.');
    const recent = store.sessionsFor(w.path).find((s) => Date.now() - s.lastActivityAt.getTime() < 10 * 60_000);
    const warnings = [
      w.dirty ? `${w.changedFiles} uncommitted change(s) will be lost.` : undefined,
      recent ? `A Claude Code session was active here ${Math.round((Date.now() - recent.lastActivityAt.getTime()) / 60_000)} min ago.` : undefined,
    ].filter(Boolean);
    const answer = await vscode.window.showWarningMessage(
      `Remove worktree ${worktreeLabel(w)} at ${w.path}?`,
      { modal: true, detail: warnings.join('\n') || undefined },
      w.dirty ? 'Force Remove' : 'Remove',
    );
    if (!answer) return;
    try {
      await git.removeWorktree(repoRoot, w.path, answer === 'Force Remove');
    } catch (err) {
      return showError('could not remove worktree', err);
    }
    await store.refreshGit();
  });

  register('fde.session.start', async (arg) => {
    const w = worktreeOf(arg) ?? store.currentWorktree() ?? (await pickWorktree('Worktree for the new session'));
    if (!w) return void vscode.window.showWarningMessage('FDE: open a git repository first.');
    terminals.startSession(w);
  });

  register('fde.session.resume', (arg) => {
    if (!(arg instanceof SessionItem)) return;
    terminals.resumeSession(arg.session, store.worktreeForPath(arg.session.worktreePath));
  });

  register('fde.session.openTranscript', async (arg) => {
    if (!(arg instanceof SessionItem)) return;
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(arg.session.transcriptPath));
    await vscode.window.showTextDocument(doc, { preview: true });
  });

  register('fde.session.copyId', async (arg) => {
    if (arg instanceof SessionItem) await vscode.env.clipboard.writeText(arg.session.id);
  });

  register('fde.skill.run', (arg) => {
    if (!(arg instanceof SkillItem)) return;
    terminals.runSkill(arg.skill.name, store.currentWorktree());
  });

  register('fde.skill.open', async (arg) => {
    if (!(arg instanceof SkillItem)) return;
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(arg.skill.path));
    await vscode.window.showTextDocument(doc, { preview: true });
  });

  register('fde.workflow.setPhase', async () => {
    const workflow = store.state.workflow;
    if (!workflow) return void vscode.window.showInformationMessage(`FDE: add ${WORKFLOW_FILE} to define phases.`, 'Create Example').then((a) => {
      if (a) void vscode.commands.executeCommand('fde.workflow.createExample');
    });
    const current = store.currentPhase();
    const picked = await vscode.window.showQuickPick(
      workflow.phases.map((p) => ({ label: p.title, description: p.id === current?.id ? 'current' : undefined, id: p.id })),
      { placeHolder: 'Workflow phase' },
    );
    if (picked) await store.setPhase(picked.id);
  });

  register('fde.workflow.createExample', async () => {
    if (!workspaceRoot) return;
    const file = path.join(workspaceRoot, WORKFLOW_FILE);
    if (!fs.existsSync(file)) {
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      await fs.promises.writeFile(file, EXAMPLE_WORKFLOW, 'utf8');
    }
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(vscode.Uri.file(file)));
    await store.refreshWorkflow();
  });

  register('fde.hooks.install', async () => {
    if (!workspaceRoot) return;
    const claudeHome = readConfig().claudeHome;
    const settingsFile = localSettingsPath(workspaceRoot);
    const answer = await vscode.window.showInformationMessage(
      'Install FDE hooks into Claude Code?',
      {
        modal: true,
        detail: `This copies fde-hook.js to ${fdeDir(claudeHome)} and adds SessionStart and Stop hooks to ${settingsFile}. Existing hooks are kept.`,
      },
      'Install',
    );
    if (answer !== 'Install') return;
    try {
      const script = await installHookScript(context.asAbsolutePath(path.join('bin', 'fde-hook.js')), claudeHome);
      const settings = await readSettings(settingsFile);
      await writeSettings(settingsFile, addHooks(settings, script));
      void vscode.window.showInformationMessage('FDE: hooks installed. New Claude Code sessions will report start and stop events.');
    } catch (err) {
      showError('could not install hooks', err);
    }
  });

  register('fde.hooks.uninstall', async () => {
    if (!workspaceRoot) return;
    const settingsFile = localSettingsPath(workspaceRoot);
    try {
      const settings = await readSettings(settingsFile);
      if (!hasHooks(settings)) return void vscode.window.showInformationMessage('FDE: no hooks installed in this workspace.');
      await writeSettings(settingsFile, removeHooks(settings));
      void vscode.window.showInformationMessage('FDE: hooks removed.');
    } catch (err) {
      showError('could not remove hooks', err);
    }
  });

  // Watchers -------------------------------------------------------------
  const refreshGit = debounce(() => void store.refreshGit(), 400);
  const refreshSessions = debounce(() => void store.refreshSessions(), 800);
  const refreshSkills = debounce(() => {
    void store.refreshSkills();
    void store.refreshWorkflow();
  }, 500);
  context.subscriptions.push({ dispose: () => [refreshGit, refreshSessions, refreshSkills].forEach((d) => d.cancel()) });

  const watch = (base: string, glob: string, handler: () => void): vscode.Disposable => {
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.file(base), glob));
    watcher.onDidChange(handler);
    watcher.onDidCreate(handler);
    watcher.onDidDelete(handler);
    return watcher;
  };

  // Built-in git extension events cover checkouts, commits and new worktrees created from VS Code.
  try {
    const gitExt = vscode.extensions.getExtension<{ getAPI(v: 1): GitApi }>('vscode.git');
    const api = (gitExt?.isActive ? gitExt.exports : await gitExt?.activate())?.getAPI(1);
    if (api) {
      const hook = (repo: GitRepository) => context.subscriptions.push(repo.state.onDidChange(refreshGit));
      api.repositories.forEach(hook);
      context.subscriptions.push(api.onDidOpenRepository(hook));
    }
  } catch (err) {
    log.warn(`vscode.git API unavailable: ${(err as Error).message}`);
  }

  if (workspaceRoot) {
    context.subscriptions.push(
      watch(workspaceRoot, '.git/worktrees/**', refreshGit),
      watch(workspaceRoot, '.claude/**', refreshSkills),
    );
  }

  let homeWatchers: vscode.Disposable[] = [];
  let eventsTail: EventsTail | undefined;
  const setupHomeWatchers = () => {
    homeWatchers.forEach((d) => d.dispose());
    const { claudeHome } = readConfig();
    eventsTail = new EventsTail(eventsFile(claudeHome));
    void eventsTail.poll(); // seed offset so old events are not replayed
    homeWatchers = [
      watch(projectsDir(claudeHome), '*/*.jsonl', refreshSessions),
      watch(path.join(claudeHome, 'skills'), '**/SKILL.md', refreshSkills),
      watch(fdeDir(claudeHome), 'events.jsonl', () => void drainEvents()),
    ];
  };

  const drainEvents = async () => {
    if (!eventsTail) return;
    for (const event of await eventsTail.poll()) {
      log.info(`event ${event.event} ${event.cwd ?? ''} ${event.summary ?? ''}`);
      const worktree = event.cwd ? store.worktreeForPath(event.cwd) : undefined;
      if (!worktree && !(event.cwd && workspaceRoot && isWithin(event.cwd, workspaceRoot))) continue;
      refreshGit();
      refreshSessions();
      if (event.event === 'stop') {
        const label = worktree ? worktreeLabel(worktree) : event.gitBranch ?? 'this repo';
        const action = await vscode.window.showInformationMessage(
          `Claude Code session finished on ${label}: ${event.summary ?? 'done'}.`,
          'Resume',
          'Show Sessions',
        );
        if (action === 'Resume' && event.sessionId) {
          const stub: Session = {
            id: event.sessionId,
            cwd: event.cwd ?? worktree?.path ?? workspaceRoot ?? '',
            worktreePath: worktree?.path ?? event.cwd ?? workspaceRoot ?? '',
            gitBranch: event.gitBranch,
            title: '',
            startedAt: new Date(),
            lastActivityAt: new Date(),
            active: false,
            transcriptPath: '',
            tasks: [],
            origin: 'local',
          };
          terminals.resumeSession(stub, worktree);
        }
        if (action === 'Show Sessions') await vscode.commands.executeCommand('fde.sessions.focus');
      }
    }
  };

  setupHomeWatchers();
  context.subscriptions.push(
    { dispose: () => homeWatchers.forEach((d) => d.dispose()) },
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration('fde')) return;
      setupHomeWatchers();
      void store.refreshAll();
    }),
  );

  // Polling fallbacks: file watchers outside the workspace are best-effort, and "active" decays with time.
  const timers = [
    setInterval(() => void store.refreshSessions(), 30_000),
    setInterval(() => void store.refreshGit(), 90_000),
    setInterval(() => void drainEvents(), 5_000),
  ];
  context.subscriptions.push({ dispose: () => timers.forEach(clearInterval) });

  await store.refreshAll();
  log.info(`FDE activated for ${workspaceRoot ?? '(no workspace)'}: ${store.state.worktrees.length} worktrees, ${store.state.sessions.length} sessions, ${store.state.skills.length} skills`);
}

export function deactivate(): void {
  // subscriptions are disposed by VS Code
}

// Minimal typing of the built-in git extension API surface we use.
interface GitRepository {
  state: { onDidChange: vscode.Event<void> };
}
interface GitApi {
  repositories: GitRepository[];
  onDidOpenRepository: vscode.Event<GitRepository>;
}
