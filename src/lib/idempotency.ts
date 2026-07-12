import { prisma } from "@/lib/prisma";

/**
 * Idempotency helper for the v1 earn/redeem endpoints.
 *
 * If the request includes an `Idempotency-Key` header, we check the
 * IdempotencyKey table for a prior response with the same (organizationId, key).
 * If found, we replay the stored response verbatim. If not, we run the
 * handler, persist the response, and return it. This makes earn/redeem safe
 * to retry on network failure without double-awarding points. (Review §2.19.)
 *
 * The endpoint tag (e.g. "v1:earn") is stored so a key minted for earn
 * can't be replayed against redeem.
 *
 * Idempotency keys are optional — requests without the header skip the
 * dedup logic entirely (backward compatible).
 */
export async function withIdempotency(
  organizationId: string,
  endpoint: string,
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return handler();
  }

  // Check for an existing response.
  const existing = await prisma.idempotencyKey.findUnique({
    where: {
      organizationId_key: { organizationId, key: idempotencyKey },
    },
  });
  if (existing && existing.endpoint === endpoint) {
    // Replay the stored response.
    return new Response(existing.responseBody, {
      status: existing.responseStatus,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (existing && existing.endpoint !== endpoint) {
    // Same key used for a different endpoint — reject to prevent confusion.
    return Response.json(
      { error: "Idempotency-Key was already used for a different operation" },
      { status: 409 }
    );
  }

  // Run the handler and persist the response.
  const response = await handler();
  const responseBody = await response.clone().text();

  // Only cache successful (2xx) responses. Errors should be retryable.
  if (response.status >= 200 && response.status < 300) {
    try {
      await prisma.idempotencyKey.create({
        data: {
          organizationId,
          key: idempotencyKey,
          endpoint,
          responseBody,
          responseStatus: response.status,
        },
      });
    } catch (err) {
      // P2002 means a concurrent request already created this key — that's
      // fine, the response is still valid. Log and continue.
      console.warn("[idempotency] key already exists (concurrent request?)", err);
    }
  }

  return response;
}
