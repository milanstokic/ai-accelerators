import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventsTail, eventsFile, parseEventLines } from '../../src/progress/events';
import { tmpdir } from './helpers';

let home: string;
beforeEach(() => (home = tmpdir()));
afterEach(() => fs.rmSync(home, { recursive: true, force: true }));

describe('parseEventLines', () => {
  it('keeps well-formed events and drops junk', () => {
    const events = parseEventLines('{"ts":"t","event":"stop","cwd":"/x","summary":"2 files changed"}\nnope\n{"noEvent":1}\n');
    expect(events).toEqual([{ ts: 't', event: 'stop', cwd: '/x', summary: '2 files changed', sessionId: undefined, gitBranch: undefined }]);
  });
});

describe('EventsTail', () => {
  it('seeds at end of file, then returns only complete new lines', async () => {
    const file = eventsFile(home);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '{"event":"old"}\n');
    const tail = new EventsTail(file);
    expect(await tail.poll()).toEqual([]); // seed
    fs.appendFileSync(file, '{"event":"session-start","cwd":"/a"}\n{"event":"st');
    expect((await tail.poll()).map((e) => e.event)).toEqual(['session-start']);
    fs.appendFileSync(file, 'op","cwd":"/a"}\n');
    expect((await tail.poll()).map((e) => e.event)).toEqual(['stop']);
    expect(await tail.poll()).toEqual([]);
  });

  it('handles a file that appears later and one that is truncated', async () => {
    const file = eventsFile(home);
    const tail = new EventsTail(file);
    expect(await tail.poll()).toEqual([]);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '{"event":"stop"}\n');
    expect((await tail.poll()).map((e) => e.event)).toEqual(['stop']);
    fs.writeFileSync(file, '{"event":"x"}\n'); // shorter than offset -> rewind
    expect((await tail.poll()).map((e) => e.event)).toEqual(['x']);
  });
});
