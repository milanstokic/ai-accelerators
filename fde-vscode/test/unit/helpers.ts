import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export const FIXTURES = path.join(__dirname, '..', 'fixtures');

export function fixture(...parts: string[]): string {
  return fs.readFileSync(path.join(FIXTURES, ...parts), 'utf8');
}

export function tmpdir(prefix = 'fde-test-'): string {
  return fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), prefix));
}

export function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}
