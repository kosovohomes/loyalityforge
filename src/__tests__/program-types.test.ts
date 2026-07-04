import { TEMPLATES, parseRules, parseBranding, computeTier, TieredRules } from "@/lib/program-types";

describe("TEMPLATES", () => {
  it("has all three program types", () => {
    expect(TEMPLATES.STAMP).toBeDefined();
    expect(TEMPLATES.POINTS).toBeDefined();
    expect(TEMPLATES.TIERED).toBeDefined();
  });

  it("each template has label, description, and defaultRules", () => {
    for (const key of ["STAMP", "POINTS", "TIERED"] as const) {
      expect(typeof TEMPLATES[key].label).toBe("string");
      expect(typeof TEMPLATES[key].description).toBe("string");
      expect(TEMPLATES[key].defaultRules).toBeDefined();
    }
  });

  it("STAMP default rules have stampsRequired > 0", () => {
    const rules = TEMPLATES.STAMP.defaultRules as { stampsRequired: number };
    expect(rules.stampsRequired).toBeGreaterThan(0);
  });

  it("POINTS default rules have pointsPerDollar > 0", () => {
    const rules = TEMPLATES.POINTS.defaultRules as { pointsPerDollar: number };
    expect(rules.pointsPerDollar).toBeGreaterThan(0);
  });

  it("TIERED default rules have at least 2 tiers", () => {
    const rules = TEMPLATES.TIERED.defaultRules as { tiers: unknown[] };
    expect(rules.tiers.length).toBeGreaterThanOrEqual(2);
  });
});

describe("parseRules", () => {
  it("parses JSON string back to rules object", () => {
    const rules = TEMPLATES.STAMP.defaultRules;
    const serialized = JSON.stringify(rules);
    const parsed = parseRules(serialized);
    expect(parsed).toEqual(rules);
  });
});

describe("parseBranding", () => {
  it("parses branding JSON string", () => {
    const branding = { primaryColor: "#FF0000", terms: "Test terms", logoUrl: "https://example.com/logo.png" };
    const parsed = parseBranding(JSON.stringify(branding));
    expect(parsed).toEqual(branding);
  });

  it("handles missing optional fields", () => {
    const branding = { primaryColor: "#000000" };
    const parsed = parseBranding(JSON.stringify(branding));
    expect(parsed.logoUrl).toBeUndefined();
    expect(parsed.terms).toBeUndefined();
  });
});

describe("computeTier", () => {
  const rules: TieredRules = {
    pointsPerDollar: 1,
    tiers: [
      { name: "Bronze", threshold: 0, perks: "Birthday drink" },
      { name: "Silver", threshold: 200, perks: "10% off" },
      { name: "Gold", threshold: 500, perks: "15% off" },
    ],
  };

  it("returns first tier for balance 0", () => {
    expect(computeTier(rules, 0)).toBe("Bronze");
  });

  it("returns Silver for balance 200", () => {
    expect(computeTier(rules, 200)).toBe("Silver");
  });

  it("returns Gold for balance 500", () => {
    expect(computeTier(rules, 500)).toBe("Gold");
  });

  it("returns Gold for balance 1000", () => {
    expect(computeTier(rules, 1000)).toBe("Gold");
  });

  it("returns Bronze for negative balance", () => {
    expect(computeTier(rules, -10)).toBe("Bronze");
  });

  it("handles single tier", () => {
    const single: TieredRules = {
      pointsPerDollar: 1,
      tiers: [{ name: "Member", threshold: 0, perks: "Basic" }],
    };
    expect(computeTier(single, 500)).toBe("Member");
  });
});
