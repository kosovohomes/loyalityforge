"use client";

import { useEffect, useState } from "react";

export function WidgetSnippet({ orgSlug }: { orgSlug: string }) {
  const [origin, setOrigin] = useState("https://loyaltyforge.vercel.app");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippet = `<div id="loyaltyforge-widget"
     data-org="${orgSlug}"
     data-widget-secret="lf_widget_PASTE_YOUR_SECRET_HERE"></div>
<script src="${origin}/widget.js" async></script>`;

  function copySnippet() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card mt-4">
      <p className="text-sm text-espresso/70">
        Copy this snippet and paste it into your website&apos;s HTML where you want the
        loyalty widget to appear. Replace{" "}
        <code className="rounded bg-espresso/10 px-1.5 py-0.5 text-xs">lf_widget_PASTE_YOUR_SECRET_HERE</code>{" "}
        with the widget secret you generated above.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-espresso p-4 text-xs leading-relaxed text-cream">
        <code>{snippet}</code>
      </pre>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={copySnippet} className="btn-secondary text-sm">
          {copied ? "Copied!" : "Copy snippet"}
        </button>
        <p className="text-xs text-espresso/50">
          The widget shows a &ldquo;Join loyalty&rdquo; form and a balance lookup.
        </p>
      </div>
    </div>
  );
}
