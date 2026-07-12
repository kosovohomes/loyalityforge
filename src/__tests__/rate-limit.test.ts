import { rateLimit, rateLimitHeaders, rateLimitAsync, getClientIp } from "@/lib/rate-limit";

describe("rateLimit (in-memory backend)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows first request", () => {
    const result = rateLimit("test:1", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks multiple requests", () => {
    const key = "test:multi";
    rateLimit(key, 3, 60000);
    rateLimit(key, 3, 60000);
    const third = rateLimit(key, 3, 60000);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("blocks after max requests", () => {
    const key = "test:block";
    rateLimit(key, 2, 60000);
    rateLimit(key, 2, 60000);
    const blocked = rateLimit(key, 2, 60000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = "test:reset";
    rateLimit(key, 1, 1000);
    const blocked = rateLimit(key, 1, 1000);
    expect(blocked.allowed).toBe(false);

    jest.advanceTimersByTime(1500);
    const afterReset = rateLimit(key, 1, 1000);
    expect(afterReset.allowed).toBe(true);
  });

  it("different keys are independent", () => {
    rateLimit("key:a", 1, 60000);
    const b = rateLimit("key:b", 1, 60000);
    expect(b.allowed).toBe(true);
  });
});

describe("rateLimitAsync (falls back to in-memory when Redis env vars absent)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("behaves identically to sync rateLimit when Redis is disabled", async () => {
    const sync = rateLimit("async:1", 5, 60000);
    const async1 = await rateLimitAsync("async:2", 5, 60000);
    expect(async1.allowed).toBe(true);
    expect(async1.remaining).toBe(sync.remaining);
  });

  it("blocks after max requests", async () => {
    await rateLimitAsync("async:block", 2, 60000);
    await rateLimitAsync("async:block", 2, 60000);
    const blocked = await rateLimitAsync("async:block", 2, 60000);
    expect(blocked.allowed).toBe(false);
  });
});

describe("rateLimitHeaders", () => {
  it("returns correct headers", () => {
    const result = { allowed: true, remaining: 5, resetAt: Date.now() + 60000 };
    const headers = rateLimitHeaders(result);
    expect(headers["X-RateLimit-Remaining"]).toBe("5");
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
    expect(headers["Retry-After"]).toBe("0");
  });

  it("returns Retry-After for blocked requests", () => {
    const result = { allowed: false, remaining: 0, resetAt: Date.now() + 30000 };
    const headers = rateLimitHeaders(result);
    expect(headers["Retry-After"]).not.toBe("0");
  });
});

describe("getClientIp", () => {
  afterEach(() => {
    delete process.env.TRUSTED_PROXY_HOPS;
  });

  function makeRequest(headers: Record<string, string>): { headers: { get: (k: string) => string | null } } {
    return {
      headers: {
        get: (k: string) => headers[k.toLowerCase()] ?? headers[k] ?? null,
      },
    };
  }

  it("returns 'unknown' when no IP headers present", () => {
    expect(getClientIp(makeRequest({} as Record<string, string>) as unknown as Request)).toBe("unknown");
  });

  it("returns x-real-ip when TRUSTED_PROXY_HOPS is unset", () => {
    const req = makeRequest({ "x-real-ip": "203.0.113.5", "x-forwarded-for": "1.1.1.1" });
    expect(getClientIp(req as unknown as Request)).toBe("203.0.113.5");
  });

  it("takes the Nth-from-the-right of x-forwarded-for when TRUSTED_PROXY_HOPS=1", () => {
    process.env.TRUSTED_PROXY_HOPS = "1";
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" });
    expect(getClientIp(req as unknown as Request)).toBe("1.2.3.4");
  });

  it("ignores attacker-injected leftmost xff entry when TRUSTED_PROXY_HOPS=1", () => {
    process.env.TRUSTED_PROXY_HOPS = "1";
    const req = makeRequest({ "x-forwarded-for": "9.9.9.9, 1.2.3.4" });
    expect(getClientIp(req as unknown as Request)).toBe("1.2.3.4");
  });

  it("handles multiple proxy hops correctly", () => {
    process.env.TRUSTED_PROXY_HOPS = "2";
    const req = makeRequest({ "x-forwarded-for": "9.9.9.9, 1.2.3.4, 1.2.3.4" });
    expect(getClientIp(req as unknown as Request)).toBe("1.2.3.4");
  });

  it("falls back gracefully when xff has fewer entries than hops", () => {
    process.env.TRUSTED_PROXY_HOPS = "3";
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" });
    expect(getClientIp(req as unknown as Request)).toBe("1.2.3.4");
  });
});
