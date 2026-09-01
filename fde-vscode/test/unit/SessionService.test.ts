import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scanSessions, sessionDirsFor } from '../../src/sessions/SessionService';
import { projectSlug } from '../../src/sessions/slug';
import { FIXTURES, tmpdir, write } from './helpers';

let home: string;
let worktree: string;

beforeEach(() => {
  home = tmpdir('fde-home-');
  worktree = '/home/dev/proj-feat-search';
});
afterEach(() => fs.rmSync(home, { recursive: true, force: true }));

function seed(file: string, fixtureName: string, mtimeMs: number): string {
  const target = path.join(home, 'projects', projectSlug(worktree), file);
  write(target, fs.readFileSync(path.join(FIXTURES, 'transcripts', fixtureName), 'utf8'));
  fs.utimesSync(target, mtimeMs / 1000, mtimeMs / 1000);
  return target;
}

describe('scanSessions', () => {
  it('finds transcripts for a worktree, marks recent ones active, and sorts by activity', async () => {
    const now = Date.parse('2026-09-01T12:00:00Z');
    seed('recent.jsonl', 'basic.jsonl', now - 30_000);
    seed('older.jsonl', 'basic.jsonl', now - 3_600_000);
    const sessions = await scanSessions([worktree], { claudeHome: home, maxAgeDays: 30, activeWindowSeconds: 120, now: () => now });
    expect(sessions.map((s) => [path.basename(s.transcriptPath), s.active])).toEqual([
      ['recent.jsonl', true],
      ['older.jsonl', false],
    ]);
    expect(sessions[0]).toMatchObject({
      id: 'aaaaaaaa-0000-0000-0000-000000000001',
      title: 'Add a search endpoint',
      gitBranch: 'feat/search',
      worktreePath: worktree,
      cwd: worktree,
    });
    expect(sessions[0]?.tasks).toHaveLength(3);
    expect(sessions[0]?.startedAt.toISOString()).toBe('2026-09-01T10:00:00.000Z');
  });

  it('skips transcripts older than maxAgeDays and empty files', async () => {
    const now = Date.parse('2026-09-01T12:00:00Z');
    seed('old.jsonl', 'basic.jsonl', now - 40 * 86_400_000);
    write(path.join(home, 'projects', projectSlug(worktree), 'empty.jsonl'), '');
    expect(await scanSessions([worktree], { claudeHome: home, maxAgeDays: 30, activeWindowSeconds: 120, now: () => now })).toEqual([]);
  });

  it('skips a transcript whose recorded cwd is a different directory (slug collision)', async () => {
    // basic.jsonl records cwd /home/dev/proj-feat-search; scan it as if it lived under a colliding slug.
    worktree = '/home/dev/proj-feat.search';
    const now = Date.parse('2026-09-01T12:00:00Z');
    seed('collide.jsonl', 'basic.jsonl', now);
    expect(await scanSessions([worktree], { claudeHome: home, maxAgeDays: 30, activeWindowSeconds: 120, now: () => now })).toEqual([]);
  });

  it('returns nothing when the projects directory does not exist', async () => {
    expect(await sessionDirsFor(home, worktree)).toEqual([]);
    expect(await scanSessions([worktree], { claudeHome: home, maxAgeDays: 30, activeWindowSeconds: 120 })).toEqual([]);
  });

  it('falls back to the head/tail chunk size without breaking on large files', async () => {
    const now = Date.now();
    const file = seed('big.jsonl', 'basic.jsonl', now);
    const filler = `${JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'x'.repeat(2000) }] }, timestamp: '2026-09-01T10:30:00.000Z' })}\n`;
    fs.appendFileSync(file, filler.repeat(200));
    const [session] = await scanSessions([worktree], { claudeHome: home, maxAgeDays: 30, activeWindowSeconds: 120, chunkBytes: 4096 });
    expect(session?.title).toBe('Add a search endpoint');
    expect(session?.tasks).toEqual([]); // TodoWrite is outside the tail chunk
  });
});
