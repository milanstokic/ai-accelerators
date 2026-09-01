import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FdeEvent } from '../model';

export function fdeDir(claudeHome: string): string {
  return path.join(claudeHome, 'fde');
}

export function eventsFile(claudeHome: string): string {
  return path.join(fdeDir(claudeHome), 'events.jsonl');
}

export function parseEventLines(text: string): FdeEvent[] {
  const out: FdeEvent[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t === '') continue;
    try {
      const v = JSON.parse(t) as Record<string, unknown>;
      if (v && typeof v.event === 'string') {
        out.push({
          ts: typeof v.ts === 'string' ? v.ts : new Date(0).toISOString(),
          event: v.event,
          sessionId: typeof v.sessionId === 'string' ? v.sessionId : undefined,
          cwd: typeof v.cwd === 'string' ? v.cwd : undefined,
          gitBranch: typeof v.gitBranch === 'string' ? v.gitBranch : undefined,
          summary: typeof v.summary === 'string' ? v.summary : undefined,
        });
      }
    } catch {
      // partial line
    }
  }
  return out;
}

/** Tails an append-only JSONL file, returning only events appended since the last poll. */
export class EventsTail {
  private offset: number | undefined;

  constructor(private readonly file: string) {}

  /** First poll seeds the offset at the end of the file so old events are not replayed. */
  async poll(): Promise<FdeEvent[]> {
    let size: number;
    try {
      size = (await fs.promises.stat(this.file)).size;
    } catch {
      this.offset = 0;
      return [];
    }
    if (this.offset === undefined) {
      this.offset = size;
      return [];
    }
    if (size < this.offset) this.offset = 0; // truncated or rotated
    if (size === this.offset) return [];

    const handle = await fs.promises.open(this.file, 'r');
    try {
      const len = size - this.offset;
      const buf = Buffer.alloc(len);
      const { bytesRead } = await handle.read(buf, 0, len, this.offset);
      const text = buf.subarray(0, bytesRead).toString('utf8');
      // Only consume complete lines; keep a trailing partial line for the next poll.
      const lastNewline = text.lastIndexOf('\n');
      if (lastNewline === -1) return [];
      this.offset += Buffer.byteLength(text.slice(0, lastNewline + 1), 'utf8');
      return parseEventLines(text.slice(0, lastNewline + 1));
    } finally {
      await handle.close();
    }
  }
}
