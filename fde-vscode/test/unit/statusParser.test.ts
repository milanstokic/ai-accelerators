import { describe, expect, it } from 'vitest';
import { parseStatusV2 } from '../../src/git/statusParser';
import { fixture } from './helpers';

describe('parseStatusV2', () => {
  it('reads branch, upstream, ahead/behind and counts changed entries', () => {
    const s = parseStatusV2(fixture('status', 'dirty.txt'));
    expect(s).toMatchObject({ head: 'feat/search', upstream: 'origin/feat/search', ahead: 3, behind: 1, dirty: true });
    // 1, 1, 2, u, ? entries count; ! (ignored) does not.
    expect(s.changedFiles).toBe(5);
  });

  it('reports a clean tree', () => {
    expect(parseStatusV2(fixture('status', 'clean.txt'))).toMatchObject({ dirty: false, changedFiles: 0, ahead: 0, behind: 0 });
  });

  it('treats (detached) as no head', () => {
    expect(parseStatusV2(fixture('status', 'detached.txt')).head).toBeUndefined();
  });
});
