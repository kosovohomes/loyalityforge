const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

export function sanitizeString(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  return escapeHtml(input.trim());
}

export function sanitizeUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("javascript:")) return undefined;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.href;
  } catch {
    return undefined;
  }
}

export function sanitizeLogoUrl(url: string | undefined | null): string | undefined {
  return sanitizeUrl(url);
}
