"use client";

import { useEffect, useState } from "react";

export function WidgetSnippet({ orgSlug }: { orgSlug: string }) {
  const [origin, setOrigin] = useState("https://loyaltyforge.vercel.app");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippet = `<div id="loyaltyforge-widget" data-org="${orgSlug}"></div>
<script src="${origin}/widget.js" async></script>`;

  return (
    <div className="card mt-4">
      <pre className="overflow-x-auto rounded-lg bg-espresso p-4 text-xs leading-relaxed text-cream">
        <code>{snippet}</code>
      </pre>
      <p className="mt-3 text-xs text-espresso/50">
        Drop this into your site&apos;s HTML. It renders a &ldquo;Join loyalty&rdquo; form and a
        balance lookup — no other setup required.
      </p>
    </div>
  );
}
