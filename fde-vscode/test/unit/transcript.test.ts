import { describe, expect, it } from 'vitest';
import { makeTitle, parseTranscriptHead, parseTranscriptTail, textOfContent } from '../../src/sessions/transcript';
import { fixture } from './helpers';

describe('parseTranscriptHead', () => {
  it('extracts identity fields and the first human prompt as title', () => {
    const head = parseTranscriptHead(fixture('transcripts', 'basic.jsonl'));
    expect(head).toEqual({
      sessionId: 'aaaaaaaa-0000-0000-0000-000000000001',
      cwd: '/home/dev/proj-feat-search',
      gitBranch: 'feat/search',
      version: '2.1.257',
      firstTimestamp: '2026-09-01T10:00:00.000Z',
      title: 'Add a search endpoint',
    });
  });

  it('skips meta/system prompts and reads array content', () => {
    const head = parseTranscriptHead(fixture('transcripts', 'tasks.jsonl'));
    expect(head.title).toBe('Fix the login bug');
    expect(head.sessionId).toBe('bbbbbbbb-0000-0000-0000-000000000002');
  });

  it('tolerates a truncated last line', () => {
    const text = fixture('transcripts', 'basic.jsonl').slice(0, 400);
    expect(() => parseTranscriptHead(text)).not.toThrow();
  });
});

describe('parseTranscriptTail', () => {
  it('returns the last timestamp and the latest TodoWrite list', () => {
    const tail = parseTranscriptTail(fixture('transcripts', 'basic.jsonl'), false);
    expect(tail.lastTimestamp).toBe('2026-09-01T10:12:00.000Z');
    expect(tail.tasks).toEqual([
      { content: 'Add route', status: 'completed' },
      { content: 'Write tests', status: 'in_progress' },
      { content: 'Update docs', status: 'pending' },
    ]);
  });

  it('reconstructs TaskCreate/TaskUpdate state and ignores junk lines', () => {
    const tail = parseTranscriptTail(fixture('transcripts', 'tasks.jsonl'), false);
    expect(tail.tasks).toEqual([
      { id: '1', content: 'Reproduce the bug', status: 'completed' },
      { id: '2', content: 'Patch session cookie', status: 'in_progress' },
    ]);
  });

  it('drops the first (partial) line when the chunk was truncated', () => {
    const full = fixture('transcripts', 'basic.jsonl');
    const cut = full.slice(50);
    const tail = parseTranscriptTail(cut, true);
    expect(tail.lastTimestamp).toBe('2026-09-01T10:12:00.000Z');
  });
});

describe('helpers', () => {
  it('flattens content blocks', () => {
    expect(textOfContent([{ type: 'text', text: 'a' }, { type: 'tool_result' }, { type: 'text', text: 'b' }])).toBe('a\nb');
    expect(textOfContent(42)).toBe('');
  });
  it('builds a title from the first non-tag line and truncates', () => {
    expect(makeTitle('<system>x</system>\n\n  Hello world  ')).toBe('Hello world');
    expect(makeTitle('x'.repeat(100), 10)).toBe('xxxxxxxxx…');
    expect(makeTitle('<only-tags>')).toBeUndefined();
  });
});
