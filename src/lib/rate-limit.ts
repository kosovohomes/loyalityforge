export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimitMemory(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (rateLimitStore.size > 1000) {
    rateLimitStore.forEach((v, k) => {
      if (now > v.resetAt) rateLimitStore.delete(k);
    });
  }
  const record = rateLimitStore.get(key);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

export function rateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): RateLimitResult {
  return rateLimitMemory(key, maxRequests, windowMs);
}

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = !!(REDIS_URL && REDIS_TOKEN);

export async function rateLimitAsync(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): Promise<RateLimitResult> {
  if (!REDIS_ENABLED) {
    return rateLimitMemory(key, maxRequests, windowMs);
  }
  const redisKey = `rl:${key}`;
  const now = Date.now();
  try {
    const pipelineBody = [
      ["INCR", redisKey],
      ["EXPIRE", redisKey, Math.ceil(windowMs / 1000)],
    ];
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipelineBody),
    });
    if (!res.ok) {
      console.error(`[rate-limit] Redis pipeline failed: ${res.status} ${res.statusText}`);
      return { allowed: true, remaining: maxRequests, resetAt: now + windowMs };
    }
    const data = (await res.json()) as Array<{ result?: number } | { error?: string }>;
    const incrResult = data[0];
    if (!incrResult || !("result" in incrResult) || typeof incrResult.result !== "number") {
      console.error("[rate-limit] Redis INCR error", incrResult);
      return { allowed: true, remaining: maxRequests, resetAt: now + windowMs };
    }
    const count = incrResult.result;
    const allowed = count <= maxRequests;
    return {
      allowed,
      remaining: Math.max(0, maxRequests - count),
      resetAt: now + windowMs,
    };
  } catch (err) {
    console.error("[rate-limit] Redis error", err);
    return { allowed: true, remaining: maxRequests, resetAt: now + windowMs };
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "Retry-After": result.allowed ? "0" : String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  const trustedHops = Number(process.env.TRUSTED_PROXY_HOPS ?? "0");
  if (xff && trustedHops > 0) {
    const parts = xff.split(",").map((s) => s.trim());
    const idx = Math.max(0, parts.length - trustedHops);
    return parts[idx] ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
