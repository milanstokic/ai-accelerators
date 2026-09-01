import * as vscode from 'vscode';
import type { Session, Worktree } from '../model';
import type { FdeStore } from '../store';
import { relativeTime } from '../util/emitter';
import { worktreeLabel } from './WorktreesView';

export class SessionGroupItem extends vscode.TreeItem {
  constructor(
    readonly worktree: Worktree,
    readonly sessions: Session[],
  ) {
    super(worktreeLabel(worktree), sessions.length ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
    const active = sessions.filter((s) => s.active).length;
    this.description = active ? `${active} active · ${sessions.length} total` : `${sessions.length}`;
    this.iconPath = new vscode.ThemeIcon('git-branch');
    this.contextValue = 'sessionGroup';
    this.tooltip = worktree.path;
    this.id = `group:${worktree.path}`;
  }
}

export class SessionItem extends vscode.TreeItem {
  constructor(readonly session: Session) {
    super(session.title, vscode.TreeItemCollapsibleState.None);
    this.description = `${session.active ? 'active · ' : ''}${relativeTime(session.lastActivityAt)}`;
    this.iconPath = session.active
      ? new vscode.ThemeIcon('pulse', new vscode.ThemeColor('charts.green'))
      : new vscode.ThemeIcon('comment-discussion');
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${session.title}**\n\n`);
    md.appendMarkdown(`Session \`${session.id}\`\n\n`);
    md.appendMarkdown(`Started ${session.startedAt.toLocaleString()}, last activity ${session.lastActivityAt.toLocaleString()}\n\n`);
    if (session.gitBranch) md.appendMarkdown(`Branch: ${session.gitBranch}\n\n`);
    if (session.version) md.appendMarkdown(`Claude Code ${session.version}\n\n`);
    if (session.tasks.length) {
      const done = session.tasks.filter((t) => t.status === 'completed').length;
      md.appendMarkdown(`Tasks: ${done}/${session.tasks.length} completed\n\n`);
    }
    this.tooltip = md;
    this.contextValue = 'session';
    this.id = `session:${session.transcriptPath}`;
    this.command = { command: 'fde.session.openTranscript', title: 'Open Transcript', arguments: [this] };
  }
}

type Node = SessionGroupItem | SessionItem;

export class SessionsView implements vscode.TreeDataProvider<Node> {
  private readonly emitter = new vscode.EventEmitter<Node | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private readonly store: FdeStore) {
    store.onDidChange.on(() => this.emitter.fire(undefined));
  }

  getTreeItem(element: Node): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Node): Node[] {
    if (!element) {
      return this.store.state.worktrees
        .filter((w) => !w.prunable)
        .map((w) => new SessionGroupItem(w, this.store.sessionsFor(w.path)));
    }
    if (element instanceof SessionGroupItem) return element.sessions.map((s) => new SessionItem(s));
    return [];
  }
}
