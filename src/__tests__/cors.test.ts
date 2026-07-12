import { CORS_HEADERS } from "@/lib/cors";

describe("CORS_HEADERS (legacy static export, used only for the PII-free programs-list endpoint)", () => {
  it("allows all origins (backward-compat wildcard)", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("allows GET, POST, OPTIONS methods", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toBe("GET, POST, OPTIONS");
  });

  it("allows Content-Type and x-widget-secret headers", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Headers"]).toContain("Content-Type");
    expect(CORS_HEADERS["Access-Control-Allow-Headers"]).toContain("x-widget-secret");
  });

  it("has all required CORS header keys", () => {
    expect(Object.keys(CORS_HEADERS)).toHaveLength(3);
  });
});
