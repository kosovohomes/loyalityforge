import { ProgramType, ProgramRules, ProgramBranding, StampRules, PointsRules, TieredRules } from "@/lib/program-types";
import { sanitizeLogoUrl } from "@/lib/sanitize";

export function ProgramPreviewCard({
  name,
  type,
  rules,
  branding,
}: {
  name: string;
  type: ProgramType;
  rules: ProgramRules;
  branding: ProgramBranding;
}) {
  const color = branding.primaryColor || "#C4922C";
  const safeLogoUrl = sanitizeLogoUrl(branding.logoUrl);

  return (
    <div
      className="w-full max-w-sm overflow-hidden rounded-2xl border border-espresso/10 shadow-lg"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
    >
      <div className="p-5 text-white">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Loyalty card</p>
          {safeLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={safeLogoUrl} alt="" className="h-7 w-7 rounded-full bg-white/20 object-cover" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {name.charAt(0).toUpperCase() || "C"}
            </div>
          )}
        </div>
        <h3 className="mt-3 font-display text-xl font-semibold">{name || "Untitled program"}</h3>

        {type === "STAMP" && <StampPreview rules={rules as StampRules} />}
        {type === "POINTS" && <PointsPreview rules={rules as PointsRules} />}
        {type === "TIERED" && <TieredPreview rules={rules as TieredRules} />}

        {branding.terms && <p className="mt-4 text-[11px] leading-snug opacity-70">{branding.terms}</p>}
      </div>
    </div>
  );
}

function StampPreview({ rules }: { rules: StampRules }) {
  const total = Math.max(1, rules.stampsRequired || 10);
  const filled = Math.min(4, total);
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
          <div
            key={i}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/70 text-xs ${
              i < filled ? "bg-white text-espresso" : "bg-white/10"
            }`}
          >
            {i < filled ? "✓" : ""}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm opacity-90">
        Collect {rules.stampsRequired} stamps → {rules.rewardDescription}
      </p>
    </div>
  );
}

function PointsPreview({ rules }: { rules: PointsRules }) {
  return (
    <div className="mt-4">
      <p className="font-display text-3xl font-bold">240 pts</p>
      <p className="mt-2 text-sm opacity-90">
        Earn {rules.pointsPerDollar} pt/$1 · {rules.pointsForReward} pts → {rules.rewardDescription}
      </p>
    </div>
  );
}

function TieredPreview({ rules }: { rules: TieredRules }) {
  const sorted = [...(rules.tiers || [])].sort((a, b) => a.threshold - b.threshold);
  return (
    <div className="mt-4">
      <div className="flex gap-1.5">
        {sorted.map((t, i) => (
          <div key={t.name} className={`flex-1 rounded-full py-1 text-center text-[11px] font-semibold ${i === 0 ? "bg-white text-espresso" : "bg-white/15"}`}>
            {t.name}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm opacity-90">
        {sorted[0]?.perks} · earn {rules.pointsPerDollar} pt/$1 toward the next tier
      </p>
    </div>
  );
}
