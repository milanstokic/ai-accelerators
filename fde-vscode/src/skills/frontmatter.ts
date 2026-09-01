export interface Frontmatter {
  data: Record<string, string>;
  body: string;
}

/** Parse a simple `key: value` YAML frontmatter block. Nested structures are ignored. */
export function parseFrontmatter(text: string): Frontmatter {
  const normalized = text.replace(/^﻿/, '');
  if (!normalized.startsWith('---')) return { data: {}, body: normalized };
  const end = normalized.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: normalized };
  const block = normalized.slice(3, end);
  const body = normalized.slice(end + 4).replace(/^\r?\n/, '');
  const data: Record<string, string> = {};
  let currentKey: string | undefined;
  for (const line of block.split(/\r?\n/)) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (m) {
      currentKey = m[1] as string;
      data[currentKey] = unquote((m[2] ?? '').trim());
      continue;
    }
    // Continuation lines for folded/multi-line scalars (`description: >` or indented text).
    if (currentKey && /^\s+\S/.test(line)) {
      const cont = line.trim();
      data[currentKey] = data[currentKey] === '' || data[currentKey] === '>' || data[currentKey] === '|' ? cont : `${data[currentKey]} ${cont}`;
    }
  }
  return { data, body };
}

function unquote(v: string): string {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

export function firstHeading(body: string): string | undefined {
  const m = /^#{1,6}\s+(.+?)\s*$/m.exec(body);
  return m?.[1];
}

export function firstParagraph(body: string): string | undefined {
  const out: string[] = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith('```')) {
      inFence = !inFence;
      if (out.length) break;
      continue;
    }
    if (inFence) continue;
    if (t === '' || t.startsWith('#')) {
      if (out.length) break;
      continue;
    }
    out.push(t);
  }
  return out.length ? out.join(' ') : undefined;
}

export function truncate(text: string, max = 120): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
