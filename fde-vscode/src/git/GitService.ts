import * as path from 'node:path';
import type { Commit, Worktree } from '../model';
import { ExecError, runGit, type GitRunner } from '../util/exec';
import { samePath } from '../util/fs';
import { parseStatusV2 } from './statusParser';
import { parseWorktreeList } from './worktreeParser';

export class GitService {
  constructor(private readonly git: GitRunner = runGit) {}

  async repoRoot(cwd: string): Promise<string | undefined> {
    try {
      return await this.git(['rev-parse', '--show-toplevel'], cwd);
    } catch {
      return undefined;
    }
  }

  async listWorktrees(repoRoot: string, currentPath: string): Promise<Worktree[]> {
    const raw = parseWorktreeList(await this.git(['worktree', 'list', '--porcelain'], repoRoot));
    const worktrees: Worktree[] = [];
    for (const [index, wt] of raw.entries()) {
      if (wt.bare) continue;
      const base: Worktree = {
        path: wt.path,
        branch: wt.branch,
        head: wt.head,
        isMain: index === 0,
        isCurrent: samePath(wt.path, currentPath),
        dirty: false,
        changedFiles: 0,
        ahead: 0,
        behind: 0,
        locked: wt.locked,
        prunable: wt.prunable,
      };
      if (!wt.prunable) {
        try {
          const status = parseStatusV2(await this.git(['status', '--porcelain=v2', '--branch'], wt.path));
          base.dirty = status.dirty;
          base.changedFiles = status.changedFiles;
          base.ahead = status.ahead;
          base.behind = status.behind;
          base.upstream = status.upstream;
          base.lastCommit = await this.git(['log', '-1', '--format=%s'], wt.path).catch(() => undefined);
        } catch {
          // A worktree whose directory vanished: keep the entry, flag it.
          base.prunable = base.prunable ?? 'unreachable';
        }
      }
      worktrees.push(base);
    }
    return worktrees;
  }

  async defaultBranch(repoRoot: string): Promise<string> {
    try {
      const ref = await this.git(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], repoRoot);
      return ref.replace(/^origin\//, '');
    } catch {
      for (const candidate of ['main', 'master', 'trunk', 'develop']) {
        try {
          await this.git(['rev-parse', '--verify', '--quiet', `refs/heads/${candidate}`], repoRoot);
          return candidate;
        } catch {
          // try next
        }
      }
      return 'main';
    }
  }

  /** Commits reachable from HEAD in `cwd` but not from the base branch. */
  async commitsSince(cwd: string, base: string): Promise<Commit[]> {
    for (const ref of [`origin/${base}`, base]) {
      try {
        const out = await this.git(['log', '--format=%h%x09%s', `${ref}..HEAD`], cwd);
        if (out === '') return [];
        return out.split('\n').map((line) => {
          const tab = line.indexOf('\t');
          return { sha: line.slice(0, tab), subject: line.slice(tab + 1) };
        });
      } catch {
        // ref does not exist; try the next one
      }
    }
    return [];
  }

  async localBranches(repoRoot: string): Promise<string[]> {
    const out = await this.git(['for-each-ref', '--format=%(refname:short)', 'refs/heads'], repoRoot);
    return out === '' ? [] : out.split('\n');
  }

  async remoteUrl(repoRoot: string, remote = 'origin'): Promise<string | undefined> {
    try {
      return await this.git(['remote', 'get-url', remote], repoRoot);
    } catch {
      return undefined;
    }
  }

  async addWorktree(repoRoot: string, worktreePath: string, branch: string, createBranch: boolean): Promise<void> {
    const args = ['worktree', 'add'];
    if (createBranch) args.push('-b', branch, worktreePath);
    else args.push(worktreePath, branch);
    await this.git(args, repoRoot);
  }

  async removeWorktree(repoRoot: string, worktreePath: string, force: boolean): Promise<void> {
    const args = ['worktree', 'remove'];
    if (force) args.push('--force');
    args.push(worktreePath);
    await this.git(args, repoRoot);
  }

  static describeError(err: unknown): string {
    if (err instanceof ExecError) return err.message;
    if (err instanceof Error) return err.message;
    return String(err);
  }
}

export function suggestWorktreePath(mainWorktree: string, parentDir: string, branch: string): string {
  const repoName = path.basename(mainWorktree);
  const safe = branch.replace(/[^A-Za-z0-9._-]+/g, '-');
  return path.resolve(mainWorktree, parentDir, `${repoName}-${safe}`);
}
