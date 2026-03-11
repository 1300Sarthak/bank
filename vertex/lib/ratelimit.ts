const buckets = new Map<string, { tokens: number; lastRefill: number }>();

const MAX_TOKENS = 30;
const REFILL_INTERVAL = 60_000; // 1 minute

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(key, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  if (elapsed >= REFILL_INTERVAL) {
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) return false;

  bucket.tokens--;
  return true;
}
