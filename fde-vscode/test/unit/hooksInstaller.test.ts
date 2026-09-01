import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { addHooks, hasHooks, hookScriptPath, installHookScript, readSettings, removeHooks, writeSettings } from '../../src/progress/hooksInstaller';
import { tmpdir } from './helpers';

const script = '/home/me/.claude/fde/fde-hook.js';

describe('hooks settings merge', () => {
  it('adds both hooks, keeps existing hooks, and is idempotent', () => {
    const existing = {
      permissions: { allow: ['Bash(npm test)'] },
      hooks: { Stop: [{ hooks: [{ type: 'command', command: 'say done' }] }] },
    };
    const once = addHooks(existing, script);
    const twice = addHooks(once, script);
    expect(twice).toEqual(once);
    expect(once.permissions).toEqual(existing.permissions);
    expect(once.hooks?.Stop).toHaveLength(2);
    expect(once.hooks?.Stop?.[0]?.hooks[0]?.command).toBe('say done');
    expect(once.hooks?.SessionStart?.[0]?.hooks[0]?.command).toBe(`node ${script} session-start`);
    expect(hasHooks(once)).toBe(true);
    expect(hasHooks(existing)).toBe(false);
    // input not mutated
    expect(existing.hooks.Stop).toHaveLength(1);
  });

  it('quotes paths containing spaces', () => {
    const s = addHooks({}, '/Users/Jane Doe/.claude/fde/fde-hook.js');
    expect(s.hooks?.Stop?.[0]?.hooks[0]?.command).toBe('node "/Users/Jane Doe/.claude/fde/fde-hook.js" stop');
  });

  it('removes only our hooks and drops empty maps', () => {
    const withOurs = addHooks({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'say done' }] }] } }, script);
    const removed = removeHooks(withOurs);
    expect(removed.hooks).toEqual({ Stop: [{ hooks: [{ type: 'command', command: 'say done' }] }] });
    expect(removeHooks(addHooks({}, script))).toEqual({});
    expect(hasHooks(removed)).toBe(false);
  });
});

describe('settings file IO and script install', () => {
  it('round-trips settings and copies the hook script', async () => {
    const dir = tmpdir();
    try {
      const file = path.join(dir, '.claude', 'settings.local.json');
      expect(await readSettings(file)).toEqual({});
      await writeSettings(file, addHooks({}, script));
      expect(hasHooks(await readSettings(file))).toBe(true);

      const bundled = path.join(dir, 'bundled.js');
      fs.writeFileSync(bundled, '// hook');
      const installed = await installHookScript(bundled, path.join(dir, 'home'));
      expect(installed).toBe(hookScriptPath(path.join(dir, 'home')));
      expect(fs.readFileSync(installed, 'utf8')).toBe('// hook');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
