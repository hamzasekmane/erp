/**
 * In-memory fixed-window throttle for authentication endpoints.
 * Sufficient for a single instance; swap for Redis in multi-instance deployments
 * (see docs/02-architecture.md §12.6).
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > limit) return false;
  return true;
}

export function resetKey(key: string): void {
  buckets.delete(key);
}

export function _clearAllForTests(): void {
  buckets.clear();
}
