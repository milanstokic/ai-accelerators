import * as vscode from 'vscode';
import type { Commit, Phase, Task, Worktree } from '../model';
import type { FdeStore } from '../store';

class SectionItem extends vscode.TreeItem {
  constructor(
    label: string,
    readonly kind: 'workflow' | 'tasks' | 'commits' | 'pr' | 'error',
    description?: string,
    icon?: string,
  ) {
    super(label, kind === 'error' ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Expanded);
    this.description = description;
    if (icon) this.iconPath = new vscode.ThemeIcon(icon);
    this.contextValue = `section-${kind}`;
    this.id = `section:${kind}`;
  }
}

class PhaseItem extends vscode.TreeItem {
  constructor(
    readonly phase: Phase,
    current: boolean,
    done: number,
  ) {
    super(phase.title, current ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
    this.description = phase.checklist.length ? `${done}/${phase.checklist.length}${current ? ' · current' : ''}` : current ? 'current' : undefined;
    this.iconPath = new vscode.ThemeIcon(current ? 'arrow-right' : done === phase.checklist.length && phase.checklist.length > 0 ? 'pass' : 'circle-outline');
    this.contextValue = 'phase';
    this.id = `phase:${phase.id}`;
  }
}

export class ChecklistItem extends vscode.TreeItem {
  constructor(
    readonly phaseId: string,
    readonly index: number,
    label: string,
    checked: boolean,
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.checkboxState = checked ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
    this.contextValue = 'checklist';
    this.id = `check:${phaseId}:${index}`;
  }
}

class TaskItem extends vscode.TreeItem {
  constructor(task: Task) {
    super(task.content, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(
      { pending: 'circle-outline', in_progress: 'sync~spin', completed: 'pass' }[task.status],
      task.status === 'completed' ? new vscode.ThemeColor('charts.green') : undefined,
    );
    this.description = task.status.replace('_', ' ');
    this.contextValue = 'task';
  }
}

class CommitItem extends vscode.TreeItem {
  constructor(commit: Commit) {
    super(commit.subject, vscode.TreeItemCollapsibleState.None);
    this.description = commit.sha;
    this.iconPath = new vscode.ThemeIcon('git-commit');
    this.contextValue = 'commit';
  }
}

class PrItem extends vscode.TreeItem {
  constructor(worktree: Worktree) {
    const pr = worktree.pr as NonNullable<Worktree['pr']>;
    super(`#${pr.number} ${pr.title}`, vscode.TreeItemCollapsibleState.None);
    this.description = `${pr.draft ? 'draft · ' : ''}${pr.state} · checks ${pr.checks}`;
    this.iconPath = new vscode.ThemeIcon(
      'git-pull-request',
      pr.checks === 'failure' ? new vscode.ThemeColor('charts.red') : pr.checks === 'success' ? new vscode.ThemeColor('charts.green') : undefined,
    );
    this.command = { command: 'vscode.open', title: 'Open', arguments: [vscode.Uri.parse(pr.url)] };
    this.contextValue = 'pr';
  }
}

type Node = SectionItem | PhaseItem | ChecklistItem | TaskItem | CommitItem | PrItem;

export class ProgressView implements vscode.TreeDataProvider<Node> {
  private readonly emitter = new vscode.EventEmitter<Node | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private readonly store: FdeStore) {
    store.onDidChange.on(() => this.emitter.fire(undefined));
  }

  getTreeItem(element: Node): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Node): Node[] {
    const { workflow, workflowError, commits, defaultBranch } = this.store.state;
    const worktree = this.store.currentWorktree();

    if (!element) {
      const nodes: Node[] = [];
      if (workflowError) nodes.push(new SectionItem(`Workflow file invalid: ${workflowError}`, 'error', undefined, 'error'));
      if (workflow) {
        const current = this.store.currentPhase();
        nodes.push(new SectionItem(`Workflow: ${workflow.name}`, 'workflow', current ? `phase ${current.title}` : undefined, 'milestone'));
      }
      const session = worktree ? this.store.sessionsFor(worktree.path)[0] : undefined;
      if (session && session.tasks.length) {
        const done = session.tasks.filter((t) => t.status === 'completed').length;
        nodes.push(new SectionItem('Session tasks', 'tasks', `${done}/${session.tasks.length} · ${session.title}`, 'checklist'));
      }
      if (worktree) {
        const list = commits.get(worktree.path) ?? [];
        nodes.push(new SectionItem(`Commits since ${defaultBranch ?? 'base'}`, 'commits', `${list.length}`, 'git-commit'));
        if (worktree.pr) nodes.push(new SectionItem('Pull request', 'pr', undefined, 'git-pull-request'));
      }
      return nodes;
    }

    if (element instanceof SectionItem) {
      switch (element.kind) {
        case 'workflow': {
          const current = this.store.currentPhase();
          return (workflow?.phases ?? []).map((p) => {
            const done = p.checklist.filter((_, i) => this.store.isChecked(p.id, i)).length;
            return new PhaseItem(p, p.id === current?.id, done);
          });
        }
        case 'tasks': {
          const session = worktree ? this.store.sessionsFor(worktree.path)[0] : undefined;
          return (session?.tasks ?? []).map((t) => new TaskItem(t));
        }
        case 'commits':
          return worktree ? (commits.get(worktree.path) ?? []).map((c) => new CommitItem(c)) : [];
        case 'pr':
          return worktree?.pr ? [new PrItem(worktree)] : [];
        default:
          return [];
      }
    }
    if (element instanceof PhaseItem) {
      return element.phase.checklist.map((label, i) => new ChecklistItem(element.phase.id, i, label, this.store.isChecked(element.phase.id, i)));
    }
    return [];
  }
}
