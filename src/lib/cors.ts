import bcrypt from "bcryptjs";

const DEFAULT_METHODS = "GET, POST, OPTIONS";
const DEFAULT_HEADERS = "Content-Type, x-widget-secret";

function originAllowed(configured: string | null | undefined, requestOrigin: string | null): boolean {
  if (!configured) return false;
  if (configured.trim() === "*") return true;
  const list = configured.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return false;
  if (!requestOrigin) return false;
  return list.includes(requestOrigin);
}

export function corsHeadersForOrg(org: { allowedOrigins: string | null }, request: Request) {
  const requestOrigin = request.headers.get("origin");
  if (!originAllowed(org.allowedOrigins, requestOrigin)) return null;
  return {
    "Access-Control-Allow-Origin": requestOrigin ?? "*",
    "Access-Control-Allow-Methods": DEFAULT_METHODS,
    "Access-Control-Allow-Headers": DEFAULT_HEADERS,
    "Vary": "Origin",
  };
}

export function corsForbidden(message = "Origin not allowed") {
  return Response.json({ error: message }, { status: 403 });
}

export function corsOptionsForOrg(org: { allowedOrigins: string | null }, request: Request) {
  const headers = corsHeadersForOrg(org, request);
  if (!headers) return corsForbidden();
  return new Response(null, { status: 204, headers });
}

export async function verifyWidgetSecret(org: { widgetSecretHash: string | null; allowedOrigins: string | null }, request: Request): Promise<boolean> {
  const provided = request.headers.get("x-widget-secret");
  if (!provided) return false;
  if (!org.widgetSecretHash) return false;
  try {
    return await bcrypt.compare(provided, org.widgetSecretHash);
  } catch {
    return false;
  }
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": DEFAULT_METHODS,
  "Access-Control-Allow-Headers": DEFAULT_HEADERS,
};

export function corsJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: CORS_HEADERS });
}

export function corsOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
