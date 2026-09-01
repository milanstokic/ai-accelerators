import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Skill, SkillKind, SkillScope } from '../model';
import { exists } from '../util/fs';
import { firstHeading, firstParagraph, parseFrontmatter, truncate } from './frontmatter';

export interface SkillSources {
  workspaceRoot?: string;
  claudeHome: string;
  includeUser: boolean;
}

const SCOPE_RANK: Record<SkillScope, number> = { project: 0, user: 1, plugin: 2 };

async function readSkillFile(file: string, fallbackName: string, kind: SkillKind, scope: SkillScope): Promise<Skill | undefined> {
  let text: string;
  try {
    text = await fs.promises.readFile(file, 'utf8');
  } catch {
    return undefined;
  }
  const { data, body } = parseFrontmatter(text);
  const name = (data.name ?? fallbackName).trim();
  const description = data.description ?? firstParagraph(body) ?? firstHeading(body) ?? '';
  return { name, description: truncate(description.replace(/\s+/g, ' ').trim()), kind, scope, path: file };
}

async function skillDirs(root: string, kind: SkillKind, scope: SkillScope): Promise<Skill[]> {
  if (!(await exists(root))) return [];
  const out: Skill[] = [];
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const file = path.join(root, entry.name, 'SKILL.md');
    if (!(await exists(file))) continue;
    const skill = await readSkillFile(file, entry.name, kind, scope);
    if (skill) out.push(skill);
  }
  return out;
}

async function commandFiles(root: string, scope: SkillScope, prefix = ''): Promise<Skill[]> {
  if (!(await exists(root))) return [];
  const out: Skill[] = [];
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await commandFiles(full, scope, `${prefix}${entry.name}:`)));
      continue;
    }
    if (!entry.name.endsWith('.md')) continue;
    const skill = await readSkillFile(full, `${prefix}${entry.name.slice(0, -3)}`, 'command', scope);
    if (skill) out.push(skill);
  }
  return out;
}

/** Walk `~/.claude/plugins` looking for `<anything>/skills/<name>/SKILL.md`, bounded depth. */
async function pluginSkills(pluginsRoot: string): Promise<Skill[]> {
  if (!(await exists(pluginsRoot))) return [];
  const out: Skill[] = [];
  const walk = async (dir: string, depth: number) => {
    if (depth > 6) return;
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.name === 'skills') {
        out.push(...(await skillDirs(full, 'plugin', 'plugin')));
      } else {
        await walk(full, depth + 1);
      }
    }
  };
  await walk(pluginsRoot, 0);
  return out;
}

export async function discoverSkills(src: SkillSources): Promise<Skill[]> {
  const found: Skill[] = [];
  if (src.workspaceRoot) {
    found.push(...(await skillDirs(path.join(src.workspaceRoot, '.claude', 'skills'), 'skill', 'project')));
    found.push(...(await commandFiles(path.join(src.workspaceRoot, '.claude', 'commands'), 'project')));
  }
  if (src.includeUser) {
    found.push(...(await skillDirs(path.join(src.claudeHome, 'skills'), 'skill', 'user')));
    found.push(...(await commandFiles(path.join(src.claudeHome, 'commands'), 'user')));
    found.push(...(await pluginSkills(path.join(src.claudeHome, 'plugins'))));
  }
  // Dedupe by name: project beats user beats plugin.
  const byName = new Map<string, Skill>();
  for (const skill of found) {
    const existing = byName.get(skill.name);
    if (!existing || SCOPE_RANK[skill.scope] < SCOPE_RANK[existing.scope]) byName.set(skill.name, skill);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}
