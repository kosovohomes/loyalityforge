"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rotateWidgetSecret, setAllowedOrigins } from "@/lib/actions";

/**
 * Widget configuration panel for org owners.
 *
 * Lets the owner:
 *  - Generate/rotate the widget shared secret (required for the public
 *    balance + join endpoints after the Phase 0 security hardening).
 *  - Set the CORS allowlist (comma-separated origins that may embed the
 *    widget). "*" allowed for dev.
 *
 * The secret is shown ONCE on generation — the owner must copy it into
 * the widget snippet immediately. This matches the API key UX.
 */
export function WidgetConfigManager({
  initialConfig,
}: {
  initialConfig: { allowedOrigins: string; hasSecret: boolean };
}) {
  const router = useRouter();
  const [origins, setOrigins] = useState(initialConfig.allowedOrigins);
  const [hasSecret, setHasSecret] = useState(initialConfig.hasSecret);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [originsSaving, setOriginsSaving] = useState(false);
  const [secretRotating, setSecretRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originsSaved, setOriginsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSaveOrigins(e: React.FormEvent) {
    e.preventDefault();
    setOriginsSaving(true);
    setError(null);
    setOriginsSaved(false);
    try {
      await setAllowedOrigins(origins);
      setOriginsSaved(true);
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => setOriginsSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save origins");
    } finally {
      setOriginsSaving(false);
    }
  }

  async function handleRotateSecret() {
    if (!confirm(
      "Generate a new widget secret? The old secret will stop working immediately, " +
      "and you'll need to update the widget snippet on every site that embeds it."
    )) {
      return;
    }
    setSecretRotating(true);
    setError(null);
    setNewSecret(null);
    try {
      const raw = await rotateWidgetSecret();
      setNewSecret(raw);
      setHasSecret(true);
      setCopied(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rotate secret");
    } finally {
      setSecretRotating(false);
    }
  }

  function copySecret() {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Widget Secret */}
      <div className="card">
        <h3 className="font-display text-base font-semibold text-espresso">Widget Secret</h3>
        <p className="mt-1 text-sm text-espresso/60">
          A shared secret that the embeddable widget sends in the{" "}
          <code className="rounded bg-espresso/10 px-1.5 py-0.5 text-xs">x-widget-secret</code>{" "}
          header. Required for the public balance and join endpoints. Without it, the
          widget cannot read customer balances or enroll new members.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${hasSecret ? "bg-pine" : "bg-clay"}`} />
          <span className="text-sm text-espresso/70">
            {hasSecret ? "Secret configured" : "No secret configured — widget endpoints will 401"}
          </span>
        </div>

        {newSecret && (
          <div className="mt-4 rounded-lg border border-gold/40 bg-gold/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-espresso/50">
              New widget secret — copy it now, you won&apos;t see it again
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-espresso/5 px-3 py-2 font-mono text-xs text-espresso">
                {newSecret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="btn-secondary text-xs"
                aria-label="Copy secret to clipboard"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleRotateSecret}
          disabled={secretRotating || pending}
          className="btn-gold mt-4 text-sm"
        >
          {secretRotating ? "Rotating…" : hasSecret ? "Rotate secret" : "Generate secret"}
        </button>
      </div>

      {/* Allowed Origins */}
      <div className="card">
        <h3 className="font-display text-base font-semibold text-espresso">Allowed Origins (CORS)</h3>
        <p className="mt-1 text-sm text-espresso/60">
          Comma-separated list of website origins allowed to embed your widget and call
          your public endpoints. Include the scheme (https://) and no trailing slash.
          Use <code className="rounded bg-espresso/10 px-1.5 py-0.5 text-xs">*</code> for
          dev only.
        </p>
        <form onSubmit={handleSaveOrigins} className="mt-4 space-y-3">
          <div>
            <label htmlFor="allowed-origins" className="label">Allowed origins</label>
            <input
              id="allowed-origins"
              type="text"
              className="input mt-1 font-mono text-sm"
              value={origins}
              onChange={(e) => setOrigins(e.target.value)}
              placeholder="https://sunrisecoffee.com, https://www.sunrisecoffee.com"
            />
            <p className="mt-1 text-xs text-espresso/40">
              Example: <code>https://mycafe.com</code> or <code>https://mycafe.com, https://order.mycafe.com</code>
            </p>
          </div>

          {error && <p role="alert" className="text-sm text-clay">{error}</p>}
          {originsSaved && <p role="status" className="text-sm text-pine-dark">Saved.</p>}

          <button
            type="submit"
            disabled={originsSaving || pending}
            className="btn-primary text-sm"
          >
            {originsSaving ? "Saving…" : "Save origins"}
          </button>
        </form>
      </div>
    </div>
  );
}
