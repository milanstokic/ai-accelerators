export interface RawWorktree {
  path: string;
  head: string;
  branch: string | null;
  detached: boolean;
  bare: boolean;
  locked?: string | true;
  prunable?: string;
}

/** Parse the output of `git worktree list --porcelain`. */
export function parseWorktreeList(output: string): RawWorktree[] {
  const result: RawWorktree[] = [];
  let current: RawWorktree | undefined;

  const flush = () => {
    if (current) result.push(current);
    current = undefined;
  };

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (line === '') {
      flush();
      continue;
    }
    const space = line.indexOf(' ');
    const key = space === -1 ? line : line.slice(0, space);
    const value = space === -1 ? '' : line.slice(space + 1);

    switch (key) {
      case 'worktree':
        flush();
        current = { path: value, head: '', branch: null, detached: false, bare: false };
        break;
      case 'HEAD':
        if (current) current.head = value;
        break;
      case 'branch':
        if (current) current.branch = value.replace(/^refs\/heads\//, '');
        break;
      case 'detached':
        if (current) current.detached = true;
        break;
      case 'bare':
        if (current) current.bare = true;
        break;
      case 'locked':
        if (current) current.locked = value === '' ? true : value;
        break;
      case 'prunable':
        if (current) current.prunable = value;
        break;
      default:
        break;
    }
  }
  flush();
  return result;
}
