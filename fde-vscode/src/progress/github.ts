import type { PullRequestRef } from '../model';

export interface RepoRef {
  owner: string;
  repo: string;
}

export function parseRemote(url: string): RepoRef | undefined {
  const m =
    /^(?:https?:\/\/|git@|ssh:\/\/git@)?(?:www\.)?github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/i.exec(url.trim());
  if (!m) return undefined;
  return { owner: m[1] as string, repo: m[2] as string };
}

type Fetch = typeof fetch;

async function getJson<T>(f: Fetch, token: string, url: string): Promise<T | undefined> {
  const res = await f(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'fde-vscode' },
  });
  if (!res.ok) return undefined;
  return (await res.json()) as T;
}

interface ApiPull {
  number: number;
  html_url: string;
  title: string;
  state: 'open' | 'closed';
  draft: boolean;
  merged_at: string | null;
  head: { sha: string };
}

interface ApiCheckRuns {
  check_runs: Array<{ status: string; conclusion: string | null }>;
}

export function rollupChecks(runs: ApiCheckRuns['check_runs']): PullRequestRef['checks'] {
  if (runs.length === 0) return 'none';
  if (runs.some((r) => r.status !== 'completed')) return 'pending';
  if (runs.some((r) => r.conclusion === 'failure' || r.conclusion === 'timed_out' || r.conclusion === 'cancelled')) return 'failure';
  return 'success';
}

export async function fetchPullRequest(
  token: string,
  ref: RepoRef,
  branch: string,
  f: Fetch = fetch,
): Promise<PullRequestRef | undefined> {
  const base = `https://api.github.com/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`;
  const head = encodeURIComponent(`${ref.owner}:${branch}`);
  const pulls = await getJson<ApiPull[]>(f, token, `${base}/pulls?state=all&per_page=1&sort=updated&direction=desc&head=${head}`);
  const pr = pulls?.[0];
  if (!pr) return undefined;
  const checks = await getJson<ApiCheckRuns>(f, token, `${base}/commits/${pr.head.sha}/check-runs?per_page=50`);
  return {
    number: pr.number,
    url: pr.html_url,
    title: pr.title,
    state: pr.merged_at ? 'merged' : pr.state,
    draft: pr.draft,
    checks: checks ? rollupChecks(checks.check_runs) : 'none',
  };
}
