export function sanitizeNavigationTarget(
  value: unknown,
  currentOrigin?: string | null
): string | null {
  if (typeof value !== 'string') return null;

  const target = value.trim();
  if (!target) return null;

  // Relative paths are allowed, but protocol-relative URLs are blocked.
  if (target.startsWith('/')) {
    if (target.startsWith('//')) return null;
    return target;
  }

  const origin =
    currentOrigin ??
    (typeof window !== 'undefined' ? window.location.origin : null);
  if (!origin) return null;

  try {
    const parsed = new URL(target, origin);
    if (parsed.origin !== origin) return null;
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
