import type { Commit, PullRequestRef, Session, Skill, Worktree, Workflow } from './model';
import { GitService } from './git/GitService';
import { scanSessions } from './sessions/SessionService';
import { discoverSkills } from './skills/SkillService';
import { loadWorkflow } from './skills/WorkflowService';
import { Emitter } from './util/emitter';
import { isWithin, samePath } from './util/fs';

export interface StoreConfig {
  claudeHome: string;
  maxAgeDays: number;
  activeWindowSeconds: number;
  includeUserSkills: boolean;
  githubEnabled: boolean;
}

export interface PhaseState {
  phase?: string;
  /** key `<branch>|<phaseId>|<index>` -> ticked */
  checks: Record<string, boolean>;
}

export interface StoreDeps {
  git: GitService;
  workspaceRoot?: string;
  getConfig(): StoreConfig;
  log(message: string): void;
  loadPhaseState(): PhaseState;
  savePhaseState(state: PhaseState): PromiseLike<void> | void;
  fetchPullRequest?(branch: string): Promise<PullRequestRef | undefined>;
}

export interface StoreState {
  repoRoot?: string;
  defaultBranch?: string;
  worktrees: Worktree[];
  sessions: Session[];
  skills: Skill[];
  workflow?: Workflow;
  workflowError?: string;
  commits: Map<string, Commit[]>;
  phase: PhaseState;
  lastError?: string;
}

export class FdeStore {
  readonly state: StoreState;
  readonly onDidChange = new Emitter<void>();
  private inflight = new Map<string, Promise<void>>();
  private rerun = new Set<string>();

  constructor(private readonly deps: StoreDeps) {
    this.state = { worktrees: [], sessions: [], skills: [], commits: new Map(), phase: deps.loadPhaseState() };
  }

  get workspaceRoot(): string | undefined {
    return this.deps.workspaceRoot;
  }

  currentWorktree(): Worktree | undefined {
    return this.state.worktrees.find((w) => w.isCurrent) ?? this.state.worktrees[0];
  }

  sessionsFor(worktreePath: string): Session[] {
    return this.state.sessions.filter((s) => samePath(s.worktreePath, worktreePath));
  }

  worktreeForPath(p: string): Worktree | undefined {
    // Longest matching worktree wins (a nested worktree inside another checkout).
    return [...this.state.worktrees].sort((a, b) => b.path.length - a.path.length).find((w) => isWithin(p, w.path));
  }

  activeSessionCount(): number {
    return this.state.sessions.filter((s) => s.active).length;
  }

  currentPhase() {
    const { workflow, phase } = this.state;
    if (!workflow) return undefined;
    return workflow.phases.find((p) => p.id === phase.phase) ?? workflow.phases[0];
  }

  checklistKey(phaseId: string, index: number, worktree = this.currentWorktree()): string {
    return `${worktree?.branch ?? 'detached'}|${phaseId}|${index}`;
  }

  isChecked(phaseId: string, index: number): boolean {
    return this.state.phase.checks[this.checklistKey(phaseId, index)] === true;
  }

  async setChecked(phaseId: string, index: number, value: boolean): Promise<void> {
    const key = this.checklistKey(phaseId, index);
    if (value) this.state.phase.checks[key] = true;
    else delete this.state.phase.checks[key];
    await this.deps.savePhaseState(this.state.phase);
    this.onDidChange.fire();
  }

  async setPhase(phaseId: string): Promise<void> {
    this.state.phase.phase = phaseId;
    await this.deps.savePhaseState(this.state.phase);
    this.onDidChange.fire();
  }

  async refreshAll(): Promise<void> {
    await Promise.all([this.refreshGit(), this.refreshSkills(), this.refreshWorkflow()]);
  }

  refreshGit(): Promise<void> {
    return this.run('git', async () => {
      const root = this.deps.workspaceRoot;
      if (!root) {
        this.state.repoRoot = undefined;
        this.state.worktrees = [];
        return;
      }
      const repoRoot = await this.deps.git.repoRoot(root);
      this.state.repoRoot = repoRoot;
      if (!repoRoot) {
        this.state.worktrees = [];
        this.state.sessions = [];
        return;
      }
      const [worktrees, defaultBranch] = await Promise.all([
        this.deps.git.listWorktrees(repoRoot, root),
        this.deps.git.defaultBranch(repoRoot),
      ]);
      this.state.defaultBranch = defaultBranch;
      // Preserve PR info from the previous refresh until the next GitHub lookup completes.
      const previous = new Map(this.state.worktrees.map((w) => [w.path, w.pr]));
      for (const w of worktrees) w.pr = previous.get(w.path);
      this.state.worktrees = worktrees;

      const commits = new Map<string, Commit[]>();
      await Promise.all(
        worktrees
          .filter((w) => !w.prunable)
          .map(async (w) => commits.set(w.path, await this.deps.git.commitsSince(w.path, defaultBranch))),
      );
      this.state.commits = commits;
    }).then(() => Promise.all([this.refreshSessions(), this.refreshPullRequests()]).then(() => undefined));
  }

  refreshSessions(): Promise<void> {
    return this.run('sessions', async () => {
      const config = this.deps.getConfig();
      const paths = this.state.worktrees.filter((w) => !w.prunable).map((w) => w.path);
      this.state.sessions = await scanSessions(paths, config);
    });
  }

  refreshSkills(): Promise<void> {
    return this.run('skills', async () => {
      const config = this.deps.getConfig();
      this.state.skills = await discoverSkills({
        workspaceRoot: this.deps.workspaceRoot,
        claudeHome: config.claudeHome,
        includeUser: config.includeUserSkills,
      });
    });
  }

  refreshWorkflow(): Promise<void> {
    return this.run('workflow', async () => {
      if (!this.deps.workspaceRoot) return;
      try {
        this.state.workflow = await loadWorkflow(this.deps.workspaceRoot);
        this.state.workflowError = undefined;
      } catch (err) {
        this.state.workflow = undefined;
        this.state.workflowError = (err as Error).message;
      }
    });
  }

  refreshPullRequests(): Promise<void> {
    return this.run('github', async () => {
      const fetchPr = this.deps.fetchPullRequest;
      if (!fetchPr || !this.deps.getConfig().githubEnabled) return;
      await Promise.all(
        this.state.worktrees
          .filter((w) => w.branch && !w.prunable)
          .map(async (w) => {
            try {
              w.pr = await fetchPr(w.branch as string);
            } catch (err) {
              this.deps.log(`GitHub lookup failed for ${w.branch}: ${(err as Error).message}`);
            }
          }),
      );
    });
  }

  /** Serialize refreshes per kind; a request during an in-flight run schedules exactly one re-run. */
  private run(key: string, fn: () => Promise<void>): Promise<void> {
    const existing = this.inflight.get(key);
    if (existing) {
      this.rerun.add(key);
      return existing;
    }
    const p = (async () => {
      try {
        await fn();
        this.state.lastError = undefined;
      } catch (err) {
        this.state.lastError = GitService.describeError(err);
        this.deps.log(`refresh ${key} failed: ${this.state.lastError}`);
      } finally {
        this.inflight.delete(key);
        this.onDidChange.fire();
      }
      if (this.rerun.delete(key)) await this.run(key, fn);
    })();
    this.inflight.set(key, p);
    return p;
  }
}
