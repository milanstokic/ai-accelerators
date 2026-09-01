/**
 * Claude Code stores transcripts under `~/.claude/projects/<slug>/`, where the slug is the
 * working directory with every non-alphanumeric character replaced by `-`.
 * The mapping is lossy, so callers must confirm the `cwd` recorded inside a transcript.
 */
export function projectSlug(cwd: string): string {
  return cwd.replace(/[^A-Za-z0-9]/g, '-');
}

/** Older CLI versions only replaced path separators. Kept as a fallback lookup. */
export function legacyProjectSlug(cwd: string): string {
  return cwd.replace(/[\\/]/g, '-');
}

export function candidateSlugs(cwd: string): string[] {
  return [...new Set([projectSlug(cwd), legacyProjectSlug(cwd)])];
}
