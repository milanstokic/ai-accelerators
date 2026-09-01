export interface BranchStatus {
  oid?: string;
  head?: string;
  upstream?: string;
  ahead: number;
  behind: number;
  dirty: boolean;
  changedFiles: number;
}

/** Parse the output of `git status --porcelain=v2 --branch`. */
export function parseStatusV2(output: string): BranchStatus {
  const status: BranchStatus = { ahead: 0, behind: 0, dirty: false, changedFiles: 0 };
  for (const line of output.split(/\r?\n/)) {
    if (line === '') continue;
    if (line.startsWith('# ')) {
      const [key, ...rest] = line.slice(2).split(' ');
      const value = rest.join(' ');
      switch (key) {
        case 'branch.oid':
          status.oid = value;
          break;
        case 'branch.head':
          status.head = value === '(detached)' ? undefined : value;
          break;
        case 'branch.upstream':
          status.upstream = value;
          break;
        case 'branch.ab': {
          const m = /^\+(\d+) -(\d+)$/.exec(value);
          if (m) {
            status.ahead = Number(m[1]);
            status.behind = Number(m[2]);
          }
          break;
        }
        default:
          break;
      }
      continue;
    }
    // Any entry line (1, 2, u, ?, !) means the tree differs from HEAD.
    if (/^[12u?]/.test(line)) {
      status.dirty = true;
      status.changedFiles += 1;
    }
  }
  return status;
}
