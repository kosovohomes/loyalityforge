/**
 * @jest-environment node
 *
 * Tests for the idempotency helper.
 *
 * The helper depends on Prisma, so these tests mock the prisma client
 * via jest.mock. We verify the three key behaviors:
 *  1. No Idempotency-Key header → handler runs, no DB write.
 *  2. New key → handler runs, response is persisted.
 *  3. Repeat key → handler does NOT run, stored response is replayed.
 *  4. Same key on a different endpoint → 409 (cross-endpoint replay block).
 *
 * Uses the node environment (not jsdom) so that global Request/Response
 * are available (jsdom doesn't polyfill fetch).
 */

jest.mock("@/lib/prisma", () => ({
  prisma: {
    idempotencyKey: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { withIdempotency } from "@/lib/idempotency";

const mockFindUnique = prisma.idempotencyKey.findUnique as jest.MockedFunction<typeof prisma.idempotencyKey.findUnique>;
const mockCreate = prisma.idempotencyKey.create as jest.MockedFunction<typeof prisma.idempotencyKey.create>;

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/v1/programs/123/earn", {
    method: "POST",
    headers,
  });
}

describe("withIdempotency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs the handler when no Idempotency-Key header is present", async () => {
    const handler = jest.fn(async () => Response.json({ ok: true }));
    const request = makeRequest({});

    const response = await withIdempotency("org-1", "v1:earn", request, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("replays the stored response when the same key is seen again", async () => {
    const storedBody = JSON.stringify({ customerId: "c1", earned: 5, balance: 10 });
    mockFindUnique.mockResolvedValueOnce({
      id: "idem-1",
      organizationId: "org-1",
      key: "key-abc",
      endpoint: "v1:earn",
      responseBody: storedBody,
      responseStatus: 200,
      createdAt: new Date(),
    });

    const handler = jest.fn(async () => Response.json({ shouldNotBeCalled: true }));
    const request = makeRequest({ "idempotency-key": "key-abc" });

    const response = await withIdempotency("org-1", "v1:earn", request, handler);

    expect(handler).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ customerId: "c1", earned: 5, balance: 10 });
  });

  it("persists a new successful response and returns it", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({} as never);

    const handler = jest.fn(async () => Response.json({ earned: 5 }));
    const request = makeRequest({ "idempotency-key": "key-new" });

    const response = await withIdempotency("org-1", "v1:earn", request, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        organizationId: "org-1",
        key: "key-new",
        endpoint: "v1:earn",
        responseBody: JSON.stringify({ earned: 5 }),
        responseStatus: 200,
      },
    });
    expect(response.status).toBe(200);
  });

  it("does not persist error responses (so they can be retried)", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const handler = jest.fn(async () => Response.json({ error: "Insufficient balance" }, { status: 400 }));
    const request = makeRequest({ "idempotency-key": "key-err" });

    const response = await withIdempotency("org-1", "v1:redeem", request, handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
  });

  it("rejects a key that was used for a different endpoint with 409", async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: "idem-1",
      organizationId: "org-1",
      key: "key-shared",
      endpoint: "v1:earn",
      responseBody: "{}",
      responseStatus: 200,
      createdAt: new Date(),
    });

    const handler = jest.fn(async () => Response.json({ ok: true }));
    const request = makeRequest({ "idempotency-key": "key-shared" });

    // Same key, but endpoint is now v1:redeem (not v1:earn).
    const response = await withIdempotency("org-1", "v1:redeem", request, handler);

    expect(handler).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(response.status).toBe(409);
  });
});
