import { prisma } from "@/lib/prisma";
import { getCurrentOrgContext } from "@/lib/auth";
import { ApiKeyManager } from "@/components/api-key-manager";
import { WidgetSnippet } from "@/components/widget-snippet";
import { WidgetConfigManager } from "@/components/widget-config-manager";

export default async function ApiKeysPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const [keys, org] = await Promise.all([
    prisma.apiKey.findMany({
      where: { organizationId: ctx.orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { allowedOrigins: true, widgetSecretHash: true },
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-espresso">API &amp; Widget</h1>
      <p className="mt-1 text-sm text-espresso/60">
        Connect LoyaltyForge to your POS, website, or app.
      </p>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-espresso">API keys</h2>
        <p className="mt-1 text-sm text-espresso/60">
          Use a key in the <code className="rounded bg-espresso/10 px-1.5 py-0.5 text-xs">Authorization: Bearer</code>{" "}
          header of every request.
        </p>
        <div className="mt-4">
          <ApiKeyManager
            keys={keys.map((k) => ({
              id: k.id,
              name: k.name,
              prefix: k.prefix,
              createdAt: k.createdAt.toISOString(),
              lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
              revoked: k.revoked,
            }))}
          />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-espresso">Widget configuration</h2>
        <p className="mt-1 text-sm text-espresso/60">
          Configure the shared secret and allowed origins for your embeddable widget.
        </p>
        <div className="mt-4">
          <WidgetConfigManager
            initialConfig={{
              allowedOrigins: org?.allowedOrigins ?? "",
              hasSecret: !!org?.widgetSecretHash,
            }}
          />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-espresso">Embeddable widget</h2>
        <p className="mt-1 text-sm text-espresso/60">
          One script tag and one div adds a join form and balance display to any page.
        </p>
        <WidgetSnippet orgSlug={ctx.orgSlug} />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-espresso">Public API v1 reference</h2>
        <div className="mt-4 space-y-3 text-sm">
          <Endpoint method="POST" path="/api/v1/programs/:id/customers" desc="Enroll a customer in a program." />
          <Endpoint method="POST" path="/api/v1/programs/:id/earn" desc="Record an earn event (stamp or points)." />
          <Endpoint method="POST" path="/api/v1/programs/:id/redeem" desc="Redeem a reward, deducting balance." />
          <Endpoint method="GET" path="/api/v1/programs/:id/balance?externalId=…" desc="Check a customer's current balance." />
        </div>
      </div>
    </div>
  );
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div className="card flex flex-wrap items-center gap-3">
      <span className="rounded-full bg-espresso px-2.5 py-1 text-xs font-bold text-cream">{method}</span>
      <code className="text-xs text-espresso/80">{path}</code>
      <span className="text-espresso/50">·</span>
      <span className="text-espresso/60">{desc}</span>
    </div>
  );
}
