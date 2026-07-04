import { escapeHtml, sanitizeString, sanitizeUrl, sanitizeLogoUrl } from "@/lib/sanitize";

describe("escapeHtml", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
    );
  });

  it("escapes quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  it("leaves clean strings unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

describe("sanitizeString", () => {
  it("trims and escapes HTML", () => {
    expect(sanitizeString("  <b>bold</b>  ")).toBe("&lt;b&gt;bold&lt;/b&gt;");
  });

  it("returns undefined for empty string", () => {
    expect(sanitizeString("")).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(sanitizeString(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(sanitizeString(undefined)).toBeUndefined();
  });
});

describe("sanitizeUrl", () => {
  it("allows valid https URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
  });

  it("allows valid http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("blocks javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeUndefined();
  });

  it("blocks non-http protocols", () => {
    expect(sanitizeUrl("ftp://example.com")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(sanitizeUrl("")).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(sanitizeUrl(null)).toBeUndefined();
  });

  it("returns undefined for invalid URLs", () => {
    expect(sanitizeUrl("not-a-url")).toBeUndefined();
  });
});

describe("sanitizeLogoUrl", () => {
  it("validates logo URLs", () => {
    expect(sanitizeLogoUrl("https://example.com/logo.png")).toBe("https://example.com/logo.png");
  });

  it("blocks malicious logo URLs", () => {
    expect(sanitizeLogoUrl("javascript:void(0)")).toBeUndefined();
  });
});
