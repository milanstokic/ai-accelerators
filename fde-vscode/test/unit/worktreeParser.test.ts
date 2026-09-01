import { describe, expect, it } from 'vitest';
import { parseWorktreeList } from '../../src/git/worktreeParser';
import { fixture } from './helpers';

describe('parseWorktreeList', () => {
  it('parses main, linked, detached, prunable and bare entries', () => {
    const list = parseWorktreeList(fixture('worktree-list', 'basic.txt'));
    expect(list).toHaveLength(5);
    expect(list[0]).toMatchObject({ path: '/home/dev/proj', branch: 'main', head: '1'.repeat(40), detached: false, bare: false });
    expect(list[1]).toMatchObject({ path: '/home/dev/proj-feat-search', branch: 'feat/search' });
    expect(list[2]).toMatchObject({ branch: null, detached: true, locked: 'working on prod incident' });
    expect(list[3]?.prunable).toContain('non-existent');
    expect(list[4]).toMatchObject({ path: '/home/dev/proj.git', bare: true });
  });

  it('handles CRLF, a bare `locked` flag and missing trailing blank line', () => {
    const list = parseWorktreeList('worktree C:/x\r\nHEAD abc\r\nbranch refs/heads/a\r\nlocked\r\n');
    expect(list).toEqual([{ path: 'C:/x', head: 'abc', branch: 'a', detached: false, bare: false, locked: true }]);
  });

  it('returns an empty list for empty output', () => {
    expect(parseWorktreeList('')).toEqual([]);
  });
});
