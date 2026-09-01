export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id?: string;
  content: string;
  status: TaskStatus;
}

export interface PullRequestRef {
  number: number;
  url: string;
  title: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  checks: 'success' | 'failure' | 'pending' | 'none';
}

export interface Worktree {
  /** Absolute path of the checkout. */
  path: string;
  /** Branch name, or null when detached. */
  branch: string | null;
  head: string;
  isMain: boolean;
  isCurrent: boolean;
  dirty: boolean;
  changedFiles: number;
  ahead: number;
  behind: number;
  upstream?: string;
  locked?: string | true;
  prunable?: string;
  lastCommit?: string;
  pr?: PullRequestRef;
}

export interface Session {
  id: string;
  cwd: string;
  worktreePath: string;
  gitBranch?: string;
  title: string;
  version?: string;
  startedAt: Date;
  lastActivityAt: Date;
  active: boolean;
  transcriptPath: string;
  tasks: Task[];
  origin: 'local' | 'remote';
}

export type SkillKind = 'skill' | 'command' | 'plugin';
export type SkillScope = 'project' | 'user' | 'plugin';

export interface Skill {
  name: string;
  description: string;
  kind: SkillKind;
  scope: SkillScope;
  path: string;
}

export interface Phase {
  id: string;
  title: string;
  skills: string[];
  checklist: string[];
}

export interface Workflow {
  name: string;
  phases: Phase[];
}

export interface Commit {
  sha: string;
  subject: string;
}

export interface FdeEvent {
  ts: string;
  event: string;
  sessionId?: string;
  cwd?: string;
  gitBranch?: string;
  summary?: string;
}
