import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export function expandHome(p: string): string {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(os.homedir(), p.slice(2));
  return p;
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Read up to `bytes` from the start of a file. */
export async function readHead(file: string, bytes: number): Promise<string> {
  const handle = await fs.promises.open(file, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buf, 0, bytes, 0);
    return buf.subarray(0, bytesRead).toString('utf8');
  } finally {
    await handle.close();
  }
}

/** Read up to `bytes` from the end of a file. */
export async function readTail(file: string, bytes: number): Promise<{ text: string; truncated: boolean }> {
  const handle = await fs.promises.open(file, 'r');
  try {
    const { size } = await handle.stat();
    const start = Math.max(0, size - bytes);
    const len = size - start;
    const buf = Buffer.alloc(len);
    const { bytesRead } = await handle.read(buf, 0, len, start);
    return { text: buf.subarray(0, bytesRead).toString('utf8'), truncated: start > 0 };
  } finally {
    await handle.close();
  }
}

export function samePath(a: string, b: string): boolean {
  return path.resolve(a).replace(/[\\/]+$/, '') === path.resolve(b).replace(/[\\/]+$/, '');
}

export function isWithin(child: string, parent: string): boolean {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
