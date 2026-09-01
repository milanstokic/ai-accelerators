#!/usr/bin/env node
/*
 * Claude Code hook: appends one JSON line per event to events.jsonl next to this script.
 * Installed by the FDE VS Code extension into <claudeHome>/fde/. No dependencies, never fails the hook.
 *
 * Usage (from .claude/settings.local.json):  node /path/to/fde-hook.js <session-start|stop>
 * Claude Code passes the hook payload on stdin: { session_id, transcript_path, cwd, hook_event_name, ... }
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const eventName = process.argv[2] || 'unknown';
const eventsFile = process.env.FDE_EVENTS_FILE || path.join(__dirname, 'events.jsonl');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

let payload = {};
try {
  const raw = readStdin();
  if (raw.trim()) payload = JSON.parse(raw);
} catch {
  payload = {};
}

const cwd = payload.cwd || process.cwd();
const record = {
  ts: new Date().toISOString(),
  event: eventName,
  sessionId: payload.session_id,
  cwd,
  // symbolic-ref also works on a branch with no commits yet
  gitBranch: git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']) || git(cwd, ['symbolic-ref', '--short', 'HEAD']) || undefined,
};

if (eventName === 'stop') {
  const changed = git(cwd, ['status', '--porcelain']);
  const n = changed ? changed.split('\n').filter(Boolean).length : 0;
  record.summary = n === 0 ? 'no uncommitted changes' : `${n} file${n === 1 ? '' : 's'} changed`;
}

try {
  fs.mkdirSync(path.dirname(eventsFile), { recursive: true });
  fs.appendFileSync(eventsFile, JSON.stringify(record) + '\n');
} catch {
  // never block Claude Code
}
process.exit(0);
