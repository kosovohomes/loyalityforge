import crypto from "crypto";
import bcrypt from "bcryptjs";

const KEY_PREFIX = "lf_live_";

async function generateApiKeyTest() {
  const raw = KEY_PREFIX + crypto.randomBytes(24).toString("hex");
  const hashedKey = await bcrypt.hash(raw, 10);
  const prefix = raw.slice(0, 12) + "\u2026";
  return { raw, hashedKey, prefix };
}

describe("API Key Generation", () => {
  it("generates a key with correct prefix", async () => {
    const { raw } = await generateApiKeyTest();
    expect(raw).toMatch(/^lf_live_/);
  });

  it("generates a key with correct length", async () => {
    const { raw } = await generateApiKeyTest();
    expect(raw.length).toBe(56); // "lf_live_" (8) + 48 hex chars (24 bytes)
  });

  it("generates a hashed key", async () => {
    const { raw, hashedKey } = await generateApiKeyTest();
    expect(hashedKey).toBeDefined();
    expect(hashedKey.length).toBeGreaterThan(0);
    expect(hashedKey).not.toBe(raw);
  });

  it("generates a prefix", async () => {
    const { raw, prefix } = await generateApiKeyTest();
    expect(prefix).toBe(raw.slice(0, 12) + "\u2026");
  });

  it("generates unique keys each time", async () => {
    const { raw: raw1 } = await generateApiKeyTest();
    const { raw: raw2 } = await generateApiKeyTest();
    expect(raw1).not.toBe(raw2);
  });

  it("bcrypt hash can be verified against raw key", async () => {
    const { raw, hashedKey } = await generateApiKeyTest();
    const match = await bcrypt.compare(raw, hashedKey);
    expect(match).toBe(true);
  });

  it("wrong key does not match hash", async () => {
    const { hashedKey } = await generateApiKeyTest();
    const match = await bcrypt.compare("lf_live_wrongkey123", hashedKey);
    expect(match).toBe(false);
  });
});
