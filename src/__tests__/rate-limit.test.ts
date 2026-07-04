import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

describe("rateLimit", () => {
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
