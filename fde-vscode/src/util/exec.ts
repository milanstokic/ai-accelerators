import { execFile } from 'node:child_process';

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

export class ExecError extends Error {
  constructor(
    message: string,
    public readonly result: ExecResult,
  ) {
    super(message);
  }
}

export interface ExecOptions {
  cwd?: string;
  timeoutMs?: number;
}

/** Run a command and resolve with its output. Rejects only when the process cannot be spawned. */
export function exec(cmd: string, args: string[], opts: ExecOptions = {}): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { cwd: opts.cwd, timeout: opts.timeoutMs ?? 15_000, maxBuffer: 16 * 1024 * 1024, encoding: 'utf8' },
      (error, stdout, stderr) => {
        const err = error as (Error & { code?: unknown; killed?: boolean }) | null;
        if (err && typeof err.code !== 'number' && !err.killed) {
          reject(err);
          return;
        }
        const code = err ? (typeof err.code === 'number' ? err.code : 1) : 0;
        resolve({ stdout: String(stdout), stderr: String(stderr), code });
      },
    );
  });
}

export type GitRunner = (args: string[], cwd: string) => Promise<string>;

/** Run git and return trimmed stdout. Throws ExecError on a non-zero exit. */
export const runGit: GitRunner = async (args, cwd) => {
  const result = await exec('git', args, { cwd });
  if (result.code !== 0) {
    throw new ExecError(`git ${args.join(' ')} failed: ${result.stderr.trim() || `exit ${result.code}`}`, result);
  }
  return result.stdout.replace(/\r?\n$/, '');
};
