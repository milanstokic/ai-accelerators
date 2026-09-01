export type Listener<T> = (value: T) => void;

/** Minimal event emitter so core modules do not depend on the vscode API. */
export class Emitter<T> {
  private listeners = new Set<Listener<T>>();

  on(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  fire(value: T): void {
    for (const l of [...this.listeners]) {
      try {
        l(value);
      } catch {
        // listeners must not break the emitter
      }
    }
  }

  dispose(): void {
    this.listeners.clear();
  }
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): ((...args: A) => void) & { cancel(): void } {
  let timer: NodeJS.Timeout | undefined;
  const wrapped = (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, ms);
  };
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  return wrapped;
}

export function relativeTime(date: Date, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
