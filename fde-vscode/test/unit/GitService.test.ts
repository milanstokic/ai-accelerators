import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GitService, suggestWorktreePath } from '../../src/git/GitService';
import { tmpdir } from './helpers';

function sh(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8' }).trim();
}

let root: string;
let repo: string;
let feat: string;
const git = new GitService();

beforeAll(() => {
  root = tmpdir('fde-git-');
  repo = path.join(root, 'repo');
  fs.mkdirSync(repo);
  sh(repo, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(repo, 'README.md'), 'hi\n');
  sh(repo, 'add', '.');
  sh(repo, 'commit', '-q', '-m', 'init');
  sh(repo, 'branch', 'feat/search');
  feat = path.join(root, 'repo-feat-search');
  sh(repo, 'worktree', 'add', '-q', feat, 'feat/search');
  fs.writeFileSync(path.join(feat, 'search.ts'), 'export {}\n');
  sh(feat, 'add', '.');
  sh(feat, 'commit', '-q', '-m', 'feat: search');
  fs.writeFileSync(path.join(feat, 'dirty.txt'), 'x\n');
});
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('GitService against a real repository', () => {
  it('resolves the repo root from a subdirectory', async () => {
    fs.mkdirSync(path.join(repo, 'sub'), { recursive: true });
    expect(fs.realpathSync(await git.repoRoot(path.join(repo, 'sub')) as string)).toBe(fs.realpathSync(repo));
    expect(await git.repoRoot(root)).toBeUndefined();
  });

  it('lists worktrees with status, marks current and main, and finds the default branch', async () => {
    const list = await git.listWorktrees(repo, feat);
    expect(list).toHaveLength(2);
    const [main, wt] = list;
    expect(main).toMatchObject({ branch: 'main', isMain: true, isCurrent: false, dirty: false, lastCommit: 'init' });
    expect(wt).toMatchObject({ branch: 'feat/search', isMain: false, isCurrent: true, dirty: true, changedFiles: 1, lastCommit: 'feat: search' });
    expect(await git.defaultBranch(repo)).toBe('main');
  });

  it('lists commits since the base branch and local branches', async () => {
    expect(await git.commitsSince(feat, 'main')).toMatchObject([{ subject: 'feat: search' }]);
    expect(await git.commitsSince(repo, 'main')).toEqual([]);
    expect(await git.commitsSince(feat, 'does-not-exist')).toEqual([]);
    expect(await git.localBranches(repo)).toEqual(['feat/search', 'main']);
  });

  it('adds and removes a worktree', async () => {
    const target = suggestWorktreePath(repo, '..', 'fix/login');
    expect(target).toBe(path.join(root, 'repo-fix-login'));
    await git.addWorktree(repo, target, 'fix/login', true);
    expect((await git.listWorktrees(repo, repo)).map((w) => w.branch)).toContain('fix/login');
    await git.removeWorktree(repo, target, false);
    expect((await git.listWorktrees(repo, repo)).map((w) => w.branch)).not.toContain('fix/login');
  });

  it('describes errors from git', async () => {
    await expect(git.removeWorktree(repo, '/nonexistent/wt', false)).rejects.toThrow(/worktree remove/);
  });
});
