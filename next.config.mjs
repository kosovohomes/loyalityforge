import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Content-Security-Policy.
 *
 * Allows: self, inline styles (Tailwind generates <style> tags), inline
 * scripts (Next.js needs them for hydration), and the embeddable widget
 * when loaded from the app's own origin. 'unsafe-eval' is NOT included.
 * The widget (public/widget.js) is served from the same origin so no
 * extra script-src entry is needed. (Review §3 — missing CSP.)
 *
 * connect-src 'self' covers same-origin API calls. The widget also makes
 * fetch calls to the app's own /api/public/* endpoints, which are same-
 * origin when the widget is served from the app; when embedded on a
 * third-party site, those calls are cross-origin and need the cafe's
 * domain in connect-src — handled by the per-org CORS allowlist instead.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: CSP },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
    {
      source: "/api/(.*)",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);
