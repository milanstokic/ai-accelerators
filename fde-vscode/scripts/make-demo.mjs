#!/usr/bin/env node
/*
 * Builds a self-contained demo workspace under ./demo so the extension can be exercised
 * without a real engagement or a real Claude Code install:
 *
 *   demo/repo                  main worktree (open this folder in the Extension Development Host)
 *   demo/repo-feat-search-api  linked worktree, 2 commits ahead, dirty
 *   demo/repo-fix-login        linked worktree, 1 commit ahead
 *   demo/claude-home           fake ~/.claude with transcripts, user skills, a plugin skill
 *   demo/fake-claude.sh        stand-in for the `claude` CLI (echoes what it receives)
 *
 * demo/repo/.vscode/settings.json points fde.claudeHome and fde.claudeCommand at these.
 * Re-run at any time; the directory is recreated from scratch.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, '..', 'demo');
const repo = path.join(demo, 'repo');
const feat = path.join(demo, 'repo-feat-search-api');
const fix = path.join(demo, 'repo-fix-login');
const home = path.join(demo, 'claude-home');

const git = (cwd, ...args) =>
  execFileSync('git', ['-c', 'user.name=Demo', '-c', 'user.email=demo@example.com', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim();
const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
// Same rule as src/sessions/slug.ts
const slug = (p) => p.replace(/[^A-Za-z0-9]/g, '-');

fs.rmSync(demo, { recursive: true, force: true });
fs.mkdirSync(repo, { recursive: true });

// --- repository -----------------------------------------------------------
git(repo, 'init', '-q', '-b', 'main');
write(path.join(repo, 'README.md'), '# Acme Search Engagement\n\nDemo repository for the FDE extension.\n');
write(path.join(repo, 'src', 'app.py'), 'def main():\n    print("hello")\n');
write(
  path.join(repo, '.claude', 'skills', 'kickoff-notes', 'SKILL.md'),
  '---\nname: kickoff-notes\ndescription: Turn a kickoff call transcript into structured engagement notes.\n---\n# Kickoff notes\n\nSummarise goals, stakeholders, data sources and risks.\n',
);
write(
  path.join(repo, '.claude', 'skills', 'scaffold', 'SKILL.md'),
  '---\nname: scaffold\ndescription: Scaffold a new service from the RAG API template.\n---\n# Scaffold\n',
);
write(path.join(repo, '.claude', 'commands', 'add-tests.md'), '# Add Tests\n\nGenerate unit tests for the selected module.\n');
write(path.join(repo, '.claude', 'commands', 'run.md'), '# Run\n\nStart the app locally and smoke-test it.\n');
write(
  path.join(repo, '.claude', 'fde-workflow.yaml'),
  `name: acme-search
phases:
  - id: discover
    title: Discover
    skills: [kickoff-notes]
    checklist:
      - Kickoff notes captured
      - Data sources and access confirmed
  - id: build
    title: Build
    skills: [scaffold, add-tests, run]
    checklist:
      - Search endpoint implemented
      - Tests pass locally
      - Demoed to the client
  - id: ship
    title: Ship
    skills: [code-review, security-review]
    checklist:
      - Pull request opened
      - CI green
      - Deployed to the client environment
`,
);
write(path.join(repo, '.gitignore'), '.vscode/\n.claude/settings.local.json\n');
git(repo, 'add', '.');
git(repo, 'commit', '-q', '-m', 'chore: initial engagement scaffold');

// Branch + worktree: feat/search-api (2 commits ahead, dirty)
git(repo, 'worktree', 'add', '-q', '-b', 'feat/search-api', feat);
write(path.join(feat, 'src', 'search.py'), 'def search(q):\n    return []\n');
git(feat, 'add', '.');
git(feat, 'commit', '-q', '-m', 'feat: add search endpoint skeleton');
write(path.join(feat, 'tests', 'test_search.py'), 'def test_search():\n    assert True\n');
git(feat, 'add', '.');
git(feat, 'commit', '-q', '-m', 'test: cover search endpoint');
write(path.join(feat, 'src', 'search.py'), 'def search(q, page=1):\n    return []\n'); // uncommitted change

// Branch + worktree: fix/login (1 commit ahead, clean)
git(repo, 'worktree', 'add', '-q', '-b', 'fix/login', fix);
write(path.join(fix, 'src', 'auth.py'), 'def login():\n    return True\n');
git(fix, 'add', '.');
git(fix, 'commit', '-q', '-m', 'fix: refresh session cookie on login');

// --- fake Claude Code home ------------------------------------------------
const line = (obj) => `${JSON.stringify(obj)}\n`;
const transcript = (id, cwd, branch, prompt, startIso, extra = []) =>
  [
    line({ type: 'queue-operation', operation: 'enqueue', timestamp: startIso, sessionId: id, content: prompt }),
    line({
      parentUuid: null,
      isSidechain: false,
      type: 'user',
      message: { role: 'user', content: prompt },
      uuid: `${id}-u1`,
      timestamp: startIso,
      cwd,
      sessionId: id,
      version: '2.1.257',
      gitBranch: branch,
    }),
    ...extra.map((content, i) =>
      line({
        parentUuid: `${id}-u1`,
        type: 'assistant',
        message: { role: 'assistant', content },
        uuid: `${id}-a${i}`,
        timestamp: new Date(Date.parse(startIso) + (i + 1) * 60_000).toISOString(),
        cwd,
        sessionId: id,
        version: '2.1.257',
        gitBranch: branch,
      }),
    ),
  ].join('');

const now = Date.now();
const ago = (minutes) => new Date(now - minutes * 60_000);
const seed = (cwd, id, branch, prompt, startedMinutesAgo, lastMinutesAgo, extra) => {
  const file = path.join(home, 'projects', slug(cwd), `${id}.jsonl`);
  write(file, transcript(id, cwd, branch, prompt, ago(startedMinutesAgo).toISOString(), extra));
  const t = ago(lastMinutesAgo).getTime() / 1000;
  fs.utimesSync(file, t, t);
};

const todo = (todos) => [{ type: 'tool_use', id: 'todo', name: 'TodoWrite', input: { todos } }];

seed(feat, '11111111-1111-4111-8111-111111111111', 'feat/search-api', 'Implement the search endpoint with pagination', 95, 0.5, [
  [{ type: 'text', text: 'Tracking the work.' }],
  todo([
    { content: 'Add /search route', status: 'completed', activeForm: 'Adding route' },
    { content: 'Add pagination params', status: 'in_progress', activeForm: 'Adding pagination' },
    { content: 'Write endpoint tests', status: 'pending', activeForm: 'Writing tests' },
  ]),
]);
seed(feat, '22222222-2222-4222-8222-222222222222', 'feat/search-api', 'Review the search endpoint for edge cases', 60 * 26, 60 * 25, []);
seed(fix, '33333333-3333-4333-8333-333333333333', 'fix/login', 'Login drops the session after refresh, find the cause', 180, 40, [
  todo([
    { content: 'Reproduce with curl', status: 'completed', activeForm: 'Reproducing' },
    { content: 'Patch cookie flags', status: 'completed', activeForm: 'Patching' },
  ]),
]);
seed(repo, '44444444-4444-4444-8444-444444444444', 'main', 'Summarise the kickoff call and list data sources', 60 * 24 * 3, 60 * 24 * 3, []);

write(
  path.join(home, 'skills', 'deploy-checklist', 'SKILL.md'),
  '---\nname: deploy-checklist\ndescription: Walk through the client deployment checklist.\n---\n# Deploy checklist\n',
);
write(
  path.join(home, 'plugins', 'cache', 'acme', 'quality', 'skills', 'security-review', 'SKILL.md'),
  '---\nname: security-review\ndescription: Review the pending changes for security issues.\n---\n# Security review\n',
);
write(
  path.join(home, 'plugins', 'cache', 'acme', 'quality', 'skills', 'code-review', 'SKILL.md'),
  '---\nname: code-review\ndescription: Review the current diff for bugs.\n---\n# Code review\n',
);
fs.mkdirSync(path.join(home, 'fde'), { recursive: true });

// --- fake claude CLI ------------------------------------------------------
const fakeClaude = path.join(demo, 'fake-claude.sh');
write(
  fakeClaude,
  `#!/usr/bin/env bash
# Stand-in for the claude CLI used by the FDE demo. Echoes what it is asked to do.
echo "(fake claude) started in $(pwd) with args: $*"
echo "(fake claude) type /skill-name to see it echoed, Ctrl-D or 'exit' to quit"
while IFS= read -r line; do
  [ "$line" = "exit" ] && break
  echo "(fake claude) received: $line"
done
echo "(fake claude) bye"
`,
);
fs.chmodSync(fakeClaude, 0o755);

write(
  path.join(repo, '.vscode', 'settings.json'),
  `${JSON.stringify(
    {
      'fde.claudeHome': home,
      'fde.claudeCommand': fakeClaude,
      'fde.sessions.activeWindowSeconds': 120,
      'files.exclude': {},
    },
    null,
    2,
  )}\n`,
);

console.log(`Demo workspace ready.

  Open in the Extension Development Host:  ${repo}
  Fake Claude home:                        ${home}
  Worktrees:                               ${feat}
                                           ${fix}

Session "Implement the search endpoint…" on feat/search-api is marked active for the next 2 minutes.
Re-run \`npm run demo\` to reset.`);
