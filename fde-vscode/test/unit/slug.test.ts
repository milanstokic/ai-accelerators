import { describe, expect, it } from 'vitest';
import { candidateSlugs, legacyProjectSlug, projectSlug } from '../../src/sessions/slug';

describe('projectSlug', () => {
  it('matches the directory Claude Code creates for a plain path', () => {
    expect(projectSlug('/home/user/ai-accelerators')).toBe('-home-user-ai-accelerators');
  });
  it('replaces dots, spaces and other punctuation', () => {
    expect(projectSlug('/Users/me/my.project v2')).toBe('-Users-me-my-project-v2');
    expect(legacyProjectSlug('/Users/me/my.project v2')).toBe('-Users-me-my.project v2');
  });
  it('offers both spellings as candidates, deduplicated', () => {
    expect(candidateSlugs('/a/b')).toEqual(['-a-b']);
    expect(candidateSlugs('/a/b.c')).toEqual(['-a-b-c', '-a-b.c']);
  });
});
