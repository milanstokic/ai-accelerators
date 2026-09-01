import * as fs from 'node:fs';
import * as path from 'node:path';
import { fdeDir } from './events';

export const HOOK_SCRIPT_NAME = 'fde-hook.js';
export const HOOK_MARKER = 'fde-hook';

type HookEntry = { type: string; command?: string; timeout?: number };
type HookGroup = { matcher?: string; hooks: HookEntry[] };
type Settings = Record<string, unknown> & { hooks?: Record<string, HookGroup[]> };

const HOOK_EVENTS: Array<{ event: string; arg: string }> = [
  { event: 'SessionStart', arg: 'session-start' },
  { event: 'Stop', arg: 'stop' },
];

export function hookScriptPath(claudeHome: string): string {
  return path.join(fdeDir(claudeHome), HOOK_SCRIPT_NAME);
}

function quote(p: string): string {
  return /[\s"]/.test(p) ? `"${p.replace(/"/g, '\\"')}"` : p;
}

function isOurs(group: HookGroup): boolean {
  return Array.isArray(group.hooks) && group.hooks.some((h) => typeof h?.command === 'string' && h.command.includes(HOOK_MARKER));
}

/** Return a copy of `settings` with the FDE hooks present exactly once. */
export function addHooks(settings: Settings, scriptPath: string): Settings {
  const out: Settings = { ...settings, hooks: { ...(settings.hooks ?? {}) } };
  const hooks = out.hooks as Record<string, HookGroup[]>;
  for (const { event, arg } of HOOK_EVENTS) {
    const existing = (hooks[event] ?? []).filter((g) => !isOurs(g));
    existing.push({ hooks: [{ type: 'command', command: `node ${quote(scriptPath)} ${arg}`, timeout: 10 }] });
    hooks[event] = existing;
  }
  return out;
}

/** Return a copy of `settings` with the FDE hooks removed. Empty `hooks` maps are dropped. */
export function removeHooks(settings: Settings): Settings {
  if (!settings.hooks) return { ...settings };
  const hooks: Record<string, HookGroup[]> = {};
  for (const [event, groups] of Object.entries(settings.hooks)) {
    const kept = (groups ?? []).filter((g) => !isOurs(g));
    if (kept.length) hooks[event] = kept;
  }
  const out: Settings = { ...settings };
  if (Object.keys(hooks).length) out.hooks = hooks;
  else delete out.hooks;
  return out;
}

export function hasHooks(settings: Settings): boolean {
  return HOOK_EVENTS.every(({ event }) => (settings.hooks?.[event] ?? []).some(isOurs));
}

export function localSettingsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.claude', 'settings.local.json');
}

export async function readSettings(file: string): Promise<Settings> {
  try {
    const text = await fs.promises.readFile(file, 'utf8');
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? (value as Settings) : {};
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw err;
  }
}

export async function writeSettings(file: string, settings: Settings): Promise<void> {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
}

/** Copy the bundled hook script into `<claudeHome>/fde/` so hooks keep working across extension upgrades. */
export async function installHookScript(bundledScript: string, claudeHome: string): Promise<string> {
  const target = hookScriptPath(claudeHome);
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  await fs.promises.copyFile(bundledScript, target);
  return target;
}
