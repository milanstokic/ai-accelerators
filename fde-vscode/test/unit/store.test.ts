import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GitService } from '../../src/git/GitService';
import { projectSlug } from '../../src/sessions/slug';
import { EXAMPLE_WORKFLOW, WORKFLOW_FILE } from '../../src/skills/WorkflowService';
import { FdeStore, type PhaseState } from '../../src/store';
import { tmpdir, write } from './helpers';

function sh(cwd: string, ...args: string[]): string {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8' }).trim();
}

let root: string;
let repo: string;
let feat: string;
let home: string;
let saved: PhaseState = { checks: {} };
const logs: string[] = [];

function makeStore(workspaceRoot: string, githubEnabled = false, fetchPr?: FdeStore['state']['worktrees'][number]['pr']) {
  return new FdeStore({
    git: new GitService(),
    workspaceRoot,
    getConfig: () => ({ claudeHome: home, maxAgeDays: 30, activeWindowSeconds: 120, includeUserSkills: true, githubEnabled }),
    log: (m) => logs.push(m),
    loadPhaseState: () => saved,
    savePhaseState: (s) => {
      saved = s;
    },
    fetchPullRequest: fetchPr ? async () => fetchPr : undefined,
  });
}

beforeAll(() => {
  root = tmpdir('fde-store-');
  repo = path.join(root, 'repo');
  feat = path.join(root, 'repo-feat');
  home = path.join(root, 'home');
  fs.mkdirSync(repo);
  sh(repo, 'init', '-q', '-b', 'main');
  write(path.join(repo, 'README.md'), 'x\n');
  write(path.join(repo, WORKFLOW_FILE), EXAMPLE_WORKFLOW);
  write(path.join(repo, '.claude/skills/scaffold/SKILL.md'), '---\nname: scaffold\ndescription: s\n---\n');
  sh(repo, 'add', '.');
  sh(repo, 'commit', '-q', '-m', 'init');
  sh(repo, 'worktree', 'add', '-q', '-b', 'feat/x', feat);
  write(path.join(feat, 'a.txt'), 'a\n');
  sh(feat, 'add', '.');
  sh(feat, 'commit', '-q', '-m', 'feat: a');

  const transcript = (id: string, cwd: string, branch: string, prompt: string) =>
    `${JSON.stringify({ type: 'user', message: { role: 'user', content: prompt }, timestamp: '2026-09-01T10:00:00.000Z', cwd, sessionId: id, gitBranch: branch, version: '2.1.257' })}\n`;
  write(path.join(home, 'projects', projectSlug(feat), 's1.jsonl'), transcript('s1', feat, 'feat/x', 'Build the thing'));
  write(path.join(home, 'projects', projectSlug(repo), 's2.jsonl'), transcript('s2', repo, 'main', 'Kickoff'));
  write(path.join(home, 'skills/deploy/SKILL.md'), '---\nname: deploy\n---\n');
});
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('FdeStore', () => {
  it('joins worktrees, sessions, skills, workflow and commits', async () => {
    const store = makeStore(feat);
    let changes = 0;
    store.onDidChange.on(() => changes++);
    await store.refreshAll();

    expect(store.state.repoRoot && fs.realpathSync(store.state.repoRoot)).toBe(fs.realpathSync(feat));
    expect(store.state.worktrees.map((w) => w.branch)).toEqual(['main', 'feat/x']);
    expect(store.currentWorktree()?.branch).toBe('feat/x');
    expect(store.state.defaultBranch).toBe('main');
    expect(store.state.commits.get(feat)?.map((c) => c.subject)).toEqual(['feat: a']);
    expect(store.state.commits.get(repo)).toEqual([]);

    expect(store.state.sessions.map((s) => s.id).sort()).toEqual(['s1', 's2']);
    expect(store.sessionsFor(feat).map((s) => s.title)).toEqual(['Build the thing']);
    expect(store.sessionsFor(repo).map((s) => s.title)).toEqual(['Kickoff']);
    expect(store.worktreeForPath(path.join(feat, 'src'))?.branch).toBe('feat/x');

    expect(store.state.skills.map((s) => s.name)).toEqual(['deploy', 'scaffold']);
    expect(store.state.workflow?.name).toBe('client-engagement');
    expect(store.currentPhase()?.id).toBe('discover');
    expect(changes).toBeGreaterThan(0);
    expect(store.state.lastError).toBeUndefined();
  });

  it('persists phase and per-branch checklist state', async () => {
    const store = makeStore(feat);
    await store.refreshGit();
    await store.setPhase('build');
    await store.setChecked('build', 1, true);
    expect(store.isChecked('build', 1)).toBe(true);
    expect(store.isChecked('build', 0)).toBe(false);
    expect(saved).toEqual({ phase: 'build', checks: { 'feat/x|build|1': true } });

    const other = makeStore(repo);
    await Promise.all([other.refreshGit(), other.refreshWorkflow()]);
    expect(other.currentPhase()?.id).toBe('build');
    expect(other.isChecked('build', 1)).toBe(false); // different branch
    await store.setChecked('build', 1, false);
    expect(saved.checks).toEqual({});
  });

  it('attaches PR data when GitHub is enabled and keeps it across git refreshes', async () => {
    const pr = { number: 3, url: 'https://github.com/a/b/pull/3', title: 't', state: 'open' as const, draft: false, checks: 'success' as const };
    const store = makeStore(feat, true, pr);
    await store.refreshGit();
    expect(store.currentWorktree()?.pr).toEqual(pr);
    const off = makeStore(feat, false, pr);
    await off.refreshGit();
    expect(off.currentWorktree()?.pr).toBeUndefined();
  });

  it('serialises overlapping refreshes and reports errors without throwing', async () => {
    const store = makeStore(path.join(root, 'not-a-repo'));
    fs.mkdirSync(path.join(root, 'not-a-repo'), { recursive: true });
    await Promise.all([store.refreshGit(), store.refreshGit(), store.refreshAll()]);
    expect(store.state.repoRoot).toBeUndefined();
    expect(store.state.worktrees).toEqual([]);
    expect(store.state.workflow).toBeUndefined();
  });
});
