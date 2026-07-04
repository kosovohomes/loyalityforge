"use client";

import {
  StampRules,
  PointsRules,
  TieredRules,
} from "@/lib/program-types";

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min={min}
        className="input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function StampFields({
  rules,
  onChange,
}: {
  rules: StampRules;
  onChange: (r: StampRules) => void;
}) {
  return (
    <>
      <NumberField
        label="Stamps required"
        value={rules.stampsRequired}
        onChange={(v) => onChange({ ...rules, stampsRequired: v })}
        min={1}
      />
      <div>
        <label className="label">Reward description</label>
        <input
          className="input"
          value={rules.rewardDescription}
          onChange={(e) =>
            onChange({ ...rules, rewardDescription: e.target.value })
          }
        />
      </div>
      <NumberField
        label="Minimum spend to earn a stamp ($)"
        value={rules.minSpend ?? 0}
        onChange={(v) => onChange({ ...rules, minSpend: v })}
      />
      <NumberField
        label="Reward expires after (days)"
        value={rules.expiresAfterDays ?? 365}
        onChange={(v) => onChange({ ...rules, expiresAfterDays: v })}
      />
    </>
  );
}

export function PointsFields({
  rules,
  onChange,
}: {
  rules: PointsRules;
  onChange: (r: PointsRules) => void;
}) {
  return (
    <>
      <NumberField
        label="Points earned per $1 spent"
        value={rules.pointsPerDollar}
        onChange={(v) => onChange({ ...rules, pointsPerDollar: v })}
        min={0.1}
      />
      <NumberField
        label="Points needed for a reward"
        value={rules.pointsForReward}
        onChange={(v) => onChange({ ...rules, pointsForReward: v })}
        min={1}
      />
      <div>
        <label className="label">Reward description</label>
        <input
          className="input"
          value={rules.rewardDescription}
          onChange={(e) =>
            onChange({ ...rules, rewardDescription: e.target.value })
          }
        />
      </div>
      <NumberField
        label="Minimum spend to earn points ($)"
        value={rules.minSpend ?? 0}
        onChange={(v) => onChange({ ...rules, minSpend: v })}
      />
      <NumberField
        label="Points expire after (days)"
        value={rules.expiresAfterDays ?? 365}
        onChange={(v) => onChange({ ...rules, expiresAfterDays: v })}
      />
    </>
  );
}

export function TieredFields({
  rules,
  onChange,
}: {
  rules: TieredRules;
  onChange: (r: TieredRules) => void;
}) {
  function updateTier(
    i: number,
    patch: Partial<TieredRules["tiers"][number]>
  ) {
    const tiers = rules.tiers.map((t, idx) =>
      idx === i ? { ...t, ...patch } : t
    );
    onChange({ ...rules, tiers });
  }

  return (
    <>
      <NumberField
        label="Points earned per $1 spent"
        value={rules.pointsPerDollar}
        onChange={(v) => onChange({ ...rules, pointsPerDollar: v })}
      />
      <div className="space-y-3">
        <label className="label">Tiers</label>
        {rules.tiers.map((t, i) => (
          <div key={i} className="rounded-lg border border-espresso/10 p-3 space-y-2">
            <input
              className="input"
              placeholder="Tier name"
              value={t.name}
              onChange={(e) => updateTier(i, { name: e.target.value })}
            />
            <input
              type="number"
              className="input"
              placeholder="Points threshold"
              value={t.threshold}
              onChange={(e) =>
                updateTier(i, { threshold: Number(e.target.value) })
              }
            />
            <input
              className="input"
              placeholder="Perks"
              value={t.perks}
              onChange={(e) => updateTier(i, { perks: e.target.value })}
            />
          </div>
        ))}
      </div>
    </>
  );
}

export function BrandingFields({
  branding,
  onChange,
}: {
  branding: { logoUrl?: string; primaryColor: string; terms?: string };
  onChange: (b: { logoUrl?: string; primaryColor: string; terms?: string }) => void;
}) {
  return (
    <>
      <div>
        <label className="label">Logo URL (optional)</label>
        <input
          className="input"
          placeholder="https://…"
          value={branding.logoUrl ?? ""}
          onChange={(e) => onChange({ ...branding, logoUrl: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Primary color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            className="h-10 w-14 cursor-pointer rounded border border-espresso/20"
            value={branding.primaryColor}
            onChange={(e) =>
              onChange({ ...branding, primaryColor: e.target.value })
            }
          />
          <input
            className="input"
            value={branding.primaryColor}
            onChange={(e) =>
              onChange({ ...branding, primaryColor: e.target.value })
            }
          />
        </div>
      </div>
      <div>
        <label className="label">Custom terms message</label>
        <textarea
          className="input min-h-24"
          placeholder="Rewards expire 12 months after issue. One reward per visit."
          value={branding.terms ?? ""}
          onChange={(e) => onChange({ ...branding, terms: e.target.value })}
        />
      </div>
    </>
  );
}
