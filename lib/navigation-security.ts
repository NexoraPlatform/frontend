const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;
const BACKSLASH_PATTERN = /\\/;

const decodeForValidation = (value: string) => {
  let decoded = value;
  // Decode at most 2 times to catch common double-encoding tricks.
  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
};

const hasUnsafeRedirectTokens = (value: string) => {
  if (value.startsWith('//')) return true;
  if (BACKSLASH_PATTERN.test(value)) return true;

  const decoded = decodeForValidation(value);
  if (decoded.startsWith('//')) return true;
  if (BACKSLASH_PATTERN.test(decoded)) return true;

  return false;
};

export function sanitizeNavigationTarget(
  value: unknown,
  currentOrigin?: string | null
): string | null {
  if (typeof value !== 'string') return null;

  const target = value.trim();
  if (!target) return null;
  if (CONTROL_CHAR_PATTERN.test(target)) return null;
  if (hasUnsafeRedirectTokens(target)) return null;

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

const normalizeAllowedHost = (value: string) =>
  value.trim().toLowerCase().replace(/^\.+/, '');

export function sanitizeExternalRedirectUrl(
  value: unknown,
  allowedHosts: string[]
): string | null {
  if (typeof value !== 'string') return null;

  const target = value.trim();
  if (!target) return null;
  if (CONTROL_CHAR_PATTERN.test(target)) return null;
  if (hasUnsafeRedirectTokens(target)) return null;

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;

  const hostname = parsed.hostname.toLowerCase();
  const safeHosts = allowedHosts
    .map(normalizeAllowedHost)
    .filter((entry) => entry.length > 0);

  if (safeHosts.length === 0) return null;

  const isAllowed = safeHosts.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );
  if (!isAllowed) return null;

  return parsed.toString();
}
