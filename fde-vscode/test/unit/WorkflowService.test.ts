import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Skill } from '../../src/model';
import { EXAMPLE_WORKFLOW, loadWorkflow, parseWorkflow, splitSkillsByPhase, WORKFLOW_FILE } from '../../src/skills/WorkflowService';
import { tmpdir, write } from './helpers';

const skill = (name: string): Skill => ({ name, description: '', kind: 'skill', scope: 'project', path: `/x/${name}` });

describe('parseWorkflow', () => {
  it('parses the bundled example', () => {
    const wf = parseWorkflow(EXAMPLE_WORKFLOW);
    expect(wf.name).toBe('client-engagement');
    expect(wf.phases.map((p) => p.id)).toEqual(['discover', 'build', 'ship']);
    expect(wf.phases[1]?.checklist).toHaveLength(3);
  });

  it('defaults title to id and tolerates missing lists', () => {
    const wf = parseWorkflow('phases:\n  - id: a\n');
    expect(wf).toEqual({ name: 'workflow', phases: [{ id: 'a', title: 'a', skills: [], checklist: [] }] });
  });

  it.each([
    ['', 'mapping'],
    ['phases: []', 'non-empty'],
    ['phases:\n  - title: x', 'id is required'],
    ['phases:\n  - id: a\n  - id: a', 'duplicate'],
    ['phases:\n  - id: a\n    skills: [1]', 'list of strings'],
    ['phases: [\n', 'invalid YAML'],
  ])('rejects %j', (text, message) => {
    expect(() => parseWorkflow(text)).toThrow(message);
  });
});

describe('loadWorkflow', () => {
  it('returns undefined when the file is absent and parses it when present', async () => {
    const root = tmpdir();
    try {
      expect(await loadWorkflow(root)).toBeUndefined();
      write(path.join(root, WORKFLOW_FILE), EXAMPLE_WORKFLOW);
      expect((await loadWorkflow(root))?.phases).toHaveLength(3);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('splitSkillsByPhase', () => {
  const wf = parseWorkflow(EXAMPLE_WORKFLOW);
  const skills = [skill('add-tests'), skill('scaffold'), skill('deploy')];

  it('separates phase skills, the rest, and names missing ones', () => {
    const split = splitSkillsByPhase(skills, wf, 'build');
    expect(split.forPhase.map((s) => s.name)).toEqual(['add-tests', 'scaffold']);
    expect(split.others.map((s) => s.name)).toEqual(['deploy']);
    expect(split.missing).toEqual(['run']);
  });

  it('returns everything when there is no workflow or unknown phase', () => {
    expect(splitSkillsByPhase(skills, undefined, undefined).others).toHaveLength(3);
    expect(splitSkillsByPhase(skills, wf, 'nope').phase).toBeUndefined();
  });
});
