import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Session } from '../model';
import { exists, isWithin, readHead, readTail } from '../util/fs';
import { candidateSlugs } from './slug';
import { parseTranscriptHead, parseTranscriptTail } from './transcript';

export interface SessionScanOptions {
  claudeHome: string;
  maxAgeDays: number;
  activeWindowSeconds: number;
  now?: () => number;
  chunkBytes?: number;
}

export function projectsDir(claudeHome: string): string {
  return path.join(claudeHome, 'projects');
}

/** Directories that may hold transcripts for a worktree. Only existing ones are returned. */
export async function sessionDirsFor(claudeHome: string, worktreePath: string): Promise<string[]> {
  const dirs: string[] = [];
  for (const slug of candidateSlugs(worktreePath)) {
    const dir = path.join(projectsDir(claudeHome), slug);
    if (await exists(dir)) dirs.push(dir);
  }
  return dirs;
}

export async function readSession(
  file: string,
  worktreePath: string,
  opts: SessionScanOptions,
): Promise<Session | undefined> {
  const now = opts.now?.() ?? Date.now();
  const chunk = opts.chunkBytes ?? 64 * 1024;
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(file);
  } catch {
    return undefined;
  }
  if (stat.size === 0) return undefined;
  if (now - stat.mtimeMs > opts.maxAgeDays * 86_400_000) return undefined;

  const head = parseTranscriptHead(await readHead(file, chunk));
  if (head.cwd && !isWithin(head.cwd, worktreePath)) return undefined;

  const tailChunk = await readTail(file, chunk);
  const tail = parseTranscriptTail(tailChunk.text, tailChunk.truncated);

  const startedAt = head.firstTimestamp ? new Date(head.firstTimestamp) : stat.birthtime;
  const lastActivityAt = new Date(stat.mtimeMs);

  return {
    id: head.sessionId ?? path.basename(file, '.jsonl'),
    cwd: head.cwd ?? worktreePath,
    worktreePath,
    gitBranch: head.gitBranch,
    title: head.title ?? '(no prompt yet)',
    version: head.version,
    startedAt: Number.isNaN(startedAt.getTime()) ? lastActivityAt : startedAt,
    lastActivityAt,
    active: now - stat.mtimeMs <= opts.activeWindowSeconds * 1000,
    transcriptPath: file,
    tasks: tail.tasks,
    origin: 'local',
  };
}

export async function scanSessions(worktreePaths: string[], opts: SessionScanOptions): Promise<Session[]> {
  const sessions: Session[] = [];
  const seen = new Set<string>();
  for (const worktreePath of worktreePaths) {
    for (const dir of await sessionDirsFor(opts.claudeHome, worktreePath)) {
      let entries: string[];
      try {
        entries = await fs.promises.readdir(dir);
      } catch {
        continue;
      }
      for (const name of entries) {
        if (!name.endsWith('.jsonl')) continue;
        const file = path.join(dir, name);
        if (seen.has(file)) continue;
        seen.add(file);
        const session = await readSession(file, worktreePath, opts);
        if (session) sessions.push(session);
      }
    }
  }
  sessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  return sessions;
}
