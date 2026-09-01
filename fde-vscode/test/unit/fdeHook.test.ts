import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpdir } from './helpers';

const script = path.join(__dirname, '..', '..', 'bin', 'fde-hook.js');

describe('bin/fde-hook.js', () => {
  it('appends a stop event with a change summary and never fails', () => {
    const dir = tmpdir('fde-hook-');
    try {
      const repo = path.join(dir, 'repo');
      fs.mkdirSync(repo);
      execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repo });
      fs.writeFileSync(path.join(repo, 'a.txt'), 'a');
      const events = path.join(dir, 'events.jsonl');
      const payload = JSON.stringify({ session_id: 'sess-1', cwd: repo, hook_event_name: 'Stop' });
      execFileSync('node', [script, 'stop'], { input: payload, env: { ...process.env, FDE_EVENTS_FILE: events } });
      const [line] = fs.readFileSync(events, 'utf8').trim().split('\n');
      expect(JSON.parse(line as string)).toMatchObject({ event: 'stop', sessionId: 'sess-1', cwd: repo, gitBranch: 'main', summary: '1 file changed' });

      // Garbage on stdin still exits 0 and records the event.
      execFileSync('node', [script, 'session-start'], { input: 'not json', env: { ...process.env, FDE_EVENTS_FILE: events } });
      expect(fs.readFileSync(events, 'utf8').trim().split('\n')).toHaveLength(2);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
