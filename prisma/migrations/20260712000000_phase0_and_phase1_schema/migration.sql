-- Phase 0 + Phase 1 schema changes, applied as a single migration.
--
-- Combines: balance CHECK constraints, org widget secret + allowed origins,
-- API key HMAC lookup hash, and the IdempotencyKey table.

-- LoyaltyCard.balance must never go negative.
ALTER TABLE "LoyaltyCard" ADD CONSTRAINT "loyalty_card_balance_nonnegative"
  CHECK ("balance" >= 0);

-- Reward.stock, when present, must never go negative.
ALTER TABLE "Reward" ADD CONSTRAINT "reward_stock_nonnegative"
  CHECK ("stock" IS NULL OR "stock" >= 0);

-- Organization widget configuration.
ALTER TABLE "Organization" ADD COLUMN "widgetSecretHash" TEXT;
ALTER TABLE "Organization" ADD COLUMN "allowedOrigins"   TEXT;

-- API key fast lookup hash.
ALTER TABLE "ApiKey" ADD COLUMN "keyLookupHash" TEXT;
CREATE UNIQUE INDEX "ApiKey_keyLookupHash_key" ON "ApiKey"("keyLookupHash");

-- Idempotency table for v1 earn/redeem.
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "responseBody" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IdempotencyKey_organizationId_key_key" ON "IdempotencyKey"("organizationId", "key");
CREATE INDEX "IdempotencyKey_organizationId_endpoint_idx" ON "IdempotencyKey"("organizationId", "endpoint");
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
