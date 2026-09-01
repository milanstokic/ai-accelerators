import * as path from 'node:path';
import * as vscode from 'vscode';
import type { Session, Worktree } from '../model';

const PREFIX = 'FDE: ';

export interface TerminalTarget {
  path: string;
  branch: string | null;
}

/** One reusable terminal per worktree, used to launch and resume Claude Code. */
export class TerminalManager implements vscode.Disposable {
  private lastUsed: vscode.Terminal | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly claudeCommand: () => string) {
    this.disposables.push(
      vscode.window.onDidCloseTerminal((t) => {
        if (t === this.lastUsed) this.lastUsed = undefined;
      }),
    );
  }

  private nameFor(target: TerminalTarget): string {
    return `${PREFIX}${target.branch ?? path.basename(target.path)}`;
  }

  terminalFor(target: TerminalTarget): vscode.Terminal {
    const name = this.nameFor(target);
    const existing = vscode.window.terminals.find((t) => t.name === name && t.exitStatus === undefined);
    const terminal = existing ?? vscode.window.createTerminal({ name, cwd: target.path, iconPath: new vscode.ThemeIcon('sparkle') });
    this.lastUsed = terminal;
    return terminal;
  }

  startSession(target: TerminalTarget): void {
    const terminal = this.terminalFor(target);
    terminal.show();
    terminal.sendText(this.claudeCommand(), true);
  }

  resumeSession(session: Session, worktree: Worktree | undefined): void {
    const target: TerminalTarget = worktree ?? { path: session.worktreePath, branch: session.gitBranch ?? null };
    const terminal = this.terminalFor(target);
    terminal.show();
    terminal.sendText(`${this.claudeCommand()} --resume ${session.id}`, true);
  }

  /** Send `/<skill>` to the active FDE terminal, or start Claude Code in `fallback` first. */
  runSkill(skillName: string, fallback: TerminalTarget | undefined): void {
    const active = vscode.window.activeTerminal;
    const target =
      (active && active.name.startsWith(PREFIX) && active.exitStatus === undefined ? active : undefined) ??
      (this.lastUsed && this.lastUsed.exitStatus === undefined ? this.lastUsed : undefined);
    if (target) {
      target.show();
      target.sendText(`/${skillName}`, true);
      return;
    }
    if (!fallback) {
      void vscode.window.showWarningMessage('FDE: open a Claude Code session first, then run the skill.');
      return;
    }
    const terminal = this.terminalFor(fallback);
    terminal.show();
    terminal.sendText(this.claudeCommand(), true);
    // Give the CLI a moment to start before the slash command arrives.
    setTimeout(() => terminal.sendText(`/${skillName}`, true), 2500);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}
