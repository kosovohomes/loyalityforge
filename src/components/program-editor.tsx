"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProgramType,
  ProgramRules,
  ProgramBranding,
  StampRules,
  PointsRules,
  TieredRules,
} from "@/lib/program-types";
import { updateProgram, setProgramStatus } from "@/lib/actions";
import { ProgramPreviewCard } from "@/components/program-preview-card";
import {
  StampFields,
  PointsFields,
  TieredFields,
  BrandingFields,
} from "@/components/program-form-fields";

export function ProgramEditor({
  programId,
  initialName,
  type,
  initialRules,
  initialBranding,
  status,
}: {
  programId: string;
  initialName: string;
  type: ProgramType;
  initialRules: ProgramRules;
  initialBranding: ProgramBranding;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [rules, setRules] = useState<ProgramRules>(initialRules);
  const [branding, setBranding] = useState<ProgramBranding>(initialBranding);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateProgram(programId, { name, rules, branding });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(s: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    setError(null);
    try {
      await setProgramStatus(programId, s);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change status");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {status !== "PUBLISHED" && (
          <button className="btn-gold text-sm" onClick={() => changeStatus("PUBLISHED")}>Publish</button>
        )}
        {status === "PUBLISHED" && (
          <button className="btn-secondary text-sm" onClick={() => changeStatus("DRAFT")}>Unpublish to draft</button>
        )}
        {status !== "ARCHIVED" && (
          <button className="btn-secondary text-sm" onClick={() => changeStatus("ARCHIVED")}>Archive</button>
        )}
        {status === "ARCHIVED" && (
          <button className="btn-secondary text-sm" onClick={() => changeStatus("DRAFT")}>Restore to draft</button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card space-y-4">
          <div>
            <label className="label">Program name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {type === "STAMP" && <StampFields rules={rules as StampRules} onChange={setRules} />}
          {type === "POINTS" && <PointsFields rules={rules as PointsRules} onChange={setRules} />}
          {type === "TIERED" && <TieredFields rules={rules as TieredRules} onChange={setRules} />}

          <hr className="border-espresso/10" />

          <BrandingFields branding={branding} onChange={setBranding} />

          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && <span className="text-sm text-pine-dark">Saved ✓</span>}
        {error && <p role="alert" className="text-sm text-clay">{error}</p>}
          </div>
        </div>

        <div className="flex items-start justify-center pt-4">
          <ProgramPreviewCard name={name} type={type} rules={rules} branding={branding} />
        </div>
      </div>
    </div>
  );
}
