import { describe, expect, it } from 'vitest';
import { fetchPullRequest, parseRemote, rollupChecks } from '../../src/progress/github';

describe('parseRemote', () => {
  it.each([
    ['https://github.com/acme/widgets.git', { owner: 'acme', repo: 'widgets' }],
    ['git@github.com:acme/widgets.git', { owner: 'acme', repo: 'widgets' }],
    ['ssh://git@github.com/acme/widgets', { owner: 'acme', repo: 'widgets' }],
    ['https://gitlab.com/acme/widgets.git', undefined],
  ])('%s', (url, expected) => {
    expect(parseRemote(url)).toEqual(expected);
  });
});

describe('rollupChecks', () => {
  it('summarises check runs', () => {
    expect(rollupChecks([])).toBe('none');
    expect(rollupChecks([{ status: 'in_progress', conclusion: null }])).toBe('pending');
    expect(rollupChecks([{ status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'failure' }])).toBe('failure');
    expect(rollupChecks([{ status: 'completed', conclusion: 'success' }])).toBe('success');
  });
});

describe('fetchPullRequest', () => {
  it('finds the PR for a branch and its check rollup', async () => {
    const calls: string[] = [];
    const fake = (async (url: string | URL | Request) => {
      calls.push(String(url));
      const body = String(url).includes('/pulls?')
        ? [{ number: 7, html_url: 'https://github.com/acme/widgets/pull/7', title: 'Search', state: 'open', draft: false, merged_at: null, head: { sha: 'abc' } }]
        : { check_runs: [{ status: 'completed', conclusion: 'success' }] };
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch;
    const pr = await fetchPullRequest('tok', { owner: 'acme', repo: 'widgets' }, 'feat/search', fake);
    expect(pr).toEqual({ number: 7, url: 'https://github.com/acme/widgets/pull/7', title: 'Search', state: 'open', draft: false, checks: 'success' });
    expect(calls[0]).toContain('head=acme%3Afeat%2Fsearch');
    expect(calls[1]).toContain('/commits/abc/check-runs');
  });

  it('returns undefined when there is no PR or the API fails', async () => {
    const none = (async () => new Response('[]', { status: 200 })) as typeof fetch;
    const fail = (async () => new Response('nope', { status: 401 })) as typeof fetch;
    expect(await fetchPullRequest('t', { owner: 'a', repo: 'b' }, 'x', none)).toBeUndefined();
    expect(await fetchPullRequest('t', { owner: 'a', repo: 'b' }, 'x', fail)).toBeUndefined();
  });
});
