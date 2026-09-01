import * as vscode from 'vscode';
import type { Skill } from '../model';
import { splitSkillsByPhase } from '../skills/WorkflowService';
import type { FdeStore } from '../store';

export class SkillSectionItem extends vscode.TreeItem {
  constructor(
    label: string,
    readonly skills: Skill[],
    readonly missing: string[] = [],
    expanded = true,
  ) {
    super(label, expanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${skills.length}`;
    this.contextValue = 'skillSection';
    this.id = `section:${label}`;
  }
}

export class SkillItem extends vscode.TreeItem {
  constructor(readonly skill: Skill) {
    super(skill.name, vscode.TreeItemCollapsibleState.None);
    this.description = skill.description;
    this.tooltip = new vscode.MarkdownString(`**/${skill.name}** (${skill.kind}, ${skill.scope})\n\n${skill.description}\n\n\`${skill.path}\``);
    this.iconPath = new vscode.ThemeIcon({ skill: 'sparkle', command: 'terminal', plugin: 'extensions' }[skill.kind]);
    this.contextValue = 'skill';
    this.id = `skill:${skill.path}`;
    this.command = { command: 'fde.skill.open', title: 'Open Skill File', arguments: [this] };
  }
}

export class MissingSkillItem extends vscode.TreeItem {
  constructor(name: string) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.description = 'listed in workflow but not found';
    this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('list.warningForeground'));
    this.contextValue = 'missingSkill';
    this.id = `missing:${name}`;
  }
}

type Node = SkillSectionItem | SkillItem | MissingSkillItem;

export class SkillsView implements vscode.TreeDataProvider<Node> {
  private readonly emitter = new vscode.EventEmitter<Node | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;

  constructor(private readonly store: FdeStore) {
    store.onDidChange.on(() => this.emitter.fire(undefined));
  }

  getTreeItem(element: Node): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Node): Node[] {
    if (element instanceof SkillSectionItem) {
      return [...element.missing.map((m) => new MissingSkillItem(m)), ...element.skills.map((s) => new SkillItem(s))];
    }
    if (element) return [];

    const { skills, workflow } = this.store.state;
    const current = this.store.currentPhase();
    const split = splitSkillsByPhase(skills, workflow, current?.id);
    if (!split.phase) return skills.map((s) => new SkillItem(s));
    return [
      new SkillSectionItem(`For this phase: ${split.phase.title}`, split.forPhase, split.missing),
      new SkillSectionItem('All skills', split.others, [], false),
    ];
  }
}
