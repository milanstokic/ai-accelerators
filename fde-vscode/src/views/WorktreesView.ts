import * as path from 'node:path';
import * as vscode from 'vscode';
import type { Worktree } from '../model';
import type { FdeStore } from '../store';

export class WorktreeItem extends vscode.TreeItem {
  constructor(
    readonly worktree: Worktree,
    sessionCount: number,
    activeCount: number,
  ) {
    super(worktree.branch ?? `(detached ${worktree.head.slice(0, 7)})`, vscode.TreeItemCollapsibleState.None);
    const parts: string[] = [];
    if (worktree.isCurrent) parts.push('current');
    if (worktree.isMain) parts.push('main');
    if (worktree.ahead) parts.push(`↑${worktree.ahead}`);
    if (worktree.behind) parts.push(`↓${worktree.behind}`);
    if (worktree.dirty) parts.push(`${worktree.changedFiles} changed`);
    if (activeCount) parts.push(`${activeCount} active`);
    else if (sessionCount) parts.push(`${sessionCount} session${sessionCount === 1 ? '' : 's'}`);
    if (worktree.pr) parts.push(`#${worktree.pr.number} ${prGlyph(worktree.pr.checks)}`);
    if (worktree.prunable) parts.push('missing');
    this.description = parts.join(' · ');

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${this.label}**\n\n`);
    md.appendMarkdown(`\`${worktree.path}\`\n\n`);
    if (worktree.lastCommit) md.appendMarkdown(`Last commit: ${worktree.lastCommit}\n\n`);
    if (worktree.upstream) md.appendMarkdown(`Upstream: ${worktree.upstream}\n\n`);
    if (worktree.pr) md.appendMarkdown(`PR [#${worktree.pr.number}](${worktree.pr.url}) ${worktree.pr.state}, checks ${worktree.pr.checks}\n\n`);
    if (worktree.locked) md.appendMarkdown(`Locked${typeof worktree.locked === 'string' ? `: ${worktree.locked}` : ''}\n\n`);
    if (worktree.prunable) md.appendMarkdown(`Prunable: ${worktree.prunable}\n\n`);
    this.tooltip = md;

    const color = worktree.dirty ? new vscode.ThemeColor('gitDecoration.modifiedResourceForeground') : undefined;
    this.iconPath = new vscode.ThemeIcon(worktree.isCurrent ? 'root-folder-opened' : 'git-branch', color);
    this.resourceUri = vscode.Uri.file(worktree.path);
    const ctx = ['worktree', worktree.isCurrent ? 'current' : 'other'];
    if (worktree.pr) ctx.push('pr');
    this.contextValue = ctx.join(' ');
    this.id = `worktree:${worktree.path}`;
  }
}

function prGlyph(checks: NonNullable<Worktree['pr']>['checks']): string {
  return { success: '✓', failure: '✗', pending: '…', none: '' }[checks];
}

export class WorktreesView implements vscode.TreeDataProvider<WorktreeItem> {
  private readonly emitter = new vscode.EventEmitter<WorktreeItem | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private readonly store: FdeStore) {
    store.onDidChange.on(() => this.emitter.fire(undefined));
  }

  getTreeItem(element: WorktreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): WorktreeItem[] {
    return this.store.state.worktrees.map((w) => {
      const sessions = this.store.sessionsFor(w.path);
      return new WorktreeItem(w, sessions.length, sessions.filter((s) => s.active).length);
    });
  }
}

export function worktreeLabel(w: Worktree): string {
  return w.branch ?? path.basename(w.path);
}
