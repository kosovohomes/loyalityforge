import { CORS_HEADERS } from "@/lib/cors";

describe("CORS_HEADERS", () => {
  it("allows all origins", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("allows GET, POST, OPTIONS methods", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toBe("GET, POST, OPTIONS");
  });

  it("allows Content-Type header", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Headers"]).toBe("Content-Type");
  });

  it("has all required CORS header keys", () => {
    expect(Object.keys(CORS_HEADERS)).toHaveLength(3);
  });
});
