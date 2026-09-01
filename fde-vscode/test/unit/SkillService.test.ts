import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { discoverSkills } from '../../src/skills/SkillService';
import { tmpdir, write } from './helpers';

let root: string;
let home: string;
beforeEach(() => {
  root = tmpdir('fde-ws-');
  home = tmpdir('fde-home-');
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(home, { recursive: true, force: true });
});

describe('discoverSkills', () => {
  it('finds project skills and commands, user skills and plugin skills with precedence', async () => {
    write(path.join(root, '.claude/skills/scaffold/SKILL.md'), '---\nname: scaffold\ndescription: Scaffold a service\n---\n# Scaffold\n');
    write(path.join(root, '.claude/skills/nofm/SKILL.md'), '# No frontmatter\n\nFirst paragraph describes it.\n');
    write(path.join(root, '.claude/commands/add-tests.md'), '# Add Tests\n\nGenerate tests.\n');
    write(path.join(root, '.claude/commands/db/migrate.md'), '# Migrate\n');
    write(path.join(home, 'skills/scaffold/SKILL.md'), '---\nname: scaffold\ndescription: user-level duplicate\n---\n');
    write(path.join(home, 'skills/deploy/SKILL.md'), '---\nname: deploy\ndescription: >\n  Deploy to\n  the client env\n---\n');
    write(path.join(home, 'plugins/cache/acme/security/skills/security-review/SKILL.md'), '---\nname: security-review\ndescription: Review\n---\n');

    const skills = await discoverSkills({ workspaceRoot: root, claudeHome: home, includeUser: true });
    expect(skills.map((s) => `${s.name}:${s.kind}:${s.scope}`)).toEqual([
      'add-tests:command:project',
      'db:migrate:command:project',
      'deploy:skill:user',
      'nofm:skill:project',
      'scaffold:skill:project',
      'security-review:plugin:plugin',
    ]);
    expect(skills.find((s) => s.name === 'scaffold')?.description).toBe('Scaffold a service');
    expect(skills.find((s) => s.name === 'deploy')?.description).toBe('Deploy to the client env');
    expect(skills.find((s) => s.name === 'nofm')?.description).toBe('First paragraph describes it.');
    expect(skills.find((s) => s.name === 'add-tests')?.description).toBe('Generate tests.');
  });

  it('omits user scope when disabled and copes with missing directories', async () => {
    write(path.join(home, 'skills/deploy/SKILL.md'), '---\nname: deploy\n---\n');
    expect(await discoverSkills({ workspaceRoot: root, claudeHome: home, includeUser: false })).toEqual([]);
    expect(await discoverSkills({ workspaceRoot: undefined, claudeHome: home, includeUser: true })).toHaveLength(1);
  });
});
