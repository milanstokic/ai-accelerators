import * as vscode from 'vscode';
import type { FdeStore } from '../store';

export class StatusBar implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private readonly unsubscribe: () => void;

  constructor(private readonly store: FdeStore) {
    this.item = vscode.window.createStatusBarItem('fde.status', vscode.StatusBarAlignment.Left, 50);
    this.item.name = 'FDE';
    this.item.command = 'fde.progress.focus';
    this.unsubscribe = store.onDidChange.on(() => this.update());
    this.update();
  }

  update(): void {
    const worktree = this.store.currentWorktree();
    if (!worktree) {
      this.item.hide();
      return;
    }
    const parts = [`$(git-branch) ${worktree.branch ?? 'detached'}`];
    const active = this.store.activeSessionCount();
    parts.push(active ? `$(pulse) ${active}` : '$(comment-discussion) 0');
    const phase = this.store.currentPhase();
    if (phase) parts.push(`$(milestone) ${phase.title}`);
    if (worktree.pr) parts.push(`$(git-pull-request) #${worktree.pr.number}`);
    this.item.text = parts.join('  ');
    this.item.tooltip = `FDE · ${worktree.path}\n${active} active Claude Code session${active === 1 ? '' : 's'}${phase ? `\nPhase: ${phase.title}` : ''}`;
    this.item.show();
  }

  dispose(): void {
    this.unsubscribe();
    this.item.dispose();
  }
}
