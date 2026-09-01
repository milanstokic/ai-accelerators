import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import type { Phase, Skill, Workflow } from '../model';

export const WORKFLOW_FILE = path.join('.claude', 'fde-workflow.yaml');

export class WorkflowError extends Error {}

function stringList(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
    throw new WorkflowError(`${field} must be a list of strings`);
  }
  return value as string[];
}

export function parseWorkflow(text: string): Workflow {
  let doc: unknown;
  try {
    doc = YAML.parse(text);
  } catch (err) {
    throw new WorkflowError(`invalid YAML: ${(err as Error).message}`);
  }
  if (!doc || typeof doc !== 'object') throw new WorkflowError('workflow must be a mapping');
  const obj = doc as Record<string, unknown>;
  const name = typeof obj.name === 'string' && obj.name.trim() !== '' ? obj.name.trim() : 'workflow';
  if (!Array.isArray(obj.phases) || obj.phases.length === 0) throw new WorkflowError('phases must be a non-empty list');

  const phases: Phase[] = [];
  const ids = new Set<string>();
  obj.phases.forEach((raw, i) => {
    if (!raw || typeof raw !== 'object') throw new WorkflowError(`phases[${i}] must be a mapping`);
    const p = raw as Record<string, unknown>;
    const id = typeof p.id === 'string' ? p.id.trim() : '';
    if (id === '') throw new WorkflowError(`phases[${i}].id is required`);
    if (ids.has(id)) throw new WorkflowError(`duplicate phase id "${id}"`);
    ids.add(id);
    phases.push({
      id,
      title: typeof p.title === 'string' && p.title.trim() !== '' ? p.title.trim() : id,
      skills: stringList(p.skills, `phases[${i}].skills`),
      checklist: stringList(p.checklist, `phases[${i}].checklist`),
    });
  });
  return { name, phases };
}

export async function loadWorkflow(workspaceRoot: string): Promise<Workflow | undefined> {
  const file = path.join(workspaceRoot, WORKFLOW_FILE);
  let text: string;
  try {
    text = await fs.promises.readFile(file, 'utf8');
  } catch {
    return undefined;
  }
  return parseWorkflow(text);
}

export function splitSkillsByPhase(skills: Skill[], workflow: Workflow | undefined, phaseId: string | undefined) {
  const phase = workflow?.phases.find((p) => p.id === phaseId);
  if (!phase) return { phase: undefined, forPhase: [] as Skill[], others: skills };
  const wanted = new Set(phase.skills);
  const forPhase = skills.filter((s) => wanted.has(s.name));
  const others = skills.filter((s) => !wanted.has(s.name));
  const missing = phase.skills.filter((name) => !skills.some((s) => s.name === name));
  return { phase, forPhase, others, missing };
}

export const EXAMPLE_WORKFLOW = `# FDE workflow: phases of an engagement and the skills that matter in each.
# Skill names match the \`name\` in SKILL.md frontmatter or the command file name.
name: client-engagement
phases:
  - id: discover
    title: Discover
    skills: [kickoff-notes, architecture-sketch]
    checklist:
      - Kickoff notes captured
      - Data sources and access confirmed
      - Success criteria agreed with the client
  - id: build
    title: Build
    skills: [scaffold, add-tests, run]
    checklist:
      - Feature implemented on a branch
      - Tests pass locally
      - Demoed to the client
  - id: ship
    title: Ship
    skills: [code-review, security-review]
    checklist:
      - Pull request opened
      - CI green
      - Deployed to the client environment
`;
