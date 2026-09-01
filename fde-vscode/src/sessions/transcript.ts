import type { Task, TaskStatus } from '../model';

export interface TranscriptHead {
  sessionId?: string;
  cwd?: string;
  gitBranch?: string;
  version?: string;
  firstTimestamp?: string;
  title?: string;
}

export interface TranscriptTail {
  lastTimestamp?: string;
  tasks: Task[];
}

type Json = Record<string, unknown>;

function parseLines(text: string, dropFirst: boolean): Json[] {
  const lines = text.split('\n');
  if (dropFirst) lines.shift();
  const out: Json[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || !trimmed.startsWith('{')) continue;
    try {
      const value = JSON.parse(trimmed);
      if (value && typeof value === 'object') out.push(value as Json);
    } catch {
      // partial or corrupt line; skip
    }
  }
  return out;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v !== '' ? v : undefined;
}

/** Flatten a Claude message `content` field to plain text. */
export function textOfContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (block && typeof block === 'object' && (block as Json).type === 'text') return str((block as Json).text) ?? '';
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

export function makeTitle(text: string, max = 80): string | undefined {
  const firstLine = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l !== '' && !l.startsWith('<'));
  if (!firstLine) return undefined;
  return firstLine.length > max ? `${firstLine.slice(0, max - 1)}…` : firstLine;
}

export function parseTranscriptHead(text: string): TranscriptHead {
  const head: TranscriptHead = {};
  for (const entry of parseLines(text, false)) {
    head.sessionId ??= str(entry.sessionId);
    head.cwd ??= str(entry.cwd);
    head.gitBranch ??= str(entry.gitBranch);
    head.version ??= str(entry.version);
    head.firstTimestamp ??= str(entry.timestamp);

    if (!head.title && entry.type === 'user' && !entry.isMeta) {
      const message = entry.message as Json | undefined;
      if (message && message.role === 'user') {
        const title = makeTitle(textOfContent(message.content));
        if (title) head.title = title;
      }
    }
    if (head.sessionId && head.cwd && head.title && head.firstTimestamp) break;
  }
  return head;
}

const TASK_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed'];

function toStatus(v: unknown): TaskStatus {
  return TASK_STATUSES.includes(v as TaskStatus) ? (v as TaskStatus) : 'pending';
}

export function parseTranscriptTail(text: string, truncated: boolean): TranscriptTail {
  const tail: TranscriptTail = { tasks: [] };
  let created: Task[] = [];
  let todo: Task[] | undefined;

  for (const entry of parseLines(text, truncated)) {
    const ts = str(entry.timestamp);
    if (ts) tail.lastTimestamp = ts;

    if (entry.type !== 'assistant') continue;
    const message = entry.message as Json | undefined;
    if (!message || !Array.isArray(message.content)) continue;

    for (const block of message.content as Json[]) {
      if (!block || block.type !== 'tool_use') continue;
      const input = (block.input ?? {}) as Json;
      switch (block.name) {
        case 'TodoWrite': {
          if (Array.isArray(input.todos)) {
            todo = (input.todos as Json[]).map((t) => ({
              content: str(t.content) ?? str(t.activeForm) ?? '',
              status: toStatus(t.status),
            }));
          }
          break;
        }
        case 'TaskCreate': {
          created.push({
            id: String(created.length + 1),
            content: str(input.subject) ?? str(input.description) ?? '',
            status: toStatus(input.status),
          });
          break;
        }
        case 'TaskUpdate': {
          const id = str(input.taskId) ?? (typeof input.taskId === 'number' ? String(input.taskId) : undefined);
          const task = created.find((t) => t.id === id);
          if (task && input.status !== undefined) task.status = toStatus(input.status);
          if (task && str(input.subject)) task.content = str(input.subject) as string;
          break;
        }
        default:
          break;
      }
    }
  }
  created = created.filter((t) => t.content !== '');
  tail.tasks = todo && todo.length > 0 ? todo : created;
  return tail;
}
